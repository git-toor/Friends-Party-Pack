import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../components/Button.js';
import { useLobby } from '../hooks/useLobby.js';

const GAME_INFO: Record<string, { name: string; icon: string; minPlayers: number; maxPlayers: number; presets?: { id: string; name: string; desc: string }[] }> = {
  yahtzee: { name: 'Yahtzee', icon: '🎯', minPlayers: 2, maxPlayers: 8 },
  'exploding-kittens': {
    name: 'Exploding Kittens', icon: '💣', minPlayers: 2, maxPlayers: 6,
    presets: [
      { id: 'classic', name: '🐱 Classic', desc: 'Base game only' },
      { id: 'chaos', name: '🔥 Chaos', desc: 'All expansions' },
      { id: 'custom', name: '🤪 Custom', desc: 'Choose expansions manually' },
    ],
  },
};

const EXPANSIONS = ['imploding', 'streaking', 'barking', 'zombie'];

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
  const [preset, setPreset] = useState('classic');
  const [expansions, setExpansions] = useState<string[]>([]);

  const info = GAME_INFO[gameId || ''] || GAME_INFO['yahtzee'];

  const handleCreate = async () => {
    if (!playerName.trim() || !gameId) return;
    const settings: any = {};
    if (gameId === 'exploding-kittens') {
      settings.expansions = preset === 'chaos' ? ['imploding', 'streaking', 'barking', 'zombie']
        : preset === 'custom' ? expansions : [];
    }
    const result = await create(gameId, playerName.trim(), maxPlayers, settings);
    if (result) {
      navigate(`/lobby/${result.lobby.code}?playerId=${result.playerId}&lobbyId=${result.lobby.id}&name=${encodeURIComponent(playerName.trim())}`);
    }
  };

  const toggleExpansion = (exp: string) => {
    setExpansions(prev => prev.includes(exp) ? prev.filter(e => e !== exp) : [...prev, exp]);
  };

  return (
    <div style={pageStyle}>
      <h1 style={{ fontSize: 24, marginBottom: 4 }}>{info.icon} {info.name}</h1>
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
          {Array.from({ length: info.maxPlayers - info.minPlayers + 1 }, (_, i) => info.minPlayers + i).map(n => (
            <button key={n} style={playerBtnStyle(maxPlayers === n)} onClick={() => setMaxPlayers(n)}>
              {n}
            </button>
          ))}
        </div>
      </div>

      {info.presets && (
        <>
          <div style={{ width: '100%', maxWidth: 400, marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 6, color: '#999', fontSize: 14 }}>Mode</label>
            {info.presets.map(p => (
              <div key={p.id} onClick={() => setPreset(p.id)}
                style={{
                  padding: '10px 14px', borderRadius: 8, marginBottom: 6, cursor: 'pointer',
                  background: preset === p.id ? '#e94560' : '#0f3460', color: '#fff',
                }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{p.name}</div>
                <div style={{ fontSize: 11, color: '#aaa' }}>{p.desc}</div>
              </div>
            ))}
          </div>

          {preset === 'custom' && (
            <div style={{ width: '100%', maxWidth: 400, marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 6, color: '#999', fontSize: 14 }}>Expansions</label>
              {EXPANSIONS.map(exp => (
                <label key={exp} style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px',
                  marginBottom: 4, borderRadius: 6, background: '#0f3460', cursor: 'pointer',
                  color: expansions.includes(exp) ? '#fff' : '#666',
                }}>
                  <input type="checkbox" checked={expansions.includes(exp)}
                    onChange={() => toggleExpansion(exp)} />
                  {exp.charAt(0).toUpperCase() + exp.slice(1)} Kittens
                </label>
              ))}
            </div>
          )}
        </>
      )}

      {error && <p style={{ color: '#e94560', marginBottom: 12 }}>{error}</p>}

      <Button size="lg" disabled={!playerName.trim() || loading} onClick={handleCreate}>
        {loading ? 'Creating...' : 'Create Lobby'}
      </Button>
    </div>
  );
}
