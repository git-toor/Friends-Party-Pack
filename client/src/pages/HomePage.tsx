import { useNavigate } from 'react-router-dom';
import { Button } from '../components/Button.js';

const GAMES = [
  { id: 'yahtzee', name: 'Yahtzee', icon: '🎯', description: 'Classic 5-dice score game. Roll, keep, and score your way to victory!' },
  { id: 'exploding-kittens', name: 'Exploding Kittens', icon: '💣', description: 'Russian roulette with kittens. Draw, defuse, and avoid exploding!' },
];

const pageStyle: React.CSSProperties = {
  display: 'flex', flexDirection: 'column', alignItems: 'center',
  padding: '40px 20px', height: '100%', overflowY: 'auto',
};

const cardStyle: React.CSSProperties = {
  background: '#16213e', borderRadius: 12, padding: 24,
  width: '100%', maxWidth: 400, marginBottom: 16, cursor: 'pointer',
};

export default function HomePage() {
  const navigate = useNavigate();

  return (
    <div style={pageStyle}>
      <h1 style={{ fontSize: 28, marginBottom: 8 }}>🎲 Friends Party Pack</h1>
      <p style={{ color: '#999', marginBottom: 32, textAlign: 'center' }}>
        Pick a game and play with friends!
      </p>

      <Button variant="secondary" size="md" style={{ marginBottom: 24 }} onClick={() => navigate('/join')}>
        🔗 Join a Game
      </Button>

      {GAMES.map(game => (
        <div key={game.id} style={cardStyle} onClick={() => navigate(`/game/${game.id}/settings`)}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>{game.icon}</div>
          <h2 style={{ fontSize: 20, marginBottom: 4 }}>{game.name}</h2>
          <p style={{ color: '#999', fontSize: 14 }}>{game.description}</p>
        </div>
      ))}
    </div>
  );
}
