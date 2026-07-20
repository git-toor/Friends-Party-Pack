import { WebSocketServer as WSS, WebSocket } from 'ws';
import type http from 'node:http';

type RoomId = string;

export class WsServer {
  private wss: WSS;
  private rooms = new Map<RoomId, Set<WebSocket>>();
  private clientRooms = new Map<WebSocket, Set<RoomId>>();

  constructor(server: http.Server) {
    this.wss = new WSS({ server, path: '/ws' });
    this.wss.on('connection', (ws) => {
      ws.send(JSON.stringify({ type: 'CONNECTED', payload: { serverTime: Date.now() } }));
    });
  }

  joinRoom(ws: WebSocket, roomId: RoomId): void {
    if (!this.rooms.has(roomId)) this.rooms.set(roomId, new Set());
    this.rooms.get(roomId)!.add(ws);
    if (!this.clientRooms.has(ws)) this.clientRooms.set(ws, new Set());
    this.clientRooms.get(ws)!.add(roomId);
  }

  leaveRoom(ws: WebSocket, roomId: RoomId): void {
    this.rooms.get(roomId)?.delete(ws);
    this.clientRooms.get(ws)?.delete(roomId);
  }

  leaveAllRooms(ws: WebSocket): void {
    const rooms = this.clientRooms.get(ws);
    if (rooms) for (const room of rooms) this.rooms.get(room)?.delete(ws);
    this.clientRooms.delete(ws);
  }

  broadcast(roomId: RoomId, message: object): void {
    const data = JSON.stringify(message);
    this.rooms.get(roomId)?.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) ws.send(data);
    });
  }

  sendTo(ws: WebSocket, message: object): void {
    if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(message));
  }
}
