// components/charts/CorrelationChart.jsx
import React from "react";
import CardChart from "../layout/CardChart";

function formatCorrLabel(corr) {
  if (corr == null) return "No data";
  const v = Math.abs(corr);
  if (v > 0.9) return "Very strong";
  if (v > 0.7) return "Strong";
  if (v > 0.5) return "Moderate";
  if (v > 0.3) return "Weak";
  return "Very weak";
}

function CorrelationChart({ correlation }) {
  const corr = correlation?.correlation;
  const hedge = correlation?.hedge_ratio;

  const badgeColor =
    corr == null
      ? "#6b7280"
      : corr > 0.7
      ? "#22c55e"
      : corr < 0.3
      ? "#f97316"
      : "#eab308";

  return (
    <CardChart title="🔗 CORRELATION" subtitle="BTC / ETH pair">
      <div style={{ padding: 10, fontSize: 12, color: "#e5e7eb" }}>
        {corr == null ? (
          <div style={{ color: "#9ca3af" }}>No correlation data yet.</div>
        ) : (
          <>
            <div style={{ marginBottom: 6 }}>
              <span style={{ color: "#9ca3af", marginRight: 4 }}>
                Pearson ρ:
              </span>
              <span style={{ fontWeight: 600 }}>{corr.toFixed(3)}</span>
              <span
                style={{
                  marginLeft: 8,
                  padding: "2px 6px",
                  borderRadius: 999,
                  fontSize: 10,
                  backgroundColor: badgeColor,
                  color: "#020617",
                  textTransform: "uppercase",
                  fontWeight: 700,
                }}
              >
                {formatCorrLabel(corr)}
              </span>
            </div>

            {hedge != null && (
              <div style={{ marginBottom: 6 }}>
                <span style={{ color: "#9ca3af", marginRight: 4 }}>
                  Hedge ratio:
                </span>
                <span style={{ fontWeight: 600 }}>{hedge.toFixed(4)}</span>
                <span style={{ color: "#9ca3af", marginLeft: 4 }}>
                  (short BTC × {hedge.toFixed(2)} vs long ETH)
                </span>
              </div>
            )}

            <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 4 }}>
              High positive correlation suggests pairs trades; low or unstable
              correlation warns against using this spread.
            </div>
          </>
        )}
      </div>
    </CardChart>
  );
}

export default CorrelationChart;
