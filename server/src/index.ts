import express from 'express';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { v4 as uuid } from 'uuid';
import { config } from './config.js';
import { getDb, closeDb } from './db/index.js';
import { LobbyManager } from './lobby/LobbyManager.js';
import { WsServer } from './ws/WsServer.js';
import { setupWsHandlers } from './ws/handlers.js';
import { yahtzeeRouter, createYahtzeeSession } from './games/yahtzee/YahtzeeRouter.js';
import { chatRouter, setWsServer } from './api/chatRouter.js';
import type { CreateLobbyRequest } from './lobby/LobbyManager.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

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

app.get('/api/lan-ip', async (_req, res) => {
  const os = await import('node:os');
  const nets = os.networkInterfaces();
  let ip = 'localhost';
  for (const name of Object.keys(nets)) {
    for (const net of nets[name] || []) {
      if (net.family === 'IPv4' && !net.internal) {
        ip = net.address;
        break;
      }
    }
    if (ip !== 'localhost') break;
  }
  res.json({ ip });
});

// ─── Static Files (Production) ────────────────────────────
const clientDist = path.join(__dirname, '..', '..', 'client', 'dist');
const fs = await import('node:fs');
const hasDist = fs.existsSync(path.join(clientDist, 'index.html'));
if (hasDist) {
  app.use(express.static(clientDist));
}

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
    wsServer.broadcast(`lobby:${result.lobbyId}`, { type: 'LOBBY_UPDATED', payload: { lobby: result.lobby, players: result.players } });
    res.json(result);
  }
});

app.post('/api/lobby/ready', (req, res) => {
  const result = lobbyManager.ready(req.body.lobbyId, req.body.playerId, req.body.ready);
  if ('error' in result) {
    res.status(400).json(result);
  } else {
    wsServer.broadcast(`lobby:${req.body.lobbyId}`, { type: 'LOBBY_UPDATED', payload: result });
    res.json(result);
  }
});

app.post('/api/lobby/start', (req, res) => {
  const result = lobbyManager.start(req.body.lobbyId, req.body.playerId);
  if ('error' in result) {
    res.status(400).json(result);
  } else {
    const playerCount = result.players.length;
    const sessionId = uuid();
    createYahtzeeSession(sessionId, playerCount);
    const payload = {
      ...result,
      sessionId,
      players: result.players.map((p: any, i: number) => ({ id: p.id, name: p.name, index: i })),
    };
    wsServer.broadcast(`lobby:${req.body.lobbyId}`, { type: 'GAME_STARTED', payload });
    res.json(payload);
  }
});

app.post('/api/lobby/state', (req, res) => {
  const state = lobbyManager.getState(req.body.lobbyId);
  res.json(state);
});

// ─── Game Routes ──────────────────────────────────────────
app.use('/api/games/yahtzee', yahtzeeRouter);
app.use('/api/chat', chatRouter);
setWsServer(wsServer);

// ─── SPA Fallback (Production) ────────────────────────────
if (hasDist) {
  app.get('*', (_req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

// ─── Start ───────────────────────────────────────────────
server.listen(config.port, () => {
  console.log(`Server running on http://localhost:${config.port}`);
});

process.on('SIGINT', () => { closeDb(); process.exit(0); });
process.on('SIGTERM', () => { closeDb(); process.exit(0); });

export { app, server, wsServer, lobbyManager };
