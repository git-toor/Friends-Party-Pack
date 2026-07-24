import { useMemo, useRef, useState } from 'react';
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
  const center = (slots - 1) / 2;
  const angleRange = 30;
  const cardW = 55;
  const gapX = 20;
  const totalW = slots * (cardW - gapX);
  const [insertIndex, setInsertIndex] = useState<number | null>(null);
  const dragRef = useRef(0);

  const fan = useMemo(() => {
    return Array.from({ length: slots }, (_, i) => {
      const offset = i - center;
      return {
        left: totalW / 2 + offset * (cardW - gapX) - cardW / 2,
        rotate: offset * (angleRange / Math.max(slots, 3)),
        y: Math.abs(offset) * 8,
        zIndex: i,
      };
    });
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
          Drag the 💥 into the deck fan to insert it
        </p>

        {/* Deck fan */}
        <div style={{
          position: 'relative', height: 120, margin: '0 auto',
          width: totalW + cardW,
        }}>
          {/* Drop zone highlight */}
          {insertIndex !== null && (
            <div style={{
              position: 'absolute', left: fan[insertIndex].left + cardW / 2 - 3, top: -4,
              width: 6, height: 90, borderRadius: 3,
              background: '#4ade80', boxShadow: '0 0 16px #4ade80',
              zIndex: 20, pointerEvents: 'none', transition: 'left 0.08s ease',
            }} />
          )}

          {/* Card backs in fan */}
          {fan.map((pos, i) => (
            <div
              key={i}
              style={{
                position: 'absolute', left: pos.left, top: pos.y + 10,
                transform: `rotate(${pos.rotate}deg)`,
                zIndex: pos.zIndex, pointerEvents: 'none',
              }}
            >
              <CardBack size="small" />
              <div style={{
                position: 'absolute', bottom: -14, left: '50%', transform: 'translateX(-50%)',
                fontSize: 8, color: '#666', whiteSpace: 'nowrap',
              }}>
                {i === 0 ? 'Top' : i === slots - 1 ? 'Bottom' : `#${i + 1}`}
              </div>
            </div>
          ))}
        </div>

        {/* Draggable EK card */}
        <div style={{ position: 'relative', height: 100, marginTop: 4 }}>
          <motion.div
            drag="x"
            dragConstraints={{ left: -cardW, right: totalW }}
            dragElastic={0.05}
            onDrag={(_, info) => {
              dragRef.current = info.offset.x;
              const cx = info.offset.x + totalW / 2;
              const idx = Math.max(0, Math.min(slots - 1, Math.round(cx / (cardW - gapX))));
              setInsertIndex(idx);
            }}
            onDragEnd={(_, info) => {
              const cx = info.offset.x + totalW / 2;
              const idx = Math.max(0, Math.min(slots - 1, Math.round(cx / (cardW - gapX))));
              setInsertIndex(null);
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
