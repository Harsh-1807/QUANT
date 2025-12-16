import React, { useMemo, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  Legend,
} from "recharts";

function PriceChart({ ticks, mean, symbol }) {
  const [windowSize, setWindowSize] = useState(200); // how many last points to show
  const [mode, setMode] = useState("latest"); // "latest" or "full"

  const allData = useMemo(
    () =>
      ticks.map((t, i) => ({
        idx: i,
        time: new Date(t.timestamp).toLocaleTimeString(),
        price: parseFloat(t.price),
      })),
    [ticks]
  );

  const chartData =
    mode === "full" ? allData : allData.slice(-windowSize || undefined);

  const currentPrice =
    chartData.length > 0 ? chartData[chartData.length - 1].price : 0;
  const prices = chartData.map((d) => d.price);
  const high = prices.length ? Math.max(...prices) : 0;
  const low = prices.length ? Math.min(...prices) : 0;

  const zoomLevels = [50, 100, 200, 400];

  return (
    <div className="chart-full">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 8,
        }}
      >
        <h3 className="chart-title" style={{ marginBottom: 0 }}>
          💹 PRICE (Real-Time) | {symbol.toUpperCase()}
          <span
            style={{
              fontSize: "14px",
              marginLeft: "10px",
              color: "#0ea5e9",
            }}
          >
            ${currentPrice.toFixed(2)}
          </span>
          <span
            style={{
              fontSize: "12px",
              marginLeft: "10px",
              color: "#94a3b8",
            }}
          >
            Range: ${low.toFixed(2)} - ${high.toFixed(2)}
          </span>
        </h3>

        {/* Zoom controls */}
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <button
            onClick={() => setMode("full")}
            style={{
              fontSize: 10,
              padding: "4px 8px",
              borderRadius: 4,
              border: "1px solid #334155",
              background: mode === "full" ? "#1d4ed8" : "#020617",
              color: "#e5e7eb",
              cursor: "pointer",
            }}
          >
            View: Full
          </button>
          <button
            onClick={() => setMode("latest")}
            style={{
              fontSize: 10,
              padding: "4px 8px",
              borderRadius: 4,
              border: "1px solid #334155",
              background: mode === "latest" ? "#1d4ed8" : "#020617",
              color: "#e5e7eb",
              cursor: "pointer",
            }}
          >
            View: Latest
          </button>

          {mode === "latest" && (
            <div
              style={{
                display: "flex",
                gap: 4,
                marginLeft: 8,
                fontSize: 10,
                color: "#94a3b8",
              }}
            >
              {zoomLevels.map((z) => (
                <button
                  key={z}
                  onClick={() => setWindowSize(z)}
                  style={{
                    padding: "2px 6px",
                    borderRadius: 4,
                    border: "1px solid #334155",
                    background:
                      windowSize === z ? "#0ea5e9" : "transparent",
                    color: windowSize === z ? "#020617" : "#cbd5f5",
                    cursor: "pointer",
                  }}
                >
                  {z}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {chartData.length > 1 && (
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="time" stroke="#94a3b8" tick={{ fontSize: 10 }} />
            <YAxis
              stroke="#94a3b8"
              tick={{ fontSize: 10 }}
              domain={["dataMin - 1", "dataMax + 1"]}
            />
            <Tooltip
              contentStyle={{
                background: "#0b1220",
                border: "1px solid #334155",
                borderRadius: "4px",
              }}
              formatter={(value) => `$${value.toFixed(2)}`}
            />
            <Legend />
            <Line
              type="natural"
              dataKey="price"
              stroke="#0ea5e9"
              dot={false}
              isAnimationActive={false}
              strokeWidth={2}
              name="Price"
            />
            <ReferenceLine
              y={mean}
              stroke="#fbbf24"
              strokeDasharray="5 5"
              name="Mean"
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

export default PriceChart;
