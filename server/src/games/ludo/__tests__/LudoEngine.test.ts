import { describe, it, expect, beforeEach } from 'vitest';
import { createGame, handleAction, getValidMoves, type GameState, type GameResult } from '../LudoEngine.js';

// Helper: ROLL_DICE + CONFIRM_DICE with a forced value
function rollWithFixedValue(state: GameState, playerIndex: number, value: number): GameResult {
  const r = handleAction(state, playerIndex, { type: 'ROLL_DICE' });
  return handleAction(state, playerIndex, { type: 'CONFIRM_DICE', payload: { rollId: r.rollId, value } });
}

function getAllMoves(state: GameState, playerIndex: number): number[] {
  return getValidMoves(state, playerIndex);
}

describe('LudoEngine', () => {
  let game: GameState;

  beforeEach(() => {
    game = createGame(4);
    // Give player 0 a token on the path so rolls always have valid moves after confirm
    game.players[0].tokens[0] = { state: 'path', progress: 10 };
  });

  // ─── createGame ────────────────────────────────────────

  describe('createGame', () => {
    it('creates correct number of players', () => {
      expect(game.players.length).toBe(4);
      expect(createGame(2).players.length).toBe(2);
    });

    it('each player has 4 tokens in home state', () => {
      const g = createGame(4);
      for (const p of g.players) {
        expect(p.tokens.length).toBe(4);
        for (const t of p.tokens) {
          expect(t.state).toBe('home');
          expect(t.progress).toBe(-1);
        }
      }
    });

    it('starts with player 0 by default', () => {
      expect(game.currentPlayer).toBe(0);
    });

    it('starts in waiting_for_roll phase', () => {
      expect(game.phase).toBe('waiting_for_roll');
    });

    it('no winner at start', () => {
      expect(game.winner).toBeNull();
    });
  });

  // ─── ROLL_DICE ─────────────────────────────────────────

  describe('ROLL_DICE', () => {
    it('creates roll slot with rollId', () => {
      for (let i = 0; i < 20; i++) {
        const g = createGame(4);
        g.players[0].tokens[0] = { state: 'path', progress: 10 };
        const r = handleAction(g, 0, { type: 'ROLL_DICE' });
        expect(r.valid).toBe(true);
        expect(r.rollId).toBeTruthy();
        expect(r.diceValue).toBeUndefined();
        expect(g.phase).toBe('rolling_dice');
        expect(g.diceValue).toBeNull();
      }
    });

    it('rejects from non-current player', () => {
      const r = handleAction(game, 1, { type: 'ROLL_DICE' });
      expect(r.valid).toBe(false);
    });

    it('rejects double roll', () => {
      handleAction(game, 0, { type: 'ROLL_DICE' });
      const r = handleAction(game, 0, { type: 'ROLL_DICE' });
      expect(r.valid).toBe(false);
    });

    it('rejects after game over', () => {
      game.winner = 0;
      const r = handleAction(game, 0, { type: 'ROLL_DICE' });
      expect(r.valid).toBe(false);
    });
  });

  // ─── CONFIRM_DICE ─────────────────────────────────────

  describe('CONFIRM_DICE', () => {
    it('transitions to waiting_for_move when valid moves exist', () => {
      const r = handleAction(game, 0, { type: 'ROLL_DICE' });
      const c = handleAction(game, 0, { type: 'CONFIRM_DICE', payload: { rollId: r.rollId, value: 4 } });
      expect(c.valid).toBe(true);
      expect(game.phase).toBe('waiting_for_move');
      expect(game.diceValue).toBe(4);
    });

    it('transitions to waiting_for_move even when no valid moves', () => {
      game.players[0].tokens[0] = { state: 'home', progress: -1 };
      const r = handleAction(game, 0, { type: 'ROLL_DICE' });
      const c = handleAction(game, 0, { type: 'CONFIRM_DICE', payload: { rollId: r.rollId, value: 3 } });
      expect(c.valid).toBe(true);
      expect(game.phase).toBe('waiting_for_move');
      expect(c.validMoves?.length).toBe(0);
    });

    it('rejects if phase is not rolling_dice', () => {
      const c = handleAction(game, 0, { type: 'CONFIRM_DICE', payload: { rollId: 'x', value: 4 } });
      expect(c.valid).toBe(false);
    });

    it('rejects invalid dice value', () => {
      const r = handleAction(game, 0, { type: 'ROLL_DICE' });
      const c = handleAction(game, 0, { type: 'CONFIRM_DICE', payload: { rollId: r.rollId, value: 0 } });
      expect(c.valid).toBe(false);
    });

    it('penalizes three consecutive sixes', () => {
      rollWithFixedValue(game, 0, 6);
      handleAction(game, 0, { type: 'MOVE_TOKEN', payload: { tokenIndex: 1 } });
      rollWithFixedValue(game, 0, 6);
      expect(game.currentPlayer).toBe(1);
      expect(game.phase).toBe('waiting_for_roll');
    });
  });

  // ─── END_TURN ─────────────────────────────────────────

  describe('END_TURN', () => {
    it('advances to next player', () => {
      game.players[0].tokens[0] = { state: 'home', progress: -1 };
      const r = handleAction(game, 0, { type: 'ROLL_DICE' });
      handleAction(game, 0, { type: 'CONFIRM_DICE', payload: { rollId: r.rollId, value: 3 } });
      const e = handleAction(game, 0, { type: 'END_TURN' });
      expect(e.valid).toBe(true);
      expect(game.currentPlayer).toBe(1);
      expect(game.phase).toBe('waiting_for_roll');
      expect(game.diceValue).toBeNull();
    });

    it('rejects end turn when not your turn', () => {
      const e = handleAction(game, 1, { type: 'END_TURN' });
      expect(e.valid).toBe(false);
    });

    it('rejects end turn during rolling_dice', () => {
      handleAction(game, 0, { type: 'ROLL_DICE' });
      const e = handleAction(game, 0, { type: 'END_TURN' });
      expect(e.valid).toBe(false);
    });
  });

  // ─── MOVE_TOKEN — Home to Path ─────────────────────────

  describe('MOVE_TOKEN — Home to Path', () => {
    it('requires 6 to leave home', () => {
      // Token 0 already on path, use token 1 which is home
      rollWithFixedValue(game, 0, 3);
      const r = handleAction(game, 0, { type: 'MOVE_TOKEN', payload: { tokenIndex: 1 } });
      expect(r.valid).toBe(false);
    });

    it('allows home→path on 6', () => {
      rollWithFixedValue(game, 0, 6);
      const r = handleAction(game, 0, { type: 'MOVE_TOKEN', payload: { tokenIndex: 1 } });
      expect(r.valid).toBe(true);
      expect(game.players[0].tokens[1].state).toBe('path');
      expect(game.players[0].tokens[1].progress).toBe(0);
    });

    it('rejects move from wrong player after roll', () => {
      rollWithFixedValue(game, 0, 6);
      const r = handleAction(game, 1, { type: 'MOVE_TOKEN', payload: { tokenIndex: 1 } });
      expect(r.valid).toBe(false);
    });

    it('fires TOKEN_MOVED event on home exit', () => {
      rollWithFixedValue(game, 0, 6);
      const r = handleAction(game, 0, { type: 'MOVE_TOKEN', payload: { tokenIndex: 1 } });
      expect(r.events?.some(e => e.type === 'TOKEN_MOVED')).toBe(true);
    });
  });

  // ─── MOVE_TOKEN — Path movement ────────────────────────

  describe('MOVE_TOKEN — Path movement', () => {
    it('advances progress by dice value', () => {
      game.players[0].tokens[0] = { state: 'path', progress: 10 };
      rollWithFixedValue(game, 0, 4);
      handleAction(game, 0, { type: 'MOVE_TOKEN', payload: { tokenIndex: 0 } });
      expect(game.players[0].tokens[0].progress).toBe(14);
    });

    it('rejects move when no valid tokens after roll', () => {
      game.players[0].tokens[0] = { state: 'stretch', progress: 56 };
      rollWithFixedValue(game, 0, 5);
      const moves = getAllMoves(game, 0);
      expect(moves.length).toBe(0);
    });

    it('auto-enters home stretch at progress 52', () => {
      game.players[0].tokens[0] = { state: 'path', progress: 49 };
      rollWithFixedValue(game, 0, 3);
      handleAction(game, 0, { type: 'MOVE_TOKEN', payload: { tokenIndex: 0 } });
      expect(game.players[0].tokens[0].state).toBe('stretch');
      expect(game.players[0].tokens[0].progress).toBe(52);
    });

    it('finishes token with exact roll to 57', () => {
      game.players[0].tokens[0] = { state: 'stretch', progress: 54 };
      rollWithFixedValue(game, 0, 3);
      const r = handleAction(game, 0, { type: 'MOVE_TOKEN', payload: { tokenIndex: 0 } });
      expect(r.valid).toBe(true);
      expect(game.players[0].tokens[0].state).toBe('finished');
      expect(game.players[0].tokens[0].progress).toBe(57);
      expect(game.players[0].finishedCount).toBe(1);
      expect(r.events?.some(e => e.type === 'TOKEN_FINISHED')).toBe(true);
    });

    it('rejects overshoot beyond 57', () => {
      game.players[0].tokens[0] = { state: 'stretch', progress: 55 };
      rollWithFixedValue(game, 0, 5);
      const r = handleAction(game, 0, { type: 'MOVE_TOKEN', payload: { tokenIndex: 0 } });
      expect(r.valid).toBe(false);
    });

    it('captures opponent token on non-safe square', () => {
      game.players[0].tokens[0] = { state: 'path', progress: 5 };
      game.players[1].tokens[0] = { state: 'path', progress: 46 };
      rollWithFixedValue(game, 0, 2);
      const r = handleAction(game, 0, { type: 'MOVE_TOKEN', payload: { tokenIndex: 0 } });
      expect(r.valid).toBe(true);
      expect(game.players[1].tokens[0].state).toBe('home');
      expect(game.players[1].tokens[0].progress).toBe(-1);
      expect(r.events?.some(e => e.type === 'CAPTURE')).toBe(true);
    });

    it('does not capture on safe square', () => {
      game.players[0].tokens[0] = { state: 'path', progress: 11 };
      game.players[1].tokens[0] = { state: 'path', progress: 0 };
      rollWithFixedValue(game, 0, 2);
      handleAction(game, 0, { type: 'MOVE_TOKEN', payload: { tokenIndex: 0 } });
      expect(game.players[1].tokens[0].state).toBe('path');
    });

    it('captures opponent on path move', () => {
      game.players[0].tokens[0] = { state: 'path', progress: 3 };
      game.players[1].tokens[0] = { state: 'path', progress: 9 };
      rollWithFixedValue(game, 0, 5);
      const r = handleAction(game, 0, { type: 'MOVE_TOKEN', payload: { tokenIndex: 0 } });
      expect(r.valid).toBe(true);
      expect(game.players[1].tokens[0].state).toBe('path');
    });
  });

  // ─── Blocks ────────────────────────────────────────────

  describe('Blocks', () => {
    it('cannot pass through opponent block', () => {
      // P1 (Red, offset 13) has 2 tokens at abs 5 (progress 44)
      game.players[1].tokens[0] = { state: 'path', progress: 44 };
      game.players[1].tokens[1] = { state: 'path', progress: 44 };
      // P0 (Blue, offset 0) at progress 3 (abs 3), rolls 3 → would pass through abs 4,5,6
      game.players[0].tokens[0] = { state: 'path', progress: 3 };
      rollWithFixedValue(game, 0, 3);
      const moves = getAllMoves(game, 0);
      expect(moves.length).toBe(0);
    });

    it('can land on own block (stack)', () => {
      game.players[0].tokens[0] = { state: 'path', progress: 3 };
      game.players[0].tokens[1] = { state: 'path', progress: 5 };
      rollWithFixedValue(game, 0, 2);
      const moves = getAllMoves(game, 0);
      expect(moves).toContain(0);
    });

    it('can land on safe square occupied by opponent', () => {
      game.players[1].tokens[0] = { state: 'path', progress: 47 };
      game.players[0].tokens[0] = { state: 'path', progress: 6 };
      rollWithFixedValue(game, 0, 2);
      const r = handleAction(game, 0, { type: 'MOVE_TOKEN', payload: { tokenIndex: 0 } });
      expect(r.valid).toBe(true);
      expect(game.players[1].tokens[0].state).toBe('path');
    });

    it('fires BLOCK_FORMED event when block created', () => {
      game.players[0].tokens[0] = { state: 'path', progress: 5 };
      game.players[0].tokens[1] = { state: 'path', progress: 3 };
      rollWithFixedValue(game, 0, 2);
      const r = handleAction(game, 0, { type: 'MOVE_TOKEN', payload: { tokenIndex: 1 } });
      if (r.events) {
        expect(r.events.some(e => e.type === 'BLOCK_FORMED')).toBe(true);
      }
    });
  });

  // ─── Turn advancement ──────────────────────────────────

  describe('Turn advancement', () => {
    it('non-6 requires End Turn after move', () => {
      game.players[0].tokens[0] = { state: 'path', progress: 10 };
      rollWithFixedValue(game, 0, 3);
      handleAction(game, 0, { type: 'MOVE_TOKEN', payload: { tokenIndex: 0 } });
      expect(game.currentPlayer).toBe(0);
      expect(game.phase).toBe('waiting_for_roll');
      // Must end turn explicitly
      handleAction(game, 0, { type: 'END_TURN' });
      expect(game.currentPlayer).toBe(1);
      expect(game.phase).toBe('waiting_for_roll');
    });

    it('6 grants bonus turn (phase=waiting_for_roll after move)', () => {
      rollWithFixedValue(game, 0, 6);
      handleAction(game, 0, { type: 'MOVE_TOKEN', payload: { tokenIndex: 1 } });
      expect(game.currentPlayer).toBe(0);
      expect(game.phase).toBe('waiting_for_roll');
    });

    it('no valid moves requires End Turn to advance', () => {
      game.players[0].tokens[0] = { state: 'home', progress: -1 };
      const r = handleAction(game, 0, { type: 'ROLL_DICE' });
      handleAction(game, 0, { type: 'CONFIRM_DICE', payload: { rollId: r.rollId, value: 3 } });
      expect(game.currentPlayer).toBe(0);
      expect(game.phase).toBe('waiting_for_move');
      handleAction(game, 0, { type: 'END_TURN' });
      expect(game.currentPlayer).toBe(1);
      expect(game.phase).toBe('waiting_for_roll');
    });

    it('turn advances after End Turn following bonus roll without a 6', () => {
      rollWithFixedValue(game, 0, 6);
      handleAction(game, 0, { type: 'MOVE_TOKEN', payload: { tokenIndex: 1 } });
      rollWithFixedValue(game, 0, 3);
      handleAction(game, 0, { type: 'MOVE_TOKEN', payload: { tokenIndex: 0 } });
      expect(game.currentPlayer).toBe(0);
      // Must end turn explicitly
      handleAction(game, 0, { type: 'END_TURN' });
      expect(game.currentPlayer).toBe(1);
    });
  });

  // ─── Three consecutive sixes ───────────────────────────

  describe('Three consecutive sixes', () => {
    it('loses turn on three consecutive sixes', () => {
      game.players[0].tokens[0] = { state: 'path', progress: 10 };
      rollWithFixedValue(game, 0, 6);
      handleAction(game, 0, { type: 'MOVE_TOKEN', payload: { tokenIndex: 1 } });
      rollWithFixedValue(game, 0, 6);
      expect(game.currentPlayer).toBe(1);
      expect(game.phase).toBe('waiting_for_roll');
    });
  });

  // ─── Win condition ─────────────────────────────────────

  describe('Win condition', () => {
    it('declares winner when all 4 tokens finished', () => {
      const g = createGame(4);
      for (let i = 0; i < 3; i++) {
        g.players[0].tokens[i] = { state: 'finished', progress: 57 };
      }
      g.players[0].finishedCount = 3;
      g.players[0].tokens[3] = { state: 'stretch', progress: 56 };
      g.players[1].tokens[0] = { state: 'path', progress: 10 };
      rollWithFixedValue(g, 0, 1);
      handleAction(g, 0, { type: 'MOVE_TOKEN', payload: { tokenIndex: 3 } });
      expect(g.winner).toBe(0);
    });

    it('rejects actions after game over', () => {
      game.winner = 0;
      const r = handleAction(game, 0, { type: 'ROLL_DICE' });
      expect(r.valid).toBe(false);
    });
  });

  // ─── getValidMoves ─────────────────────────────────────

  describe('getValidMoves', () => {
    it('returns empty when not your turn', () => {
      const moves = getAllMoves(game, 1);
      expect(moves.length).toBe(0);
    });

    it('returns empty when in waiting_for_roll phase', () => {
      const moves = getAllMoves(game, 0);
      expect(moves.length).toBe(0);
    });

    it('returns token indices for home→path on 6', () => {
      game.players[0].tokens[0] = { state: 'home', progress: -1 };
      const r = handleAction(game, 0, { type: 'ROLL_DICE' });
      handleAction(game, 0, { type: 'CONFIRM_DICE', payload: { rollId: r.rollId, value: 6 } });
      const moves = getAllMoves(game, 0);
      expect(moves.length).toBe(4);
    });

    it('returns only movable path tokens', () => {
      game.players[0].tokens[0] = { state: 'path', progress: 10 };
      game.players[0].tokens[1] = { state: 'stretch', progress: 56 };
      game.players[0].tokens[2] = { state: 'finished', progress: 57 };
      const r = handleAction(game, 0, { type: 'ROLL_DICE' });
      handleAction(game, 0, { type: 'CONFIRM_DICE', payload: { rollId: r.rollId, value: 3 } });
      const moves = getAllMoves(game, 0);
      expect(moves).toEqual([0]);
    });

    it('returns empty when no valid moves after roll', () => {
      game.players[0].tokens[0] = { state: 'stretch', progress: 56 };
      const r = handleAction(game, 0, { type: 'ROLL_DICE' });
      handleAction(game, 0, { type: 'CONFIRM_DICE', payload: { rollId: r.rollId, value: 5 } });
      const moves = getAllMoves(game, 0);
      expect(moves.length).toBe(0);
    });
  });

  // ─── 4-Player game ─────────────────────────────────────

  describe('4-player game', () => {
    it('creates 4 players', () => {
      const g = createGame(4);
      expect(g.players.length).toBe(4);
    });

    it('correct player offsets', () => {
      const g = createGame(4);
      g.players[0].tokens[0] = { state: 'path', progress: 0 };
      g.players[1].tokens[0] = { state: 'path', progress: 0 };
      g.players[2].tokens[0] = { state: 'path', progress: 0 };
      g.players[3].tokens[0] = { state: 'path', progress: 0 };
    });
  });

  // ─── Events ────────────────────────────────────────────

  describe('Events', () => {
    it('emits TOKEN_MOVED on path movement', () => {
      game.players[0].tokens[0] = { state: 'path', progress: 10 };
      rollWithFixedValue(game, 0, 3);
      const r = handleAction(game, 0, { type: 'MOVE_TOKEN', payload: { tokenIndex: 0 } });
      expect(r.events?.some(e => e.type === 'TOKEN_MOVED')).toBe(true);
    });

    it('emits TOKEN_FINISHED when reaching 57', () => {
      game.players[0].tokens[0] = { state: 'stretch', progress: 54 };
      rollWithFixedValue(game, 0, 3);
      const r = handleAction(game, 0, { type: 'MOVE_TOKEN', payload: { tokenIndex: 0 } });
      expect(r.events?.some(e => e.type === 'TOKEN_FINISHED')).toBe(true);
    });
  });
});
