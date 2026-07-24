// ─── Main track (52 tiles, clockwise from Blue start) ─────────
// Tile 0 = Blue's starting safe square [6,13]
// Reversed from base so tile sequence goes clockwise.
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

// Reverse direction + rotate so Blue's entry [6,13] is tile 0
const _rev = [...BASE_PATH].reverse();
const _blueAt = _rev.findIndex(([c, r]) => c === 6 && r === 13);
export const PATH: [number, number][] = [
  ..._rev.slice(_blueAt),
  ..._rev.slice(0, _blueAt),
];

// ─── Safe tiles ────────────────────────────────────────────────
export const SAFE_ABS = new Set([0, 8, 13, 21, 26, 34, 39, 47]);
export function isSafeSquare(absPos: number): boolean { return SAFE_ABS.has(absPos); }

// ─── Player configuration ──────────────────────────────────────
export const PLAYER_CONFIG: Record<number, {
  name: string;
  startTile: number;    // path index where pieces enter on a 6
  homeEntry: number;    // path index where piece exits to home stretch
  homeStretch: [number, number][]; // 5 tiles leading toward center
  homeZoneCol: number;  // 6x6 home zone top-left column
  homeZoneRow: number;
}> = {
  0: { // BLUE — Bottom Left
    name: 'Blue',
    startTile: 0,
    homeEntry: 51,
    homeStretch: [[7,13],[7,12],[7,11],[7,10],[7,9]],
    homeZoneCol: 0,
    homeZoneRow: 9,
  },
  1: { // RED — Top Left
    name: 'Red',
    startTile: 23,
    homeEntry: 22,
    homeStretch: [[1,7],[2,7],[3,7],[4,7],[5,7]],
    homeZoneCol: 0,
    homeZoneRow: 0,
  },
  2: { // GREEN — Top Right
    name: 'Green',
    startTile: 36,
    homeEntry: 35,
    homeStretch: [[7,1],[7,2],[7,3],[7,4],[7,5]],
    homeZoneCol: 9,
    homeZoneRow: 0,
  },
  3: { // YELLOW — Bottom Right
    name: 'Yellow',
    startTile: 49,
    homeEntry: 48,
    homeStretch: [[13,7],[12,7],[11,7],[10,7],[9,7]],
    homeZoneCol: 9,
    homeZoneRow: 9,
  },
};

function homeTokens(col0: number, row0: number): [number, number][] {
  return [[2,2],[3,2],[2,3],[3,3]].map(([c, r]) => [col0 + c, row0 + r] as [number, number]);
}

export const HOME_TOKENS: Record<number, [number, number][]> = {};
for (let i = 0; i < 4; i++) {
  HOME_TOKENS[i] = homeTokens(PLAYER_CONFIG[i].homeZoneCol, PLAYER_CONFIG[i].homeZoneRow);
}

// ─── Quadrant mapping for multi-player ───────────────────────────
export function playerQuadrant(playerIndex: number, totalPlayers: number): number {
  if (totalPlayers === 2) return playerIndex === 0 ? 0 : 2;
  return playerIndex;
}

export function playerOffset(playerIndex: number): number {
  return PLAYER_CONFIG[playerIndex]?.startTile ?? 0;
}

export function absPath(progress: number, playerIndex: number, totalPlayers: number): number {
  const q = playerQuadrant(playerIndex, totalPlayers);
  return (progress + playerOffset(q)) % 52;
}

export function getHomeStretch(playerIndex: number): [number, number][] {
  return PLAYER_CONFIG[playerIndex]?.homeStretch ?? PLAYER_CONFIG[0].homeStretch;
}

export function getHomeTokens(playerIndex: number, totalPlayers: number): [number, number][] {
  const q = playerQuadrant(playerIndex, totalPlayers);
  return HOME_TOKENS[q] ?? HOME_TOKENS[0];
}

export function getHomeTokensByQuadrant(quadrant: number): [number, number][] {
  return HOME_TOKENS[quadrant] ?? HOME_TOKENS[0];
}

export function getHomeStretchByQuadrant(quadrant: number): [number, number][] {
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
