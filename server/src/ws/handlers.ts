import { WebSocket } from 'ws';
import { WsServer } from './WsServer.js';
import { LobbyManager } from '../lobby/LobbyManager.js';
import type { CreateLobbyRequest, LobbyState } from '../lobby/LobbyManager.js';

export function setupWsHandlers(wsServer: WsServer, lobbyManager: LobbyManager): void {
  (wsServer as any).wss.on('connection', (ws: WebSocket, req: any) => {
    wsServer.sendTo(ws, { type: 'CONNECTED', payload: { serverTime: Date.now() } });

    ws.on('message', (raw: Buffer) => {
      let msg: any;
      try {
        msg = JSON.parse(raw.toString());
      } catch {
        return;
      }

      switch (msg.type) {
        case 'PING':
          wsServer.sendTo(ws, { type: 'PONG' });
          break;

        case 'JOIN_LOBBY': {
          const result = lobbyManager.join(msg.payload.code, msg.payload.playerName);
          if ('error' in result) {
            wsServer.sendTo(ws, { type: 'ERROR', payload: { error: result.error } });
          } else {
            wsServer.joinRoom(ws, `lobby:${result.lobby.code}`);
            wsServer.broadcast(`lobby:${result.lobbyId}`, { type: 'LOBBY_UPDATED', payload: { lobby: result.lobby, players: result.players } });
            wsServer.sendTo(ws, { type: 'JOINED', payload: result });
          }
          break;
        }

        case 'READY': {
          const result = lobbyManager.ready(msg.payload.lobbyId, msg.payload.playerId, msg.payload.ready);
          if ('error' in result) {
            wsServer.sendTo(ws, { type: 'ERROR', payload: { error: result.error } });
          } else {
            wsServer.broadcast(`lobby:${msg.payload.lobbyId}`, { type: 'LOBBY_UPDATED', payload: result });
          }
          break;
        }

        default:
          break;
      }
    });

    ws.on('close', () => {
      wsServer.leaveAllRooms(ws);
    });
  });
}
