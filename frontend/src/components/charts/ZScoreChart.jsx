import React from "react";
import {
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  Tooltip,
  XAxis,
  YAxis,
  ResponsiveContainer,
} from "recharts";
import CardChart from "../layout/CardChart";

function ZScoreChart({ ticks }) {
  const zscoreData = ticks
    .slice(-100)
    .map((t, i) => {
      if (i < 10) return null;
      const window = ticks.slice(Math.max(0, i - 20), i + 1);
      const prices = window.map((x) => parseFloat(x.price));
      const mean = prices.reduce((a, b) => a + b, 0) / prices.length;
      const std = Math.sqrt(
        prices.reduce((sq, n) => sq + Math.pow(n - mean, 2), 0) /
          prices.length
      );
      const zscore = std > 0 ? (prices[prices.length - 1] - mean) / std : 0;
      return {
        time: new Date(t.timestamp).toLocaleTimeString(),
        zscore: parseFloat(zscore.toFixed(3)),
      };
    })
    .filter(Boolean);

  return (
    <CardChart title="📍 Z-SCORE" subtitle="Mean reversion">
      {zscoreData.length > 0 && (
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={zscoreData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="time" stroke="#94a3b8" tick={{ fontSize: 9 }} />
            <YAxis stroke="#94a3b8" tick={{ fontSize: 9 }} />
            <Tooltip
              contentStyle={{
                background: "#0b1220",
                border: "1px solid #334155",
              }}
            />
            <Line
              type="monotone"
              dataKey="zscore"
              stroke="#f59e0b"
              dot={false}
              isAnimationActive={false}
              strokeWidth={2}
            />
            <ReferenceLine
              y={2}
              stroke="#ff4444"
              strokeDasharray="3 3"
              label="Overbought"
            />
            <ReferenceLine
              y={-2}
              stroke="#ff4444"
              strokeDasharray="3 3"
              label="Oversold"
            />
            <ReferenceLine y={0} stroke="#10b981" strokeDasharray="3 3" />
          </ComposedChart>
        </ResponsiveContainer>
      )}
    </CardChart>
  );
}

export default ZScoreChart;
