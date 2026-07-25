import { useMemo, useRef, useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PLAYER_COLORS } from './constants.js';

interface TokenView {
  playerIndex: number;
  position: number;
}

interface StepAnimData {
  playerIndex: number;
  from: number;
  to: number;
}

interface MonopolyBoardProps {
  tokens: TokenView[];
  stepAnim: StepAnimData | null;
  onStepAnimDone: () => void;
  totalPlayers: number;
}

interface TileInfo {
  index: number;
  name: string;
  shortName: string;
  color: string;
  textColor: string;
  x: number;
  y: number;
}

function getTilePos(position: number): { x: number; y: number } {
  if (position === 0) return { x: 10, y: 10 };
  if (position <= 10) return { x: 10 - position, y: 10 };
  if (position <= 20) return { x: 0, y: 10 - (position - 10) };
  if (position <= 30) return { x: position - 20, y: 0 };
  return { x: 10, y: position - 30 };
}

const TILE_COLORS: Record<string, string> = {
  go: '#e94560',
  property_brown: '#8B4513',
  property_lightblue: '#87CEEB',
  property_pink: '#FF69B4',
  property_orange: '#FF8C00',
  property_red: '#FF0000',
  property_yellow: '#FFD700',
  property_green: '#006400',
  property_darkblue: '#00008B',
  railroad: '#2C2C2C',
  utility: '#555555',
  tax: '#C4956A',
  chance: '#FF8C00',
  cc: '#4CAF50',
  jail: '#666666',
  free_parking: '#2a2a3e',
  go_to_jail: '#D32F2F',
};

const TILE_TEXT_COLORS: Record<string, string> = {
  property_lightblue: '#000',
  property_yellow: '#000',
  property_pink: '#000',
  free_parking: '#eee',
};

const BOARD_DATA: { index: number; name: string; shortName: string; colorKey: string }[] = [
  { index: 0, name: 'GO', shortName: 'GO', colorKey: 'go' },
  { index: 1, name: 'Chandni Chowk', shortName: 'Chandni', colorKey: 'property_brown' },
  { index: 2, name: 'Jugaad', shortName: 'Jugaad', colorKey: 'cc' },
  { index: 3, name: 'Hazratganj', shortName: 'Hazratgnj', colorKey: 'property_brown' },
  { index: 4, name: 'Income Tax', shortName: 'Tax', colorKey: 'tax' },
  { index: 5, name: 'Vande Bharat Exp', shortName: 'VandeBhrat', colorKey: 'railroad' },
  { index: 6, name: 'Ghat Road', shortName: 'Ghat Rd', colorKey: 'property_lightblue' },
  { index: 7, name: 'Kismat', shortName: 'Kismat', colorKey: 'chance' },
  { index: 8, name: 'MI Road', shortName: 'MI Road', colorKey: 'property_lightblue' },
  { index: 9, name: 'Law Garden', shortName: 'Law Grdn', colorKey: 'property_lightblue' },
  { index: 10, name: 'Jail', shortName: 'JAIL', colorKey: 'jail' },
  { index: 11, name: 'Mall Road', shortName: 'Mall Rd', colorKey: 'property_pink' },
  { index: 12, name: 'Water Supply', shortName: 'Water', colorKey: 'utility' },
  { index: 13, name: 'Bapu Bazaar', shortName: 'Bapu Bzr', colorKey: 'property_pink' },
  { index: 14, name: 'Lake Pichola', shortName: 'Pichola', colorKey: 'property_pink' },
  { index: 15, name: 'Rajdhani Exp', shortName: 'Rajdhani', colorKey: 'railroad' },
  { index: 16, name: 'Calangute Bch', shortName: 'Calangute', colorKey: 'property_orange' },
  { index: 17, name: 'Jugaad', shortName: 'Jugaad', colorKey: 'cc' },
  { index: 18, name: 'White Town', shortName: 'White Tn', colorKey: 'property_orange' },
  { index: 19, name: 'Rock Beach', shortName: 'Rock Bch', colorKey: 'property_orange' },
  { index: 20, name: 'Free Parking', shortName: 'FREE', colorKey: 'free_parking' },
  { index: 21, name: 'MG Road', shortName: 'MG Road', colorKey: 'property_red' },
  { index: 22, name: 'Kismat', shortName: 'Kismat', colorKey: 'chance' },
  { index: 23, name: 'Marina Beach', shortName: 'Marina', colorKey: 'property_red' },
  { index: 24, name: 'Banjara Hills', shortName: 'Banjara', colorKey: 'property_red' },
  { index: 25, name: 'Shatabdi Exp', shortName: 'Shatabdi', colorKey: 'railroad' },
  { index: 26, name: 'Park Street', shortName: 'Park St', colorKey: 'property_yellow' },
  { index: 27, name: 'FC Road', shortName: 'FC Road', colorKey: 'property_yellow' },
  { index: 28, name: 'Electricity Bd', shortName: 'Electric', colorKey: 'utility' },
  { index: 29, name: 'SG Highway', shortName: 'SG Hwy', colorKey: 'property_yellow' },
  { index: 30, name: 'Go To Jail', shortName: 'GT JAIL', colorKey: 'go_to_jail' },
  { index: 31, name: 'Bandra West', shortName: 'Bandra W', colorKey: 'property_green' },
  { index: 32, name: 'Connaught Pl', shortName: 'C Place', colorKey: 'property_green' },
  { index: 33, name: 'Jugaad', shortName: 'Jugaad', colorKey: 'cc' },
  { index: 34, name: 'Cyber Hub', shortName: 'Cyber Hb', colorKey: 'property_green' },
  { index: 35, name: 'Tejas Exp', shortName: 'Tejas', colorKey: 'railroad' },
  { index: 36, name: 'Kismat', shortName: 'Kismat', colorKey: 'chance' },
  { index: 37, name: 'Marine Drive', shortName: 'Marine D', colorKey: 'property_darkblue' },
  { index: 38, name: 'Luxury Tax', shortName: 'Lux Tax', colorKey: 'tax' },
  { index: 39, name: 'Altamount Rd', shortName: 'Altamount', colorKey: 'property_darkblue' },
];

