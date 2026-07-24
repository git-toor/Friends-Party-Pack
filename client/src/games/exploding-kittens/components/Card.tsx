import { useState, useEffect, useRef } from 'react';

export interface CardData {
  id: string;
  type: string;
  name: string;
  marked?: boolean;
}

const FRAME_COLORS: Record<string, { bg: string; border: string; text: string; subtitle: string }> = {
  exploding_kitten: { bg: '#ff3333', border: '#cc0000', text: '#ffffff', subtitle: '#ffcccc' },
  imploding_kitten: { bg: '#880033', border: '#550011', text: '#ffffff', subtitle: '#cc8899' },
  defuse: { bg: '#33aa33', border: '#227722', text: '#ffffff', subtitle: '#aaddaa' },
  zombie_kitten: { bg: '#44aa44', border: '#228822', text: '#ffffff', subtitle: '#aaddaa' },
  attack: { bg: '#ff8800', border: '#cc6600', text: '#ffffff', subtitle: '#ffcc88' },
  targeted_attack: { bg: '#ff6600', border: '#cc4400', text: '#ffffff', subtitle: '#ffaa66' },
  personal_attack: { bg: '#ff4400', border: '#cc2200', text: '#ffffff', subtitle: '#ff8866' },
  skip: { bg: '#4488dd', border: '#2266bb', text: '#ffffff', subtitle: '#99bbee' },
  super_skip: { bg: '#3366cc', border: '#1144aa', text: '#ffffff', subtitle: '#88aaee' },
  favor: { bg: '#ff33aa', border: '#cc1177', text: '#ffffff', subtitle: '#ff99cc' },
  shuffle: { bg: '#22aaaa', border: '#117777', text: '#ffffff', subtitle: '#88cccc' },
  shuffle_now: { bg: '#22aa88', border: '#117755', text: '#ffffff', subtitle: '#88ccaa' },
  see_future_3x: { bg: '#aa44ff', border: '#8822cc', text: '#ffffff', subtitle: '#cc88ff' },
  see_future_5x: { bg: '#8822dd', border: '#6600aa', text: '#ffffff', subtitle: '#bb88ee' },
  alter_future_3x: { bg: '#9933ee', border: '#7711cc', text: '#ffffff', subtitle: '#bb88ee' },
  alter_future_5x: { bg: '#7722bb', border: '#550099', text: '#ffffff', subtitle: '#aa88cc' },
  nope: { bg: '#dd3333', border: '#bb1111', text: '#ffffff', subtitle: '#ee9999' },
  reverse: { bg: '#44bbcc', border: '#2299aa', text: '#ffffff', subtitle: '#99dddd' },
  draw_from_bottom: { bg: '#66ccaa', border: '#44aa88', text: '#ffffff', subtitle: '#aaddcc' },
  streaking_kitten: { bg: '#44dd44', border: '#22bb22', text: '#000000', subtitle: '#227722' },
  swap_top_bottom: { bg: '#aa88ff', border: '#8866dd', text: '#ffffff', subtitle: '#ccbbff' },
  garbage_collection: { bg: '#886644', border: '#664422', text: '#ffffff', subtitle: '#bba88c' },
  catomic_bomb: { bg: '#ff8800', border: '#cc6600', text: '#ffffff', subtitle: '#ffcc66' },
  mark: { bg: '#dd4488', border: '#bb2266', text: '#ffffff', subtitle: '#ee99bb' },
  curse_cat_butt: { bg: '#884466', border: '#662244', text: '#ffffff', subtitle: '#bb8899' },
  barking_kitten: { bg: '#ff8800', border: '#cc6600', text: '#ffffff', subtitle: '#ffcc88' },
  tower_of_power: { bg: '#ffcc00', border: '#ccaa00', text: '#000000', subtitle: '#665500' },
  potluck: { bg: '#ff6666', border: '#cc4444', text: '#ffffff', subtitle: '#ffaaaa' },
  bury: { bg: '#886644', border: '#664422', text: '#ffffff', subtitle: '#bbaa99' },
  share_future_3x: { bg: '#9944ff', border: '#7722dd', text: '#ffffff', subtitle: '#cc99ff' },
  clone: { bg: '#cccccc', border: '#aaaaaa', text: '#000000', subtitle: '#555555' },
  clairvoyance: { bg: '#4488ff', border: '#2266dd', text: '#ffffff', subtitle: '#99bbff' },
  dig_deeper: { bg: '#886633', border: '#664411', text: '#ffffff', subtitle: '#bbaa88' },
  feed_the_dead: { bg: '#336644', border: '#114422', text: '#ffffff', subtitle: '#88aa88' },
  grave_robber: { bg: '#444444', border: '#222222', text: '#ffffff', subtitle: '#888888' },
  attack_of_the_dead: { bg: '#333333', border: '#111111', text: '#ffffff', subtitle: '#777777' },
  tacocat: { bg: '#ffcc00', border: '#ddaa00', text: '#000000', subtitle: '#887700' },
  cattermelon: { bg: '#ff8800', border: '#dd6600', text: '#000000', subtitle: '#884400' },
  hairy_potato_cat: { bg: '#886622', border: '#664400', text: '#ffffff', subtitle: '#bbaa88' },
  beard_cat: { bg: '#664422', border: '#442200', text: '#ffffff', subtitle: '#998866' },
  feral_cat: { bg: '#ccaa88', border: '#aa8866', text: '#000000', subtitle: '#776655' },
  rainbow_ralphing_cat: { bg: '#ff66aa', border: '#dd4488', text: '#ffffff', subtitle: '#ffbbdd' },
};

