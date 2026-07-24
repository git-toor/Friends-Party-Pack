import type { GameState, GameSettings, GameAction, GameResult, Card, CardType } from './types.js';
import type { EffectCallbacks, EffectResult } from './EffectEngine.js';
import { resolveEffect } from './EffectEngine.js';
import { canPlayCard, canDrawCard, createAction, advanceTurn, resolveDrawCard } from './ActionEngine.js';
import { createCard, getAllDefinitions } from '../cards/registry.js';
import { shuffleArray } from './EffectEngine.js';
import { serializeState } from '../state/Serializer.js';

export function createGame(settings: GameSettings): GameState {
  const playerCount = settings.playerCount;
  const state: GameState = {
    players: Array.from({ length: playerCount }, (_, i) => ({
      id: crypto.randomUUID(),
      name: `Player ${i + 1}`,
      index: i,
      hand: [],
      alive: true,
      dead: false,
      pendingTurns: 0,
      markedCardIds: [],
      cursed: false,
      stash: [],
    })),
    deck: [],
    discardPile: [],
    turn: {
      currentPlayerIndex: Math.floor(Math.random() * playerCount),
      direction: 1,
      phase: 'playing',
      attackCount: 0,
    },
    actionStack: [],
    nopeWindow: null,
    settings,
    winner: null,
    implodingKittenFaceUp: false,
    pendingCardView: null,
    lastStolenCard: null,
    lastPlayedCard: null,
    clairvoyanceAvailable: false,
  };

  state.deck = buildDeck(playerCount, settings.expansions);
  dealCards(state, playerCount);
  return state;
}

function buildDeck(playerCount: number, expansions?: string[]): Card[] {
  const deck: Card[] = [];
  const defs = getAllDefinitions(expansions);
  for (const def of defs) {
    const count = typeof def.copies === 'function' ? def.copies(playerCount) : def.copies;
    for (let i = 0; i < count; i++) {
      deck.push(createCard(def.id));
    }
  }
  shuffleArray(deck);
  return deck;
}

function dealCards(state: GameState, playerCount: number): void {
  const handSize = playerCount <= 3 ? 7 : 5;
  const defuseCards = state.deck.filter(c => c.type === 'defuse');
  const explodingCards = state.deck.filter(c => c.type === 'exploding_kitten');
  const otherCards = state.deck.filter(c => c.type !== 'defuse' && c.type !== 'exploding_kitten');
  // Give 1 defuse to each player
  for (const player of state.players) {
    const defuse = defuseCards.pop();
    player.hand = defuse ? [defuse] : [];
  }
  // Deal remaining hand from non-exploding pool
  const pool = [...otherCards, ...defuseCards];
  shuffleArray(pool);
  for (const player of state.players) {
    const needed = handSize - player.hand.length;
    if (needed > 0) player.hand.push(...pool.splice(0, needed));
  }
  // Shuffle each hand so the free defuse isn't always at position 0
  for (const player of state.players) {
    shuffleArray(player.hand);
  }
  state.deck = [...pool, ...explodingCards];
  shuffleArray(state.deck);
}

