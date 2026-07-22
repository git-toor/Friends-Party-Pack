import type { GameState, GameAction, EffectDefinition, Card, CardType, PlayerState } from './types.js';

export type EffectHandler = (
  state: GameState,
  effect: EffectDefinition,
  action: GameAction,
  callbacks: EffectCallbacks
) => EffectResult;

export interface EffectResult {
  success: boolean;
  nopeable?: boolean;
  requiresResponse?: boolean;
  eliminated?: number[];
  drawnCards?: Card[];
}

export interface EffectCallbacks {
  pushAction: (action: GameAction) => void;
  queueNopeWindow: (actionId: string) => void;
  cancelNopeWindow: () => void;
  broadcast: (event: string, payload: any) => void;
  endTurn: () => void;
}

const handlers = new Map<string, EffectHandler>();

export function registerEffect(type: string, handler: EffectHandler): void {
  handlers.set(type, handler);
}

export function resolveEffect(
  state: GameState,
  effect: EffectDefinition,
  action: GameAction,
  callbacks: EffectCallbacks
): EffectResult {
  const handler = handlers.get(effect.type);
  if (!handler) return { success: false };
  return handler(state, effect, action, callbacks);
}

// ─── ADD_TURNS ────────────────────────────────────────
registerEffect('ADD_TURNS', (state, effect, action, _callbacks) => {
  const amount = effect.amount ?? 2;
  const targetIdx = nextPlayerIndex(state);
  state.players[targetIdx].pendingTurns += amount;
  return { success: true, nopeable: true };
});

// ─── SKIP_TURNS ───────────────────────────────────────
registerEffect('SKIP_TURNS', (state, _effect, _action, callbacks) => {
  const current = state.players[state.turn.currentPlayerIndex];
  if (current.pendingTurns > 0) {
    current.pendingTurns = 1;
  }
  callbacks.endTurn();
  return { success: true, nopeable: false };
});

// ─── FORCE_GIVE (Favor) ───────────────────────────────
registerEffect('FORCE_GIVE', (state, _effect, action, callbacks) => {
  const targetIdx = action.payload?.targetIndex;
  if (targetIdx === undefined || targetIdx < 0 || targetIdx >= state.players.length) {
    return { success: false };
  }
  const target = state.players[targetIdx];
  if (!target.alive || target.hand.length === 0) {
    return { success: false, error: 'Target has no cards' };
  }
  const favorAction: GameAction = {
    id: crypto.randomUUID(),
    playerIndex: targetIdx,
    type: 'RESOLVE_FAVOR',
    payload: { cardIds: target.hand.map(c => c.id) },
    status: 'awaiting_response',
    createdAt: Date.now(),
  };
  callbacks.pushAction(favorAction);
  callbacks.broadcast('FAVOR_REQUEST', {
    fromIndex: action.playerIndex,
    toIndex: targetIdx,
    cardIds: target.hand.map(c => c.id),
  });
  return { success: true, nopeable: true, requiresResponse: true };
});

// ─── IMPLODING_KITTEN ──────────────────────────────────
registerEffect('IMPLODING_KITTEN', (state, _effect, _action, callbacks) => {
  const current = state.players[state.turn.currentPlayerIndex];
  if (!state.implodingKittenFaceUp) {
    // First draw: remove from hand, put back face-up in deck at random position
    state.implodingKittenFaceUp = true;
    const ikIdx = current.hand.findIndex(c => c.type === 'imploding_kitten');
    if (ikIdx !== -1) {
      const [ik] = current.hand.splice(ikIdx, 1);
      const pos = Math.floor(Math.random() * state.deck.length);
      state.deck.splice(pos, 0, ik);
    }
    callbacks.broadcast('IMPLODING_KITTEN_DRAWN', {
      playerIndex: state.turn.currentPlayerIndex,
      faceUp: false,
    });
    return { success: true, requiresResponse: false };
  }
  // Already face-up: instant elimination (cannot defuse)
  current.alive = false;
  callbacks.broadcast('PLAYER_ELIMINATED', {
    playerIndex: state.turn.currentPlayerIndex,
    isZombie: false,
  });
  checkWinCondition(state);
  return { success: true, eliminated: [state.turn.currentPlayerIndex] };
});

// ─── ALTER_FUTURE ──────────────────────────────────────
registerEffect('ALTER_FUTURE', (state, effect, _action, callbacks) => {
  const count = effect.amount ?? 3;
  const topCards = state.deck.slice(0, count).map(c => ({ id: c.id, type: c.type }));
  callbacks.broadcast('ALTER_FUTURE_RESULT', { cards: topCards });
  return { success: true, nopeable: true };
});

// ─── DRAW_FROM_BOTTOM ──────────────────────────────────
registerEffect('DRAW_FROM_BOTTOM', (state, _effect, _action, _callbacks) => {
  const current = state.players[state.turn.currentPlayerIndex];
  current.pendingDrawFromBottom = true;
  return { success: true, nopeable: true };
});

