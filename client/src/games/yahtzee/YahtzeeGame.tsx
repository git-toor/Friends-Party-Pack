import { useState, useCallback, useRef, useEffect } from 'react';
import { DiceOverlay } from '../../components/DiceOverlay.js';
import { ScoreCard } from './ScoreCard.js';
import { Button } from '../../components/Button.js';
import type { DiceOverlayHandle } from '../../components/DiceOverlay.js';
import type { YahtzeeCategory, YahtzeeTurn, YahtzeePlayerState, YahtzeeGameState } from './types.js';

const EMPTY_TURN: YahtzeeTurn = { dice: [0, 0, 0, 0, 0], kept: [false, false, false, false, false], rollPhase: 1, phase: 'WAITING_FOR_ROLL' };
const EMPTY_PLAYER = (): YahtzeePlayerState => ({ scores: {}, yahtzeeBonusCount: 0, isCurrentPlayer: false, totalScore: 0, availableCategories: [] });

function createInitialState(playerCount: number): YahtzeeGameState {
  return {
    currentPlayerIndex: 0,
    round: 1,
    totalRounds: 13,
    winners: [],
    started: true,
    isMyTurn: true,
    turn: { ...EMPTY_TURN },
    players: Array.from({ length: playerCount }, () => EMPTY_PLAYER()),
  };
}

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

function getTotalScore(scores: Partial<Record<YahtzeeCategory, number>>): number {
  const cats: YahtzeeCategory[] = ['ones', 'twos', 'threes', 'fours', 'fives', 'sixes',
    'three_of_a_kind', 'four_of_a_kind', 'full_house', 'small_straight', 'large_straight', 'yahtzee', 'chance'];
  let upper = 0;
  for (const c of cats.slice(0, 6)) upper += scores[c] || 0;
  let lower = 0;
  for (const c of cats.slice(6)) lower += scores[c] || 0;
  return upper + (upper >= 63 ? 35 : 0) + lower;
}

const uiLayerStyle: React.CSSProperties = {
  position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
  zIndex: 1000, pointerEvents: 'none', display: 'flex', flexDirection: 'column',
};

const clickableStyle: React.CSSProperties = { pointerEvents: 'auto' };

const bottomBarStyle: React.CSSProperties = {
  position: 'fixed', bottom: 0, left: 0, right: 0,
  padding: '12px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
};

interface YahtzeeGameProps {
  playerCount?: number;
  playerIndex?: number;
  playerName?: string;
}

