// components/layout/Sidebar.jsx
import React from "react";
import MetricRow from "../ui/MetricRow";
import IndicatorBox from "../ui/IndicatorBox";

function Sidebar({
  stats,
  advancedStats,
  analytics,
  correlation,
  alerts,
  triggeredAlerts,
  newAlert,
  setNewAlert,
  onAddAlert,
  onRemoveAlert,
  priceChange,
  priceChangeColor,
}) {
  return (
    <aside className="sidebar">
      {/* Price Display */}
      <div className="price-box">
        <div className="price-label">CURRENT PRICE</div>
        <div className="price-value">
          {stats.price ? `$${stats.price.toFixed(2)}` : "-"}
        </div>
        <div className="price-change" style={{ color: priceChangeColor }}>
          {priceChange >= 0 ? "📈" : "📉"} {priceChange.toFixed(2)} (
          {stats.priceChangePercent}%)
        </div>
        <div className="price-subtext">{stats.tickCount} ticks buffered</div>
      </div>

      {/* Quick Stats */}
      <div className="metrics-section">
        <h3 className="section-header">⚡ QUICK STATS</h3>
        <MetricRow label="High" value={stats.high} unit="$" />
        <MetricRow label="Low" value={stats.low} unit="$" />
        <MetricRow label="Range" value={stats.range} unit="$" />
        <MetricRow label="VWAP" value={stats.vwap} unit="$" highlight />
        <MetricRow label="Volatility" value={stats.volatility} unit="%" />
        <MetricRow label="Volume" value={stats.totalVolume} />
      </div>

      {/* Advanced Analytics */}
      {Object.keys(advancedStats).length > 0 && (
        <div className="metrics-section">
          <h3 className="section-header">📊 ADVANCED</h3>
          <MetricRow label="Sharpe Ratio" value={advancedStats.sharpeRatio} />
          <MetricRow label="Skewness" value={advancedStats.skewness} />
          <MetricRow label="Momentum" value={advancedStats.momentumScore} />
          <MetricRow label="Buy Vol %" value={advancedStats.buyVolumePercent} />
          <MetricRow label="Avg Return" value={advancedStats.avgReturn} unit="%" />
        </div>
      )}

      {/* Quant Indicators */}
      {analytics && (
        <div className="metrics-section">
          <h3 className="section-header">🔬 QUANT SIGNALS</h3>
          <IndicatorBox
            label="Z-Score"
            value={analytics.zscore?.toFixed(3)}
            alert={Math.abs(analytics.zscore || 0) > 2}
            tooltip="Mean reversion signal"
          />
          <IndicatorBox
            label="Spread %"
            value={analytics.spread ? (analytics.spread * 100).toFixed(4) : "-"}
            tooltip="Liquidity indicator"
          />
          <IndicatorBox
            label="ADF p-val"
            value={analytics.adf_pvalue?.toFixed(4)}
            alert={(analytics.adf_pvalue || 1) < 0.05}
            tooltip="Stationarity test"
          />
          {correlation && (
            <>
              <IndicatorBox
                label="BTC-ETH Corr"
                value={correlation.correlation?.toFixed(3)}
                tooltip="Pair correlation"
              />
              <IndicatorBox
                label="Hedge Ratio"
                value={correlation.hedge_ratio?.toFixed(4)}
                tooltip="Optimal ETH/BTC"
              />
            </>
          )}
        </div>
      )}

      {/* Alerts */}
      <div className="metrics-section">
        <h3 className="section-header">⚠️ ALERTS ({alerts.length})</h3>

        <div className="alert-inputs">
          <select
            value={newAlert.metric}
            onChange={(e) =>
              setNewAlert({ ...newAlert, metric: e.target.value })
            }
            className="alert-select"
          >
            <option value="zscore">Z-Score</option>
            <option value="spread">Spread</option>
            <option value="adf_pvalue">ADF p-val</option>
          </select>
          <input
            type="number"
            step="0.01"
            placeholder="Threshold"
            value={newAlert.threshold}
            onChange={(e) =>
              setNewAlert({
                ...newAlert,
                threshold: parseFloat(e.target.value) || 0,
              })
            }
            className="alert-input"
          />
          <button onClick={onAddAlert} className="add-alert-btn">
            +
          </button>
        </div>

        {alerts.length > 0 && (
          <div className="alerts-list">
            {alerts.map((alert) => (
              <div key={alert.id} className="alert-item">
                <span>
                  {alert.metric} &gt; {alert.threshold.toFixed(2)}
                </span>
                <button
                  onClick={() => onRemoveAlert(alert.id)}
                  className="alert-delete-btn"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        {triggeredAlerts.length > 0 && (
          <div className="triggered-box">
            <div>🚨 TRIGGERED:</div>
            {triggeredAlerts.slice(-3).map((alert) => (
              <div key={alert.id}>
                {alert.metric} = {alert.value?.toFixed(3)} @{" "}
                {alert.triggeredAt.toLocaleTimeString()}
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}

export default Sidebar;
