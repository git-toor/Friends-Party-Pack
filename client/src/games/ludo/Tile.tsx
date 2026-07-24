import type { TileCoord } from './BoardLayout.js';

const TILE_R = 3;

interface TileProps {
  pos: TileCoord;
  size: number;
  color?: string;
  isPath?: boolean;
  isSafe?: boolean;
  isDestination?: boolean;
  isHomeStretch?: boolean;
}

const PATH_COLOR = '#2a2a4a';
const PATH_STROKE = '#3a3a5a';
const DEST_RING = '#fbbf24';

export function Tile({ pos, size, color, isPath, isSafe, isDestination, isHomeStretch }: TileProps) {
  const fill = isHomeStretch ? (color || PATH_COLOR) : isPath ? PATH_COLOR : (color || 'transparent');
  const strokeColor = isSafe ? '#f1c40f' : isPath ? PATH_STROKE : 'rgba(255,255,255,0.08)';
  const strokeW = isSafe ? 2 : 1;

  return (
    <g>
      {/* Shadow */}
      {isPath && (
        <rect
          x={pos.x - size / 2 + 1}
          y={pos.y - size / 2 + 1}
          width={size}
          height={size}
          rx={TILE_R}
          fill="rgba(0,0,0,0.25)"
        />
      )}
      {/* Main tile */}
      <rect
        x={pos.x - size / 2}
        y={pos.y - size / 2}
        width={size}
        height={size}
        rx={TILE_R}
        fill={fill}
        stroke={strokeColor}
        strokeWidth={strokeW}
      />
      {/* Safe star */}
      {isSafe && (
        <text
          x={pos.x}
          y={pos.y + 4}
          textAnchor="middle"
          fontSize={10}
          fill="#f1c40f"
          opacity={0.6}
        >
          ★
        </text>
      )}
      {/* Destination ring */}
      {isDestination && (
        <rect
          x={pos.x - size / 2 - 2}
          y={pos.y - size / 2 - 2}
          width={size + 4}
          height={size + 4}
          rx={TILE_R + 1}
          fill="none"
          stroke={DEST_RING}
          strokeWidth={2.5}
          strokeDasharray="4 3"
        >
          <animate attributeName="opacity" values="0.4;1;0.4" dur="1.2s" repeatCount="indefinite" />
        </rect>
      )}
    </g>
  );
}