const CARD_ICONS: Record<string, string> = {
  exploding_kitten: '💥', imploding_kitten: '🌀', defuse: '🛡️', zombie_kitten: '🧟',
  attack: '⚔️', targeted_attack: '🎯', personal_attack: '🔥', skip: '⏭️',
  super_skip: '⏩', favor: '🤝', shuffle: '🔀', shuffle_now: '⚡🔀',
  see_future_3x: '🔮', see_future_5x: '🔮🔮', alter_future_3x: '🔄', alter_future_5x: '🔄🔄',
  nope: '🚫', reverse: '🔁', draw_from_bottom: '⬇️', streaking_kitten: '🏃',
  swap_top_bottom: '↕️', garbage_collection: '🗑️', catomic_bomb: '☢️',
  mark: '📍', curse_cat_butt: '😾', barking_kitten: '🐕',
  tower_of_power: '👑', potluck: '🥘', bury: '🪦', share_future_3x: '👀',
  clone: '📋', clairvoyance: '👁️', dig_deeper: '⛏️', feed_the_dead: '🍖',
  grave_robber: '💀', attack_of_the_dead: '💀⚔️',
  tacocat: '🌮', cattermelon: '🍉', hairy_potato_cat: '🥔', beard_cat: '🧔',
  feral_cat: '🐈',
  rainbow_ralphing_cat: '🌈🤮',
};

const CARD_SUBTITLES: Record<string, string> = {
  exploding_kitten: 'You lose. Unless you have a Defuse.',
  imploding_kitten: 'Cannot be defused. Drawn face-up = death.',
  defuse: 'Play when you draw an Exploding Kitten.',
  zombie_kitten: 'Defuse + revive a dead player.',
  attack: 'Next player takes 2 turns.',
  targeted_attack: 'Target a player for 2 turns.',
  personal_attack: 'Take 3 turns yourself.',
  skip: 'End your turn without drawing.',
  super_skip: 'Skip ALL your remaining turns.',
  favor: 'Take 1 card from another player.',
  shuffle: 'Shuffle the draw pile.',
  shuffle_now: 'Shuffle at any time.',
  see_future_3x: 'Privately view top 3 cards.',
  see_future_5x: 'Privately view top 5 cards.',
  alter_future_3x: 'View + rearrange top 3 cards.',
  alter_future_5x: 'View + rearrange top 5 cards.',
  nope: 'Cancel any action.',
  reverse: 'Reverse turn order.',
  draw_from_bottom: 'Draw from the bottom.',
  streaking_kitten: 'Safely hold 1 Exploding Kitten.',
  swap_top_bottom: 'Swap top and bottom cards.',
  garbage_collection: 'Each player discards 1 card.',
  catomic_bomb: 'All EKs move to the top.',
  mark: 'Reveal a card to all players.',
  curse_cat_butt: 'Target plays cards face-down.',
  barking_kitten: 'Game of chicken with the pair.',
  tower_of_power: 'Stash cards on your head.',
  potluck: 'Each player adds 1 card to draw pile.',
  bury: 'Draw 1, reinsert anywhere.',
  share_future_3x: 'Show top 3 to the next player.',
  clone: 'Become whatever card is beneath.',
  clairvoyance: 'Watch where EKs are placed.',
  dig_deeper: 'Draw 1, keep or draw the next.',
  feed_the_dead: 'Living players give to the dead.',
  grave_robber: 'Dead shuffle cards into draw pile.',
  attack_of_the_dead: 'Dead player attacks.',
  tacocat: 'Cat combo card.',
  cattermelon: 'Cat combo card.',
  hairy_potato_cat: 'Cat combo card.',
  beard_cat: 'Cat combo card.',
  feral_cat: 'Wildcard cat.',
  rainbow_ralphing_cat: 'Cat combo card.',
};

