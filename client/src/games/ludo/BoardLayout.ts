// Unified 15×15 Ludo grid coordinate system
// All positions expressed as grid (col, row) in range 0-14.
// SVG viewBox conversion happens in render components.

// ─── Outer path: 52 tiles clockwise from Red's entry ──────────
const _P: [number, number][] = [
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

export const PATH: [number, number][] = _P;

// ─── Safe squares: pushed 2 tiles forward along the clockwise path ───
// Red: 2, 10 | Blue: 15, 23 | Yellow: 28, 36 | Green: 41, 49
export const SAFE_ABS = new Set([2, 10, 15, 23, 28, 36, 41, 49]);
export function isSafeSquare(absPos: number): boolean { return SAFE_ABS.has(absPos); }

// ─── Player offsets ────────────────────────────────────────────
const PLAYER_OFFSETS: Record<number, number> = { 0: 0, 1: 13, 2: 26, 3: 39 };
export function absPath(progress: number, player: number): number {
  return (progress + (PLAYER_OFFSETS[player] ?? 0)) % 52;
}

// ─── Home stretches (5 squares per player → center) ──────────
export const HOME_STRETCH: Record<number, [number, number][]> = {
  0: [[7,1],[7,2],[7,3],[7,4],[7,5]],
  1: [[1,7],[2,7],[3,7],[4,7],[5,7]],
  2: [[7,13],[7,12],[7,11],[7,10],[7,9]],
  3: [[13,7],[12,7],[11,7],[10,7],[9,7]],
};

// ─── Home base token positions — centered 2×2 grid in each 6×6 base ──
// 6 cells wide, 2 cells margin each side → tokens at cells 2 and 3
function homeTokens(col0: number, row0: number): [number, number][] {
  return [[2,2],[3,2],[2,3],[3,3]].map(
    ([c, r]) => [col0 + c, row0 + r] as [number, number]
  );
}
export const HOME_TOKENS: Record<number, [number, number][]> = {
  0: homeTokens(0, 0),
  1: homeTokens(0, 9),
  2: homeTokens(9, 9),
  3: homeTokens(9, 0),
};

// ─── Grid geometry helpers ─────────────────────────────────────
export const GRID = 15;
export const TILE_SIZE = 0.055; // 55% of cell width (visual padding)

export function cellCenter(col: number, row: number): { x: number; y: number } {
  return { x: (col + 0.5) / GRID, y: (row + 0.5) / GRID };
}

export function getBoardPosition(playerIndex: number, progress: number): { x: number; y: number } {
  if (progress === -1) return cellCenter(...HOME_TOKENS[playerIndex][0]);
  if (progress >= 52 && progress <= 56) {
    const cell = HOME_STRETCH[playerIndex]?.[progress - 52];
    return cell ? cellCenter(cell[0], cell[1]) : { x: 0.5, y: 0.5 };
  }
  if (progress >= 57) return { x: 0.5, y: 0.5 };
  const idx = (progress + (PLAYER_OFFSETS[playerIndex] ?? 0)) % 52;
  return cellCenter(PATH[idx][0], PATH[idx][1]);
}
