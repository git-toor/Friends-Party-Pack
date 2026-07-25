import { describe, it, expect, beforeEach } from 'vitest';
import { createGame, handleAction, getValidActions, BOARD, RAILROAD_INDICES, UTILITY_INDICES, type GameState } from '../MonopolyEngine.js';

function rollWithFixedValues(state: GameState, playerIndex: number, v1: number, v2: number) {
  const r = handleAction(state, playerIndex, { type: 'ROLL_DICE' });
  if (!r.valid || !r.rollId) return r;
  return handleAction(state, playerIndex, { type: 'CONFIRM_DICE', payload: { rollId: r.rollId, values: [v1, v2] } });
}

describe('MonopolyEngine', () => {
  let game: GameState;

  beforeEach(() => {
    game = createGame(2, 0);
  });

  // ─── createGame ────────────────────────────────────────

  describe('createGame', () => {
    it('creates correct number of players', () => {
      expect(game.players.length).toBe(2);
      expect(createGame(4, 0).players.length).toBe(4);
      expect(createGame(8, 0).players.length).toBe(8);
    });

    it('each player starts with 1500 money', () => {
      for (const p of game.players) expect(p.money).toBe(1500);
    });

    it('each player starts at position 0', () => {
      for (const p of game.players) expect(p.position).toBe(0);
    });

    it('all properties start unowned with 0 houses', () => {
      for (const prop of game.properties) {
        expect(prop.owner).toBeNull();
        expect(prop.houses).toBe(0);
        expect(prop.mortgaged).toBe(false);
      }
    });

    it('starts in waiting_for_roll phase', () => {
      expect(game.phase).toBe('waiting_for_roll');
    });

    it('no winner at start', () => {
      expect(game.winner).toBeNull();
    });

    it('accepts optional startingPlayer parameter', () => {
      const g = createGame(4, 2);
      expect(g.currentPlayer).toBe(2);
    });

    it('BOARD has 40 spaces with 28 purchasable', () => {
      expect(BOARD.length).toBe(40);
      expect(BOARD.filter(s => s.price !== undefined).length).toBe(28);
    });

    it('BOARD has 4 railroads and 2 utilities', () => {
      expect(RAILROAD_INDICES.length).toBe(4);
      expect(UTILITY_INDICES.length).toBe(2);
    });
  });

  // ─── ROLL_DICE ─────────────────────────────────────────

  describe('ROLL_DICE', () => {
    it('creates roll slot with rollId', () => {
      const r = handleAction(game, 0, { type: 'ROLL_DICE' });
      expect(r.valid).toBe(true);
      expect(r.rollId).toBeTruthy();
      expect(game.phase).toBe('rolling_dice');
      expect(game.dice).toBeNull();
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

    it('rejects when not waiting_for_roll phase', () => {
      game.phase = 'turn_end';
      const r = handleAction(game, 0, { type: 'ROLL_DICE' });
      expect(r.valid).toBe(false);
    });
  });

  // ─── CONFIRM_DICE — Basic ────────────────────────────

  describe('CONFIRM_DICE — basic', () => {
    it('accepts valid dice values', () => {
      const r = handleAction(game, 0, { type: 'ROLL_DICE' });
      const c = handleAction(game, 0, { type: 'CONFIRM_DICE', payload: { rollId: r.rollId, values: [3, 4] } });
      expect(c.valid).toBe(true);
      expect(game.dice).toEqual([3, 4]);
      expect(game.diceTotal).toBe(7);
    });

    it('moves player by diceTotal', () => {
      rollWithFixedValues(game, 0, 3, 4);
      expect(game.players[0].position).toBe(7);
    });

    it('rejects stale rollId', () => {
      const r = handleAction(game, 0, { type: 'ROLL_DICE' });
      game.rollId = 'different-id';
      const c = handleAction(game, 0, { type: 'CONFIRM_DICE', payload: { rollId: r.rollId, values: [3, 4] } });
      expect(c.valid).toBe(false);
    });

    it('rejects rollId mismatch', () => {
      handleAction(game, 0, { type: 'ROLL_DICE' });
      const c = handleAction(game, 0, { type: 'CONFIRM_DICE', payload: { rollId: 'wrong-id', values: [3, 4] } });
      expect(c.valid).toBe(false);
    });

    it('rejects invalid dice values (0, 7, negative)', () => {
      const r2 = handleAction(game, 0, { type: 'ROLL_DICE' });
      const c = handleAction(game, 0, { type: 'CONFIRM_DICE', payload: { rollId: r2.rollId ?? undefined, values: [0, 4] } });
      expect(c.valid).toBe(false);
    });

    it('rejects when not rolling_dice phase', () => {
      const c = handleAction(game, 0, { type: 'CONFIRM_DICE', payload: { values: [3, 4] } });
      expect(c.valid).toBe(false);
    });

    it('rejects from wrong player', () => {
      handleAction(game, 0, { type: 'ROLL_DICE' });
      const c = handleAction(game, 1, { type: 'CONFIRM_DICE', payload: { values: [3, 4] } });
      expect(c.valid).toBe(false);
    });

    it('rejects after game over', () => {
      game.winner = 0;
      const c = handleAction(game, 0, { type: 'CONFIRM_DICE', payload: { values: [3, 4] } });
      expect(c.valid).toBe(false);
    });
  });

  // ─── CONFIRM_DICE — Pass GO ──────────────────────────

  describe('CONFIRM_DICE — Pass GO', () => {
    it('passing GO from pos 38 with roll 3 → pos 1, collect 200', () => {
      game.players[0].position = 38;
      rollWithFixedValues(game, 0, 1, 2);
      expect(game.players[0].position).toBe(1);
      expect(game.players[0].money).toBe(1700);
    });

    it('landing on GO from pos 38 with roll 2 → pos 0, collect 200', () => {
      game.players[0].position = 38;
      rollWithFixedValues(game, 0, 1, 1);
      expect(game.players[0].position).toBe(0);
      expect(game.players[0].money).toBe(1700);
    });

    it('not passing GO (pos 5 + 3 = 8) → no salary', () => {
      game.players[0].position = 5;
      rollWithFixedValues(game, 0, 1, 2);
      expect(game.players[0].position).toBe(8);
      expect(game.players[0].money).toBe(1500);
    });

    it('passing GO event is emitted', () => {
      game.players[0].position = 38;
      const result = rollWithFixedValues(game, 0, 1, 2);
      expect(result.events?.some(e => e.type === 'PASSED_GO')).toBe(true);
    });
  });

  // ─── CONFIRM_DICE — Doubles ─────────────────────────

  describe('CONFIRM_DICE — Doubles', () => {
    it('rolling doubles allows re-roll (phase → waiting_for_roll)', () => {
      // Place player on an unowned property and land on nothing special
      game.players[0].position = 0;
      const result = rollWithFixedValues(game, 0, 1, 1);
      expect(game.doublesCount).toBe(1);
      expect(game.phase).toBe('waiting_for_roll');
    });

    it('two doubles → doublesCount = 2', () => {
      rollWithFixedValues(game, 0, 1, 1);
      expect(game.doublesCount).toBe(1);
      // Player is now at pos 2, on Jugaad. Roll again.
      rollWithFixedValues(game, 0, 2, 2);
      expect(game.doublesCount).toBe(2);
    });

    it('three doubles → goes to jail', () => {
      // Roll 1: [1,1] from 0 → pos 2 (Jugaad, non-buyable) ✓
      rollWithFixedValues(game, 0, 1, 1);
      // Roll 2: [2,2] from 2 → pos 6 (Ghat Road, buyable → need to decline)
      rollWithFixedValues(game, 0, 2, 2);
      // Decline the buyable property to continue (doublesCount=2 still active)
      handleAction(game, 0, { type: 'DECLINE_PROPERTY' });
      // Roll 3: [3,3] from 6 → pos 12 → 3rd double → jail
      const result = rollWithFixedValues(game, 0, 3, 3);
      expect(game.players[0].inJail).toBe(true);
      expect(game.players[0].position).toBe(10);
      expect(game.phase).toBe('turn_end');
    });

    it('non-doubles after doubles resets doublesCount', () => {
      // First: [1,1] (doubles) from 0 → pos 2, phase = waiting_for_roll
      rollWithFixedValues(game, 0, 1, 1);
      // End the turn to clear doubles
      game.phase = 'turn_end';
      handleAction(game, 0, { type: 'END_TURN' });
      // Now player 1's turn. Pass back to player 0.
      game.phase = 'turn_end';
      handleAction(game, 1, { type: 'END_TURN' });
      // Roll non-doubles: [2,3] from 2 → pos 7 (Kismat)
      const result = rollWithFixedValues(game, 0, 2, 3);
      expect(game.doublesCount).toBe(0);
    });

    it('ROLLED_DOUBLES event emitted', () => {
      const result = rollWithFixedValues(game, 0, 1, 1);
      expect(result.events?.some(e => e.type === 'ROLLED_DOUBLES')).toBe(true);
    });

    it('THREE_DOUBLES event emitted on 3rd consecutive double', () => {
      rollWithFixedValues(game, 0, 1, 1);
      rollWithFixedValues(game, 0, 2, 2);
      handleAction(game, 0, { type: 'DECLINE_PROPERTY' }); // handles Ghat Road buyable
      const result = rollWithFixedValues(game, 0, 3, 3);
      expect(result.events?.some(e => e.type === 'THREE_DOUBLES')).toBe(true);
      expect(result.events?.some(e => e.type === 'WENT_TO_JAIL')).toBe(true);
    });
  });

  // ─── CONFIRM_DICE — Landing Resolution ──────────────

  describe('CONFIRM_DICE — Landing Resolution', () => {
    it('unowned property → waiting_for_action, lastAction = can_buy', () => {
      // Land on pos 3 (Hazratganj, unowned brown) from pos 0 with total=3
      rollWithFixedValues(game, 0, 1, 2);
      expect(game.phase).toBe('waiting_for_action');
      expect(game.lastAction).toBe('can_buy');
      expect(game.landedIndex).toBe(3);
    });

    it('owned by other → pay rent, turn_end', () => {
      game.properties[3].owner = 1;
      rollWithFixedValues(game, 0, 1, 2);
      expect(game.phase).toBe('turn_end');
      expect(game.lastAction).toBe('paid_rent');
    });

    it('self-owned property → turn_end', () => {
      game.properties[3].owner = 0;
      rollWithFixedValues(game, 0, 1, 2);
      expect(game.phase).toBe('turn_end');
      expect(game.lastAction).toBe('own_property');
    });

    it('income tax → pay 200, turn_end', () => {
      // Land on pos 4 (Income Tax) from pos 0 with total=4
      rollWithFixedValues(game, 0, 1, 3);
      expect(game.players[0].money).toBe(1300);
      expect(game.phase).toBe('turn_end');
      expect(game.lastAction).toBe('paid_tax');
    });

    it('luxury tax → pay 100', () => {
      // Land on pos 38 (Luxury Tax). Start at pos 30, total = 8
      game.players[0].position = 30;
      rollWithFixedValues(game, 0, 3, 5);
      expect(game.players[0].money).toBe(1400);
      expect(game.phase).toBe('turn_end');
    });

    it('go_to_jail → position 10, inJail, turn_end', () => {
      // Land on pos 30 (Go To Jail). Start at pos 20, total = 10
      game.players[0].position = 20;
      const result = rollWithFixedValues(game, 0, 4, 6);
      expect(game.players[0].position).toBe(10);
      expect(game.players[0].inJail).toBe(true);
      expect(game.phase).toBe('turn_end');
      expect(result.events?.some(e => e.type === 'WENT_TO_JAIL')).toBe(true);
    });

    it('kismat → turn_end, landed_kismat', () => {
      // Land on pos 7 (Kismat). From pos 0, total = 7
      rollWithFixedValues(game, 0, 3, 4);
      expect(game.phase).toBe('turn_end');
      expect(game.lastAction).toBe('landed_kismat');
    });

    it('jugaad → turn_end, landed_jugaad', () => {
      // Land on pos 2 (Jugaad). From pos 39, total = 3 → wraps to 2
      game.players[0].position = 39;
      rollWithFixedValues(game, 0, 1, 2);
      expect(game.phase).toBe('turn_end');
      expect(game.lastAction).toBe('landed_jugaad');
    });

    it('GO (passing) → money collected, no_action (doubles override phase)', () => {
      game.players[0].position = 38;
      rollWithFixedValues(game, 0, 1, 1);
      expect(game.players[0].money).toBe(1700);
      expect(game.lastAction).toBe('no_action');
    });

    it('jail → turn_end (just visiting)', () => {
      // Land on pos 10 (Jail). From pos 0, total = 10
      rollWithFixedValues(game, 0, 4, 6);
      expect(game.phase).toBe('turn_end');
      expect(game.lastAction).toBe('no_action');
    });

    it('free parking → turn_end', () => {
      // Land on pos 20 (Free Parking). From pos 10, total = 10
      game.players[0].position = 10;
      rollWithFixedValues(game, 0, 5, 5); // doubles! Lands on 20
      expect(game.lastAction).toBe('no_action');
    });
  });

  // ─── Jail (Phase 1: auto-pay) ───────────────────────

  describe('Jail', () => {
    it('auto-pays 50 ghoos on roll when in jail', () => {
      game.players[0].inJail = true;
      game.players[0].position = 10;
      game.players[0].money = 1500;
      rollWithFixedValues(game, 0, 2, 3);
      expect(game.players[0].inJail).toBe(false);
      expect(game.players[0].money).toBe(1450);
    });
  });

  // ─── BUY_PROPERTY ─────────────────────────────────────

  describe('BUY_PROPERTY', () => {
    it('deducts price and sets owner', () => {
      game.players[0].position = 3;
      game.phase = 'waiting_for_action';
      game.lastAction = 'can_buy';
      game.landedIndex = 3;
      const r = handleAction(game, 0, { type: 'BUY_PROPERTY' });
      expect(r.valid).toBe(true);
      expect(game.players[0].money).toBe(1440);
      expect(game.properties[3].owner).toBe(0);
    });

    it('BOUGHT_PROPERTY event emitted', () => {
      game.phase = 'waiting_for_action';
      game.lastAction = 'can_buy';
      game.landedIndex = 3;
      const r = handleAction(game, 0, { type: 'BUY_PROPERTY' });
      expect(r.events?.some(e => e.type === 'BOUGHT_PROPERTY')).toBe(true);
    });

    it('rejects if insufficient funds', () => {
      game.players[0].money = 10;
      game.phase = 'waiting_for_action';
      game.lastAction = 'can_buy';
      game.landedIndex = 37;
      const r = handleAction(game, 0, { type: 'BUY_PROPERTY' });
      expect(r.valid).toBe(false);
    });

    it('rejects if property already owned', () => {
      game.properties[3].owner = 1;
      game.phase = 'waiting_for_action';
      game.lastAction = 'can_buy';
      game.landedIndex = 3;
      const r = handleAction(game, 0, { type: 'BUY_PROPERTY' });
      expect(r.valid).toBe(false);
    });

    it('rejects if not can_buy phase', () => {
      game.phase = 'waiting_for_action';
      game.lastAction = 'own_property';
      game.landedIndex = 3;
      const r = handleAction(game, 0, { type: 'BUY_PROPERTY' });
      expect(r.valid).toBe(false);
    });

    it('rejects if not your turn', () => {
      game.phase = 'waiting_for_action';
      game.lastAction = 'can_buy';
      game.landedIndex = 3;
      const r = handleAction(game, 1, { type: 'BUY_PROPERTY' });
      expect(r.valid).toBe(false);
    });

    it('transitions to turn_end after buying', () => {
      game.phase = 'waiting_for_action';
      game.lastAction = 'can_buy';
      game.landedIndex = 3;
      handleAction(game, 0, { type: 'BUY_PROPERTY' });
      expect(game.phase).toBe('turn_end');
    });
  });

  // ─── DECLINE_PROPERTY ─────────────────────────────────

  describe('DECLINE_PROPERTY', () => {
    it('phase = turn_end with no owner change', () => {
      game.phase = 'waiting_for_action';
      game.lastAction = 'can_buy';
      game.landedIndex = 3;
      const r = handleAction(game, 0, { type: 'DECLINE_PROPERTY' });
      expect(r.valid).toBe(true);
      expect(game.phase).toBe('turn_end');
      expect(game.properties[3].owner).toBeNull();
    });

    it('rejects if not can_buy phase', () => {
      game.phase = 'waiting_for_action';
      game.lastAction = 'own_property';
      const r = handleAction(game, 0, { type: 'DECLINE_PROPERTY' });
      expect(r.valid).toBe(false);
    });
  });

  // ─── Pay Rent — Properties ──────────────────────────

  describe('Pay Rent — Properties', () => {
    it('base rent deducted from payer, added to owner', () => {
      game.properties[3].owner = 1;
      const initialP0 = game.players[0].money;
      const initialP1 = game.players[1].money;
      rollWithFixedValues(game, 0, 1, 2); // land on pos 3 (Hazratganj)
      expect(game.players[0].money).toBe(initialP0 - 4);
      expect(game.players[1].money).toBe(initialP1 + 4);
    });

    it('PAID_RENT event with correct amount and toPlayer', () => {
      game.properties[3].owner = 1;
      const result = rollWithFixedValues(game, 0, 1, 2);
      expect(result.events?.some(e => e.type === 'PAID_RENT' && e.amount === 4 && e.toPlayer === 1)).toBe(true);
    });

    it('mortgaged property: rent = 0', () => {
      game.properties[3].owner = 1;
      game.properties[3].mortgaged = true;
      const result = rollWithFixedValues(game, 0, 1, 2);
      expect(game.players[0].money).toBe(1500);
    });
  });

  // ─── Pay Rent — Railroads ──────────────────────────

  describe('Pay Rent — Railroads', () => {
    it('1 railroad: rent 25', () => {
      game.properties[5].owner = 1;
      // Land on pos 5 (Vande Bharat). From pos 0, total = 5
      rollWithFixedValues(game, 0, 2, 3);
      expect(game.players[0].money).toBe(1475);
      expect(game.players[1].money).toBe(1525);
    });

    it('2 railroads: rent 50', () => {
      game.properties[5].owner = 1;
      game.properties[15].owner = 1;
      // Land on pos 15. From pos 10, total = 5
      game.players[0].position = 10;
      rollWithFixedValues(game, 0, 1, 4);
      expect(game.players[0].money).toBe(1450);
      expect(game.players[1].money).toBe(1550);
    });

    it('4 railroads: rent 200', () => {
      [5, 15, 25, 35].forEach(i => game.properties[i].owner = 1);
      // Land on pos 25. From pos 20, total = 5
      game.players[0].position = 20;
      rollWithFixedValues(game, 0, 2, 3);
      expect(game.players[0].money).toBe(1300);
      expect(game.players[1].money).toBe(1700);
    });
  });

  // ─── Pay Rent — Utilities ──────────────────────────

  describe('Pay Rent — Utilities', () => {
    it('1 utility: 4 × diceTotal', () => {
      game.properties[12].owner = 1;
      // Land on pos 12. From pos 0, total = 12
      const result = rollWithFixedValues(game, 0, 6, 6);
      expect(game.players[0].money).toBe(1500 - 4 * 12);
      expect(game.players[1].money).toBe(1500 + 48);
    });

    it('2 utilities: 10 × diceTotal', () => {
      game.properties[12].owner = 1;
      game.properties[28].owner = 1;
      // Land on pos 28. From pos 20, total = 8
      game.players[0].position = 20;
      const result = rollWithFixedValues(game, 0, 4, 4);
      expect(game.players[0].money).toBe(1500 - 10 * 8);
      expect(game.players[1].money).toBe(1500 + 80);
    });
  });

  // ─── Pay Tax ─────────────────────────────────────────

  describe('Pay Tax', () => {
    it('income tax: -200 with PAID_TAX event', () => {
      // Land on pos 4. From pos 0, total = 4
      const result = rollWithFixedValues(game, 0, 1, 3);
      expect(game.players[0].money).toBe(1300);
      expect(result.events?.some(e => e.type === 'PAID_TAX')).toBe(true);
    });

    it('luxury tax: -100', () => {
      // Land on pos 38. From pos 30, total = 8
      game.players[0].position = 30;
      rollWithFixedValues(game, 0, 3, 5);
      expect(game.players[0].money).toBe(1400);
    });
  });

  // ─── Bankruptcy ─────────────────────────────────────

  describe('Bankruptcy', () => {
    it('money < 0 after rent → bankrupt, BANKRUPT event', () => {
      game.players[0].money = 1;
      game.properties[5].owner = 1;
      // Land on RR 5, rent 25, money = 1-25 = -24
      const result = rollWithFixedValues(game, 0, 2, 3);
      expect(game.players[0].bankrupt).toBe(true);
      expect(result.events?.some(e => e.type === 'BANKRUPT')).toBe(true);
    });

    it('bankrupt properties revert to unowned', () => {
      game.properties[3].owner = 0;
      game.properties[1].owner = 0;
      game.players[0].money = 1;
      game.properties[5].owner = 1;
      rollWithFixedValues(game, 0, 2, 3);
      expect(game.players[0].bankrupt).toBe(true);
      expect(game.properties[3].owner).toBeNull();
      expect(game.properties[1].owner).toBeNull();
    });

    it('winner declared when only 1 player remains', () => {
      game.players[0].money = 1;
      game.properties[5].owner = 1;
      const result = rollWithFixedValues(game, 0, 2, 3);
      expect(game.winner).toBe(1);
      expect(result.events?.some(e => e.type === 'PLAYER_WON')).toBe(true);
    });

    it('game over — all actions rejected', () => {
      game.winner = 1;
      const r = handleAction(game, 0, { type: 'ROLL_DICE' });
      expect(r.valid).toBe(false);
    });
  });

  // ─── END_TURN ───────────────────────────────────────

  describe('END_TURN', () => {
    it('advances to next player', () => {
      game.phase = 'turn_end';
      handleAction(game, 0, { type: 'END_TURN' });
      expect(game.currentPlayer).toBe(1);
    });

    it('skips bankrupt players', () => {
      game.players[1].bankrupt = true;
      game.phase = 'turn_end';
      handleAction(game, 0, { type: 'END_TURN' });
      expect(game.currentPlayer).toBe(0);
    });

    it('resets dice state', () => {
      game.phase = 'turn_end';
      game.dice = [3, 4] as [number, number];
      game.diceTotal = 7;
      game.doublesCount = 1;
      game.rollId = 'some-id';
      game.lastAction = 'paid_rent';
      game.landedIndex = 5;
      handleAction(game, 0, { type: 'END_TURN' });
      expect(game.dice).toBeNull();
      expect(game.diceTotal).toBeNull();
      expect(game.doublesCount).toBe(0);
      expect(game.rollId).toBeNull();
      expect(game.lastAction).toBeNull();
      expect(game.landedIndex).toBeNull();
    });

    it('accepts only from turn_end phase', () => {
      const r = handleAction(game, 0, { type: 'END_TURN' });
      expect(r.valid).toBe(false);
    });

    it('rejects if not your turn', () => {
      game.phase = 'turn_end';
      const r = handleAction(game, 1, { type: 'END_TURN' });
      expect(r.valid).toBe(false);
    });

    it('TURN_ENDED event emitted', () => {
      game.phase = 'turn_end';
      const r = handleAction(game, 0, { type: 'END_TURN' });
      expect(r.events?.some(e => e.type === 'TURN_ENDED')).toBe(true);
    });
  });

  // ─── getValidActions ────────────────────────────────

  describe('getValidActions', () => {
    it('waiting_for_roll → [ROLL_DICE]', () => {
      expect(getValidActions(game, 0)).toEqual(['ROLL_DICE']);
    });

    it('waiting_for_action + can_buy → [BUY_PROPERTY, DECLINE_PROPERTY]', () => {
      game.phase = 'waiting_for_action';
      game.lastAction = 'can_buy';
      const actions = getValidActions(game, 0);
      expect(actions).toContain('BUY_PROPERTY');
      expect(actions).toContain('DECLINE_PROPERTY');
    });

    it('turn_end → [END_TURN]', () => {
      game.phase = 'turn_end';
      expect(getValidActions(game, 0)).toEqual(['END_TURN']);
    });

    it('rolling_dice → []', () => {
      game.phase = 'rolling_dice';
      expect(getValidActions(game, 0)).toEqual([]);
    });

    it('game over → []', () => {
      game.winner = 0;
      expect(getValidActions(game, 0)).toEqual([]);
    });

    it('not your turn → []', () => {
      expect(getValidActions(game, 1)).toEqual([]);
    });

    it('bankrupt player → []', () => {
      game.players[0].bankrupt = true;
      expect(getValidActions(game, 0)).toEqual([]);
    });
  });

  // ─── handleAction — Dispatcher ─────────────────────

  describe('handleAction dispatcher', () => {
    it('dispatches ROLL_DICE', () => {
      expect(handleAction(game, 0, { type: 'ROLL_DICE' }).valid).toBe(true);
    });

    it('dispatches CONFIRM_DICE', () => {
      handleAction(game, 0, { type: 'ROLL_DICE' });
      expect(handleAction(game, 0, { type: 'CONFIRM_DICE', payload: { values: [3, 4] } }).valid).toBe(true);
    });

    it('dispatches BUY_PROPERTY', () => {
      game.phase = 'waiting_for_action';
      game.lastAction = 'can_buy';
      game.landedIndex = 3;
      expect(handleAction(game, 0, { type: 'BUY_PROPERTY' }).valid).toBe(true);
    });

    it('dispatches DECLINE_PROPERTY', () => {
      game.phase = 'waiting_for_action';
      game.lastAction = 'can_buy';
      game.landedIndex = 3;
      expect(handleAction(game, 0, { type: 'DECLINE_PROPERTY' }).valid).toBe(true);
    });

    it('dispatches END_TURN', () => {
      game.phase = 'turn_end';
      expect(handleAction(game, 0, { type: 'END_TURN' }).valid).toBe(true);
    });

    it('returns error for unknown action type', () => {
      const r = handleAction(game, 0, { type: 'UNKNOWN' as any });
      expect(r.valid).toBe(false);
      expect(r.error).toContain('Unknown action');
    });
  });

  // ─── State versioning ──────────────────────────────

  describe('State versioning', () => {
    it('_sv increments on every mutation', () => {
      const sv0 = game._sv;
      handleAction(game, 0, { type: 'ROLL_DICE' });
      expect(game._sv).toBe(sv0 + 1);
    });

    it('_sv does not increment on validation failures', () => {
      const sv0 = game._sv;
      handleAction(game, 1, { type: 'ROLL_DICE' });
      expect(game._sv).toBe(sv0);
    });
  });
});
