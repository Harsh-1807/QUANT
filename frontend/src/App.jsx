import { useEffect, useMemo, useState } from "react";
import "./App.css";

import Header from "./components/layout/Header";
import Sidebar from "./components/layout/Sidebar";
import Footer from "./components/layout/Footer";

import PriceChart from "./components/charts/PriceChart";
import ZScoreChart from "./components/charts/ZScoreChart";
import VolumeChart from "./components/charts/VolumeChart";
import VolatilityChart from "./components/charts/VolatilityChart";
import CorrelationChart from "./components/charts/CorrelationChart";
import OrderFlowChart from "./components/charts/OrderFlowChart";
import OHLCChart from "./components/layout/OHLCChart";

import { useWebSocket } from "./hooks/useWebSocket";

const API_URL = "http://localhost:8000";
const WS_URL = "ws://localhost:8000/ws";

export default function App() {
  const [symbol, setSymbol] = useState("btcusdt");
  const [timeInterval, setTimeInterval] = useState("1s");
  const [ticks, setTicks] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [correlation, setCorrelation] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [triggeredAlerts, setTriggeredAlerts] = useState([]);
  const [newAlert, setNewAlert] = useState({ metric: "zscore", threshold: 2.0 });
  const [stats, setStats] = useState({});
  const [ohlcv, setOhlcv] = useState([]);
  const [advancedStats, setAdvancedStats] = useState({});

  const { status: wsStatus, messages } = useWebSocket(WS_URL, {
    autoReconnect: true,
    bufferSize: 5000,
  });
  const wsConnected = wsStatus === "connected";

  // Filter WebSocket messages for current symbol
  useEffect(() => {
    const filtered = messages
      .filter((m) => m.type === "tick" && m.data?.symbol === symbol)
      .map((m) => m.data);

    setTicks(filtered.slice(-2000));
  }, [messages, symbol]);

  // Fetch analytics + correlation
  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const [analyticsRes, corrRes] = await Promise.all([
          fetch(`${API_URL}/api/analytics/${symbol}`),
          fetch(`${API_URL}/api/correlation/btcusdt/ethusdt`),
        ]);

        if (analyticsRes.ok) setAnalytics(await analyticsRes.json());
        if (corrRes.ok) setCorrelation(await corrRes.json());
      } catch (err) {
        console.error("Analytics fetch error:", err);
      }
    };

    fetchAnalytics();
    const interval = setInterval(fetchAnalytics, 3000);
    return () => clearInterval(interval);
  }, [symbol]);

  // Derived stats + OHLCV
  useEffect(() => {
    if (ticks.length < 20) return;

    const prices = ticks.map((t) => parseFloat(t.price));
    const sizes = ticks.map((t) => parseFloat(t.size));

    const mean =
      prices.reduce((a, b) => a + b, 0) / (prices.length || 1);
    const std = Math.sqrt(
      prices.reduce((sq, n) => sq + Math.pow(n - mean, 2), 0) /
        (prices.length || 1)
    );
    const high = Math.max(...prices);
    const low = Math.min(...prices);
    const range = high - low;
    const vwap =
      ticks.reduce(
        (sum, t) =>
          sum + parseFloat(t.price) * parseFloat(t.size),
        0
      ) / sizes.reduce((a, b) => a + b, 0);
    const totalVolume = sizes.reduce((a, b) => a + b, 0);
    const volatility = (std / mean) * 100;

    const returns = [];
    for (let i = 1; i < prices.length; i++) {
      returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
    }
    const avgReturn =
      returns.reduce((a, b) => a + b, 0) / (returns.length || 1);
    const returnStd = Math.sqrt(
      returns.reduce((sq, r) => sq + Math.pow(r - avgReturn, 2), 0) /
        (returns.length || 1)
    );
    const sharpeRatio = returnStd > 0 ? avgReturn / returnStd : 0;

    let buyVolume = 0,
      sellVolume = 0;
    for (let i = 1; i < ticks.length; i++) {
      if (parseFloat(ticks[i].price) > parseFloat(ticks[i - 1].price)) {
        buyVolume += parseFloat(ticks[i].size);
      } else {
        sellVolume += parseFloat(ticks[i].size);
      }
    }

    setStats({
      price: prices[prices.length - 1],
      previousPrice: prices.length > 1 ? prices[prices.length - 2] : prices[0],
      mean: mean.toFixed(2),
      std: std.toFixed(6),
      high: high.toFixed(2),
      low: low.toFixed(2),
      vwap: vwap.toFixed(2),
      range: range.toFixed(2),
      tickCount: ticks.length,
      totalVolume: totalVolume.toFixed(4),
      volatility: volatility.toFixed(2),
      priceChange: (prices[prices.length - 1] - prices[0]).toFixed(2),
      priceChangePercent: (
        ((prices[prices.length - 1] - prices[0]) / prices[0]) *
        100
      ).toFixed(2),
    });

    setAdvancedStats({
      skewness:
        returns.length > 0 && std !== 0
          ? (
              returns.reduce(
                (sum, r) => sum + Math.pow(r - avgReturn, 3),
                0
              ) /
              (returns.length * Math.pow(std / mean, 3))
            ).toFixed(3)
          : 0,
      sharpeRatio: sharpeRatio.toFixed(3),
      buyVolume: buyVolume.toFixed(4),
      sellVolume: sellVolume.toFixed(4),
      buyVolumePercent:
        buyVolume + sellVolume > 0
          ? ((buyVolume / (buyVolume + sellVolume)) * 100).toFixed(1)
          : 0,
      avgReturn: (avgReturn * 100).toFixed(4),
      returnStd: (returnStd * 100).toFixed(4),
      momentumScore:
        returnStd > 0
          ? ((avgReturn / returnStd) * 100).toFixed(2)
          : 0,
    });

    // OHLCV aggregation
    const grouped = {};
    const intervalMs =
      {
        "1s": 1000,
        "5s": 5000,
        "1m": 60000,
        "5m": 300000,
      }[timeInterval] || 1000;

    ticks.forEach((t) => {
      const ts = new Date(t.timestamp).getTime();
      const bucket = Math.floor(ts / intervalMs) * intervalMs;
      const bucketKey = new Date(bucket).toISOString();

      if (!grouped[bucketKey]) {
        grouped[bucketKey] = { prices: [], sizes: [] };
      }
      grouped[bucketKey].prices.push(parseFloat(t.price));
      grouped[bucketKey].sizes.push(parseFloat(t.size));
    });

    const ohlcvData = Object.entries(grouped).map(([time, data]) => ({
      time: new Date(time).toLocaleTimeString(),
      open: data.prices[0],
      high: Math.max(...data.prices),
      low: Math.min(...data.prices),
      close: data.prices[data.prices.length - 1],
      volume: data.sizes.reduce((a, b) => a + b, 0),
    }));

    setOhlcv(ohlcvData.slice(-60));
  }, [ticks, timeInterval]);

  // Alerts
  useEffect(() => {
    if (!analytics || alerts.length === 0) return;

    alerts.forEach((alert) => {
      const value = analytics[alert.metric];
      if (value == null) return;

      const triggered = value > alert.threshold;

      if (triggered) {
        playAlert();
        setTriggeredAlerts((prev) => {
          const existing = prev.filter((a) => a.id !== alert.id);
          return [
            ...existing,
            { ...alert, triggeredAt: new Date(), value },
          ];
        });
      }
    });
  }, [analytics, alerts, symbol]);

  const playAlert = () => {
    try {
      const ctx = new (window.AudioContext ||
        window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 800;
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(
        0.01,
        ctx.currentTime + 0.5
      );
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.5);
    } catch {
      console.log("Audio unavailable");
    }
  };

  const handleAddAlert = () => {
    if (newAlert.threshold > 0) {
      setAlerts((prev) => [
        ...prev,
        { ...newAlert, id: Date.now(), operator: "greater_than" },
      ]);
      setNewAlert({ metric: "zscore", threshold: 2.0 });
    }
  };

  const handleUploadOhlc = async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  const formData = new FormData();
  formData.append("file", file);
  formData.append("symbol", symbol);

  try {
    const res = await fetch(`${API_URL}/api/upload_ohlc?symbol=${symbol}`, {
      method: "POST",
      body: formData,
    });
    if (!res.ok) {
      console.error("Upload failed");
    }
  } catch (err) {
    console.error("Upload error", err);
  } finally {
    e.target.value = null;
  }
};


  const handleRemoveAlert = (id) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  };

  const handleExport = async () => {
    try {
      const res = await fetch(`${API_URL}/api/export/${symbol}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${symbol}_ticks_${new Date().toISOString()}.csv`;
      a.click();
    } catch (err) {
      console.error("Export failed:", err);
    }
  };

  const priceChange =
    parseFloat(stats.price || 0) -
    parseFloat(stats.previousPrice || 0);
  const priceChangeColor = priceChange >= 0 ? "#10b981" : "#ff4444";

  return (
    <div className="app-container">
      <Header
        symbol={symbol}
        setSymbol={setSymbol}
        timeInterval={timeInterval}
        setTimeInterval={setTimeInterval}
        wsConnected={wsConnected}
        onExport={handleExport}
      />

      <div className="main-container">
        <Sidebar
          stats={stats}
          advancedStats={advancedStats}
          analytics={analytics}
          correlation={correlation}
          alerts={alerts}
          triggeredAlerts={triggeredAlerts}
          newAlert={newAlert}
          setNewAlert={setNewAlert}
          onAddAlert={handleAddAlert}
          onRemoveAlert={handleRemoveAlert}
          priceChange={priceChange}
          priceChangeColor={priceChangeColor}
        />

        <main className="main-content">
          <PriceChart
            ticks={ticks}
            mean={parseFloat(stats.mean || 0)}
            symbol={symbol}
          />

          <div className="charts-grid">
            <ZScoreChart ticks={ticks} />
            <VolumeChart ticks={ticks} />
            <VolatilityChart ticks={ticks} />
            <CorrelationChart correlation={correlation} />
            <OrderFlowChart advancedStats={advancedStats} />
            <OHLCChart ohlcv={ohlcv} timeInterval={timeInterval} />
          </div>
        </main>
      </div>

      <Footer
        wsConnected={wsConnected}
        tickCount={stats.tickCount}
        symbol={symbol}
      />
    </div>
  );
}
