import type { YahtzeeCategory } from './types.js';

const CATEGORIES: { key: YahtzeeCategory; label: string; }[] = [
  { key: 'ones', label: 'Ones' },
  { key: 'twos', label: 'Twos' },
  { key: 'threes', label: 'Threes' },
  { key: 'fours', label: 'Fours' },
  { key: 'fives', label: 'Fives' },
  { key: 'sixes', label: 'Sixes' },
  { key: 'three_of_a_kind', label: '3K' },
  { key: 'four_of_a_kind', label: '4K' },
  { key: 'full_house', label: 'FH' },
  { key: 'small_straight', label: 'SS' },
  { key: 'large_straight', label: 'LS' },
  { key: 'yahtzee', label: 'Y' },
  { key: 'chance', label: 'Chance' },
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
    case 'small_straight': { for (let i = 1; i <= 3; i++) { if (sorted.includes(i) && sorted.includes(i + 1) && sorted.includes(i + 2) && sorted.includes(i + 3)) return 30; } return 0; }
    case 'large_straight': return (sorted.every((v, i) => v === i + 1) || sorted.every((v, i) => v === i + 2)) ? 40 : 0;
    case 'yahtzee': return counts.some(c => c >= 5) ? 50 : 0;
    case 'chance': return sum;
    default: return 0;
  }
}

interface PlayerScoreCol {
  name: string;
  scores: Partial<Record<YahtzeeCategory, number>>;
  totalScore: number;
  isCurrent: boolean;
}

interface ScoreCardProps {
  players: PlayerScoreCol[];
  currentPlayerIndex: number;
  dice: number[];
  canScore: boolean;
  onScore?: (category: YahtzeeCategory) => void;
}

export function ScoreCard({ players, currentPlayerIndex, dice, canScore, onScore }: ScoreCardProps) {
  const cellStyle: React.CSSProperties = {
    padding: '2px 4px', fontSize: 11, textAlign: 'center', minWidth: 32,
    borderBottom: '1px solid rgba(255,255,255,0.06)',
  };

  const getColStyle = (pi: number): React.CSSProperties => ({
    ...cellStyle,
    background: pi === currentPlayerIndex ? 'rgba(233,69,96,0.12)' : 'transparent',
    fontWeight: pi === currentPlayerIndex ? 600 : 400,
  });

  return (
    <div style={{ background: '#16213e', borderRadius: 6, padding: 4, overflowX: 'auto', width: '100%' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
        <thead>
          <tr>
            <th style={{ ...cellStyle, textAlign: 'left', color: '#888', position: 'sticky', left: 0, background: '#16213e', minWidth: 50 }}>Cat</th>
            {players.map((p, i) => (
              <th key={i} style={{ ...getColStyle(i), color: i === currentPlayerIndex ? '#e94560' : '#aaa', fontSize: 10, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 50 }}>
                {p.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {CATEGORIES.map(cat => {
            const currentScore = players[currentPlayerIndex]?.scores[cat.key];
            const isUnused = currentScore === undefined;
            const preview = (canScore && isUnused && dice.some(d => d > 0)) ? calculateScore(dice, cat.key) : null;
            const clickable = canScore && isUnused;
            return (
              <tr key={cat.key} onClick={() => { if (clickable && onScore) onScore(cat.key); }}
                style={{ cursor: clickable ? 'pointer' : 'default', background: preview !== null ? 'rgba(255,255,255,0.03)' : 'transparent' }}>
                <td style={{ ...cellStyle, textAlign: 'left', color: '#ccc', position: 'sticky', left: 0, background: '#16213e', fontWeight: preview !== null ? 600 : 400 }}>{cat.label}</td>
                {players.map((p, i) => {
                  const val = p.scores[cat.key];
                  const isCurrentCol = i === currentPlayerIndex;
                  const showPreview = canScore && isCurrentCol && isUnused;
                  return (
                    <td key={i} style={{
                      ...getColStyle(i),
                      color: val !== undefined ? '#fff' : (showPreview && preview !== null ? '#fbbf24' : '#555'),
                    }}>
                      {val !== undefined ? val : (showPreview && preview !== null ? preview : '-')}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          {players.map((p, i) => {
            const u = (p.scores.ones||0)+(p.scores.twos||0)+(p.scores.threes||0)+(p.scores.fours||0)+(p.scores.fives||0)+(p.scores.sixes||0);
            const bonus = u >= 63 ? 35 : 0;
            if (i > 0) return null;
            return (
              <tr key="bonus">
                <td style={{ ...cellStyle, textAlign: 'left', color: '#888', position: 'sticky', left: 0, background: '#16213e' }}>Bonus</td>
                {players.map((pj, j) => {
                  const uj = (pj.scores.ones||0)+(pj.scores.twos||0)+(pj.scores.threes||0)+(pj.scores.fours||0)+(pj.scores.fives||0)+(pj.scores.sixes||0);
                  return <td key={j} style={{ ...getColStyle(j), color: uj >= 63 ? '#4ade80' : '#555' }}>{uj >= 63 ? 35 : 0}</td>;
                })}
              </tr>
            );
          })}
          <tr>
            <td style={{ ...cellStyle, textAlign: 'left', color: '#e94560', fontWeight: 700, position: 'sticky', left: 0, background: '#16213e' }}>Total</td>
            {players.map((p, i) => {
              const u = (p.scores.ones||0)+(p.scores.twos||0)+(p.scores.threes||0)+(p.scores.fours||0)+(p.scores.fives||0)+(p.scores.sixes||0);
              const bonus = u >= 63 ? 35 : 0;
              return <td key={i} style={{ ...getColStyle(i), fontWeight: 700, color: '#fff' }}>{p.totalScore}</td>;
            })}
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
