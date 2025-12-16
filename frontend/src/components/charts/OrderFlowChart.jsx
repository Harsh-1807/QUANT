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

function OrderFlowChart({ advancedStats }) {
  const buyPct = parseFloat(advancedStats.buyVolumePercent || 0);
  const data = [
    { label: "Buy Flow", value: buyPct },
    { label: "Sell Flow", value: 100 - buyPct },
  ];

  return (
    <CardChart title="📈 ORDER FLOW">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis type="number" stroke="#94a3b8" tick={{ fontSize: 9 }} />
          <YAxis
            dataKey="label"
            type="category"
            stroke="#94a3b8"
            tick={{ fontSize: 9 }}
          />
          <Tooltip
            contentStyle={{
              background: "#0b1220",
              border: "1px solid #334155",
            }}
            formatter={(v) => `${v.toFixed(1)}%`}
          />
          <Bar dataKey="value">
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={index === 0 ? "#10b981" : "#ff4444"}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </CardChart>
  );
}

export default OrderFlowChart;