// ─── REVERSE_DIRECTION ─────────────────────────────────
registerEffect('REVERSE_DIRECTION', (state, _effect, _action, callbacks) => {
  state.turn.direction *= -1;
  callbacks.broadcast('TURN_DIRECTION_REVERSED', { direction: state.turn.direction });
  callbacks.endTurn();
  return { success: true, nopeable: true };
});

// ─── TARGETED_ATTACK ───────────────────────────────────
registerEffect('TARGETED_ATTACK', (state, effect, action, _callbacks) => {
  const targetIdx = action.payload?.targetIndex;
  if (targetIdx === undefined || targetIdx < 0 || targetIdx >= state.players.length) {
    return { success: false };
  }
  const target = state.players[targetIdx];
  if (!target.alive) return { success: false };
  const amount = effect.amount ?? 2;
  target.pendingTurns += amount;
  return { success: true, nopeable: true };
});

// ─── SHUFFLE_DECK ─────────────────────────────────────
registerEffect('SHUFFLE_DECK', (state, _effect, _action, callbacks) => {
  shuffleArray(state.deck);
  callbacks.broadcast('DECK_SHUFFLED', {});
  return { success: true, nopeable: true };
});

// ─── SEE_FUTURE ───────────────────────────────────────
registerEffect('SEE_FUTURE', (state, effect, _action, callbacks) => {
  const count = effect.amount ?? 3;
  const topCards = state.deck.slice(0, count).map(c => ({ id: c.id, type: c.type }));
  callbacks.broadcast('SEE_FUTURE_RESULT', { cards: topCards });
  return { success: true, nopeable: true };
});

// ─── NOPE ─────────────────────────────────────────────
registerEffect('NOPE', (state, _effect, _action, callbacks) => {
  callbacks.cancelNopeWindow();
  return { success: true, nopeable: false };
});

// ─── EXPLODE ──────────────────────────────────────────
registerEffect('EXPLODE', (state, effect, _action, callbacks) => {
  const defusable = effect.defusable ?? true;
  const current = state.players[state.turn.currentPlayerIndex];
  if (defusable && hasDefuse(current)) {
    const defuseAction: GameAction = {
      id: crypto.randomUUID(),
      playerIndex: state.turn.currentPlayerIndex,
      type: 'RESOLVE_DEFUSE',
      payload: { cardIds: current.hand.filter(c => c.type === 'defuse').map(c => c.id) },
      status: 'awaiting_response',
      createdAt: Date.now(),
    };
    callbacks.pushAction(defuseAction);
    callbacks.broadcast('DEFUSE_WINDOW', {
      playerIndex: state.turn.currentPlayerIndex,
      deckSize: state.deck.length,
    });
    return { success: true, requiresResponse: true };
  }
  // Player is eliminated
  current.alive = false;
  callbacks.broadcast('PLAYER_ELIMINATED', {
    playerIndex: state.turn.currentPlayerIndex,
    isZombie: false,
  });
  checkWinCondition(state);
  return { success: true, eliminated: [state.turn.currentPlayerIndex] };
});

// ─── DEFUSE_AND_INSERT ────────────────────────────────
registerEffect('DEFUSE_AND_INSERT', (state, _effect, _action, _callbacks) => {
  return { success: true };
});

// ─── CAT_PAIR_SHUFFLE ─────────────────────────────────
registerEffect('CAT_PAIR_SHUFFLE', (state, _effect, action, callbacks) => {
  const targetIdx = action.payload?.targetIndex;
  if (targetIdx === undefined || targetIdx < 0 || targetIdx >= state.players.length) {
    return { success: false };
  }
  const target = state.players[targetIdx];
  if (!target.alive || target.hand.length === 0) {
    return { success: false, error: 'Target has no cards' };
  }
  const favorAction: GameAction = {
    id: crypto.randomUUID(),
    playerIndex: targetIdx,
    type: 'RESOLVE_FAVOR',
    payload: { cardIds: target.hand.map(c => c.id) },
    status: 'awaiting_response',
    createdAt: Date.now(),
  };
  callbacks.pushAction(favorAction);
  callbacks.broadcast('FAVOR_REQUEST', {
    fromIndex: action.playerIndex,
    toIndex: targetIdx,
    cardIds: target.hand.map(c => c.id),
  });
  return { success: true, nopeable: true, requiresResponse: true };
});

// ─── NONE (placeholder for future expansion cards) ────
registerEffect('NONE', () => ({ success: true }));

// ─── Helpers ──────────────────────────────────────────
function nextPlayerIndex(state: GameState): number {
  let idx = state.turn.currentPlayerIndex + state.turn.direction;
  if (idx < 0) idx = state.players.length - 1;
  if (idx >= state.players.length) idx = 0;
  // Skip dead players
  let attempts = 0;
  while (!state.players[idx].alive && attempts < state.players.length) {
    idx += state.turn.direction;
    if (idx < 0) idx = state.players.length - 1;
    if (idx >= state.players.length) idx = 0;
    attempts++;
  }
  return idx;
}

