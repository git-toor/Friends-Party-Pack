export type SpaceType = 'property' | 'railroad' | 'utility' | 'tax' | 'chance' | 'cc' | 'go' | 'jail' | 'free_parking' | 'go_to_jail';
export type TurnPhase = 'waiting_for_roll' | 'rolling_dice' | 'waiting_for_action' | 'turn_end';

export interface SpaceConfig {
  index: number; name: string; type: SpaceType;
  group?: number; price?: number; rent?: number[];
  houseCost?: number; mortgageValue?: number; taxAmount?: number;
}

export const BOARD: SpaceConfig[] = [
  { index: 0, name: 'GO', type: 'go' },
  { index: 1, name: 'Chandni Chowk', type: 'property', group: 0, price: 60, rent: [2, 10, 30, 90, 160, 250], houseCost: 50, mortgageValue: 30 },
  { index: 2, name: 'Jugaad', type: 'cc' },
  { index: 3, name: 'Hazratganj', type: 'property', group: 0, price: 60, rent: [4, 20, 60, 180, 320, 450], houseCost: 50, mortgageValue: 30 },
  { index: 4, name: 'Income Tax', type: 'tax', taxAmount: 200 },
  { index: 5, name: 'Vande Bharat Exp', type: 'railroad', price: 200, mortgageValue: 100 },
  { index: 6, name: 'Ghat Road', type: 'property', group: 1, price: 100, rent: [6, 30, 90, 270, 400, 550], houseCost: 50, mortgageValue: 50 },
  { index: 7, name: 'Kismat', type: 'chance' },
  { index: 8, name: 'MI Road', type: 'property', group: 1, price: 100, rent: [6, 30, 90, 270, 400, 550], houseCost: 50, mortgageValue: 50 },
  { index: 9, name: 'Law Garden', type: 'property', group: 1, price: 120, rent: [8, 40, 100, 300, 450, 600], houseCost: 50, mortgageValue: 60 },
  { index: 10, name: 'Jail', type: 'jail' },
  { index: 11, name: 'Mall Road', type: 'property', group: 2, price: 140, rent: [10, 50, 150, 450, 625, 750], houseCost: 100, mortgageValue: 70 },
  { index: 12, name: 'Water Supply', type: 'utility', price: 150, mortgageValue: 75 },
  { index: 13, name: 'Bapu Bazaar', type: 'property', group: 2, price: 140, rent: [10, 50, 150, 450, 625, 750], houseCost: 100, mortgageValue: 70 },
  { index: 14, name: 'Lake Pichola', type: 'property', group: 2, price: 160, rent: [12, 60, 180, 500, 700, 900], houseCost: 100, mortgageValue: 80 },
  { index: 15, name: 'Rajdhani Exp', type: 'railroad', price: 200, mortgageValue: 100 },
  { index: 16, name: 'Calangute Bch', type: 'property', group: 3, price: 180, rent: [14, 70, 200, 550, 750, 950], houseCost: 100, mortgageValue: 90 },
  { index: 17, name: 'Jugaad', type: 'cc' },
  { index: 18, name: 'White Town', type: 'property', group: 3, price: 180, rent: [14, 70, 200, 550, 750, 950], houseCost: 100, mortgageValue: 90 },
  { index: 19, name: 'Rock Beach', type: 'property', group: 3, price: 200, rent: [16, 80, 220, 600, 800, 1000], houseCost: 100, mortgageValue: 100 },
  { index: 20, name: 'Free Parking', type: 'free_parking' },
  { index: 21, name: 'MG Road', type: 'property', group: 4, price: 220, rent: [18, 90, 250, 700, 875, 1050], houseCost: 150, mortgageValue: 110 },
  { index: 22, name: 'Kismat', type: 'chance' },
  { index: 23, name: 'Marina Beach', type: 'property', group: 4, price: 220, rent: [18, 90, 250, 700, 875, 1050], houseCost: 150, mortgageValue: 110 },
  { index: 24, name: 'Banjara Hills', type: 'property', group: 4, price: 240, rent: [20, 100, 300, 750, 925, 1100], houseCost: 150, mortgageValue: 120 },
  { index: 25, name: 'Shatabdi Exp', type: 'railroad', price: 200, mortgageValue: 100 },
  { index: 26, name: 'Park Street', type: 'property', group: 5, price: 260, rent: [22, 110, 330, 800, 975, 1150], houseCost: 150, mortgageValue: 130 },
  { index: 27, name: 'FC Road', type: 'property', group: 5, price: 260, rent: [22, 110, 330, 800, 975, 1150], houseCost: 150, mortgageValue: 130 },
  { index: 28, name: 'Electricity Bd', type: 'utility', price: 150, mortgageValue: 75 },
  { index: 29, name: 'SG Highway', type: 'property', group: 5, price: 280, rent: [24, 120, 360, 850, 1025, 1200], houseCost: 150, mortgageValue: 140 },
  { index: 30, name: 'Go To Jail', type: 'go_to_jail' },
  { index: 31, name: 'Bandra West', type: 'property', group: 6, price: 300, rent: [26, 130, 390, 900, 1100, 1275], houseCost: 200, mortgageValue: 150 },
  { index: 32, name: 'Connaught Pl', type: 'property', group: 6, price: 300, rent: [26, 130, 390, 900, 1100, 1275], houseCost: 200, mortgageValue: 150 },
  { index: 33, name: 'Jugaad', type: 'cc' },
  { index: 34, name: 'Cyber Hub', type: 'property', group: 6, price: 320, rent: [28, 150, 450, 1000, 1200, 1400], houseCost: 200, mortgageValue: 160 },
  { index: 35, name: 'Tejas Exp', type: 'railroad', price: 200, mortgageValue: 100 },
  { index: 36, name: 'Kismat', type: 'chance' },
  { index: 37, name: 'Marine Drive', type: 'property', group: 7, price: 350, rent: [35, 175, 500, 1100, 1300, 1500], houseCost: 200, mortgageValue: 175 },
  { index: 38, name: 'Luxury Tax', type: 'tax', taxAmount: 100 },
  { index: 39, name: 'Altamount Rd', type: 'property', group: 7, price: 400, rent: [50, 200, 600, 1400, 1700, 2000], houseCost: 200, mortgageValue: 200 },
];

