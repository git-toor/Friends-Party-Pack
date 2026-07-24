# Ludo Implementation Plan

## Architecture

New files under `server/src/games/ludo/` and `client/src/games/ludo/`, wired into existing registry and routing.

## Server Files

### `server/src/games/ludo/LudoEngine.ts` — Pure game logic

#### Types

```typescript
type TokenState = 'home' | 'path' | 'stretch' | 'finished';
type TurnPhase = 'rolling' | 'moving';

interface Token {
  state: TokenState;
  progress: number; // -1=home, 0-51=path, 52-57=home stretch, 58=finished
}

interface PlayerState {
  tokens: Token[4];
  finishedCount: number;
}

interface GameState {
  players: PlayerState[];
  currentPlayer: number;
  diceValue: number | null;
  phase: TurnPhase;
  consecutiveSixes: number;
  winner: number | null;
}

type ActionType = 'ROLL_DICE' | 'MOVE_TOKEN';
```

#### Player offsets (progress → absolute path)
- Red (player 0): offset 0
- Blue (player 1): offset 13
- Yellow (player 2): offset 26
- Green (player 3): offset 39

#### Functions

| Function | Description |
|----------|-------------|
| `createGame(playerCount)` | Returns initial GameState |
| `handleAction(state, playerIndex, action)` | Processes ROLL_DICE or MOVE_TOKEN |
| `rollDice(state)` | Generates 1d6, handles bonus/3-sixes |
| `getValidMoves(state, playerIndex)` | Returns token indices that can move |
| `moveToken(state, playerIndex, tokenIndex)` | Executes token move, captures, home stretch, finish |
| `advanceTurn(state)` | Passes turn to next player |
| `checkWin(state)` | Returns winner index or null |

#### Movement rules
- Home→Path: requires rolling a 6
- Path movement: progress += diceValue (capped at 58)
- Home stretch: auto-entry at progress 51→52
- Finish: exact roll required (progress + diceValue === 58)
- Capture: landing on opponent's token → victim sent to progress -1 (home)
- Safe squares: [0, 8, 13, 21, 26, 34, 39, 47] — no capture on these
- Block: two same-color tokens on non-safe square → cannot be passed
- Bonus: rolling a 6 grants another roll
- Penalty: three consecutive sixes → lose turn

#### Events emitted by engine
```typescript
interface GameEvent {
  type: 'TOKEN_MOVED' | 'CAPTURE' | 'TOKEN_FINISHED' | 'BLOCK_FORMED';
  playerIndex: number;
  tokenIndex: number;
  from?: number;
  to?: number;
  victimPlayer?: number;
  victimToken?: number;
  position?: number;
}
```

### `server/src/games/ludo/LudoRouter.ts` — Express Router

Endpoints:
- `POST /create` — `{ sessionId, playerCount }` → creates session
- `POST /action` — `{ sessionId, playerIndex, action: { type, payload } }` → validates, executes, broadcasts
- `GET /state/:sessionId` — `?playerIndex=N` → serialized per-player state
- `POST /rematch` — `{ sessionId }` → resets game

WS broadcast: on every successful action, send `GAME_STATE` to all players (per-player serialized).

### `server/src/games/ludo/LudoServer.ts` — GameServer adapter

9-line adapter wrapping router's `createSession`, `getState`, `setWsBroadcast`, `getRouter`.

## Client Files

### `client/src/games/ludo/BoardLayout.ts` — Precomputed coordinates

77 positions total:
- `PATH[52]` — outer ring { x, y } in SVG coordinates
- `HOME_STRETCH[4][6]` — per player, 6 squares leading to center
- `CENTER` — { x, y }

Key function:
```typescript
function getBoardPosition(playerIndex: number, progress: number): { x: number; y: number }
```

For progress 0-51: `PATH[(progress + PLAYER_OFFSETS[playerIndex]) % 52]`
For progress 52-57: `HOME_STRETCH[playerIndex][progress - 52]`
For progress 58: `CENTER`

Player offsets: Red=0, Blue=13, Yellow=26, Green=39.

### `client/src/games/ludo/Tile.tsx` — SVG board tile

Props: `x, y, size, color, isSafe, isDestination, routePreview`

Renders a rounded rectangle with optional:
- Safe square glow (pulsing ring)
- Destination highlight (animated ripple ring)
- Route preview dots (dimmed circles along movement path)

### `client/src/games/ludo/Token.tsx` — Draggable SVG token

Props: `color, playerIndex, size, movable, onDrop(onTile), progress`

Features:
- Framer Motion drag with `dragElastic: 0`
- Glow/pulse animation when `movable`
- Lift + shadow on drag start (scale 1.1)
- Ghost preview follows finger during drag
- On drop: snap to nearest valid tile or spring back
- Auto-stack scaling: multiple tokens on same tile shrink to fit
- Stack layout: 1=center, 2=horizontal, 3=triangle, 4=square

### `client/src/games/ludo/Dice.tsx` — Dice wrapper

Thin component wrapping `DiceOverlay`:
```tsx
const diceRef = useRef<DiceOverlayHandle>(null);
const roll = async () => {
  const [value] = await diceRef.current.roll('d6', 1);
  return value; // 1-6
};
```

Renders `DiceOverlay` with ref, passes `roll(callback)` up to parent.

### `client/src/games/ludo/LudoBoard.tsx` — SVG board

