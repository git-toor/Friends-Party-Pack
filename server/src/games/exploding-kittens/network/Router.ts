import { Router } from 'express';

const sessions = new Map<string, any>();
const wsBroadcasts = new Map<string, (payload: any) => void>();
const gameStates = new Map<string, any>(); // sessionId -> GameState
const gameStateBySession = new Map<string, any>();

import { createGame, handleAction } from '../engine/GameEngine.js';
import { serializeState } from '../state/Serializer.js';

export const explodingKittensRouter = Router();

export function createExplodingKittensSession(sessionId: string, playerCount: number, settings?: Record<string, unknown>): void {
  const gameState = createGame({
    playerCount,
    ...(settings || {}),
  } as any);
  gameStateBySession.set(sessionId, gameState);
  sessions.set(sessionId, { playerCount, settings });
}

export function getExplodingKittensState(sessionId: string, playerIndex: number): any {
  const state = gameStateBySession.get(sessionId);
  if (!state) return null;
  return serializeState(state, playerIndex);
}

export function setWsBroadcast(sessionId: string, fn: (payload: any) => void): void {
  wsBroadcasts.set(sessionId, fn);
}

explodingKittensRouter.post('/create', (req, res) => {
  const { sessionId, playerCount } = req.body;
  if (playerCount < 2 || playerCount > 9) {
    return res.status(400).json({ error: 'Player count must be 2-9' });
  }
  createExplodingKittensSession(sessionId, playerCount);
  res.json({ sessionId, state: serializeState(gameStateBySession.get(sessionId)!, -1) });
});

explodingKittensRouter.post('/action', (req, res) => {
  const { sessionId, playerIndex, action } = req.body;
  const state = gameStateBySession.get(sessionId);
  if (!state) return res.status(404).json({ error: 'Session not found' });

  const result = handleAction(state, playerIndex, action.type, action.payload);
  if (!result.valid) return res.status(400).json({ error: result.error });

  gameStateBySession.set(sessionId, result.state);

  const broadcast = wsBroadcasts.get(sessionId);
  if (broadcast) {
    for (let i = 0; i < result.state.players.length; i++) {
      broadcast({
        type: 'GAME_STATE',
        payload: { ...serializeState(result.state, i), _actionPlayer: playerIndex, forPlayerIndex: i },
      });
    }
  }

  res.json({ valid: true, state: serializeState(result.state, playerIndex) });
});

explodingKittensRouter.get('/state/:sessionId', (req, res) => {
  const state = gameStateBySession.get(req.params.sessionId);
  if (!state) return res.status(404).json({ error: 'Session not found' });
  const playerIndex = parseInt(req.query.playerIndex as string) || 0;
  res.json(serializeState(state, playerIndex));
});

explodingKittensRouter.post('/rematch', (req, res) => {
  const { sessionId } = req.body;
  const existing = sessions.get(sessionId);
  if (!existing) return res.status(404).json({ error: 'Session not found' });

  const playerCount = existing.playerCount;
  const newState = createGame({ playerCount, ...(existing.settings || {}) } as any);
  gameStateBySession.set(sessionId, newState);

  const broadcast = wsBroadcasts.get(sessionId);
  if (broadcast) {
    for (let i = 0; i < newState.players.length; i++) {
      broadcast({ type: 'GAME_STATE', payload: { ...serializeState(newState, i), _actionPlayer: -1, forPlayerIndex: i } });
    }
  }

  res.json({ state: serializeState(newState, -1) });
});
