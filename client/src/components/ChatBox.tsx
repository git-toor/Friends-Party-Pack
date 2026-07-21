import { useState, useRef, useEffect } from 'react';

export interface ChatMessage {
  id: string;
  playerId: string;
  playerName: string;
  text: string;
  timestamp: number;
}

interface ChatBoxProps {
  sessionId: string;
  playerId: string;
  playerName: string;
}

export default function ChatBox({ sessionId, playerId, playerName }: ChatBoxProps) {
  const [input, setInput] = useState('');

  const send = async () => {
    if (!input.trim()) return;
    const text = input.trim();
    setInput('');
    await fetch('/api/chat/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, playerId, playerName, text }),
    });
  };

  return (
    <>
      {/* Bottom input bar */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1002,
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '6px 12px', background: 'rgba(15,20,40,0.95)', borderTop: '1px solid #333',
      }}>
        <input
          style={{
            flex: 1, background: '#0f3460', border: 'none', borderRadius: 6,
            padding: '8px 12px', color: '#eee', fontSize: 13, outline: 'none',
          }}
          placeholder="Chat..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') send(); }}
        />
        <button onClick={send} style={{
          background: '#e94560', color: '#fff', border: 'none', borderRadius: 6,
          padding: '7px 14px', cursor: 'pointer', fontSize: 13, fontWeight: 600,
        }}>
          Send
        </button>
      </div>

      <style>{`@keyframes fadeIn { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:translateY(0) } }`}</style>
    </>
  );
}

export function dispatchChatMessage(msg: ChatMessage): void {
  window.dispatchEvent(new CustomEvent('chat-message', { detail: msg }));
}
