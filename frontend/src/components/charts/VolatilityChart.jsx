import React from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  Tooltip,
  XAxis,
  YAxis,
  ResponsiveContainer,
  ReferenceArea,
} from "recharts";
import CardChart from "../layout/CardChart";

function VolatilityChart({ ticks }) {
  const raw = ticks
    .slice(-120)
    .map((t, i) => {
      if (i < 10) return null;
      const window = ticks.slice(Math.max(0, i - 20), i + 1);
      const prices = window.map((x) => parseFloat(x.price));
      const mean =
        prices.reduce((a, b) => a + b, 0) / (prices.length || 1);
      const std = Math.sqrt(
        prices.reduce((sq, n) => sq + Math.pow(n - mean, 2), 0) /
          (prices.length || 1)
      );
      const volatility = mean > 0 ? (std / mean) * 100 : 0; // % volatility
      return {
        time: new Date(t.timestamp).toLocaleTimeString(),
        volatility,
      };
    })
    .filter(Boolean);

  // Round to 2 decimals for display but keep raw for scaling
  const volatilityData = raw.map((d) => ({
    ...d,
    volatility: parseFloat(d.volatility.toFixed(3)),
  }));

  const values = volatilityData.map((d) => d.volatility);
  const min = values.length ? Math.min(...values) : 0;
  const max = values.length ? Math.max(...values) : 0;

  // Add padding so flat series is still visible
  const padding =
    max === min ? (max === 0 ? 1 : max * 0.2) : (max - min) * 0.2;

  const domain = [
    (min - padding).toFixed(3),
    (max + padding).toFixed(3),
  ];

  return (
    <CardChart title="📊 VOLATILITY" subtitle="% over rolling window">
      {volatilityData.length > 0 ? (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={volatilityData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis
              dataKey="time"
              stroke="#94a3b8"
              tick={{ fontSize: 9 }}
              minTickGap={15}
            />
            <YAxis
              stroke="#94a3b8"
              tick={{ fontSize: 9 }}
              domain={domain}
              tickFormatter={(v) => v.toFixed(2)}
            />
            <Tooltip
              contentStyle={{
                background: "#0b1220",
                border: "1px solid #334155",
              }}
              formatter={(v) => [`${v.toFixed(3)} %`, "Volatility"]}
              labelFormatter={(label) => `Time: ${label}`}
            />
            <Line
              type="monotone"
              dataKey="volatility"
              stroke="#f59e0b"
              dot={false}
              isAnimationActive={false}
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <div
          style={{
            padding: 10,
            fontSize: 11,
            color: "#9ca3af",
            textAlign: "center",
          }}
        >
          Waiting for enough ticks to compute volatility…
        </div>
      )}
    </CardChart>
  );
}

export default VolatilityChart;
