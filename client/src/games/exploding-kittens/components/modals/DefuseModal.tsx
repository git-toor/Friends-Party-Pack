interface DefuseModalProps {
  deckSize: number;
  hasZombieOption?: boolean;
  onInsertAt: (index: number) => void;
  onUseZombie?: () => void;
}

export function DefuseModal({ deckSize, hasZombieOption, onInsertAt, onUseZombie }: DefuseModalProps) {
  const slots = Math.min(deckSize + 1, 20);
  const slotWidth = Math.min(50, Math.floor(280 / slots));

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex',
      flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 900,
    }}>
      <div style={{
        background: '#16213e', borderRadius: 12, padding: 20, maxWidth: 420, width: '90%',
      }}>
        <h3 style={{ color: '#4ade80', textAlign: 'center', margin: '0 0 8px', fontSize: 16 }}>
          🛡️ Defuse!
        </h3>
        <p style={{ color: '#aaa', textAlign: 'center', margin: '0 0 12px', fontSize: 12 }}>
          Choose where to reinsert the Exploding Kitten in the deck:
        </p>
        <div style={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
          {Array.from({ length: slots }, (_, i) => (
            <button key={i} onClick={() => onInsertAt(i)}
              style={{
                width: slotWidth, height: 50, border: '1px solid #444',
                borderRadius: 4, background: '#0f3460', color: '#ccc',
                fontSize: 10, cursor: 'pointer', display: 'flex',
                flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              }}>
              <span style={{ fontSize: 14 }}>{i + 1}</span>
              <span style={{ fontSize: 7, color: '#666' }}>{i === 0 ? 'Top' : i === slots - 1 ? 'Bottom' : ''}</span>
            </button>
          ))}
        </div>
        {hasZombieOption && onUseZombie && (
          <button onClick={onUseZombie}
            style={{
              display: 'block', margin: '12px auto 0', padding: '8px 24px',
              background: '#33aa33', color: '#fff', border: 'none',
              borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 600,
            }}>
            🧟 Use Zombie Kitten instead (revive dead player)
          </button>
        )}
      </div>
    </div>
  );
}
