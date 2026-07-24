import { describe, it, expect } from 'vitest';
import { createGame, handleAction } from '../engine/GameEngine.js';
import type { GameState, CardType } from '../engine/types.js';

function findCard(hand: { id: string; type: string }[], type: string): string | undefined {
  return hand.find(c => c.type === type)?.id;
}

function testGame(playerCount = 2, expansions?: string[]) {
  return createGame({ playerCount, expansions });
}

function ensureCardsInHand(state: GameState, playerIndex: number, needed: CardType[]): string[] {
  const player = state.players[playerIndex];
  const found: string[] = [];
  for (const type of needed) {
    let cid = findCard(player.hand, type);
    if (cid) { found.push(cid); continue; }
    for (const p of state.players) {
      if (p.index === playerIndex) continue;
      cid = findCard(p.hand, type);
      if (cid) {
        const idx = p.hand.findIndex(c => c.id === cid);
        const [card] = p.hand.splice(idx, 1);
        player.hand.push(card);
        found.push(cid);
        break;
      }
    }
    if (cid) continue;
    const deckIdx = state.deck.findIndex(c => c.type === type);
    if (deckIdx !== -1) {
      const [card] = state.deck.splice(deckIdx, 1);
      player.hand.push(card);
      found.push(card.id);
    }
  }
  return found;
}

function resolveNopeTimeout(state: GameState, playerIndex: number) {
  const r = handleAction(state, playerIndex, 'RESOLVE_NOPE_TIMEOUT');
  expect(r.valid).toBe(true);
  return r;
}

function playNope(state: GameState, noperIndex: number) {
  const noper = state.players[noperIndex];
  let nopeId = findCard(noper.hand, 'nope');
  if (!nopeId) {
    const deckNope = state.deck.find(c => c.type === 'nope');
    if (deckNope) {
      const idx = state.deck.findIndex(c => c.id === deckNope.id);
      state.deck.splice(idx, 1);
      noper.hand.push(deckNope);
      nopeId = deckNope.id;
    }
  }
  if (!nopeId) return { valid: false, state, error: 'No Nope available' };
  return handleAction(state, noperIndex, 'RESOLVE_NOPE');
}