export default function YahtzeeGame({ playerCount = 2, playerIndex = 0, playerName = 'You' }: YahtzeeGameProps) {
  const diceRef = useRef<DiceOverlayHandle>(null);
  const [gameState, setGameState] = useState<YahtzeeGameState>(() => createInitialState(playerCount));
  const [selectedDice, setSelectedDice] = useState<Set<number>>(new Set());
  const [rolling, setRolling] = useState(false);
  const [animatingKeep, setAnimatingKeep] = useState(false);

  const turn = gameState.turn;
  const myState = gameState.players[gameState.currentPlayerIndex];
  const canRoll = turn.phase === 'WAITING_FOR_ROLL' && !rolling;
  const canKeep = turn.phase === 'WAITING_FOR_KEEP' && selectedDice.size > 0 && !animatingKeep;
  const canScore = turn.phase === 'WAITING_FOR_CATEGORY';

  const handleRoll = useCallback(async () => {
    if (!canRoll) return;
    setRolling(true);
    setSelectedDice(new Set());
    const values = await diceRef.current?.roll(5) || [];
    setGameState(prev => {
      const turn = { ...prev.turn, dice: values, phase: 'WAITING_FOR_KEEP' as const, rollPhase: (prev.turn.rollPhase + 1) as 1 | 2 | 3 };
      return { ...prev, turn };
    });
    setRolling(false);
  }, [canRoll]);

  const handleDieTap = useCallback((index: number) => {
    if (turn.phase !== 'WAITING_FOR_KEEP' || rolling) return;
    setSelectedDice(prev => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }, [turn.phase, rolling]);

  const handleKeep = useCallback(async () => {
    if (!canKeep) return;
    setAnimatingKeep(true);
    const indices = Array.from(selectedDice);
    diceRef.current?.keep(indices);
    // After keep animation completes, advance phase
    setTimeout(() => {
      setGameState(prev => {
        const kept = [...prev.turn.kept];
        for (const i of indices) kept[i] = true;
        const allKept = kept.every(k => k);
        const phase = (prev.turn.rollPhase >= 3 || allKept) ? 'WAITING_FOR_CATEGORY' : 'WAITING_FOR_ROLL';
        return { ...prev, turn: { ...prev.turn, kept, phase: phase as any } };
      });
      setSelectedDice(new Set());
      setAnimatingKeep(false);
    }, 600);
  }, [canKeep, selectedDice]);

  const handleScore = useCallback((category: YahtzeeCategory) => {
    if (!canScore || myState.scores[category] !== undefined) return;
    const score = calculateScore(turn.dice, category);
    const newScores = { ...myState.scores, [category]: score };
    const totalScore = getTotalScore(newScores);

    setGameState(prev => {
      const players = [...prev.players];
      players[prev.currentPlayerIndex] = {
        ...players[prev.currentPlayerIndex],
        scores: newScores,
        totalScore,
      };

      // Check if all 13 categories filled for this player
      const filled = Object.keys(newScores).length;
      let nextPlayer = prev.currentPlayerIndex;
      let nextRound = prev.round;
      if (filled >= 13) {
        nextPlayer++;
        if (nextPlayer >= playerCount) {
          nextPlayer = 0;
          nextRound++;
        }
      }

      return {
        ...prev,
        turn: { ...EMPTY_TURN, dice: [0, 0, 0, 0, 0], kept: [false, false, false, false, false], rollPhase: 1, phase: 'WAITING_FOR_ROLL' },
        currentPlayerIndex: nextPlayer,
        round: nextRound,
        players,
        winners: nextRound > 13 ? [0] : [],
      };
    });

    diceRef.current?.resetKept();
    setSelectedDice(new Set());
  }, [canScore, myState.scores, turn.dice, playerCount]);

  useEffect(() => {
    if (gameState.winners.length > 0) {
      setTimeout(() => alert(`Game Over! Winner: Player ${gameState.winners[0] + 1}`), 500);
    }
  }, [gameState.winners]);

  return (
    <>
      <DiceOverlay
        ref={diceRef}
        onSettle={(values) => console.log('Dice settled:', values)}
        onDieTap={handleDieTap}
        onKeepComplete={() => {}}
      />

      <div style={uiLayerStyle}>
        <div style={{ ...clickableStyle, padding: 12, textAlign: 'center' }}>
          <span style={{ fontSize: 13, color: '#999' }}>
            Round {gameState.round}/{gameState.totalRounds} · Player {gameState.currentPlayerIndex + 1}'s turn
          </span>
        </div>

        <div style={{ flex: 1 }} />

        <div style={bottomBarStyle}>
          <div style={{ ...clickableStyle, display: 'flex', gap: 8 }}>
            {canRoll && (
              <Button size="lg" onClick={handleRoll}>
                🎲 Roll ({turn.rollPhase}/3)
              </Button>
            )}
            {canKeep && (
              <Button variant="secondary" size="lg" onClick={handleKeep}>
                ✅ Keep Selected ({selectedDice.size})
              </Button>
            )}
          </div>

          <div style={{ ...clickableStyle, alignSelf: 'stretch', maxHeight: '40vh', overflowY: 'auto' }}>
            <ScoreCard
              scores={myState.scores}
              dice={turn.dice}
              canScore={canScore}
              onScore={handleScore}
              totalScore={myState.totalScore}
              playerName={playerName}
              isCurrentPlayer={true}
            />
          </div>
        </div>
      </div>
    </>
  );
}
