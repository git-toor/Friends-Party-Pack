import { Card } from '../Card.js';

interface FavorModalProps {
  cardIds: { id: string; type: string; name: string }[];
  onChooseCard: (cardId: string) => void;
  onCancel?: () => void;
}

export function FavorModal({ cardIds, onChooseCard, onCancel }: FavorModalProps) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex',
      flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 900,
    }}>
      <div style={{
        background: '#16213e', borderRadius: 12, padding: 20, maxWidth: 380, width: '90%',
      }}>
        <h3 style={{ color: '#e94560', textAlign: 'center', margin: '0 0 12px', fontSize: 16 }}>
          🤝 Give a Card
        </h3>
        <p style={{ color: '#aaa', textAlign: 'center', margin: '0 0 12px', fontSize: 12 }}>
          Someone played Favor / Cat pair on you. Choose a card to give away.
        </p>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
          {cardIds.map(c => (
            <div key={c.id} onClick={() => onChooseCard(c.id)} style={{ cursor: 'pointer' }}>
              <Card card={c} />
            </div>
          ))}
        </div>
        {onCancel && (
          <button onClick={onCancel}
            style={{
              display: 'block', margin: '12px auto 0', padding: '6px 20px',
              background: 'none', border: '1px solid #555', color: '#888',
              borderRadius: 4, cursor: 'pointer', fontSize: 12,
            }}>
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}
