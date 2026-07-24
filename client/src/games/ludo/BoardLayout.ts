// Ludo board is 15x15 grid. Each cell is 40px. Board is 600x600.
// Coordinates are center of each cell in SVG space.

const S = 40;

export interface TileCoord {
  x: number;
  y: number;
}

// Outer path — 52 tiles clockwise starting from Red's entry (top of left arm)
// Path traces along the cross-shaped board perimeter
export const PATH: TileCoord[] = [
  // Red's home column (left arm, top section — going downward)
  { x: 3*S, y: 0*S },  // 0  - Red entry (top)
  { x: 3*S, y: 1*S },  // 1
  { x: 3*S, y: 2*S },  // 2
  { x: 3*S, y: 3*S },  // 3
  { x: 3*S, y: 4*S },  // 4
  { x: 3*S, y: 5*S },  // 5
  // Bottom of left arm, turning right
  { x: 2*S, y: 6*S },  // 6
  { x: 1*S, y: 6*S },  // 7
  { x: 0*S, y: 6*S },  // 8  - safe
  // Bottom row going right
  { x: 0*S, y: 7*S },  // 9
  { x: 0*S, y: 8*S },  // 10
  // Right side of bottom arm
  { x: 1*S, y: 8*S },  // 11
  { x: 2*S, y: 8*S },  // 12
  // Bottom arm turning up — Blue's entry
  { x: 3*S, y: 9*S },  // 13 - safe (Blue entry)
  { x: 3*S, y: 10*S }, // 14
  { x: 3*S, y: 11*S }, // 15
  { x: 3*S, y: 12*S }, // 16
  { x: 3*S, y: 13*S }, // 17
  { x: 3*S, y: 14*S }, // 18 - bottom
  // Bottom-right corner, going right
  { x: 4*S, y: 14*S }, // 19
  { x: 5*S, y: 14*S }, // 20
  { x: 6*S, y: 14*S }, // 21 - safe
  // Right side bottom section, going up
  { x: 6*S, y: 13*S }, // 22
  { x: 6*S, y: 12*S }, // 23
  // Right arm
  { x: 7*S, y: 11*S }, // 24
  { x: 8*S, y: 11*S }, // 25
  { x: 8*S, y: 10*S }, // 26 - safe (Yellow entry)
  { x: 8*S, y: 9*S },  // 27
  // Right arm top
  { x: 9*S, y: 9*S },  // 28
  { x: 10*S, y: 9*S }, // 29
  { x: 11*S, y: 9*S }, // 30
  { x: 12*S, y: 9*S }, // 31
  { x: 13*S, y: 9*S }, // 32
  { x: 14*S, y: 9*S }, // 33
  // Top-right corner, going left
  { x: 14*S, y: 8*S }, // 34 - safe
  { x: 14*S, y: 7*S }, // 35
  // Top arm, going left
  { x: 13*S, y: 6*S }, // 36
  { x: 12*S, y: 6*S }, // 37
  { x: 11*S, y: 6*S }, // 38
  { x: 10*S, y: 6*S }, // 39 - safe (Green entry)
  { x: 9*S, y: 6*S },  // 40
  // Top section, going up
  { x: 8*S, y: 5*S },  // 41
  { x: 8*S, y: 4*S },  // 42
  { x: 8*S, y: 3*S },  // 43
  { x: 8*S, y: 2*S },  // 44
  { x: 8*S, y: 1*S },  // 45
  { x: 8*S, y: 0*S },  // 46
  // Top-left corner, going down
  { x: 7*S, y: 0*S },  // 47 - safe
  { x: 6*S, y: 0*S },  // 48
  // Left arm top section, going down
  { x: 6*S, y: 1*S },  // 49
  { x: 6*S, y: 2*S },  // 50
  // Back to Red entry area
  { x: 5*S, y: 3*S },  // 51
];

// Home stretch — 6 squares per player leading to center
// Red: top-left quadrant, going diagonally toward center
// Blue: bottom-left quadrant
// Yellow: bottom-right quadrant
// Green: top-right quadrant
export const HOME_STRETCH: Record<number, TileCoord[]> = {
  0: [  // Red — entering from top via path position 51 → center
    { x: 4*S, y: 4*S },
    { x: 4*S, y: 5*S },
    { x: 5*S, y: 4*S },
    { x: 5*S, y: 5*S },
    { x: 6*S, y: 4*S },
    { x: 6*S, y: 5*S },
  ],
  1: [  // Blue — entering from bottom via path position 51 → center
    { x: 4*S, y: 9*S },
    { x: 4*S, y: 10*S },
    { x: 5*S, y: 9*S },
    { x: 5*S, y: 10*S },
    { x: 6*S, y: 9*S },
    { x: 6*S, y: 10*S },
  ],
  2: [  // Yellow — entering from right via path position 51 → center
    { x: 9*S, y: 9*S },
    { x: 9*S, y: 10*S },
    { x: 10*S, y: 9*S },
    { x: 10*S, y: 10*S },
    { x: 11*S, y: 9*S },
    { x: 11*S, y: 10*S },
  ],
  3: [  // Green — entering from top via path position 51 → center
    { x: 9*S, y: 4*S },
    { x: 9*S, y: 5*S },
    { x: 10*S, y: 4*S },
    { x: 10*S, y: 5*S },
    { x: 11*S, y: 4*S },
    { x: 11*S, y: 5*S },
  ],
};

export const CENTER: TileCoord = { x: 7*S, y: 7*S };

const PLAYER_OFFSETS = [0, 13, 26, 39];
const TILE_SIZE = 36;

export function getTileSize(): number {
  return TILE_SIZE;
}

export function getBoardPosition(playerIndex: number, progress: number): TileCoord {
  if (progress === -1) return { x: -100, y: -100 }; // off-screen (home)
  if (progress >= 52 && progress <= 57) {
    return HOME_STRETCH[playerIndex]?.[progress - 52] || CENTER;
  }
  if (progress === 58) return CENTER;
  const idx = (progress + PLAYER_OFFSETS[playerIndex]) % 52;
  return PATH[idx];
}
