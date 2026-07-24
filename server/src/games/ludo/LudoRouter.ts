import { Router } from 'express';
import { createGame, handleAction, getValidMoves, type GameState, type GameAction } from './LudoEngine.js';

const sessions = new Map<string, GameState>();
const wsBroadcasts = new Map<string, (payload: any) => void>();

export const ludoRouter = Router();

export function createLudoSession(sessionId: string, playerCount: number): void {
  sessions.set(sessionId, createGame(playerCount));
}

export function getLudoState(sessionId: string, playerIndex: number) {
  const state = sessions.get(sessionId);
  if (!state) return null;
  return sanitizeState(state, playerIndex);
}

export function setWsBroadcast(sessionId: string, fn: (payload: any) => void): void {
  wsBroadcasts.set(sessionId, fn);
}

ludoRouter.post('/create', (req, res) => {
  const { sessionId, playerCount } = req.body;
  if (playerCount < 2 || playerCount > 4) {
    return res.status(400).json({ error: 'Player count must be 2-4' });
  }
  createLudoSession(sessionId, playerCount);
  res.json({ sessionId, state: sanitizeState(sessions.get(sessionId)!, -1) });
});

ludoRouter.post('/action', (req, res) => {
  const { sessionId, playerIndex, action } = req.body as { sessionId: string; playerIndex: number; action: GameAction };
  const state = sessions.get(sessionId);
  if (!state) return res.status(404).json({ error: 'Session not found' });

  const result = handleAction(state, playerIndex, action);
  if (!result.valid) return res.status(400).json({ error: result.error });

  sessions.set(sessionId, result.state);

  const broadcast = wsBroadcasts.get(sessionId);
  if (broadcast) {
    for (let i = 0; i < result.state.players.length; i++) {
      broadcast({ type: 'GAME_STATE', payload: { ...sanitizeState(result.state, i), _actionPlayer: playerIndex, forPlayerIndex: i } });
    }
    if (action.type === 'ROLL_DICE') {
      broadcast({ type: 'DICE_ROLL', payload: { playerIndex, value: result.diceValue } });
    }
  }

  res.json({ valid: true, state: sanitizeState(result.state, playerIndex), diceValue: result.diceValue, events: result.events });
});

ludoRouter.post('/rematch', (req, res) => {
  const { sessionId } = req.body;
  const existing = sessions.get(sessionId);
  if (!existing) return res.status(404).json({ error: 'Session not found' });

  const playerCount = existing.players.length;
  const newState = createGame(playerCount);
  sessions.set(sessionId, newState);

  const broadcast = wsBroadcasts.get(sessionId);
  if (broadcast) {
    for (let i = 0; i < newState.players.length; i++) {
      broadcast({ type: 'GAME_STATE', payload: { ...sanitizeState(newState, i), _actionPlayer: -1, forPlayerIndex: i } });
    }
  }

  res.json({ state: sanitizeState(newState, -1) });
});

ludoRouter.get('/state/:sessionId', (req, res) => {
  const state = sessions.get(req.params.sessionId);
  if (!state) return res.status(404).json({ error: 'Session not found' });

  const playerIndex = parseInt(req.query.playerIndex as string) || 0;
  res.json(sanitizeState(state, playerIndex));
});

function sanitizeState(state: GameState, playerIndex: number) {
  return {
    players: state.players,
    currentPlayer: state.currentPlayer,
    diceValue: state.diceValue,
    phase: state.phase,
    consecutiveSixes: state.consecutiveSixes,
    winner: state.winner,
    isMyTurn: playerIndex === state.currentPlayer,
    validMoves: playerIndex === state.currentPlayer && state.phase === 'moving' && state.diceValue !== null
      ? getValidMoves(state, playerIndex)
      : [],
  };
}
