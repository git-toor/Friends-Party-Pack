import { useMemo, useRef, useState, useCallback, useEffect, useLayoutEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, type CardData } from './Card.js';

interface HandProps {
  cards: CardData[];
  selectedCardIds?: string[];
  onSelectCard?: (cardId: string) => void;
  onSwipePlay?: (cardId: string, point?: { x: number; y: number }) => void;
  onSwipeCombo?: (cardId: string, point?: { x: number; y: number }) => void;
  disabled?: boolean;
  markedCardIds?: string[];
  comboMode?: boolean;
  onComboToggle?: (cardId: string) => void;
}

const CARD_W = 105;
const CAT_TYPES = ['tacocat', 'cattermelon', 'hairy_potato_cat', 'beard_cat', 'rainbow_ralphing_cat', 'feral_cat'];

export function Hand({ cards, selectedCardIds = [], onSelectCard, onSwipePlay, onSwipeCombo, disabled, markedCardIds, comboMode, onComboToggle }: HandProps) {
  const handRef = useRef<HTMLDivElement>(null);
  const [containerW, setContainerW] = useState(0);

  useLayoutEffect(() => {
    const measure = () => {
      if (handRef.current) {
        setContainerW(handRef.current.getBoundingClientRect().width);
      }
    };
    const ro = new ResizeObserver(measure);
    if (handRef.current) ro.observe(handRef.current);
    return () => ro.disconnect();
  }, []);

  const fan = useMemo(() => {
    const count = cards.length;
    if (count === 0) return [];
    const angleRange = 40;
    const center = (count - 1) / 2;
    const available = containerW - 8;
    const gap = count > 1
      ? Math.min(CARD_W * 0.9, (available - CARD_W) / (count - 1))
      : 0;
    const totalSpan = (count - 1) * gap + CARD_W;
    const startX = (containerW - totalSpan) / 2;
    return cards.map((_, i) => {
      const offset = i - center;
      return {
        left: startX + i * gap,
        x: offset * gap,
        y: Math.abs(offset) * 5,
        rotate: offset * (angleRange / Math.max(count, 3)),
        zIndex: i,
      };
    });
  }, [cards.length, containerW]);

  const isCat = useCallback((type: string) => CAT_TYPES.includes(type), []);

  const handleCardTap = useCallback((cardId: string) => {
    if (disabled) return;
    if (comboMode) {
      onComboToggle?.(cardId);
      return;
    }
    onSelectCard?.(cardId);
  }, [disabled, comboMode, onComboToggle, onSelectCard]);

  if (cards.length === 0) {
    return (
      <div ref={handRef} style={{ position: 'relative', height: 200, width: '100%', overflow: 'visible' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#555', fontSize: 12 }}>
          Empty hand
        </div>
      </div>
    );
  }

  // Don't render fan until container width is measured
  if (containerW <= 0) {
    return (
      <div ref={handRef} style={{ position: 'relative', height: 200, width: '100%', overflow: 'visible' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#555', fontSize: 12 }}>
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div ref={handRef} style={{ position: 'relative', height: 200, width: '100%', overflow: 'visible' }}>
      <AnimatePresence>
        {cards.map((card, i) => {
          const pos = fan[i];
          const isSelected = selectedCardIds.includes(card.id);
          const isMarked = markedCardIds?.includes(card.id);
          const isCatCard = isCat(card.type);

          const selectedStyle = isSelected
            ? { x: 0, y: -80, scale: 1.25, rotate: 0, zIndex: 100 }
            : { x: 0, y: pos.y, scale: 1, rotate: pos.rotate, zIndex: pos.zIndex };

          return (
            <motion.div
              key={card.id}
              initial={{ opacity: 0, y: 40 }}
              animate={{
                ...selectedStyle,
                opacity: 1,
              }}
              exit={{ opacity: 0, y: -40, scale: 0.8 }}
              transition={{
                type: 'spring',
                stiffness: 400,
                damping: 30,
                mass: 1,
              }}
              style={{
                position: 'absolute',
                left: pos.left,
                bottom: 8,
                width: CARD_W,
                cursor: disabled ? 'default' : 'grab',
              }}
              whileHover={!disabled && !isSelected ? { y: pos.y - 20, scale: 1.06, zIndex: 50 } : undefined}
              whileTap={!disabled ? { scale: 0.95 } : undefined}
              drag={!disabled}
              dragSnapToOrigin
              dragElastic={0.5}
              onDragEnd={(_, info) => {
                const upward = info.offset.y < -60;
                if (!upward) return;

                if (isCatCard) {
                  onSwipeCombo?.(card.id, info.point);
                } else {
                  onSwipePlay?.(card.id, info.point);
                }
              }}
              onClick={() => handleCardTap(card.id)}
            >
              <Card
                card={card}
                selected={isSelected || (comboMode && isCatCard && selectedCardIds.includes(card.id))}
                disabled={disabled}
                size="medium"
              />
              {comboMode && isCatCard && (
                <div style={{
                  position: 'absolute', top: -8, right: -8, width: 20, height: 20,
                  borderRadius: '50%', background: selectedCardIds.includes(card.id) ? '#e94560' : '#333',
                  border: '2px solid #fff', color: '#fff', fontSize: 11, fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {selectedCardIds.includes(card.id) ? selectedCardIds.indexOf(card.id) + 1 : ''}
                </div>
              )}
              {isMarked && (
                <div style={{ fontSize: 9, color: '#ff0', marginTop: 2, textAlign: 'center', position: 'absolute', bottom: -4, left: 0, right: 0 }}>📍</div>
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
