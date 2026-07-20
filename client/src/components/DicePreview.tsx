import { useRef, useEffect, useMemo } from 'react';
import * as THREE from 'three';
// @ts-ignore
import { DiceFactory } from '../dice/DiceFactory.js';
// @ts-ignore
import { COLORSETS } from '../dice/colorsets.js';
import { loadTexture } from '../dice/DiceTextureLoader.js';
import type { DieType, PerDieConfig } from './DiceOverlay.js';

interface Props {
  dieType: DieType;
  config: PerDieConfig;
  size?: number;
}

const DIE_COLORS: Record<string, string> = {
  d4: '#cc3333', d6: '#3366cc', d8: '#33aa44',
  d10: '#cc8800', d12: '#8833cc', d20: '#33aacc',
};

function isArray(v: any) { return Array.isArray(v); }
function pick<T>(v: T | T[]): T { return (isArray(v) ? (v as T[])[Math.floor(Math.random() * (v as T[]).length)] : v) as T; }

function darken(hex: string, amt: number): string {
  const c = new THREE.Color(hex);
  const hsl = { h: 0, s: 0, l: 0 } as THREE.HSL;
  c.getHSL(hsl);
  c.setHSL(hsl.h, Math.min(hsl.s, 0.6), Math.max(0, Math.min(1, (hsl.l || 0.5) - amt)));
  return '#' + c.getHexString();
}

function getLuminance(hex: string): number {
  const c = new THREE.Color(hex);
  return c.r * 0.299 + c.g * 0.587 + c.b * 0.114;
}

function contrastTextColor(bgHex: string, fgHex: string): string {
  const fgLum = getLuminance(fgHex);
  const bgLum = getLuminance(bgHex);
  if (Math.abs(fgLum - bgLum) > 0.3) return fgHex;
  return bgLum < 0.5 ? '#ffffff' : '#000000';
}

function resolveConfig(type: DieType, cfg: PerDieConfig) {
  if (cfg.colorset && COLORSETS[cfg.colorset]) {
    const cs = COLORSETS[cfg.colorset] as any;
    const bg = cfg.faceColor || cs.background;
    const face = pick(bg || DIE_COLORS[type]) as string;
    const rawText = (cfg.textColor || cs.foreground || '#ffffff') as string;
    const text = contrastTextColor(face, rawText);
    const edge = (cfg.edgeColor || cs.edge || darken(face, 0.15)) as string;
    const outline = (cfg.outline || cs.outline || 'none') as string;
    const material = (cfg.material || (cs.texture === 'none' ? 'none' : (cs.texture?.material || 'none'))) as string;
    return { face, text, edge, outline, material };
  }
  const face = (cfg.faceColor || DIE_COLORS[type]) as string;
  const rawText = (cfg.textColor || '#ffffff') as string;
  const text = contrastTextColor(face, rawText);
  const edge = (cfg.edgeColor || darken(face, 0.15)) as string;
  const outline = (cfg.outline || 'none') as string;
  const material = (cfg.material || 'none') as string;
  return { face, text, edge, outline, material };
}

export function DicePreview({ dieType, config, size = 100 }: Props) {
  const canvasRef = useRef<HTMLDivElement>(null);

  const resolved = useMemo(
    () => resolveConfig(dieType, config),
    [dieType, config.colorset, config.faceColor, config.textColor, config.edgeColor, config.outline, config.material, config.texture]
  );

  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    let cancelled = false;

    async function init() {
      const c = resolved;
      const factory = new DiceFactory({ baseScale: 40, bumpMapping: false });
      factory.dice_color = c.face;
      factory.edge_color = c.edge;
      factory.label_color = c.text;
      factory.label_outline = c.outline;
      factory.dice_material = c.material;

      if (config.texture && config.texture !== 'none') {
        const texObj = await loadTexture(config.texture);
        if (texObj && texObj.texture && !cancelled) {
          factory.dice_texture = {
            name: texObj.name,
            texture: texObj.texture,
            bump: texObj.bump,
            composite: texObj.composite,
            material: texObj.material,
          };
        }
      }

      if (cancelled) return;
      if (!factory.dice_texture || !(factory.dice_texture as any).texture) {
        factory.dice_texture = { name: 'none', texture: null, bump: null, composite: 'source-over', material: 'none' };
      }

      const mesh = factory.create(dieType)!;
      mesh.position.set(0, 0, 0);

      if (cancelled) return;

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(30, 1, 1, 500);
      camera.position.set(0, 0, 140);
      camera.lookAt(0, 0, 0);

      const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setClearColor(0, 0);
      renderer.setSize(size, size);
      const currentEl = canvasRef.current;
      if (!currentEl) return;
      currentEl.innerHTML = '';
      currentEl.appendChild(renderer.domElement);

      const ambient = new THREE.AmbientLight(0xffffff, 0.7);
      scene.add(ambient);
      const light = new THREE.DirectionalLight(0xffffff, 0.8);
      light.position.set(50, 50, 100);
      scene.add(light);
      scene.add(mesh);

      let angle = 0;
      const afid = requestAnimationFrame(function loop() {
        if (cancelled) return;
        angle += 0.01;
        mesh.rotation.x = Math.sin(angle) * 0.3;
        mesh.rotation.y = angle;
        renderer.render(scene, camera);
        requestAnimationFrame(loop);
      });

      (mesh as any)._cleanup = () => {
        cancelAnimationFrame(afid);
        renderer.dispose();
        if (renderer.domElement.parentElement) {
          renderer.domElement.parentElement.removeChild(renderer.domElement);
        }
        mesh.geometry.dispose();
        if (Array.isArray(mesh.material)) {
          (mesh.material as THREE.MeshStandardMaterial[]).forEach(m => { m.map?.dispose(); m.dispose(); });
        } else {
          (mesh.material as THREE.MeshStandardMaterial).dispose();
        }
      };
    }

    init();

    return () => {
      cancelled = true;
    };
  }, [dieType, config, size]);

  return <div ref={canvasRef} style={{ width: size, height: size, borderRadius: 8, overflow: 'hidden' }} />;
}
