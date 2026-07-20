export type YahtzeeCategory =
  | 'ones' | 'twos' | 'threes' | 'fours' | 'fives' | 'sixes'
  | 'three_of_a_kind' | 'four_of_a_kind' | 'full_house'
  | 'small_straight' | 'large_straight' | 'yahtzee' | 'chance';

export type TurnPhase = 'WAITING_FOR_ROLL' | 'WAITING_FOR_KEEP' | 'WAITING_FOR_CATEGORY' | 'TURN_OVER';

export interface YahtzeeTurn {
  dice: number[];
  kept: boolean[];
  rollPhase: number;
  phase: TurnPhase;
}

export interface YahtzeePlayerState {
  scores: Partial<Record<YahtzeeCategory, number>>;
  yahtzeeBonusCount: number;
  isCurrentPlayer: boolean;
  totalScore: number;
  availableCategories: YahtzeeCategory[];
}

export interface YahtzeeGameState {
  currentPlayerIndex: number;
  round: number;
  totalRounds: number;
  winners: number[];
  started: boolean;
  isMyTurn: boolean;
  turn: YahtzeeTurn;
  players: YahtzeePlayerState[];
}
