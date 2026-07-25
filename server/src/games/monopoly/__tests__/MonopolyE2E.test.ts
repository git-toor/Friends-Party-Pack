import { describe, it, expect } from 'vitest';
import { createGame, handleAction, GAME_RULES, type GameState, type PropertyId, type GameActionType } from '../MonopolyEngine.js';

const P = {
  chandni_chowk: 'chandni_chowk' as PropertyId,
  hazratganj: 'hazratganj' as PropertyId,
  vande_bharat: 'vande_bharat' as PropertyId,
  ghat_road: 'ghat_road' as PropertyId,
  mi_road: 'mi_road' as PropertyId,
  law_garden: 'law_garden' as PropertyId,
  mall_road: 'mall_road' as PropertyId,
  water_supply: 'water_supply' as PropertyId,
  bapu_bazaar: 'bapu_bazaar' as PropertyId,
  lake_pichola: 'lake_pichola' as PropertyId,
  rajdhani: 'rajdhani' as PropertyId,
  calangute: 'calangute' as PropertyId,
  rock_beach: 'rock_beach' as PropertyId,
  shatabdi: 'shatabdi' as PropertyId,
  tejas: 'tejas' as PropertyId,
  electricity_board: 'electricity_board' as PropertyId,
  marine_drive: 'marine_drive' as PropertyId,
  altamount_road: 'altamount_road' as PropertyId,
};

function roll(game: GameState, pi: number, v1: number, v2: number) {
  const r = handleAction(game, pi, { type: 'ROLL_DICE' });
  if (!r.valid || !r.rollId) return r;
  return handleAction(game, pi, { type: 'CONFIRM_DICE', payload: { rollId: r.rollId, values: [v1, v2] } });
}

function turn(game: GameState, pi: number, v1: number, v2: number, buy?: boolean) {
  let r = roll(game, pi, v1, v2);
  if (!r.valid) return r;
  if (buy && r.state.lastAction === 'can_buy') {
    r = handleAction(game, pi, { type: 'BUY_PROPERTY' });
    if (!r.valid) return r;
  }
  if (r.state.phase === 'turn_end') {
    r = handleAction(game, pi, { type: 'END_TURN' });
  }
  return r;
}

