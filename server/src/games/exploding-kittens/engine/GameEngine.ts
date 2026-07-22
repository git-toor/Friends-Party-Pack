import type { GameState, GameSettings, GameAction, GameResult, Card } from './types.js';
import type { EffectCallbacks, EffectResult } from './EffectEngine.js';
import { resolveEffect } from './EffectEngine.js';
import { canPlayCard, canDrawCard, createAction, advanceTurn, isNopeable, resolveDrawCard } from './ActionEngine.js';
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
  const explodingCards = state.deck.filter(c => c.type === 'exploding_kitten');
  const nonExploding = state.deck.filter(c => c.type !== 'exploding_kitten');
  for (const player of state.players) {
    player.hand = nonExploding.splice(0, handSize);
  }
  state.deck = [...nonExploding, ...explodingCards];
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

  const makeCallbacks = (): EffectCallbacks => ({
    pushAction: (action: GameAction) => {
      state.actionStack.push(action);
    },
    queueNopeWindow: (actionId: string) => {
      const windowMs = 3000;
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

  switch (actionType) {
    case 'PLAY_CARD': {
      const cardId = payload?.cardId;
      const player = state.players[playerIndex];
      const playedCard = player.hand.find(c => c.id === cardId);

      // During nope window, only Nope cards can be played (from any player)
      if (state.nopeWindow) {
        if (!playedCard || playedCard.type !== 'nope') {
          return { state, valid: false, error: 'Only Nope can be played during nope window. Use RESOLVE_NOPE action.' };
        }
        // Allow Nope from any player — bypass turn check
      } else {
        const err = canPlayCard(state, playerIndex, cardId);
        if (err) return { state, valid: false, error: err };
      }
      const cardIndex = player.hand.findIndex(c => c.id === cardId);
      if (cardIndex === -1) return { state, valid: false, error: 'Card not in hand' };
      const card = player.hand.splice(cardIndex, 1)[0];
      state.discardPile.push(card);

      const action = createAction('PLAY_CARD', playerIndex, payload);
      const callbacks = makeCallbacks();
      const effectResult = resolveEffect(state, card.definition.effect, { ...action, payload: { ...payload, cardId: card.id } }, callbacks);

      if (!effectResult.success) {
        player.hand.push(card); // Put the card back
        state.discardPile.pop();
        return { state, valid: false, error: 'Card effect failed' };
      }

      // Streaking Kitten stays "on table" — remove from discard
      if (card.type === 'streaking_kitten') {
        state.discardPile.pop();
      }

      if (effectResult.nopeable && isNopeable(action)) {
        callbacks.queueNopeWindow(action.id);
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
      advanceTurn(state);
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
      const revCallbacks = makeCallbacks();
      revCallbacks.broadcast('PLAYER_REVIVED', { playerIndex: targetIdx });
      // Put EK back in deck
      const ekIdx = player.hand.findIndex(c => c.type === 'exploding_kitten');
      if (ekIdx !== -1) {
        const [ek] = player.hand.splice(ekIdx, 1);
        state.deck.splice(Math.floor(Math.random() * state.deck.length), 0, ek);
      }
      advanceTurn(state);
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
      const favorActions = state.actionStack.filter(a => a.type === 'RESOLVE_FAVOR');
      for (const fa of favorActions) {
        fa.status = 'resolved';
      }
      state.actionStack = state.actionStack.filter(a => !(a.type === 'RESOLVE_FAVOR'));
      advanceTurn(state);
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
      state.nopeWindow.expiresAt = Date.now() + 3000;
      return { state, valid: true };
    }

    case 'RESOLVE_NOPE_TIMEOUT': {
      if (!state.nopeWindow) return { state, valid: false, error: 'No nope window' };
      const chainLength = state.nopeWindow.chain.length;
      if (chainLength % 2 === 1) {
        const targetAction = state.actionStack.find(a => a.id === state.nopeWindow?.targetActionId);
        if (targetAction) {
          targetAction.status = 'noped';
        }
      }
      state.nopeWindow = null;
      return { state, valid: true };
    }

    case 'END_TURN': {
      if (state.turn.currentPlayerIndex !== playerIndex) {
        return { state, valid: false, error: 'Not your turn' };
      }
      if (state.turn.phase !== 'playing') {
        return { state, valid: false, error: 'Cannot end turn now' };
      }
      state.turn.phase = 'drawing';
      const callbacks = makeCallbacks();
      return resolveDrawCard(state, playerIndex, callbacks);
    }

    default:
      return { state, valid: false, error: `Unknown action: ${actionType}` };
  }
}
