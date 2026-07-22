interface GameOverProps {
  winner: number | null;
  players: { name: string; index: number; score: number }[];
  onRematch: () => void;
  onBackToLobby: () => void;
}

export function GameOverOverlay({ winner, players, onRematch, onBackToLobby }: GameOverProps) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex',
      flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
    }}>
      <div style={{
        background: '#16213e', borderRadius: 12, padding: 24, maxWidth: 420, width: '90%',
      }}>
        <h2 style={{ color: '#e94560', textAlign: 'center', margin: '0 0 4px', fontSize: 20 }}>
          Game Over!
        </h2>
        <p style={{ color: '#fbbf24', textAlign: 'center', margin: '0 0 16px', fontSize: 14 }}>
          {winner !== null
            ? `Winner: ${players[winner]?.name || `Player ${winner + 1}`}`
            : 'Tie!'}
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap', marginBottom: 16 }}>
          {players.map((p, i) => (
            <div key={i} style={{
              textAlign: 'center', padding: '8px 14px', borderRadius: 8,
              background: i === winner ? 'rgba(251,191,36,0.12)' : 'rgba(255,255,255,0.04)',
              border: i === winner ? '1px solid #fbbf24' : '1px solid transparent',
            }}>
              <div style={{ color: i === winner ? '#fbbf24' : '#aaa', fontSize: 12, fontWeight: 600 }}>
                {p.name}
              </div>
              <div style={{ color: '#fff', fontSize: 20, fontWeight: 700, marginTop: 2 }}>
                {p.score}
              </div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
          <button onClick={onRematch}
            style={{
              padding: '10px 24px', background: '#0f3460', color: '#fff', border: '1px solid #e94560',
              borderRadius: 6, cursor: 'pointer', fontSize: 14, fontWeight: 600,
            }}>
            🔄 Rematch
          </button>
          <button onClick={onBackToLobby}
            style={{
              padding: '10px 24px', background: '#e94560', color: '#fff', border: 'none',
              borderRadius: 6, cursor: 'pointer', fontSize: 14, fontWeight: 600,
            }}>
            Back to Lobby
          </button>
        </div>
      </div>
    </div>
  );
}