export const RAILROAD_INDICES = [5, 15, 25, 35];
export const UTILITY_INDICES = [12, 28];
const JAIL_POSITION = 10;
const GO_SALARY = 200;
const STARTING_MONEY = 1500;
const TOTAL_HOUSES = 32;
const TOTAL_HOTELS = 12;

export const GROUP_COLORS: Record<number, string> = {
  0: '#8B4513', 1: '#87CEEB', 2: '#FF69B4', 3: '#FF8C00',
  4: '#FF0000', 5: '#FFD700', 6: '#006400', 7: '#00008B',
};

export interface PlayerState {
  money: number; position: number; inJail: boolean;
  jailTurns: number; jailFreeCards: number; bankrupt: boolean;
}

export interface PropertyState {
  owner: number | null; houses: number; mortgaged: boolean;
}

export interface GameState {
  players: PlayerState[]; properties: PropertyState[];
  currentPlayer: number; phase: TurnPhase;
  dice: [number, number] | null; diceTotal: number | null;
  doublesCount: number; rolledBy: number | null; rollId: string | null;
  lastAction: string | null; landedIndex: number | null;
  winner: number | null;
  housesRemaining: number; hotelsRemaining: number;
  _sv: number;
}

export type GameActionType = 'ROLL_DICE' | 'CONFIRM_DICE' | 'BUY_PROPERTY' | 'DECLINE_PROPERTY' | 'END_TURN'
  | 'PAY_GHOOS' | 'USE_SIFARISH_CARD'
  | 'BUILD_BUNGALOW' | 'SELL_BUNGALOW' | 'BUILD_VILLA' | 'SELL_VILLA';

export interface GameAction {
  type: GameActionType;
  payload?: { rollId?: string; values?: [number, number]; propertyIndex?: number };
}

export interface GameEvent {
  type: 'PLAYER_MOVED' | 'PASSED_GO' | 'BOUGHT_PROPERTY' | 'PAID_RENT' | 'PAID_TAX'
    | 'WENT_TO_JAIL' | 'BANKRUPT' | 'PLAYER_WON' | 'ROLLED_DOUBLES' | 'THREE_DOUBLES'
    | 'TURN_ENDED' | 'DREW_CARD' | 'CARD_EFFECT' | 'BUNGALOW_BUILT' | 'VILLA_BUILT'
    | 'BUNGALOW_SOLD' | 'VILLA_SOLD' | 'GHOOS_PAID' | 'SIFARISH_USED';
  playerIndex: number;
  amount?: number; toPlayer?: number; propertyIndex?: number;
  from?: number; to?: number;
  cardType?: 'kismat' | 'jugaad'; cardIndex?: number; cardText?: string;
}

export interface GameResult {
  state: GameState; valid: boolean; error?: string;
  events?: GameEvent[]; diceValue?: [number, number]; diceTotal?: number;
  rollId?: string; validActions?: GameActionType[];
  drewCard?: { type: 'kismat' | 'jugaad'; text: string };
}

// ─── Card Decks ────────────────────────────────────────

interface Card {
  id: number; text: string;
  type: 'money' | 'move' | 'jail' | 'repairs' | 'collect_from_players' | 'jail_card';
  amount?: number; targetPosition?: number;
  perHouse?: number; perHotel?: number;
}

const KISMAT_DECK: Card[] = [
  { id: 0, text: 'Advance to GO. Collect ₹200', type: 'move', targetPosition: 0 },
  { id: 1, text: 'Advance to MG Road, Bengaluru', type: 'move', targetPosition: 21 },
  { id: 2, text: 'Advance to Mall Road, Shimla', type: 'move', targetPosition: 11 },
  { id: 3, text: 'Advance to Vande Bharat Express', type: 'move', targetPosition: 5 },
  { id: 4, text: 'Advance to nearest Utility', type: 'move' }, // nearest utility
  { id: 5, text: 'Advance to nearest Express Train', type: 'move' }, // nearest RR
  { id: 6, text: 'Bank pays you dividend of ₹50', type: 'money', amount: 50 },
  { id: 7, text: 'GO TO JAIL', type: 'jail' },
  { id: 8, text: 'Make general repairs on all your property. ₹25 per Bungalow, ₹100 per Villa', type: 'repairs', perHouse: 25, perHotel: 100 },
  { id: 9, text: 'Pay poor tax of ₹15', type: 'money', amount: -15 },
  { id: 10, text: 'Take a trip to Rajdhani Express', type: 'move', targetPosition: 15 },
  { id: 11, text: 'Take a walk on Marine Drive', type: 'move', targetPosition: 37 },
  { id: 12, text: 'You have been elected Sarpanch. Pay each player ₹50', type: 'collect_from_players', amount: 50 },
  { id: 13, text: 'Your building loan matures. Collect ₹150', type: 'money', amount: 150 },
  { id: 14, text: 'You won a crossword competition. Collect ₹100', type: 'money', amount: 100 },
  { id: 15, text: 'Get out of Jail Free (Sifarish Card)', type: 'jail_card' },
];