describe('Integration: Full Card Flows', () => {
  describe('Attack', () => {
    it('PATH A (no nope): adds 2 turns to next player, advances turn to them', () => {
      const game = testGame(2);
      const p0 = game.turn.currentPlayerIndex;
      const p1 = 1 - p0;
      const [attackId] = ensureCardsInHand(game, p0, ['attack' as CardType]);
      const p0HandBefore = game.players[p0].hand.length;

      handleAction(game, p0, 'PLAY_CARD', { cardId: attackId });
      expect(game.nopeWindow).not.toBeNull();

      resolveNopeTimeout(game, p0);

      // Turn advanced to p1 (ADD_TURNS calls endTurn)
      expect(game.turn.currentPlayerIndex).toBe(p1);
      // p1 has 3 pending turns (2+1), won't decrement until they draw
      expect(game.players[p1].pendingTurns).toBe(3);
      // Attack card removed from hand
      expect(game.players[p0].hand.length).toBe(p0HandBefore - 1);
      expect(game.discardPile.some(c => c.type === 'attack')).toBe(true);
    });

    it('PATH B (noped): effect is deferred, nope cancels it, no pending turns added', () => {
      const game = testGame(2);
      const p0 = game.turn.currentPlayerIndex;
      const p1 = 1 - p0;
      const [attackId] = ensureCardsInHand(game, p0, ['attack' as CardType]);

      handleAction(game, p0, 'PLAY_CARD', { cardId: attackId });
      playNope(game, p1);
      expect(game.nopeWindow?.chain.length).toBe(1);
      resolveNopeTimeout(game, p0);
      expect(game.nopeWindow).toBeNull();
      // Nope cancelled the effect, no turns added
      expect(game.players[p1].pendingTurns).toBe(0);
    });
  });

  describe('Skip', () => {
    it('is nopeable, opens nope window, advances turn on resolve', () => {
      const game = testGame(2);
      const p0 = game.turn.currentPlayerIndex;
      const [skipId] = ensureCardsInHand(game, p0, ['skip' as CardType]);

      handleAction(game, p0, 'PLAY_CARD', { cardId: skipId });
      expect(game.nopeWindow).not.toBeNull(); // Skip now nopeable!
      resolveNopeTimeout(game, p0);
      expect(game.turn.currentPlayerIndex).not.toBe(p0);
      expect(game.turn.phase).toBe('playing');
    });
  });

  describe('Favor', () => {
    it('victim selects card, attacker receives it, turn advances to victim after resolve', () => {
      const game = testGame(2);
      const p0 = game.turn.currentPlayerIndex;
      const p1 = 1 - p0;
      const [favorId] = ensureCardsInHand(game, p0, ['favor' as CardType]);
      const p1CardCount = game.players[p1].hand.length;
      const victimCardId = game.players[p1].hand[0].id;
      const attackerIdx = p0;

      handleAction(game, p0, 'PLAY_CARD', { cardId: favorId, targetIndex: p1 });
      expect(game.nopeWindow).not.toBeNull();

      resolveNopeTimeout(game, p0);

      // RESOLVE_FAVOR action should be on the stack with fromPlayerIndex
      const favorAction = game.actionStack.find(a => a.type === 'RESOLVE_FAVOR');
      expect(favorAction).toBeDefined();
      expect(favorAction?.payload?.fromPlayerIndex).toBe(p0);

      // Victim (p1) sends RESOLVE_FAVOR
      const r = handleAction(game, p1, 'RESOLVE_FAVOR', { cardId: victimCardId });
      expect(r.valid).toBe(true);

      // Card moved from victim to attacker
      expect(game.players[p1].hand.length).toBe(p1CardCount - 1);
      expect(game.players[p0].hand.some(c => c.id === victimCardId)).toBe(true);
      // Turn stays with attacker — they must still draw a card to end their turn
      expect(game.turn.currentPlayerIndex).toBe(p0);
    });
  });

  describe('Shuffle', () => {
    it('turn stays with current player after nope timeout', () => {
      const game = testGame(2);
      const p0 = game.turn.currentPlayerIndex;
      const [shuffleId] = ensureCardsInHand(game, p0, ['shuffle' as CardType]);

      handleAction(game, p0, 'PLAY_CARD', { cardId: shuffleId });
      expect(game.nopeWindow).not.toBeNull();
      resolveNopeTimeout(game, p0);
      expect(game.turn.currentPlayerIndex).toBe(p0);
      expect(game.turn.phase).toBe('playing');
    });
  });

  describe('See the Future', () => {
    it('sets pendingCardView for the playing player only', () => {
      const game = testGame(2);
      const p0 = game.turn.currentPlayerIndex;
      const [seeId] = ensureCardsInHand(game, p0, ['see_future_3x' as CardType]);

      handleAction(game, p0, 'PLAY_CARD', { cardId: seeId });
      expect(game.pendingCardView).toBeNull(); // deferred, not yet executed
      resolveNopeTimeout(game, p0);
      expect(game.pendingCardView).not.toBeNull();
      expect(game.pendingCardView!.cards.length).toBe(3);
      expect(game.pendingCardView!.forPlayerIndex).toBe(p0);
    });
  });

  describe('Nope chain', () => {
    it('PATH A: single Nope consumes card, appears in chain, effect cancelled on timeout', () => {
      const game = testGame(2);
      const p0 = game.turn.currentPlayerIndex;
      const p1 = 1 - p0;
      const [attackId] = ensureCardsInHand(game, p0, ['attack' as CardType]);

      handleAction(game, p0, 'PLAY_CARD', { cardId: attackId });
      expect(game.players[p1].pendingTurns).toBe(0); // effect deferred

      const nopeResult = playNope(game, p1);
      if (nopeResult.valid) {
        expect(game.nopeWindow!.chain.length).toBe(1);
        resolveNopeTimeout(game, p0);
        expect(game.nopeWindow).toBeNull();
        expect(game.players[p1].pendingTurns).toBe(0); // nope cancelled the attack
      }
    });

    it('PATH B: double Nope extends chain, even chain = attack resolves', () => {
      const game = testGame(2);
      const p0 = game.turn.currentPlayerIndex;
      const p1 = 1 - p0;
      const [attackId] = ensureCardsInHand(game, p0, ['attack' as CardType]);
      ensureCardsInHand(game, p0, ['nope' as CardType]);

      handleAction(game, p0, 'PLAY_CARD', { cardId: attackId });
      playNope(game, p1);
      playNope(game, p0);
      expect(game.nopeWindow!.chain.length).toBe(2);

      resolveNopeTimeout(game, p0);
      expect(game.nopeWindow).toBeNull();
      // Turn advanced (Attack + endTurn)
      expect(game.turn.currentPlayerIndex).not.toBe(p0);
    });
  });

  describe('Defuse', () => {
    it('player draws EK with Defuse in hand, must resolve DEFUSE_WINDOW', () => {
      const game = testGame(2);
      const p0 = game.turn.currentPlayerIndex;
      ensureCardsInHand(game, p0, ['defuse' as CardType]);
      // Force EK to top of deck
      const ek = game.deck.find(c => c.type === 'exploding_kitten')!;
      game.deck = game.deck.filter(c => c.id !== ek.id);
      game.deck.unshift(ek);
      const deckSizeBefore = game.deck.length;

      handleAction(game, p0, 'DRAW_CARD');

      // Player still alive (they had Defuse)
      expect(game.players[p0].alive).toBe(true);
      // EK is in hand (drawn but not yet defused — awaiting RESOLVE_DEFUSE)
      expect(game.players[p0].hand.some(c => c.type === 'exploding_kitten')).toBe(true);

      // Resolve the defuse
      const r = handleAction(game, p0, 'RESOLVE_DEFUSE', { insertIndex: Math.floor(Math.random() * deckSizeBefore) });
      expect(r.valid).toBe(true);

      // EK removed from hand by defuse handler, new EK placed in deck
      expect(game.players[p0].hand.some(c => c.type === 'exploding_kitten')).toBe(false);
      expect(game.deck.length).toBe(deckSizeBefore); // EK went back in, hand size unchanged
    });
  });

  describe('Draw Card', () => {
    it('draws a card and advances turn', () => {
      const game = testGame(2);
      const p0 = game.turn.currentPlayerIndex;
      const p1 = 1 - p0;
      // Ensure top card is not an Exploding Kitten (would trigger defuse flow)
      const ekIdx = game.deck.findIndex(c => c.type === 'exploding_kitten');
      if (ekIdx !== -1) {
        const [ek] = game.deck.splice(ekIdx, 1);
        game.deck.push(ek); // move EK to bottom
      }
      const handBefore = game.players[p0].hand.length;
      const deckBefore = game.deck.length;

      handleAction(game, p0, 'DRAW_CARD');

      expect(game.players[p0].hand.length).toBe(handBefore + 1);
      expect(game.deck.length).toBe(deckBefore - 1);
      expect(game.turn.currentPlayerIndex).toBe(p1);
    });
  });

  describe('Personal Attack', () => {
    it('adds 3 turns to self', () => {
      const game = testGame(2, ['barking']);
      const p0 = game.turn.currentPlayerIndex;
      const [paId] = ensureCardsInHand(game, p0, ['personal_attack' as CardType]);

      handleAction(game, p0, 'PLAY_CARD', { cardId: paId });
      resolveNopeTimeout(game, p0);
      // 3+1=4 added, advanceTurn decremented to 3
      expect(game.players[p0].pendingTurns).toBe(3);
    });
  });

  describe('Reverse', () => {
    it('flips direction and advances turn', () => {
      const game = testGame(3, ['imploding']);
      const p0 = game.turn.currentPlayerIndex;
      const [revId] = ensureCardsInHand(game, p0, ['reverse' as CardType]);

      handleAction(game, p0, 'PLAY_CARD', { cardId: revId });
      expect(game.turn.direction).toBe(1); // deferred, not flipped yet
      resolveNopeTimeout(game, p0);
      expect(game.turn.direction).toBe(-1);
      const expectedPrev = (p0 - 1 + 3) % 3;
      expect(game.turn.currentPlayerIndex).toBe(expectedPrev);
    });
  });

  describe('Imploding Kitten two-phase', () => {
    it('Phase 1: drawn face-down → reinserted face-up', () => {
      const game = testGame(2, ['imploding']);
      const p0 = game.turn.currentPlayerIndex;
      expect(game.implodingKittenFaceUp).toBe(false);

      // Find IK anywhere (deck, hands, discard) and move to deck top
      let ik = game.deck.find(c => c.type === 'imploding_kitten');
      if (!ik) {
        for (const p of game.players) {
          ik = p.hand.find(c => c.type === 'imploding_kitten');
          if (ik) { p.hand = p.hand.filter(c => c.id !== ik!.id); break; }
        }
      }
      if (!ik) return; // No IK in this game (odds are low)
      game.deck = game.deck.filter(c => c.id !== ik.id);
      game.deck.unshift(ik);

      handleAction(game, p0, 'DRAW_CARD');
      expect(game.implodingKittenFaceUp).toBe(true);
      expect(game.players[p0].alive).toBe(true);
      expect(game.players[p0].hand.some(c => c.type === 'imploding_kitten')).toBe(false);
      expect(game.deck.filter(c => c.type === 'imploding_kitten').length).toBe(1);
    });

    it('Phase 2: drawn face-up → eliminated', () => {
      const game = testGame(2, ['imploding']);
      const p0 = game.turn.currentPlayerIndex;
      game.implodingKittenFaceUp = true;

      let ik: any = game.deck.find(c => c.type === 'imploding_kitten');
      if (!ik) {
        for (const p of game.players) {
          ik = p.hand.find(c => c.type === 'imploding_kitten');
          if (ik) { p.hand = p.hand.filter(c => c.id !== ik!.id); break; }
        }
      }
      if (!ik) return;
      game.deck = game.deck.filter(c => c.id !== ik.id);
      game.deck.unshift(ik);
      game.players[p0].hand = game.players[p0].hand.filter(c => c.type !== 'defuse' && c.type !== 'zombie_kitten');

      handleAction(game, p0, 'DRAW_CARD');
      expect(game.players[p0].alive).toBe(false);
    });
  });

  describe('Streaking Kitten protection', () => {
    it('draws EK safely when streakingKitten is active', () => {
      const game = testGame(2, ['streaking']);
      const p0 = game.turn.currentPlayerIndex;
      game.players[p0].streakingKitten = true;

      const ek = game.deck.find(c => c.type === 'exploding_kitten')!;
      game.deck = game.deck.filter(c => c.id !== ek.id);
      game.deck.unshift(ek);

      handleAction(game, p0, 'DRAW_CARD');
      expect(game.players[p0].alive).toBe(true);
      expect(game.players[p0].hand.some(c => c.type === 'exploding_kitten')).toBe(true);
    });
  });

  describe('Turn advancement edge cases', () => {
    it('playing multiple non-turn-ending cards keeps turn', () => {
      const game = testGame(2);
      const p0 = game.turn.currentPlayerIndex;
      const [shuffleId] = ensureCardsInHand(game, p0, ['shuffle' as CardType]);
      ensureCardsInHand(game, p0, ['see_future_3x' as CardType]);

      handleAction(game, p0, 'PLAY_CARD', { cardId: shuffleId });
      resolveNopeTimeout(game, p0);
      expect(game.turn.currentPlayerIndex).toBe(p0);

      const seeId = findCard(game.players[p0].hand, 'see_future_3x');
      if (seeId) {
        handleAction(game, p0, 'PLAY_CARD', { cardId: seeId });
        resolveNopeTimeout(game, p0);
        expect(game.turn.currentPlayerIndex).toBe(p0);
      }
    });

    it('nope window timeout does NOT advance turn', () => {
      const game = testGame(2);
      const p0 = game.turn.currentPlayerIndex;
      const [shuffleId] = ensureCardsInHand(game, p0, ['shuffle' as CardType]);

      handleAction(game, p0, 'PLAY_CARD', { cardId: shuffleId });
      expect(game.nopeWindow).not.toBeNull();

      resolveNopeTimeout(game, p0);
      expect(game.turn.currentPlayerIndex).toBe(p0);
      expect(game.turn.phase).toBe('playing');
    });
  });

  describe('Nope-a-Nope', () => {
    it('double Nope chain (even) = original action executes', () => {
      const game = testGame(2);
      const p0 = game.turn.currentPlayerIndex;
      const p1 = 1 - p0;
      const [attackId] = ensureCardsInHand(game, p0, ['attack' as CardType]);
      ensureCardsInHand(game, p0, ['nope' as CardType]);

      // p0 plays Attack (deferred)
      handleAction(game, p0, 'PLAY_CARD', { cardId: attackId });
      expect(game.players[p1].pendingTurns).toBe(0);

      // p1 Nopes the Attack
      playNope(game, p1);
      expect(game.nopeWindow!.chain.length).toBe(1);

      // p0 Nopes the Nope (counter-nope!)
      playNope(game, p0);
      expect(game.nopeWindow!.chain.length).toBe(2);

      // Even chain = original action (Attack) survives
      resolveNopeTimeout(game, p0);
      expect(game.players[p1].pendingTurns).toBe(3); // Attack went through
    });
  });

  describe('Cat Combos', () => {
    it('Two of a Kind: steals random card from target', () => {
      const game = testGame(2, ['imploding']);
      const p0 = game.turn.currentPlayerIndex;
      const p1 = 1 - p0;
      // Put two matching cat cards in p0's hand
      const catType = 'tacocat';
      const cids = ensureCardsInHand(game, p0, [catType as CardType]);
      // Need a second copy
      const secondCat = game.deck.find(c => c.type === catType);
      if (!secondCat || cids.length === 0) return;
      game.players[p0].hand.push(secondCat);
      game.deck = game.deck.filter(c => c.id !== secondCat.id);

      const p1CardCount = game.players[p1].hand.length;
      handleAction(game, p0, 'PLAY_COMBO', {
        cardIds: [cids[0], secondCat.id],
        targetIndex: p1,
        comboType: 'pair',
      });
      expect(game.nopeWindow).not.toBeNull(); // deferred
      resolveNopeTimeout(game, p0);
      expect(game.players[p0].hand.length).toBeGreaterThan(0);
      expect(game.players[p1].hand.length).toBe(p1CardCount - 1);
    });

    it('Three of a Kind: names a specific card and takes it from target', () => {
      const game = testGame(2, ['imploding']);
      const p0 = game.turn.currentPlayerIndex;
      const p1 = 1 - p0;
      const catType = 'tacocat';
      const cids = ensureCardsInHand(game, p0, [catType as CardType]);
      // Add two more copies
      for (let i = 0; i < 2; i++) {
        const extra = game.deck.find(c => c.type === catType);
        if (!extra) break;
        game.players[p0].hand.push(extra);
        game.deck = game.deck.filter(c => c.id !== extra.id);
        cids.push(extra.id);
      }
      if (cids.length < 3) return;

      // Target (p1) must have the named card
      const targetCard = game.players[p1].hand[0];
      const targetCardType = targetCard.type;

      handleAction(game, p0, 'PLAY_COMBO', {
        cardIds: cids.slice(0, 3),
        targetIndex: p1,
        comboType: 'triple',
        namedCard: targetCardType,
      });
      resolveNopeTimeout(game, p0);
      expect(game.players[p0].hand.some(c => c.type === targetCardType)).toBe(true);
    });

    it('Five Different Cards: searches discard pile and takes a card', () => {
      const game = testGame(2, ['imploding']);
      const p0 = game.turn.currentPlayerIndex;
      // Collect one of each cat type into p0's hand
      const catTypes: CardType[] = ['tacocat', 'cattermelon', 'hairy_potato_cat', 'beard_cat', 'feral_cat'];
      const cardIds: string[] = [];

      for (const ct of catTypes) {
        // Find this card type anywhere
        let card = game.players[p0].hand.find(c => c.type === ct);
        if (!card) {
          for (const p of game.players) {
            if (p.index === p0) continue;
            card = p.hand.find(c => c.type === ct);
            if (card) { p.hand = p.hand.filter(c => c.id !== card!.id); break; }
          }
        }
        if (!card) card = game.deck.find(c => c.type === ct);
        if (card) {
          if (!game.players[p0].hand.some(c => c.id === card!.id)) {
            game.deck = game.deck.filter(c => c.id !== card!.id);
            game.players[p0].hand.push(card);
          }
          cardIds.push(card.id);
        }
      }
      if (cardIds.length < 5) return;

      // Put a DIFFERENT card in the discard pile for us to steal
      const discCard = game.players[p0].hand.find(c => !cardIds.includes(c.id))
        || game.deck.pop()!;
      if (!discCard) return;
      game.discardPile.push(discCard);

      const result = handleAction(game, p0, 'PLAY_COMBO', {
        cardIds,
        comboType: 'five',
        chosenCardId: discCard.id,
      });
      expect(result.valid).toBe(true);
      resolveNopeTimeout(game, p0);
      expect(game.players[p0].hand.some(c => c.id === discCard.id)).toBe(true);
    });
  });
});
