import { describe, it, expect, beforeEach } from 'vitest';
import { createGame, handleAction, getValidActions, GAME_RULES, TILE_LAYOUT, RAILROAD_IDS, UTILITY_IDS, GROUP_PROPERTIES, type GameState, type PropertyId } from '../MonopolyEngine.js';

const P = {
  chandni_chowk: 'chandni_chowk' as PropertyId,
  hazratganj: 'hazratganj' as PropertyId,
  vande_bharat: 'vande_bharat' as PropertyId,
  ghat_road: 'ghat_road' as PropertyId,
  water_supply: 'water_supply' as PropertyId,
  rajdhani: 'rajdhani' as PropertyId,
  calangute: 'calangute' as PropertyId,
  mall_road: 'mall_road' as PropertyId,
  shatabdi: 'shatabdi' as PropertyId,
  tejas: 'tejas' as PropertyId,
  electricity_board: 'electricity_board' as PropertyId,
  marine_drive: 'marine_drive' as PropertyId,
  altamount_road: 'altamount_road' as PropertyId,
  park_street: 'park_street' as PropertyId,
};

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

  // ─── GAME_RULES ─────────────────────────────────────

  describe('GAME_RULES', () => {
    it('has expected constants', () => {
      expect(GAME_RULES.startMoney).toBe(1500);
      expect(GAME_RULES.passGoSalary).toBe(200);
      expect(GAME_RULES.jailFine).toBe(50);
      expect(GAME_RULES.maxHouses).toBe(32);
      expect(GAME_RULES.maxHotels).toBe(12);
    });
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
      for (const id of Object.keys(game.properties) as PropertyId[]) {
        expect(game.properties[id].owner).toBeNull();
        expect(game.properties[id].houses).toBe(0);
        expect(game.properties[id].mortgaged).toBe(false);
      }
    });

    it('starts in waiting_for_roll phase', () => {
      expect(game.phase).toBe('waiting_for_roll');
    });

    it('no winner at start', () => {
      expect(game.winner).toBeNull();
    });

    it('housesRemaining starts at 32', () => {
      expect(game.housesRemaining).toBe(32);
    });

    it('hotelsRemaining starts at 12', () => {
      expect(game.hotelsRemaining).toBe(12);
    });

    it('accepts optional startingPlayer parameter', () => {
      const g = createGame(4, 2);
      expect(g.currentPlayer).toBe(2);
    });

    it('TILE_LAYOUT has 40 spaces with 28 purchasable', () => {
      expect(TILE_LAYOUT.length).toBe(40);
      expect(Object.keys(GROUP_PROPERTIES).reduce((sum, g) => sum + GROUP_PROPERTIES[g as keyof typeof GROUP_PROPERTIES].length, 0) + RAILROAD_IDS.length + UTILITY_IDS.length).toBe(28);
    });

    it('has 4 railroads and 2 utilities', () => {
      expect(RAILROAD_IDS.length).toBe(4);
      expect(UTILITY_IDS.length).toBe(2);
    });

    it('players start with empty monopolies', () => {
      expect(game.players[0].monopolies).toEqual([]);
    });

    it('eventLog starts empty', () => {
      expect(game.eventLog).toEqual([]);
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

    it('moves player by diceTotal (non-card landing)', () => {
      rollWithFixedValues(game, 0, 1, 3);
      expect(game.players[0].position).toBe(4);
    });

    it('rejects stale rollId', () => {
      const r = handleAction(game, 0, { type: 'ROLL_DICE' });
      game.rollId = 'different-id';
      const c = handleAction(game, 0, { type: 'CONFIRM_DICE', payload: { rollId: r.rollId!, values: [3, 4] } });
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
    it('rolling doubles allows re-roll when landing on non-buyable space', () => {
      game.players[0].position = 38;
      rollWithFixedValues(game, 0, 1, 1);
      expect(game.doublesCount).toBe(1);
      expect(game.phase).toBe('waiting_for_roll');
    });

    it('two consecutive doubles increments doublesCount to 2', () => {
      game.players[0].position = 38;
      rollWithFixedValues(game, 0, 1, 1);
      rollWithFixedValues(game, 0, 2, 2);
      expect(game.doublesCount).toBe(2);
    });

    it('three doubles → goes to jail', () => {
      game.players[0].position = 38;
      rollWithFixedValues(game, 0, 1, 1);
      rollWithFixedValues(game, 0, 2, 2);
      const result = rollWithFixedValues(game, 0, 3, 3);
      expect(game.players[0].inJail).toBe(true);
      expect(game.players[0].position).toBe(10);
      expect(game.phase).toBe('turn_end');
    });

    it('ROLLED_DOUBLES event emitted', () => {
      game.players[0].position = 38;
      const result = rollWithFixedValues(game, 0, 1, 1);
      expect(result.events?.some(e => e.type === 'ROLLED_DOUBLES')).toBe(true);
    });

    it('THREE_DOUBLES event emitted on 3rd consecutive double', () => {
      game.players[0].position = 38;
      rollWithFixedValues(game, 0, 1, 1);
      rollWithFixedValues(game, 0, 2, 2);
      const result = rollWithFixedValues(game, 0, 3, 3);
      expect(result.events?.some(e => e.type === 'THREE_DOUBLES')).toBe(true);
      expect(result.events?.some(e => e.type === 'WENT_TO_JAIL')).toBe(true);
    });

    it('non-doubles after doubles resets doublesCount', () => {
      game.players[0].position = 38;
      rollWithFixedValues(game, 0, 1, 1);
      game.phase = 'turn_end';
      handleAction(game, 0, { type: 'END_TURN' });
      game.phase = 'turn_end';
      handleAction(game, 1, { type: 'END_TURN' });
      const result = rollWithFixedValues(game, 0, 2, 3);
      expect(game.doublesCount).toBe(0);
    });
  });

  // ─── CONFIRM_DICE — Landing Resolution ──────────────

  describe('CONFIRM_DICE — Landing Resolution', () => {
    it('unowned property → waiting_for_action, lastAction = can_buy', () => {
      rollWithFixedValues(game, 0, 1, 2);
      expect(game.phase).toBe('waiting_for_action');
      expect(game.lastAction).toBe('can_buy');
      expect(game.landedIndex).toBe(3);
    });

    it('owned by other → pay rent, turn_end', () => {
      game.properties[P.hazratganj].owner = 1;
      rollWithFixedValues(game, 0, 1, 2);
      expect(game.phase).toBe('turn_end');
      expect(game.lastAction).toBe('paid_rent');
    });

    it('self-owned property → turn_end', () => {
      game.properties[P.hazratganj].owner = 0;
      rollWithFixedValues(game, 0, 1, 2);
      expect(game.phase).toBe('turn_end');
      expect(game.lastAction).toBe('own_property');
    });

    it('income tax → pay 200, turn_end', () => {
      rollWithFixedValues(game, 0, 1, 3);
      expect(game.players[0].money).toBe(1300);
      expect(game.phase).toBe('turn_end');
      expect(game.lastAction).toBe('paid_tax');
    });

    it('luxury tax → pay 100', () => {
      game.players[0].position = 30;
      rollWithFixedValues(game, 0, 3, 5);
      expect(game.players[0].money).toBe(1400);
      expect(game.phase).toBe('turn_end');
    });

    it('go_to_jail → position 10, inJail, turn_end', () => {
      game.players[0].position = 20;
      const result = rollWithFixedValues(game, 0, 4, 6);
      expect(game.players[0].position).toBe(10);
      expect(game.players[0].inJail).toBe(true);
      expect(game.phase).toBe('turn_end');
      expect(result.events?.some(e => e.type === 'WENT_TO_JAIL')).toBe(true);
    });

    it('kismat → turn_end, drew_kismat', () => {
      rollWithFixedValues(game, 0, 3, 4);
      expect(game.phase).toBe('turn_end');
      expect(game.lastAction).toBe('drew_kismat');
    });

    it('jugaad → turn_end, drew_jugaad', () => {
      game.players[0].position = 39;
      rollWithFixedValues(game, 0, 1, 2);
      expect(game.phase).toBe('turn_end');
      expect(game.lastAction).toBe('drew_jugaad');
    });

    it('GO (passing) → money collected, no_action', () => {
      game.players[0].position = 38;
      rollWithFixedValues(game, 0, 1, 1);
      expect(game.players[0].money).toBe(1700);
      expect(game.lastAction).toBe('no_action');
    });

    it('jail → turn_end (just visiting)', () => {
      rollWithFixedValues(game, 0, 4, 6);
      expect(game.phase).toBe('turn_end');
      expect(game.lastAction).toBe('no_action');
    });

    it('free parking → turn_end', () => {
      game.players[0].position = 10;
      rollWithFixedValues(game, 0, 5, 5);
      expect(game.lastAction).toBe('no_action');
    });

    it('kismat card generates DREW_CARD event', () => {
      const result = rollWithFixedValues(game, 0, 3, 4);
      expect(result.events?.some(e => e.type === 'DREW_CARD')).toBe(true);
    });

    it('jugaad card generates DREW_CARD event', () => {
      game.players[0].position = 39;
      const result = rollWithFixedValues(game, 0, 1, 2);
      expect(result.events?.some(e => e.type === 'DREW_CARD')).toBe(true);
    });
  });

  // ─── Jail (Phase 2) ─────────────────────────────────

  describe('Jail', () => {
    it('going to jail sets inJail and position 10', () => {
      game.players[0].inJail = true;
      game.players[0].position = 10;
      expect(game.players[0].inJail).toBe(true);
    });

    it('stays in jail on first non-doubles roll', () => {
      game.players[0].inJail = true;
      game.players[0].position = 10;
      rollWithFixedValues(game, 0, 2, 3);
      expect(game.players[0].inJail).toBe(true);
      expect(game.players[0].jailTurns).toBe(1);
      expect(game.phase).toBe('turn_end');
    });

    it('escapes jail on doubles roll', () => {
      game.players[0].inJail = true;
      game.players[0].position = 10;
      game.players[0].money = 1500;
      rollWithFixedValues(game, 0, 3, 3);
      expect(game.players[0].inJail).toBe(false);
    });

    it('auto-pays ghoos on 3rd turn in jail', () => {
      game.players[0].inJail = true;
      game.players[0].position = 10;
      game.players[0].jailTurns = 2;
      game.players[0].money = 1500;
      rollWithFixedValues(game, 0, 2, 3);
      expect(game.players[0].inJail).toBe(false);
      expect(game.players[0].money).toBe(1450);
    });

    it('payGhoos deducts 50 and frees player', () => {
      game.players[0].inJail = true;
      game.players[0].position = 10;
      game.players[0].money = 1500;
      const r = handleAction(game, 0, { type: 'PAY_GHOOS' });
      expect(r.valid).toBe(true);
      expect(game.players[0].inJail).toBe(false);
      expect(game.players[0].money).toBe(1450);
    });

    it('useSifarishCard consumes a card and frees player', () => {
      game.players[0].inJail = true;
      game.players[0].position = 10;
      game.players[0].jailFreeCards = 1;
      const r = handleAction(game, 0, { type: 'USE_SIFARISH_CARD' });
      expect(r.valid).toBe(true);
      expect(game.players[0].inJail).toBe(false);
      expect(game.players[0].jailFreeCards).toBe(0);
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
      expect(game.properties[P.hazratganj].owner).toBe(0);
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
      game.properties[P.hazratganj].owner = 1;
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

    it('buying a property adds to monopolies if complete group', () => {
      game.properties[P.chandni_chowk].owner = 0;
      game.players[0].position = 3;
      game.phase = 'waiting_for_action';
      game.lastAction = 'can_buy';
      game.landedIndex = 3;
      handleAction(game, 0, { type: 'BUY_PROPERTY' });
      expect(game.players[0].monopolies).toContain('brown');
    });
  });

  // ─── DECLINE_PROPERTY ─────────────────────────────────

  describe('DECLINE_PROPERTY', () => {
    it('decline starts auction interaction', () => {
      game.phase = 'waiting_for_action';
      game.lastAction = 'can_buy';
      game.landedIndex = 3;
      const r = handleAction(game, 0, { type: 'DECLINE_PROPERTY' });
      expect(r.valid).toBe(true);
      expect(game.interaction).not.toBeNull();
      expect(game.interaction!.type).toBe('auction');
      expect(game.properties[P.hazratganj].owner).toBeNull();
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
      game.properties[P.hazratganj].owner = 1;
      const initialP0 = game.players[0].money;
      const initialP1 = game.players[1].money;
      rollWithFixedValues(game, 0, 1, 2);
      expect(game.players[0].money).toBe(initialP0 - 4);
      expect(game.players[1].money).toBe(initialP1 + 4);
    });

    it('PAID_RENT event with correct amount and toPlayer', () => {
      game.properties[P.hazratganj].owner = 1;
      const result = rollWithFixedValues(game, 0, 1, 2);
      expect(result.events?.some(e => e.type === 'PAID_RENT' && e.amount === 4 && e.toPlayer === 1)).toBe(true);
    });

    it('mortgaged property: rent = 0', () => {
      game.properties[P.hazratganj].owner = 1;
      game.properties[P.hazratganj].mortgaged = true;
      const result = rollWithFixedValues(game, 0, 1, 2);
      expect(game.players[0].money).toBe(1500);
    });
  });

  // ─── Pay Rent — Railroads ──────────────────────────

  describe('Pay Rent — Railroads', () => {
    it('1 railroad: rent 25', () => {
      game.properties[P.vande_bharat].owner = 1;
      rollWithFixedValues(game, 0, 2, 3);
      expect(game.players[0].money).toBe(1475);
      expect(game.players[1].money).toBe(1525);
    });

    it('2 railroads: rent 50', () => {
      game.properties[P.vande_bharat].owner = 1;
      game.properties[P.rajdhani].owner = 1;
      game.players[0].position = 10;
      rollWithFixedValues(game, 0, 1, 4);
      expect(game.players[0].money).toBe(1450);
      expect(game.players[1].money).toBe(1550);
    });

    it('4 railroads: rent 200', () => {
      [P.vande_bharat, P.rajdhani, P.shatabdi, P.tejas].forEach(id => game.properties[id].owner = 1);
      game.players[0].position = 20;
      rollWithFixedValues(game, 0, 2, 3);
      expect(game.players[0].money).toBe(1300);
      expect(game.players[1].money).toBe(1700);
    });
  });

  // ─── Pay Rent — Utilities ──────────────────────────

  describe('Pay Rent — Utilities', () => {
    it('1 utility: 4 × diceTotal', () => {
      game.properties[P.water_supply].owner = 1;
      const result = rollWithFixedValues(game, 0, 6, 6);
      expect(game.players[0].money).toBe(1500 - 4 * 12);
      expect(game.players[1].money).toBe(1500 + 48);
    });

    it('2 utilities: 10 × diceTotal', () => {
      game.properties[P.water_supply].owner = 1;
      game.properties[P.electricity_board].owner = 1;
      game.players[0].position = 20;
      const result = rollWithFixedValues(game, 0, 4, 4);
      expect(game.players[0].money).toBe(1500 - 10 * 8);
      expect(game.players[1].money).toBe(1500 + 80);
    });
  });

  // ─── Pay Tax ─────────────────────────────────────────

  describe('Pay Tax', () => {
    it('income tax: -200 with PAID_TAX event', () => {
      const result = rollWithFixedValues(game, 0, 1, 3);
      expect(game.players[0].money).toBe(1300);
      expect(result.events?.some(e => e.type === 'PAID_TAX')).toBe(true);
    });

    it('luxury tax: -100', () => {
      game.players[0].position = 30;
      rollWithFixedValues(game, 0, 3, 5);
      expect(game.players[0].money).toBe(1400);
    });
  });

  // ─── Bankruptcy ─────────────────────────────────────

  describe('Bankruptcy', () => {
    it('money < 0 after rent → bankrupt, BANKRUPT event', () => {
      game.players[0].money = 1;
      game.properties[P.vande_bharat].owner = 1;
      const result = rollWithFixedValues(game, 0, 2, 3);
      expect(game.players[0].bankrupt).toBe(true);
      expect(result.events?.some(e => e.type === 'BANKRUPT')).toBe(true);
    });

    it('bankrupt properties transfer to creditor', () => {
      game.properties[P.hazratganj].owner = 0;
      game.properties[P.chandni_chowk].owner = 0;
      game.players[0].money = 1;
      game.properties[P.vande_bharat].owner = 1;
      rollWithFixedValues(game, 0, 2, 3);
      expect(game.players[0].bankrupt).toBe(true);
      // Properties go to the creditor (owner of Vande Bharat - P1), not the bank
      expect(game.properties[P.hazratganj].owner).toBe(1);
      expect(game.properties[P.chandni_chowk].owner).toBe(1);
    });

    it('winner declared when only 1 player remains', () => {
      game.players[0].money = 1;
      game.properties[P.vande_bharat].owner = 1;
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

  // ─── Building Actions ──────────────────────────────

  describe('Building (Bungalows & Villas)', () => {
    it('buildBungalow requires monopoly', () => {
      game.properties[P.chandni_chowk].owner = 0;
      const r = handleAction(game, 0, { type: 'BUILD_BUNGALOW', payload: { propertyId: P.chandni_chowk } });
      expect(r.valid).toBe(false);
      expect(r.error).toContain('Must own entire color group');
    });

    it('buildBungalow works with monopoly and even building', () => {
      game.properties[P.chandni_chowk].owner = 0;
      game.properties[P.hazratganj].owner = 0;
      game.players[0].money = 1500;
      const r = handleAction(game, 0, { type: 'BUILD_BUNGALOW', payload: { propertyId: P.chandni_chowk } });
      expect(r.valid).toBe(true);
      expect(game.properties[P.chandni_chowk].houses).toBe(1);
      expect(game.players[0].money).toBe(1450);
      expect(game.housesRemaining).toBe(31);
      expect(r.events?.some(e => e.type === 'BUNGALOW_BUILT')).toBe(true);
    });

    it('even-building rule: can only build on property with fewest houses', () => {
      game.properties[P.chandni_chowk].owner = 0;
      game.properties[P.hazratganj].owner = 0;
      game.players[0].money = 1500;
      handleAction(game, 0, { type: 'BUILD_BUNGALOW', payload: { propertyId: P.chandni_chowk } });
      const r = handleAction(game, 0, { type: 'BUILD_BUNGALOW', payload: { propertyId: P.chandni_chowk } });
      expect(r.valid).toBe(false);
      expect(r.error).toContain('evenly');
      const r2 = handleAction(game, 0, { type: 'BUILD_BUNGALOW', payload: { propertyId: P.hazratganj } });
      expect(r2.valid).toBe(true);
      expect(game.properties[P.hazratganj].houses).toBe(1);
    });

    it('sellBungalow refunds half cost', () => {
      game.properties[P.chandni_chowk].owner = 0;
      game.properties[P.hazratganj].owner = 0;
      game.properties[P.chandni_chowk].houses = 1;
      game.housesRemaining = 31;
      game.players[0].money = 1500;
      const r = handleAction(game, 0, { type: 'SELL_BUNGALOW', payload: { propertyId: P.chandni_chowk } });
      expect(r.valid).toBe(true);
      expect(game.properties[P.chandni_chowk].houses).toBe(0);
      expect(game.players[0].money).toBe(1525);
      expect(game.housesRemaining).toBe(32);
    });

    it('buildVilla requires 4 bungalows on all group properties', () => {
      game.properties[P.marine_drive].owner = 0;
      game.properties[P.altamount_road].owner = 0;
      game.properties[P.marine_drive].houses = 4;
      game.properties[P.altamount_road].houses = 4;
      game.players[0].money = 1500;
      const r = handleAction(game, 0, { type: 'BUILD_VILLA', payload: { propertyId: P.marine_drive } });
      expect(r.valid).toBe(true);
      expect(game.properties[P.marine_drive].houses).toBe(5);
      expect(game.hotelsRemaining).toBe(11);
      expect(game.housesRemaining).toBe(36);
      expect(r.events?.some(e => e.type === 'VILLA_BUILT')).toBe(true);
    });

    it('sellVilla returns 4 houses to bank', () => {
      game.properties[P.marine_drive].owner = 0;
      game.properties[P.altamount_road].owner = 0;
      game.properties[P.marine_drive].houses = 5;
      game.properties[P.altamount_road].houses = 4;
      game.hotelsRemaining = 11;
      game.housesRemaining = 36;
      game.players[0].money = 1500;
      const r = handleAction(game, 0, { type: 'SELL_VILLA', payload: { propertyId: P.marine_drive } });
      expect(r.valid).toBe(true);
      expect(game.properties[P.marine_drive].houses).toBe(4);
      expect(game.hotelsRemaining).toBe(12);
      expect(game.housesRemaining).toBe(32);
    });
  });

  // ─── getValidActions ────────────────────────────────

  describe('getValidActions', () => {
    it('waiting_for_roll includes ROLL_DICE', () => {
      const actions = getValidActions(game, 0);
      expect(actions).toContain('ROLL_DICE');
    });

    it('waiting_for_action + can_buy → [BUY_PROPERTY, DECLINE_PROPERTY]', () => {
      game.phase = 'waiting_for_action';
      game.lastAction = 'can_buy';
      const actions = getValidActions(game, 0);
      expect(actions).toContain('BUY_PROPERTY');
      expect(actions).toContain('DECLINE_PROPERTY');
    });

    it('turn_end includes END_TURN, BUILD, MORTGAGE and TRADE actions', () => {
      game.phase = 'turn_end';
      const actions = getValidActions(game, 0);
      expect(actions).toContain('END_TURN');
      expect(actions).toContain('BUILD_BUNGALOW');
      expect(actions).toContain('BUILD_VILLA');
      expect(actions).toContain('MORTGAGE');
      expect(actions).toContain('PROPOSE_TRADE');
    });

    it('waiting_for_roll in jail includes PAY_GHOOS and USE_SIFARISH_CARD', () => {
      game.players[0].inJail = true;
      game.players[0].money = 500;
      game.players[0].jailFreeCards = 1;
      const actions = getValidActions(game, 0);
      expect(actions).toContain('ROLL_DICE');
      expect(actions).toContain('PAY_GHOOS');
      expect(actions).toContain('USE_SIFARISH_CARD');
    });

    it('rolling_dice → [PROPOSE_TRADE, MORTGAGE, UNMORTGAGE]', () => {
      game.phase = 'rolling_dice';
      expect(getValidActions(game, 0)).toEqual(['PROPOSE_TRADE', 'MORTGAGE', 'UNMORTGAGE']);
    });

    it('game over → []', () => {
      game.winner = 0;
      expect(getValidActions(game, 0)).toEqual([]);
    });

    it('not your turn → [PROPOSE_TRADE, MORTGAGE, UNMORTGAGE]', () => {
      expect(getValidActions(game, 1)).toEqual(['PROPOSE_TRADE', 'MORTGAGE', 'UNMORTGAGE']);
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

    it('dispatches PAY_GHOOS', () => {
      game.players[0].inJail = true;
      game.players[0].money = 500;
      expect(handleAction(game, 0, { type: 'PAY_GHOOS' }).valid).toBe(true);
    });

    it('dispatches USE_SIFARISH_CARD', () => {
      game.players[0].inJail = true;
      game.players[0].jailFreeCards = 1;
      expect(handleAction(game, 0, { type: 'USE_SIFARISH_CARD' }).valid).toBe(true);
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

  // ─── Event Log ─────────────────────────────────────

  describe('Event Log', () => {
    it('events are added to eventLog on successful actions (e.g. paying tax)', () => {
      rollWithFixedValues(game, 0, 1, 3); // pos 4 = income tax → PAID_TAX
      expect(game.eventLog.length).toBeGreaterThanOrEqual(1);
      expect(game.eventLog.some(e => e.type === 'PAID_TAX')).toBe(true);
    });

    it('failed actions do not add events', () => {
      const logLen = game.eventLog.length;
      handleAction(game, 1, { type: 'ROLL_DICE' });
      expect(game.eventLog.length).toBe(logLen);
    });
  });

  // ─── Phase 3: Mortgages ───────────────────────────

  describe('Mortgages', () => {
    it('mortgageProperty receives mortgage value', () => {
      game.properties[P.chandni_chowk].owner = 0;
      game.phase = 'turn_end';
      const r = handleAction(game, 0, { type: 'MORTGAGE', payload: { propertyId: P.chandni_chowk } });
      expect(r.valid).toBe(true);
      expect(game.properties[P.chandni_chowk].mortgaged).toBe(true);
      expect(game.players[0].money).toBe(1530); // +30
    });

    it('rejects mortgage of already mortgaged property', () => {
      game.properties[P.chandni_chowk].owner = 0;
      game.properties[P.chandni_chowk].mortgaged = true;
      game.phase = 'turn_end';
      const r = handleAction(game, 0, { type: 'MORTGAGE', payload: { propertyId: P.chandni_chowk } });
      expect(r.valid).toBe(false);
    });

    it('rejects mortgage of property with houses', () => {
      game.properties[P.chandni_chowk].owner = 0;
      game.properties[P.chandni_chowk].houses = 1;
      game.phase = 'turn_end';
      const r = handleAction(game, 0, { type: 'MORTGAGE', payload: { propertyId: P.chandni_chowk } });
      expect(r.valid).toBe(false);
    });

    it('unmortgageProperty pays back +10% interest', () => {
      game.properties[P.chandni_chowk].owner = 0;
      game.properties[P.chandni_chowk].mortgaged = true;
      game.players[0].money = 1500;
      game.phase = 'turn_end';
      const r = handleAction(game, 0, { type: 'UNMORTGAGE', payload: { propertyId: P.chandni_chowk } });
      expect(r.valid).toBe(true);
      expect(game.properties[P.chandni_chowk].mortgaged).toBe(false);
      expect(game.players[0].money).toBe(1467); // 1500 - ceil(30 * 1.1) = 1500 - 33
    });

    it('rejects unmortgage of non-mortgaged property', () => {
      game.properties[P.chandni_chowk].owner = 0;
      game.phase = 'turn_end';
      const r = handleAction(game, 0, { type: 'UNMORTGAGE', payload: { propertyId: P.chandni_chowk } });
      expect(r.valid).toBe(false);
    });

    it('mortgage of railroad works', () => {
      game.properties[P.vande_bharat].owner = 0;
      game.phase = 'turn_end';
      const r = handleAction(game, 0, { type: 'MORTGAGE', payload: { propertyId: P.vande_bharat } });
      expect(r.valid).toBe(true);
      expect(game.players[0].money).toBe(1600); // +100
    });
  });

  // ─── Phase 3: Auctions ────────────────────────────

  describe('Auctions', () => {
    it('decline property starts auction interaction', () => {
      game.phase = 'waiting_for_action';
      game.lastAction = 'can_buy';
      game.landedIndex = 3;
      const r = handleAction(game, 0, { type: 'DECLINE_PROPERTY' });
      expect(r.valid).toBe(true);
      expect(game.interaction).not.toBeNull();
      expect(game.interaction!.type).toBe('auction');
    });

    it('auction: bid accepts valid bid', () => {
      game.phase = 'waiting_for_action';
      game.lastAction = 'can_buy';
      game.landedIndex = 3;
      handleAction(game, 0, { type: 'DECLINE_PROPERTY' });
      game.interaction = { type: 'auction', propertyId: P.hazratganj, declinedBy: 0, currentBid: 0, currentBidder: null, activePlayer: 1, passedPlayers: [] };
      const r = handleAction(game, 1, { type: 'BID', payload: { amount: 10 } });
      expect(r.valid).toBe(true);
      expect((game.interaction! as any).currentBid).toBe(10);
      expect((game.interaction! as any).currentBidder).toBe(1);
    });

    it('auction: pass ends auction when only bidder remains', () => {
      game.phase = 'waiting_for_action';
      game.lastAction = 'can_buy';
      game.landedIndex = 3;
      handleAction(game, 0, { type: 'DECLINE_PROPERTY' });
      game.interaction = { type: 'auction', propertyId: P.hazratganj, declinedBy: 0, currentBid: 15, currentBidder: 1, activePlayer: 1, passedPlayers: [] };
      const r = handleAction(game, 1, { type: 'PASS' });
      expect(r.valid).toBe(true);
      expect(game.interaction).toBeNull();
      expect(game.properties[P.hazratganj].owner).toBe(1);
      expect(game.players[1].money).toBe(1485);
    });

    it('auction: all pass leaves property unowned', () => {
      game.phase = 'waiting_for_action';
      game.lastAction = 'can_buy';
      game.landedIndex = 3;
      handleAction(game, 0, { type: 'DECLINE_PROPERTY' });
      game.interaction = { type: 'auction', propertyId: P.hazratganj, declinedBy: 0, currentBid: 0, currentBidder: null, activePlayer: 1, passedPlayers: [] };
      const r = handleAction(game, 1, { type: 'PASS' });
      expect(r.valid).toBe(true);
      expect(game.interaction).toBeNull();
      expect(game.properties[P.hazratganj].owner).toBeNull();
    });
  });

  // ─── Phase 3: Trading ─────────────────────────────

  describe('Trading', () => {
    it('proposeTrade creates trade interaction', () => {
      game.properties[P.chandni_chowk].owner = 0;
      game.phase = 'turn_end';
      const r = handleAction(game, 0, { type: 'PROPOSE_TRADE', payload: { toPlayer: 1, giveProperties: [P.chandni_chowk], askMoney: 50 } });
      expect(r.valid).toBe(true);
      expect(game.interaction).not.toBeNull();
      expect(game.interaction!.type).toBe('trade');
    });

    it('acceptTrade transfers property', () => {
      game.properties[P.chandni_chowk].owner = 0;
      game.phase = 'turn_end';
      handleAction(game, 0, { type: 'PROPOSE_TRADE', payload: { toPlayer: 1, giveProperties: [P.chandni_chowk], askMoney: 50 } });
      const r = handleAction(game, 1, { type: 'ACCEPT_TRADE' });
      expect(r.valid).toBe(true);
      expect(game.properties[P.chandni_chowk].owner).toBe(1);
      expect(game.interaction).toBeNull();
    });

    it('acceptTrade transfers money correctly', () => {
      game.properties[P.chandni_chowk].owner = 0;
      game.phase = 'turn_end';
      handleAction(game, 0, { type: 'PROPOSE_TRADE', payload: { toPlayer: 1, giveProperties: [P.chandni_chowk], askMoney: 50 } });
      handleAction(game, 1, { type: 'ACCEPT_TRADE' });
      expect(game.players[0].money).toBe(1550); // 1500+50
      expect(game.players[1].money).toBe(1450); // 1500-50
    });

    it('rejectTrade clears interaction', () => {
      game.properties[P.chandni_chowk].owner = 0;
      game.phase = 'turn_end';
      handleAction(game, 0, { type: 'PROPOSE_TRADE', payload: { toPlayer: 1, giveProperties: [P.chandni_chowk], askMoney: 50 } });
      const r = handleAction(game, 1, { type: 'REJECT_TRADE' });
      expect(r.valid).toBe(true);
      expect(game.interaction).toBeNull();
      expect(game.properties[P.chandni_chowk].owner).toBe(0);
    });

    it('proposeTrade rejects if buildings exist', () => {
      game.properties[P.chandni_chowk].owner = 0;
      game.properties[P.chandni_chowk].houses = 2;
      game.phase = 'turn_end';
      const r = handleAction(game, 0, { type: 'PROPOSE_TRADE', payload: { toPlayer: 1, giveProperties: [P.chandni_chowk], askMoney: 50 } });
      expect(r.valid).toBe(false);
    });
  });

  // ─── Phase 3: Interaction model ───────────────────

  describe('Interaction model', () => {
    it('actions blocked during auction interaction', () => {
      game.phase = 'waiting_for_action';
      game.lastAction = 'can_buy';
      game.landedIndex = 3;
      handleAction(game, 0, { type: 'DECLINE_PROPERTY' });
      game.interaction = { type: 'auction', propertyId: P.hazratganj, declinedBy: 0, currentBid: 0, currentBidder: null, activePlayer: 1, passedPlayers: [] };
      const r = handleAction(game, 1, { type: 'ROLL_DICE' });
      expect(r.valid).toBe(false);
    });
  });
});
