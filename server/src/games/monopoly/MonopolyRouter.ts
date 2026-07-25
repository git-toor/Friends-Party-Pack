import { Router } from 'express';
import { createGame, handleAction, sanitizeState as engineSanitize, type GameState, type GameAction } from './MonopolyEngine.js';

const sessions = new Map<string, GameState>();
const wsBroadcasts = new Map<string, (payload: any) => void>();

export const monopolyRouter = Router();

export function createMonopolySession(sessionId: string, playerCount: number): void {
  sessions.set(sessionId, createGame(playerCount));
}

export function getMonopolyState(sessionId: string, playerIndex: number) {
  const state = sessions.get(sessionId);
  if (!state) return null;
  return engineSanitize(state, playerIndex);
}

export function setWsBroadcast(sessionId: string, fn: (payload: any) => void): void {
  wsBroadcasts.set(sessionId, fn);
}

monopolyRouter.post('/create', (req, res) => {
  const { sessionId, playerCount } = req.body;
  if (!sessionId || !playerCount || playerCount < 2 || playerCount > 8) {
    return res.status(400).json({ error: 'Player count must be 2-8' });
  }
  createMonopolySession(sessionId, playerCount);
  const state = sessions.get(sessionId)!;
  res.json({
    success: true,
    state: engineSanitize(state, -1),
    currentPlayer: state.currentPlayer,
    phase: state.phase,
  });
});

monopolyRouter.post('/action', (req, res) => {
  const { sessionId, playerIndex, action } = req.body as { sessionId: string; playerIndex: number; action: GameAction };
  const state = sessions.get(sessionId);
  if (!state) return res.status(404).json({ error: 'Session not found' });

  const result = handleAction(state, playerIndex, action);
  if (!result.valid) {
    return res.status(400).json({ error: result.error, state: engineSanitize(state, playerIndex) });
  }

  sessions.set(sessionId, result.state);

  const broadcast = wsBroadcasts.get(sessionId);
  if (broadcast) {
    for (let i = 0; i < result.state.players.length; i++) {
      if (i === playerIndex) continue;
      broadcast({ type: 'GAME_STATE', payload: { ...engineSanitize(result.state, i), _actionPlayer: playerIndex, forPlayerIndex: i, _events: result.events } });
    }
    if (action.type === 'ROLL_DICE' || action.type === 'CONFIRM_DICE') {
      broadcast({ type: 'DICE_EVENT', payload: { action: action.type, playerIndex, diceValue: result.diceValue, diceTotal: result.diceTotal } });
    }
  }

  const resp = {
    success: true,
    state: engineSanitize(result.state, playerIndex),
    diceValue: result.diceValue,
    diceTotal: result.diceTotal,
    validActions: result.validActions ?? [],
    events: result.events ?? [],
    rollId: result.rollId ?? null,
    currentPlayer: result.state.currentPlayer,
    phase: result.state.phase,
    isMyTurn: playerIndex === result.state.currentPlayer,
  };
  res.json(resp);
});

monopolyRouter.post('/rematch', (req, res) => {
  const { sessionId } = req.body;
  const existing = sessions.get(sessionId);
  if (!existing) return res.status(404).json({ error: 'Session not found' });

  const playerCount = existing.players.length;
  const newState = createGame(playerCount);
  sessions.set(sessionId, newState);

  const broadcast = wsBroadcasts.get(sessionId);
  if (broadcast) {
    for (let i = 0; i < newState.players.length; i++) {
      broadcast({ type: 'GAME_STATE', payload: { ...engineSanitize(newState, i), _actionPlayer: -1, forPlayerIndex: i } });
    }
  }

  res.json({ success: true, state: engineSanitize(newState, -1) });
});

monopolyRouter.get('/state/:sessionId', (req, res) => {
  const state = sessions.get(req.params.sessionId);
  if (!state) return res.status(404).json({ error: 'Session not found' });

  const playerIndex = parseInt(req.query.playerIndex as string) || 0;
  res.json(engineSanitize(state, playerIndex));
});
