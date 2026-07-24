import { useEffect, useState, lazy, Suspense } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import ChatBox, { dispatchChatMessage } from '../components/ChatBox.js';
import { getWs } from '../api/ws.js';

const YahtzeeGame = lazy(() => import('../games/yahtzee/YahtzeeGame.js'));
const ExplodingKittensGame = lazy(() => import('../games/exploding-kittens/ExplodingKittensGame.js'));
const LudoGame = lazy(() => import('../games/ludo/LudoGame.js'));

const GAME_COMPONENTS: Record<string, any> = {
  yahtzee: YahtzeeGame,
  'exploding-kittens': ExplodingKittensGame,
  ludo: LudoGame,
};

export default function GamePage() {
  const { sessionId: sessionIdParam } = useParams<{ sessionId: string }>();
  const location = useLocation();
  const state = location.state as any;
  const [ready, setReady] = useState(false);
  const [gameStatePush, setGameStatePush] = useState<any>(null);
  const [resolvedGameId, setResolvedGameId] = useState<string | null>(null);

  const sessionId = state?.sessionId || sessionIdParam;
  const playerCount = state?.players?.length || 2;
  const playerIndex = state?.playerIndex || 0;
  const players = state?.players || [];
  const myPlayer = players[playerIndex] || { name: 'You' };
  const playerName = myPlayer.name || state?.playerName || 'You';
  const playerId = state?.playerId || players[playerIndex]?.id || '';
  const nsfw: boolean = state?.nsfw || state?.lobby?.settings?.nsfw || false;

  const gameId = resolvedGameId || state?.gameId || state?.lobby?.gameId || 'yahtzee';
  const GameComponent = GAME_COMPONENTS[gameId] || YahtzeeGame;

  useEffect(() => {
    if (!sessionId) {
      setReady(true);
      return;
    }
    // Resolve gameId from server if not in navigation state
    if (!state?.gameId && !state?.lobby?.gameId) {
      fetch(`/api/session/${sessionId}`)
        .then(r => r.json())
        .then(data => { if (data.gameId) setResolvedGameId(data.gameId); })
        .catch(() => {});
    }
    const ws = getWs();
    ws.connect();
    ws.send('JOIN_GAME', { sessionId, playerIndex });

    const unsub = ws.on('GAME_STATE', (msg) => {
      if (msg.payload?._actionPlayer === playerIndex) return;
      if (msg.payload?.forPlayerIndex !== playerIndex) return;
      setGameStatePush(msg.payload);
    });

    const unsubChat = ws.on('CHAT_MESSAGE', (msg) => {
      dispatchChatMessage(msg.payload);
    });

    setReady(true);
    return () => { unsub(); unsubChat(); };
  }, [sessionId, playerIndex, state?.gameId, state?.lobby?.gameId]);

  if (!ready) return <div style={{ padding: 40, textAlign: 'center', color: '#999' }}>Loading game...</div>;

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, position: 'relative' }}>
        <Suspense fallback={<div style={{ padding: 40, textAlign: 'center', color: '#999' }}>Loading…</div>}>
          <GameComponent
            playerCount={playerCount}
            playerIndex={playerIndex}
            playerName={playerName}
            sessionId={sessionId}
            players={players}
            playerId={playerId}
            gameStatePush={gameStatePush}
            nsfw={nsfw}
          />
        </Suspense>
      </div>
      {sessionId && (
        <ChatBox
          sessionId={sessionId}
          playerId={playerId}
          playerName={playerName}
        />
      )}
    </div>
  );
}
