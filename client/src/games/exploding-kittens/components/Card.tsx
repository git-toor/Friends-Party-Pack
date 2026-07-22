export interface CardData {
  id: string;
  type: string;
  name: string;
  marked?: boolean;
}

const CARD_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  exploding_kitten: { bg: '#ff3333', border: '#cc0000', text: '#ffffff' },
  imploding_kitten: { bg: '#880033', border: '#550011', text: '#ffffff' },
  defuse: { bg: '#33aa33', border: '#227722', text: '#ffffff' },
  zombie_kitten: { bg: '#44aa44', border: '#228822', text: '#ffffff' },
  attack: { bg: '#ff8800', border: '#cc6600', text: '#ffffff' },
  targeted_attack: { bg: '#ff6600', border: '#cc4400', text: '#ffffff' },
  personal_attack: { bg: '#ff4400', border: '#cc2200', text: '#ffffff' },
  skip: { bg: '#6688ff', border: '#4466cc', text: '#ffffff' },
  super_skip: { bg: '#4466dd', border: '#2244aa', text: '#ffffff' },
  favor: { bg: '#ff33aa', border: '#cc1177', text: '#ffffff' },
  shuffle: { bg: '#22aaaa', border: '#117777', text: '#ffffff' },
  shuffle_now: { bg: '#22aa88', border: '#117755', text: '#ffffff' },
  see_future_3x: { bg: '#aa44ff', border: '#8822cc', text: '#ffffff' },
  see_future_5x: { bg: '#8822dd', border: '#6600aa', text: '#ffffff' },
  alter_future_3x: { bg: '#9933ee', border: '#7711cc', text: '#ffffff' },
  alter_future_5x: { bg: '#7722bb', border: '#550099', text: '#ffffff' },
  nope: { bg: '#ff4444', border: '#cc2222', text: '#ffffff' },
  reverse: { bg: '#44bbcc', border: '#2299aa', text: '#ffffff' },
  draw_from_bottom: { bg: '#66ccaa', border: '#44aa88', text: '#ffffff' },
  streaking_kitten: { bg: '#44ff44', border: '#22cc22', text: '#000000' },
  swap_top_bottom: { bg: '#aa88ff', border: '#8866dd', text: '#ffffff' },
  garbage_collection: { bg: '#886644', border: '#664422', text: '#ffffff' },
  catomic_bomb: { bg: '#ff8800', border: '#cc6600', text: '#ffffff' },
  mark: { bg: '#dd4488', border: '#bb2266', text: '#ffffff' },
  curse_cat_butt: { bg: '#884466', border: '#662244', text: '#ffffff' },
  barking_kitten: { bg: '#ff8800', border: '#cc6600', text: '#ffffff' },
  tower_of_power: { bg: '#ffcc00', border: '#ccaa00', text: '#000000' },
  potluck: { bg: '#ff6666', border: '#cc4444', text: '#ffffff' },
  bury: { bg: '#886644', border: '#664422', text: '#ffffff' },
  share_future_3x: { bg: '#9944ff', border: '#7722dd', text: '#ffffff' },
  clone: { bg: '#cccccc', border: '#aaaaaa', text: '#000000' },
  clairvoyance: { bg: '#4488ff', border: '#2266dd', text: '#ffffff' },
  dig_deeper: { bg: '#886633', border: '#664411', text: '#ffffff' },
  feed_the_dead: { bg: '#336644', border: '#114422', text: '#ffffff' },
  grave_robber: { bg: '#444444', border: '#222222', text: '#ffffff' },
  attack_of_the_dead: { bg: '#333333', border: '#111111', text: '#ffffff' },
  tacocat: { bg: '#ffcc00', border: '#ddaa00', text: '#000000' },
  cattermelon: { bg: '#ff8800', border: '#dd6600', text: '#000000' },
  hairy_potato_cat: { bg: '#886622', border: '#664400', text: '#ffffff' },
  beard_cat: { bg: '#664422', border: '#442200', text: '#ffffff' },
  feral_cat: { bg: '#ccaa88', border: '#aa8866', text: '#000000' },
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

interface CardProps {
  card: CardData;
  faceUp?: boolean;
  selected?: boolean;
  disabled?: boolean;
  size?: 'small' | 'medium' | 'large';
  onClick?: () => void;
}

export function Card({ card, faceUp = true, selected, disabled, size = 'medium', onClick }: CardProps) {
  const colors = CARD_COLORS[card.type] || { bg: '#888888', border: '#666666', text: '#ffffff' };
  const icon = CARD_ICONS[card.type] || '🃏';

  const dims = size === 'small' ? { w: 50, h: 75, fs: 7, iconSize: 14 }
    : size === 'large' ? { w: 90, h: 135, fs: 10, iconSize: 24 }
    : { w: 70, h: 105, fs: 8, iconSize: 18 };

  const baseStyle: React.CSSProperties = {
    width: dims.w, height: dims.h, borderRadius: 6, cursor: onClick ? 'pointer' : 'default',
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    userSelect: 'none', flexShrink: 0, position: 'relative', transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    transform: selected ? 'translateY(-18px) scale(1.08)' : 'none',
    boxShadow: selected ? '0 4px 20px rgba(233,69,96,0.5)' : (disabled ? 'none' : '0 2px 6px rgba(0,0,0,0.3)'),
    opacity: disabled ? 0.45 : 1,
  };

  if (!faceUp) {
    return (
      <div style={{ ...baseStyle, background: '#1a1a3e', border: '2px solid #333366' }}>
        <div style={{ color: '#444488', fontSize: dims.iconSize }}>🎴</div>
      </div>
    );
  }

  return (
    <div onClick={onClick} title={card.name} style={{
      ...baseStyle, background: colors.bg, border: `2px solid ${selected ? '#e94560' : colors.border}`,
    }}>
      {card.marked && <div style={{ position: 'absolute', top: -2, left: -2, right: -2, height: 4, background: '#ff0', borderRadius: '2px 2px 0 0', boxShadow: '0 0 8px #ff0' }} />}
      <div style={{ fontSize: dims.iconSize, lineHeight: 1 }}>{icon}</div>
      <div style={{ fontSize: dims.fs, color: colors.text, fontWeight: 600, textAlign: 'center', padding: '0 2px', lineHeight: 1.2, marginTop: 2 }}>
        {card.name.length > 14 ? card.name.slice(0, 13) + '…' : card.name}
      </div>
    </div>
  );
}

export { CARD_COLORS, CARD_ICONS };