function TokenCircle({ playerIndex, cx, cy }: { playerIndex: number; cx: number; cy: number }) {
  const color = PLAYER_COLORS[playerIndex % PLAYER_COLORS.length];
  return (
    <circle cx={cx} cy={cy} r={0.18} fill={color} stroke="#fff" strokeWidth={0.04} />
  );
}

// Compute stacked token positions for players on the same tile
function computeTokenPositions(tokens: TokenView[]): { playerIndex: number; cx: number; cy: number }[] {
  const positions: { playerIndex: number; cx: number; cy: number }[] = [];
  const byPos: Record<number, TokenView[]> = {};
  for (const t of tokens) {
    if (!byPos[t.position]) byPos[t.position] = [];
    byPos[t.position].push(t);
  }
  for (const posStr of Object.keys(byPos)) {
    const pos = parseInt(posStr);
    const pts = byPos[pos];
    const center = getTilePos(pos);
    const tileCx = center.x + 0.5;
    const tileCy = center.y + 0.5;
    if (pts.length === 1) {
      positions.push({ playerIndex: pts[0].playerIndex, cx: tileCx, cy: tileCy });
    } else {
      pts.forEach((t, i) => {
        const angle = (i / pts.length) * Math.PI * 2;
        const radius = 0.2;
        positions.push({
          playerIndex: t.playerIndex,
          cx: tileCx + Math.cos(angle) * radius,
          cy: tileCy + Math.sin(angle) * radius,
        });
      });
    }
  }
  return positions;
}

