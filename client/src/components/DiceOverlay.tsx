import { forwardRef, useRef, useEffect, useImperativeHandle } from 'react';
// @ts-ignore
import { DiceBox } from '../dice/DiceBox.js';

export interface DiceOverlayHandle {
  roll: (notation?: string) => Promise<number[]>;
  clear: () => void;
}

export const DiceOverlay = forwardRef<DiceOverlayHandle, {
  onSettle?: (values: number[]) => void;
}>(function DiceOverlay({ onSettle }, ref) {
  const cr = useRef<HTMLDivElement>(null);
  const box = useRef<InstanceType<typeof DiceBox> | null>(null);

  useEffect(() => {
    const el = cr.current;
    if (!el) return;
    let cancelled = false;
    (async () => {
      const diceBox = new DiceBox(`#${el.id}`, {
        theme_colorset: 'white',
        theme_texture: '',
        theme_material: 'none',
        baseScale: 90,
        gravity_multiplier: 400,
        light_intensity: 0.7,
        color_spotlight: 0xefdfd5,
        theme_surface: 'green-felt',
        strength: 1,
        iterationLimit: 1000,
        onRollComplete: () => {},
      });
      await diceBox.initialize();
      if (!cancelled) box.current = diceBox;
    })();
    return () => { cancelled = true; if (box.current) { box.current.clearDice(); box.current = null; } };
  }, []);

  useImperativeHandle(ref, () => ({
    roll: async (notation = '5d6') => {
      const b = box.current;
      if (!b) return [];
      for (let attempt = 0; attempt < 20; attempt++) {
        if (b.initialized) break;
        await new Promise(r => setTimeout(r, 100));
      }
      if (!b.initialized) return [];
      try {
        const results = await b.roll(notation);
        const values: number[] = [];
        for (const set of results.sets || []) {
          for (const roll of set.rolls || []) {
            values.push(roll.value);
          }
        }
        if (onSettle) onSettle(values);
        return values;
      } catch { return []; }
    },
    clear: () => {
      box.current?.clearDice();
    },
  }), []);

  return <div id="dice-overlay" ref={cr} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 999 }} />;
});
