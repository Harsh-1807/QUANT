from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class Tick(BaseModel):
    """Represents a single trade tick from Binance."""
    symbol: str
    timestamp: datetime
    price: float
    size: float
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

class OHLCV(BaseModel):
    """Represents an OHLCV candle."""
    symbol: str
    timestamp: datetime
    open: float
    high: float
    low: float
    close: float
    volume: float

class AnalyticsResult(BaseModel):
    """Analytics computation result."""
    symbol: str
    zscore: Optional[float] = None
    spread: Optional[float] = None
    adf_pvalue: Optional[float] = None
    mean: Optional[float] = None
    std: Optional[float] = None
    high: Optional[float] = None
    low: Optional[float] = None

class CorrelationResult(BaseModel):
    """Correlation and hedge ratio result."""
    symbol1: str
    symbol2: str
    correlation: Optional[float] = None
    hedge_ratio: Optional[float] = None

class HealthCheck(BaseModel):
    """Health check response."""
    status: str
    ws_clients: int
    timestamp: str