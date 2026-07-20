import express from 'express';
import http from 'node:http';
import { config } from './config.js';
import { getDb, closeDb } from './db/index.js';
import { LobbyManager } from './lobby/LobbyManager.js';
import { WsServer } from './ws/WsServer.js';
import { setupWsHandlers } from './ws/handlers.js';
import type { CreateLobbyRequest } from './lobby/LobbyManager.js';

const app = express();
app.use(express.json());

const server = http.createServer(app);

// ─── Init ─────────────────────────────────────────────────
getDb();
const lobbyManager = new LobbyManager();
const wsServer = new WsServer(server);
setupWsHandlers(wsServer, lobbyManager);

// ─── Health Check ─────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

// ─── Lobby REST Routes ────────────────────────────────────
app.post('/api/lobby/create', (req, res) => {
  const result = lobbyManager.create(req.body as CreateLobbyRequest);
  if ('error' in result) {
    res.status(400).json(result);
  } else {
    res.json(result);
  }
});

app.post('/api/lobby/join', (req, res) => {
  const result = lobbyManager.join(req.body.code, req.body.playerName);
  if ('error' in result) {
    res.status(400).json(result);
  } else {
    res.json(result);
  }
});

app.post('/api/lobby/ready', (req, res) => {
  const result = lobbyManager.ready(req.body.lobbyId, req.body.playerId, req.body.ready);
  if ('error' in result) {
    res.status(400).json(result);
  } else {
    res.json(result);
  }
});

app.post('/api/lobby/start', (req, res) => {
  const result = lobbyManager.start(req.body.lobbyId, req.body.playerId);
  if ('error' in result) {
    res.status(400).json(result);
  } else {
    wsServer.broadcast(`lobby:${req.body.lobbyId}`, { type: 'GAME_STARTED', payload: result });
    res.json(result);
  }
});

app.post('/api/lobby/state', (req, res) => {
  const state = lobbyManager.getState(req.body.lobbyId);
  res.json(state);
});

// ─── Start ───────────────────────────────────────────────
server.listen(config.port, () => {
  console.log(`Server running on http://localhost:${config.port}`);
});

process.on('SIGINT', () => { closeDb(); process.exit(0); });
process.on('SIGTERM', () => { closeDb(); process.exit(0); });

export { app, server, wsServer };
