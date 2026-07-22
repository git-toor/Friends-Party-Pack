import { Card, type CardData } from './Card.js';

interface HandProps {
  cards: CardData[];
  selectedCardId?: string | null;
  onSelectCard?: (cardId: string) => void;
  disabled?: boolean;
  markedCardIds?: string[];
}

export function Hand({ cards, selectedCardId, onSelectCard, disabled, markedCardIds }: HandProps) {
  if (cards.length === 0) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 100, color: '#555', fontSize: 12 }}>
        Empty hand
      </div>
    );
  }

  const totalWidth = Math.min(cards.length * 55, window.innerWidth - 40);
  const overlap = cards.length > 5 ? (totalWidth - 70) / (cards.length - 1) : 55;

  return (
    <div style={{
      display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: 0,
      padding: '8px 4px', minHeight: 120, overflowX: 'auto',
      position: 'relative',
    }}>
      {cards.map((card, i) => (
        <div key={card.id} style={{
          marginLeft: i === 0 ? 0 : `${-overlap + 55}px`,
          zIndex: selectedCardId === card.id ? 10 : i,
          transition: 'transform 0.2s ease, margin 0.2s ease',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
        }}>
          <Card
            card={card}
            selected={selectedCardId === card.id}
            disabled={disabled}
            onClick={disabled ? undefined : () => onSelectCard?.(card.id)}
          />
          {card.marked && (
            <div style={{ fontSize: 9, color: '#ff0', marginTop: 2 }}>📍 Marked</div>
          )}
        </div>
      ))}
    </div>
  );
}
