import { useEffect, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import YahtzeeGame from '../games/yahtzee/YahtzeeGame.js';
import { getWs } from '../api/ws.js';

export default function GamePage() {
  const { sessionId: sessionIdParam } = useParams<{ sessionId: string }>();
  const location = useLocation();
  const state = location.state as any;
  const [ready, setReady] = useState(false);

  const sessionId = state?.sessionId || sessionIdParam;
  const playerCount = state?.players?.length || 2;
  const playerIndex = state?.playerIndex || 0;
  const players = state?.players || [];
  const myPlayer = players[playerIndex] || { name: 'You' };
  const playerName = myPlayer.name || state?.playerName || 'You';

  useEffect(() => {
    if (!sessionId) {
      setReady(true);
      return;
    }
    // Join game room via WS
    const ws = getWs();
    ws.connect();
    ws.send('JOIN_GAME', { sessionId, playerIndex });

    // Listen for state updates
    const unsub = ws.on('GAME_STATE', (msg) => {
      // State is stored in the game component via API calls
      console.log('Game state update:', msg.payload);
    });

    setReady(true);
    return () => unsub();
  }, [sessionId, playerIndex]);

  if (!ready) return <div style={{ padding: 40, textAlign: 'center', color: '#999' }}>Loading game...</div>;

  return (
    <YahtzeeGame
      playerCount={playerCount}
      playerIndex={playerIndex}
      playerName={playerName}
      sessionId={sessionId}
    />
  );
}
