import { PLAYER_COLORS, PLAYER_NAMES } from './constants.js';

interface PlayerStats { propertiesBought: number; housesBuilt: number; villasBuilt: number; rentPaid: number; rentReceived: number; timesPassedGo: number; [key: string]: any; }
interface OpponentBarProps {
  players: { money: number; position: number; inJail: boolean; bankrupt: boolean; stats?: PlayerStats }[];
  currentPlayer: number;
  playerNames: Record<number, string>;
  propertyCount?: Record<number, number>;
}

export function OpponentBar({ players, currentPlayer, playerNames, propertyCount }: OpponentBarProps) {
  return (
    <div style={{
      display: 'flex', gap: 4, padding: '4px 8px', overflowX: 'auto',
      background: 'rgba(0,0,0,0.3)', flexShrink: 0, alignItems: 'center',
      minHeight: 40,
    }}>
      {players.map((p, i) => {
        if (p.bankrupt) return null;
        const isActive = i === currentPlayer;
        const color = PLAYER_COLORS[i % PLAYER_COLORS.length];
        const propCount = propertyCount?.[i] ?? 0;
        return (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 4,
            padding: '2px 8px', borderRadius: 6, fontSize: 11,
            background: isActive ? `${color}33` : 'transparent',
            border: isActive ? `1px solid ${color}` : '1px solid transparent',
            whiteSpace: 'nowrap',
          }}>
            <div style={{
              width: 10, height: 10, borderRadius: '50%',
              background: color, flexShrink: 0,
              position: 'relative',
            }}>
              {p.inJail && (
                <span style={{ position: 'absolute', top: -4, left: -2, fontSize: 8 }}>🔗</span>
              )}
            </div>
            <span style={{ fontWeight: 600, fontSize: 11 }}>
              {playerNames[i] || `${PLAYER_NAMES[i % PLAYER_NAMES.length]}`}
            </span>
            <span style={{ color: '#4ecca3', fontSize: 10 }}>₹{p.money}</span>
            <span style={{ color: '#888', fontSize: 9 }}>{propCount}🏠</span>
          </div>
        );
      })}
    </div>
  );
}
