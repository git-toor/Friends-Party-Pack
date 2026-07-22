import { useState, useEffect } from 'react';

interface CardManifest {
  version: string;
  cards: Record<string, { base?: string; nsfw?: string }>;
  card_back: { base?: string; nsfw?: string };
}

export function useCardArt(nsfw = false) {
  const [manifest, setManifest] = useState<CardManifest | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/cards/manifest.json');
        if (res.ok) {
          const data = await res.json();
          setManifest(data);
          (window as any).__CARD_MANIFEST__ = data;
        }
      } catch {
        // No manifest available, use procedural fallback
      }
      setLoading(false);
    })();
  }, []);

  const getCardArt = (cardType: string): string | undefined => {
    if (!manifest?.cards) return undefined;
    const card = manifest.cards[cardType];
    if (!card) return undefined;
    return nsfw ? (card.nsfw || card.base) : card.base;
  };

  const getCardBack = (): string | undefined => {
    if (!manifest?.card_back) return undefined;
    return nsfw ? (manifest.card_back.nsfw || manifest.card_back.base) : manifest.card_back.base;
  };

  return { manifest, loading, getCardArt, getCardBack };
}
