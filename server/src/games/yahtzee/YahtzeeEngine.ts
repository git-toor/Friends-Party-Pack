// ─── Types ─────────────────────────────────────────────────
export type YahtzeeCategory =
  | 'ones' | 'twos' | 'threes' | 'fours' | 'fives' | 'sixes'
  | 'three_of_a_kind' | 'four_of_a_kind' | 'full_house'
  | 'small_straight' | 'large_straight' | 'yahtzee' | 'chance';

export type RollPhase = 0 | 1 | 2 | 3;
export type TurnPhase = 'WAITING_FOR_ROLL' | 'WAITING_FOR_KEEP' | 'WAITING_FOR_CATEGORY' | 'TURN_OVER';

export interface YahtzeeTurn {
  dice: number[];           // current dice values
  kept: boolean[];          // which dice are kept (not rolled next)
  rollPhase: RollPhase;     // 1, 2, or 3
  phase: TurnPhase;
}

export interface YahtzeePlayerState {
  scores: Partial<Record<YahtzeeCategory, number>>;
  yahtzeeBonusCount: number;  // extra yahtzees beyond first
}

export interface YahtzeeGameState {
  players: YahtzeePlayerState[];
  turn: YahtzeeTurn;
  currentPlayerIndex: number;
  round: number;              // 1-13
  totalRounds: number;
  winners: number[];          // indices of winning players (empty if game ongoing)
  started: boolean;
}

export interface GameAction {
  type: 'ROLL' | 'KEEP' | 'SCORE';
  payload?: any;
}

export interface GameResult {
  state: YahtzeeGameState;
  valid: boolean;
  error?: string;
  diceValues?: number[];
}

const CATEGORIES: YahtzeeCategory[] = [
  'ones', 'twos', 'threes', 'fours', 'fives', 'sixes',
  'three_of_a_kind', 'four_of_a_kind', 'full_house',
  'small_straight', 'large_straight', 'yahtzee', 'chance',
];

// ─── Create Initial State ─────────────────────────────────
export function createGame(playerCount: number): YahtzeeGameState {
  return {
    players: Array.from({ length: playerCount }, () => ({
      scores: {},
      yahtzeeBonusCount: 0,
    })),
    turn: {
      dice: [0, 0, 0, 0, 0],
      kept: [false, false, false, false, false],
      rollPhase: 0,
      phase: 'WAITING_FOR_ROLL',
    },
    currentPlayerIndex: 0,
    round: 1,
    totalRounds: 13,
    winners: [],
    started: true,
  };
}

// ─── Dice Rolling ─────────────────────────────────────────
function rollDice(count: number): number[] {
  return Array.from({ length: count }, () => Math.floor(Math.random() * 6) + 1);
}

// ─── Handle Actions ───────────────────────────────────────
export function handleAction(state: YahtzeeGameState, playerIndex: number, action: GameAction): GameResult {
  if (!state.started) return { state, valid: false, error: 'Game not started' };
  if (playerIndex !== state.currentPlayerIndex) return { state, valid: false, error: 'Not your turn' };

  switch (action.type) {
    case 'ROLL':
      return handleRoll(state);
    case 'KEEP':
      return handleKeep(state, action.payload?.indices);
    case 'SCORE':
      return handleScore(state, action.payload?.category);
    default:
      return { state, valid: false, error: 'Invalid action' };
  }
}

function handleRoll(state: YahtzeeGameState): GameResult {
  const turn = { ...state.turn };
  const newState = { ...state, turn };

  if (turn.phase !== 'WAITING_FOR_ROLL') {
    return { state, valid: false, error: 'Cannot roll now' };
  }

  // Roll dice that aren't kept
  const newDice = [...turn.dice];
  for (let i = 0; i < 5; i++) {
    if (!turn.kept[i]) {
      newDice[i] = rollDice(1)[0];
    }
  }

  turn.dice = newDice;
  turn.rollPhase = (turn.rollPhase + 1) as RollPhase;
  turn.phase = turn.rollPhase >= 3 ? 'WAITING_FOR_CATEGORY' : 'WAITING_FOR_KEEP';

  return { state: newState, valid: true, diceValues: newDice };
}

function handleKeep(state: YahtzeeGameState, indices?: number[]): GameResult {
  const turn = { ...state.turn };
  const newState = { ...state, turn };

  if (turn.phase !== 'WAITING_FOR_KEEP') {
    return { state, valid: false, error: 'Cannot keep now' };
  }

  if (!indices || indices.length === 0) {
    // Player chose to keep nothing — skip to next phase
  } else {
    const newKept = [...turn.kept];
    for (const i of indices) {
      if (i >= 0 && i < 5) newKept[i] = true;
    }
    turn.kept = newKept;
  }

  // If all dice are kept, go to scoring; otherwise allow another roll
  if (turn.kept.every(k => k)) {
    turn.phase = 'WAITING_FOR_CATEGORY';
  } else {
    turn.phase = 'WAITING_FOR_ROLL';
  }

  return { state: newState, valid: true };
}

