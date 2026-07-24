export type TokenState = 'home' | 'path' | 'stretch' | 'finished';
export type TurnPhase = 'rolling' | 'moving';

export interface Token {
  state: TokenState;
  progress: number;
}

export interface PlayerState {
  tokens: Token[];
  finishedCount: number;
}

export interface GameState {
  players: PlayerState[];
  currentPlayer: number;
  diceValue: number | null;
  phase: TurnPhase;
  consecutiveSixes: number;
  winner: number | null;
}

export interface GameEvent {
  type: 'TOKEN_MOVED' | 'CAPTURE' | 'TOKEN_FINISHED' | 'BLOCK_FORMED';
  playerIndex: number;
  tokenIndex: number;
  from?: number;
  to?: number;
  victimPlayer?: number;
  victimToken?: number;
  position?: number;
}

export interface GameAction {
  type: 'ROLL_DICE' | 'MOVE_TOKEN';
  payload?: { tokenIndex: number };
}

export interface GameResult {
  state: GameState;
  valid: boolean;
  error?: string;
  events?: GameEvent[];
  diceValue?: number;
}

const PLAYER_OFFSETS = [0, 13, 26, 39];
const SAFE_SQUARES = [0, 8, 13, 21, 26, 34, 39, 47];
const PATH_LENGTH = 52;
const STRETCH_START = 52;
const FINISH = 58;

function absPath(progress: number, playerIndex: number): number {
  return (progress + PLAYER_OFFSETS[playerIndex]) % PATH_LENGTH;
}

function isSafe(progress: number, playerIndex: number): boolean {
  return SAFE_SQUARES.includes(absPath(progress, playerIndex));
}

function hasBlockAt(state: GameState, absPosition: number, excludePlayer: number): number | null {
  if (SAFE_SQUARES.includes(absPosition)) return null;
  for (let p = 0; p < state.players.length; p++) {
    if (p === excludePlayer) continue;
    const count = state.players[p].tokens.filter(
      t => (t.state === 'path') && absPath(t.progress, p) === absPosition
    ).length;
    if (count >= 2) return p;
  }
  return null;
}

function checkBlockOnPath(state: GameState, playerIndex: number, from: number, to: number): { valid: boolean; error?: string } {
  for (let p = from + 1; p <= to; p++) {
    const abs = absPath(p, playerIndex);
    const blocked = hasBlockAt(state, abs, playerIndex);
    if (blocked !== null) {
      return { valid: false, error: 'Path is blocked' };
    }
  }
  return { valid: true };
}

function handleCapture(state: GameState, playerIndex: number, progress: number): GameEvent[] {
  const abs = absPath(progress, playerIndex);
  if (isSafe(progress, playerIndex)) return [];
  const events: GameEvent[] = [];
  for (let p = 0; p < state.players.length; p++) {
    if (p === playerIndex) continue;
    for (let t = 0; t < state.players[p].tokens.length; t++) {
      const tok = state.players[p].tokens[t];
      if (tok.state === 'path' && absPath(tok.progress, p) === abs) {
        tok.state = 'home';
        tok.progress = -1;
        events.push({ type: 'CAPTURE', playerIndex, tokenIndex: -1, victimPlayer: p, victimToken: t });
      }
    }
  }
  return events;
}

function checkBlockFormed(state: GameState, playerIndex: number, progress: number): GameEvent | null {
  if (isSafe(progress, playerIndex)) return null;
  const abs = absPath(progress, playerIndex);
  const sameTokens = state.players[playerIndex].tokens.filter(
    t => (t.state === 'path') && absPath(t.progress, playerIndex) === abs
  );
  if (sameTokens.length >= 2) {
    return { type: 'BLOCK_FORMED', playerIndex, tokenIndex: -1, position: progress };
  }
  return null;
}

function advanceTurn(state: GameState): void {
  state.currentPlayer = (state.currentPlayer + 1) % state.players.length;
  state.phase = 'rolling';
  state.consecutiveSixes = 0;
}

function checkWin(state: GameState): void {
  for (let i = 0; i < state.players.length; i++) {
    if (state.players[i].finishedCount >= 4) {
      state.winner = i;
      state.phase = 'rolling';
      return;
    }
  }
}

export function createGame(playerCount: number): GameState {
  return {
    players: Array.from({ length: playerCount }, () => ({
      tokens: Array.from({ length: 4 }, () => ({ state: 'home' as TokenState, progress: -1 })),
      finishedCount: 0,
    })),
    currentPlayer: 0,
    diceValue: null,
    phase: 'rolling',
    consecutiveSixes: 0,
    winner: null,
  };
}

