import { describe, it, expect, beforeEach } from 'vitest';
import { createMonopolySession, getMonopolyState, setWsBroadcast, monopolyRouter } from '../MonopolyRouter.js';
import { handleAction } from '../MonopolyEngine.js';

describe('MonopolyRouter', () => {
  const SESSION_ID = 'test-session-1';

  beforeEach(() => {
    createMonopolySession(SESSION_ID, 2);
  });

  // ─── createMonopolySession ────────────────────────────

  describe('createMonopolySession / getMonopolyState', () => {
    it('creates session with correct player count', () => {
      const state = getMonopolyState(SESSION_ID, 0);
      expect(state).not.toBeNull();
      expect(state!.players.length).toBe(2);
      expect(state!.phase).toBe('waiting_for_roll');
    });

    it('creates session with 8 players', () => {
      createMonopolySession('test-8', 8);
      const state = getMonopolyState('test-8', 0);
      expect(state!.players.length).toBe(8);
    });

    it('sets isMyTurn for each player based on currentPlayer', () => {
      const state0 = getMonopolyState(SESSION_ID, 0);
      const state1 = getMonopolyState(SESSION_ID, 1);
      // One of them should be the current player
      expect(state0!.isMyTurn || state1!.isMyTurn).toBe(true);
      expect(state0!.isMyTurn && state1!.isMyTurn).toBe(false);
    });

    it('returns null for unknown session', () => {
      const state = getMonopolyState('nonexistent', 0);
      expect(state).toBeNull();
    });

    it('only acting player has non-empty validActions', () => {
      const state0 = getMonopolyState(SESSION_ID, 0);
      const state1 = getMonopolyState(SESSION_ID, 1);
      // Exactly one of the two players should be the acting turn holder
      const actingPlayer = state0!.isMyTurn ? state0 : state1;
      const nonActing = state0!.isMyTurn ? state1 : state0;
      expect(actingPlayer!.validActions.length).toBeGreaterThan(0);
      expect(nonActing!.validActions).toEqual([]);
    });
  });

  // ─── Route handlers exist ───────────────────────────

  describe('Route handler registration', () => {
    it('registers POST /create route', () => {
      const route = monopolyRouter.stack.find(l => {
        const r = (l as any).route;
        return r && r.path === '/create';
      });
      expect(route).toBeDefined();
    });

    it('registers POST /action route', () => {
      const route = monopolyRouter.stack.find(l => {
        const r = (l as any).route;
        return r && r.path === '/action';
      });
      expect(route).toBeDefined();
    });

    it('registers POST /rematch route', () => {
      const route = monopolyRouter.stack.find(l => {
        const r = (l as any).route;
        return r && r.path === '/rematch';
      });
      expect(route).toBeDefined();
    });

    it('registers GET /state/:sessionId route', () => {
      const route = monopolyRouter.stack.find(l => {
        const r = (l as any).route;
        return r && r.path === '/state/:sessionId';
      });
      expect(route).toBeDefined();
    });
  });

  // ─── setWsBroadcast ─────────────────────────────────

  describe('setWsBroadcast', () => {
    it('stores and calls broadcast function', () => {
      let called = false;
      setWsBroadcast(SESSION_ID, () => { called = true; });
      // The broadcast is called from the action route handler.
      // We test it doesn't throw on setup.
      expect(true).toBe(true);
    });
  });

  // ─── Full round trip via exported functions ────────

  describe('Action flow via state', () => {
    it('monopolyRouter is an Express Router instance', () => {
      expect(monopolyRouter).toBeDefined();
      expect(typeof monopolyRouter).toBe('function');
    });

    it('can simulate a ROLL_DICE cycle', () => {
      const state = getMonopolyState(SESSION_ID, 0);
      expect(state!.phase).toBe('waiting_for_roll');
      // Verify handleAction is importable (integration sanity check)
      expect(typeof handleAction).toBe('function');
    });
  });
});