function handleScore(state: YahtzeeGameState, category?: YahtzeeCategory): GameResult {
  const turn = { ...state.turn };
  const newState = { ...state, turn };

  if (turn.phase !== 'WAITING_FOR_CATEGORY') {
    return { state, valid: false, error: 'Cannot score now' };
  }

  if (!category || !CATEGORIES.includes(category)) {
    return { state, valid: false, error: 'Invalid category' };
  }

  const player = { ...newState.players[newState.currentPlayerIndex] };
  player.scores = { ...player.scores };

  if (player.scores[category] !== undefined) {
    return { state, valid: false, error: 'Category already scored' };
  }

  const score = calculateScore(turn.dice, category);

  // Yahtzee bonus: if player already has Yahtzee scored and rolls another
  if (category === 'yahtzee' && score > 0 && player.scores['yahtzee'] && player.scores['yahtzee']! > 0) {
    player.yahtzeeBonusCount++;
  }

  player.scores[category] = score;
  newState.players = [...newState.players];
  newState.players[newState.currentPlayerIndex] = player;

  // Check if game is over
  const allScores = Object.keys(player.scores).length;
  if (allScores >= 13) {
    // All rounds complete for all players
    newState.winners = calculateWinners(newState.players);
  }

  // Advance to next turn
  advanceTurn(newState);

  return { state: newState, valid: true };
}

function advanceTurn(state: YahtzeeGameState): void {
  state.turn = {
    dice: [0, 0, 0, 0, 0],
    kept: [false, false, false, false, false],
    rollPhase: 0,
    phase: 'WAITING_FOR_ROLL',
  };

  // Move to next player
  state.currentPlayerIndex++;
  if (state.currentPlayerIndex >= state.players.length) {
    state.currentPlayerIndex = 0;
    state.round++;
    if (state.round > state.totalRounds) {
      state.winners = calculateWinners(state.players);
      state.started = false;
    }
  }
}

// ─── Score Calculation ────────────────────────────────────
export function calculateScore(dice: number[], category: YahtzeeCategory): number {
  const counts = [0, 0, 0, 0, 0, 0, 0];
  for (const d of dice) counts[d]++;

  const sum = dice.reduce((a, b) => a + b, 0);
  const sorted = [...dice].sort((a, b) => a - b);

  switch (category) {
    case 'ones': return counts[1] * 1;
    case 'twos': return counts[2] * 2;
    case 'threes': return counts[3] * 3;
    case 'fours': return counts[4] * 4;
    case 'fives': return counts[5] * 5;
    case 'sixes': return counts[6] * 6;

    case 'three_of_a_kind':
      return counts.some(c => c >= 3) ? sum : 0;

    case 'four_of_a_kind':
      return counts.some(c => c >= 4) ? sum : 0;

    case 'full_house':
      if (counts.includes(3) && counts.includes(2)) return 25;
      return 0;

    case 'small_straight':
      // Check for 4 consecutive numbers
      for (let i = 1; i <= 3; i++) {
        if (sorted.includes(i) && sorted.includes(i + 1) && sorted.includes(i + 2) && sorted.includes(i + 3)) {
          return 30;
        }
      }
      return 0;

    case 'large_straight':
      if (sorted.every((v, i) => v === i + 1) || sorted.every((v, i) => v === i + 2))
        return 40;
      return 0;

    case 'yahtzee':
      return counts.some(c => c >= 5) ? 50 : 0;

    case 'chance':
      return sum;

    default:
      return 0;
  }
}

// ─── Winner Calculation ───────────────────────────────────
export function calculateWinners(players: YahtzeePlayerState[]): number[] {
  const totals = players.map((p, i) => ({ index: i, total: getTotalScore(p) }));
  totals.sort((a, b) => b.total - a.total);
  const maxScore = totals[0]?.total ?? 0;
  return totals.filter(t => t.total === maxScore).map(t => t.index);
}

export function getTotalScore(player: YahtzeePlayerState): number {
  let total = 0;
  for (const cat of CATEGORIES.slice(0, 6)) {
    total += player.scores[cat] || 0;
  }
  if (total >= 63) total += 35; // upper section bonus

  for (const cat of CATEGORIES.slice(6)) {
    total += player.scores[cat] || 0;
  }

  total += (player.scores['yahtzee'] ?? 0 > 0 ? 1 : 0) * player.yahtzeeBonusCount * 100;

  return total;
}

export function getAvailableCategories(player: YahtzeePlayerState): YahtzeeCategory[] {
  return CATEGORIES.filter(c => player.scores[c] === undefined);
}