const JUGAAD_DECK: Card[] = [
  { id: 0, text: 'Advance to GO. Collect ₹200', type: 'move', targetPosition: 0 },
  { id: 1, text: 'Bank error in your favor. Collect ₹200', type: 'money', amount: 200 },
  { id: 2, text: "Doctor's fee. Pay ₹50", type: 'money', amount: -50 },
  { id: 3, text: 'From sale of stock you get ₹50', type: 'money', amount: 50 },
  { id: 4, text: 'Get out of Jail Free (Sifarish Card)', type: 'jail_card' },
  { id: 5, text: 'GO TO JAIL', type: 'jail' },
  { id: 6, text: 'Grand opera night. Collect ₹50 from each player', type: 'collect_from_players', amount: 50 },
  { id: 7, text: 'Holiday fund matures. Collect ₹100', type: 'money', amount: 100 },
  { id: 8, text: 'Income tax refund. Collect ₹20', type: 'money', amount: 20 },
  { id: 9, text: 'Life insurance matures. Collect ₹100', type: 'money', amount: 100 },
  { id: 10, text: 'Hospital fees. Pay ₹100', type: 'money', amount: -100 },
  { id: 11, text: 'School fees. Pay ₹50', type: 'money', amount: -50 },
  { id: 12, text: 'Consultancy fee. Collect ₹25', type: 'money', amount: 25 },
  { id: 13, text: 'You are assessed for street repairs. ₹40 per Bungalow, ₹115 per Villa', type: 'repairs', perHouse: 40, perHotel: 115 },
  { id: 14, text: 'You won second prize in a beauty contest. Collect ₹10', type: 'money', amount: 10 },
  { id: 15, text: 'You inherit ₹100', type: 'money', amount: 100 },
];

export function shuffleDeck<T>(deck: T[]): T[] {
  const d = [...deck];
  for (let i = d.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [d[i], d[j]] = [d[j], d[i]];
  }
  return d;
}

let kismatDrawOrder: Card[] | null = null;
let jugaadDrawOrder: Card[] | null = null;
let kismatIndex = 0;
let jugaadIndex = 0;

function resetCardDecks(): void {
  kismatDrawOrder = shuffleDeck(KISMAT_DECK);
  jugaadDrawOrder = shuffleDeck(JUGAAD_DECK);
  kismatIndex = 0;
  jugaadIndex = 0;
}

function drawKismat(): Card {
  if (!kismatDrawOrder || kismatIndex >= kismatDrawOrder.length) {
    kismatDrawOrder = shuffleDeck(KISMAT_DECK);
    kismatIndex = 0;
  }
  return kismatDrawOrder[kismatIndex++];
}

function drawJugaad(): Card {
  if (!jugaadDrawOrder || jugaadIndex >= jugaadDrawOrder.length) {
    jugaadDrawOrder = shuffleDeck(JUGAAD_DECK);
    jugaadIndex = 0;
  }
  return jugaadDrawOrder[jugaadIndex++];
}

function findNearestRailroad(state: GameState, playerIndex: number): number {
  const pos = state.players[playerIndex].position;
  let nearest = RAILROAD_INDICES[0];
  let minDist = 40;
  for (const rr of RAILROAD_INDICES) {
    const dist = (rr - pos + 40) % 40;
    if (dist > 0 && dist < minDist) { minDist = dist; nearest = rr; }
  }
  return nearest;
}

function findNearestUtility(state: GameState, playerIndex: number): number {
  const pos = state.players[playerIndex].position;
  let nearest = UTILITY_INDICES[0];
  let minDist = 40;
  for (const u of UTILITY_INDICES) {
    const dist = (u - pos + 40) % 40;
    if (dist > 0 && dist < minDist) { minDist = dist; nearest = u; }
  }
  return nearest;
}

function executeCard(state: GameState, playerIndex: number, card: Card): GameEvent[] {
  const events: GameEvent[] = [];
  const player = state.players[playerIndex];

  switch (card.type) {
    case 'money': {
      player.money += (card.amount || 0);
      if (card.amount! < 0) {
        events.push({ type: 'PAID_TAX', playerIndex, amount: -card.amount! });
      }
      events.push({ type: 'CARD_EFFECT', playerIndex, amount: card.amount, cardText: card.text });
      break;
    }
    case 'move': {
      let targetPos = card.targetPosition!;
      if (card.id === 4) targetPos = findNearestUtility(state, playerIndex); // Kismat #4
      if (card.id === 5) targetPos = findNearestRailroad(state, playerIndex); // Kismat #5
      const oldPos = player.position;
      if (targetPos <= oldPos) {
        player.money += GO_SALARY;
        events.push({ type: 'PASSED_GO', playerIndex, amount: GO_SALARY });
      }
      player.position = targetPos;
      events.push({ type: 'PLAYER_MOVED', playerIndex, from: oldPos, to: targetPos });
      events.push({ type: 'CARD_EFFECT', playerIndex, cardText: card.text });
      break;
    }
    case 'jail': {
      player.position = JAIL_POSITION;
      player.inJail = true;
      player.jailTurns = 0;
      events.push({ type: 'WENT_TO_JAIL', playerIndex, to: JAIL_POSITION });
      events.push({ type: 'CARD_EFFECT', playerIndex, cardText: card.text });
      break;
    }
    case 'repairs': {
      let cost = 0;
      for (let i = 0; i < state.properties.length; i++) {
        if (state.properties[i].owner === playerIndex) {
          if (state.properties[i].houses === 5) cost += (card.perHotel || 0);
          else if (state.properties[i].houses > 0) cost += (card.perHouse || 0) * state.properties[i].houses;
        }
      }
      player.money -= cost;
      events.push({ type: 'PAID_TAX', playerIndex, amount: cost });
      events.push({ type: 'CARD_EFFECT', playerIndex, cardText: card.text });
      break;
    }
    case 'collect_from_players': {
      const perPlayer = card.amount || 0;
      let collected = 0;
      for (let i = 0; i < state.players.length; i++) {
        if (i !== playerIndex && !state.players[i].bankrupt) {
          const c = Math.min(perPlayer, state.players[i].money);
          state.players[i].money -= c;
          collected += c;
        }
      }
      player.money += collected;
      events.push({ type: 'CARD_EFFECT', playerIndex, amount: collected, cardText: card.text });
      break;
    }
    case 'jail_card': {
      player.jailFreeCards++;
      events.push({ type: 'CARD_EFFECT', playerIndex, cardText: card.text });
      break;
    }
  }
  return events;
}

