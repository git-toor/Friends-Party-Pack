import { useState, useEffect } from 'react';

interface CardBackProps {
  nsfw?: boolean;
  size?: 'small' | 'medium' | 'large';
}

const DIMS = { small: { w: 50, h: 75 }, medium: { w: 70, h: 105 }, large: { w: 90, h: 135 } };

export function CardBack({ nsfw = false, size = 'medium' }: CardBackProps) {
  const dims = DIMS[size];
  const [artUrl, setArtUrl] = useState<string | null>(null);

  useEffect(() => {
    const manifest = (window as any).__CARD_MANIFEST__;
    if (manifest?.card_back) {
      setArtUrl(nsfw ? manifest.card_back.nsfw : manifest.card_back.base);
    }
  }, [nsfw]);

  const baseStyle: React.CSSProperties = {
    width: dims.w, height: dims.h, borderRadius: 6,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0, overflow: 'hidden',
    boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
  };

  if (artUrl) {
    return (
      <div style={baseStyle}>
        <img src={artUrl} alt="Card Back" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </div>
    );
  }

  // Fallback procedural SVG back
  return (
    <div style={{
      ...baseStyle,
      background: nsfw
        ? 'linear-gradient(135deg, #2a0a0a, #4a1a1a)'
        : 'linear-gradient(135deg, #1a1a3e, #2a2a5e)',
      border: nsfw ? '2px solid #661111' : '2px solid #333366',
    }}>
      <svg width={dims.w * 0.5} height={dims.h * 0.5} viewBox="0 0 40 40">
        {nsfw ? (
          <>
            <circle cx="20" cy="14" r="6" fill="#ff4444" />
            <path d="M12 28 Q20 36 28 28" fill="none" stroke="#ff4444" strokeWidth="2" />
            <text x="20" y="38" textAnchor="middle" fontSize="6" fill="#ff6666">NSFW</text>
          </>
        ) : (
          <>
            <circle cx="20" cy="20" r="8" fill="#444488" />
            <polygon points="20,10 23,17 30,17 24,22 26,30 20,25 14,30 16,22 10,17 17,17" fill="#6666aa" />
          </>
        )}
      </svg>
    </div>
  );
}
