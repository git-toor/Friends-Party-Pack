import type { GameState, Card } from '../engine/types.js';

export interface ClientPlayerView {
  id: string;
  name: string;
  index: number;
  cardCount: number;
  alive: boolean;
  dead: boolean;
  pendingTurns: number;
  streakingKitten?: boolean;
  cursed: boolean;
  markedCardCount: number;
  stashCount: number;
}

export interface ClientCardRef {
  id: string;
  type: string;
  name: string;
  marked?: boolean;
}

export interface ClientGameState {
  myHand: ClientCardRef[];
  myStash: ClientCardRef[];
  opponents: ClientPlayerView[];
  deckSize: number;
  discardCount: number;
  turn: {
    currentPlayerIndex: number;
    direction: number;
    phase: string;
    attackCount: number;
  };
  actionStack: { type: string; playerIndex: number; status: string }[];
  nopeWindow: {
    expiresAt: number;
    chain: { playerIndex: number }[];
  } | null;
  settings: { playerCount: number; expansions?: string[] };
  winner: number | null;
  implodingKittenFaceUp: boolean;
}

export function serializeState(state: GameState, playerIndex: number): ClientGameState {
  const player = state.players[playerIndex];
  return {
    myStash: player.stash.map(c => ({
      id: c.id,
      type: c.type,
      name: c.definition.name,
      marked: player.markedCardIds.includes(c.id),
    })),
    myHand: player.hand.map(c => ({
      id: c.id,
      type: c.type,
      name: c.definition.name,
      marked: player.markedCardIds.includes(c.id),
    })),
    opponents: state.players
      .filter(p => p.index !== playerIndex)
      .map(p => ({
        id: p.id,
        name: p.name,
        index: p.index,
        cardCount: p.hand.length,
        alive: p.alive,
        dead: p.dead,
        pendingTurns: p.pendingTurns,
        streakingKitten: p.streakingKitten,
        cursed: p.cursed,
        markedCardCount: p.markedCardIds.length,
        stashCount: p.stash.length,
      })),
    deckSize: state.deck.length,
    discardCount: state.discardPile.length,
    turn: {
      currentPlayerIndex: state.turn.currentPlayerIndex,
      direction: state.turn.direction,
      phase: state.turn.phase,
      attackCount: state.turn.attackCount,
    },
    actionStack: state.actionStack.map(a => ({
      type: a.type,
      playerIndex: a.playerIndex,
      status: a.status,
      payload: a.payload ? {
        cardIds: a.payload.cardIds,
        deadPlayerIndices: a.payload.deadPlayerIndices,
      } : undefined,
    })),
    nopeWindow: state.nopeWindow
      ? {
          expiresAt: state.nopeWindow.expiresAt,
          chain: state.nopeWindow.chain.map(c => ({ playerIndex: c.playerIndex })),
        }
      : null,
    settings: { playerCount: state.settings.playerCount, expansions: state.settings.expansions },
    winner: state.winner,
    implodingKittenFaceUp: state.implodingKittenFaceUp,
  };
}
