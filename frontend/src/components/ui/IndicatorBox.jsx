// components/ui/IndicatorBox.jsx
export default function IndicatorBox({ label, value, alert, tooltip }) {
  return (
    <div className={`indicator ${alert ? "alert" : ""}`}>
      <div className="indicator-label">{label}</div>
      <div className="indicator-value">{value}</div>
      {tooltip && <div className="indicator-tooltip">{tooltip}</div>}
    </div>
  );
}
