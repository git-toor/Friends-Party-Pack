import { useLocation } from 'react-router-dom';
import YahtzeeGame from '../games/yahtzee/YahtzeeGame.js';

export default function GamePage() {
  const location = useLocation();
  const state = location.state as any;

  // For now, we run a local game. Phase 6 will integrate with server.
  const playerCount = state?.players?.length || 2;
  const playerIndex = state?.playerIndex || 0;
  const playerName = state?.playerName || 'You';

  return (
    <YahtzeeGame
      playerCount={playerCount}
      playerIndex={playerIndex}
      playerName={playerName}
    />
  );
}
