import { useState, useEffect } from 'react';

interface CardBackProps {
  nsfw?: boolean;
  size?: 'small' | 'medium' | 'large';
}

const DIMS = { small: { w: 75, h: 112 }, medium: { w: 105, h: 158 }, large: { w: 135, h: 202 } };

export function CardBack({ nsfw = false, size = 'medium' }: CardBackProps) {
  const [artUrl, setArtUrl] = useState<string | null>(null);

  useEffect(() => {
    // Try already-loaded manifest first
    if ((window as any).__CARD_MANIFEST__?.card_back) {
      const m = (window as any).__CARD_MANIFEST__;
      setArtUrl(nsfw ? (m.card_back.nsfw || m.card_back.base) : m.card_back.base);
      return;
    }
    // Fallback: fetch manifest with cache bust
    fetch(`/cards/manifest.json?t=${Date.now()}`).then(r => r.ok ? r.json() : null).then(data => {
      if (data?.card_back) {
        (window as any).__CARD_MANIFEST__ = data;
        setArtUrl(nsfw ? (data.card_back.nsfw || data.card_back.base) : data.card_back.base);
      }
    }).catch(() => {});
  }, [nsfw]);

  const baseStyle: React.CSSProperties = {
    width: DIMS[size].w, height: DIMS[size].h, borderRadius: 6,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0, overflow: 'hidden',
    boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
  };

  if (artUrl) {
    return (
      <div style={baseStyle}>
        <picture>
          <source srcSet={artUrl} type="image/webp" />
          <img src={artUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
        </picture>
      </div>
    );
  }

  return (
    <div style={{
      ...baseStyle,
      background: nsfw ? 'linear-gradient(135deg, #2a0a0a, #4a1a1a)' : 'linear-gradient(135deg, #1a1a3e, #2a2a5e)',
      border: nsfw ? '2px solid #661111' : '2px solid #333366',
    }}>
      <svg width={DIMS[size].w * 0.5} height={DIMS[size].h * 0.5} viewBox="0 0 40 40">
        <circle cx="20" cy="20" r="8" fill={nsfw ? '#884444' : '#444488'} />
        <polygon points="20,12 22,17 27,17 23,21 25,27 20,23 15,27 17,21 13,17 18,17" fill={nsfw ? '#aa6666' : '#6666aa'} />
      </svg>
    </div>
  );
}
