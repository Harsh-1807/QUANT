// components/layout/CardChart.jsx
export default function CardChart({ title, subtitle, height = 250, children }) {
  return (
    <div className="chart">
      <h4 className="chart-subtitle">
        {title}
        {subtitle && (
          <span
            style={{
              marginLeft: 6,
              fontSize: 10,
              color: "#64748b",
              textTransform: "none",
            }}
          >
            {subtitle}
          </span>
        )}
      </h4>
      <div style={{ flex: 1, minHeight: height }}>{children}</div>
    </div>
  );
}
