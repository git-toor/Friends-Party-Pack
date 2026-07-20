import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '../components/Button.js';
import { QRCode } from '../components/QRCode.js';
import { api } from '../api/client.js';
import { useWebSocket } from '../hooks/useWebSocket.js';

const pageStyle: React.CSSProperties = {
  display: 'flex', flexDirection: 'column', alignItems: 'center',
  padding: '30px 20px', height: '100%', overflowY: 'auto',
};

const playerRowStyle: React.CSSProperties = {
  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  width: '100%', maxWidth: 400, padding: '10px 16px',
  background: '#0f3460', borderRadius: 8, marginBottom: 8,
};

export default function LobbyPanel() {
  const { code } = useParams<{ code: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const playerId = searchParams.get('playerId') || '';
  const playerName = searchParams.get('name') || '';
  const [lobby, setLobby] = useState<any>(null);
  const [players, setPlayers] = useState<any[]>([]);
  const [isReady, setIsReady] = useState(false);
  const [joinUrl, setJoinUrl] = useState('');

  useEffect(() => {
    if (!code) return;
    setJoinUrl(`${location.origin}/join/${code}`);
    loadState();
  }, [code]);

  useWebSocket({
    LOBBY_UPDATED: (payload: any) => {
      if (payload.lobby) setLobby(payload.lobby);
      if (payload.players) setPlayers(payload.players);
    },
    GAME_STARTED: (payload: any) => {
      // Navigate to game — session ID will be in payload later
      navigate(`/game/session`, { state: { lobby: payload.lobby, players: payload.players, playerId, playerName } });
    },
  });

  const loadState = async () => {
    if (!code) return;
    const result = await api.getLobbyState(sessionStorage.getItem('lobbyId') || '');
    if (result && result.lobby) {
      setLobby(result.lobby);
      setPlayers(result.players);
    }
  };

  const handleReady = async () => {
    const newReady = !isReady;
    setIsReady(newReady);
    try {
      // Find lobby ID from current state
      const state = lobby;
      if (state) {
        await api.setReady(state.id, playerId, newReady);
      }
    } catch {}
  };

  const handleStart = async () => {
    if (!lobby) return;
    try {
      await api.startGame(lobby.id, playerId);
    } catch {}
  };

  const isHost = players.some(p => p.id === playerId && p.isHost);

  return (
    <div style={pageStyle}>
      <h1 style={{ fontSize: 20, marginBottom: 4 }}>Lobby</h1>
      <div style={{ fontSize: 48, letterSpacing: 12, fontWeight: 700, color: '#e94560', marginBottom: 8 }}>
        {code}
      </div>
      <p style={{ color: '#999', marginBottom: 16 }}>Share this code with friends</p>

      {joinUrl && <QRCode url={joinUrl} />}

      <Button variant="secondary" size="sm" style={{ marginTop: 12, marginBottom: 24 }}
        onClick={() => navigator.clipboard.writeText(joinUrl)}>
        📋 Copy Link
      </Button>

      <div style={{ width: '100%', maxWidth: 400, marginBottom: 24 }}>
        <h3 style={{ marginBottom: 8, color: '#999', fontSize: 14 }}>
          Players ({players.length}/{lobby?.maxPlayers || '?'})
        </h3>
        {players.map(p => (
          <div key={p.id} style={playerRowStyle}>
            <span>{p.name} {p.isHost ? '👑' : ''}</span>
            <span style={{ color: p.ready ? '#4ecca3' : '#666' }}>
              {p.ready ? '✅ Ready' : '⏳ Waiting'}
            </span>
          </div>
        ))}
      </div>

      {isHost ? (
        <Button size="lg" disabled={players.length < 2 || !players.every(p => p.ready)} onClick={handleStart}>
          Start Game
        </Button>
      ) : (
        <Button size="lg" variant={isReady ? 'secondary' : 'primary'} onClick={handleReady}>
          {isReady ? 'Not Ready' : 'Ready!'}
        </Button>
      )}
    </div>
  );
}