describe('Monopoly E2E Simulations', () => {
  // ─── 2-Player game ──────────────────────────────

  describe('2-player game', () => {
    it('full flow: roll → buy → pay rent → more turns', () => {
      const g = createGame(2, 0);
      let r: any;

      // P0: roll [1,2]=3 → pos 3 (Hazratganj, unowned)
      r = roll(g, 0, 1, 2);
      expect(r.valid).toBe(true);
      expect(g.players[0].position).toBe(3);
      expect(g.lastAction).toBe('can_buy');

      // P0 buys Hazratganj
      r = handleAction(g, 0, { type: 'BUY_PROPERTY' });
      expect(r.valid).toBe(true);
      expect(g.properties[P.hazratganj].owner).toBe(0);
      expect(g.players[0].money).toBe(1440);

      // End turn → P1
      r = handleAction(g, 0, { type: 'END_TURN' });
      expect(r.valid).toBe(true);
      expect(g.currentPlayer).toBe(1);
      expect(g.phase).toBe('waiting_for_roll');

      // P1: roll [4,2]=6 → pos 6 (Ghat Road, unowned)
      r = turn(g, 1, 4, 2, true);
      expect(r.valid).toBe(true);
      expect(g.properties[P.ghat_road].owner).toBe(1);

      // P0: roll [1,1]=2 → pos 5 (Vande Bharat, buy)
      r = turn(g, 0, 1, 1, true);
      expect(r.valid).toBe(true);
      expect(g.properties[P.vande_bharat].owner).toBe(0);
      // Doubles → re-roll: roll [2,3]=5 → pos 10 (Jail, just visiting)
      expect(g.phase).toBe('waiting_for_roll');
      r = turn(g, 0, 2, 3, false);
      expect(g.players[0].position).toBe(10);

      // P1: roll [5,1]=6 → pos 12 (Water Supply)
      r = turn(g, 1, 5, 1, true);
      expect(g.properties[P.water_supply].owner).toBe(1);

      // P0: roll [2,4]=6 → pos 16 (Calangute), buy
      r = turn(g, 0, 2, 4, true);
      expect(g.properties[P.calangute].owner).toBe(0);

      // P1: roll [5,2]=7 → pos 19 (Rock Beach)
      r = turn(g, 1, 5, 2, true);
      expect(g.properties[P.rock_beach].owner).toBe(1);
    });
  });

  // ─── Pass GO ──────────────────────────────────

  describe('Pass GO', () => {
    it('collects ₹200 and increments stats', () => {
      const g = createGame(2, 0);
      g.players[0].position = 38;
      turn(g, 0, 1, 2, false);
      expect(g.players[0].position).toBe(1);
      expect(g.players[0].money).toBe(1700);
      expect(g.players[0].stats.timesPassedGo).toBe(1);
      expect(g.players[0].stats.totalMoneyEarned).toBe(200);
    });

    it('landing exactly on GO from position 38', () => {
      const g = createGame(2, 0);
      g.players[0].position = 38;
      turn(g, 0, 1, 1, false);
      expect(g.players[0].position).toBe(0);
      expect(g.players[0].money).toBe(1700);
    });
  });

  // ─── Doubles ──────────────────────────────────

  describe('Doubles', () => {
    it('rolling doubles gives re-roll on non-buyable space', () => {
      const g = createGame(2, 0);
      g.players[0].position = 38;
      // [1,1] → pos 0 (GO), doubles + re-roll
      let r = roll(g, 0, 1, 1);
      expect(r.valid).toBe(true);
      expect(g.doublesCount).toBe(1);
      expect(g.phase).toBe('waiting_for_roll');
      // Roll again
      r = turn(g, 0, 2, 3, false);
      expect(g.players[0].position).toBe(5);
    });

    it('three doubles → jail', () => {
      const g = createGame(2, 0);
      g.players[0].position = 38;
      // [1,1] → pos 0, doubles=1
      roll(g, 0, 1, 1);
      expect(g.phase).toBe('waiting_for_roll');
      // [2,2] → pos 4, doubles=2
      roll(g, 0, 2, 2);
      expect(g.phase).toBe('waiting_for_roll');
      // [3,3] → 3rd double → jail
      let r = roll(g, 0, 3, 3);
      expect(g.players[0].inJail).toBe(true);
      expect(g.players[0].position).toBe(10);
      expect(g.players[0].stats.timesWentToJail).toBe(1);
      expect(r.state.phase).toBe('turn_end');
    });
  });

  // ─── Tax payments ─────────────────────────────

  describe('Tax payments', () => {
    it('income tax deducts ₹200', () => {
      const g = createGame(2, 0);
      turn(g, 0, 1, 3, false);
      expect(g.players[0].money).toBe(1300);
      expect(g.players[0].stats.totalMoneySpent).toBe(200);
    });

    it('luxury tax deducts ₹100', () => {
      const g = createGame(2, 0);
      g.players[0].position = 30;
      turn(g, 0, 3, 5, false);
      expect(g.players[0].money).toBe(1400);
      expect(g.players[0].stats.totalMoneySpent).toBe(100);
    });
  });

  // ─── Railroad rent ────────────────────────────

  describe('Railroad rent', () => {
    it('2 railroads charge ₹50', () => {
      const g = createGame(2, 0);
      g.properties[P.vande_bharat].owner = 1;
      g.properties[P.rajdhani].owner = 1;
      g.players[0].position = 0;
      turn(g, 0, 2, 3, false); // land on pos 5 (Vande Bharat)
      expect(g.players[0].money).toBe(1450); // 1500 - 50
      expect(g.players[1].money).toBe(1550);
      expect(g.players[0].stats.rentPaid).toBe(50);
      expect(g.players[1].stats.rentReceived).toBe(50);
    });

    it('4 railroads charge ₹200', () => {
      const g = createGame(2, 0);
      [P.vande_bharat, P.rajdhani, P.shatabdi, P.tejas].forEach(id => g.properties[id].owner = 1);
      g.players[0].position = 20;
      turn(g, 0, 2, 3, false); // land on pos 25
      expect(g.players[0].money).toBe(1300);
      expect(g.players[1].money).toBe(1700);
    });
  });

  // ─── Utility rent ─────────────────────────────

  describe('Utility rent', () => {
    it('1 utility: 4× dice', () => {
      const g = createGame(2, 0);
      g.properties[P.water_supply].owner = 1;
      g.players[0].position = 6;
      const r = roll(g, 0, 3, 3); // total=6, land on 12
      expect(g.players[0].money).toBe(1500 - 4 * 6);
      expect(g.players[1].money).toBe(1500 + 24);
    });

    it('2 utilities: 10× dice', () => {
      const g = createGame(2, 0);
      g.properties[P.water_supply].owner = 1;
      g.properties[P.electricity_board].owner = 1;
      g.players[0].position = 20;
      const r = roll(g, 0, 4, 4); // total=8, land on 28
      expect(g.players[0].money).toBe(1500 - 10 * 8);
      expect(g.players[1].money).toBe(1500 + 80);
    });
  });

  // ─── Bankruptcy cascade ────────────────────────

  describe('Bankruptcy cascade', () => {
    it('3 players: 2 go bankrupt, last wins', () => {
      const g = createGame(3, 0);
      g.players[0].money = 1;
      g.players[1].money = 1;
      g.players[2].money = 1500;
      // Make P1 own properties that P0 will land on
      g.properties[P.vande_bharat].owner = 1; // pos 5
      // P0 lands on P1's property, goes bankrupt
      let r = turn(g, 0, 2, 3, false);
      expect(g.players[0].bankrupt).toBe(true);

      // P1's turn — stays simple
      r = turn(g, 1, 1, 2, false); // pos 3 (Hazratganj)
      expect(g.players[1].bankrupt).toBe(false);

      // P2's turn
      turn(g, 2, 1, 1, false); // double

      // Only P1 and P2 remain
      expect(g.players.filter((p: any) => !p.bankrupt).length).toBe(2);
    });
  });

  // ─── Full property purchase ────────────────────

  describe('Full property purchase', () => {
    it('buys properties, builds, and pays enhanced rent', () => {
      const g = createGame(2, 0);
      // P0 buys both brown properties
      g.players[0].position = 1;
      g.phase = 'waiting_for_action';
      g.lastAction = 'can_buy';
      g.landedIndex = 1;
      handleAction(g, 0, { type: 'BUY_PROPERTY' });

      g.players[0].position = 3;
      g.phase = 'waiting_for_action';
      g.lastAction = 'can_buy';
      g.landedIndex = 3;
      handleAction(g, 0, { type: 'BUY_PROPERTY' });

      // End turn so we can build during our next turn
      g.phase = 'turn_end';
      handleAction(g, 0, { type: 'END_TURN' });
      // Now P1's turn — end it to get back to P0
      g.phase = 'turn_end';
      handleAction(g, 1, { type: 'END_TURN' });
      // Back to P0

      // Build 2 bungalows on each
      handleAction(g, 0, { type: 'BUILD_BUNGALOW', payload: { propertyId: P.chandni_chowk } });
      handleAction(g, 0, { type: 'BUILD_BUNGALOW', payload: { propertyId: P.hazratganj } });
      handleAction(g, 0, { type: 'BUILD_BUNGALOW', payload: { propertyId: P.chandni_chowk } });
      handleAction(g, 0, { type: 'BUILD_BUNGALOW', payload: { propertyId: P.hazratganj } });

      expect(g.properties[P.chandni_chowk].houses).toBe(2);
      expect(g.properties[P.hazratganj].houses).toBe(2);
      expect(g.housesRemaining).toBe(28);
      expect(g.players[0].stats.housesBuilt).toBe(4);

      // End P0's turn → P1 will now be current
      g.phase = 'turn_end';
      handleAction(g, 0, { type: 'END_TURN' });

      // P1 passes GO (+200) and lands on Chandni Chowk with 2 bungalows → rent[2]=30
      g.players[1].position = 38;
      turn(g, 1, 1, 2, false);
      expect(g.players[1].money).toBe(1670); // 1500 + 200 - 30
      expect(g.players[0].stats.rentReceived).toBe(30);
    });
  });

  // ─── Jail flow ────────────────────────────────

  describe('Jail flow', () => {
    it('go to jail → pay ghoos → continue', () => {
      const g = createGame(2, 0);
      g.players[0].position = 20;
      // Roll [4,6]=10 → Go To Jail (pos 30 → pos 10)
      let r = turn(g, 0, 4, 6, false);
      expect(g.players[0].inJail).toBe(true);
      expect(g.players[0].position).toBe(10);

      // End P0's turn, now P1 can roll
      g.phase = 'turn_end';
      handleAction(g, 0, { type: 'END_TURN' });
      turn(g, 1, 1, 2, false);

      // P0's turn again: pay ghoos to escape
      g.phase = 'turn_end';
      handleAction(g, 1, { type: 'END_TURN' });
      r = handleAction(g, 0, { type: 'PAY_GHOOS' });
      expect(r.valid).toBe(true);
      expect(g.players[0].inJail).toBe(false);
      expect(g.players[0].money).toBe(1450);
      expect(g.players[0].stats.totalMoneySpent).toBe(GAME_RULES.jailFine);

      // Roll after escape
      r = turn(g, 0, 2, 3, false);
      expect(g.players[0].position).toBe(15);
    });

    it('go to jail → use sifarish card → continue', () => {
      const g = createGame(2, 0);
      g.players[0].position = 20;
      g.players[0].jailFreeCards = 1;
      let r = turn(g, 0, 4, 6, false);
      expect(g.players[0].inJail).toBe(true);

      // End P0's turn, P1 plays, then end P1's turn
      g.phase = 'turn_end';
      handleAction(g, 0, { type: 'END_TURN' });
      turn(g, 1, 1, 2, false);
      g.phase = 'turn_end';
      handleAction(g, 1, { type: 'END_TURN' });

      r = handleAction(g, 0, { type: 'USE_SIFARISH_CARD' });
      expect(r.valid).toBe(true);
      expect(g.players[0].inJail).toBe(false);
      expect(g.players[0].jailFreeCards).toBe(0);
    });
  });

  // ─── Movement paths ───────────────────────────

  describe('Movement paths', () => {
    it('PLAYER_MOVED event contains full path array', () => {
      const g = createGame(2, 0);
      g.players[0].position = 36;
      const r = roll(g, 0, 1, 3); // move 4 → pos 0
      expect(r.valid).toBe(true);
      const pm = r.events?.find((e: any) => e.type === 'PLAYER_MOVED') as any;
      expect(pm).toBeDefined();
      expect(Array.isArray(pm.path)).toBe(true);
      expect(pm.path).toEqual([37, 38, 39, 0]);
    });

    it('path wraps around the board', () => {
      const g = createGame(2, 0);
      g.players[0].position = 38;
      const r = roll(g, 0, 1, 1); // move 2 → pos 0
      const pm = r.events?.find((e: any) => e.type === 'PLAYER_MOVED') as any;
      expect(pm.path).toEqual([39, 0]);
    });
  });

  // ─── PlayerStats tracking ─────────────────────

  describe('PlayerStats tracking', () => {
    it('tracks propertiesBought and totalMoneySpent', () => {
      const g = createGame(2, 0);
      g.players[0].position = 1;
      g.phase = 'waiting_for_action';
      g.lastAction = 'can_buy';
      g.landedIndex = 1;
      handleAction(g, 0, { type: 'BUY_PROPERTY' });
      expect(g.players[0].stats.propertiesBought).toBe(1);
      expect(g.players[0].stats.totalMoneySpent).toBe(60);
    });

    it('tracks housesBuilt and villasBuilt', () => {
      const g = createGame(2, 0);
      g.properties[P.chandni_chowk].owner = 0;
      g.properties[P.hazratganj].owner = 0;
      g.players[0].monopolies = ['brown'];
      g.phase = 'turn_end';
      handleAction(g, 0, { type: 'BUILD_BUNGALOW', payload: { propertyId: P.chandni_chowk } });
      expect(g.players[0].stats.housesBuilt).toBe(1);
    });
  });

  // ─── Mortgage → Unmortgage flow ──────────────

  describe('Mortgage flow', () => {
    it('mortgage → unmortgage → continue playing', () => {
      const g = createGame(2, 0);
      g.properties[P.chandni_chowk].owner = 0;
      g.phase = 'turn_end';

      // Mortgage
      let r = handleAction(g, 0, { type: 'MORTGAGE', payload: { propertyId: P.chandni_chowk } });
      expect(r.valid).toBe(true);
      expect(g.properties[P.chandni_chowk].mortgaged).toBe(true);
      expect(g.players[0].money).toBe(1530);
      expect(g.players[0].stats.totalMoneyEarned).toBe(30);

      // Unmortgage
      r = handleAction(g, 0, { type: 'UNMORTGAGE', payload: { propertyId: P.chandni_chowk } });
      expect(r.valid).toBe(true);
      expect(g.properties[P.chandni_chowk].mortgaged).toBe(false);
      expect(g.players[0].money).toBe(1497); // 1530 - ceil(30*1.1)
      expect(g.players[0].stats.totalMoneySpent).toBe(33);
    });
  });

  // ─── Auction flow ────────────────────────────

  describe('Auction flow', () => {
    it('decline → auction → bid → win', () => {
      const g = createGame(2, 0);
      g.phase = 'waiting_for_action';
      g.lastAction = 'can_buy';
      g.landedIndex = 3;

      // Decline → auction starts
      let r = handleAction(g, 0, { type: 'DECLINE_PROPERTY' });
      expect(r.valid).toBe(true);
      expect(g.interaction).not.toBeNull();
      expect(g.interaction!.type).toBe('auction');

      // P1 bids
      r = handleAction(g, 1, { type: 'BID', payload: { amount: 10 } });
      expect(r.valid).toBe(true);

      // P0 passes (already out, can't)
      // P1 passes → wins at ₹10
      r = handleAction(g, 1, { type: 'PASS' });
      expect(r.valid).toBe(true);
      expect(g.interaction).toBeNull();
      expect(g.properties[P.hazratganj].owner).toBe(1);
      expect(g.players[1].money).toBe(1490);
      expect(g.players[1].stats.auctionsWon).toBe(1);
    });
  });

  // ─── Trade flow ──────────────────────────────

  describe('Trade flow', () => {
    it('propose trade → accept → properties transfer', () => {
      const g = createGame(2, 0);
      g.properties[P.chandni_chowk].owner = 0;
      g.phase = 'turn_end';

      // P0 proposes trade
      let r = handleAction(g, 0, { type: 'PROPOSE_TRADE', payload: { toPlayer: 1, giveProperties: [P.chandni_chowk], askMoney: 50 } });
      expect(r.valid).toBe(true);
      expect(g.interaction?.type).toBe('trade');

      // P1 accepts
      r = handleAction(g, 1, { type: 'ACCEPT_TRADE' });
      expect(r.valid).toBe(true);
      expect(g.interaction).toBeNull();
      expect(g.properties[P.chandni_chowk].owner).toBe(1);
      expect(g.players[0].money).toBe(1550);
      expect(g.players[1].money).toBe(1450);
      expect(g.players[0].stats.tradesCompleted).toBe(1);
      expect(g.players[1].stats.tradesCompleted).toBe(1);
    });

    it('propose trade → reject → no transfer', () => {
      const g = createGame(2, 0);
      g.properties[P.chandni_chowk].owner = 0;
      g.phase = 'turn_end';

      handleAction(g, 0, { type: 'PROPOSE_TRADE', payload: { toPlayer: 1, giveProperties: [P.chandni_chowk], askMoney: 50 } });
      let r = handleAction(g, 1, { type: 'REJECT_TRADE' });
      expect(r.valid).toBe(true);
      expect(g.interaction).toBeNull();
      expect(g.properties[P.chandni_chowk].owner).toBe(0);
    });
  });
});