// ─── createGame ────────────────────────────────────────

export function createGame(playerCount: number, startingPlayer?: number): GameState {
  resetCardDecks();
  return {
    players: Array.from({ length: playerCount }, () => ({
      money: STARTING_MONEY, position: 0, inJail: false,
      jailTurns: 0, jailFreeCards: 0, bankrupt: false,
    })),
    properties: BOARD.map(() => ({ owner: null, houses: 0, mortgaged: false })),
    currentPlayer: startingPlayer ?? Math.floor(Math.random() * playerCount),
    phase: 'waiting_for_roll',
    dice: null, diceTotal: null, doublesCount: 0,
    rolledBy: null, rollId: null, lastAction: null, landedIndex: null,
    winner: null,
    housesRemaining: TOTAL_HOUSES,
    hotelsRemaining: TOTAL_HOTELS,
    _sv: 0,
  };
}

function bump(state: GameState): void { state._sv++; }

function advanceTurn(state: GameState): void {
  const total = state.players.length;
  let next = (state.currentPlayer + 1) % total;
  let attempts = 0;
  while (state.players[next]?.bankrupt && attempts < total) {
    next = (next + 1) % total;
    attempts++;
  }
  state.currentPlayer = next;
  state.phase = 'waiting_for_roll';
  state.dice = null; state.diceTotal = null; state.doublesCount = 0;
  state.rolledBy = null; state.rollId = null; state.lastAction = null; state.landedIndex = null;
}

function checkWinCondition(state: GameState): number | null {
  const activePlayers = state.players.filter(p => !p.bankrupt);
  if (activePlayers.length <= 1 && state.players.length > 1) {
    const winner = activePlayers[0];
    if (winner) return state.players.indexOf(winner);
  }
  return null;
}

function handleBankruptcy(state: GameState, playerIndex: number): GameEvent[] {
  const player = state.players[playerIndex];
  if (player.bankrupt) return [];
  if (player.money >= 0) return [];
  player.bankrupt = true;
  const events: GameEvent[] = [{ type: 'BANKRUPT', playerIndex }];
  for (let i = 0; i < state.properties.length; i++) {
    if (state.properties[i].owner === playerIndex) {
      state.properties[i].owner = null;
      if (state.properties[i].houses === 5) state.hotelsRemaining++;
      else state.housesRemaining += state.properties[i].houses;
      state.properties[i].houses = 0;
      state.properties[i].mortgaged = false;
    }
  }
  const winner = checkWinCondition(state);
  if (winner !== null) {
    state.winner = winner;
    events.push({ type: 'PLAYER_WON', playerIndex: winner });
  }
  return events;
}

function countOwnerRailroads(state: GameState, ownerIndex: number): number {
  return RAILROAD_INDICES.filter(i => state.properties[i].owner === ownerIndex).length;
}

function countOwnerUtilities(state: GameState, ownerIndex: number): number {
  return UTILITY_INDICES.filter(i => state.properties[i].owner === ownerIndex).length;
}

function computeRentAmount(state: GameState, propIndex: number, diceTotal: number): number {
  const prop = state.properties[propIndex];
  const space = BOARD[propIndex];
  const owner = prop.owner!;
  if (prop.mortgaged) return 0;
  if (space.type === 'railroad') return 25 * Math.pow(2, countOwnerRailroads(state, owner) - 1);
  if (space.type === 'utility') {
    const count = countOwnerUtilities(state, owner);
    return count === 1 ? 4 * diceTotal : 10 * diceTotal;
  }
  if (space.type === 'property') {
    if (prop.houses === 5) return space.rent![5]; // villa
    if (prop.houses > 0) return space.rent![prop.houses];
    const groupProps = BOARD.filter(s => s.group === space.group && s.type === 'property');
    const monopoly = groupProps.every(s => state.properties[s.index].owner === owner);
    return monopoly ? space.rent![0] * 2 : space.rent![0];
  }
  return 0;
}

function payRent(state: GameState, playerIndex: number, propIndex: number): { amount: number; events: GameEvent[] } {
  const prop = state.properties[propIndex];
  const owner = prop.owner!;
  const diceTotal = state.diceTotal ?? 0;
  const amount = computeRentAmount(state, propIndex, diceTotal);
  state.players[playerIndex].money -= amount;
  state.players[owner].money += amount;
  return {
    amount,
    events: [{ type: 'PAID_RENT', playerIndex, amount, toPlayer: owner, propertyIndex: propIndex }],
  };
}

