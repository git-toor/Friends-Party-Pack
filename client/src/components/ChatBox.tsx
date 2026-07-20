import { useState, useRef, useEffect } from 'react';

interface ChatMessage {
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
  onNewMessage?: (msg: ChatMessage) => void;
}

export default function ChatBox({ sessionId, playerId, playerName, onNewMessage }: ChatBoxProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [unread, setUnread] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  // Listen for CHAT_MESSAGE events on the WS connection
  useEffect(() => {
    if (!open) return;
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, open]);

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

  // Exposed for the parent to inject WS messages
  useEffect(() => {
    if (onNewMessage) return;
    const handler = (e: Event) => {
      const msg = (e as CustomEvent).detail as ChatMessage;
      setMessages(prev => [...prev, msg]);
      if (!open) setUnread(u => u + 1);
    };
    window.addEventListener('chat-message', handler as EventListener);
    return () => window.removeEventListener('chat-message', handler as EventListener);
  }, [open, onNewMessage]);

  const addMessage = (msg: ChatMessage) => {
    setMessages(prev => [...prev, msg]);
    if (!open) setUnread(u => u + 1);
  };

  return (
    <>
      {/* Toggle button */}
      <button onClick={() => { setOpen(v => !v); setUnread(0); }}
        style={{
          position: 'fixed', bottom: 100, left: 12, zIndex: 1001,
          width: 40, height: 40, borderRadius: 20, border: 'none',
          background: '#e94560', color: '#fff', fontSize: 18, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
        }}>
        {unread > 0 ? <><span style={{ fontSize: 10, position: 'absolute', top: -2, right: -2, background: '#fff', color: '#e94560', borderRadius: 8, padding: '0 4px' }}>{unread}</span>💬</> : '💬'}
      </button>

      {/* Chat panel */}
      {open && (
        <div style={{
          position: 'fixed', bottom: 148, left: 12, zIndex: 1001,
          width: 280, maxHeight: 300, background: '#16213e', borderRadius: 10,
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
          boxShadow: '0 4px 16px rgba(0,0,0,0.4)', border: '1px solid #333',
        }}>
          <div style={{ padding: '8px 12px', fontSize: 13, fontWeight: 600, color: '#999', borderBottom: '1px solid #333' }}>
            💬 Chat
          </div>

          <div ref={listRef} style={{ flex: 1, overflowY: 'auto', padding: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
            {messages.length === 0 && (
              <span style={{ color: '#555', fontSize: 12, textAlign: 'center', padding: 16 }}>No messages yet</span>
            )}
            {messages.map(m => (
              <div key={m.id} style={{
                padding: '4px 8px', borderRadius: 6, fontSize: 12,
                background: m.playerId === playerId ? '#0f3460' : '#1a1a2e',
                alignSelf: m.playerId === playerId ? 'flex-end' : 'flex-start',
                maxWidth: '85%',
              }}>
                <span style={{ color: '#888', fontSize: 10 }}>{m.playerName}</span>
                <div style={{ color: '#ddd' }}>{m.text}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', borderTop: '1px solid #333', padding: 6 }}>
            <input
              style={{ flex: 1, background: '#0f3460', border: 'none', borderRadius: 4, padding: '6px 10px', color: '#eee', fontSize: 12, outline: 'none' }}
              placeholder="Type a message..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') send(); }}
            />
            <button onClick={send} style={{ background: '#e94560', color: '#fff', border: 'none', borderRadius: 4, padding: '4px 10px', marginLeft: 4, cursor: 'pointer', fontSize: 12 }}>
              Send
            </button>
          </div>
        </div>
      )}
    </>
  );
}

// Helper to dispatch chat messages from WS events (called by GamePage)
export function dispatchChatMessage(msg: ChatMessage): void {
  window.dispatchEvent(new CustomEvent('chat-message', { detail: msg }));
}
