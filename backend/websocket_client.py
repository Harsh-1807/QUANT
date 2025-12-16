import asyncio
import json
import logging
from datetime import datetime
from models import Tick

logger = logging.getLogger(__name__)

class BinanceTickClient:
    """Async WebSocket client for Binance futures trade stream with keepalive."""
    
    def __init__(self, symbols: list[str], on_tick_callback):
        """
        Args:
            symbols: List of symbols (e.g., ['btcusdt', 'ethusdt'])
            on_tick_callback: Async function called with each Tick
        """
        self.symbols = [s.lower() for s in symbols]
        self.on_tick_callback = on_tick_callback
        self.websockets = {}
        self.running = True
    
    async def start(self):
        """Start WebSocket connections for all symbols."""
        tasks = [self._connect_symbol(sym) for sym in self.symbols]
        await asyncio.gather(*tasks, return_exceptions=True)
    
    async def _connect_symbol(self, symbol: str):
        """Connect to a single symbol stream with reconnection logic."""
        url = f"wss://fstream.binance.com/ws/{symbol}@aggTrade"
        max_retries = 5
        retry_count = 0
        
        while self.running and retry_count < max_retries:
            try:
                import websockets
                
                async with websockets.connect(
                    url,
                    ping_interval=20,  # Send ping every 20 seconds
                    ping_timeout=10,   # Wait 10 seconds for pong
                    close_timeout=10
                ) as ws:
                    self.websockets[symbol] = ws
                    logger.info(f"✅ Connected to {symbol}")
                    retry_count = 0  # Reset retry count on successful connection
                    
                    async for message in ws:
                        if not self.running:
                            break
                        
                        try:
                            data = json.loads(message)
                            
                            # Handle both aggTrade and trade formats
                            if data.get('e') in ('aggTrade', 'trade'):
                                tick = self._normalize_tick(data)
                                await self.on_tick_callback(tick)
                        
                        except json.JSONDecodeError:
                            logger.warning(f"Invalid JSON from {symbol}")
                        except Exception as e:
                            logger.error(f"Error processing tick from {symbol}: {e}")
            
            except asyncio.CancelledError:
                logger.info(f"Connection cancelled for {symbol}")
                break
            
            except Exception as e:
                retry_count += 1
                wait_time = min(2 ** retry_count, 30)  # Exponential backoff, max 30s
                logger.error(f"WebSocket error for {symbol}: {e}")
                logger.info(f"Retrying in {wait_time}s (attempt {retry_count}/{max_retries})...")
                await asyncio.sleep(wait_time)
        
        if retry_count >= max_retries:
            logger.error(f"❌ Max retries reached for {symbol}. Giving up.")
        
        self.websockets.pop(symbol, None)
    
    @staticmethod
    def _normalize_tick(data: dict) -> Tick:
        """Convert Binance trade message to Tick."""
        try:
            # Handle both aggTrade and trade message formats
            if data.get('e') == 'aggTrade':
                # Aggregated trade format
                timestamp = datetime.fromtimestamp(data['T'] / 1000)
                price = float(data['p'])
                qty = float(data['q'])
            else:
                # Regular trade format
                timestamp = datetime.fromtimestamp(data['E'] / 1000)
                price = float(data['p'])
                qty = float(data['q'])
            
            return Tick(
                symbol=data['s'].lower(),
                timestamp=timestamp,
                price=price,
                size=qty
            )
        except (KeyError, ValueError, TypeError) as e:
            logger.error(f"Error normalizing tick: {e}, data: {data}")
            raise
    
    async def stop(self):
        """Close all WebSocket connections gracefully."""
        self.running = False
        for symbol, ws in self.websockets.items():
            try:
                await ws.close()
                logger.info(f"Closed connection for {symbol}")
            except Exception as e:
                logger.error(f"Error closing {symbol}: {e}")
        self.websockets.clear()




