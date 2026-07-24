// Unified 15x15 Ludo grid — 52 path tiles, 5 home stretch per player
export type GridPos = [number, number];

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

// ─── Player → quadrant mapping (2 players use opposite: Blue & Green) ──
export function playerQuadrant(playerIndex: number, totalPlayers: number): number {
  if (totalPlayers === 2) return playerIndex === 0 ? 1 : 3;
  return playerIndex;
}

// ─── Per-quadrant data ───────────────────────────────────────────
const QUAD_OFFSETS: Record<number, number> = { 0: 0, 1: 13, 2: 26, 3: 39 };

export function absPath(progress: number, quadIdx: number): number {
  return (progress + (QUAD_OFFSETS[quadIdx] ?? 0)) % 52;
}

// ─── Home stretches — keyed by path OFFSET (0, 13, 26, 39) ──
// Each stretch starts at the tile after the player's path exit and goes toward center
const HOME_STRETCH_BY_OFFSET: Record<number, GridPos[]> = {
  0:  [[7,1],[7,2],[7,3],[7,4],[7,5]],     // offset 0 → column 7 DOWN
  13: [[1,7],[2,7],[3,7],[4,7],[5,7]],    // offset 13 → row 7 RIGHT
  26: [[7,13],[7,12],[7,11],[7,10],[7,9]], // offset 26 → column 7 UP
  39: [[13,7],[12,7],[11,7],[10,7],[9,7]], // offset 39 → row 7 LEFT
};

export function getHomeStretch(quadrant: number): GridPos[] {
  const off = QUAD_OFFSETS[quadrant] ?? 0;
  return HOME_STRETCH_BY_OFFSET[off] ?? HOME_STRETCH_BY_OFFSET[0];
}

function homeTokens(col0: number, row0: number): GridPos[] {
  return [[2,2],[3,2],[2,3],[3,3]].map(([c, r]) => [col0 + c, row0 + r] as GridPos);
}
export const HOME_TOKENS: Record<number, GridPos[]> = {
  0: homeTokens(0, 0),
  1: homeTokens(0, 9),
  2: homeTokens(9, 9),
  3: homeTokens(9, 0),
};

export function getHomeTokens(quadrant: number): GridPos[] {
  return HOME_TOKENS[quadrant] ?? HOME_TOKENS[0];
}

// ─── Grid helpers ────────────────────────────────────────────────
export const GRID = 15;
const G = 1 / GRID;

export function cellCenter(col: number, row: number): { x: number; y: number } {
  return { x: (col + 0.5) * G, y: (row + 0.5) * G };
}

export function getBoardPosition(playerIndex: number, progress: number, totalPlayers: number = 4): { x: number; y: number } {
  const q = playerQuadrant(playerIndex, totalPlayers);
  if (progress === -1) return cellCenter(...getHomeTokens(q)[0]);
  if (progress >= 52 && progress <= 56) {
    const cell = getHomeStretch(q)[progress - 52];
    return cell ? cellCenter(cell[0], cell[1]) : { x: 0.5, y: 0.5 };
  }
  if (progress >= 57) return { x: 0.5, y: 0.5 };
  const idx = (progress + (QUAD_OFFSETS[q] ?? 0)) % 52;
  return cellCenter(PATH[idx][0], PATH[idx][1]);
}
