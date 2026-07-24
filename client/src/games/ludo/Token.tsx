import { motion } from 'framer-motion';
import type { TileCoord } from './BoardLayout.js';

const PLAYER_COLORS = ['#e74c3c', '#3498db', '#f1c40f', '#2ecc71'];
const SCALE = 1.0;

// Chess pawn SVG path (centered at 0,0, height ~40, width ~24)
const PAWN_PATH = `
  M -10,16
  C -10,16 -12,14 -12,10
  C -12,6  -9,3   -6,2
  C -7,0   -8,-2  -7,-5
  C -6,-8  -3,-10  0,-10
  C 3,-10  6,-8   7,-5
  C 8,-2   7,0    6,2
  C 9,3    12,6   12,10
  C 12,14  10,16  10,16
  Z
`;

// Crown/king cross on top
const CROWN = `
  M 0,-10 L -2,-13 L 0,-11 L 2,-13 L 0,-10
`;

interface TokenProps {
  pos: TileCoord;
  colorIndex: number;
  size: number;
  movable: boolean;
  isDragging: boolean;
}

function pawnBody(color: string) {
  return (
    <g>
      {/* Shadow */}
      <ellipse cx={1.5} cy={18} rx={12} ry={3} fill="rgba(0,0,0,0.25)" />
      {/* Base */}
      <path d={PAWN_PATH} fill={color} stroke="rgba(0,0,0,0.2)" strokeWidth={1} />
      {/* Highlight on head */}
      <ellipse cx={0} cy={-6} rx={3} ry={2} fill="rgba(255,255,255,0.25)" />
      {/* Collar ring */}
      <ellipse cx={0} cy={2} rx={5} ry={1.5} fill="rgba(0,0,0,0.08)" />
      {/* Bottom base ring */}
      <ellipse cx={0} cy={15} rx={10} ry={2} fill="rgba(0,0,0,0.06)" />
    </g>
  );
}

export function Token({ pos, colorIndex, size, movable, isDragging }: TokenProps) {
  const color = PLAYER_COLORS[colorIndex % PLAYER_COLORS.length];

  return (
    <g>
      {/* Movable glow */}
      {movable && (
        <motion.ellipse
          cx={pos.x}
          cy={pos.y + 4}
          rx={16}
          ry={20}
          fill="none"
          stroke={color}
          strokeWidth={2}
          initial={{ opacity: 0.3, scale: 0.9 }}
          animate={{ opacity: [0.3, 0.8, 0.3], scale: [0.9, 1.08, 0.9] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
        />
      )}
      {/* Pawn body */}
      <motion.g
        animate={movable ? { scale: [1, 1.05, 1] } : undefined}
        transition={movable ? { repeat: Infinity, duration: 1.2 } : undefined}
      >
        {pawnBody(color)}
      </motion.g>
    </g>
  );
}
