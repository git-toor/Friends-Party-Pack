import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage.js';
import GameSettingsPage from './pages/GameSettingsPage.js';
import JoinView from './pages/JoinView.js';
import LobbyPanel from './pages/LobbyPanel.js';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/game/:gameId/settings" element={<GameSettingsPage />} />
        <Route path="/join" element={<JoinView />} />
        <Route path="/join/:code" element={<JoinView />} />
        <Route path="/lobby/:code" element={<LobbyPanel />} />
        <Route path="/game/:sessionId" element={<div style={{ padding: 40, textAlign: 'center' }}>Game coming soon</div>} />
      </Routes>
    </BrowserRouter>
  );
}
