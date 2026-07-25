import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { MonopolyBoard } from './MonopolyBoard.js';
import { Dice, type DiceHandle } from './Dice.js';
import { OpponentBar } from './OpponentBar.js';
import { PropertyFan } from './PropertyFan.js';
import { PropertyCard } from './PropertyCard.js';
import { sounds } from './sounds.js';
import { PLAYER_COLORS, PLAYER_NAMES } from './constants.js';
import AuctionModal from './AuctionModal.js';
import BazaarModal from './BazaarModal.js';
import GameLog from './GameLog.js';

interface GameEvent {
  type: string;
  playerIndex: number;
  amount?: number; toPlayer?: number; propertyIndex?: number;
  from?: number; to?: number; path?: number[];
  cardType?: string; cardIndex?: number; cardText?: string;
}

interface PlayerStats { propertiesBought: number; housesBuilt: number; villasBuilt: number; rentPaid: number; rentReceived: number; timesPassedGo: number; timesWentToJail: number; totalMoneyEarned: number; totalMoneySpent: number; auctionsWon: number; tradesCompleted: number; }
interface PlayerState { money: number; position: number; inJail: boolean; jailTurns: number; jailFreeCards: number; bankrupt: boolean; monopolies: string[]; stats: PlayerStats; }
interface PropertyState { owner: number | null; houses: number; mortgaged: boolean; }

interface MonopolyClientState {
  players: PlayerState[]; properties: Record<string, PropertyState>;
  currentPlayer: number; phase: string;
  dice: [number, number] | null; diceTotal: number | null;
  doublesCount: number; rolledBy: number | null;
  lastAction: string | null; landedIndex: number | null;
  winner: number | null; validActions: string[];
  housesRemaining: number; hotelsRemaining: number;
  interaction: any | null;
  eventLog: any[];
  kismatRemaining?: number;
  jugaadRemaining?: number;
}

interface MonopolyGameProps {
  playerCount?: number; playerIndex?: number;
  playerName?: string; playerId?: string; sessionId?: string;
  players?: { name: string; index: number; id?: string; token?: string }[];
  gameStatePush?: any; diceEvent?: any; nsfw?: boolean;
}

const EMPTY_STATE: MonopolyClientState = {
  players: [], properties: {}, currentPlayer: 0, phase: 'waiting_for_roll',
  dice: null, diceTotal: null, doublesCount: 0, rolledBy: null,
  lastAction: null, landedIndex: null, winner: null,
  validActions: [], housesRemaining: 32, hotelsRemaining: 12,
  interaction: null, eventLog: [],
};

