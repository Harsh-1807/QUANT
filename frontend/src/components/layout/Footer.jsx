// components/layout/Footer.jsx
export default function Footer({ wsConnected, tickCount, symbol }) {
  return (
    <footer className="footer">
      <div>
        🟢 {wsConnected ? "Live Streaming" : "Reconnecting"} |{" "}
        {symbol.toUpperCase()} | {tickCount} ticks buffered
      </div>
      <div>Last Update: {new Date().toLocaleTimeString()}</div>
      <div>© 2024 QuantBot • Real-Time Analytics</div>
    </footer>
  );
}
