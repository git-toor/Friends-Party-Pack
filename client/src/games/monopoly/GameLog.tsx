import { useState, useMemo, useRef, useEffect } from 'react';

const POSITION_NAMES: Record<number, string> = {
  0: 'GO', 1: 'Chandni Chowk', 2: 'Jugaad', 3: 'Hazratganj', 4: 'Income Tax',
  5: 'Vande Bharat Exp', 6: 'Ghat Road', 7: 'Kismat', 8: 'MI Road', 9: 'Law Garden',
  10: 'Jail', 11: 'Mall Road', 12: 'Water Supply', 13: 'Bapu Bazaar', 14: 'Lake Pichola',
  15: 'Rajdhani Exp', 16: 'Calangute Bch', 17: 'Jugaad', 18: 'White Town', 19: 'Rock Beach',
  20: 'Free Parking', 21: 'MG Road', 22: 'Kismat', 23: 'Marina Beach', 24: 'Banjara Hills',
  25: 'Shatabdi Exp', 26: 'Park Street', 27: 'FC Road', 28: 'Electricity Bd', 29: 'SG Highway',
  30: 'Go To Jail', 31: 'Bandra West', 32: 'Connaught Pl', 33: 'Jugaad', 34: 'Cyber Hub',
  35: 'Tejas Exp', 36: 'Kismat', 37: 'Marine Drive', 38: 'Luxury Tax', 39: 'Altamount Rd',
};

interface LogEvent {
  type: string;
  playerIndex: number;
  amount?: number;
  toPlayer?: number;
  propertyIndex?: number;
  cardText?: string;
  cardType?: string;
}

interface GameLogProps {
  events: LogEvent[];
  playerNames: Record<number, string>;
  currentPlayer: number;
}

export default function GameLog({ events, playerNames, currentPlayer }: GameLogProps) {
  const [expanded, setExpanded] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const lines = useMemo(() => events.slice(-50).map((e, i) => {
    const name = playerNames[e.playerIndex] || `P${e.playerIndex}`;
    const pn = e.propertyIndex !== undefined ? (POSITION_NAMES[e.propertyIndex] || `#${e.propertyIndex}`) : '';
    const targetName = e.toPlayer !== undefined ? (playerNames[e.toPlayer] || `P${e.toPlayer}`) : '';

    switch (e.type) {
      case 'PLAYER_MOVED': return `🚶 ${name} moved`;
      case 'PASSED_GO': return `💰 ${name} passed GO +₹${e.amount}`;
      case 'BOUGHT_PROPERTY': return `🏠 ${name} bought ${pn} for ₹${e.amount}`;
      case 'PAID_RENT': return `💸 ${name} paid ₹${e.amount} rent to ${targetName}`;
      case 'PAID_TAX': return `🏛️ ${name} paid ₹${e.amount}`;
      case 'WENT_TO_JAIL': return `🔒 ${name} went to jail`;
      case 'BANKRUPT': return `💀 ${name} is bankrupt!`;
      case 'PLAYER_WON': return `🏆 ${name} wins!`;
      case 'ROLLED_DOUBLES': return `🎲 ${name} rolled doubles`;
      case 'THREE_DOUBLES': return `🎲 ${name} rolled 3 doubles → jail!`;
      case 'TURN_ENDED': return `⏭️ ${name}'s turn ended`;
      case 'DREW_CARD': return `${e.cardType === 'kismat' ? '✨' : '💡'} ${name} drew: ${e.cardText?.slice(0, 40)}${(e.cardText?.length ?? 0) > 40 ? '…' : ''}`;
      case 'CARD_EFFECT': return e.cardText ? `📜 ${e.cardText?.slice(0, 50)}${(e.cardText?.length ?? 0) > 50 ? '…' : ''}` : null;
      case 'BUNGALOW_BUILT': return `🏠 ${name} built bungalow on ${pn}`;
      case 'VILLA_BUILT': return `💒 ${name} built villa on ${pn}`;
      case 'BUNGALOW_SOLD': return `🏠 ${name} sold bungalow on ${pn}`;
      case 'VILLA_SOLD': return `💒 ${name} sold villa on ${pn}`;
      case 'GHOOS_PAID': return `💸 ${name} paid Ghoos ₹50`;
      case 'SIFARISH_USED': return `🤝 ${name} used Sifarish card`;
      case 'PROPERTY_MORTGAGED': return `🔒 ${name} mortgaged ${pn}`;
      case 'PROPERTY_UNMORTGAGED': return `🔓 ${name} unmortgaged ${pn}`;
      case 'AUCTION_STARTED': return `🔨 Auction started for ${pn}`;
      case 'AUCTION_BID': return `🔨 ${name} bid ₹${e.amount}`;
      case 'AUCTION_PASS': return `🔨 ${name} passed`;
      case 'AUCTION_WON': return `🔨 ${name} won auction for ${pn} (₹${e.amount})`;
      case 'TRADE_PROPOSED': return `🤝 ${name} proposed a trade`;
      case 'TRADE_ACCEPTED': return `✅ Trade accepted`;
      case 'TRADE_REJECTED': return `❌ Trade rejected`;
      case 'PROPERTY_TRANSFERRED': return `📦 Property transferred`;
      default: return null;
    }
  }).filter(Boolean) as string[], [events, playerNames]);

  useEffect(() => {
    if (expanded) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [lines.length, expanded]);

  if (lines.length === 0) return null;

  return (
    <div style={{
      flexShrink: 0, background: 'rgba(22,33,62,0.9)', borderTop: '1px solid #333',
      maxHeight: expanded ? 160 : 28, overflow: 'hidden',
      transition: 'max-height 0.3s ease', cursor: 'pointer',
    }}>
      <div onClick={() => setExpanded(!expanded)} style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '4px 12px', fontSize: 10, color: '#888', borderBottom: expanded ? '1px solid #333' : 'none',
      }}>
        <span>📋 Game Log ({lines.length})</span>
        <span>{expanded ? '▲' : '▼'}</span>
      </div>
      {expanded && (
        <div style={{ padding: '4px 12px 8px', fontSize: 10, lineHeight: 1.6, maxHeight: 130, overflowY: 'auto', cursor: 'default' }}>
          {lines.map((line, i) => (
            <div key={i} style={{
              color: i === lines.length - 1 ? '#eee' : '#666',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>{line}</div>
          ))}
          <div ref={bottomRef} />
        </div>
      )}
    </div>
  );
}


