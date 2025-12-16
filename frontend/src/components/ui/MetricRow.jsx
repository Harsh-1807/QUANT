// components/ui/MetricRow.jsx
export default function MetricRow({ label, value, unit = "", highlight }) {
  return (
    <div className="metric-row">
      <span className="metric-row-label">{label}</span>
      <span className={`metric-row-value ${highlight ? "highlight" : ""}`}>
        {value} {unit}
      </span>
    </div>
  );
}