const SPACE_DATA: { index: number; name: string; spaceId: string; group?: number; price?: number; houseCost?: number; mortgageValue?: number; groupName?: string; rent?: number[] }[] = [
  { index: 0, name: 'GO', spaceId: 'go' },
  { index: 1, name: 'Chandni Chowk', spaceId: 'chandni_chowk', group: 0, price: 60, houseCost: 50, mortgageValue: 30, groupName: 'brown', rent: [2, 10, 30, 90, 160, 250] },
  { index: 2, name: 'Jugaad', spaceId: 'jugaad_1' },
  { index: 3, name: 'Hazratganj', spaceId: 'hazratganj', group: 0, price: 60, houseCost: 50, mortgageValue: 30, groupName: 'brown', rent: [4, 20, 60, 180, 320, 450] },
  { index: 4, name: 'Income Tax', spaceId: 'income_tax' },
  { index: 5, name: 'Vande Bharat Exp', spaceId: 'vande_bharat', price: 200, mortgageValue: 100 },
  { index: 6, name: 'Ghat Road', spaceId: 'ghat_road', group: 1, price: 100, houseCost: 50, mortgageValue: 50, groupName: 'light_blue', rent: [6, 30, 90, 270, 400, 550] },
  { index: 7, name: 'Kismat', spaceId: 'kismat_1' },
  { index: 8, name: 'MI Road', spaceId: 'mi_road', group: 1, price: 100, houseCost: 50, mortgageValue: 50, groupName: 'light_blue', rent: [6, 30, 90, 270, 400, 550] },
  { index: 9, name: 'Law Garden', spaceId: 'law_garden', group: 1, price: 120, houseCost: 50, mortgageValue: 60, groupName: 'light_blue', rent: [8, 40, 100, 300, 450, 600] },
  { index: 10, name: 'Jail', spaceId: 'jail' },
  { index: 11, name: 'Mall Road', spaceId: 'mall_road', group: 2, price: 140, houseCost: 100, mortgageValue: 70, groupName: 'pink', rent: [10, 50, 150, 450, 625, 750] },
  { index: 12, name: 'Water Supply', spaceId: 'water_supply', price: 150, mortgageValue: 75 },
  { index: 13, name: 'Bapu Bazaar', spaceId: 'bapu_bazaar', group: 2, price: 140, houseCost: 100, mortgageValue: 70, groupName: 'pink', rent: [10, 50, 150, 450, 625, 750] },
  { index: 14, name: 'Lake Pichola', spaceId: 'lake_pichola', group: 2, price: 160, houseCost: 100, mortgageValue: 80, groupName: 'pink', rent: [12, 60, 180, 500, 700, 900] },
  { index: 15, name: 'Rajdhani Exp', spaceId: 'rajdhani', price: 200, mortgageValue: 100 },
  { index: 16, name: 'Calangute Bch', spaceId: 'calangute', group: 3, price: 180, houseCost: 100, mortgageValue: 90, groupName: 'orange', rent: [14, 70, 200, 550, 750, 950] },
  { index: 17, name: 'Jugaad', spaceId: 'jugaad_2' },
  { index: 18, name: 'White Town', spaceId: 'white_town', group: 3, price: 180, houseCost: 100, mortgageValue: 90, groupName: 'orange', rent: [14, 70, 200, 550, 750, 950] },
  { index: 19, name: 'Rock Beach', spaceId: 'rock_beach', group: 3, price: 200, houseCost: 100, mortgageValue: 100, groupName: 'orange', rent: [16, 80, 220, 600, 800, 1000] },
  { index: 20, name: 'Free Parking', spaceId: 'free_parking' },
  { index: 21, name: 'MG Road', spaceId: 'mg_road', group: 4, price: 220, houseCost: 150, mortgageValue: 110, groupName: 'red', rent: [18, 90, 250, 700, 875, 1050] },
  { index: 22, name: 'Kismat', spaceId: 'kismat_2' },
  { index: 23, name: 'Marina Beach', spaceId: 'marina_beach', group: 4, price: 220, houseCost: 150, mortgageValue: 110, groupName: 'red', rent: [18, 90, 250, 700, 875, 1050] },
  { index: 24, name: 'Banjara Hills', spaceId: 'banjara_hills', group: 4, price: 240, houseCost: 150, mortgageValue: 120, groupName: 'red', rent: [20, 100, 300, 750, 925, 1100] },
  { index: 25, name: 'Shatabdi Exp', spaceId: 'shatabdi', price: 200, mortgageValue: 100 },
  { index: 26, name: 'Park Street', spaceId: 'park_street', group: 5, price: 260, houseCost: 150, mortgageValue: 130, groupName: 'yellow', rent: [22, 110, 330, 800, 975, 1150] },
  { index: 27, name: 'FC Road', spaceId: 'fc_road', group: 5, price: 260, houseCost: 150, mortgageValue: 130, groupName: 'yellow', rent: [22, 110, 330, 800, 975, 1150] },
  { index: 28, name: 'Electricity Bd', spaceId: 'electricity_board', price: 150, mortgageValue: 75 },
  { index: 29, name: 'SG Highway', spaceId: 'sg_highway', group: 5, price: 280, houseCost: 150, mortgageValue: 140, groupName: 'yellow', rent: [24, 120, 360, 850, 1025, 1200] },
  { index: 30, name: 'Go To Jail', spaceId: 'go_to_jail' },
  { index: 31, name: 'Bandra West', spaceId: 'bandra_west', group: 6, price: 300, houseCost: 200, mortgageValue: 150, groupName: 'green', rent: [26, 130, 390, 900, 1100, 1275] },
  { index: 32, name: 'Connaught Pl', spaceId: 'connaught_place', group: 6, price: 300, houseCost: 200, mortgageValue: 150, groupName: 'green', rent: [26, 130, 390, 900, 1100, 1275] },
  { index: 33, name: 'Jugaad', spaceId: 'jugaad_3' },
  { index: 34, name: 'Cyber Hub', spaceId: 'cyber_hub', group: 6, price: 320, houseCost: 200, mortgageValue: 160, groupName: 'green', rent: [28, 150, 450, 1000, 1200, 1400] },
  { index: 35, name: 'Tejas Exp', spaceId: 'tejas', price: 200, mortgageValue: 100 },
  { index: 36, name: 'Kismat', spaceId: 'kismat_3' },
  { index: 37, name: 'Marine Drive', spaceId: 'marine_drive', group: 7, price: 350, houseCost: 200, mortgageValue: 175, groupName: 'dark_blue', rent: [35, 175, 500, 1100, 1300, 1500] },
  { index: 38, name: 'Luxury Tax', spaceId: 'luxury_tax' },
  { index: 39, name: 'Altamount Rd', spaceId: 'altamount_road', group: 7, price: 400, houseCost: 200, mortgageValue: 200, groupName: 'dark_blue', rent: [50, 200, 600, 1400, 1700, 2000] },
];

function getSpaceInfo(index: number) { return SPACE_DATA.find(s => s.index === index); }
function getSpaceByPropId(propId: string) { return SPACE_DATA.find(s => s.spaceId === propId); }

const KISMAT_ART_IDS = [
  'kismat_advance_go', 'kismat_mg_road', 'kismat_mall_road', 'kismat_vande_bharat',
  'kismat_nearest_utility', 'kismat_nearest_rr', 'kismat_dividend', 'kismat_go_to_jail',
  'kismat_repairs', 'kismat_poor_tax', 'kismat_rajdhani', 'kismat_marine_drive',
  'kismat_sarpanch', 'kismat_building_loan', 'kismat_crossword', 'kismat_sifarish',
];

const JUGAAD_ART_IDS = [
  'jugaad_advance_go', 'jugaad_bank_error', 'jugaad_doctor_fee', 'jugaad_stock_sale',
  'jugaad_sifarish', 'jugaad_go_to_jail', 'jugaad_opera_night', 'jugaad_holiday_fund',
  'jugaad_tax_refund', 'jugaad_life_insurance', 'jugaad_hospital_fees', 'jugaad_school_fees',
  'jugaad_consultancy', 'jugaad_street_repairs', 'jugaad_beauty_contest', 'jugaad_inheritance',
];

const GROUP_COLORS: Record<string, string> = {
  brown: '#8B4513', light_blue: '#87CEEB', pink: '#FF69B4', orange: '#FF8C00',
  red: '#FF0000', yellow: '#FFD700', green: '#006400', dark_blue: '#00008B',
  '0': '#8B4513', '1': '#87CEEB', '2': '#FF69B4', '3': '#FF8C00',
  '4': '#FF0000', '5': '#FFD700', '6': '#006400', '7': '#00008B',
};