// ─── resolveLanding (Phase 2: draws cards) ────────────

function resolveLanding(state: GameState, playerIndex: number): GameEvent[] {
  const pos = state.players[playerIndex].position;
  const space = BOARD[pos];
  const prop = state.properties[pos];
  const events: GameEvent[] = [];
  state.landedIndex = pos;

  if (space.type === 'go_to_jail') {
    state.players[playerIndex].position = JAIL_POSITION;
    state.players[playerIndex].inJail = true;
    state.players[playerIndex].jailTurns = 0;
    state.phase = 'turn_end';
    state.lastAction = 'went_to_jail';
    events.push({ type: 'WENT_TO_JAIL', playerIndex, to: JAIL_POSITION });
    return events;
  }

  if (space.type === 'property' || space.type === 'railroad' || space.type === 'utility') {
    if (prop.owner === null) {
      state.phase = 'waiting_for_action';
      state.lastAction = 'can_buy';
    } else if (prop.owner === playerIndex) {
      state.phase = 'turn_end';
      state.lastAction = 'own_property';
    } else {
      const rentResult = payRent(state, playerIndex, pos);
      events.push(...rentResult.events);
      state.phase = 'turn_end';
      state.lastAction = 'paid_rent';
    }
    return events;
  }

  if (space.type === 'tax') {
    const amount = space.taxAmount!;
    state.players[playerIndex].money -= amount;
    state.phase = 'turn_end';
    state.lastAction = 'paid_tax';
    events.push({ type: 'PAID_TAX', playerIndex, amount });
    return events;
  }

  if (space.type === 'chance') {
    const card = drawKismat();
    state.lastAction = 'drew_kismat';
    events.push({ type: 'DREW_CARD', playerIndex, cardType: 'kismat', cardIndex: card.id, cardText: card.text });
    const cardEvents = executeCard(state, playerIndex, card);
    events.push(...cardEvents);
    state.phase = 'turn_end';
    state.lastAction = 'drew_kismat';
    return events;
  }

  if (space.type === 'cc') {
    const card = drawJugaad();
    state.lastAction = 'drew_jugaad';
    events.push({ type: 'DREW_CARD', playerIndex, cardType: 'jugaad', cardIndex: card.id, cardText: card.text });
    const cardEvents = executeCard(state, playerIndex, card);
    events.push(...cardEvents);
    state.phase = 'turn_end';
    state.lastAction = 'drew_jugaad';
    return events;
  }

  state.phase = 'turn_end';
  state.lastAction = 'no_action';
  return events;
}

// ─── Roll & Confirm ────────────────────────────────────

export function rollDice(state: GameState, playerIndex: number): GameResult {
  if (state.winner !== null) return { state, valid: false, error: 'Game over' };
  if (state.currentPlayer !== playerIndex) return { state, valid: false, error: 'Not your turn' };
  if (state.phase !== 'waiting_for_roll') return { state, valid: false, error: 'Cannot roll now' };
  if (state.players[playerIndex].bankrupt) return { state, valid: false, error: 'You are bankrupt' };
  const rollId = crypto.randomUUID();
  state.phase = 'rolling_dice';
  state.rolledBy = playerIndex;
  state.rollId = rollId;
  state.dice = null; state.diceTotal = null;
  bump(state);
  return { state, valid: true, rollId };
}

export function confirmDice(state: GameState, playerIndex: number, payload?: { rollId?: string; values?: [number, number] }): GameResult {
  if (state.winner !== null) return { state, valid: false, error: 'Game over' };
  if (state.currentPlayer !== playerIndex) return { state, valid: false, error: 'Not your turn' };
  if (state.phase !== 'rolling_dice') return { state, valid: false, error: 'No active dice roll' };
  if (payload?.rollId && payload.rollId !== state.rollId) return { state, valid: false, error: 'Stale roll' };
  const values = payload?.values;
  if (!values || values.length !== 2 || values[0] < 1 || values[0] > 6 || values[1] < 1 || values[1] > 6) {
    return { state, valid: false, error: 'Invalid dice values' };
  }

  state.dice = values;
  const total = values[0] + values[1];
  state.diceTotal = total;
  const isDoubles = values[0] === values[1];
  const player = state.players[playerIndex];
  const events: GameEvent[] = [];
  let escapedJailByDoubles = false;

  // ── Jail handling (Phase 2: full mechanics) ──
  if (player.inJail) {
    if (isDoubles) {
      player.inJail = false;
      player.jailTurns = 0;
      escapedJailByDoubles = true;
      // Move with the dice total (no re-roll for this double)
    } else {
      player.jailTurns++;
      if (player.jailTurns >= 3) {
        const payAmount = Math.min(50, player.money);
        player.money -= payAmount;
        player.inJail = false;
        player.jailTurns = 0;
        events.push({ type: 'PAID_TAX', playerIndex, amount: payAmount });
      } else {
        state.phase = 'turn_end';
        state.lastAction = 'stayed_in_jail';
        bump(state);
        return { state, valid: true, diceValue: values, diceTotal: total, events, validActions: ['END_TURN'] };
      }
    }
  }

  // ── Doubles tracking ──
  if (isDoubles && !escapedJailByDoubles) {
    state.doublesCount++;
    if (state.doublesCount >= 3) {
      events.push({ type: 'THREE_DOUBLES', playerIndex });
      player.position = JAIL_POSITION;
      player.inJail = true;
      player.jailTurns = 0;
      state.phase = 'turn_end';
      state.lastAction = 'three_doubles_jail';
      events.push({ type: 'WENT_TO_JAIL', playerIndex, to: JAIL_POSITION });
      bump(state);
      return { state, valid: true, diceValue: values, diceTotal: total, events, validActions: ['END_TURN'] };
    }
    events.push({ type: 'ROLLED_DOUBLES', playerIndex });
  } else if (!escapedJailByDoubles) {
    state.doublesCount = 0;
  }

  // ── Move player ──
  const oldPos = player.position;
  const newPos = (oldPos + total) % 40;
  player.position = newPos;
  events.push({ type: 'PLAYER_MOVED', playerIndex, from: oldPos, to: newPos });

  // ── Check passing GO ──
  if ((oldPos + total) >= 40 && oldPos !== 0) {
    player.money += GO_SALARY;
    events.push({ type: 'PASSED_GO', playerIndex, amount: GO_SALARY });
  }

  // ── Resolve landing ──
  const landingEvents = resolveLanding(state, playerIndex);
  events.push(...landingEvents);

  // ── Check bankruptcy ──
  const bankruptcyEvents = handleBankruptcy(state, playerIndex);
  events.push(...bankruptcyEvents);

  if (state.winner !== null) {
    bump(state);
    return { state, valid: true, diceValue: values, diceTotal: total, events, validActions: [] };
  }

  // ── Re-roll on doubles (unless escaped jail via doubles, waiting to buy, or ended up in jail from landing) ──
  if (isDoubles && !escapedJailByDoubles && state.doublesCount < 3
    && !player.inJail && state.lastAction !== 'can_buy') {
    state.phase = 'waiting_for_roll';
  }

  bump(state);
  const actions = getValidActions(state, playerIndex);
  return { state, valid: true, diceValue: values, diceTotal: total, events, validActions: actions };
}

