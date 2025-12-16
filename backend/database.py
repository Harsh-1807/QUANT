import sqlite3
import logging
from datetime import datetime
from models import Tick
from threading import Lock

logger = logging.getLogger(__name__)

class TickDatabase:
    """SQLite database for storing and querying ticks."""
    
    def __init__(self, db_path: str = "ticks.db"):
        self.db_path = db_path
        self.lock = Lock()
        self._init_db()
    
    def _init_db(self):
        """Create tables if they don't exist."""
        try:
            with sqlite3.connect(self.db_path, timeout=10) as conn:
                conn.execute("""
                CREATE TABLE IF NOT EXISTS ticks (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    symbol TEXT NOT NULL,
                    timestamp TEXT NOT NULL,
                    price REAL NOT NULL,
                    size REAL NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
                """)
                
                # Create indexes for fast queries
                conn.execute("""
                CREATE INDEX IF NOT EXISTS idx_symbol_ts 
                ON ticks(symbol, timestamp DESC)
                """)
                
                conn.execute("""
                CREATE INDEX IF NOT EXISTS idx_symbol 
                ON ticks(symbol)
                """)
                
                conn.commit()
                logger.info(f"✅ Database initialized: {self.db_path}")
        except Exception as e:
            logger.error(f"Database initialization error: {e}")
            raise
    
    def insert_tick(self, tick: Tick) -> None:
        """Insert a single tick. Thread-safe."""
        try:
            with self.lock:
                with sqlite3.connect(self.db_path, timeout=10) as conn:
                    conn.execute(
                        """INSERT INTO ticks (symbol, timestamp, price, size) 
                           VALUES (?, ?, ?, ?)""",
                        (
                            tick.symbol.lower(),
                            tick.timestamp.isoformat(),
                            tick.price,
                            tick.size
                        )
                    )
                    conn.commit()
        except sqlite3.IntegrityError as e:
            logger.error(f"Integrity error: {e}")
        except Exception as e:
            logger.error(f"Insert error: {e}")
    
    def get_ticks(self, symbol: str, limit: int = 1000) -> list[Tick]:
        """Fetch last N ticks for a symbol, ordered chronologically."""
        try:
            with self.lock:
                with sqlite3.connect(self.db_path, timeout=10) as conn:
                    conn.row_factory = sqlite3.Row
                    rows = conn.execute(
                        """SELECT symbol, timestamp, price, size 
                           FROM ticks 
                           WHERE symbol = ? 
                           ORDER BY timestamp DESC 
                           LIMIT ?""",
                        (symbol.lower(), limit)
                    ).fetchall()
            
            # Convert to Tick objects and reverse to chronological order
            ticks = [
                Tick(
                    symbol=row['symbol'],
                    timestamp=datetime.fromisoformat(row['timestamp']),
                    price=row['price'],
                    size=row['size']
                )
                for row in rows
            ]
            
            return list(reversed(ticks))  # Chronological order (oldest first)
        
        except Exception as e:
            logger.error(f"Query error for {symbol}: {e}")
            return []
    
    def get_ticks_by_timerange(self, symbol: str, start: datetime, end: datetime) -> list[Tick]:
        """Fetch ticks within a time range."""
        try:
            with self.lock:
                with sqlite3.connect(self.db_path, timeout=10) as conn:
                    conn.row_factory = sqlite3.Row
                    rows = conn.execute(
                        """SELECT symbol, timestamp, price, size 
                           FROM ticks 
                           WHERE symbol = ? AND timestamp BETWEEN ? AND ?
                           ORDER BY timestamp ASC""",
                        (symbol.lower(), start.isoformat(), end.isoformat())
                    ).fetchall()
            
            return [
                Tick(
                    symbol=row['symbol'],
                    timestamp=datetime.fromisoformat(row['timestamp']),
                    price=row['price'],
                    size=row['size']
                )
                for row in rows
            ]
        
        except Exception as e:
            logger.error(f"Time range query error: {e}")
            return []
    
    def get_tick_count(self, symbol: str) -> int:
        """Get count of ticks for a symbol."""
        try:
            with self.lock:
                with sqlite3.connect(self.db_path, timeout=10) as conn:
                    count = conn.execute(
                        "SELECT COUNT(*) FROM ticks WHERE symbol = ?",
                        (symbol.lower(),)
                    ).fetchone()[0]
            return count
        except Exception as e:
            logger.error(f"Count error: {e}")
            return 0
    
    def delete_old_ticks(self, days: int = 1) -> int:
        """Delete ticks older than N days (for cleanup)."""
        try:
            with self.lock:
                with sqlite3.connect(self.db_path, timeout=10) as conn:
                    cursor = conn.execute(
                        """DELETE FROM ticks 
                           WHERE created_at < datetime('now', '-' || ? || ' days')""",
                        (days,)
                    )
                    conn.commit()
                    return cursor.rowcount
        except Exception as e:
            logger.error(f"Delete error: {e}")
            return 0