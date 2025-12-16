import numpy as np
import pandas as pd
from scipy.stats import linregress
from statsmodels.tsa.stattools import adfuller
from typing import Optional
from models import Tick, OHLCV

class Analytics:
    """Compute trading analytics. All functions are pure (no side effects)."""
    
    @staticmethod
    def compute_ohlcv(ticks: list[Tick], window_seconds: int) -> list[OHLCV]:
        """
        Resample ticks into OHLCV bars.
        
        Args:
            ticks: List of ticks in chronological order
            window_seconds: Resample interval (60 for 1m, 300 for 5m)
        
        Returns:
            List of OHLCV candles
        """
        if not ticks:
            return []
        
        df = pd.DataFrame([
            {
                'symbol': t.symbol,
                'timestamp': t.timestamp,
                'price': t.price,
                'size': t.size
            }
            for t in ticks
        ])
        
        # Resample by window
        df['bin'] = df['timestamp'].dt.floor(f'{window_seconds}S')
        grouped = df.groupby('bin')
        
        ohlcv_list = []
        for bin_ts, group in grouped:
            ohlcv_list.append(OHLCV(
                symbol=group['symbol'].iloc[0],
                timestamp=bin_ts,
                open=group['price'].iloc[0],
                high=group['price'].max(),
                low=group['price'].min(),
                close=group['price'].iloc[-1],
                volume=group['size'].sum()
            ))
        
        return ohlcv_list
    
    @staticmethod
    def compute_zscore(ticks: list[Tick], window: int = 20) -> Optional[float]:
        """
        Z-score of latest price: (price - mean) / std
        
        Indicates deviation from rolling mean. Z > 2 suggests mean-reversion opportunity.
        """
        if len(ticks) < window:
            return None
        
        prices = np.array([t.price for t in ticks[-window:]])
        latest = prices[-1]
        mean = prices.mean()
        std = prices.std()
        
        if std < 1e-8:  # Avoid division by near-zero
            return 0.0
        
        return float((latest - mean) / std)
    
    @staticmethod
    def compute_spread(ticks: list[Tick], window: int = 20) -> Optional[float]:
        """
        Spread as (high - low) / mid over rolling window.
        
        Indicator of liquidity/volatility. Low spread = tight market.
        """
        if len(ticks) < window:
            return None
        
        prices = np.array([t.price for t in ticks[-window:]])
        high = prices.max()
        low = prices.min()
        mid = (high + low) / 2
        
        if mid < 1e-8:
            return 0.0
        
        return float((high - low) / mid)
    
    @staticmethod
    def compute_adf_test(ticks: list[Tick], min_obs: int = 30) -> Optional[float]:
        """
        Augmented Dickey-Fuller test p-value.
        
        p < 0.05 suggests the series is stationary (mean-reverting).
        Useful for pairs trading: if spread is stationary, can short/long the pair.
        """
        if len(ticks) < min_obs:
            return None
        
        prices = np.array([t.price for t in ticks])
        try:
            result = adfuller(prices, autolag='AIC')
            return float(result[1])  # p-value
        except Exception as e:
            # ADF can fail on edge cases (constant series, too short, etc.)
            print(f"ADF test failed: {e}")
            return None
    
    @staticmethod
    def compute_correlation(ticks1: list[Tick], ticks2: list[Tick], window: int = 50) -> Optional[float]:
        """
        Pearson correlation between two tick series (aligned by timestamp).
        
        Close to 1 = move together, close to -1 = move opposite.
        Used for pairs trading, hedge ratio calculation.
        """
        if len(ticks1) < window or len(ticks2) < window:
            return None
        
        # Align by timestamp (simple approach: use last N ticks from each)
        prices1 = np.array([t.price for t in ticks1[-window:]])
        prices2 = np.array([t.price for t in ticks2[-window:]])
        
        if prices1.std() < 1e-8 or prices2.std() < 1e-8:
            return None
        
        return float(np.corrcoef(prices1, prices2)[0, 1])
    
    @staticmethod
    def compute_hedge_ratio(ticks1: list[Tick], ticks2: list[Tick], window: int = 100) -> Optional[float]:
        """
        OLS regression: ticks2 = alpha + beta * ticks1 + error.
        
        Beta is the hedge ratio. If beta = 0.5, you'd short 2 units of ticks1 for every 1 unit of ticks2.
        This is core to pairs trading and statistical arbitrage.
        """
        if len(ticks1) < window or len(ticks2) < window:
            return None
        
        prices1 = np.array([t.price for t in ticks1[-window:]])
        prices2 = np.array([t.price for t in ticks2[-window:]])
        
        if prices1.std() < 1e-8:
            return None
        
        try:
            slope, intercept, r_value, p_value, std_err = linregress(prices1, prices2)
            return float(slope)
        except Exception as e:
            print(f"Hedge ratio computation failed: {e}")
            return None