// ─── Buy / Decline ─────────────────────────────────────

export function buyProperty(state: GameState, playerIndex: number): GameResult {
  if (state.winner !== null) return { state, valid: false, error: 'Game over' };
  if (state.currentPlayer !== playerIndex) return { state, valid: false, error: 'Not your turn' };
  if (state.phase !== 'waiting_for_action' || state.lastAction !== 'can_buy') return { state, valid: false, error: 'Cannot buy now' };
  if (state.landedIndex === null) return { state, valid: false, error: 'No property to buy' };
  const propIndex = state.landedIndex;
  const space = BOARD[propIndex];
  if (!space.price) return { state, valid: false, error: 'Not a purchasable space' };
  if (state.properties[propIndex].owner !== null) return { state, valid: false, error: 'Already owned' };
  const player = state.players[playerIndex];
  if (player.money < space.price) return { state, valid: false, error: 'Not enough money' };
  player.money -= space.price;
  state.properties[propIndex].owner = playerIndex;
  const events: GameEvent[] = [{ type: 'BOUGHT_PROPERTY', playerIndex, propertyIndex: propIndex, amount: space.price }];
  const bankruptcyEvents = handleBankruptcy(state, playerIndex);
  events.push(...bankruptcyEvents);
  if (state.winner !== null) { bump(state); return { state, valid: true, events, validActions: [] }; }
  state.lastAction = 'bought_property';
  if (state.doublesCount > 0 && state.doublesCount < 3) state.phase = 'waiting_for_roll';
  else state.phase = 'turn_end';
  bump(state);
  return { state, valid: true, events, validActions: getValidActions(state, playerIndex) };
}

export function declineProperty(state: GameState, playerIndex: number): GameResult {
  if (state.winner !== null) return { state, valid: false, error: 'Game over' };
  if (state.currentPlayer !== playerIndex) return { state, valid: false, error: 'Not your turn' };
  if (state.phase !== 'waiting_for_action' || state.lastAction !== 'can_buy') return { state, valid: false, error: 'Cannot decline now' };
  state.lastAction = 'declined_property';
  if (state.doublesCount > 0 && state.doublesCount < 3) state.phase = 'waiting_for_roll';
  else state.phase = 'turn_end';
  bump(state);
  return { state, valid: true, events: [], validActions: getValidActions(state, playerIndex) };
}

// ─── End Turn ──────────────────────────────────────────

export function endTurn(state: GameState, playerIndex: number): GameResult {
  if (state.winner !== null) return { state, valid: false, error: 'Game over' };
  if (state.currentPlayer !== playerIndex) return { state, valid: false, error: 'Not your turn' };
  if (state.phase !== 'turn_end') return { state, valid: false, error: 'Cannot end turn now' };
  const events: GameEvent[] = [{ type: 'TURN_ENDED', playerIndex }];
  advanceTurn(state);
  bump(state);
  return { state, valid: true, events };
}

// ─── Jail Actions (Phase 2) ────────────────────────────

export function payGhoos(state: GameState, playerIndex: number): GameResult {
  if (state.winner !== null) return { state, valid: false, error: 'Game over' };
  if (state.currentPlayer !== playerIndex) return { state, valid: false, error: 'Not your turn' };
  if (state.phase !== 'waiting_for_roll') return { state, valid: false, error: 'Cannot pay ghoos now' };
  const player = state.players[playerIndex];
  if (!player.inJail) return { state, valid: false, error: 'Not in jail' };
  if (player.money < 50) return { state, valid: false, error: 'Not enough money' };
  player.money -= 50;
  player.inJail = false;
  player.jailTurns = 0;
  const events: GameEvent[] = [{ type: 'GHOOS_PAID', playerIndex, amount: 50 }];
  bump(state);
  return { state, valid: true, events, validActions: ['ROLL_DICE'] };
}

