import { motion } from 'framer-motion';
import type { TileCoord } from './BoardLayout.js';

const PLAYER_COLORS = ['#e74c3c', '#3498db', '#f1c40f', '#2ecc71'];
const TOKEN_R = 13;

interface TokenProps {
  pos: TileCoord;
  colorIndex: number;
  size: number;
  movable: boolean;
  isDragging: boolean;
}

export function Token({ pos, colorIndex, size, movable, isDragging }: TokenProps) {
  const color = PLAYER_COLORS[colorIndex % PLAYER_COLORS.length];
  const r = isDragging ? TOKEN_R + 2 : TOKEN_R;

  return (
    <g>
      {/* Shadow */}
      <motion.circle
        cx={pos.x + 1.5}
        cy={pos.y + 2}
        r={r}
        fill="rgba(0,0,0,0.3)"
        animate={movable ? { scale: [1, 1.05, 1] } : undefined}
        transition={movable ? { repeat: Infinity, duration: 1.2 } : undefined}
      />
      {/* Token body */}
      <motion.g
        animate={movable ? { scale: [1, 1.06, 1] } : undefined}
        transition={movable ? { repeat: Infinity, duration: 1.2 } : undefined}
      >
        {/* Main circle */}
        <circle cx={pos.x} cy={pos.y} r={r} fill={color} stroke="rgba(0,0,0,0.2)" strokeWidth={1} />
        {/* Inner gradient highlight */}
        <circle cx={pos.x - r * 0.25} cy={pos.y - r * 0.25} r={r * 0.6} fill="rgba(255,255,255,0.15)" />
        {/* Top shine */}
        <ellipse cx={pos.x - r * 0.15} cy={pos.y - r * 0.3} rx={r * 0.35} ry={r * 0.2} fill="rgba(255,255,255,0.25)" />
        {/* Outer ring */}
        <circle cx={pos.x} cy={pos.y} r={r} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth={1.5} />
      </motion.g>
      {/* Movable glow */}
      {movable && (
        <motion.circle
          cx={pos.x}
          cy={pos.y}
          r={r + 4}
          fill="none"
          stroke={color}
          strokeWidth={2}
          initial={{ opacity: 0.3, scale: 0.9 }}
          animate={{ opacity: [0.3, 0.8, 0.3], scale: [0.9, 1.1, 0.9] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
        />
      )}
    </g>
  );
}
