import type { YahtzeeCategory } from './types.js';

interface ScoreCardProps {
  scores: Partial<Record<YahtzeeCategory, number>>;
  dice: number[];
  canScore: boolean;
  onScore?: (category: YahtzeeCategory) => void;
  totalScore: number;
  playerName: string;
  isCurrentPlayer: boolean;
}

const CATEGORIES: { key: YahtzeeCategory; label: string; section: 'upper' | 'lower' }[] = [
  { key: 'ones', label: 'Ones', section: 'upper' },
  { key: 'twos', label: 'Twos', section: 'upper' },
  { key: 'threes', label: 'Threes', section: 'upper' },
  { key: 'fours', label: 'Fours', section: 'upper' },
  { key: 'fives', label: 'Fives', section: 'upper' },
  { key: 'sixes', label: 'Sixes', section: 'upper' },
  { key: 'three_of_a_kind', label: '3 of a Kind', section: 'lower' },
  { key: 'four_of_a_kind', label: '4 of a Kind', section: 'lower' },
  { key: 'full_house', label: 'Full House', section: 'lower' },
  { key: 'small_straight', label: 'Sm. Straight', section: 'lower' },
  { key: 'large_straight', label: 'Lg. Straight', section: 'lower' },
  { key: 'yahtzee', label: 'Yahtzee', section: 'lower' },
  { key: 'chance', label: 'Chance', section: 'lower' },
];

function calculateScore(dice: number[], category: YahtzeeCategory): number {
  const counts = [0, 0, 0, 0, 0, 0, 0];
  for (const d of dice) counts[d]++;
  const sum = dice.reduce((a, b) => a + b, 0);
  const sorted = [...dice].sort((a, b) => a - b);

  switch (category) {
    case 'ones': return counts[1] * 1;
    case 'twos': return counts[2] * 2;
    case 'threes': return counts[3] * 3;
    case 'fours': return counts[4] * 4;
    case 'fives': return counts[5] * 5;
    case 'sixes': return counts[6] * 6;
    case 'three_of_a_kind': return counts.some(c => c >= 3) ? sum : 0;
    case 'four_of_a_kind': return counts.some(c => c >= 4) ? sum : 0;
    case 'full_house': return (counts.includes(3) && counts.includes(2)) ? 25 : 0;
    case 'small_straight': {
      for (let i = 1; i <= 3; i++) { if (sorted.includes(i) && sorted.includes(i + 1) && sorted.includes(i + 2) && sorted.includes(i + 3)) return 30; }
      return 0;
    }
    case 'large_straight': return (sorted.every((v, i) => v === i + 1) || sorted.every((v, i) => v === i + 2)) ? 40 : 0;
    case 'yahtzee': return counts.some(c => c >= 5) ? 50 : 0;
    case 'chance': return sum;
    default: return 0;
  }
}

const rowStyle: React.CSSProperties = {
  display: 'flex', justifyContent: 'space-between',
  padding: '6px 12px', borderRadius: 4, marginBottom: 2, cursor: 'pointer',
  fontSize: 14,
};

export function ScoreCard({ scores, dice, canScore, onScore, totalScore, playerName, isCurrentPlayer }: ScoreCardProps) {
  const upperSum = (scores.ones || 0) + (scores.twos || 0) + (scores.threes || 0) + (scores.fours || 0) + (scores.fives || 0) + (scores.sixes || 0);
  const bonusEarned = upperSum >= 63;

  return (
    <div style={{ background: '#16213e', borderRadius: 8, padding: 8, width: '100%', maxWidth: 400 }}>
      <div style={{ textAlign: 'center', fontSize: 12, color: '#999', marginBottom: 4 }}>
        {playerName}{isCurrentPlayer ? ' ← Your turn' : ''}
      </div>

      {CATEGORIES.map(cat => {
        const scored = scores[cat.key];
        const preview = (canScore && scored === undefined && dice.some(d => d > 0)) ? calculateScore(dice, cat.key) : null;
        const isUsed = scored !== undefined;

        return (
          <div
            key={cat.key}
            style={{
              ...rowStyle,
              background: isUsed ? '#0a1628' : (preview !== null && canScore ? '#1a3a5c' : 'transparent'),
              opacity: isUsed ? 0.5 : 1,
              cursor: (canScore && !isUsed) ? 'pointer' : 'default',
            }}
            onClick={() => { if (canScore && !isUsed && onScore) onScore(cat.key); }}
          >
            <span>{cat.label}</span>
            <span style={{ fontWeight: 600 }}>
              {isUsed ? scored : (preview !== null ? preview : '-')}
            </span>
          </div>
        );
      })}

      <div style={{ borderTop: '1px solid #333', marginTop: 4, paddingTop: 4 }}>
        <div style={rowStyle}><span>Upper Sum</span><span>{upperSum}</span></div>
        <div style={rowStyle}><span>Bonus (63+)</span><span>{bonusEarned ? 35 : 0}</span></div>
        <div style={{ ...rowStyle, fontWeight: 700, fontSize: 16 }}>
          <span>Total</span><span>{totalScore}</span>
        </div>
      </div>
    </div>
  );
}
