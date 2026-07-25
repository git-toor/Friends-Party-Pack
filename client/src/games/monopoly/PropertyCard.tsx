import { GROUP_COLORS } from './constants.js';

interface PropertyCardData {
  index: number;
  name: string;
  group?: number;
  price: number;
  houses: number;
  mortgaged: boolean;
}

interface PropertyCardProps {
  card: PropertyCardData;
  selected?: boolean;
  disabled?: boolean;
  size?: 'small' | 'medium';
}

const CARD_W = { small: 75, medium: 105 };
const CARD_H = { small: 112, medium: 158 };

export function PropertyCard({ card, selected, disabled, size = 'medium' }: PropertyCardProps) {
  const w = CARD_W[size];
  const h = CARD_H[size];
  const color = card.group !== undefined ? (GROUP_COLORS[card.group] || '#888') : '#888';
  const isMortgaged = card.mortgaged;

  return (
    <div style={{
      width: w, height: h, borderRadius: 8, overflow: 'hidden',
      background: '#1a1a2e', border: selected ? `2px solid #e94560` : `1px solid #333`,
      boxShadow: selected ? '0 0 12px rgba(233,69,96,0.5)' : '0 2px 6px rgba(0,0,0,0.3)',
      display: 'flex', flexDirection: 'column', cursor: disabled ? 'default' : 'pointer',
      opacity: isMortgaged ? 0.5 : 1,
      filter: isMortgaged ? 'grayscale(100%)' : 'none',
      transition: 'all 0.2s ease',
      flexShrink: 0,
    }}>
      {/* Color band */}
      <div style={{
        height: size === 'medium' ? 48 : 36, background: color,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '2px', boxSizing: 'border-box',
      }}>
        <span style={{
          color: '#fff', fontWeight: 700, fontSize: size === 'medium' ? 9 : 7,
          textAlign: 'center', textShadow: '0 1px 2px rgba(0,0,0,0.5)',
          lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis',
          maxHeight: '100%',
        }}>
          {card.name}
        </span>
      </div>

      {/* Price */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', padding: '2px',
      }}>
        <span style={{ color: '#4ecca3', fontWeight: 700, fontSize: size === 'medium' ? 13 : 10 }}>
          ₹{card.price}
        </span>

        {/* Bungalow / Villa indicators */}
        {card.houses > 0 && (
          <div style={{ display: 'flex', gap: 2, marginTop: 4 }}>
            {card.houses <= 4 ? (
              Array.from({ length: card.houses }, (_, i) => (
                <div key={i} style={{
                  width: size === 'medium' ? 10 : 8, height: size === 'medium' ? 10 : 8,
                  background: '#4CAF50', borderRadius: 2, border: '1px solid #388E3C',
                }} />
              ))
            ) : (
              <div style={{
                width: size === 'medium' ? 16 : 12, height: size === 'medium' ? 12 : 9,
                background: '#F44336', borderRadius: 2, border: '1px solid #C62828',
              }} />
            )}
          </div>
        )}

        {/* Mortgaged label */}
        {isMortgaged && (
          <span style={{ color: '#ff6666', fontSize: 7, marginTop: 2, fontWeight: 600 }}>
            MORTGAGED
          </span>
        )}
      </div>
    </div>
  );
}

export type { PropertyCardData };
