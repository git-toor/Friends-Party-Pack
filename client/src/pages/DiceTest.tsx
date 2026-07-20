import { useState, useRef, useCallback } from 'react';
import { DiceOverlay, type DiceOverlayHandle, type DiceComboEntry } from '../components/DiceOverlay.js';
import { DiceRollPanel } from '../components/DiceRollPanel.js';

export default function DiceTest() {
  const diceRef = useRef<DiceOverlayHandle>(null);
  const [animResult, setAnimResult] = useState<number[] | null>(null);
  const [animActive, setAnimActive] = useState(false);

  const handleRoll = useCallback(async (combo: DiceComboEntry[]) => {
    setAnimActive(true);
    setAnimResult(null);
    if (diceRef.current) {
      const values = await diceRef.current.rollBatch(combo);
      setAnimResult(values);
    }
    setAnimActive(false);
  }, []);

  return (
    <div style={{ width: '100%', height: '100%', background: '#0f0f1a' }}>
      <DiceOverlay ref={diceRef} />
      <div style={{ position: 'fixed', top: 10, left: 10, color: '#fff', zIndex: 1001, fontSize: 18 }}>
        🎲 DICE TEST — select dice below and press Roll
      </div>
      <DiceRollPanel
        diceMode="ANIMATED"
        rerollsRemaining={0}
        pendingRoll={null}
        sessionId=""
        visible={true}
        animationActive={animActive}
        animationResult={animResult}
        onRollClick={handleRoll}
        onSubmitRoll={() => {}}
        onClose={() => {}}
      />
    </div>
  );
}
