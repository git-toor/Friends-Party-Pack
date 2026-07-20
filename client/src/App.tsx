import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage.js';
import DiceTest from './pages/DiceTest.js';
import GameSettingsPage from './pages/GameSettingsPage.js';
import JoinView from './pages/JoinView.js';
import LobbyPanel from './pages/LobbyPanel.js';
import GamePage from './pages/GamePage.js';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/game/:gameId/settings" element={<GameSettingsPage />} />
        <Route path="/join" element={<JoinView />} />
        <Route path="/join/:code" element={<JoinView />} />
        <Route path="/lobby/:code" element={<LobbyPanel />} />
        <Route path="/game/:sessionId" element={<GamePage />} />
        <Route path="/dice" element={<DiceTest />} />
      </Routes>
    </BrowserRouter>
  );
}