export function useSifarishCard(state: GameState, playerIndex: number): GameResult {
  if (state.winner !== null) return { state, valid: false, error: 'Game over' };
  if (state.currentPlayer !== playerIndex) return { state, valid: false, error: 'Not your turn' };
  if (state.phase !== 'waiting_for_roll') return { state, valid: false, error: 'Cannot use Sifarish now' };
  const player = state.players[playerIndex];
  if (!player.inJail) return { state, valid: false, error: 'Not in jail' };
  if (player.jailFreeCards <= 0) return { state, valid: false, error: 'No Sifarish card' };
  player.jailFreeCards--;
  player.inJail = false;
  player.jailTurns = 0;
  const events: GameEvent[] = [{ type: 'SIFARISH_USED', playerIndex }];
  bump(state);
  return { state, valid: true, events, validActions: ['ROLL_DICE'] };
}

// ─── Building Actions (Phase 2) ────────────────────────

function getGroupProperties(group: number): number[] {
  return BOARD.filter(s => s.group === group && s.type === 'property').map(s => s.index);
}

export function buildBungalow(state: GameState, playerIndex: number, payload?: { propertyIndex?: number }): GameResult {
  if (state.winner !== null) return { state, valid: false, error: 'Game over' };
  if (state.phase !== 'turn_end' && state.phase !== 'waiting_for_roll') return { state, valid: false, error: 'Cannot build now' };
  if (state.currentPlayer !== playerIndex) return { state, valid: false, error: 'Not your turn' };
  const propIndex = payload?.propertyIndex;
  if (propIndex === undefined) return { state, valid: false, error: 'No property specified' };
  const prop = state.properties[propIndex];
  const space = BOARD[propIndex];
  if (space.type !== 'property') return { state, valid: false, error: 'Not a property' };
  if (prop.owner !== playerIndex) return { state, valid: false, error: 'Not your property' };
  if (prop.mortgaged) return { state, valid: false, error: 'Property is mortgaged' };
  if (state.housesRemaining <= 0) return { state, valid: false, error: 'No bungalows remaining' };
  if (prop.houses >= 4) return { state, valid: false, error: 'Max 4 bungalows (build villa instead)' };
  if (space.group === undefined) return { state, valid: false, error: 'No color group' };

  // Check monopoly
  const groupProps = getGroupProperties(space.group);
  if (!groupProps.every(i => state.properties[i].owner === playerIndex)) {
    return { state, valid: false, error: 'Must own entire color group' };
  }

  // Check even-building rule: all properties in group must have |houses[a] - houses[b]| <= 1
  // and the build target must be <= the min + 1
  const groupHouseCounts = groupProps.map(i => state.properties[i].houses);
  const min = Math.min(...groupHouseCounts);
  const targetCount = prop.houses;

  // Can only build if target house count <= min (or min+1 if you still have min-level)
  // Actually: you can only build on a property if it has no more houses than any other in the group
  if (targetCount > min) return { state, valid: false, error: 'Must build evenly across group' };

  // Check money
  const cost = space.houseCost!;
  if (state.players[playerIndex].money < cost) return { state, valid: false, error: 'Not enough money' };

  state.players[playerIndex].money -= cost;
  prop.houses++;
  state.housesRemaining--;
  const events: GameEvent[] = [{ type: 'BUNGALOW_BUILT', playerIndex, propertyIndex: propIndex, amount: cost }];
  bump(state);
  return { state, valid: true, events, validActions: getValidActions(state, playerIndex) };
}

export function sellBungalow(state: GameState, playerIndex: number, payload?: { propertyIndex?: number }): GameResult {
  if (state.winner !== null) return { state, valid: false, error: 'Game over' };
  if (state.currentPlayer !== playerIndex) return { state, valid: false, error: 'Not your turn' };
  const propIndex = payload?.propertyIndex;
  if (propIndex === undefined) return { state, valid: false, error: 'No property specified' };
  const prop = state.properties[propIndex];
  const space = BOARD[propIndex];
  if (space.type !== 'property') return { state, valid: false, error: 'Not a property' };
  if (prop.owner !== playerIndex) return { state, valid: false, error: 'Not your property' };
  if (prop.houses <= 0 || prop.houses >= 5) return { state, valid: false, error: 'No bungalows to sell' };
  const refund = Math.floor(space.houseCost! / 2);
  state.players[playerIndex].money += refund;
  prop.houses--;
  state.housesRemaining++;
  const events: GameEvent[] = [{ type: 'BUNGALOW_SOLD', playerIndex, propertyIndex: propIndex, amount: refund }];
  bump(state);
  return { state, valid: true, events, validActions: getValidActions(state, playerIndex) };
}

