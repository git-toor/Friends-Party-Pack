import { useEffect, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import YahtzeeGame from '../games/yahtzee/YahtzeeGame.js';
import ChatBox, { dispatchChatMessage } from '../components/ChatBox.js';
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
  const playerId = state?.playerId || players[playerIndex]?.id || '';
  const diceAppearance = (() => { try { return JSON.parse(localStorage.getItem('fpp_dice_appearance') || '{}'); } catch { return {}; } })();
  const [rollTrigger, setRollTrigger] = useState(0);
  const [remoteVectors, setRemoteVectors] = useState<any>(null);

  useEffect(() => {
    if (!sessionId) {
      setReady(true);
      return;
    }
    const ws = getWs();
    ws.connect();
    ws.send('JOIN_GAME', { sessionId, playerIndex });

    const unsub = ws.on('GAME_STATE', (msg) => {
      console.log('Game state update:', msg.payload);
    });

    // Wire CHAT_MESSAGE events from WS to the ChatBox
    const unsubChat = ws.on('CHAT_MESSAGE', (msg) => {
      dispatchChatMessage(msg.payload);
    });

    // Wire DICE_ROLL — animate dice with same result on all clients except the roller
    const unsubDice = ws.on('DICE_ROLL', (msg) => {
      console.log('[DICE_ROLL] received: roller', msg.payload?.playerIndex, 'vs me', playerIndex, 'values:', msg.payload?.values);
      if (msg.payload.playerIndex !== playerIndex) {
        setRemoteVectors(msg.payload);
        setRollTrigger(n => n + 1);
      }
    });

    setReady(true);
    return () => { unsub(); unsubChat(); unsubDice(); };
  }, [sessionId, playerIndex]);

  if (!ready) return <div style={{ padding: 40, textAlign: 'center', color: '#999' }}>Loading game...</div>;

  return (
    <>
      <YahtzeeGame
        playerCount={playerCount}
        playerIndex={playerIndex}
        playerName={playerName}
        sessionId={sessionId}
        players={players}
        playerId={playerId}
        diceAppearance={diceAppearance}
        remoteRoll={rollTrigger}
        remoteVectors={remoteVectors}
      />
      {sessionId && (
        <ChatBox
          sessionId={sessionId}
          playerId={playerId}
          playerName={playerName}
        />
      )}
    </>
  );
}
