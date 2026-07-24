// Standard Ludo board: 15×15 grid, each cell = 40px, board = 600×600
// Cross-shaped path with 4 arms, home quadrants in corners

const S = 40;

export interface TileCoord { x: number; y: number }

// ─── Outer path (52 tiles, clockwise from Red's entry) ───────────
// Top arm left column (going down)
const p0: TileCoord[] = [
  { x: 6*S, y: 0*S },  //  0 Red entry
  { x: 6*S, y: 1*S },  //  1
  { x: 6*S, y: 2*S },  //  2
  { x: 6*S, y: 3*S },  //  3
  { x: 6*S, y: 4*S },  //  4
  { x: 6*S, y: 5*S },  //  5
];

// Left arm top row (going left)
const p1: TileCoord[] = [
  { x: 5*S, y: 6*S },  //  6
  { x: 4*S, y: 6*S },  //  7
  { x: 3*S, y: 6*S },  //  8
  { x: 2*S, y: 6*S },  //  9
  { x: 1*S, y: 6*S },  // 10
  { x: 0*S, y: 6*S },  // 11
];

// Left arm left column (going down)
const p2: TileCoord[] = [
  { x: 0*S, y: 7*S },  // 12
  { x: 0*S, y: 8*S },  // 13 Blue entry
];

// Left arm bottom row (going right)
const p3: TileCoord[] = [
  { x: 1*S, y: 8*S },  // 14
  { x: 2*S, y: 8*S },  // 15
  { x: 3*S, y: 8*S },  // 16
  { x: 4*S, y: 8*S },  // 17
  { x: 5*S, y: 8*S },  // 18
];

// Bottom arm left column (going down)
const p4: TileCoord[] = [
  { x: 6*S, y: 9*S },  // 19
  { x: 6*S, y: 10*S }, // 20
  { x: 6*S, y: 11*S }, // 21
  { x: 6*S, y: 12*S }, // 22
  { x: 6*S, y: 13*S }, // 23
  { x: 6*S, y: 14*S }, // 24
];

// Bottom arm bottom row (going right)
const p5: TileCoord[] = [
  { x: 7*S, y: 14*S }, // 25
  { x: 8*S, y: 14*S }, // 26 Yellow entry
];

// Bottom arm right column (going up)
const p6: TileCoord[] = [
  { x: 8*S, y: 13*S }, // 27
  { x: 8*S, y: 12*S }, // 28
  { x: 8*S, y: 11*S }, // 29
  { x: 8*S, y: 10*S }, // 30
  { x: 8*S, y: 9*S },  // 31
];

// Right arm bottom row (going right)
const p7: TileCoord[] = [
  { x: 9*S, y: 8*S },  // 32
  { x: 10*S, y: 8*S }, // 33
  { x: 11*S, y: 8*S }, // 34
  { x: 12*S, y: 8*S }, // 35
  { x: 13*S, y: 8*S }, // 36
  { x: 14*S, y: 8*S }, // 37
];

// Right arm right column (going up)
const p8: TileCoord[] = [
  { x: 14*S, y: 7*S }, // 38
  { x: 14*S, y: 6*S }, // 39 Green entry
];

// Right arm top row (going left)
const p9: TileCoord[] = [
  { x: 13*S, y: 6*S }, // 40
  { x: 12*S, y: 6*S }, // 41
  { x: 11*S, y: 6*S }, // 42
  { x: 10*S, y: 6*S }, // 43
  { x: 9*S, y: 6*S },  // 44
];

// Top arm right column (going up)
const p10: TileCoord[] = [
  { x: 8*S, y: 5*S },  // 45
  { x: 8*S, y: 4*S },  // 46
  { x: 8*S, y: 3*S },  // 47
  { x: 8*S, y: 2*S },  // 48
  { x: 8*S, y: 1*S },  // 49
  { x: 8*S, y: 0*S },  // 50
];

// Top arm top row (going left)
const p11: TileCoord[] = [
  { x: 7*S, y: 0*S },  // 51
];

