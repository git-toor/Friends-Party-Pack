import { GROUP_COLORS } from './constants.js';

interface PropertyCardData {
  index: number;
  name: string;
  spaceId?: string;
  group?: number;
  price: number;
  houses: number;
  mortgaged: boolean;
  monopoly?: boolean;
  houseCost?: number;
  rent?: number[];
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

  const hasMonopoly = card.monopoly === true;

  return (
    <div style={{
      width: w, height: h, borderRadius: 8, overflow: 'hidden',
      background: '#1a1a2e',
      border: selected ? `2px solid #e94560` : hasMonopoly ? `2px solid ${color}` : `1px solid #333`,
      boxShadow: selected ? '0 0 12px rgba(233,69,96,0.5)' : hasMonopoly ? `0 0 10px ${color}80` : '0 2px 6px rgba(0,0,0,0.3)',
      display: 'flex', flexDirection: 'column', cursor: disabled ? 'default' : 'pointer',
      opacity: isMortgaged ? 0.5 : 1,
      filter: isMortgaged ? 'grayscale(100%)' : 'none',
      transition: 'all 0.2s ease',
      flexShrink: 0,
    }}>
      {/* Art + Color band */}
      <div style={{ position: 'relative', height: size === 'medium' ? 64 : 48, overflow: 'hidden' }}>
        {/* Property art */}
        {card.spaceId && (
          <img src={`/art/monopoly/${card.spaceId}_001.webp`}
            alt={card.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
        )}
        {/* Color strip overlay */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: size === 'medium' ? 10 : 8,
          background: color,
        }} />
        <span style={{
          position: 'absolute', bottom: 2, left: 0, right: 0,
          color: '#fff', fontWeight: 700, fontSize: size === 'medium' ? 9 : 7,
          textAlign: 'center', textShadow: '0 1px 2px rgba(0,0,0,0.5)',
          lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', padding: '0 2px',
          whiteSpace: 'nowrap',
        }}>
          {card.name}
        </span>
      </div>

      {/* Content */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column', padding: '3px 4px',
        fontSize: size === 'medium' ? 8 : 6, gap: 2,
      }}>
        <span style={{ color: '#4ecca3', fontWeight: 700, fontSize: size === 'medium' ? 13 : 10, textAlign: 'center' }}>
          ₹{card.price}
        </span>

        {/* Rent Table */}
        {card.rent && card.rent.length > 0 && (
          <div style={{ marginTop: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#888', fontSize: size === 'medium' ? 7 : 6 }}>
              <span>Rent</span>
              <span>₹{card.monopoly ? card.rent[0] * 2 : card.rent[0]}</span>
            </div>
            {card.rent.slice(1, 5).map((r, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', color: card.houses === i + 1 ? '#4CAF50' : '#666', fontWeight: card.houses === i + 1 ? 700 : 400, fontSize: size === 'medium' ? 7 : 6 }}>
                <span>{i + 1} 🏠</span>
                <span>₹{r}</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', color: card.houses === 5 ? '#F44336' : '#666', fontWeight: card.houses === 5 ? 700 : 400, fontSize: size === 'medium' ? 7 : 6 }}>
              <span>💒 Villa</span>
              <span>₹{card.rent[5]}</span>
            </div>
          </div>
        )}

        {/* Bungalow / Villa indicators */}
        {card.houses > 0 && (
          <div style={{ display: 'flex', gap: 1, justifyContent: 'center', marginTop: 1 }}>
            {card.houses <= 4 ? (
              Array.from({ length: card.houses }, (_, i) => (
                <div key={i} style={{
                  width: size === 'medium' ? 8 : 6, height: size === 'medium' ? 8 : 6,
                  background: '#4CAF50', borderRadius: 1, border: '1px solid #388E3C',
                }} />
              ))
            ) : (
              <div style={{
                width: size === 'medium' ? 14 : 10, height: size === 'medium' ? 10 : 7,
                background: '#F44336', borderRadius: 1, border: '1px solid #C62828',
              }} />
            )}
          </div>
        )}

        {/* Mortgaged label */}
        {isMortgaged && (
          <span style={{ color: '#ff6666', fontSize: 6, marginTop: 1, fontWeight: 600, textAlign: 'center' }}>
            MORTGAGED
          </span>
        )}
      </div>
    </div>
  );
}

export type { PropertyCardData };
