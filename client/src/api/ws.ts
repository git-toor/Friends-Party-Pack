type MessageHandler = (msg: { type: string; payload?: any }) => void;

export class WsConnection {
  private ws: WebSocket | null = null;
  private handlers = new Map<string, Set<MessageHandler>>();
  private url: string;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private shouldReconnect = true;

  constructor() {
    const proto = location.protocol === 'https:' ? 'wss:' : 'ws:';
    this.url = `${proto}//${location.host}/ws`;
  }

  connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN) return;
    this.ws = new WebSocket(this.url);
    this.ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data as string);
        const typeHandlers = this.handlers.get(msg.type);
        if (typeHandlers) typeHandlers.forEach(h => h(msg));
        const allHandlers = this.handlers.get('*');
        if (allHandlers) allHandlers.forEach(h => h(msg));
      } catch {}
    };
    this.ws.onclose = () => {
      if (this.shouldReconnect) {
        this.reconnectTimer = setTimeout(() => this.connect(), 2000);
      }
    };
  }

  disconnect(): void {
    this.shouldReconnect = false;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.ws?.close();
    this.ws = null;
  }

  send(type: string, payload?: any): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, payload }));
    }
  }

  on(type: string, handler: MessageHandler): () => void {
    if (!this.handlers.has(type)) this.handlers.set(type, new Set());
    this.handlers.get(type)!.add(handler);
    return () => this.handlers.get(type)?.delete(handler);
  }

  get connected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

let instance: WsConnection | null = null;

export function getWs(): WsConnection {
  if (!instance) instance = new WsConnection();
  return instance;
}