15×15 SVG layout rendering:
- 4 colored home quadrants (transparent with colored border)
- 52 path tiles from `BoardLayout.PATH`
- 4 home stretches from `BoardLayout.HOME_STRETCH`
- Center finish area
- Token stacking at each tile position
- Turn indicator (glow on current player's quadrant)

Uses `<svg viewBox="0 0 600 600">` with responsive scaling.

### `client/src/games/ludo/LudoGame.tsx` — Main component

Props: `playerCount, playerIndex, playerName, sessionId, players, gameStatePush`

State management:
- `gameState` from server (fetched + WS pushed)
- `animatingTokens` — currently animating token ID + progress queue
- `showCapture` — capture effect trigger
- `showFireworks` — winner celebration

Flow:
1. Fetch initial state via `GET /api/games/ludo/state/:sessionId`
2. Listen for WS `GAME_STATE` pushes
3. On diff: generate events (`TOKEN_MOVED`, `CAPTURE`, `TOKEN_FINISHED`)
4. Event → animation sequence (sequential steps for movement)
5. Dice click → `POST /api/games/ludo/action` with `ROLL_DICE`
6. Valid token click/drag → `POST /api/games/ludo/action` with `MOVE_TOKEN`
7. Winner overlay + confetti on game end

### `client/src/games/ludo/sounds.ts` — Sound hooks

```typescript
export function useLudoSounds() {
  const playDiceRoll = () => {};      // stub
  const playTokenMove = () => {};      // stub
  const playCapture = () => {};        // stub
  const playHomeArrival = () => {};    // stub
  const playWin = () => {};            // stub
  return { playDiceRoll, playTokenMove, playCapture, playHomeArrival, playWin };
}
```

## Exhaustive Tests

### `server/src/games/ludo/__tests__/LudoEngine.test.ts` — Unit tests

#### createGame (5 tests)
| Test | Assertion |
|------|-----------|
| creates correct player count | state.players.length === playerCount |
| each player has 4 tokens | all tokens have state='home', progress=-1 |
| starts with player 0 | state.currentPlayer === 0 |
| starts in rolling phase | state.phase === 'rolling' |
| no winner at start | state.winner === null |

#### ROLL_DICE (6 tests)
| Test | Assertion |
|------|-----------|
| returns value 1-6 | diceValue between 1-6 |
| rejects from non-current player | valid === false |
| advances to moving phase | state.phase === 'moving' |
| 6 grants bonus roll | consecutiveSixes incremented, phase stays rolling? No — actually after 6 it should be moving phase with bonus roll pending |
| 3 consecutive sixes loses turn | after third 6, consecutiveSixes reset, turn advances |
| stores dice value on state | state.diceValue === roll result |

#### MOVE_TOKEN — Home to Path (3 tests)
| Test | Assertion |
|------|-----------|
| requires 6 to leave home | valid=false if diceValue !== 6 |
| home→path on 6 works | token.state='path', token.progress=0 |
| rejects from wrong player | valid === false |

#### MOVE_TOKEN — Path movement (5 tests)
| Test | Assertion |
|------|-----------|
| advances progress by dice | progress increases by diceValue |
| auto-enters home stretch at 52 | token.state='stretch', progress=52 |
| exact roll finishes token | progress=58, state='finished' |
| overshoot is rejected | valid=false if progress+dice > 58 |
| captures opponent token | opponent progress reset to -1 |

#### MOVE_TOKEN — Safe squares (2 tests)
| Test | Assertion |
|------|-----------|
| no capture on safe square | opponent stays, valid=true |
| block forms on non-safe square | two same-color tokens on same square |

#### MOVE_TOKEN — Blocks (3 tests)
| Test | Assertion |
|------|-----------|
| cannot pass through block | move through blocked square → invalid |
| can land ON block if own token | valid=true (forms triple stack) |
| can land on safe square occupied by opponent | valid=true (but no capture) |

#### Turn advancement (3 tests)
| Test | Assertion |
|------|-----------|
| non-6 advances turn | currentPlayer changes |
| 6 grants bonus turn | currentPlayer stays same |
| after bonus move no 6, turn advances | currentPlayer changes |

#### Win condition (2 tests)
| Test | Assertion |
|------|-----------|
| winner declared when all 4 finished | state.winner === playerIndex |
| game over rejects actions | all actions return valid=false |

### `server/src/games/ludo/__tests__/LudoIntegration.test.ts` — Integration tests

| Test | Description |
|------|-------------|
| full 2-player game | complete game play-through bringing all 4 tokens home for one player |
| captures across multiple turns | P0 captures P1, then P1 re-enters and captures back |
| block prevents passage | block formed, opponent cannot cross |
| rematch resets state | all tokens back to home |
| WS broadcast on action | broadcast called for each player |
| state serialization hides other players' hands | (n/a for Ludo — all info visible) |

### `client/src/games/ludo/BoardLayout.test.ts` — Board coordinate tests

| Test | Assertion |
|------|-----------|
| getBoardPosition correct for all 52 path squares | matches hand-verified SVG layout |
| home stretch coordinates correct per player | 6 distinct squares per color |
| center is center of board | matches board center |
| 4 token stacking positions don't overlap | all 4 positions within tile bounds |

## Implementation Order

1. `LudoEngine.ts` + tests
2. `LudoRouter.ts` + `LudoServer.ts` + registry wiring
3. `BoardLayout.ts`
4. `Tile.tsx` + `Token.tsx` + `Dice.tsx` + `sounds.ts`
5. `LudoBoard.tsx`
6. `LudoGame.tsx`
7. `GamePage.tsx` wiring
8. Build, test, verify
