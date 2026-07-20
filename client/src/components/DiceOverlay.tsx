import { forwardRef, useRef, useEffect, useImperativeHandle } from 'react';
// @ts-ignore
import { DiceBox } from '../dice/DiceBox.js';
// @ts-ignore
import { COLORSETS } from '../dice/colorsets.js';
// @ts-ignore
import { TEXTURELIST } from '../dice/texturelist.js';
import { loadTexture, type DiceTextureObject } from '../dice/DiceTextureLoader.js';

export type DieType = 'd4' | 'd6' | 'd8' | 'd10' | 'd12' | 'd20';

export interface DiceComboEntry {
  dieType: DieType;
  count: number;
}

export interface PerDieConfig {
  colorset?: string;
  faceColor?: string;
  textColor?: string;
  edgeColor?: string;
  outline?: string;
  material?: string;
  texture?: string;
}

export type DiceAppearanceConfig = Partial<Record<DieType, PerDieConfig>>;

export interface DiceOverlayHandle {
  roll: (dieType: DieType, count?: number) => Promise<number[]>;
  rollBatch: (combo: DiceComboEntry[]) => Promise<number[]>;
  configure: (config: Record<string, PerDieConfig>) => Promise<void>;
  clear: () => void;
  generateVectors: (notation: string) => any;
  rollWithVectors: (nv: any) => Promise<number[]>;
}

function resolveTheme(config: DiceAppearanceConfig): {
  colorset: string; customColorset: any; texture: string; material: string;
} {
  const firstKey = (Object.keys(config)[0] || 'd20') as DieType;
  const c = config[firstKey] || {} as PerDieConfig;
  let colorset = c.colorset || 'white';
  let texture = c.texture || '';
  let material = c.material || 'none';

  let customColorset = null;
  if (c.colorset && COLORSETS[c.colorset]) {
    const cs = COLORSETS[c.colorset] as any;
    customColorset = {
      name: c.colorset,
      background: c.faceColor || cs.background || '#ffffff',
      foreground: c.textColor || cs.foreground || '#000000',
      outline: c.outline || cs.outline || 'none',
      edge: c.edgeColor || cs.edge || '#888888',
      texture: { name: 'none', texture: null, bump: null, composite: 'source-over', material: 'none' },
    };
    if (texture && texture !== 'none') {
      colorset = 'white';
    }
  }

  return { colorset, customColorset, texture, material };
}