export function MonopolyBoard({ tokens, stepAnim, onStepAnimDone, totalPlayers }: MonopolyBoardProps) {
  const [animStep, setAnimStep] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Step animation
  useEffect(() => {
    if (!stepAnim) {
      setAnimStep(null);
      return;
    }
    const movement = ((stepAnim.to - stepAnim.from) + 40) % 40;
    if (movement === 0) {
      onStepAnimDone();
      return;
    }
    let step = 0;
    const totalSteps = Math.min(movement, 10); // cap at 10 steps for visual clarity
    const interval = 120;
    setAnimStep(0);

    timerRef.current = setInterval(() => {
      step++;
      if (step >= totalSteps) {
        if (timerRef.current) clearInterval(timerRef.current);
        setAnimStep(null);
        onStepAnimDone();
      } else {
        setAnimStep(step);
      }
    }, interval);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [stepAnim, onStepAnimDone]);

  // Compute current token positions (with stepAnim override)
  const tokenPositions = useMemo(() => {
    if (stepAnim && animStep !== null) {
      const movement = ((stepAnim.to - stepAnim.from) + 40) % 40;
      const totalSteps = Math.min(movement, 10);
      const currentProgress = (animStep / totalSteps) * movement;
      const currentPos = (stepAnim.from + currentProgress) % 40;
      const filteredTokens = tokens.filter(t => t.playerIndex !== stepAnim.playerIndex);
      const result = computeTokenPositions(filteredTokens);
      const center = getTilePos(Math.round(currentPos));
      result.push({
        playerIndex: stepAnim.playerIndex,
        cx: center.x + 0.5,
        cy: center.y + 0.5,
      });
      return result;
    }
    return computeTokenPositions(tokens);
  }, [tokens, stepAnim, animStep]);

  // Pinch-zoom + pan state
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const boardRef = useRef<HTMLDivElement>(null);
  const isPanning = useRef(false);
  const panStart = useRef({ x: 0, y: 0 });
  const lastPinchDist = useRef(0);
  const currentZoom = useRef(1);

  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    currentZoom.current = Math.max(0.5, Math.min(3, currentZoom.current + delta));
    setZoom(currentZoom.current);
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 1) {
      e.preventDefault();
      isPanning.current = true;
      panStart.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
    }
  }, [pan]);

  useEffect(() => {
    const el = boardRef.current;
    if (!el) return;
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!isPanning.current) return;
      setPan({ x: e.clientX - panStart.current.x, y: e.clientY - panStart.current.y });
    };
    const handleGlobalMouseUp = () => { isPanning.current = false; };
    window.addEventListener('mousemove', handleGlobalMouseMove);
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, []);

  // Touch pinch-zoom
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      lastPinchDist.current = Math.sqrt(dx * dx + dy * dy);
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (lastPinchDist.current > 0) {
        const scale = dist / lastPinchDist.current;
        currentZoom.current = Math.max(0.5, Math.min(3, currentZoom.current * scale));
        setZoom(currentZoom.current);
      }
      lastPinchDist.current = dist;
    }
  }, []);

  const tiles = useMemo(() => {
    return BOARD_DATA.map(bd => {
      const pos = getTilePos(bd.index);
      const color = TILE_COLORS[bd.colorKey] || '#333';
      const textColor = TILE_TEXT_COLORS[bd.colorKey] || '#fff';
      const tile: TileInfo = {
        index: bd.index,
        name: bd.name,
        shortName: bd.shortName,
        color,
        textColor,
        x: pos.x,
        y: pos.y,
      };
      return tile;
    });
  }, []);

  return (
    <div
      ref={boardRef}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      style={{
        width: '100%', height: '100%', overflow: 'hidden',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: isPanning.current ? 'grabbing' : 'grab',
        touchAction: 'none',
      }}
    >
      <div style={{
        transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
        transformOrigin: 'center center',
        transition: isPanning.current ? 'none' : 'transform 0.1s ease',
      }}>
        <svg viewBox="0 0 11 11" style={{ width: 'min(80vw, 80vh)', height: 'min(80vw, 80vh)' }}>
          {/* Tiles */}
          {tiles.map(t => (
            <g key={t.index}>
              <rect
                x={t.x} y={t.y} width={1} height={1}
                fill={t.color}
                stroke="#1a1a2e" strokeWidth={0.03}
                rx={0.05}
              />
              {/* Corner labels */}
              {(t.index === 0) && (
                <text x={t.x + 0.5} y={t.y + 0.55} textAnchor="middle" fill="#fff" fontSize={0.35} fontWeight={700}>
                  GO
                </text>
              )}
              {(t.index === 10) && (
                <text x={t.x + 0.5} y={t.y + 0.5} textAnchor="middle" fill="#fff" fontSize={0.2} fontWeight={600}>
                  JAIL
                </text>
              )}
              {(t.index === 20) && (
                <text x={t.x + 0.5} y={t.y + 0.45} textAnchor="middle" fill="#eee" fontSize={0.18} fontWeight={600}>
                  FREE
                </text>
              )}
              {(t.index === 20) && (
                <text x={t.x + 0.5} y={t.y + 0.65} textAnchor="middle" fill="#eee" fontSize={0.18} fontWeight={600}>
                  PARKING
                </text>
              )}
              {(t.index === 30) && (
                <text x={t.x + 0.5} y={t.y + 0.45} textAnchor="middle" fill="#fff" fontSize={0.16} fontWeight={600}>
                  GO TO
                </text>
              )}
              {(t.index === 30) && (
                <text x={t.x + 0.5} y={t.y + 0.65} textAnchor="middle" fill="#fff" fontSize={0.16} fontWeight={600}>
                  JAIL
                </text>
              )}
              {/* Side tile labels - horizontal for top/bottom, vertical for left/right */}
              {t.index > 0 && t.index < 10 && (
                <text x={t.x + 0.5} y={t.y + 0.5} textAnchor="middle" fill={t.textColor} fontSize={0.1} transform={`rotate(-90, ${t.x + 0.5}, ${t.y + 0.5})`}>
                  {t.shortName}
                </text>
              )}
              {t.index > 10 && t.index < 20 && (
                <text x={t.x + 0.5} y={t.y + 0.5} textAnchor="middle" fill={t.textColor} fontSize={0.09} transform={`rotate(0, ${t.x + 0.5}, ${t.y + 0.5})`}>
                  {t.shortName}
                </text>
              )}
              {t.index > 20 && t.index < 30 && (
                <text x={t.x + 0.5} y={t.y + 0.5} textAnchor="middle" fill={t.textColor} fontSize={0.1} transform={`rotate(90, ${t.x + 0.5}, ${t.y + 0.5})`}>
                  {t.shortName}
                </text>
              )}
              {t.index > 30 && t.index < 40 && (
                <text x={t.x + 0.5} y={t.y + 0.5} textAnchor="middle" fill={t.textColor} fontSize={0.09} transform={`rotate(0, ${t.x + 0.5}, ${t.y + 0.5})`}>
                  {t.shortName}
                </text>
              )}
              {/* Price tag for purchasable spaces */}
              {[5, 12, 15, 25, 28, 35].includes(t.index) && (
                <text x={t.x + 0.5} y={t.y + 0.75} textAnchor="middle" fill={t.textColor} fontSize={0.09}>
                  ₹{t.index === 12 || t.index === 28 ? 150 : 200}
                </text>
              )}
              {(t.index > 0 && t.index < 10 && t.index !== 2 && t.index !== 4 && t.index !== 7) && (
                <text x={t.x + 0.5} y={t.y + 0.75} textAnchor="middle" fill={t.textColor} fontSize={0.09}>
                  ₹{BOARD_DATA[t.index].colorKey === 'property_brown' ? 60 : BOARD_DATA[t.index].colorKey === 'property_lightblue' ? (t.index === 9 ? 120 : 100) : ''}
                </text>
              )}
            </g>
          ))}

          {/* Center decoration */}
          <rect x={1} y={1} width={9} height={9} fill="#16213e" rx={0.2} />
          <text x={5.5} y={5} textAnchor="middle" fill="#e94560" fontSize={0.5} fontWeight={800}>
            DESI
          </text>
          <text x={5.5} y={5.6} textAnchor="middle" fill="#e94560" fontSize={0.5} fontWeight={800}>
            MONOPOLY
          </text>

          {/* Player tokens */}
          {tokenPositions.map((tp, i) => (
            <TokenCircle key={`${tp.playerIndex}-${i}`} playerIndex={tp.playerIndex} cx={tp.cx} cy={tp.cy} />
          ))}
        </svg>
      </div>
    </div>
  );
}
