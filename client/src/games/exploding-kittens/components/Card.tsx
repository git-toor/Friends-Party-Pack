import { useCardArt } from '../hooks/useCardArt.js';

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
  tacocat: 'Two of a Kind: steal random.',
  cattermelon: 'Two of a Kind: steal random.',
  hairy_potato_cat: 'Two of a Kind: steal random.',
  beard_cat: 'Two of a Kind: steal random.',
  feral_cat: 'Wildcard cat.',
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

export function Card({ card, faceUp = true, selected, disabled, size = 'medium', onClick, nsfw = false }: CardProps) {
  const { getCardArt } = useCardArt(nsfw);
  const artUrl = faceUp ? getCardArt(card.type) : undefined;
  const colors = FRAME_COLORS[card.type] || FRAME_COLORS['exploding_kitten'];
  const icon = CARD_ICONS[card.type] || '🃏';
  const subtitle = CARD_SUBTITLES[card.type] || '';

  const dims = size === 'small' ? { w: 50, h: 75, fs: 7, iconSize: 14, titleFs: 6, subFs: 5, artArea: 35 }
    : size === 'large' ? { w: 90, h: 135, fs: 10, iconSize: 24, titleFs: 9, subFs: 8, artArea: 65 }
    : { w: 70, h: 105, fs: 8, iconSize: 18, titleFs: 7, subFs: 6, artArea: 50 };

  if (!faceUp) {
    return (
      <div style={{
        width: dims.w, height: dims.h, borderRadius: 6,
        background: nsfw ? 'linear-gradient(135deg, #2a0a0a, #4a1a1a)' : 'linear-gradient(135deg, #1a1a3e, #2a2a5e)',
        border: nsfw ? '2px solid #661111' : '2px solid #333366',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
      }}>
        <svg width={dims.w * 0.4} height={dims.h * 0.3} viewBox="0 0 40 40">
          <circle cx="20" cy="20" r="8" fill={nsfw ? '#884444' : '#444488'} />
          <polygon points="20,12 22,17 27,17 23,21 25,27 20,23 15,27 17,21 13,17 18,17" fill={nsfw ? '#aa6666' : '#6666aa'} />
        </svg>
      </div>
    );
  }

  // Full card frame with AI artwork composited in the center
  return (
    <div onClick={onClick} title={card.name} style={{
      width: dims.w, height: dims.h, borderRadius: 6, cursor: onClick ? 'pointer' : 'default',
      display: 'flex', flexDirection: 'column',
      userSelect: 'none', flexShrink: 0, position: 'relative', overflow: 'hidden',
      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
      transform: selected ? 'translateY(-18px) scale(1.08)' : 'none',
      boxShadow: selected ? '0 4px 20px rgba(233,69,96,0.5)' : (disabled ? 'none' : '0 2px 6px rgba(0,0,0,0.3)'),
      opacity: disabled ? 0.45 : 1,
      background: colors.bg,
      border: `2px solid ${selected ? '#e94560' : colors.border}`,
    }}>
      {/* Card Title Bar */}
      <div style={{
        padding: `${dims.titleFs * 0.3}px ${dims.titleFs * 0.5}px`,
        background: 'rgba(0,0,0,0.15)', display: 'flex', alignItems: 'center', gap: 3,
      }}>
        <span style={{ fontSize: dims.iconSize, lineHeight: 1 }}>{icon}</span>
        <span style={{
          fontSize: dims.titleFs, fontWeight: 700, color: colors.text,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {card.name.length > 12 ? card.name.slice(0, 11) + '…' : card.name}
        </span>
      </div>

      {/* Artwork Area — AI art composited here */}
      <div style={{
        flex: 1, position: 'relative', overflow: 'hidden',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {artUrl ? (
          <img src={artUrl} alt={card.name} loading="lazy" style={{
            width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', top: 0, left: 0,
          }} onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
            // Show fallback icon
            const parent = (e.target as HTMLImageElement).parentElement;
            if (parent) {
              const fallback = document.createElement('span');
              fallback.textContent = icon;
              fallback.style.cssText = `font-size:${dims.iconSize * 2}px;opacity:0.3;`;
              parent.appendChild(fallback);
            }
          }} />
        ) : (
          <span style={{ fontSize: dims.iconSize * 2, opacity: 0.3 }}>{icon}</span>
        )}
        {card.marked && <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 3,
          background: '#ff0', boxShadow: '0 0 8px #ff0',
        }} />}
      </div>

      {/* Subtitle / Description Bar */}
      {subtitle && size !== 'small' && (
        <div style={{
          padding: `${dims.subFs * 0.3}px ${dims.subFs * 0.5}px`,
          background: 'rgba(0,0,0,0.12)', textAlign: 'center',
        }}>
          <span style={{
            fontSize: dims.subFs, color: colors.subtitle, lineHeight: 1.2,
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}>
            {subtitle}
          </span>
        </div>
      )}
    </div>
  );
}

export { FRAME_COLORS, CARD_ICONS, CARD_SUBTITLES };
