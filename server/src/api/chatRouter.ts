import { Router } from 'express';

let wsServer: any;

export function setWsServer(ws: any): void {
  wsServer = ws;
}

export const chatRouter = Router();

chatRouter.post('/send', (req, res) => {
  const { sessionId, playerId, playerName, text } = req.body;
  if (!sessionId || !playerId || !text?.trim()) {
    return res.status(400).json({ error: 'Missing fields' });
  }

  const message = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    playerId,
    playerName: playerName || 'Unknown',
    text: text.trim(),
    timestamp: Date.now(),
  };

  if (wsServer) {
    wsServer.broadcast(`game:${sessionId}`, { type: 'CHAT_MESSAGE', payload: message });
  }

  res.json({ ok: true, message });
});