interface CardProps {
  card: CardData;
  faceUp?: boolean;
  selected?: boolean;
  disabled?: boolean;
  size?: 'small' | 'medium' | 'large';
  onClick?: () => void;
  nsfw?: boolean;
}

// 1.5x larger dimensions
const DIMS = {
  small: { w: 75, h: 112, fs: 7, iconSize: 16, titleFs: 6, subFs: 5, artArea: 50 },
  medium: { w: 105, h: 158, fs: 9, iconSize: 22, titleFs: 8, subFs: 7, artArea: 75 },
  large: { w: 135, h: 202, fs: 11, iconSize: 28, titleFs: 10, subFs: 9, artArea: 100 },
};

export function Card({ card, faceUp = true, selected, disabled, size = 'medium', onClick, nsfw = false }: CardProps) {
  const [artUrl, setArtUrl] = useState<string | null>(null);
  const dims = DIMS[size];
  const colors = FRAME_COLORS[card.type] || FRAME_COLORS['exploding_kitten'];
  const icon = CARD_ICONS[card.type] || '🃏';
  const subtitle = CARD_SUBTITLES[card.type] || '';
  const mounted = useRef(true);

  useEffect(() => {
    return () => { mounted.current = false; };
  }, []);

  function resolveArtUrl(entry: unknown, seed?: string): string | null {
    if (!entry) return null;
    if (typeof entry === 'string') return entry;
    if (Array.isArray(entry) && entry.length > 0) {
      if (seed && entry.length > 1) {
        let hash = 0;
        for (let i = 0; i < seed.length; i++) {
          hash = ((hash << 5) - hash) + seed.charCodeAt(i);
          hash |= 0;
        }
        return entry[Math.abs(hash) % entry.length];
      }
      return entry[0];
    }
    return null;
  }

  // Fallback expansion map for direct URL construction
  const CARD_EXPANSION: Record<string, string> = {
    exploding_kitten: 'base', defuse: 'base', attack: 'base', skip: 'base',
    favor: 'base', shuffle: 'base', nope: 'base', see_future_3x: 'base',
    tacocat: 'base', cattermelon: 'base', hairy_potato_cat: 'base',
    beard_cat: 'base', rainbow_ralphing_cat: 'base',
    imploding_kitten: 'imploding', reverse: 'imploding', alter_future_3x: 'imploding',
    draw_from_bottom: 'imploding', targeted_attack: 'imploding', feral_cat: 'imploding',
    streaking_kitten: 'streaking', exploding_kitten_extra: 'streaking',
    super_skip: 'streaking', see_future_5x: 'streaking', alter_future_5x: 'streaking',
    swap_top_bottom: 'streaking', garbage_collection: 'streaking', catomic_bomb: 'streaking',
    mark: 'streaking', curse_cat_butt: 'streaking',
    barking_kitten: 'barking', tower_of_power: 'barking', personal_attack: 'barking',
    potluck: 'barking', bury: 'barking', share_future_3x: 'barking',
    ill_take_that: 'barking', super_skip_barking: 'barking', alter_future_3x_barking: 'barking',
    zombie_kitten: 'zombie', exploding_kitten_z: 'zombie', defuse_z: 'zombie',
    attack_z: 'zombie', skip_z: 'zombie', shuffle_z: 'zombie',
    see_future_3x_z: 'zombie', nope_z: 'zombie', clairvoyance: 'zombie',
    clone: 'zombie', dig_deeper: 'zombie', feed_the_dead: 'zombie',
    grave_robber: 'zombie', attack_of_the_dead: 'zombie', shuffle_now: 'zombie',
    favor_z: 'zombie',
  };

  useEffect(() => {
    if (!faceUp || !card.type) return;
    const manifest = (window as any).__CARD_MANIFEST__;
    const entry = manifest?.cards?.[card.type]?.[nsfw ? 'nsfw' : 'base'];
    const url = resolveArtUrl(entry, card.id);
    if (url) { setArtUrl(url); return; }
    // Fallback: construct URL directly
    const exp = CARD_EXPANSION[card.type] || 'base';
    const fallbackUrl = `/art/${exp}/${card.type}_001.webp`;
    setArtUrl(fallbackUrl);
    // Try to fetch manifest with cache bust for next time
    fetch(`/cards/manifest.json?t=${Date.now()}`).then(r => r.ok ? r.json() : null).then(data => {
      if (!mounted.current) return;
      if (data) {
        (window as any).__CARD_MANIFEST__ = data;
        const e = data.cards?.[card.type]?.[nsfw ? 'nsfw' : 'base'];
        const u = resolveArtUrl(e, card.id);
        if (u && u !== fallbackUrl) setArtUrl(u);
      }
    }).catch(() => {});
  }, [card.type, faceUp, nsfw]);

  if (!faceUp) {
    return (
      <div style={{
        width: dims.w, height: dims.h, borderRadius: 6,
        background: nsfw ? 'linear-gradient(135deg, #2a0a0a, #4a1a1a)' : 'linear-gradient(135deg, #1a1a3e, #2a2a5e)',
        border: nsfw ? '2px solid #661111' : '2px solid #333366',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        boxShadow: selected ? '0 8px 32px rgba(233,69,96,0.6)' : '0 2px 6px rgba(0,0,0,0.3)',
        transition: 'box-shadow 0.25s ease',
        transform: selected ? 'translateY(-24px)' : 'none',
      }}>
        <svg width={dims.w * 0.4} height={dims.h * 0.3} viewBox="0 0 40 40">
          <circle cx="20" cy="20" r="8" fill={nsfw ? '#884444' : '#444488'} />
          <polygon points="20,12 22,17 27,17 23,21 25,27 20,23 15,27 17,21 13,17 18,17" fill={nsfw ? '#aa6666' : '#6666aa'} />
        </svg>
      </div>
    );
  }

  return (
    <div onClick={onClick} title={card.name} style={{
      width: dims.w, height: dims.h, borderRadius: 6, cursor: onClick ? 'pointer' : 'default',
      display: 'flex', flexDirection: 'column',
      userSelect: 'none', flexShrink: 0, position: 'relative',
      transition: 'box-shadow 0.25s ease',
      transform: 'none',
      boxShadow: selected ? '0 8px 32px rgba(233,69,96,0.6)' : (disabled ? '0 1px 3px rgba(0,0,0,0.15)' : '0 2px 6px rgba(0,0,0,0.3)'),
      background: colors.bg,
      border: disabled ? '1px solid rgba(255,255,255,0.08)' : 'none',
    }}>
      {/* Card Title Bar */}
      <div style={{
        padding: `${dims.titleFs * 0.3}px ${dims.titleFs * 0.5}px`,
        background: 'rgba(0,0,0,0.15)', display: 'flex', alignItems: 'center', gap: 3,
        zIndex: 2,
      }}>
        <span style={{ fontSize: dims.iconSize, lineHeight: 1 }}>{icon}</span>
        <span style={{
          fontSize: dims.titleFs, fontWeight: 700, color: colors.text,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {card.name}
        </span>
      </div>

      {/* Artwork Area */}
      <div style={{
        flex: 1, position: 'relative', overflow: 'hidden',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {artUrl ? (
          <picture>
            <source srcSet={artUrl} type="image/webp" />
            <img src={artUrl} alt="" loading="lazy" style={{
              width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', top: 0, left: 0,
            }} onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }} />
          </picture>
        ) : null}
        <span style={{ fontSize: dims.iconSize * 3, opacity: 0.25 }}>{icon}</span>
        {card.marked && <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 3,
          background: '#ff0', boxShadow: '0 0 8px #ff0', zIndex: 3,
        }} />}
      </div>

      {/* Subtitle bar */}
      {subtitle && size !== 'small' && (
        <div style={{
          padding: `${dims.subFs * 0.3}px ${dims.subFs * 0.5}px`,
          background: 'rgba(0,0,0,0.12)', textAlign: 'center',
        }}>
          <span style={{
            fontSize: dims.subFs, color: colors.subtitle, lineHeight: 1.2,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {subtitle}
          </span>
        </div>
      )}
    </div>
  );
}

export { FRAME_COLORS, CARD_ICONS, CARD_SUBTITLES };
