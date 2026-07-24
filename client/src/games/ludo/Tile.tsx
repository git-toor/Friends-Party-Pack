import { motion } from 'framer-motion';
import type { TileCoord } from './BoardLayout.js';

const TILE_R = 4;

interface TileProps {
  pos: TileCoord;
  size: number;
  color: string;
  isSafe: boolean;
  isDestination: boolean;
  showRoutePreview: boolean;
  onClick?: () => void;
}

const PLAYER_COLORS = ['#e74c3c', '#3498db', '#f1c40f', '#2ecc71'];

export function Tile({ pos, size, color, isSafe, isDestination, showRoutePreview }: TileProps) {
  return (
    <g>
      <rect
        x={pos.x - size / 2}
        y={pos.y - size / 2}
        width={size}
        height={size}
        rx={TILE_R}
        fill={color}
        stroke={isSafe ? '#f1c40f' : 'rgba(255,255,255,0.2)'}
        strokeWidth={isSafe ? 2 : 1}
      />
      {isSafe && (
        <circle
          cx={pos.x}
          cy={pos.y}
          r={size * 0.15}
          fill="none"
          stroke="#f1c40f"
          strokeWidth={1}
          opacity={0.5}
        />
      )}
      {isDestination && (
        <motion.rect
          x={pos.x - size / 2 - 3}
          y={pos.y - size / 2 - 3}
          width={size + 6}
          height={size + 6}
          rx={TILE_R + 1}
          fill="none"
          stroke={PLAYER_COLORS[0]}
          strokeWidth={2}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
        />
      )}
      {showRoutePreview && (
        <circle cx={pos.x} cy={pos.y} r={4} fill="rgba(255,255,255,0.4)" />
      )}
    </g>
  );
}
