import React from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Tooltip,
  XAxis,
  YAxis,
  ResponsiveContainer,
} from "recharts";
import CardChart from "../layout/CardChart";

function VolumeChart({ ticks }) {
  const volumeData = ticks.slice(-100).map((t) => ({
    time: new Date(t.timestamp).toLocaleTimeString(),
    volume: parseFloat(t.size),
  }));

  const avgVolume =
    volumeData.length > 0
      ? volumeData.reduce((sum, d) => sum + d.volume, 0) / volumeData.length
      : 0;

  return (
    <CardChart title="📦 TRADE VOLUME" subtitle="Real-time">
      {volumeData.length > 0 && (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={volumeData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="time" stroke="#94a3b8" tick={{ fontSize: 9 }} />
            <YAxis stroke="#94a3b8" tick={{ fontSize: 9 }} />
            <Tooltip
              contentStyle={{
                background: "#0b1220",
                border: "1px solid #334155",
              }}
              formatter={(value) => `${value.toFixed(4)} BTC`}
            />
            <Bar dataKey="volume" fill="#10b981" radius={[2, 2, 0, 0]}>
              {volumeData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.volume > avgVolume ? "#0ea5e9" : "#10b981"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
      <div
        style={{
          fontSize: "9px",
          color: "#94a3b8",
          marginTop: "8px",
          textAlign: "center",
        }}
      >
        Avg Volume: {avgVolume.toFixed(4)} BTC | Blue = above avg
      </div>
    </CardChart>
  );
}

export default VolumeChart;
