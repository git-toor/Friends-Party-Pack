interface ZombieReviveProps {
  deadPlayers: { index: number; name: string }[];
  onRevive: (index: number) => void;
}

export function ZombieReviveModal({ deadPlayers, onRevive }: ZombieReviveProps) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex',
      flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 900,
    }}>
      <div style={{
        background: '#16213e', borderRadius: 12, padding: 20, maxWidth: 380, width: '90%',
      }}>
        <h3 style={{ color: '#4ade80', textAlign: 'center', margin: '0 0 12px', fontSize: 16 }}>
          🧟 Zombie Kitten — Revive a Player
        </h3>
        <p style={{ color: '#aaa', textAlign: 'center', margin: '0 0 12px', fontSize: 12 }}>
          Choose a dead player to bring back to life:
        </p>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
          {deadPlayers.map((p, i) => (
            <button key={p.index} onClick={() => onRevive(p.index)}
              style={{
                padding: '12px 24px', borderRadius: 8, cursor: 'pointer',
                background: '#0f3460', color: '#fff', border: '1px solid #4ade80',
                fontSize: 14, fontWeight: 600,
              }}>
              {p.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
