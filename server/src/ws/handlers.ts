import { WebSocket } from 'ws';
import { WsServer } from './WsServer.js';
import { LobbyManager } from '../lobby/LobbyManager.js';
import { gameRegistry } from '../games/registry.js';

export function setupWsHandlers(wsServer: WsServer, lobbyManager: LobbyManager): void {
  (wsServer as any).wss.on('connection', (ws: WebSocket, req: any) => {
    wsServer.sendTo(ws, { type: 'CONNECTED', payload: { serverTime: Date.now() } });

    ws.on('message', (raw: Buffer) => {
      let msg: any;
      try { msg = JSON.parse(raw.toString()); } catch { return; }

      switch (msg.type) {
        case 'PING':
          wsServer.sendTo(ws, { type: 'PONG' });
          break;

        case 'JOIN_LOBBY': {
          // If already joined via REST, just join the WS room
          if (msg.payload.lobbyId) {
            wsServer.joinRoom(ws, `lobby:${msg.payload.lobbyId}`);
            const state = lobbyManager.getState(msg.payload.lobbyId);
            wsServer.sendTo(ws, { type: 'LOBBY_UPDATED', payload: state });
          } else {
            // First-time join via WS
            const result = lobbyManager.join(msg.payload.code, msg.payload.playerName);
            if ('error' in result) {
              wsServer.sendTo(ws, { type: 'ERROR', payload: { error: result.error } });
            } else {
              wsServer.joinRoom(ws, `lobby:${result.lobbyId}`);
              wsServer.broadcast(`lobby:${result.lobbyId}`, { type: 'LOBBY_UPDATED', payload: { lobby: result.lobby, players: result.players } });
              wsServer.sendTo(ws, { type: 'JOINED', payload: result });
            }
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

        case 'JOIN_GAME': {
          const { sessionId, playerIndex } = msg.payload;
          wsServer.joinRoom(ws, `game:${sessionId}`);
          // Register broadcast function for this session
          gameRegistry.setWsBroadcast(sessionId, (payload: any) => {
            wsServer.broadcast(`game:${sessionId}`, payload);
          });
          // Send initial state
          const state = gameRegistry.getState(sessionId, playerIndex);
          if (state) {
            wsServer.sendTo(ws, { type: 'GAME_STATE', payload: state });
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
