import { useMemo, useRef, useState, useLayoutEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PropertyCard, type PropertyCardData } from './PropertyCard.js';

interface PropertyFanProps {
  cards: PropertyCardData[];
  selectedCardIndex?: number | null;
  onSelectCard?: (cardIndex: number) => void;
  disabled?: boolean;
}

const CARD_W = 105;

export function PropertyFan({ cards, selectedCardIndex, onSelectCard, disabled }: PropertyFanProps) {
  const fanRef = useRef<HTMLDivElement>(null);
  const [containerW, setContainerW] = useState(0);

  useLayoutEffect(() => {
    const measure = () => {
      if (fanRef.current) {
        setContainerW(fanRef.current.getBoundingClientRect().width);
      }
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (fanRef.current) ro.observe(fanRef.current);
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
        y: Math.abs(offset) * 5,
        rotate: offset * (angleRange / Math.max(count, 3)),
        zIndex: i,
      };
    });
  }, [cards.length, containerW]);

  if (cards.length === 0) {
    return (
      <div ref={fanRef} style={{ position: 'relative', height: 180, width: '100%', overflow: 'visible' }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          height: '100%', color: '#555', fontSize: 12,
        }}>
          No properties yet
        </div>
      </div>
    );
  }

  if (containerW <= 0) {
    return (
      <div ref={fanRef} style={{ position: 'relative', height: 180, width: '100%', overflow: 'visible' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#555', fontSize: 12 }}>Loading...</div>
      </div>
    );
  }

  return (
    <div ref={fanRef} style={{ position: 'relative', height: 180, width: '100%', overflow: 'visible' }}>
      <AnimatePresence>
        {cards.map((card, i) => {
          const pos = fan[i];
          const isSelected = selectedCardIndex === i;

          const selectedStyle = isSelected
            ? { x: 0, y: -60, scale: 1.2, rotate: 0, zIndex: 100 }
            : { x: 0, y: pos.y, scale: 1, rotate: pos.rotate, zIndex: pos.zIndex };

          return (
            <motion.div
              key={card.index}
              initial={{ opacity: 0, y: 40 }}
              animate={{ ...selectedStyle, opacity: 1 }}
              exit={{ opacity: 0, y: -40, scale: 0.8 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30, mass: 1 }}
              style={{
                position: 'absolute',
                left: pos.left,
                bottom: 8,
                width: CARD_W,
                cursor: disabled ? 'default' : 'pointer',
              }}
              whileHover={!disabled && !isSelected ? { y: pos.y - 15, scale: 1.05, zIndex: 50 } : undefined}
              whileTap={!disabled ? { scale: 0.95 } : undefined}
              onClick={() => {
                if (!disabled) onSelectCard?.(i);
              }}
            >
              <PropertyCard
                card={card}
                selected={isSelected}
                disabled={disabled}
                size="medium"
              />
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
