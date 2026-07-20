import { forwardRef, useRef, useEffect, useImperativeHandle } from 'react';
// @ts-ignore
import { DiceBox } from '../dice/DiceBox.js';

export interface DiceOverlayHandle {
  roll: (count?: number) => Promise<number[]>;
  keep: (indices: number[]) => { value: number }[];
  getSettledValues: () => (number | null)[];
  resetKept: () => void;
  clear: () => void;
  isRolling: () => boolean;
}

export const DiceOverlay = forwardRef<DiceOverlayHandle, {
  onSettle?: (values: number[]) => void;
  onDieTap?: (index: number) => void;
  onKeepComplete?: (count: number) => void;
}>(function DiceOverlay({ onSettle, onDieTap, onKeepComplete }, ref) {
  const containerRef = useRef<HTMLDivElement>(null);
  const boxRef = useRef<InstanceType<typeof DiceBox> | null>(null);
  const pointerMode = useRef<'auto' | 'none'>('none');

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    let cancelled = false;

    (async () => {
      const diceBox = new DiceBox(`#${el.id}`, {
        theme_colorset: 'white',
        theme_texture: '',
        theme_material: 'glass',
        baseScale: 90,
        gravity_multiplier: 400,
        light_intensity: 0.7,
        color_spotlight: 0xefdfd5,
        theme_surface: 'green-felt',
        strength: 1,
        iterationLimit: 1000,
        onRollComplete: (results: any) => {
          const values = getValuesFromResults(results);
          if (!cancelled && onSettle) onSettle(values);
        },
        onKeepComplete: (count: number) => {
          if (!cancelled && onKeepComplete) onKeepComplete(count);
        },
        onDieTap: (index: number) => {
          if (!cancelled && onDieTap) onDieTap(index);
        },
      });

      await diceBox.initialize();
      if (diceBox.renderer) {
        diceBox.setupDieTap(diceBox.renderer.domElement);
      }

      if (!cancelled) {
        boxRef.current = diceBox;
      }
    })();

    return () => {
      cancelled = true;
      if (boxRef.current) {
        boxRef.current.clearDice();
        boxRef.current = null;
      }
    };
  }, []);

  useImperativeHandle(ref, () => ({
    roll: async (count = 5) => {
      const b = boxRef.current;
      if (!b) return [];
      for (let attempt = 0; attempt < 20; attempt++) {
        if (b.initialized) break;
        await new Promise(r => setTimeout(r, 100));
      }
      if (!b.initialized) return [];
      try {
        const results = await b.roll(`${count}d6`);
        return getValuesFromResults(results);
      } catch {
        return [];
      }
    },
    keep: (indices: number[]) => {
      const b = boxRef.current;
      if (!b) return [];
      return b.keepDice(indices);
    },
    getSettledValues: () => {
      const b = boxRef.current;
      if (!b) return [];
      return b.getSettledValues();
    },
    resetKept: () => {
      boxRef.current?.resetKept();
    },
    clear: () => {
      boxRef.current?.clearDice();
    },
    isRolling: () => {
      return boxRef.current?.rolling ?? false;
    },
  }), []);

  return (
    <div
      id="dice-overlay"
      ref={containerRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 999,
      }}
    />
  );
});

function getValuesFromResults(results: any): number[] {
  const values: number[] = [];
  if (!results) return values;
  for (const set of results.sets || []) {
    for (const roll of set.rolls || []) {
      values.push(roll.value);
    }
  }
  return values;
}
