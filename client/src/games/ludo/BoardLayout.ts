// ─── Ludo Board Coordinate System ───────────────────────────────
// Single source of truth. Tile 0 = BLUE's starting safe square.
// 52-tile clockwise track. Do NOT modify movement math — only coordinates.

export type GridPos = [number, number];

// ─── Main track (52 tiles, clockwise) ──────────────────────────
// Tile 0 = Blue's starting safe square (bottom-left)
// Tile 13 = Red's starting safe square (top-left)
// Tile 26 = Green's starting safe square (top-right)
// Tile 39 = Yellow's starting safe square (bottom-right)
const BASE_PATH: [number, number][] = [
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

// Rotate: Blue entry (old[13] = (0,8)) → tile 0
export const PATH: [number, number][] = [
  ...BASE_PATH.slice(13),
  ...BASE_PATH.slice(0, 13),
];

// ─── Safe tiles (indices in the rotated PATH) ───────────────────
// Positions: 0, 8, 13, 21, 26, 34, 39, 47
export const SAFE_ABS = new Set([0, 8, 13, 21, 26, 34, 39, 47]);
export function isSafeSquare(absPos: number): boolean { return SAFE_ABS.has(absPos); }

// ─── Player configuration — single source of truth ──────────────
export const PLAYER_CONFIG: Record<number, {
  name: string;
  startTile: number;    // absolute path index where pieces enter on a 6
  homeEntry: number;    // absolute path index where piece exits to home stretch
  homeStretch: GridPos[]; // 5 tiles leading toward center
  homeZoneCol: number;  // 6x6 home zone top-left column
  homeZoneRow: number;  // 6x6 home zone top-left row
}> = {
  0: { // BLUE — Bottom Left
    name: 'Blue',
    startTile: 0,
    homeEntry: 50,
    homeStretch: [[7,13],[7,12],[7,11],[7,10],[7,9]],
    homeZoneCol: 0,
    homeZoneRow: 9,
  },
  1: { // RED — Top Left
    name: 'Red',
    startTile: 13,
    homeEntry: 11,
    homeStretch: [[1,7],[2,7],[3,7],[4,7],[5,7]],
    homeZoneCol: 0,
    homeZoneRow: 0,
  },
  2: { // GREEN — Top Right
    name: 'Green',
    startTile: 26,
    homeEntry: 24,
    homeStretch: [[7,1],[7,2],[7,3],[7,4],[7,5]],
    homeZoneCol: 9,
    homeZoneRow: 0,
  },
  3: { // YELLOW — Bottom Right
    name: 'Yellow',
    startTile: 39,
    homeEntry: 37,
    homeStretch: [[13,7],[12,7],[11,7],[10,7],[9,7]],
    homeZoneCol: 9,
    homeZoneRow: 9,
  },
};

// ─── Derived mappings ────────────────────────────────────────────
export function playerOffset(playerIndex: number): number {
  return PLAYER_CONFIG[playerIndex]?.startTile ?? 0;
}

export function getHomeStretch(playerIndex: number): GridPos[] {
  return PLAYER_CONFIG[playerIndex]?.homeStretch ?? PLAYER_CONFIG[0].homeStretch;
}

function homeTokens(col0: number, row0: number): GridPos[] {
  return [[2,2],[3,2],[2,3],[3,3]].map(([c, r]) => [col0 + c, row0 + r] as GridPos);
}

export const HOME_TOKENS: Record<number, GridPos[]> = {};
for (let i = 0; i < 4; i++) {
  HOME_TOKENS[i] = homeTokens(PLAYER_CONFIG[i].homeZoneCol, PLAYER_CONFIG[i].homeZoneRow);
}

// ─── Quadrant mapping for multi-player ───────────────────────────
// 2 players: Blue & Green (opposites). 3 players: Blue, Red, Green.
export function playerQuadrant(playerIndex: number, totalPlayers: number): number {
  if (totalPlayers === 2) return playerIndex === 0 ? 0 : 2;
  return playerIndex;
}

export function absPath(progress: number, playerIndex: number, totalPlayers: number): number {
  const q = playerQuadrant(playerIndex, totalPlayers);
  return (progress + playerOffset(q)) % 52;
}

export function getHomeTokens(playerIndex: number, totalPlayers: number): GridPos[] {
  const q = playerQuadrant(playerIndex, totalPlayers);
  return HOME_TOKENS[q] ?? HOME_TOKENS[0];
}

export function getHomeTokensByQuadrant(quadrant: number): GridPos[] {
  return HOME_TOKENS[quadrant] ?? HOME_TOKENS[0];
}

export function getHomeStretchByQuadrant(quadrant: number): GridPos[] {
  return PLAYER_CONFIG[quadrant]?.homeStretch ?? PLAYER_CONFIG[0].homeStretch;
}

// ─── Grid helpers ────────────────────────────────────────────────
export const GRID = 15;
const G = 1 / GRID;

export function cellCenter(col: number, row: number): { x: number; y: number } {
  return { x: (col + 0.5) * G, y: (row + 0.5) * G };
}

export function getBoardPosition(playerIndex: number, progress: number, totalPlayers: number = 4): { x: number; y: number } {
  const q = playerQuadrant(playerIndex, totalPlayers);
  if (progress === -1) return cellCenter(...HOME_TOKENS[q][0]);
  if (progress >= 52 && progress <= 56) {
    const cell = getHomeStretch(q)[progress - 52];
    return cell ? cellCenter(cell[0], cell[1]) : { x: 0.5, y: 0.5 };
  }
  if (progress >= 57) return { x: 0.5, y: 0.5 };
  const idx = absPath(progress, playerIndex, totalPlayers);
  return cellCenter(PATH[idx][0], PATH[idx][1]);
}
