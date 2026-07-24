import { Router } from 'express';
import { createGame, handleAction, getValidMoves, type GameState, type GameAction } from './LudoEngine.js';

const sessions = new Map<string, GameState>();
const wsBroadcasts = new Map<string, (payload: any) => void>();

export const ludoRouter = Router();

export function createLudoSession(sessionId: string, playerCount: number): void {
  sessions.set(sessionId, createGame(playerCount, Math.floor(Math.random() * playerCount)));
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
  const state = sessions.get(sessionId)!;
  res.json({
    success: true,
    state: sanitizeState(state, -1),
    currentPlayer: state.currentPlayer,
    phase: state.phase,
    diceValue: state.diceValue,
  });
});

ludoRouter.post('/action', (req, res) => {
  const { sessionId, playerIndex, action } = req.body as { sessionId: string; playerIndex: number; action: GameAction };
  const state = sessions.get(sessionId);
  if (!state) return res.status(404).json({ error: 'Session not found' });

  console.log(`[Ludo] Action: ${action.type} P${playerIndex} (curP=${state.currentPlayer} phase=${state.phase} d=${state.diceValue})`);

  const result = handleAction(state, playerIndex, action);
  if (!result.valid) {
    console.log(`[Ludo] REJECTED: ${result.error}`);
    return res.status(400).json({ error: result.error, state: sanitizeState(state, playerIndex) });
  }

  sessions.set(sessionId, result.state);

  const broadcast = wsBroadcasts.get(sessionId);
  if (broadcast) {
    for (let i = 0; i < result.state.players.length; i++) {
      broadcast({ type: 'GAME_STATE', payload: { ...sanitizeState(result.state, i), _actionPlayer: playerIndex, forPlayerIndex: i } });
    }
    if (action.type === 'ROLL_DICE' || action.type === 'DICE_LANDED') {
      broadcast({ type: 'DICE_EVENT', payload: { action: action.type, playerIndex, value: result.diceValue } });
    }
  }

  const resp = {
    success: true,
    state: sanitizeState(result.state, playerIndex),
    diceValue: result.diceValue,
    validMoves: result.validMoves ?? [],
    events: result.events ?? [],
    rollId: result.rollId ?? null,
    currentPlayer: result.state.currentPlayer,
    phase: result.state.phase,
    isMyTurn: playerIndex === result.state.currentPlayer,
  };
  res.json(resp);
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

  res.json({ success: true, state: sanitizeState(newState, -1) });
});

ludoRouter.get('/state/:sessionId', (req, res) => {
  const state = sessions.get(req.params.sessionId);
  if (!state) return res.status(404).json({ error: 'Session not found' });

  const playerIndex = parseInt(req.query.playerIndex as string) || 0;
  res.json(sanitizeState(state, playerIndex));
});

function sanitizeState(state: GameState, playerIndex: number) {
  const isMyTurn = playerIndex === state.currentPlayer;
  const canMove = isMyTurn && state.phase === 'waiting_for_move' && state.diceValue !== null;
  return {
    players: state.players,
    currentPlayer: state.currentPlayer,
    diceValue: state.diceValue,
    diceRolledBy: state.diceRolledBy,
    rollId: state.rollId,
    phase: state.phase,
    consecutiveSixes: state.consecutiveSixes,
    winner: state.winner,
    isMyTurn,
    validMoves: canMove ? getValidMoves(state, playerIndex) : [],
  };
}