export function handleAction(
  state: GameState,
  playerIndex: number,
  actionType: string,
  payload?: any
): GameResult {
  // Clear transient display state
  state.pendingCardView = null;
  state.clairvoyanceAvailable = false;

  const makeCallbacks = (): EffectCallbacks => ({
    pushAction: (action: GameAction) => {
      state.actionStack.push(action);
    },
    queueNopeWindow: (actionId: string) => {
      const windowMs = state.settings.nopeWindowDuration ?? 5000;
      state.nopeWindow = {
        expiresAt: Date.now() + windowMs,
        targetActionId: actionId,
        chain: [],
      };
    },
    cancelNopeWindow: () => {
      state.nopeWindow = null;
    },
    broadcast: (event: string, _payload: any) => {},
    endTurn: () => {
      advanceTurn(state);
    },
  });

  // Clear one-time notification flags at the start of each action
  state.lastStolenCard = null;
  state.lastPlayedCard = null;
  state.lastDrawFromBottom = undefined;

  switch (actionType) {
    case 'PLAY_CARD': {
      const cardId = payload?.cardId;
      const player = state.players[playerIndex];
      const playedCard = player.hand.find(c => c.id === cardId);

      if (state.nopeWindow) {
        if (!playedCard || playedCard.type !== 'nope') {
          return { state, valid: false, error: 'Only Nope can be played during nope window. Use RESOLVE_NOPE action.' };
        }
      } else {
        const err = canPlayCard(state, playerIndex, cardId);
        if (err) return { state, valid: false, error: err };
      }
      const cardIndex = player.hand.findIndex(c => c.id === cardId);
      if (cardIndex === -1) return { state, valid: false, error: 'Card not in hand' };
      const card = player.hand.splice(cardIndex, 1)[0];

      // Clairvoyance can only be played when a Defuse was just used
      if (card.type === 'clairvoyance' && !state.clairvoyanceAvailable) {
        player.hand.push(card);
        return { state, valid: false, error: 'Clairvoyance can only be used after a Defuse' };
      }

      // Show played card immediately for all players
      state.lastPlayedCard = { type: card.type, name: card.definition.name, playerIndex };

      const action = createAction('PLAY_CARD', playerIndex, payload);
      const eff = card.definition.effect;

      // Pre-validate target-dependent effects before deferring
      if (eff.nopeable !== false) {
        if (eff.type === 'FORCE_GIVE' || eff.type === 'TARGETED_ATTACK' || eff.type === 'BARKING_KITTEN' ||
            eff.type === 'MARK' || eff.type === 'CURSE_CAT_BUTT' || eff.type === 'CAT_PAIR_SHUFFLE' || eff.type === 'CAT_COMBO') {
          const tIdx = payload?.targetIndex;
          if (tIdx === undefined || tIdx < 0 || tIdx >= state.players.length || !state.players[tIdx].alive) {
            player.hand.push(card);
            return { state, valid: false, error: 'Invalid target' };
          }
        }
        if (eff.type === 'FORCE_GIVE' || eff.type === 'CAT_PAIR_SHUFFLE') {
          const tIdx = payload?.targetIndex;
          if (tIdx !== undefined && state.players[tIdx].hand.length === 0) {
            player.hand.push(card);
            return { state, valid: false, error: 'Target has no cards' };
          }
        }
        if (eff.type === 'MARK') {
          const tIdx = payload?.targetIndex;
          if (tIdx !== undefined && tIdx >= 0 && tIdx < state.players.length && state.players[tIdx].hand.length === 0) {
            player.hand.push(card);
            return { state, valid: false, error: 'Target has no cards' };
          }
        }
        // Defer execution
        action.pendingCard = card;
        action.status = 'pending';
        state.actionStack.push(action);
        const nopeMs = state.settings.nopeWindowDuration ?? 5000;
        state.nopeWindow = {
          expiresAt: Date.now() + nopeMs,
          targetActionId: action.id,
          chain: [],
        };
        return { state, valid: true };
      }

      // Non-nopeable: execute immediately
      state.discardPile.push(card);
      const callbacks = makeCallbacks();
      const effectResult = resolveEffect(state, card.definition.effect, { ...action, payload: { ...payload, cardId: card.id } }, callbacks);
      if (!effectResult.success) {
        player.hand.push(card);
        state.discardPile.pop();
        return { state, valid: false, error: 'Card effect failed' };
      }
      if (card.type === 'streaking_kitten') {
        state.discardPile.pop();
      }
      return { state, valid: true };
    }

    case 'DRAW_CARD': {
      const err = canDrawCard(state, playerIndex);
      if (err) return { state, valid: false, error: err };

      const callbacks = makeCallbacks();
      return resolveDrawCard(state, playerIndex, callbacks);
    }

    case 'RESOLVE_DEFUSE': {
      if (state.turn.currentPlayerIndex !== playerIndex) {
        return { state, valid: false, error: 'Not your turn' };
      }
      const player = state.players[playerIndex];
      // Check for either defuse or zombie kitten
      const defuseIdx = player.hand.findIndex(c => c.type === 'defuse');
      const zombieIdx = player.hand.findIndex(c => c.type === 'zombie_kitten');
      const usingZombie = defuseIdx === -1 && zombieIdx !== -1;
      const cardIdx = usingZombie ? zombieIdx : defuseIdx;
      if (cardIdx === -1) return { state, valid: false, error: 'No Defuse or Zombie Kitten card' };
      player.hand.splice(cardIdx, 1)[0];
      // Remove the drawn Exploding Kitten from hand
      const ekHandIdx = player.hand.findIndex(c => c.type === 'exploding_kitten');
      if (ekHandIdx !== -1) player.hand.splice(ekHandIdx, 1);
      const explodingKitten: Card = {
        id: crypto.randomUUID(),
        type: 'exploding_kitten',
        definition: { id: 'exploding_kitten', name: 'Exploding Kitten', expansion: 'base', copies: 0, playable: {}, effect: { type: 'EXPLODE', defusable: true }, category: 'exploding' },
      };
      const insertIdx = payload?.insertIndex ?? Math.floor(Math.random() * (state.deck.length + 1));
      state.deck.splice(insertIdx, 0, explodingKitten);
      // If using Zombie Kitten, trigger revive
      if (usingZombie) {
        const deadPlayers = state.players.filter(p => p.dead);
        if (deadPlayers.length > 0) {
          const reviveTarget = deadPlayers[Math.floor(Math.random() * deadPlayers.length)];
          reviveTarget.alive = true;
          reviveTarget.dead = false;
        }
      }
      state.actionStack = state.actionStack.filter(a => a.type !== 'RESOLVE_DEFUSE');
      // Broadcast defuse resolution to all players
      const defCallbacks = makeCallbacks();
      defCallbacks.broadcast('DEFUSE_RESOLVED', {
        playerIndex,
        insertIndex: insertIdx,
        usingZombie,
      });
      // Allow clairvoyance to be played after a defuse
      state.clairvoyanceAvailable = true;
      advanceTurn(state);
      return { state, valid: true };
    }

    case 'RESOLVE_ALTER_FUTURE': {
      if (state.turn.currentPlayerIndex !== playerIndex) {
        return { state, valid: false, error: 'Not your turn' };
      }
      const viewCards = (state.pendingCardView as GameState['pendingCardView'])?.cards;
      if (!viewCards) {
        return { state, valid: false, error: 'No pending card view' };
      }
      const reordered = payload?.reorderedCards;
      if (!reordered || reordered.length !== viewCards.length) {
        return { state, valid: false, error: 'Invalid reordered cards' };
      }
      const currentIds = viewCards.map(c => c.id).sort().join(',');
      const newIds = [...reordered].sort().join(',');
      if (currentIds !== newIds) {
        return { state, valid: false, error: 'Card mismatch' };
      }
      const removed: Card[] = [];
      for (const id of reordered) {
        const idx = state.deck.findIndex(c => c.id === id);
        if (idx !== -1) {
          const [card] = state.deck.splice(idx, 1);
          removed.push(card);
        }
      }
      state.deck.splice(0, 0, ...removed);
      state.pendingCardView = null;
      return { state, valid: true };
    }

    case 'RESOLVE_ZOMBIE_REVIVE': {
      const player = state.players[playerIndex];
      const deadPlayers = state.players.filter(p => p.dead);
      if (deadPlayers.length === 0) return { state, valid: false, error: 'No dead players' };
      const targetIdx = payload?.targetIndex ?? deadPlayers[0].index;
      const target = state.players.find(p => p.index === targetIdx);
      if (!target || !target.dead) return { state, valid: false, error: 'Invalid revive target' };
      target.alive = true;
      target.dead = false;
      state.actionStack = state.actionStack.filter(a => a.type !== 'RESOLVE_ZOMBIE_REVIVE');
      const revCallbacks = makeCallbacks();
      revCallbacks.broadcast('PLAYER_REVIVED', { playerIndex: targetIdx });
      revCallbacks.broadcast('ZOMBIE_DEFUSE_RESOLVED', { playerIndex, revivedIndex: targetIdx });
      // Put EK back in deck
      const ekIdx = player.hand.findIndex(c => c.type === 'exploding_kitten');
      if (ekIdx !== -1) {
        const [ek] = player.hand.splice(ekIdx, 1);
        state.deck.splice(Math.floor(Math.random() * state.deck.length), 0, ek);
      }
      advanceTurn(state);
      return { state, valid: true };
    }

    case 'RESOLVE_TOWER_OF_POWER': {
      const towerAction = state.actionStack.find(a => a.type === 'RESOLVE_TOWER_OF_POWER');
      if (!towerAction) return { state, valid: false, error: 'No tower action pending' };
      const player = state.players[playerIndex];
      const cardData = towerAction.payload?.card as { id: string; type: string; name: string } | undefined;
      if (!cardData) return { state, valid: false, error: 'No card data' };
      const keep = payload?.keep !== false;
      if (!keep) {
        const ci = player.hand.findIndex(c => c.id === cardData.id);
        if (ci !== -1) {
          const [returned] = player.hand.splice(ci, 1);
          state.deck.unshift(returned);
        }
      }
      state.actionStack = state.actionStack.filter(a => a.type !== 'RESOLVE_TOWER_OF_POWER');
      return { state, valid: true };
    }

    case 'RESOLVE_FAVOR': {
      const favorAction = state.actionStack.find(a => a.type === 'RESOLVE_FAVOR');
      const victimIdx = payload?.victimIndex ?? favorAction?.playerIndex;
      const attackerIdx = favorAction?.payload?.fromPlayerIndex;
      if (victimIdx === undefined || attackerIdx === undefined) return { state, valid: false, error: 'No favor pending' };
      const victim = state.players[victimIdx];
      if (!victim.alive) return { state, valid: false, error: 'Victim is eliminated' };
      const cardId = payload?.cardId;
      const cardIndex = victim.hand.findIndex(c => c.id === cardId);
      if (cardIndex === -1) return { state, valid: false, error: 'Card not found in victim hand' };
      const stolenCard = victim.hand.splice(cardIndex, 1)[0];
      state.players[attackerIdx].hand.push(stolenCard);
      state.lastStolenCard = { type: stolenCard.type, name: stolenCard.definition.name, fromPlayerIndex: victimIdx, toPlayerIndex: attackerIdx };
      const favorActions = state.actionStack.filter(a => a.type === 'RESOLVE_FAVOR');
      for (const fa of favorActions) {
        fa.status = 'resolved';
      }
      state.actionStack = state.actionStack.filter(a => !(a.type === 'RESOLVE_FAVOR'));
      return { state, valid: true };
    }

    case 'RESOLVE_NOPE': {
      if (!state.nopeWindow) return { state, valid: false, error: 'No nope window' };
      const player = state.players[playerIndex];
      const nopeIdx = player.hand.findIndex(c => c.type === 'nope');
      if (nopeIdx === -1) return { state, valid: false, error: 'No Nope card' };
      player.hand.splice(nopeIdx, 1);
      state.nopeWindow.chain.push({ playerIndex, actionId: crypto.randomUUID() });
      if (state.nopeWindow.timeout) {
        clearTimeout(state.nopeWindow.timeout);
      }
      state.nopeWindow.expiresAt = Date.now() + (state.settings.nopeWindowDuration ?? 5000);
      return { state, valid: true };
    }

    case 'RESOLVE_NOPE_TIMEOUT': {
      if (!state.nopeWindow) return { state, valid: false, error: 'No nope window' };
      const chainLength = state.nopeWindow.chain.length;
      const targetAction = state.actionStack.find(a => a.id === state.nopeWindow?.targetActionId);

      if (chainLength % 2 === 1) {
        // Nope wins — discard cards without executing effect
        if (targetAction?.pendingCard) {
          state.discardPile.push(targetAction.pendingCard);
          targetAction.status = 'noped';
        }
        if ((targetAction as any)?.pendingCards) {
          for (const c of (targetAction as any).pendingCards) state.discardPile.push(c);
          targetAction!.status = 'noped';
        }
      } else {
        // Execute the deferred effect
        if (targetAction?.pendingCard) {
          const card = targetAction.pendingCard;
          state.discardPile.push(card);
          const deferCallbacks = makeCallbacks();
          resolveEffect(state, card.definition.effect, { ...targetAction, pendingCard: undefined }, deferCallbacks);
          if (card.type === 'streaking_kitten') state.discardPile.pop();
        }
        if ((targetAction as any)?.pendingCards) {
          const cards: Card[] = (targetAction as any).pendingCards;
          for (const c of cards) state.discardPile.push(c);
          const deferCallbacks = makeCallbacks();
          const comboPayload = targetAction?.payload || {};
          resolveEffect(state, { type: 'CAT_COMBO' } as any, { ...targetAction!, pendingCards: undefined, payload: comboPayload } as GameAction, deferCallbacks);
        }
      }
      state.actionStack = state.actionStack.filter(a => a.id !== state.nopeWindow?.targetActionId);
      state.nopeWindow = null;
      return { state, valid: true };
    }

    case 'PLAY_COMBO': {
      const player = state.players[playerIndex];
      const cardIds = payload?.cardIds as string[] | undefined;
      if (!cardIds || cardIds.length < 2) return { state, valid: false, error: 'Need at least 2 cards for combo' };

      const cards: Card[] = [];
      for (const cid of cardIds) {
        const idx = player.hand.findIndex(c => c.id === cid);
        if (idx === -1) return { state, valid: false, error: `Card ${cid} not in hand` };
        cards.push(player.hand.splice(idx, 1)[0]);
      }

      const catTypes = cards.map(c => c.type);
      const uniqueTypes = new Set(catTypes);
      const hasFeral = catTypes.includes('feral_cat' as any);

      let comboType: 'pair' | 'triple' | 'five' = 'pair';
      if (uniqueTypes.size === 1 || (uniqueTypes.size === 2 && hasFeral)) {
        comboType = catTypes.length >= 3 ? 'triple' : 'pair';
      } else if (uniqueTypes.size >= 5 || (uniqueTypes.size >= 4 && hasFeral)) {
        comboType = 'five';
      }

      // Defer execution — cat combos CAN be noped
      const comboAction = createAction('PLAY_COMBO', playerIndex, { ...payload, comboType });
      (comboAction as any).pendingCards = cards;
      comboAction.status = 'pending';
      state.actionStack.push(comboAction);
      const nopeMsEnd = state.settings.nopeWindowDuration ?? 5000;
      state.nopeWindow = {
        expiresAt: Date.now() + nopeMsEnd,
        targetActionId: comboAction.id,
        chain: [],
      };
      return { state, valid: true };
    }

    case 'END_TURN': {
      if (state.turn.currentPlayerIndex !== playerIndex) {
        return { state, valid: false, error: 'Not your turn' };
      }
      if (state.turn.phase !== 'playing') {
        return { state, valid: false, error: 'Cannot end turn now' };
      }
      if (state.actionStack.some(a => a.status === 'awaiting_response')) {
        return { state, valid: false, error: 'Resolve pending actions first' };
      }
      state.turn.phase = 'drawing';
      const callbacks = makeCallbacks();
      return resolveDrawCard(state, playerIndex, callbacks);
    }

    default:
      return { state, valid: false, error: `Unknown action: ${actionType}` };
  }
}
