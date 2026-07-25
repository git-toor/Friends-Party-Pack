import { useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { PLAYER_NAMES } from './constants.js';

const SPACE_NAMES: Record<string, string> = {
  chandni_chowk: 'Chandni Chowk', hazratganj: 'Hazratganj', ghat_road: 'Ghat Road',
  mi_road: 'MI Road', law_garden: 'Law Garden', mall_road: 'Mall Road',
  bapu_bazaar: 'Bapu Bazaar', lake_pichola: 'Lake Pichola', baga_beach: 'Baga Beach',
  white_town: 'White Town', rock_beach: 'Rock Beach', mg_road: 'MG Road',
  marina_beach: 'Marina Beach', banjara_hills: 'Banjara Hills', park_street: 'Park Street',
  fc_road: 'FC Road', sg_highway: 'SG Highway', bandra_west: 'Bandra West',
  jor_bagh: 'Jor Bagh', cyber_hub: 'Cyber Hub', marine_drive: 'Marine Drive',
  altamount_road: 'Altamount Rd', vande_bharat: 'Vande Bharat Exp',
  rajdhani: 'Rajdhani Exp', shatabdi: 'Shatabdi Exp', duronto_exp: 'Duronto Exp',
  jal_vibhaag: 'Jal Vibhaag', bijli_vibhag: 'Bijli Vibhag',
};

interface AuctionInteraction {
  type: 'auction';
  propertyId: string;
  declinedBy: number;
  currentBid: number;
  currentBidder: number | null;
  activePlayer: number;
  passedPlayers: number[];
}

interface AuctionModalProps {
  auction: AuctionInteraction;
  playerIndex: number;
  playerNames: Record<number, string>;
  onBid: (amount: number) => void;
  onPass: () => void;
  error?: string | null;
}

const QUICK_BIDS = [10, 25, 50, 100];

export default function AuctionModal({ auction, playerIndex, playerNames, onBid, onPass, error }: AuctionModalProps) {
  const [customBid, setCustomBid] = useState('');
  const isMyTurn = auction.activePlayer === playerIndex;
  const isInAuction = !auction.passedPlayers.includes(playerIndex) && playerIndex !== auction.declinedBy;

  const handleCustomBid = useCallback(() => {
    const amount = parseInt(customBid);
    if (isNaN(amount) || amount <= auction.currentBid) return;
    onBid(amount);
    setCustomBid('');
  }, [customBid, auction.currentBid, onBid]);

  const activeName = playerNames[auction.activePlayer] || PLAYER_NAMES[auction.activePlayer % PLAYER_NAMES.length] || `P${auction.activePlayer}`;
  const bidderName = auction.currentBidder !== null
    ? (playerNames[auction.currentBidder] || PLAYER_NAMES[auction.currentBidder % PLAYER_NAMES.length] || `P${auction.currentBidder}`)
    : null;
  const propName = SPACE_NAMES[auction.propertyId] || auction.propertyId;

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
        style={{ background: '#16213e', borderRadius: 12, padding: 24, minWidth: 300, maxWidth: 360, border: '1px solid #333' }}
      >
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>🔨 AUCTION</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#fff' }}>{propName}</div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, padding: '8px 12px', background: 'rgba(0,0,0,0.3)', borderRadius: 8 }}>
          <div>
            <div style={{ fontSize: 10, color: '#888' }}>Current Bid</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#fbbf24' }}>₹{auction.currentBid || 0}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 10, color: '#888' }}>Highest Bidder</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#eee' }}>{bidderName || '—'}</div>
          </div>
        </div>

        {isMyTurn && isInAuction ? (
          <div>
            <div style={{ fontSize: 11, color: '#4CAF50', marginBottom: 8, fontWeight: 600 }}>
              {auction.currentBidder === playerIndex
                ? "▶ You're the highest bidder — Pass to win!"
                : '▶ It\'s your turn to bid!'}
            </div>
            <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
              {QUICK_BIDS.map(amount => (
                <button
                  key={amount}
                  onClick={() => onBid(auction.currentBid + amount)}
                  style={{
                    flex: 1, padding: '8px 4px', borderRadius: 6, border: '1px solid #555',
                    background: 'transparent', color: '#eee', cursor: 'pointer', fontSize: 12, fontWeight: 600,
                  }}
                >+₹{amount}</button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
              <input
                value={customBid}
                onChange={e => setCustomBid(e.target.value)}
                placeholder="Custom ₹"
                style={{
                  flex: 1, padding: '8px 12px', borderRadius: 6, border: '1px solid #555',
                  background: '#0f3460', color: '#fff', fontSize: 14, outline: 'none',
                }}
                onKeyDown={e => e.key === 'Enter' && handleCustomBid()}
              />
              <button
                onClick={handleCustomBid}
                disabled={!customBid || parseInt(customBid) <= auction.currentBid}
                style={{
                  padding: '8px 16px', borderRadius: 6, border: 'none',
                  background: '#e94560', color: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 600,
                }}
              >Bid</button>
            </div>
            <button
              onClick={onPass}
              style={{
                width: '100%', padding: '10px', borderRadius: 6, border: '1px solid #555',
                background: 'transparent', color: '#888', cursor: 'pointer', fontSize: 13, fontWeight: 600,
              }}
            >Pass</button>
            {error && <div style={{ marginTop: 8, fontSize: 11, color: '#e94560', textAlign: 'center', fontWeight: 600 }}>{error}</div>}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: 12 }}>
            <div style={{ fontSize: 12, color: '#888' }}>
              {isInAuction
                ? `Waiting for ${activeName} to bid...`
                : 'You are out of this auction'}
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