function hasDefuse(player: PlayerState): boolean {
  return player.hand.some(c => c.type === 'defuse');
}

// ─── STREAKING_KITTEN ──────────────────────────────────
registerEffect('STREAKING_KITTEN', (state, _effect, action, callbacks) => {
  const player = state.players[action.playerIndex];
  const cardId = action.payload?.cardId;
  player.streakingKitten = true;
  // Remove from hand instead — card is now "in front of player"
  const handIdx = player.hand.findIndex(c => c.id === cardId);
  if (handIdx !== -1) {
    player.hand.splice(handIdx, 1);
  }
  callbacks.broadcast('STREAKING_KITTEN_ACTIVATED', { playerIndex: action.playerIndex });
  // Don't add to discard — card is on table
  return { success: true, nopeable: true };
});

// ─── SUPER_SKIP ────────────────────────────────────────
registerEffect('SUPER_SKIP', (state, _effect, _action, callbacks) => {
  const current = state.players[state.turn.currentPlayerIndex];
  current.pendingTurns = 0;
  callbacks.endTurn();
  return { success: true, nopeable: true };
});

// ─── SWAP_TOP_BOTTOM ───────────────────────────────────
registerEffect('SWAP_TOP_BOTTOM', (state, _effect, _action, callbacks) => {
  if (state.deck.length < 2) return { success: true, nopeable: true };
  const last = state.deck.length - 1;
  [state.deck[0], state.deck[last]] = [state.deck[last], state.deck[0]];
  callbacks.broadcast('DECK_SHUFFLED', { type: 'swap' });
  return { success: true, nopeable: true };
});

// ─── GARBAGE_COLLECTION ────────────────────────────────
registerEffect('GARBAGE_COLLECTION', (state, _effect, _action, _callbacks) => {
  const collected: Card[] = [];
  for (const player of state.players) {
    if (!player.alive) continue;
    if (player.hand.length > 0) {
      const chosen = player.hand.splice(Math.floor(Math.random() * player.hand.length), 1)[0];
      collected.push(chosen);
    }
  }
  state.deck.push(...collected);
  shuffleArray(state.deck);
  return { success: true, nopeable: true };
});

// ─── CATOMIC_BOMB ──────────────────────────────────────
registerEffect('CATOMIC_BOMB', (state, _effect, _action, callbacks) => {
  const allEKs: Card[] = [];
  const remainingDeck: Card[] = [];
  for (const c of state.deck) {
    if (c.type === 'exploding_kitten' || c.type === 'imploding_kitten') {
      allEKs.push(c);
    } else {
      remainingDeck.push(c);
    }
  }
  // Also check discard pile
  const remainingDiscard: Card[] = [];
  for (const c of state.discardPile) {
    if (c.type === 'exploding_kitten' || c.type === 'imploding_kitten') {
      allEKs.push(c);
    } else {
      remainingDiscard.push(c);
    }
  }
  state.deck = [...allEKs, ...remainingDeck];
  state.discardPile = remainingDiscard;
  callbacks.broadcast('DECK_SHUFFLED', { type: 'catomic' });
  return { success: true, nopeable: true };
});

// ─── MARK ──────────────────────────────────────────────
registerEffect('MARK', (state, _effect, action, callbacks) => {
  const targetIdx = action.payload?.targetIndex;
  if (targetIdx === undefined || targetIdx < 0 || targetIdx >= state.players.length) {
    return { success: false };
  }
  const target = state.players[targetIdx];
  if (!target.alive || target.hand.length === 0) return { success: false };
  const randomCard = target.hand[Math.floor(Math.random() * target.hand.length)];
  if (!target.markedCardIds.includes(randomCard.id)) {
    target.markedCardIds.push(randomCard.id);
  }
  callbacks.broadcast('MARKED_CARD', {
    playerIndex: targetIdx,
    card: { id: randomCard.id, type: randomCard.type },
  });
  return { success: true, nopeable: true };
});

// ─── CURSE_CAT_BUTT ────────────────────────────────────
registerEffect('CURSE_CAT_BUTT', (state, _effect, action, callbacks) => {
  const targetIdx = action.payload?.targetIndex;
  if (targetIdx === undefined || targetIdx < 0 || targetIdx >= state.players.length) {
    return { success: false };
  }
  const target = state.players[targetIdx];
  if (!target.alive) return { success: false };
  target.cursed = true;
  callbacks.broadcast('PLAYER_CURSED', { playerIndex: targetIdx });
  return { success: true, nopeable: true };
});

export function shuffleArray<T>(arr: T[]): void {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

function checkWinCondition(state: GameState): void {
  const alive = state.players.filter(p => p.alive);
  if (alive.length <= 1) {
    state.turn.phase = 'game_over';
    state.winner = alive[0]?.index ?? null;
  }
}