export function buildVilla(state: GameState, playerIndex: number, payload?: { propertyIndex?: number }): GameResult {
  if (state.winner !== null) return { state, valid: false, error: 'Game over' };
  if (state.currentPlayer !== playerIndex) return { state, valid: false, error: 'Not your turn' };
  const propIndex = payload?.propertyIndex;
  if (propIndex === undefined) return { state, valid: false, error: 'No property specified' };
  const prop = state.properties[propIndex];
  const space = BOARD[propIndex];
  if (space.type !== 'property') return { state, valid: false, error: 'Not a property' };
  if (prop.owner !== playerIndex) return { state, valid: false, error: 'Not your property' };
  if (prop.mortgaged) return { state, valid: false, error: 'Property is mortgaged' };
  if (state.hotelsRemaining <= 0) return { state, valid: false, error: 'No villas remaining' };
  if (prop.houses !== 4) return { state, valid: false, error: 'Need 4 bungalows first' };
  if (space.group === undefined) return { state, valid: false, error: 'No color group' };

  // Check all group properties have 4 bungalows
  const groupProps = getGroupProperties(space.group);
  if (!groupProps.every(i => state.properties[i].owner === playerIndex && state.properties[i].houses === 4)) {
    return { state, valid: false, error: 'All group properties must have 4 bungalows' };
  }

  // Cost = house cost (same as 1 bungalow)
  const cost = space.houseCost!;
  if (state.players[playerIndex].money < cost) return { state, valid: false, error: 'Not enough money' };

  state.players[playerIndex].money -= cost;
  prop.houses = 5; // 5 = villa
  state.hotelsRemaining--;
  state.housesRemaining += 4; // return 4 bungalows to bank
  const events: GameEvent[] = [{ type: 'VILLA_BUILT', playerIndex, propertyIndex: propIndex, amount: cost }];
  bump(state);
  return { state, valid: true, events, validActions: getValidActions(state, playerIndex) };
}

export function sellVilla(state: GameState, playerIndex: number, payload?: { propertyIndex?: number }): GameResult {
  if (state.winner !== null) return { state, valid: false, error: 'Game over' };
  if (state.currentPlayer !== playerIndex) return { state, valid: false, error: 'Not your turn' };
  const propIndex = payload?.propertyIndex;
  if (propIndex === undefined) return { state, valid: false, error: 'No property specified' };
  const prop = state.properties[propIndex];
  const space = BOARD[propIndex];
  if (space.type !== 'property') return { state, valid: false, error: 'Not a property' };
  if (prop.owner !== playerIndex) return { state, valid: false, error: 'Not your property' };
  if (prop.houses !== 5) return { state, valid: false, error: 'Not a villa' };
  const refund = Math.floor(space.houseCost! / 2);
  state.players[playerIndex].money += refund;
  prop.houses = 4;
  state.hotelsRemaining++;
  state.housesRemaining -= 4;
  const events: GameEvent[] = [{ type: 'VILLA_SOLD', playerIndex, propertyIndex: propIndex, amount: refund }];
  bump(state);
  return { state, valid: true, events, validActions: getValidActions(state, playerIndex) };
}

// ─── getValidActions ──────────────────────────────────

export function getValidActions(state: GameState, playerIndex: number): GameActionType[] {
  if (state.winner !== null) return [];
  if (state.currentPlayer !== playerIndex) return [];
  if (state.players[playerIndex]?.bankrupt) return [];
  const player = state.players[playerIndex];
  switch (state.phase) {
    case 'waiting_for_roll': {
      const actions: GameActionType[] = ['ROLL_DICE'];
      if (player.inJail && player.money >= 50) actions.push('PAY_GHOOS');
      if (player.inJail && player.jailFreeCards > 0) actions.push('USE_SIFARISH_CARD');
      return actions;
    }
    case 'waiting_for_action':
      return state.lastAction === 'can_buy' ? ['BUY_PROPERTY', 'DECLINE_PROPERTY'] : [];
    case 'turn_end':
      return ['END_TURN', 'BUILD_BUNGALOW', 'SELL_BUNGALOW', 'BUILD_VILLA', 'SELL_VILLA'];
    default:
      return [];
  }
}

// ─── handleAction ─────────────────────────────────────

export function handleAction(state: GameState, playerIndex: number, action: GameAction): GameResult {
  switch (action.type) {
    case 'ROLL_DICE': return rollDice(state, playerIndex);
    case 'CONFIRM_DICE': return confirmDice(state, playerIndex, action.payload);
    case 'BUY_PROPERTY': return buyProperty(state, playerIndex);
    case 'DECLINE_PROPERTY': return declineProperty(state, playerIndex);
    case 'END_TURN': return endTurn(state, playerIndex);
    case 'PAY_GHOOS': return payGhoos(state, playerIndex);
    case 'USE_SIFARISH_CARD': return useSifarishCard(state, playerIndex);
    case 'BUILD_BUNGALOW': return buildBungalow(state, playerIndex, action.payload);
    case 'SELL_BUNGALOW': return sellBungalow(state, playerIndex, action.payload);
    case 'BUILD_VILLA': return buildVilla(state, playerIndex, action.payload);
    case 'SELL_VILLA': return sellVilla(state, playerIndex, action.payload);
    default: return { state, valid: false, error: `Unknown action: ${(action as any).type}` };
  }
}

// ─── sanitizeState ────────────────────────────────────

export function sanitizeState(state: GameState, playerIndex: number) {
  const isMyTurn = playerIndex === state.currentPlayer;
  return {
    players: state.players,
    properties: state.properties,
    currentPlayer: state.currentPlayer,
    phase: state.phase,
    dice: state.dice, diceTotal: state.diceTotal,
    doublesCount: state.doublesCount,
    rolledBy: state.rolledBy, rollId: state.rollId,
    lastAction: state.lastAction, landedIndex: state.landedIndex,
    winner: state.winner,
    housesRemaining: state.housesRemaining,
    hotelsRemaining: state.hotelsRemaining,
    isMyTurn,
    validActions: isMyTurn ? getValidActions(state, playerIndex) : [],
    _sv: state._sv,
  };
}
