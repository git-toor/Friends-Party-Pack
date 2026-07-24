import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from '../Card.js';
import { CardBack } from '../../../../components/CardBack.js';

interface DefuseModalProps {
  deckSize: number;
  hasZombieOption?: boolean;
  onInsertAt: (index: number) => void;
  onUseZombie?: () => void;
}

export function DefuseModal({ deckSize, hasZombieOption, onInsertAt, onUseZombie }: DefuseModalProps) {
  const slots = Math.min(deckSize + 1, 15);
  const cardW = 55;
  const cardGap = 16;
  const totalW = slots * cardW + (slots - 1) * cardGap;
  const [insertIndex, setInsertIndex] = useState<number | null>(null);
  const [dragging, setDragging] = useState(false);

  const slotPositions = useMemo(() => {
    return Array.from({ length: slots }, (_, i) => i * (cardW + cardGap));
  }, [slots]);

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex',
      flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 900,
    }}>
      <div style={{
        background: '#16213e', borderRadius: 12, padding: '20px 24px',
        maxWidth: 520, width: '90%', textAlign: 'center',
      }}>
        <h3 style={{ color: '#4ade80', margin: '0 0 4px', fontSize: 16 }}>
          🛡️ Defuse!
        </h3>
        <p style={{ color: '#aaa', margin: '0 0 16px', fontSize: 12 }}>
          Drag the 💥 onto the deck to insert it in position
        </p>

        {/* Deck fan */}
        <div style={{
          position: 'relative', height: 100, margin: '0 auto',
          width: totalW,
        }}>
          {/* Card backs in a row */}
          <div style={{ position: 'absolute', left: 0, top: 0, display: 'flex', gap: cardGap }}>
            {Array.from({ length: slots }, (_, i) => (
              <div key={i} style={{ position: 'relative' }}>
                <CardBack size="small" />
                <div style={{
                  position: 'absolute', bottom: -14, left: '50%', transform: 'translateX(-50%)',
                  fontSize: 9, color: '#666', whiteSpace: 'nowrap',
                }}>
                  {i === 0 ? 'Top' : i === slots - 1 ? 'Bottom' : ''}
                </div>
              </div>
            ))}
          </div>

          {/* Drop zone indicators */}
          <div style={{ position: 'absolute', left: 0, top: -8, display: 'flex', gap: cardGap, pointerEvents: 'none' }}>
            {Array.from({ length: slots }, (_, i) => {
              const isActive = insertIndex === i && dragging;
              return (
                <div key={i} style={{
                  width: cardW, height: 4, borderRadius: 2,
                  background: isActive ? '#4ade80' : 'transparent',
                  boxShadow: isActive ? '0 0 12px #4ade80' : 'none',
                  transition: 'all 0.15s ease',
                }} />
              );
            })}
          </div>
        </div>

        {/* Draggable EK card */}
        <div style={{ position: 'relative', height: 110, marginTop: 8 }}>
          <motion.div
            drag="x"
            dragConstraints={{ left: -totalW / 2 + cardW, right: totalW / 2 - cardW }}
            dragElastic={0.1}
            onDragStart={() => setDragging(true)}
            onDrag={(_, info) => {
              const cx = info.offset.x + totalW / 2;
              const idx = Math.max(0, Math.min(slots - 1, Math.round(cx / (cardW + cardGap))));
              setInsertIndex(idx);
            }}
            onDragEnd={(_, info) => {
              setDragging(false);
              const cx = info.offset.x + totalW / 2;
              const idx = Math.max(0, Math.min(slots - 1, Math.round(cx / (cardW + cardGap))));
              onInsertAt(idx);
            }}
            style={{
              position: 'absolute', left: '50%', top: 0, marginLeft: -45,
              cursor: 'grab', zIndex: 10,
            }}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 1.12, cursor: 'grabbing' }}
          >
            <Card
              card={{ id: 'defuse-ek', type: 'exploding_kitten', name: 'Exploding Kitten' }}
              size="small"
            />
          </motion.div>
        </div>

        {hasZombieOption && onUseZombie && (
          <button onClick={onUseZombie}
            style={{
              display: 'block', margin: '8px auto 0', padding: '8px 24px',
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
