export type CardType =
  | 'exploding_kitten' | 'defuse' | 'attack' | 'skip' | 'favor'
  | 'shuffle' | 'see_future_3x' | 'nope'
  | 'tacocat' | 'cattermelon' | 'hairy_potato_cat' | 'beard_cat';

export type EffectType =
  | 'ADD_TURNS' | 'SKIP_TURNS' | 'FORCE_GIVE' | 'SHUFFLE_DECK'
  | 'SEE_FUTURE' | 'NOPE' | 'EXPLODE' | 'DEFUSE_AND_INSERT' | 'CAT_PAIR_SHUFFLE' | 'NONE';

export interface EffectDefinition {
  type: EffectType;
  amount?: number;
  stackable?: boolean;
  selfTarget?: boolean;
  defusable?: boolean;
  requiresResponse?: string;
  responseWindowMs?: number;
  drawCount?: number;
}

export interface CardDefinition {
  id: CardType;
  name: string;
  expansion: string;
  copies: number | ((players: number) => number);
  playable: {
    requiresTarget?: boolean;
    requiresResponse?: string;
    playAtAnyTime?: boolean;
  };
  effect: EffectDefinition;
  category: 'action' | 'cat' | 'exploding' | 'defuse';
}

export interface Card {
  id: string;
  type: CardType;
  definition: CardDefinition;
}

export interface PlayerState {
  id: string;
  name: string;
  index: number;
  hand: Card[];
  alive: boolean;
  pendingTurns: number;
}

export type ActionType =
  | 'PLAY_CARD' | 'DRAW_CARD' | 'END_TURN'
  | 'RESOLVE_DEFUSE' | 'RESOLVE_FAVOR' | 'RESOLVE_NOPE';

export interface GameAction {
  id: string;
  playerIndex: number;
  type: ActionType;
  payload?: {
    cardId?: string;
    targetIndex?: number;
    insertIndex?: number;
    cardIds?: string[];
  };
  status: 'pending' | 'awaiting_response' | 'resolving' | 'resolved' | 'noped';
  createdAt: number;
  timeout?: NodeJS.Timeout;
}

export interface GameSettings {
  playerCount: number;
}

export interface TurnState {
  currentPlayerIndex: number;
  direction: 1 | -1;
  phase: 'playing' | 'drawing' | 'game_over';
  attackCount: number;
}

export interface GameState {
  players: PlayerState[];
  deck: Card[];
  discardPile: Card[];
  turn: TurnState;
  actionStack: GameAction[];
  nopeWindow: {
    expiresAt: number;
    targetActionId: string;
    chain: { playerIndex: number; actionId: string }[];
    timeout?: NodeJS.Timeout;
  } | null;
  settings: GameSettings;
  winner: number | null;
}

export interface GameResult {
  state: GameState;
  valid: boolean;
  error?: string;
}