const GROUP_NAMES: Record<string, string> = {
  brown: 'Brown', light_blue: 'Light Blue', pink: 'Pink', orange: 'Orange',
  red: 'Red', yellow: 'Yellow', green: 'Green', dark_blue: 'Dark Blue',
};

export default function MonopolyGame({ playerCount = 2, playerIndex = 0, playerName = 'You', playerId = '', sessionId, players, gameStatePush, diceEvent }: MonopolyGameProps) {
  const [gs, setGs] = useState<MonopolyClientState>(EMPTY_STATE);
  const svRef = useRef(-1);
  const prevPlayersRef = useRef<PlayerState[] | null>(null);
  const [stepAnim, setStepAnim] = useState<{ playerIndex: number; from: number; to: number } | null>(null);
  const [showWinner, setShowWinner] = useState(false);
  const [eventMsg, setEventMsg] = useState<string | null>(null);
  const [showBankrupt, setShowBankrupt] = useState(false);
  const [showCard, setShowCard] = useState<{ type: string; text: string; cardIndex?: number } | null>(null);
  const [selectedFanCard, setSelectedFanCard] = useState<number | null>(null);
  const [selectedPropForPopup, setSelectedPropForPopup] = useState<string | null>(null);
  const [showBazaar, setShowBazaar] = useState(false);
  const [showPlayerPanel, setShowPlayerPanel] = useState<number | null>(0);
  const [rentPopup, setRentPopup] = useState<{ amount: number; toPlayer: number; propertyName: string } | null>(null);
  const rollingRef = useRef(false);
  const diceRef = useRef<DiceHandle>(null);

  const playerNames = useMemo(() => players?.reduce((acc, p) => { acc[p.index] = p.name; return acc; }, {} as Record<number, string>) || {}, [players]);

  useEffect(() => {
    if (gs.players.length > 0) {
      setShowPlayerPanel(gs.currentPlayer);
    }
  }, [gs.currentPlayer, gs.players.length]);

  const isMyTurn = playerIndex === gs.currentPlayer;
  const isAuctionActive = gs.interaction?.type === 'auction';
  const isTradeActive = gs.interaction?.type === 'trade';
  const canRoll = isMyTurn && gs.phase === 'waiting_for_roll' && gs.winner === null && !rollingRef.current && !isAuctionActive;
  const canBuy = isMyTurn && gs.phase === 'waiting_for_action' && gs.validActions.includes('BUY_PROPERTY');
  const canDecline = isMyTurn && gs.phase === 'waiting_for_action' && gs.validActions.includes('DECLINE_PROPERTY');
  const canEndTurn = isMyTurn && gs.phase === 'turn_end' && gs.validActions.includes('END_TURN');
  const canPayGhoos = isMyTurn && gs.validActions.includes('PAY_GHOOS');
  const canUseSifarish = isMyTurn && gs.validActions.includes('USE_SIFARISH_CARD');
  const canBazaar = isMyTurn && !isAuctionActive && !isTradeActive && gs.winner === null;

  const myPropertyCards = useMemo(() => Object.entries(gs.properties)
    .filter(([_, p]) => p.owner === playerIndex && gs.players[playerIndex] && !gs.players[playerIndex].bankrupt)
    .map(([spaceId, p]) => {
      const space = SPACE_DATA.find(s => s.spaceId === spaceId);
      const groupName = space?.groupName ?? '';
      const monopoly = gs.players[playerIndex]?.monopolies.includes(groupName) ?? false;
      return { index: space?.index ?? -1, spaceId, name: space?.name ?? spaceId, group: space?.group, price: space?.price ?? 0, houseCost: space?.houseCost ?? 0, mortgageValue: space?.mortgageValue ?? 0, houses: p.houses, mortgaged: p.mortgaged, monopoly, rent: space?.rent ?? [] };
    }), [gs.properties, playerIndex, gs.players]);

  const selectedPropInfo = selectedPropForPopup ? myPropertyCards.find(c => c.spaceId === selectedPropForPopup) ?? null : null;

  const updateState = useCallback((newState: any) => {
    if (!newState || (newState._sv !== undefined && newState._sv <= svRef.current)) return;
    if (newState._sv !== undefined) svRef.current = newState._sv;
    if (newState.players) prevPlayersRef.current = newState.players;
    setGs({
      players: newState.players || [], properties: newState.properties || {},
      currentPlayer: newState.currentPlayer ?? 0, phase: newState.phase || 'waiting_for_roll',
      dice: newState.dice ?? null, diceTotal: newState.diceTotal ?? null,
      doublesCount: newState.doublesCount ?? 0, rolledBy: newState.rolledBy ?? null,
      lastAction: newState.lastAction ?? null, landedIndex: newState.landedIndex ?? null,
      winner: newState.winner ?? null, validActions: newState.validActions || [],
      housesRemaining: newState.housesRemaining ?? 32, hotelsRemaining: newState.hotelsRemaining ?? 12,
      interaction: newState.interaction ?? null, eventLog: newState.eventLog || [],
      kismatRemaining: newState.kismatRemaining ?? 16, jugaadRemaining: newState.jugaadRemaining ?? 16,
    });
  }, []);

  const handleGameEvent = useCallback((ev: GameEvent) => {
    const name = playerNames[ev.playerIndex] || PLAYER_NAMES[ev.playerIndex % PLAYER_NAMES.length] || `P${ev.playerIndex}`;
    if (ev.type === 'PLAYER_MOVED' && ev.path && ev.path.length > 0) {
      setStepAnim({ playerIndex: ev.playerIndex, from: ev.path[0], to: ev.path[ev.path.length - 1] });
    }
    if (ev.type === 'BANKRUPT') { setShowBankrupt(true); setTimeout(() => setShowBankrupt(false), 2000); }
    if (ev.type === 'PASSED_GO') { setEventMsg(`💰 ${name} passed GO +₹${ev.amount}`); setTimeout(() => setEventMsg(null), 2000); }
    if (ev.type === 'PAID_RENT') {
      const propSpace = SPACE_DATA.find(s => s.index === ev.propertyIndex);
      setRentPopup({ amount: ev.amount ?? 0, toPlayer: ev.toPlayer ?? ev.playerIndex, propertyName: propSpace?.name ?? 'Property' });
      sounds.playRent();
    }
    if (ev.type === 'BOUGHT_PROPERTY') sounds.playBuy();
    if (ev.type === 'DREW_CARD' && ev.cardText) { setShowCard({ type: ev.cardType || 'kismat', text: ev.cardText, cardIndex: ev.cardIndex }); }
    if (ev.type === 'PLAYER_WON') { setShowWinner(true); sounds.playWin(); }
    if (ev.type === 'BUNGALOW_BUILT') { setEventMsg(`🏠 Built bungalow`); setTimeout(() => setEventMsg(null), 2000); }
    if (ev.type === 'VILLA_BUILT') { setEventMsg(`💒 Built villa`); setTimeout(() => setEventMsg(null), 2000); }
    if (ev.type === 'GHOOS_PAID') { setEventMsg(`💸 ${name} paid Ghoos ₹50`); setTimeout(() => setEventMsg(null), 2000); }
    if (ev.type === 'SIFARISH_USED') { setEventMsg(`🤝 ${name} used Sifarish`); setTimeout(() => setEventMsg(null), 2000); }
    if (ev.type === 'PROPERTY_MORTGAGED') { setEventMsg(`🔒 ${name} mortgaged property`); setTimeout(() => setEventMsg(null), 2000); }
    if (ev.type === 'PROPERTY_UNMORTGAGED') { setEventMsg(`🔓 ${name} unmortgaged property`); setTimeout(() => setEventMsg(null), 2000); }
    if (ev.type === 'AUCTION_WON') { setEventMsg(`🔨 ${name} won auction for ₹${ev.amount}`); setTimeout(() => setEventMsg(null), 3000); }
    if (ev.type === 'TRADE_ACCEPTED') { setEventMsg(`🤝 Trade accepted!`); setTimeout(() => setEventMsg(null), 3000); }
    if (ev.type === 'TRADE_REJECTED') { setEventMsg(`❌ Trade rejected`); setTimeout(() => setEventMsg(null), 2000); }
  }, [playerNames]);

  const fetchState = useCallback(async () => {
    if (!sessionId) return;
    try {
      const r = await fetch(`/api/games/monopoly/state/${sessionId}?playerIndex=${playerIndex}&t=${Date.now()}`);
      const data = await r.json();
      updateState(data);
    } catch {}
  }, [sessionId, playerIndex, updateState]);

  useEffect(() => {
    if (!sessionId) return;
    fetchState();
    const interval = setInterval(fetchState, 10000);
    return () => clearInterval(interval);
  }, [sessionId, fetchState]);

  useEffect(() => {
    if (!gameStatePush) return;
    if (gameStatePush._events) {
      for (const ev of gameStatePush._events as GameEvent[]) {
        handleGameEvent(ev);
      }
    }
    updateState(gameStatePush);
  }, [gameStatePush, handleGameEvent, updateState]);

  useEffect(() => {
    if (!diceEvent || !diceRef.current || diceEvent.playerIndex === playerIndex) return;
    if (diceEvent.action === 'CONFIRM_DICE') {
      const dv = diceEvent.diceValue;
      if (dv && Array.isArray(dv) && dv.length === 2) diceRef.current.roll(dv[0], dv[1]);
    }
  }, [diceEvent, playerIndex]);

  const sendAction = useCallback(async (actionType: string, payload?: any) => {
    if (!sessionId) return null;
    try {
      const r = await fetch('/api/games/monopoly/action', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, playerIndex, action: { type: actionType, payload } }),
      });
      const data = await r.json();
      if (!r.ok || data.valid === false) return data;
      if (data.state) {
        updateState(data.state);
        if (data.events) for (const ev of data.events as GameEvent[]) handleGameEvent(ev);
        if (data.state.winner !== null) setShowWinner(true);
      }
      return data;
    } catch { return null; }
  }, [sessionId, playerIndex, handleGameEvent, updateState]);

  const handleStepAnimDone = useCallback(() => setStepAnim(null), []);

  const handleRoll = useCallback(async () => {
    if (rollingRef.current || gs.phase !== 'waiting_for_roll' || !diceRef.current) return;
    rollingRef.current = true;
    sounds.playDiceRoll();
    const rollData = await sendAction('ROLL_DICE');
    if (!rollData?.success || !rollData.rollId) { rollingRef.current = false; return; }
    const [v1, v2] = await diceRef.current.roll();
    await sendAction('CONFIRM_DICE', { rollId: rollData.rollId, values: [v1, v2] });
    rollingRef.current = false;
  }, [sendAction, gs.phase]);

  const handleBuy = useCallback(async () => { if (canBuy) { await sendAction('BUY_PROPERTY'); setSelectedFanCard(null); } }, [canBuy, sendAction]);
  const handleDecline = useCallback(async () => { if (canDecline) await sendAction('DECLINE_PROPERTY'); }, [canDecline, sendAction]);
  const handleEndTurn = useCallback(async () => { if (canEndTurn) await sendAction('END_TURN'); }, [canEndTurn, sendAction]);
  const handlePayGhoos = useCallback(async () => { if (canPayGhoos) await sendAction('PAY_GHOOS'); }, [canPayGhoos, sendAction]);
  const handleUseSifarish = useCallback(async () => { if (canUseSifarish) await sendAction('USE_SIFARISH_CARD'); }, [canUseSifarish, sendAction]);

  const handleRematch = useCallback(async () => {
    if (!sessionId) return;
    await fetch('/api/games/monopoly/rematch', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId }) });
    setShowWinner(false);
    fetchState();
  }, [sessionId, fetchState]);

  // ─── Unified Property Popup actions ──
  const handleBuildBungalow = useCallback(async () => {
    if (!selectedPropInfo) return;
    await sendAction('BUILD_BUNGALOW', { propertyId: selectedPropInfo.spaceId });
  }, [selectedPropInfo, sendAction]);

  const handleBuildVilla = useCallback(async () => {
    if (!selectedPropInfo) return;
    await sendAction('BUILD_VILLA', { propertyId: selectedPropInfo.spaceId });
  }, [selectedPropInfo, sendAction]);

  const handleSellBungalow = useCallback(async () => {
    if (!selectedPropInfo) return;
    await sendAction('SELL_BUNGALOW', { propertyId: selectedPropInfo.spaceId });
  }, [selectedPropInfo, sendAction]);

  const handleMortgage = useCallback(async () => {
    if (!selectedPropInfo) return;
    await sendAction('MORTGAGE', { propertyId: selectedPropInfo.spaceId });
  }, [selectedPropInfo, sendAction]);

  const handleUnmortgage = useCallback(async () => {
    if (!selectedPropInfo) return;
    await sendAction('UNMORTGAGE', { propertyId: selectedPropInfo.spaceId });
  }, [selectedPropInfo, sendAction]);

  // ─── Fan card interaction ──
  const handleFanCardTap = useCallback((cardIndex: number) => {
    setSelectedFanCard(prev => prev === cardIndex ? null : cardIndex);
    if (isMyTurn && myPropertyCards[cardIndex]) {
      setSelectedPropForPopup(prev => prev === myPropertyCards[cardIndex].spaceId ? null : myPropertyCards[cardIndex].spaceId);
    }
  }, [isMyTurn, myPropertyCards]);

  // ─── Auction actions ──
  const handleAuctionBid = useCallback(async (amount: number) => {
    await sendAction('BID', { amount });
  }, [sendAction]);

  const handleAuctionPass = useCallback(async () => {
    await sendAction('PASS');
  }, [sendAction]);

  // ─── Bazaar actions ──
  const handleProposeTrade = useCallback(async (payload: any) => {
    await sendAction('PROPOSE_TRADE', payload);
  }, [sendAction]);

  const handleAcceptTrade = useCallback(async () => {
    await sendAction('ACCEPT_TRADE');
    setShowBazaar(false);
  }, [sendAction]);

  const handleRejectTrade = useCallback(async () => {
    await sendAction('REJECT_TRADE');
    setShowBazaar(false);
  }, [sendAction]);

  // ─── Property event history ──
  const propertyHistory = useMemo(() => {
    if (!selectedPropInfo) return [];
    return gs.eventLog.filter((e: any) =>
      (e.propertyIndex !== undefined && e.propertyIndex === selectedPropInfo.index) ||
      (e.propertyIndex === undefined && e.type === 'BOUGHT_PROPERTY' && selectedPropInfo && SPACE_DATA.some(s => s.index === e.propertyIndex && s.spaceId === selectedPropInfo.spaceId))
    ).slice(-10);
  }, [gs.eventLog, selectedPropInfo]);

  const playerTokens = useMemo(() => {
    const map: Record<number, string> = {};
    if (players) {
      for (const p of players) {
        if (p.token) map[p.index] = p.token;
      }
    }
    return map;
  }, [players]);

  const allTokens = gs.players.filter(p => !p.bankrupt).map((p, i) => ({ playerIndex: i, position: p.position }));
  const hasPlayers = gs.players.length > 0;
  const propertyBuildings = useMemo(() => {
    const map: Record<number, number> = {};
    for (const [spaceId, p] of Object.entries(gs.properties)) {
      const space = SPACE_DATA.find(s => s.spaceId === spaceId);
      if (space && p.houses > 0) map[space.index] = p.houses;
    }
    return map;
  }, [gs.properties]);
  const propertyOwners = useMemo(() => {
    const map: Record<number, number> = {};
    for (const [spaceId, p] of Object.entries(gs.properties)) {
      if (p.owner !== null) {
        const space = SPACE_DATA.find(s => s.spaceId === spaceId);
        if (space) map[space.index] = p.owner;
      }
    }
    return map;
  }, [gs.properties]);
  const propertyCount = useMemo(() => {
    const counts: Record<number, number> = {};
    for (const id of Object.keys(gs.properties)) {
      const o = gs.properties[id].owner;
      if (o !== null) counts[o] = (counts[o] || 0) + 1;
    }
    return counts;
  }, [gs.properties]);

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: '#1a1a2e', color: '#eee', position: 'relative', overflow: 'hidden' }}>
      {hasPlayers && <OpponentBar players={gs.players} currentPlayer={gs.currentPlayer} playerNames={playerNames} propertyCount={propertyCount} selectedPlayer={showPlayerPanel} onSelectPlayer={setShowPlayerPanel} />}

      {/* Player Property Panel */}
      <AnimatePresence>
        {showPlayerPanel !== null && gs.players[showPlayerPanel] && !gs.players[showPlayerPanel].bankrupt && (
          <motion.div key="player-panel" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ overflow: 'hidden', background: 'rgba(22,33,62,0.95)', borderBottom: '1px solid #333', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: PLAYER_COLORS[showPlayerPanel % PLAYER_COLORS.length] }} />
                <span style={{ fontWeight: 700, fontSize: 12 }}>{playerNames[showPlayerPanel] || PLAYER_NAMES[showPlayerPanel % PLAYER_NAMES.length]}</span>
                <span style={{ color: '#4ecca3', fontSize: 11 }}>₹{gs.players[showPlayerPanel].money}</span>
                <span style={{ color: '#888', fontSize: 10 }}>{Object.values(gs.properties).filter(p => p.owner === showPlayerPanel).length} properties</span>
                {gs.players[showPlayerPanel].jailFreeCards > 0 && <span style={{ color: '#9C27B0', fontSize: 10 }}>🤝 {gs.players[showPlayerPanel].jailFreeCards} Sifarish</span>}
              </div>
              <button onClick={() => setShowPlayerPanel(null)} style={{ padding: '2px 10px', borderRadius: 4, border: 'none', background: '#333', color: '#aaa', cursor: 'pointer', fontSize: 12, lineHeight: '20px' }}>✕</button>
            </div>
            <div style={{ display: 'flex', gap: 6, padding: '0 12px 6px', overflowX: 'auto', minHeight: 90 }}>
              {Object.entries(gs.properties).filter(([_, p]) => p.owner === showPlayerPanel).map(([spaceId, p]) => {
                const space = SPACE_DATA.find(s => s.spaceId === spaceId);
                if (!space) return null;
                const groupName = space.groupName ?? '';
                const monopoly = gs.players[showPlayerPanel]?.monopolies.includes(groupName) ?? false;
                return (
                  <div key={spaceId} style={{ flexShrink: 0, width: 68, borderRadius: 6, overflow: 'hidden', background: '#1a1a2e', border: `1px solid ${monopoly ? GROUP_COLORS[groupName] || '#888' : '#333'}`, opacity: p.mortgaged ? 0.5 : 1, filter: p.mortgaged ? 'grayscale(100%)' : 'none', position: 'relative' }}>
                    {/* Property art */}
                    <img src={`/art/monopoly/${spaceId}_001.webp`} alt={space.name}
                      style={{ width: '100%', height: 50, objectFit: 'cover', display: 'block' }}
                      onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    {/* Color strip */}
                    <div style={{ height: 4, background: GROUP_COLORS[groupName] || '#888' }} />
                    <div style={{ padding: '2px 3px', textAlign: 'center' }}>
                      <div style={{ color: '#fff', fontWeight: 600, fontSize: 7, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{space.name}</div>
                      <div style={{ color: '#4ecca3', fontWeight: 700, fontSize: 9 }}>₹{space.price}</div>
                      {p.houses > 0 && (
                        <div style={{ display: 'flex', gap: 1, justifyContent: 'center', marginTop: 1 }}>
                          {p.houses <= 4 ? Array.from({ length: p.houses }, (_, i) => <div key={i} style={{ width: 5, height: 5, background: '#4CAF50', borderRadius: 1 }} />)
                            : <div style={{ width: 8, height: 6, background: '#F44336', borderRadius: 1 }} />}
                        </div>
                      )}
                      {p.mortgaged && <div style={{ color: '#ff6666', fontSize: 5, fontWeight: 600 }}>MORTGAGED</div>}
                    </div>
                  </div>
                );
              })}
              {Object.values(gs.properties).filter(p => p.owner === showPlayerPanel).length === 0 && (
                <div style={{ color: '#555', fontSize: 11, padding: '8px 0' }}>No properties yet</div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {eventMsg && (
          <motion.div key="event" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{ position: 'absolute', top: 44, left: '50%', transform: 'translateX(-50%)', zIndex: 100, background: 'rgba(233,69,96,0.9)', borderRadius: 8, padding: '6px 16px', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap', pointerEvents: 'none' }}>
            {eventMsg}
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 0, position: 'relative', paddingTop: 8 }}>
        {hasPlayers && <MonopolyBoard tokens={allTokens} playerTokens={playerTokens} stepAnim={stepAnim} onStepAnimDone={handleStepAnimDone} totalPlayers={gs.players.length} kismatRemaining={gs.kismatRemaining} jugaadRemaining={gs.jugaadRemaining} housesRemaining={gs.housesRemaining} hotelsRemaining={gs.hotelsRemaining} propertyBuildings={propertyBuildings} propertyOwners={propertyOwners} />}
      </div>

      {/* Unified Property Popup */}
      <AnimatePresence>
        {selectedPropInfo && selectedPropForPopup && (
          <motion.div key="prop-popup" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            style={{ position: 'absolute', bottom: 220, left: '50%', transform: 'translateX(-50%)', zIndex: 50, background: '#16213e', borderRadius: 8, border: '1px solid #333', padding: '10px 14px', minWidth: 260, maxWidth: 320, fontSize: 11 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <div style={{ fontWeight: 700, fontSize: 13 }}>{selectedPropInfo.name}</div>
              <button onClick={() => setSelectedPropForPopup(null)} style={{ padding: '2px 8px', borderRadius: 4, border: 'none', background: '#333', color: '#aaa', cursor: 'pointer', fontSize: 12 }}>✕</button>
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 6, fontSize: 10, color: '#888' }}>
              <span>₹{selectedPropInfo.price}</span>
              {selectedPropInfo.houseCost > 0 && <span>🏠 ₹{selectedPropInfo.houseCost}</span>}
              {selectedPropInfo.mortgageValue > 0 && <span>🔒 ₹{selectedPropInfo.mortgageValue}</span>}
              {selectedPropInfo.mortgaged && <span style={{ color: '#ff8c00' }}>Mortgaged</span>}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 6 }}>
              {gs.validActions.includes('BUILD_BUNGALOW') && selectedPropInfo.houses < 4 && (
                <button onClick={handleBuildBungalow} style={{ padding: '5px 10px', borderRadius: 5, border: 'none', background: '#4CAF50', color: '#fff', cursor: 'pointer', fontSize: 10 }}>🏠 Build</button>
              )}
              {gs.validActions.includes('BUILD_VILLA') && selectedPropInfo.houses === 4 && (
                <button onClick={handleBuildVilla} style={{ padding: '5px 10px', borderRadius: 5, border: 'none', background: '#F44336', color: '#fff', cursor: 'pointer', fontSize: 10 }}>💒 Villa</button>
              )}
              {gs.validActions.includes('SELL_BUNGALOW') && selectedPropInfo.houses > 0 && selectedPropInfo.houses < 5 && (
                <button onClick={handleSellBungalow} style={{ padding: '5px 10px', borderRadius: 5, border: '1px solid #999', background: 'transparent', color: '#999', cursor: 'pointer', fontSize: 10 }}>Sell</button>
              )}
              {!selectedPropInfo.mortgaged && selectedPropInfo.mortgageValue > 0 && selectedPropInfo.houses === 0 && gs.validActions.includes('MORTGAGE') && (
                <button onClick={handleMortgage} style={{ padding: '5px 10px', borderRadius: 5, border: '1px solid #ff8c00', background: 'transparent', color: '#ff8c00', cursor: 'pointer', fontSize: 10 }}>🔒 Mortgage</button>
              )}
              {selectedPropInfo.mortgaged && gs.validActions.includes('UNMORTGAGE') && (
                <button onClick={handleUnmortgage} style={{ padding: '5px 10px', borderRadius: 5, border: '1px solid #4CAF50', background: 'transparent', color: '#4CAF50', cursor: 'pointer', fontSize: 10 }}>🔓 Unmortgage</button>
              )}
            </div>
            {/* History */}
            {propertyHistory.length > 0 && (
              <div style={{ borderTop: '1px solid #333', paddingTop: 4, marginTop: 4, maxHeight: 60, overflow: 'auto' }}>
                <div style={{ fontSize: 9, color: '#555', marginBottom: 2 }}>History</div>
                {propertyHistory.map((e: any, i: number) => (
                  <div key={i} style={{ fontSize: 9, color: '#777' }}>
                    {e.type === 'BOUGHT_PROPERTY' && `Bought for ₹${e.amount}`}
                    {e.type === 'BUNGALOW_BUILT' && `Built bungalow`}
                    {e.type === 'VILLA_BUILT' && `Built villa`}
                    {e.type === 'BUNGALOW_SOLD' && `Sold bungalow`}
                    {e.type === 'VILLA_SOLD' && `Sold villa`}
                    {e.type === 'PROPERTY_MORTGAGED' && `Mortgaged`}
                    {e.type === 'PROPERTY_UNMORTGAGED' && `Unmortgaged`}
                    {e.type === 'PAID_RENT' && e.propertyIndex === selectedPropInfo.index && `Rent paid ₹${e.amount}`}
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action buttons */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '6px 12px', flexShrink: 0, flexWrap: 'wrap', background: 'rgba(0,0,0,0.2)' }}>
        {canRoll && !canPayGhoos && !canUseSifarish && (
          <button onClick={handleRoll} style={{ padding: '8px 20px', fontSize: 14, fontWeight: 700, borderRadius: 8, border: 'none', background: '#e94560', color: '#fff', cursor: 'pointer' }}>🎲 Roll</button>
        )}
        {canPayGhoos && (
          <button onClick={handlePayGhoos} style={{ padding: '8px 16px', fontSize: 12, fontWeight: 600, borderRadius: 8, border: 'none', background: '#FF8C00', color: '#fff', cursor: 'pointer' }}>💸 Pay Ghoos ₹50</button>
        )}
        {canUseSifarish && (
          <button onClick={handleUseSifarish} style={{ padding: '8px 16px', fontSize: 12, fontWeight: 600, borderRadius: 8, border: 'none', background: '#9C27B0', color: '#fff', cursor: 'pointer' }}>🤝 Use Sifarish</button>
        )}
        {canBuy && <button onClick={handleBuy} style={{ padding: '8px 20px', fontSize: 14, fontWeight: 700, borderRadius: 8, border: 'none', background: '#4CAF50', color: '#fff', cursor: 'pointer' }}>Buy ₹{getSpaceInfo(gs.landedIndex ?? 0)?.price || 0}</button>}
        {canDecline && <button onClick={handleDecline} style={{ padding: '8px 20px', fontSize: 14, fontWeight: 600, borderRadius: 8, border: '1px solid #999', background: 'transparent', color: '#999', cursor: 'pointer' }}>Decline</button>}
        {canEndTurn && <button onClick={handleEndTurn} style={{ padding: '8px 20px', fontSize: 14, fontWeight: 600, borderRadius: 8, border: '1px solid #e94560', background: 'transparent', color: '#e94560', cursor: 'pointer' }}>End Turn</button>}
        {canBazaar && !gs.validActions.includes('BUY_PROPERTY') && (
          <button onClick={() => setShowBazaar(true)} style={{ padding: '8px 16px', fontSize: 12, fontWeight: 600, borderRadius: 8, border: '1px solid #fbbf24', background: 'transparent', color: '#fbbf24', cursor: 'pointer' }}>🤝 Bazaar</button>
        )}
        {!isMyTurn && gs.winner === null && gs.players.length > 0 && (
          <div style={{ fontSize: 11, color: '#888' }}>Waiting for {playerNames[gs.currentPlayer] || PLAYER_NAMES[gs.currentPlayer % PLAYER_NAMES.length] || `P${gs.currentPlayer}`}...</div>
        )}
        {gs.diceTotal !== null && <div style={{ fontSize: 11, color: '#aaa' }}>🎲 {gs.dice?.[0] ?? '?'} + {gs.dice?.[1] ?? '?'} = {gs.diceTotal}</div>}
      </div>

      <Dice ref={diceRef} />

      <GameLog events={gs.eventLog} playerNames={playerNames} currentPlayer={gs.currentPlayer} />

      <div style={{ position: 'relative', zIndex: 20, overflow: 'visible', background: 'rgba(22,33,62,0.4)', flexShrink: 0 }}>
        <PropertyFan cards={myPropertyCards} selectedCardIndex={selectedFanCard} onSelectCard={handleFanCardTap} disabled={!isMyTurn} />
      </div>

      {/* Auction Modal */}
      <AnimatePresence>
        {isAuctionActive && gs.interaction && (
          <AuctionModal
            auction={gs.interaction}
            playerIndex={playerIndex}
            playerNames={playerNames}
            onBid={handleAuctionBid}
            onPass={handleAuctionPass}
          />
        )}
      </AnimatePresence>

      {/* Bazaar Modal */}
      <AnimatePresence>
        {(showBazaar || isTradeActive) && (
          <BazaarModal
            playerIndex={playerIndex}
            players={gs.players}
            properties={gs.properties}
            playerNames={playerNames}
            interaction={gs.interaction}
            onProposeTrade={handleProposeTrade}
            onAcceptTrade={handleAcceptTrade}
            onRejectTrade={handleRejectTrade}
            onClose={() => {
              if (!isTradeActive) setShowBazaar(false);
            }}
          />
        )}
      </AnimatePresence>

      {/* Card draw popup */}
      <AnimatePresence>
        {showCard && (
          <motion.div key="card" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, zIndex: 950, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', cursor: 'pointer' }}
            onClick={() => setShowCard(null)}>
              <motion.div initial={{ scale: 0.5, rotate: -10 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0.5, rotate: 10 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                onClick={e => e.stopPropagation()}
                style={{ borderRadius: 16, overflow: 'hidden', maxWidth: 340, boxShadow: '0 12px 48px rgba(0,0,0,0.6)', position: 'relative' }}>
                {/* Card Art */}
                <img src={`/art/monopoly/${(showCard.type === 'kismat' ? KISMAT_ART_IDS : JUGAAD_ART_IDS)[showCard.cardIndex ?? 0]}_001.webp`}
                  alt={showCard.text}
                  style={{ width: '100%', height: 280, objectFit: 'cover', display: 'block' }}
                  onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                {/* Overlay text */}
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '16px 20px',
                  background: 'linear-gradient(transparent, rgba(0,0,0,0.85))' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 4, color: showCard.type === 'kismat' ? '#FF8C00' : '#4CAF50', textTransform: 'uppercase', letterSpacing: 1 }}>
                    {showCard.type === 'kismat' ? '✨ Kismat' : '💡 Jugaad'}
                  </div>
                  <div style={{ fontSize: 14, color: '#fff', lineHeight: 1.4, fontWeight: 600 }}>{showCard.text}</div>
                </div>
                <button onClick={() => setShowCard(null)}
                  style={{ position: 'absolute', top: 8, right: 8, width: 28, height: 28, borderRadius: '50%', border: 'none', background: 'rgba(0,0,0,0.5)', color: '#fff', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  ✕
                </button>
              </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Rent popup */}
      <AnimatePresence>
        {rentPopup && (
          <motion.div key="rent" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            style={{ position: 'fixed', bottom: 260, left: '50%', transform: 'translateX(-50%)', zIndex: 800, background: '#1a1a2e', border: '1px solid #e94560', borderRadius: 12, padding: '16px 24px', minWidth: 240, textAlign: 'center', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
            <div style={{ fontSize: 13, color: '#e94560', fontWeight: 700, marginBottom: 4 }}>💰 Rent Due!</div>
            <div style={{ fontSize: 15, color: '#fff', fontWeight: 600, marginBottom: 4 }}>₹{rentPopup.amount}</div>
            <div style={{ fontSize: 11, color: '#aaa', marginBottom: 10 }}>for {rentPopup.propertyName} → {playerNames[rentPopup.toPlayer] || PLAYER_NAMES[rentPopup.toPlayer % PLAYER_NAMES.length]}</div>
            <button onClick={() => setRentPopup(null)} style={{ padding: '8px 28px', borderRadius: 8, border: 'none', background: '#e94560', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
              Pay Rent
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showBankrupt && (
          <motion.div key="bankrupt" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}
            style={{ position: 'fixed', inset: 0, zIndex: 900, pointerEvents: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ fontSize: 48, fontWeight: 900, color: '#ff0000', textShadow: '0 0 40px #ff0000', fontFamily: 'monospace' }}>💀 BANKRUPT!</div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showWinner && (
          <motion.div key="winner" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}
            style={{ position: 'fixed', inset: 0, zIndex: 999, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.8)' }}>
            <div style={{ fontSize: 60, marginBottom: 16 }}>🏆</div>
            <h2 style={{ color: '#fbbf24', margin: '0 0 8px', fontSize: 28 }}>
              {gs.winner === playerIndex ? 'You Win!' : `${playerNames[gs.winner!] || PLAYER_NAMES[gs.winner! % PLAYER_NAMES.length] || `P${gs.winner!}`} Wins!`}
            </h2>
            <button onClick={handleRematch} style={{ padding: '12px 32px', borderRadius: 8, border: 'none', background: '#e94560', color: '#fff', fontSize: 16, fontWeight: 600, cursor: 'pointer' }}>🔄 Rematch</button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
