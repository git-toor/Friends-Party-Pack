import express from 'express';
import http from 'node:http';
import { WebSocketServer } from 'ws';
import { config } from './config.js';
import { getDb, closeDb } from './db/index.js';

const app = express();
app.use(express.json());

const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

// ─── Health Check ────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

// ─── WebSocket ───────────────────────────────────────────
wss.on('connection', (ws) => {
  ws.send(JSON.stringify({ type: 'CONNECTED', payload: { serverTime: Date.now() } }));
});

// ─── Start ───────────────────────────────────────────────
server.listen(config.port, () => {
  getDb();
  console.log(`Server running on http://localhost:${config.port}`);
});

process.on('SIGINT', () => { closeDb(); process.exit(0); });
process.on('SIGTERM', () => { closeDb(); process.exit(0); });

export { app, server, wss };
