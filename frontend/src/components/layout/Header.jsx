// components/layout/Header.jsx
import React from "react";

function Header({
  symbol,
  setSymbol,
  timeInterval,
  setTimeInterval,
  wsConnected,
  onExport,
  onUploadOhlc,           // ✅ add here
}) {
  return (
    <header className="header">
      <div className="header-left">
        <h1 className="title">📊 QUANTBOT LIVE</h1>
        <div className="header-tag">Real-Time Statistical Arbitrage Dashboard</div>
      </div>

      <div className="header-right">
        <div className={`status-badge ${wsConnected ? "connected" : "disconnected"}`}>
          {wsConnected ? "🔴 LIVE" : "⚪ OFFLINE"}
        </div>

        {/* Asset select */}
        <div className="control-group">
          <label className="control-label">Asset</label>
          <select
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            className="symbol-select"
          >
            <option value="btcusdt">BTC/USDT</option>
            <option value="ethusdt">ETH/USDT</option>
            <option value="bnbusdt">BNB/USDT</option>
          </select>
        </div>

        {/* Interval select */}
        <div className="control-group">
          <label className="control-label">Interval</label>
          <select
            value={timeInterval}
            onChange={(e) => setTimeInterval(e.target.value)}
            className="time-select"
          >
            <option value="1s">1s</option>
            <option value="5s">5s</option>
            <option value="1m">1m</option>
            <option value="5m">5m</option>
          </select>
        </div>

        {/* Export + upload */}
        <button onClick={onExport} className="export-btn">
          ⬇️ EXPORT
        </button>

        <input
          type="file"
          accept=".csv"
          onChange={onUploadOhlc}     // ✅ now comes from props
          style={{ fontSize: 10, color: "#e5e7eb" }}
        />
      </div>
    </header>
  );
}

export default Header;