export const PATH: TileCoord[] = [...p0, ...p1, ...p2, ...p3, ...p4, ...p5, ...p6, ...p7, ...p8, ...p9, ...p10, ...p11];

// ─── Safe squares (absolute path indices) ────────────────────────
const SAFE_ABS = [0, 8, 13, 21, 26, 34, 39, 47];
export function isSafeSquare(absPos: number): boolean {
  return SAFE_ABS.includes(absPos);
}

// ─── Player offsets (maps player-relative progress → absolute path) ─
const PLAYER_OFFSETS = [0, 13, 26, 39];
export function absPath(progress: number, player: number): number {
  return (progress + PLAYER_OFFSETS[player]) % 52;
}

// ─── Home stretches (6 tiles per player, leading from path exit to center) ──
// Each player exits the path at their last position and enters the middle lane toward center.
export const HOME_STRETCH: Record<number, TileCoord[]> = {
  // Red: exits at (7,0), goes DOWN through top arm center column
  0: [
    { x: 7*S, y: 1*S },
    { x: 7*S, y: 2*S },
    { x: 7*S, y: 3*S },
    { x: 7*S, y: 4*S },
    { x: 7*S, y: 5*S },
    { x: 7*S, y: 6*S },
  ],
  // Blue: exits at (0,7), goes RIGHT through left arm center row
  1: [
    { x: 1*S, y: 7*S },
    { x: 2*S, y: 7*S },
    { x: 3*S, y: 7*S },
    { x: 4*S, y: 7*S },
    { x: 5*S, y: 7*S },
    { x: 6*S, y: 7*S },
  ],
  // Yellow: exits at (7,14), goes UP through bottom arm center column
  2: [
    { x: 7*S, y: 13*S },
    { x: 7*S, y: 12*S },
    { x: 7*S, y: 11*S },
    { x: 7*S, y: 10*S },
    { x: 7*S, y: 9*S },
    { x: 7*S, y: 8*S },
  ],
  // Green: exits at (14,7), goes LEFT through right arm center row
  3: [
    { x: 13*S, y: 7*S },
    { x: 12*S, y: 7*S },
    { x: 11*S, y: 7*S },
    { x: 10*S, y: 7*S },
    { x: 9*S, y: 7*S },
    { x: 8*S, y: 7*S },
  ],
};

// ─── Home zones (token starting positions per player) ────────────
export const HOME_ZONES: Record<number, { x: number; y: number }[]> = {
  0: [ // Red: top-left
    { x: 2*S, y: 2*S }, { x: 4*S, y: 2*S },
    { x: 2*S, y: 4*S }, { x: 4*S, y: 4*S },
  ],
  1: [ // Blue: bottom-left
    { x: 2*S, y: 10*S }, { x: 4*S, y: 10*S },
    { x: 2*S, y: 12*S }, { x: 4*S, y: 12*S },
  ],
  2: [ // Yellow: bottom-right
    { x: 10*S, y: 10*S }, { x: 12*S, y: 10*S },
    { x: 10*S, y: 12*S }, { x: 12*S, y: 12*S },
  ],
  3: [ // Green: top-right
    { x: 10*S, y: 2*S }, { x: 12*S, y: 2*S },
    { x: 10*S, y: 4*S }, { x: 12*S, y: 4*S },
  ],
};

export const CENTER: TileCoord = { x: 7*S, y: 7*S };

const TILE_SIZE = 34;

export function getTileSize(): number { return TILE_SIZE; }

export function getBoardPosition(playerIndex: number, progress: number): TileCoord {
  if (progress === -1) return HOME_ZONES[playerIndex]?.[0] || CENTER;
  if (progress >= 52 && progress <= 57) return HOME_STRETCH[playerIndex]?.[progress - 52] || CENTER;
  if (progress === 58) return CENTER;
  const idx = (progress + PLAYER_OFFSETS[playerIndex]) % 52;
  return PATH[idx];
}
