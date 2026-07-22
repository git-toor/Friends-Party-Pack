import { useMemo } from 'react';
import { Card, type CardData } from './Card.js';

interface HandProps {
  cards: CardData[];
  selectedCardIds?: string[];
  onSelectCard?: (cardId: string) => void;
  disabled?: boolean;
  markedCardIds?: string[];
}

export function Hand({ cards, selectedCardIds = [], onSelectCard, disabled, markedCardIds }: HandProps) {
  // Calculate overlap based on screen width and card count
  const overlap = useMemo(() => {
    const screenW = typeof window !== 'undefined' ? window.innerWidth : 400;
    const cardW = 105; // medium card width
    const totalW = cards.length * cardW;
    // If cards don't fit, overlap them
    if (totalW > screenW - 20) {
      const available = screenW - 20 - cardW; // keep one card full width
      return Math.max(30, available / (cards.length - 1)); // at least 30px overlap
    }
    return cardW; // no overlap needed
  }, [cards.length]);

  if (cards.length === 0) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 100, color: '#555', fontSize: 12 }}>
        Empty hand
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex', justifyContent: 'center', alignItems: 'flex-end',
      padding: '8px 4px', minHeight: 180, overflowX: 'auto', overflowY: 'visible',
      position: 'relative', width: '100%',
    }}>
      {cards.map((card, i) => {
        const isSelected = selectedCardIds.includes(card.id);
        return (
          <div key={card.id} style={{
            marginLeft: i === 0 ? 0 : `${-(105 - overlap)}px`,
            zIndex: isSelected ? 10 : i,
            transition: 'transform 0.2s ease, margin 0.2s ease',
          }}>
            <Card
              card={card}
              selected={isSelected}
              disabled={disabled}
              onClick={disabled ? undefined : () => onSelectCard?.(card.id)}
            />
            {card.marked && (
              <div style={{ fontSize: 9, color: '#ff0', marginTop: 2, textAlign: 'center' }}>📍</div>
            )}
          </div>
        );
      })}
    </div>
  );
}
