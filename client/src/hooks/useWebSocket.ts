import { useEffect, useRef, useCallback } from 'react';
import { getWs, WsConnection } from '../api/ws.js';

export function useWebSocket(handlers?: Record<string, (payload: any) => void>) {
  const wsRef = useRef<WsConnection>(getWs());
  const cleanupRef = useRef<(() => void)[]>([]);

  useEffect(() => {
    const ws = wsRef.current;
    ws.connect();
    if (handlers) {
      const unsubs = Object.entries(handlers).map(([type, handler]) =>
        ws.on(type, (msg) => handler(msg.payload))
      );
      cleanupRef.current = unsubs;
    }
    return () => {
      cleanupRef.current.forEach(fn => fn());
    };
  }, []);

  const send = useCallback((type: string, payload?: any) => {
    wsRef.current.send(type, payload);
  }, []);

  return { send, ws: wsRef.current };
}
