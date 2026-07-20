// @ts-ignore
import { TEXTURELIST } from './texturelist.js';

export interface DiceTextureObject {
  name: string;
  texture: HTMLImageElement | null;
  bump: HTMLImageElement | null;
  composite: string;
  material: string;
}

const textureCache = new Map<string, DiceTextureObject>();
const loadingPromises = new Map<string, Promise<DiceTextureObject>>();

const ASSET_BASE = '/textures/';

function extractFilename(source: string): string {
  return source.replace(/^textures\//, '');
}

async function loadImage(src: string): Promise<HTMLImageElement | null> {
  if (!src) return null;
  const filename = extractFilename(src);
  const url = ASSET_BASE + filename;
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => { img.onload = null; img.onerror = null; resolve(img); };
    img.onerror = () => {
      img.onload = null; img.onerror = null;
      console.error(`[DiceTextureLoader] FAILED: ${url}`);
      resolve(null);
    };
    img.src = url;
  });
}

export async function loadTexture(name: string): Promise<DiceTextureObject> {
  if (!name || name === 'none') {
    return { name: 'none', texture: null, bump: null, composite: 'source-over', material: '' };
  }

  if (textureCache.has(name)) {
    return textureCache.get(name)!;
  }

  if (loadingPromises.has(name)) {
    return loadingPromises.get(name)!;
  }

  const promise = (async () => {
    const def = TEXTURELIST[name];
    if (!def || !def.source) {
      console.warn(`[DiceTextureLoader] No TEXTURELIST entry for "${name}"`);
      const fallback: DiceTextureObject = { name, texture: null, bump: null, composite: 'source-over', material: '' };
      textureCache.set(name, fallback);
      return fallback;
    }

    const [texImg, bumpImg] = await Promise.all([
      loadImage(def.source),
      loadImage(def.source_bump || ''),
    ]);

    const obj: DiceTextureObject = {
      name: def.name || name,
      texture: texImg,
      bump: bumpImg,
      composite: def.composite || 'source-over',
      material: def.material || 'none',
    };

    if (texImg) {
      console.log(`[DiceTextureLoader] Loaded texture "${name}" — ${obj.composite} / ${obj.material}`);
    } else {
      console.warn(`[DiceTextureLoader] Failed to load texture image for "${name}" (source: ${def.source})`);
    }

    textureCache.set(name, obj);
    return obj;
  })();

  loadingPromises.set(name, promise);
  const result = await promise;
  loadingPromises.delete(name);
  return result;
}

export function getCachedTexture(name: string): DiceTextureObject | null {
  return textureCache.get(name) || null;
}

export function clearTextureCache(): void {
  textureCache.clear();
  loadingPromises.clear();
}
