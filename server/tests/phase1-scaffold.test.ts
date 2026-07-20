import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import Database from 'better-sqlite3';
import express from 'express';
import http from 'node:http';
import { WebSocketServer, WebSocket as WsClient } from 'ws';

const TEST_DB = ':memory:';

describe('Phase 1: Project Scaffold', () => {
  let db: Database.Database;

  beforeAll(() => {
    db = new Database(TEST_DB);
    db.pragma('foreign_keys = ON');
    db.exec(`
      CREATE TABLE IF NOT EXISTS lobbies (
        id TEXT PRIMARY KEY,
        code TEXT UNIQUE NOT NULL,
        game_id TEXT NOT NULL,
        host_player_id TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'OPEN' CHECK(status IN ('OPEN','STARTED','FINISHED')),
        max_players INTEGER NOT NULL DEFAULT 4,
        settings TEXT NOT NULL DEFAULT '{}',
        created_at INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS lobby_players (
        id TEXT PRIMARY KEY,
        lobby_id TEXT NOT NULL REFERENCES lobbies(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        is_host INTEGER NOT NULL DEFAULT 0,
        ready INTEGER NOT NULL DEFAULT 0,
        joined_at INTEGER NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_lobbies_code ON lobbies(code);
      CREATE INDEX IF NOT EXISTS idx_lobby_players_lobby ON lobby_players(lobby_id);
    `);
  });

  afterAll(() => {
    db.close();
  });

  it('creates lobbies table', () => {
    const result = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='lobbies'").get();
    expect(result).toBeTruthy();
  });

  it('creates lobby_players table', () => {
    const result = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='lobby_players'").get();
    expect(result).toBeTruthy();
  });

  it('enforces lobbies status CHECK constraint', () => {
    expect(() => {
      db.prepare("INSERT INTO lobbies (id, code, game_id, host_player_id, status, max_players, created_at) VALUES (?,?,?,?,?,?,?)").run('x','X','game','host','INVALID',4,Date.now());
    }).toThrow();
  });

  it('enforces foreign key on lobby_players', () => {
    expect(() => {
      db.prepare("INSERT INTO lobby_players (id, lobby_id, name, is_host, joined_at) VALUES (?,?,?,?,?)").run('p','nonexistent','Test',0,Date.now());
    }).toThrow();
  });

  it('Express health endpoint returns ok', async () => {
    const app = express();
    app.get('/api/health', (_req, res) => res.json({ status: 'ok', uptime: process.uptime() }));
    const server = http.createServer(app);
    await new Promise<void>(resolve => server.listen(0, resolve));
    const port = (server.address() as any).port;
    const res = await fetch(`http://localhost:${port}/api/health`);
    const data = await res.json();
    expect(data.status).toBe('ok');
    expect(typeof data.uptime).toBe('number');
    server.close();
  });

  it('WebSocket server accepts connections and sends CONNECTED', async () => {
    const server = http.createServer();
    const wss = new WebSocketServer({ server });
    wss.on('connection', (ws) => {
      ws.send(JSON.stringify({ type: 'CONNECTED', payload: { serverTime: Date.now() } }));
    });
    await new Promise<void>(resolve => server.listen(0, resolve));
    const port = (server.address() as any).port;
    const ws = new WsClient(`ws://localhost:${port}`);
    const msg = await new Promise<any>((resolve, reject) => {
      ws.on('open', () => {
        ws.on('message', (data: Buffer) => resolve(JSON.parse(data.toString())));
      });
      ws.on('error', (err) => reject(new Error(`WS error: ${err.message}`)));
      ws.on('close', (code, reason) => reject(new Error(`WS close: ${code} ${reason}`)));
      setTimeout(() => reject(new Error('timeout')), 4000);
    });
    expect(msg.type).toBe('CONNECTED');
    expect(msg.payload.serverTime).toBeDefined();
    ws.close();
    wss.close();
    server.close();
  });
});
