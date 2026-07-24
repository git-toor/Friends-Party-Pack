// Unified 15x15 Ludo grid — 52 path tiles, 5 home stretch per player
export type GridPos = [number, number];

// ─── Outer path (52 tiles, clockwise) ─────────────────────────
export const PATH: GridPos[] = [
  [6,0],[6,1],[6,2],[6,3],[6,4],[6,5],
  [5,6],[4,6],[3,6],[2,6],[1,6],[0,6],
  [0,7],[0,8],
  [1,8],[2,8],[3,8],[4,8],[5,8],
  [6,9],[6,10],[6,11],[6,12],[6,13],[6,14],
  [7,14],[8,14],
  [8,13],[8,12],[8,11],[8,10],[8,9],
  [9,8],[10,8],[11,8],[12,8],[13,8],[14,8],
  [14,7],[14,6],
  [13,6],[12,6],[11,6],[10,6],[9,6],
  [8,5],[8,4],[8,3],[8,2],[8,1],[8,0],
  [7,0],
];

export const SAFE_ABS = new Set([2, 10, 15, 23, 28, 36, 41, 49]);
export function isSafeSquare(absPos: number): boolean { return SAFE_ABS.has(absPos); }

// ─── Player configuration ──────────────────────────────────────
// Player 0 = BLUE   (bottom-left quadrant,  home stretch goes DOWN)
// Player 1 = RED    (top-left quadrant,     home stretch goes LEFT)
// Player 2 = GREEN  (top-right quadrant,    home stretch goes UP)
// Player 3 = YELLOW (bottom-right quadrant, home stretch goes RIGHT)

export interface PlayerConfig {
  entryOffset: number;       // absolute path index where pieces enter
  homeStretch: GridPos[];    // 5 tiles leading from path exit to center
  homeZoneOffset: [number, number]; // grid [col, row] for 6x6 home base
}

// Entry offsets: where each player enters the main path
const ENTRY_OFFSETS: Record<number, number> = { 0: 13, 1: 0, 2: 39, 3: 26 };

// Home stretches: each leads from the path exit toward center (7,7)
// Blue (player 0, offset 13): path exit at PATH[12]=(0,7), stretch goes RIGHT → (1,7)...(5,7)
// Red  (player 1, offset 0):  path exit at PATH[51]=(7,0), stretch goes DOWN → (7,1)...(7,5)
// Green(player 2, offset 39): path exit at PATH[38]=(14,7), stretch goes LEFT → (13,7)...(9,7)
// Yel  (player 3, offset 26): path exit at PATH[25]=(7,14), stretch goes UP   → (7,13)...(7,9)

const HOME_STRETCHES: Record<number, GridPos[]> = {
  0: [[1,7],[2,7],[3,7],[4,7],[5,7]],     // Blue → RIGHT
  1: [[7,1],[7,2],[7,3],[7,4],[7,5]],     // Red  → DOWN
  2: [[13,7],[12,7],[11,7],[10,7],[9,7]], // Green → LEFT
  3: [[7,13],[7,12],[7,11],[7,10],[7,9]], // Yellow → UP
};

// Home zone offsets: top-left corner of the 6x6 base for each player
const HOME_ZONE_OFFSETS: Record<number, [number, number]> = {
  0: [0, 9],  // Blue  → bottom-left  (rows 9-14, cols 0-5)
  1: [0, 0],  // Red   → top-left     (rows 0-5,  cols 0-5)
  2: [9, 0],  // Green → top-right    (rows 0-5,  cols 9-14)
  3: [9, 9],  // Yellow→ bottom-right (rows 9-14, cols 9-14)
};

function homeTokens(col0: number, row0: number): GridPos[] {
  return [[2,2],[3,2],[2,3],[3,3]].map(([c, r]) => [col0 + c, row0 + r] as GridPos);
}

export const HOME_TOKENS: Record<number, GridPos[]> = {
  0: homeTokens(0, 9),  // Blue
  1: homeTokens(0, 0),  // Red
  2: homeTokens(9, 0),  // Green
  3: homeTokens(9, 9),  // Yellow
};

// ─── Quadrant mapping (2 players use Blue & Green — opposites) ─
export function playerQuadrant(playerIndex: number, totalPlayers: number): number {
  if (totalPlayers === 2) return playerIndex === 0 ? 0 : 2; // Blue(0) & Green(2)
  return playerIndex;
}

export function absPath(progress: number, playerIndex: number, totalPlayers: number): number {
  const q = playerQuadrant(playerIndex, totalPlayers);
  return (progress + ENTRY_OFFSETS[q]) % 52;
}

export function getHomeStretch(playerIndex: number, totalPlayers: number): GridPos[] {
  const q = playerQuadrant(playerIndex, totalPlayers);
  return HOME_STRETCHES[q] ?? HOME_STRETCHES[0];
}

// Direct quadrant lookup for rendering
export function getHomeStretchByQuadrant(quadrant: number): GridPos[] {
  return HOME_STRETCHES[quadrant] ?? HOME_STRETCHES[0];
}

export function getHomeTokens(playerIndex: number, totalPlayers: number): GridPos[] {
  const q = playerQuadrant(playerIndex, totalPlayers);
  return HOME_TOKENS[q] ?? HOME_TOKENS[0];
}

export function getHomeTokensByQuadrant(quadrant: number): GridPos[] {
  return HOME_TOKENS[quadrant] ?? HOME_TOKENS[0];
}

// ─── Grid helpers ────────────────────────────────────────────────
export const GRID = 15;
const G = 1 / GRID;

export function cellCenter(col: number, row: number): { x: number; y: number } {
  return { x: (col + 0.5) * G, y: (row + 0.5) * G };
}

export function getBoardPosition(playerIndex: number, progress: number, totalPlayers: number = 4): { x: number; y: number } {
  if (progress === -1) return cellCenter(...getHomeTokens(playerIndex, totalPlayers)[0]);
  if (progress >= 52 && progress <= 56) {
    const cell = getHomeStretch(playerIndex, totalPlayers)[progress - 52];
    return cell ? cellCenter(cell[0], cell[1]) : { x: 0.5, y: 0.5 };
  }
  if (progress >= 57) return { x: 0.5, y: 0.5 };
  const idx = absPath(progress, playerIndex, totalPlayers);
  return cellCenter(PATH[idx][0], PATH[idx][1]);
}
