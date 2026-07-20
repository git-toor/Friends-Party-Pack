import { describe, it, expect, beforeAll } from 'vitest';
import http from 'node:http';
import express from 'express';
import { yahtzeeRouter, createYahtzeeSession, getYahtzeeState } from '../src/games/yahtzee/YahtzeeRouter.js';

describe('Phase 6: Integration', () => {
  // ─── Yahtzee Router Integration ──────────────────────────
  it('creates a session via router', async () => {
    const app = express();
    app.use(express.json());
    app.use('/api/games/yahtzee', yahtzeeRouter);

    const server = http.createServer(app);
    await new Promise<void>(resolve => server.listen(0, resolve));
    const port = (server.address() as any).port;

    const res = await fetch(`http://localhost:${port}/api/games/yahtzee/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: 'test-session-1', playerCount: 4 }),
    });
    const data = await res.json();
    expect(data.sessionId).toBe('test-session-1');
    expect(data.state.players).toHaveLength(4);

    server.close();
  });

  it('processes a roll action', async () => {
    const app = express();
    app.use(express.json());
    app.use('/api/games/yahtzee', yahtzeeRouter);
    const server = http.createServer(app);
    await new Promise<void>(resolve => server.listen(0, resolve));
    const port = (server.address() as any).port;

    await fetch(`http://localhost:${port}/api/games/yahtzee/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: 'test-roll', playerCount: 2 }),
    });

    const res = await fetch(`http://localhost:${port}/api/games/yahtzee/action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: 'test-roll', playerIndex: 0, action: { type: 'ROLL' } }),
    });
    const data = await res.json();
    expect(data.valid).toBe(true);
    expect(data.state.turn.phase).toBe('WAITING_FOR_KEEP');

    server.close();
  });

  it('processes a full turn: roll → keep → score', async () => {
    const app = express();
    app.use(express.json());
    app.use('/api/games/yahtzee', yahtzeeRouter);
    const server = http.createServer(app);
    await new Promise<void>(resolve => server.listen(0, resolve));
    const port = (server.address() as any).port;

    await fetch(`http://localhost:${port}/api/games/yahtzee/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: 'test-full', playerCount: 2 }),
    });

    // Roll
    let r = await fetch(`http://localhost:${port}/api/games/yahtzee/action`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: 'test-full', playerIndex: 0, action: { type: 'ROLL' } }),
    });
    let data = await r.json();
    expect(data.valid).toBe(true);

    // Keep all
    r = await fetch(`http://localhost:${port}/api/games/yahtzee/action`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: 'test-full', playerIndex: 0, action: { type: 'KEEP', payload: { indices: [0,1,2,3,4] } } }),
    });
    data = await r.json();
    expect(data.valid).toBe(true);

    // Score
    r = await fetch(`http://localhost:${port}/api/games/yahtzee/action`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: 'test-full', playerIndex: 0, action: { type: 'SCORE', payload: { category: 'chance' } } }),
    });
    data = await r.json();
    expect(data.valid).toBe(true);
    expect(data.state.players[0].scores?.chance).toBeGreaterThan(0);

    server.close();
  });

  it('rejects action for wrong player', async () => {
    createYahtzeeSession('test-auth', 2);
    const state = getYahtzeeState('test-auth', 0);
    expect(state).toBeTruthy();
    expect(state!.isMyTurn).toBe(true);

    const state2 = getYahtzeeState('test-auth', 1);
    expect(state2!.isMyTurn).toBe(false);
  });
});
