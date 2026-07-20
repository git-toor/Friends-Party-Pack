import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../components/Button.js';
import { useLobby } from '../hooks/useLobby.js';
import { DiceAppearanceSelector } from '../components/DiceAppearance.js';

const pageStyle: React.CSSProperties = {
  display: 'flex', flexDirection: 'column', alignItems: 'center',
  padding: '40px 20px', height: '100%', overflowY: 'auto',
};

const playerBtnStyle = (selected: boolean): React.CSSProperties => ({
  background: selected ? '#e94560' : '#0f3460',
  color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px',
  fontSize: 15, cursor: 'pointer', fontWeight: 600,
});

export default function GameSettingsPage() {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const { create, loading, error } = useLobby();
  const [playerName, setPlayerName] = useState('');
  const [maxPlayers, setMaxPlayers] = useState(4);

  const handleCreate = async () => {
    if (!playerName.trim() || !gameId) return;
    const result = await create(gameId, playerName.trim(), maxPlayers);
    if (result) {
      navigate(`/lobby/${result.lobby.code}?playerId=${result.playerId}&lobbyId=${result.lobby.id}&name=${encodeURIComponent(playerName.trim())}`);
    }
  };

  return (
    <div style={pageStyle}>
      <h1 style={{ fontSize: 24, marginBottom: 4 }}>🎯 Yahtzee</h1>
      <p style={{ color: '#999', marginBottom: 24 }}>Configure your game</p>

      <div style={{ width: '100%', maxWidth: 400, marginBottom: 16 }}>
        <label style={{ display: 'block', marginBottom: 6, color: '#999', fontSize: 14 }}>Your Name</label>
        <input
          style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #333', background: '#0f3460', color: '#eee', fontSize: 15, outline: 'none' }}
          placeholder="Enter your name"
          value={playerName}
          onChange={e => setPlayerName(e.target.value)}
          maxLength={20}
        />
      </div>

      <div style={{ width: '100%', maxWidth: 400, marginBottom: 24 }}>
        <label style={{ display: 'block', marginBottom: 6, color: '#999', fontSize: 14 }}>Players</label>
        <div style={{ display: 'flex', gap: 8 }}>
          {[2, 3, 4, 5, 6, 7, 8].map(n => (
            <button key={n} style={playerBtnStyle(maxPlayers === n)} onClick={() => setMaxPlayers(n)}>
              {n}
            </button>
          ))}
        </div>
      </div>

      <div style={{ width: '100%', maxWidth: 400, marginBottom: 24 }}>
        <DiceAppearanceSelector />
      </div>

      {error && <p style={{ color: '#e94560', marginBottom: 12 }}>{error}</p>}

      <Button size="lg" disabled={!playerName.trim() || loading} onClick={handleCreate}>
        {loading ? 'Creating...' : 'Create Lobby'}
      </Button>
    </div>
  );
}
