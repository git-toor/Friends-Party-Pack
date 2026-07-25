import { useState, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { PLAYER_NAMES } from './constants.js';

const SPACE_NAMES: Record<string, string> = {
  chandni_chowk: 'Chandni Chowk', hazratganj: 'Hazratganj', ghat_road: 'Ghat Road',
  mi_road: 'MI Road', law_garden: 'Law Garden', mall_road: 'Mall Road',
  bapu_bazaar: 'Bapu Bazaar', lake_pichola: 'Lake Pichola', calangute: 'Calangute Bch',
  white_town: 'White Town', rock_beach: 'Rock Beach', mg_road: 'MG Road',
  marina_beach: 'Marina Beach', banjara_hills: 'Banjara Hills', park_street: 'Park Street',
  fc_road: 'FC Road', sg_highway: 'SG Highway', bandra_west: 'Bandra West',
  connaught_place: 'Connaught Pl', cyber_hub: 'Cyber Hub', marine_drive: 'Marine Drive',
  altamount_road: 'Altamount Rd', vande_bharat: 'Vande Bharat Exp',
  rajdhani: 'Rajdhani Exp', shatabdi: 'Shatabdi Exp', tejas: 'Tejas Exp',
  water_supply: 'Water Supply', electricity_board: 'Electricity Bd',
};

const GROUP_COLORS: Record<string, string> = {
  brown: '#8B4513', light_blue: '#87CEEB', pink: '#FF69B4', orange: '#FF8C00',
  red: '#FF0000', yellow: '#FFD700', green: '#006400', dark_blue: '#00008B',
};

interface PropertyState { owner: number | null; houses: number; mortgaged: boolean; }

interface BazaarModalProps {
  playerIndex: number;
  players: { money: number; bankrupt: boolean; jailFreeCards: number }[];
  properties: Record<string, PropertyState>;
  playerNames: Record<number, string>;
  interaction: any;
  onProposeTrade: (payload: any) => void;
  onAcceptTrade: () => void;
  onRejectTrade: () => void;
  onClose: () => void;
}

export default function BazaarModal({ playerIndex, players, properties, playerNames, interaction, onProposeTrade, onAcceptTrade, onRejectTrade, onClose }: BazaarModalProps) {
  const isTradeInteraction = interaction?.type === 'trade';

  const [targetPlayer, setTargetPlayer] = useState<number | null>(
    isTradeInteraction ? interaction.toPlayer : null
  );
  const [giveMoney, setGiveMoney] = useState(isTradeInteraction ? interaction.give.money : 0);
  const [askMoney, setAskMoney] = useState(isTradeInteraction ? interaction.ask.money : 0);
  const [giveProps, setGiveProps] = useState<string[]>(
    isTradeInteraction ? [...interaction.give.properties] : []
  );
  const [askProps, setAskProps] = useState<string[]>(
    isTradeInteraction ? [...interaction.ask.properties] : []
  );
  const [giveJailCards, setGiveJailCards] = useState(isTradeInteraction ? interaction.give.jailCards : 0);
  const [askJailCards, setAskJailCards] = useState(isTradeInteraction ? interaction.ask.jailCards : 0);

  const isEditing = isTradeInteraction ? interaction.phase === 'editing' : true;
  const isProposed = isTradeInteraction && interaction.phase === 'proposed';
  const amSender = isTradeInteraction && interaction.fromPlayer === playerIndex;
  const amReceiver = isTradeInteraction && interaction.toPlayer === playerIndex;

  const myPropertyList = useMemo(() =>
    Object.entries(properties)
      .filter(([_, p]) => p.owner === playerIndex && p.houses === 0)
      .map(([id]) => id)
      .sort(),
    [properties, playerIndex]
  );

  const theirPropertyList = useMemo(() => {
    if (targetPlayer === null) return [];
    return Object.entries(properties)
      .filter(([_, p]) => p.owner === targetPlayer && p.houses === 0)
      .map(([id]) => id)
      .sort();
  }, [properties, targetPlayer]);

  const toggleGiveProp = useCallback((id: string) => {
    setGiveProps(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }, []);

  const toggleAskProp = useCallback((id: string) => {
    setAskProps(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }, []);

  const canSend = targetPlayer !== null && (giveProps.length > 0 || giveMoney > 0 || giveJailCards > 0);
  const canAccept = isProposed && amReceiver;

  const handleSend = useCallback(() => {
    if (targetPlayer === null || targetPlayer === undefined) return;
    onProposeTrade({
      toPlayer: targetPlayer,
      giveMoney, giveProperties: giveProps, giveJailCards,
      askMoney, askProperties: askProps, askJailCards,
    });
  }, [targetPlayer, giveMoney, giveProps, giveJailCards, askMoney, askProps, askJailCards, onProposeTrade]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, zIndex: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.7)' }}
    >
      <motion.div
        initial={{ scale: 0.8, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        style={{ background: '#16213e', borderRadius: 12, padding: 20, minWidth: 340, maxWidth: 420, maxHeight: '85vh', overflow: 'auto', border: '1px solid #333' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#fbbf24' }}>🤝 Bazaar</div>
          <button onClick={onClose} style={{ padding: '4px 10px', borderRadius: 6, border: 'none', background: '#333', color: '#aaa', cursor: 'pointer', fontSize: 14 }}>✕</button>
        </div>

        {!targetPlayer && !isTradeInteraction && (
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, color: '#888', marginBottom: 6 }}>Select player to trade with:</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {players.map((p, i) => {
                if (i === playerIndex || p.bankrupt) return null;
                return (
                  <button key={i} onClick={() => setTargetPlayer(i)}
                    style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid #555', background: '#0f3460', color: '#eee', cursor: 'pointer', fontSize: 12 }}
                  >{playerNames[i] || PLAYER_NAMES[i % PLAYER_NAMES.length]}</button>
                );
              })}
            </div>
          </div>
        )}

        {(targetPlayer !== null || isTradeInteraction) && (
          <>
            <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
              {/* Your Offer */}
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 10, color: '#888', marginBottom: 4 }}>YOUR OFFER</div>
                <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 8, padding: 8, minHeight: 80 }}>
                  {giveProps.length === 0 && giveMoney === 0 && giveJailCards === 0 && (
                    <div style={{ fontSize: 10, color: '#555' }}>Nothing offered</div>
                  )}
                  {giveMoney > 0 && <div style={{ fontSize: 11, color: '#4CAF50', marginBottom: 2 }}>₹{giveMoney}</div>}
                  {giveJailCards > 0 && <div style={{ fontSize: 11, color: '#9C27B0', marginBottom: 2 }}>{giveJailCards}x Sifarish</div>}
                  {giveProps.map(id => (
                    <div key={id} style={{ fontSize: 11, color: '#eee', marginBottom: 1 }}>🏠 {SPACE_NAMES[id] || id}</div>
                  ))}
                </div>
                {isEditing && (
                  <div style={{ marginTop: 4 }}>
                    <input type="number" min={0} value={giveMoney} onChange={e => setGiveMoney(parseInt(e.target.value) || 0)}
                      style={{ width: '100%', padding: '4px 8px', borderRadius: 4, border: '1px solid #444', background: '#0f3460', color: '#fff', fontSize: 11, marginBottom: 2 }} placeholder="₹" />
                    <div style={{ maxHeight: 80, overflow: 'auto', marginBottom: 2 }}>
                      {myPropertyList.map(id => (
                        <label key={id} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: '#aaa', cursor: 'pointer', padding: '2px 0' }}>
                          <input type="checkbox" checked={giveProps.includes(id)} onChange={() => toggleGiveProp(id)} />
                          {SPACE_NAMES[id] || id}
                          {properties[id]?.mortgaged ? ' 🔒' : ''}
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Their Offer */}
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 10, color: '#888', marginBottom: 4 }}>
                  {targetPlayer !== null ? (playerNames[targetPlayer] || `P${targetPlayer}`) + "'s OFFER" : 'THEIR OFFER'}
                </div>
                <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 8, padding: 8, minHeight: 80 }}>
                  {askProps.length === 0 && askMoney === 0 && askJailCards === 0 && (
                    <div style={{ fontSize: 10, color: '#555' }}>Nothing asked</div>
                  )}
                  {askMoney > 0 && <div style={{ fontSize: 11, color: '#e94560', marginBottom: 2 }}>₹{askMoney}</div>}
                  {askJailCards > 0 && <div style={{ fontSize: 11, color: '#9C27B0', marginBottom: 2 }}>{askJailCards}x Sifarish</div>}
                  {askProps.map(id => (
                    <div key={id} style={{ fontSize: 11, color: '#eee', marginBottom: 1 }}>🏠 {SPACE_NAMES[id] || id}</div>
                  ))}
                </div>
                {isEditing && targetPlayer !== null && (
                  <div style={{ marginTop: 4 }}>
                    <input type="number" min={0} value={askMoney} onChange={e => setAskMoney(parseInt(e.target.value) || 0)}
                      style={{ width: '100%', padding: '4px 8px', borderRadius: 4, border: '1px solid #444', background: '#0f3460', color: '#fff', fontSize: 11, marginBottom: 2 }} placeholder="₹" />
                    <div style={{ maxHeight: 80, overflow: 'auto' }}>
                      {theirPropertyList.map(id => (
                        <label key={id} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: '#aaa', cursor: 'pointer', padding: '2px 0' }}>
                          <input type="checkbox" checked={askProps.includes(id)} onChange={() => toggleAskProp(id)} />
                          {SPACE_NAMES[id] || id}
                          {properties[id]?.mortgaged ? ' 🔒' : ''}
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: 6 }}>
              {isEditing && !isTradeInteraction && (
                <button onClick={handleSend} disabled={!canSend}
                  style={{ flex: 1, padding: '10px', borderRadius: 6, border: 'none', background: canSend ? '#e94560' : '#333', color: canSend ? '#fff' : '#555', cursor: canSend ? 'pointer' : 'default', fontSize: 13, fontWeight: 600 }}
                >Send Offer</button>
              )}
              {isEditing && isTradeInteraction && amSender && (
                <button onClick={handleSend}
                  style={{ flex: 1, padding: '10px', borderRadius: 6, border: 'none', background: '#e94560', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
                >Update & Send</button>
              )}
              {isProposed && amSender && (
                <button onClick={onRejectTrade}
                  style={{ flex: 1, padding: '10px', borderRadius: 6, border: '1px solid #555', background: 'transparent', color: '#888', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
                >Cancel Offer</button>
              )}
              {canAccept && (
                <>
                  <button onClick={onAcceptTrade}
                    style={{ flex: 1, padding: '10px', borderRadius: 6, border: 'none', background: '#4CAF50', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
                  >✅ Accept</button>
                  <button onClick={onRejectTrade}
                    style={{ flex: 1, padding: '10px', borderRadius: 6, border: '1px solid #555', background: 'transparent', color: '#888', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
                  >❌ Reject</button>
                </>
              )}
              {isTradeInteraction && !amSender && !amReceiver && (
                <div style={{ flex: 1, textAlign: 'center', fontSize: 11, color: '#888', padding: 10 }}>
                  Waiting for {amReceiver ? 'you' : playerNames[interaction.toPlayer] || `P${interaction.toPlayer}`} to respond...
                </div>
              )}
            </div>
          </>
        )}

        {targetPlayer === null && !isTradeInteraction && (
          <div style={{ fontSize: 10, color: '#555', textAlign: 'center', marginTop: 12 }}>
            Select a player above to start trading
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