export function rollDice(state: GameState, playerIndex: number): GameResult {
  if (state.winner !== null) return { state, valid: false, error: 'Game over' };
  if (state.currentPlayer !== playerIndex) return { state, valid: false, error: 'Not your turn' };
  if (state.phase !== 'rolling') return { state, valid: false, error: 'Already rolled' };

  const value = Math.floor(Math.random() * 6) + 1;
  state.diceValue = value;

  if (value === 6) {
    state.consecutiveSixes++;
    if (state.consecutiveSixes >= 3) {
      state.diceValue = null;
      state.consecutiveSixes = 0;
      advanceTurn(state);
      return { state, valid: true, diceValue: value };
    }
    state.phase = 'moving';
  } else {
    state.consecutiveSixes = 0;
    state.phase = 'moving';
  }

  return { state, valid: true, diceValue: value };
}

export function getValidMoves(state: GameState, playerIndex: number): number[] {
  if (state.winner !== null) return [];
  if (state.currentPlayer !== playerIndex) return [];
  if (state.phase !== 'moving' || state.diceValue === null) return [];

  const player = state.players[playerIndex];
  const dice = state.diceValue;
  const valid: number[] = [];

  for (let i = 0; i < player.tokens.length; i++) {
    const tok = player.tokens[i];
    if (tok.state === 'home') {
      if (dice === 6) valid.push(i);
    } else if (tok.state === 'path' || tok.state === 'stretch') {
      const np = tok.progress + dice;
      if (np > FINISH) continue;
      if (tok.state === 'path' && np > STRETCH_START) {
        const blockCheck = checkBlockOnPath(state, playerIndex, tok.progress, STRETCH_START);
        if (!blockCheck.valid) continue;
      } else if (tok.state === 'path') {
        const blockCheck = checkBlockOnPath(state, playerIndex, tok.progress, np);
        if (!blockCheck.valid) continue;
      }
      valid.push(i);
    }
  }

  return valid;
}

export function moveToken(state: GameState, playerIndex: number, tokenIndex: number): GameResult {
  if (state.winner !== null) return { state, valid: false, error: 'Game over' };
  if (state.currentPlayer !== playerIndex) return { state, valid: false, error: 'Not your turn' };
  if (state.phase !== 'moving' || state.diceValue === null) return { state, valid: false, error: 'Roll first' };

  const player = state.players[playerIndex];
  const token = player.tokens[tokenIndex];
  const dice = state.diceValue;
  const events: GameEvent[] = [];

  if (token.state === 'home') {
    if (dice !== 6) return { state, valid: false, error: 'Need 6 to leave home' };
    const from = token.progress;
    token.state = 'path';
    token.progress = 0;
    events.push({ type: 'TOKEN_MOVED', playerIndex, tokenIndex, from, to: 0 });
    const capEvents = handleCapture(state, playerIndex, 0);
    events.push(...capEvents);
    const blockEvent = checkBlockFormed(state, playerIndex, 0);
    if (blockEvent) events.push(blockEvent);
    state.diceValue = null;
    if (dice !== 6) advanceTurn(state); else state.phase = 'rolling';
    return { state, valid: true, events };
  }

  if (token.state === 'path' || token.state === 'stretch') {
    const from = token.progress;
    const np = token.progress + dice;
    if (np > FINISH) return { state, valid: false, error: 'Cannot overshoot finish' };

    if (token.state === 'path') {
      const blockCheck = checkBlockOnPath(state, playerIndex, token.progress, Math.min(np, STRETCH_START));
      if (!blockCheck.valid) return { state, valid: false, error: blockCheck.error };
    }

    token.progress = np;
    if (token.state === 'path' && np >= STRETCH_START) {
      token.state = 'stretch';
    }
    if (np === FINISH) {
      token.state = 'finished';
      player.finishedCount++;
      events.push({ type: 'TOKEN_FINISHED', playerIndex, tokenIndex });
      checkWin(state);
    } else {
      events.push({ type: 'TOKEN_MOVED', playerIndex, tokenIndex, from, to: np });
    }

    if (token.state === 'path') {
      const capEvents = handleCapture(state, playerIndex, np);
      events.push(...capEvents);
      const blockEvent = checkBlockFormed(state, playerIndex, np);
      if (blockEvent) events.push(blockEvent);
    }

    state.diceValue = null;
    if (dice !== 6) advanceTurn(state); else state.phase = 'rolling';
    return { state, valid: true, events };
  }

  return { state, valid: false, error: 'Token already finished' };
}

export function handleAction(state: GameState, playerIndex: number, action: GameAction): GameResult {
  if (state.winner !== null && action.type !== 'ROLL_DICE') {
    return { state, valid: false, error: 'Game over' };
  }
  switch (action.type) {
    case 'ROLL_DICE':
      return rollDice(state, playerIndex);
    case 'MOVE_TOKEN':
      if (action.payload?.tokenIndex === undefined) return { state, valid: false, error: 'No token specified' };
      return moveToken(state, playerIndex, action.payload.tokenIndex);
    default:
      return { state, valid: false, error: 'Unknown action' };
  }
}
