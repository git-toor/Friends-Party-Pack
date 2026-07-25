import { PLAYER_COLORS, PLAYER_NAMES } from './constants.js';

interface OpponentBarProps {
  players: { money: number; position: number; inJail: boolean; bankrupt: boolean }[];
  currentPlayer: number;
  playerNames: Record<number, string>;
}

export function OpponentBar({ players, currentPlayer, playerNames }: OpponentBarProps) {
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
          </div>
        );
      })}
    </div>
  );
}
