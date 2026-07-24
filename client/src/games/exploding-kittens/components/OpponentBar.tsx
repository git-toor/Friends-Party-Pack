interface OpponentView {
  id: string;
  name: string;
  index: number;
  cardCount: number;
  alive: boolean;
  dead: boolean;
  pendingTurns: number;
  streakingKitten?: boolean;
  cursed: boolean;
  stashCount: number;
}

interface OpponentBarProps {
  opponents: OpponentView[];
  currentPlayerIndex: number;
  playerNames?: Record<number, string>;
}

export function OpponentBar({ opponents, currentPlayerIndex, playerNames = {} }: OpponentBarProps) {
  const displayName = (opp: OpponentView) => playerNames[opp.index] || opp.name;
  return (
    <div style={{
      display: 'flex', gap: 6, padding: '6px 8px', overflowX: 'auto',
      background: 'rgba(22,33,62,0.6)', borderRadius: 8, margin: '0 4px',
    }}>
      {opponents.map(opp => (
        <div key={opp.id} style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          padding: '6px 10px', borderRadius: 6, minWidth: 60,
          background: opp.index === currentPlayerIndex ? 'rgba(233,69,96,0.15)' : 'transparent',
          border: opp.index === currentPlayerIndex ? '1px solid #e94560' : '1px solid transparent',
          opacity: opp.alive ? 1 : 0.4,
        }}>
          <div style={{ fontSize: 10, color: '#ccc', fontWeight: 600, textAlign: 'center', maxWidth: 60, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {displayName(opp)}
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, color: opp.dead ? '#ff4444' : '#fff', marginTop: 2 }}>
            {opp.cardCount}
          </div>
          <div style={{ display: 'flex', gap: 2, marginTop: 2, alignItems: 'center' }}>
            {opp.streakingKitten && <span title="Streaking Kitten" style={{ fontSize: 10 }}>🏃</span>}
            {opp.cursed && <span title="Cursed" style={{ fontSize: 10 }}>😾</span>}
            {opp.stashCount > 0 && <span title={`Stash: ${opp.stashCount}`} style={{ fontSize: 10 }}>👑</span>}
            {!opp.alive && opp.dead && <span title="Dead" style={{ fontSize: 10 }}>💀</span>}
            {opp.pendingTurns > 1 && <span title={`${opp.pendingTurns} turns`} style={{ fontSize: 10, color: '#ff8800' }}>×{opp.pendingTurns}</span>}
          </div>
        </div>
      ))}
    </div>
  );
}
