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

const CARDS_PER_ROW = 15;
const ROW_H = 28;
const cardW = 55;
const gapX = 20;

export function DefuseModal({ deckSize, hasZombieOption, onInsertAt, onUseZombie }: DefuseModalProps) {
  const totalSlots = deckSize + 1;
  const rowCount = Math.ceil(totalSlots / CARDS_PER_ROW);
  const [insertIndex, setInsertIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const totalW = CARDS_PER_ROW * (cardW - gapX);

  const rows = useMemo(() => {
    return Array.from({ length: rowCount }, (_, ri) => {
      const slotsInRow = Math.min(CARDS_PER_ROW, totalSlots - ri * CARDS_PER_ROW);
      const center = (slotsInRow - 1) / 2;
      const angleRange = 20;
      return Array.from({ length: slotsInRow }, (_, si) => {
        const offset = si - center;
        const linearIdx = ri * CARDS_PER_ROW + si;
        return {
          linearIdx,
          left: totalW / 2 + offset * (cardW - gapX) - cardW / 2,
          rotate: offset * (angleRange / Math.max(slotsInRow, 3)),
          y: Math.abs(offset) * 4,
          zIndex: si,
        };
      });
    });
  }, [rowCount]);

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex',
      flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 900,
    }}>
      <div ref={containerRef} style={{
        background: '#16213e', borderRadius: 12, padding: '16px 20px',
        maxWidth: '95%', width: 520, textAlign: 'center',
      }}>
        <h3 style={{ color: '#4ade80', margin: '0 0 2px', fontSize: 16 }}>
          🛡️ Defuse!
        </h3>
        <p style={{ color: '#aaa', margin: '0 0 10px', fontSize: 11 }}>
          Drag the 💥 to where you want to place it ({deckSize} cards in deck)
        </p>

        {/* Multi-row deck fan */}
        <div style={{
          position: 'relative', margin: '0 auto',
          width: totalW + cardW, height: rowCount * ROW_H + 20,
          overflow: 'hidden',
        }}>
          {rows.map((row, ri) => (
            <div key={ri} style={{
              position: 'absolute', left: 0, top: ri * ROW_H, width: '100%', height: ROW_H + 10,
            }}>
              {row.map(slot => (
                <div
                  key={slot.linearIdx}
                  style={{
                    position: 'absolute', left: slot.left, top: slot.y,
                    transform: `rotate(${slot.rotate}deg)`,
                    zIndex: slot.zIndex, pointerEvents: 'none',
                    height: ROW_H, overflow: 'hidden',
                  }}
                >
                  <div style={{ transform: 'scale(0.5)', transformOrigin: 'top left' }}>
                    <CardBack size="small" />
                  </div>
                  <div style={{
                    position: 'absolute', bottom: -8, left: '50%', transform: 'translateX(-50%)',
                    fontSize: 7, color: '#666', whiteSpace: 'nowrap',
                  }}>
                    {slot.linearIdx === 0 ? 'Top' : slot.linearIdx === deckSize ? 'Bottom' : `#${slot.linearIdx}`}
                  </div>
                </div>
              ))}
            </div>
          ))}

          {/* Drop zone highlight */}
          {insertIndex !== null && (() => {
            const ri = Math.floor(insertIndex / CARDS_PER_ROW);
            const si = insertIndex % CARDS_PER_ROW;
            const row = rows[ri];
            if (!row || !row[si]) return null;
            const slot = row[si];
            return (
              <div style={{
                position: 'absolute', left: slot.left + cardW / 2 - 2, top: ri * ROW_H + slot.y - 2,
                width: 4, height: ROW_H + 6, borderRadius: 2,
                background: '#4ade80', boxShadow: '0 0 12px #4ade80',
                zIndex: 20, pointerEvents: 'none', transition: 'left 0.06s ease',
              }} />
            );
          })()}
        </div>

        {/* Draggable EK card */}
        <div style={{ position: 'relative', height: 80, marginTop: 2 }}>
          <motion.div
            drag="x"
            dragConstraints={{ left: 0, right: totalW }}
            dragElastic={0.05}
            onDrag={(_, info) => {
              const cx = info.offset.x;
              const slotPerRow = Math.min(CARDS_PER_ROW, totalSlots);
              const slotW = totalW / Math.max(slotPerRow, 2);
              const globalIdx = Math.max(0, Math.min(totalSlots - 1, Math.round(cx / slotW)));
              setInsertIndex(globalIdx);
            }}
            onDragEnd={(_, info) => {
              const cx = info.offset.x;
              const slotPerRow = Math.min(CARDS_PER_ROW, totalSlots);
              const slotW = totalW / Math.max(slotPerRow, 2);
              const globalIdx = Math.max(0, Math.min(totalSlots - 1, Math.round(cx / slotW)));
              setInsertIndex(null);
              onInsertAt(globalIdx);
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
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            fontSize: 10, color: '#888', textAlign: 'center',
          }}>
            {insertIndex !== null
              ? `Insert at position #${insertIndex}${insertIndex === 0 ? ' (Top)' : insertIndex === deckSize ? ' (Bottom)' : ''}`
              : 'Drag left/right to choose position'}
          </div>
        </div>

        {hasZombieOption && onUseZombie && (
          <button onClick={onUseZombie}
            style={{
              display: 'block', margin: '6px auto 0', padding: '8px 24px',
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
