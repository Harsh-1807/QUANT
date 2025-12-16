// hooks/useWebSocket.js
import { useEffect, useRef, useState } from "react";

export function useWebSocket(
  url,
  { autoReconnect = true, bufferSize = 2000 } = {}
) {
  const [status, setStatus] = useState("connecting");
  const [messages, setMessages] = useState([]);
  const wsRef = useRef(null);
  const reconnectRef = useRef(null);

  useEffect(() => {
    let isMounted = true;

    const connect = () => {
      if (!isMounted) return;

      try {
        wsRef.current = new WebSocket(url);

        wsRef.current.onopen = () => {
          if (!isMounted) return;
          setStatus("connected");
        };

        wsRef.current.onmessage = (event) => {
          if (!isMounted) return;
          try {
            const msg = JSON.parse(event.data);
            setMessages((prev) => {
              const next = [...prev, msg];
              return next.slice(-bufferSize);
            });
          } catch (e) {
            console.error("Invalid WS message:", e);
          }
        };

        wsRef.current.onerror = () => {
          if (!isMounted) return;
          setStatus("error");
        };

        wsRef.current.onclose = () => {
          if (!isMounted) return;
          setStatus("disconnected");

          if (autoReconnect) {
            if (reconnectRef.current) clearTimeout(reconnectRef.current);
            reconnectRef.current = setTimeout(connect, 3000);
          }
        };
      } catch (e) {
        console.error("WebSocket init failed:", e);
      }
    };

    connect();

    return () => {
      isMounted = false;
      if (reconnectRef.current) clearTimeout(reconnectRef.current);
      if (wsRef.current) wsRef.current.close();
    };
  }, [url, autoReconnect, bufferSize]);

  return { status, messages };
}