export const DiceOverlay = forwardRef<DiceOverlayHandle, {}>(function DiceOverlay(_p, ref) {
  const cr = useRef<HTMLDivElement>(null);
  const box = useRef<InstanceType<typeof DiceBox> | null>(null);
  const configRef = useRef<Record<string, PerDieConfig>>({});
  const texCache = useRef<Map<string, DiceTextureObject>>(new Map());

  const spawnCount = useRef(0);

  useEffect(() => {
    const el = cr.current;
    if (!el) return;
    let cancelled = false;
    (async () => {
      const diceBox = new DiceBox(`#${el.id}`, {
        assetPath: '/',
        theme_colorset: 'white',
        theme_texture: '',
        theme_material: 'none',
        baseScale: 90,
        gravity_multiplier: 400,
        light_intensity: 0.7,
        color_spotlight: 0xefdfd5,
        theme_surface: 'green-felt',
        sounds: true,
        volume: 100,
        strength: 1,
        iterationLimit: 1000,
        beforeSpawnDie: (type: string, _vec: any, factory: any) => {
          const cache = texCache.current;
          const config = configRef.current;
          const idx = spawnCount.current % 5;
          spawnCount.current = spawnCount.current + 1;
          const diceKey = `dice_${idx}`;
          const c = (config[diceKey] || config[type as DieType] || {}) as PerDieConfig;
          if (c.colorset && COLORSETS[c.colorset]) {
            const cs = COLORSETS[c.colorset] as any;
            const face = c.faceColor || cs.background || '#ffffff';
            factory.dice_color = face;
            factory.label_color = c.textColor || cs.foreground || '#000000';
            factory.label_outline = c.outline || cs.outline || 'none';
            factory.edge_color = c.edgeColor || cs.edge || face;
          } else if (c.faceColor) {
            factory.dice_color = c.faceColor;
            factory.label_color = c.textColor || '#ffffff';
            factory.label_outline = c.outline || 'none';
            factory.edge_color = c.edgeColor || '#888888';
          }
          const texObj = cache.get(diceKey);
          const userMaterial = c.material && c.material !== 'none' ? c.material : null;
          if (texObj && texObj.texture) {
            factory.dice_texture = {
              name: texObj.name,
              texture: texObj.texture,
              bump: texObj.bump,
              composite: texObj.composite,
              material: userMaterial || texObj.material || 'none',
            };
          } else {
            factory.dice_texture = { name: 'none', texture: null, bump: null, composite: 'source-over', material: userMaterial || 'none' };
          }
          factory.dice_material = userMaterial || 'none';
          factory.setMaterialInfo();
        },
        onRollComplete: () => {},
      });
      await diceBox.initialize();
      if (!cancelled) box.current = diceBox;
    })();
    return () => { cancelled = true; if (box.current) { box.current.clearDice(); box.current = null; } };
  }, []);

  useImperativeHandle(ref, () => ({
    roll: async (type: DieType, count = 1) => {
      const b = box.current;
      if (!b) return [];
      for (let attempt = 0; attempt < 20; attempt++) {
        if (b.initialized) break;
        await new Promise(r => setTimeout(r, 100));
      }
      if (!b.initialized) return [];
      try {
        const results = await b.roll(`${count}${type}`);
        const values: number[] = [];
        for (const set of results.sets || []) {
          for (const roll of set.rolls || []) {
            values.push(roll.value);
          }
        }
        return values;
      } catch { return []; }
    },
    rollBatch: async (combo: DiceComboEntry[]) => {
      const b = box.current;
      if (!b) return [];
      for (let attempt = 0; attempt < 20; attempt++) {
        if (b.initialized) break;
        await new Promise(r => setTimeout(r, 100));
      }
      if (!b.initialized) return [];
      const notation = combo.map(e => `${e.count}${e.dieType}`).join('+');
      try {
        const results = await b.roll(notation);
        const values: number[] = [];
        for (const set of results.sets || []) {
          for (const roll of set.rolls || []) {
            values.push(roll.value);
          }
        }
        return values;
      } catch { return []; }
    },
    configure: async (config: Record<string, PerDieConfig>) => {
      configRef.current = config;
      texCache.current.clear();
      const loads: Promise<void>[] = [];
      for (const [dieType, perDieCfg] of Object.entries(config)) {
        if (perDieCfg?.texture && perDieCfg.texture !== 'none') {
          loads.push(
            loadTexture(perDieCfg.texture).then(texObj => {
              texCache.current.set(dieType, texObj);
            })
          );
        }
      }
      await Promise.all(loads);
    },
    generateVectors: (notation: string) => {
      return box.current?.generateVectors(notation) || null;
    },
    rollWithVectors: async (nv: any) => {
      const b = box.current;
      if (!b) return [];
      for (let attempt = 0; attempt < 20; attempt++) {
        if (b.initialized) break;
        await new Promise(r => setTimeout(r, 100));
      }
      if (!b.initialized) return [];
      try {
        const results = await b.rollWithVectors(nv);
        const values: number[] = [];
        for (const set of results.sets || []) {
          for (const roll of set.rolls || []) {
            values.push(roll.value);
          }
        }
        return values;
      } catch { return []; }
    },
    clear: () => {
      box.current?.clearDice();
    },
  }), []);

  return <div id="dice-overlay" ref={cr} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 999 }} />;
});
