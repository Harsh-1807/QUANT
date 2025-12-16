import asyncio
import logging
import json
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.concurrency import run_in_threadpool
from fastapi import UploadFile, File, HTTPException
import pandas as pd
from io import StringIO

import csv
from datetime import datetime
from typing import Set

from models import Tick
from database import TickDatabase
from analytics import Analytics
from websocket_client import BinanceTickClient

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Quant Analyzer", version="1.0")

# CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global state
db = TickDatabase("ticks.db")
analytics = Analytics()
binance_client = None
connected_clients: Set[WebSocket] = set()
clients_lock = asyncio.Lock()

@app.on_event("startup")
async def startup():
    """Start Binance client and data ingestion."""
    global binance_client
    
    logger.info("🚀 Starting Quant Analyzer...")
    
    binance_client = BinanceTickClient(
        symbols=["btcusdt", "ethusdt", "bnbusdt"],
        on_tick_callback=on_tick
    )
    
    asyncio.create_task(binance_client.start())
    logger.info("✅ Binance WebSocket client started")

async def on_tick(tick: Tick):
    """Called when a new tick arrives from Binance."""
    # Store in database (non-blocking)
    try:
        await run_in_threadpool(db.insert_tick, tick)
    except Exception as e:
        logger.error(f"Database insert error: {e}")
    
    # Broadcast to all connected WebSocket clients
    message = {
        "type": "tick",
        "data": {
            "symbol": tick.symbol.lower(),
            "timestamp": tick.timestamp.isoformat(),
            "price": tick.price,
            "size": tick.size,
        }
    }
    
    disconnected = set()
    
    async with clients_lock:
        for client in connected_clients.copy():
            try:
                await client.send_json(message)
            except Exception as e:
                logger.warning(f"Failed to send to client: {e}")
                disconnected.add(client)
        
        # Remove disconnected clients
        for client in disconnected:
            connected_clients.discard(client)

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time tick streaming."""
    try:
        await websocket.accept()
        async with clients_lock:
            connected_clients.add(websocket)
        logger.info(f"✅ WebSocket connected. Total clients: {len(connected_clients)}")
        
        # Keep connection alive
        while True:
            try:
                # Wait for any message (client keep-alive)
                data = await asyncio.wait_for(websocket.receive_text(), timeout=30.0)
            except asyncio.TimeoutError:
                # Send ping to keep connection alive
                try:
                    await websocket.send_json({"type": "ping"})
                except:
                    break
            except:
                break
                
    except WebSocketDisconnect:
        async with clients_lock:
            connected_clients.discard(websocket)
        logger.info(f"❌ WebSocket disconnected. Remaining clients: {len(connected_clients)}")
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        async with clients_lock:
            connected_clients.discard(websocket)

@app.get("/api/ticks/{symbol}")
def get_ticks(symbol: str, limit: int = 100):
    """Fetch recent ticks for a symbol."""
    try:
        ticks = db.get_ticks(symbol.lower(), limit)
        
        if not ticks:
            return []
        
        return [
            {
                "symbol": t.symbol,
                "timestamp": t.timestamp.isoformat(),
                "price": t.price,
                "size": t.size,
            }
            for t in ticks
        ]
    except Exception as e:
        logger.error(f"Error fetching ticks: {e}")
        return []

@app.get("/api/analytics/{symbol}")
def get_analytics(symbol: str):
    """Compute and return analytics for a symbol."""
    try:
        ticks = db.get_ticks(symbol.lower(), limit=500)
        
        if not ticks:
            return {"symbol": symbol, "error": "No ticks found"}
        
        return {
            "symbol": symbol,
            "zscore": analytics.compute_zscore(ticks, window=20),
            "spread": analytics.compute_spread(ticks, window=20),
            "adf_pvalue": analytics.compute_adf_test(ticks),
        }
    except Exception as e:
        logger.error(f"Error computing analytics: {e}")
        return {"symbol": symbol, "error": str(e)}

@app.get("/api/correlation/{symbol1}/{symbol2}")
def get_correlation(symbol1: str, symbol2: str):
    """Correlation and hedge ratio between two symbols."""
    try:
        ticks1 = db.get_ticks(symbol1.lower(), limit=500)
        ticks2 = db.get_ticks(symbol2.lower(), limit=500)
        
        if not ticks1 or not ticks2:
            return {"symbol1": symbol1, "symbol2": symbol2, "error": "Insufficient data"}
        
        corr = analytics.compute_correlation(ticks1, ticks2, window=50)
        hedge = analytics.compute_hedge_ratio(ticks1, ticks2, window=100)
        
        return {
            "symbol1": symbol1,
            "symbol2": symbol2,
            "correlation": corr,
            "hedge_ratio": hedge,
        }
    except Exception as e:
        logger.error(f"Error computing correlation: {e}")
        return {"symbol1": symbol1, "symbol2": symbol2, "error": str(e)}

@app.get("/api/export/{symbol}")
def export_csv(symbol: str):
    """Export ticks as CSV file."""
    try:
        ticks = db.get_ticks(symbol.lower(), limit=10000)
        
        if not ticks:
            return {"error": "No data to export"}
        
        filename = f"ticks_{symbol}_{datetime.now().isoformat().replace(':', '-')}.csv"
        
        with open(filename, 'w', newline='') as f:
            writer = csv.writer(f)
            writer.writerow(["symbol", "timestamp", "price", "size"])
            for tick in ticks:
                writer.writerow([
                    tick.symbol,
                    tick.timestamp.isoformat(),
                    tick.price,
                    tick.size
                ])
        
        return FileResponse(filename, filename=filename)
    except Exception as e:
        logger.error(f"Error exporting: {e}")
        return {"error": str(e)}

@app.get("/api/health")
def health():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "ws_clients": len(connected_clients),
        "timestamp": datetime.now().isoformat()
    }



class ConnectionManager:
    def __init__(self):
        self.clients: set[WebSocket] = set()
        self.lock = asyncio.Lock()

    async def connect(self, ws: WebSocket):
        await ws.accept()
        async with self.lock:
            self.clients.add(ws)

    async def disconnect(self, ws: WebSocket):
        async with self.lock:
            self.clients.discard(ws)

    async def broadcast(self, message: dict):
        async with self.lock:
            for ws in list(self.clients):
                try:
                    await ws.send_json(message)
                except Exception as e:
                    logger.warning(f"Drop client: {e}")
                    self.clients.discard(ws)

manager = ConnectionManager()
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    logger.info(f"Client connected; total={len(manager.clients)}")
    try:
        while True:
            try:
                await asyncio.wait_for(websocket.receive_text(), timeout=30.0)
            except asyncio.TimeoutError:
                await websocket.send_json({"type": "ping"})
    except WebSocketDisconnect:
        await manager.disconnect(websocket)
        logger.info(f"Client disconnected; total={len(manager.clients)}")


@app.post("/api/upload_ohlc")
async def upload_ohlc(symbol: str, file: UploadFile = File(...)):
    """
    Upload OHLC CSV (time, open, high, low, close, volume).
    Used to backfill analytics but app must also run without any upload.
    """
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files supported")

    try:
        content = (await file.read()).decode("utf-8")
        df = pd.read_csv(StringIO(content))
        required = {"time", "open", "high", "low", "close", "volume"}
        if not required.issubset(df.columns):
            raise HTTPException(status_code=400,
                                detail=f"CSV must contain columns: {', '.join(required)}")

        inserted = 0
        for _, row in df.iterrows():
            tick = Tick(
                symbol=symbol.lower(),
                timestamp=datetime.fromisoformat(str(row["time"])),
                price=float(row["close"]),
                size=float(row.get("volume", 0.0)),
            )
            db.insert_tick(tick)
            inserted += 1

        return {"status": "ok", "inserted": inserted}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Upload OHLC failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to parse/upload OHLC")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")