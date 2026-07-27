// 125:75 ratio from the Excel-table spec:
// K10/U10/K20/U20 = 125x125 pixel squares (corners)
// L10:T10/L20:T20 = 75x125 pixel rectangle (bottom/top edges — tall/narrow)
// K11:K19/U11:U19 = 125x75 pixel rectangle (left/right edges — wide/short)
// In 11x11 viewBox: CORNER = 55/37, TILE_SPAN = 33/37 (3:5 ratio to CORNER)
export const BOARD_SIZE = 11;
export const CORNER_SIZE = 55 / 37;
export const TILE_SPAN = 33 / 37;
export const TILE_DEPTH = CORNER_SIZE;

export const CENTER_X = CORNER_SIZE;
export const CENTER_Y = CORNER_SIZE;
export const CENTER_WIDTH = BOARD_SIZE - CORNER_SIZE * 2;
export const CENTER_HEIGHT = BOARD_SIZE - CORNER_SIZE * 2;

export interface TileRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function getTileRect(index: number): TileRect {
  if (index === 0) {
    return { x: BOARD_SIZE - CORNER_SIZE, y: BOARD_SIZE - CORNER_SIZE, width: CORNER_SIZE, height: CORNER_SIZE };
  }
  if (index >= 1 && index <= 9) {
    // Bottom edge, right to left — tall/narrow: TILE_SPAN wide x TILE_DEPTH tall
    return {
      x: CORNER_SIZE + (9 - index) * TILE_SPAN,
      y: BOARD_SIZE - TILE_DEPTH,
      width: TILE_SPAN,
      height: TILE_DEPTH,
    };
  }
  if (index === 10) {
    return { x: 0, y: BOARD_SIZE - CORNER_SIZE, width: CORNER_SIZE, height: CORNER_SIZE };
  }
  if (index >= 11 && index <= 19) {
    // Left edge, bottom to top — wide/short: TILE_DEPTH wide x TILE_SPAN tall
    return {
      x: 0,
      y: BOARD_SIZE - CORNER_SIZE - (index - 10) * TILE_SPAN,
      width: TILE_DEPTH,
      height: TILE_SPAN,
    };
  }
  if (index === 20) {
    return { x: 0, y: 0, width: CORNER_SIZE, height: CORNER_SIZE };
  }
  if (index >= 21 && index <= 29) {
    // Top edge, left to right — tall/narrow: TILE_SPAN wide x TILE_DEPTH tall
    return {
      x: CORNER_SIZE + (index - 21) * TILE_SPAN,
      y: 0,
      width: TILE_SPAN,
      height: TILE_DEPTH,
    };
  }
  if (index === 30) {
    return { x: BOARD_SIZE - CORNER_SIZE, y: 0, width: CORNER_SIZE, height: CORNER_SIZE };
  }
  // Right edge, top to bottom — wide/short: TILE_DEPTH wide x TILE_SPAN tall
  return {
    x: BOARD_SIZE - TILE_DEPTH,
    y: CORNER_SIZE + (index - 31) * TILE_SPAN,
    width: TILE_DEPTH,
    height: TILE_SPAN,
  };
}

export function getTileCenter(index: number): { cx: number; cy: number } {
  const r = getTileRect(index);
  return { cx: r.x + r.width / 2, cy: r.y + r.height / 2 };
}

export function getTokenPosition(index: number): { x: number; y: number } {
  const c = getTileCenter(index);
  return { x: c.cx, y: c.cy };
}

export function getOwnerMarkerPosition(index: number): { x: number; y: number } {
  const r = getTileRect(index);
  return { x: r.x + 0.06 * CORNER_SIZE, y: r.y + r.height / 2 };
}
