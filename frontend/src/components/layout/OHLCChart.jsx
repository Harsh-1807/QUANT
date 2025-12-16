// components/charts/OHLCChart.jsx
import React from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  Tooltip,
  XAxis,
  YAxis,
  ResponsiveContainer,
} from "recharts";
import CardChart from "../layout/CardChart";

export default function OHLCChart({ ohlcv, timeInterval }) {
  if (!ohlcv || ohlcv.length === 0) {
    return (
      <CardChart title="OHLC RANGE" subtitle={`${timeInterval} bars`}>
        <div
          style={{
            padding: 10,
            fontSize: 11,
            color: "#9ca3af",
            textAlign: "center",
          }}
        >
          Waiting for enough ticks to build OHLC bars…
        </div>
      </CardChart>
    );
  }

  const data = ohlcv.map((d) => ({
    time: d.time,
    high: d.high,
    low: d.low,
    close: d.close,
  }));

  const prices = data.flatMap((d) => [d.high, d.low]);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const padding = (max - min || max * 0.01 || 1) * 0.3;

  return (
    <CardChart title="OHLC RANGE" subtitle={`${timeInterval} bars`}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
          <XAxis dataKey="time" stroke="#94a3b8" tick={{ fontSize: 9 }} />
          <YAxis
            stroke="#94a3b8"
            tick={{ fontSize: 9 }}
            domain={[min - padding, max + padding]}
            tickFormatter={(v) => v.toFixed(2)}
          />
          <Tooltip
            contentStyle={{
              background: "#0b1220",
              border: "1px solid #334155",
            }}
            formatter={(value, name) => [
              value.toFixed(2),
              name.toUpperCase(),
            ]}
            labelFormatter={(label) => `Time: ${label}`}
          />

          {/* High–low band */}
          <Area
            type="monotone"
            dataKey="high"
            stroke="transparent"
            fill="#1e293b"
            fillOpacity={0.9}
            activeDot={false}
          />
          <Area
            type="monotone"
            dataKey="low"
            stroke="transparent"
            fill="#020617"
            fillOpacity={1}
            activeDot={false}
          />

          {/* Close line on top */}
          <Line
            type="monotone"
            dataKey="close"
            stroke="#8b5cf6"
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </CardChart>
  );
}
