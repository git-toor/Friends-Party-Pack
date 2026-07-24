import { motion } from 'framer-motion';
import type { TileCoord } from './BoardLayout.js';

const PLAYER_COLORS = ['#e74c3c', '#3498db', '#f1c40f', '#2ecc71'];
const TOKEN_R = 14;

interface TokenProps {
  pos: TileCoord;
  colorIndex: number;
  size: number;
  movable: boolean;
  isDragging: boolean;
  onDragEnd?: (info: any) => void;
  tokenRef?: (el: HTMLDivElement | null) => void;
}

export function Token({ pos, colorIndex, size, movable, isDragging, onDragEnd, tokenRef }: TokenProps) {
  const color = PLAYER_COLORS[colorIndex % PLAYER_COLORS.length];

  return (
    <motion.g
      style={{ cursor: movable ? 'grab' : 'default' }}
      animate={movable ? {
        scale: [1, 1.08, 1],
      } : undefined}
      transition={movable ? { repeat: Infinity, duration: 1.2 } : undefined}
    >
      <motion.circle
        cx={pos.x}
        cy={pos.y}
        r={isDragging ? TOKEN_R + 2 : TOKEN_R}
        fill={color}
        stroke={isDragging ? '#fff' : 'rgba(0,0,0,0.3)'}
        strokeWidth={isDragging ? 2 : 1}
        initial={false}
        animate={isDragging ? { y: -4, filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.5))' } : { y: 0, filter: 'none' }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      />
      <circle cx={pos.x - 3} cy={pos.y - 3} r={4} fill="rgba(255,255,255,0.3)" />
    </motion.g>
  );
}
