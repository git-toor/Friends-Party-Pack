import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '../components/Button.js';
import { useLobby } from '../hooks/useLobby.js';

const pageStyle: React.CSSProperties = {
  display: 'flex', flexDirection: 'column', alignItems: 'center',
  justifyContent: 'center', padding: 40, height: '100%',
};

export default function JoinView() {
  const { code: codeParam } = useParams<{ code?: string }>();
  const navigate = useNavigate();
  const { join, loading, error } = useLobby();
  const [code, setCode] = useState((codeParam || '').toUpperCase());
  const [name, setName] = useState('');

  const handleJoin = async () => {
    if (!code.trim() || !name.trim()) return;
    const result = await join(code.trim().toUpperCase(), name.trim());
    if (result) {
      navigate(`/lobby/${result.lobby.code}?playerId=${result.playerId}&name=${encodeURIComponent(name.trim())}`);
    }
  };

  return (
    <div style={pageStyle}>
      <h1 style={{ fontSize: 24, marginBottom: 24 }}>Join a Game</h1>

      <div style={{ width: '100%', maxWidth: 360, marginBottom: 16 }}>
        <label style={{ display: 'block', marginBottom: 6, color: '#999', fontSize: 14 }}>Lobby Code</label>
        <input
          style={{ width: '100%', padding: '12px 14px', borderRadius: 8, border: '1px solid #333', background: '#0f3460', color: '#eee', fontSize: 20, textAlign: 'center', letterSpacing: 8, textTransform: 'uppercase', outline: 'none' }}
          placeholder="XXXX"
          value={code}
          onChange={e => setCode(e.target.value.toUpperCase())}
          maxLength={4}
        />
      </div>

      <div style={{ width: '100%', maxWidth: 360, marginBottom: 24 }}>
        <label style={{ display: 'block', marginBottom: 6, color: '#999', fontSize: 14 }}>Your Name</label>
        <input
          style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #333', background: '#0f3460', color: '#eee', fontSize: 15, outline: 'none' }}
          placeholder="Enter your name"
          value={name}
          onChange={e => setName(e.target.value)}
          maxLength={20}
        />
      </div>

      {error && <p style={{ color: '#e94560', marginBottom: 12 }}>{error}</p>}

      <Button size="lg" disabled={!code.trim() || !name.trim() || loading} onClick={handleJoin}>
        {loading ? 'Joining...' : 'Join Game'}
      </Button>
    </div>
  );
}
