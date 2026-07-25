export type SpaceType = 'property' | 'railroad' | 'utility' | 'tax' | 'chance' | 'cc' | 'go' | 'jail' | 'free_parking' | 'go_to_jail';
export type TurnPhase = 'waiting_for_roll' | 'rolling_dice' | 'waiting_for_action' | 'turn_end';

export type PropertyId = 'chandni_chowk' | 'hazratganj' | 'ghat_road' | 'mi_road' | 'law_garden'
  | 'mall_road' | 'bapu_bazaar' | 'lake_pichola' | 'calangute' | 'white_town' | 'rock_beach'
  | 'mg_road' | 'marina_beach' | 'banjara_hills' | 'park_street' | 'fc_road' | 'sg_highway'
  | 'bandra_west' | 'connaught_place' | 'cyber_hub' | 'marine_drive' | 'altamount_road'
  | 'vande_bharat' | 'rajdhani' | 'shatabdi' | 'tejas'
  | 'water_supply' | 'electricity_board';

export type GroupId = 'brown' | 'light_blue' | 'pink' | 'orange' | 'red' | 'yellow' | 'green' | 'dark_blue';

export type SpaceId = PropertyId | 'go' | 'jugaad_1' | 'jugaad_2' | 'jugaad_3'
  | 'kismat_1' | 'kismat_2' | 'kismat_3' | 'income_tax' | 'luxury_tax'
  | 'jail' | 'free_parking' | 'go_to_jail';

export interface SpaceConfig {
  id: SpaceId;
  name: string; type: SpaceType;
  group?: GroupId; price?: number; rent?: number[];
  houseCost?: number; mortgageValue?: number; taxAmount?: number;
}

// ─── GAME_RULES ────────────────────────────────────

export const GAME_RULES = {
  passGoSalary: 200,
  startMoney: 1500,
  jailFine: 50,
  jailPosition: 10,
  maxHouses: 32,
  maxHotels: 12,
  maxBungalowPerProperty: 4,
  incomeTax: 200,
  luxuryTax: 100,
  mortgageInterestRate: 0.10,
  auctionMinBid: 1,
  maxEventLog: 300,
} as const;

// ─── Board Data ────────────────────────────────────

export const BOARD: Record<SpaceId, SpaceConfig> = {
  go: { id: 'go', name: 'GO', type: 'go' },
  chandni_chowk: { id: 'chandni_chowk', name: 'Chandni Chowk', type: 'property', group: 'brown', price: 60, rent: [2, 10, 30, 90, 160, 250], houseCost: 50, mortgageValue: 30 },
  jugaad_1: { id: 'jugaad_1', name: 'Jugaad', type: 'cc' },
  hazratganj: { id: 'hazratganj', name: 'Hazratganj', type: 'property', group: 'brown', price: 60, rent: [4, 20, 60, 180, 320, 450], houseCost: 50, mortgageValue: 30 },
  income_tax: { id: 'income_tax', name: 'Income Tax', type: 'tax', taxAmount: 200 },
  vande_bharat: { id: 'vande_bharat', name: 'Vande Bharat Exp', type: 'railroad', price: 200, mortgageValue: 100 },
  ghat_road: { id: 'ghat_road', name: 'Ghat Road', type: 'property', group: 'light_blue', price: 100, rent: [6, 30, 90, 270, 400, 550], houseCost: 50, mortgageValue: 50 },
  kismat_1: { id: 'kismat_1', name: 'Kismat', type: 'chance' },
  mi_road: { id: 'mi_road', name: 'MI Road', type: 'property', group: 'light_blue', price: 100, rent: [6, 30, 90, 270, 400, 550], houseCost: 50, mortgageValue: 50 },
  law_garden: { id: 'law_garden', name: 'Law Garden', type: 'property', group: 'light_blue', price: 120, rent: [8, 40, 100, 300, 450, 600], houseCost: 50, mortgageValue: 60 },
  jail: { id: 'jail', name: 'Jail', type: 'jail' },
  mall_road: { id: 'mall_road', name: 'Mall Road', type: 'property', group: 'pink', price: 140, rent: [10, 50, 150, 450, 625, 750], houseCost: 100, mortgageValue: 70 },
  water_supply: { id: 'water_supply', name: 'Water Supply', type: 'utility', price: 150, mortgageValue: 75 },
  bapu_bazaar: { id: 'bapu_bazaar', name: 'Bapu Bazaar', type: 'property', group: 'pink', price: 140, rent: [10, 50, 150, 450, 625, 750], houseCost: 100, mortgageValue: 70 },
  lake_pichola: { id: 'lake_pichola', name: 'Lake Pichola', type: 'property', group: 'pink', price: 160, rent: [12, 60, 180, 500, 700, 900], houseCost: 100, mortgageValue: 80 },
  rajdhani: { id: 'rajdhani', name: 'Rajdhani Exp', type: 'railroad', price: 200, mortgageValue: 100 },
  calangute: { id: 'calangute', name: 'Calangute Bch', type: 'property', group: 'orange', price: 180, rent: [14, 70, 200, 550, 750, 950], houseCost: 100, mortgageValue: 90 },
  jugaad_2: { id: 'jugaad_2', name: 'Jugaad', type: 'cc' },
  white_town: { id: 'white_town', name: 'White Town', type: 'property', group: 'orange', price: 180, rent: [14, 70, 200, 550, 750, 950], houseCost: 100, mortgageValue: 90 },
  rock_beach: { id: 'rock_beach', name: 'Rock Beach', type: 'property', group: 'orange', price: 200, rent: [16, 80, 220, 600, 800, 1000], houseCost: 100, mortgageValue: 100 },
  free_parking: { id: 'free_parking', name: 'Free Parking', type: 'free_parking' },
  mg_road: { id: 'mg_road', name: 'MG Road', type: 'property', group: 'red', price: 220, rent: [18, 90, 250, 700, 875, 1050], houseCost: 150, mortgageValue: 110 },
  kismat_2: { id: 'kismat_2', name: 'Kismat', type: 'chance' },
  marina_beach: { id: 'marina_beach', name: 'Marina Beach', type: 'property', group: 'red', price: 220, rent: [18, 90, 250, 700, 875, 1050], houseCost: 150, mortgageValue: 110 },
  banjara_hills: { id: 'banjara_hills', name: 'Banjara Hills', type: 'property', group: 'red', price: 240, rent: [20, 100, 300, 750, 925, 1100], houseCost: 150, mortgageValue: 120 },
  shatabdi: { id: 'shatabdi', name: 'Shatabdi Exp', type: 'railroad', price: 200, mortgageValue: 100 },
  park_street: { id: 'park_street', name: 'Park Street', type: 'property', group: 'yellow', price: 260, rent: [22, 110, 330, 800, 975, 1150], houseCost: 150, mortgageValue: 130 },
  fc_road: { id: 'fc_road', name: 'FC Road', type: 'property', group: 'yellow', price: 260, rent: [22, 110, 330, 800, 975, 1150], houseCost: 150, mortgageValue: 130 },
  electricity_board: { id: 'electricity_board', name: 'Electricity Bd', type: 'utility', price: 150, mortgageValue: 75 },
  sg_highway: { id: 'sg_highway', name: 'SG Highway', type: 'property', group: 'yellow', price: 280, rent: [24, 120, 360, 850, 1025, 1200], houseCost: 150, mortgageValue: 140 },
  go_to_jail: { id: 'go_to_jail', name: 'Go To Jail', type: 'go_to_jail' },
  bandra_west: { id: 'bandra_west', name: 'Bandra West', type: 'property', group: 'green', price: 300, rent: [26, 130, 390, 900, 1100, 1275], houseCost: 200, mortgageValue: 150 },
  connaught_place: { id: 'connaught_place', name: 'Connaught Pl', type: 'property', group: 'green', price: 300, rent: [26, 130, 390, 900, 1100, 1275], houseCost: 200, mortgageValue: 150 },
  jugaad_3: { id: 'jugaad_3', name: 'Jugaad', type: 'cc' },
  cyber_hub: { id: 'cyber_hub', name: 'Cyber Hub', type: 'property', group: 'green', price: 320, rent: [28, 150, 450, 1000, 1200, 1400], houseCost: 200, mortgageValue: 160 },
  tejas: { id: 'tejas', name: 'Tejas Exp', type: 'railroad', price: 200, mortgageValue: 100 },
  kismat_3: { id: 'kismat_3', name: 'Kismat', type: 'chance' },
  marine_drive: { id: 'marine_drive', name: 'Marine Drive', type: 'property', group: 'dark_blue', price: 350, rent: [35, 175, 500, 1100, 1300, 1500], houseCost: 200, mortgageValue: 175 },
  luxury_tax: { id: 'luxury_tax', name: 'Luxury Tax', type: 'tax', taxAmount: 100 },
  altamount_road: { id: 'altamount_road', name: 'Altamount Rd', type: 'property', group: 'dark_blue', price: 400, rent: [50, 200, 600, 1400, 1700, 2000], houseCost: 200, mortgageValue: 200 },
};

export const TILE_LAYOUT: { position: number; space: SpaceId; corner?: 'tl' | 'tr' | 'br' | 'bl' }[] = [
  { position: 0, space: 'go', corner: 'tl' },
  { position: 1, space: 'chandni_chowk' },
  { position: 2, space: 'jugaad_1' },
  { position: 3, space: 'hazratganj' },
  { position: 4, space: 'income_tax' },
  { position: 5, space: 'vande_bharat' },
  { position: 6, space: 'ghat_road' },
  { position: 7, space: 'kismat_1' },
  { position: 8, space: 'mi_road' },
  { position: 9, space: 'law_garden' },
  { position: 10, space: 'jail', corner: 'tr' },
  { position: 11, space: 'mall_road' },
  { position: 12, space: 'water_supply' },
  { position: 13, space: 'bapu_bazaar' },
  { position: 14, space: 'lake_pichola' },
  { position: 15, space: 'rajdhani' },
  { position: 16, space: 'calangute' },
  { position: 17, space: 'jugaad_2' },
  { position: 18, space: 'white_town' },
  { position: 19, space: 'rock_beach' },
  { position: 20, space: 'free_parking', corner: 'br' },
  { position: 21, space: 'mg_road' },
  { position: 22, space: 'kismat_2' },
  { position: 23, space: 'marina_beach' },
  { position: 24, space: 'banjara_hills' },
  { position: 25, space: 'shatabdi' },
  { position: 26, space: 'park_street' },
  { position: 27, space: 'fc_road' },
  { position: 28, space: 'electricity_board' },
  { position: 29, space: 'sg_highway' },
  { position: 30, space: 'go_to_jail' },
  { position: 31, space: 'bandra_west' },
  { position: 32, space: 'connaught_place' },
  { position: 33, space: 'jugaad_3' },
  { position: 34, space: 'cyber_hub' },
  { position: 35, space: 'tejas' },
  { position: 36, space: 'kismat_3' },
  { position: 37, space: 'marine_drive' },
  { position: 38, space: 'luxury_tax' },
  { position: 39, space: 'altamount_road', corner: 'bl' },
];

export const RAILROAD_IDS: PropertyId[] = ['vande_bharat', 'rajdhani', 'shatabdi', 'tejas'];
export const UTILITY_IDS: PropertyId[] = ['water_supply', 'electricity_board'];

export const GROUP_PROPERTIES: Record<GroupId, PropertyId[]> = {
  brown: ['chandni_chowk', 'hazratganj'],
  light_blue: ['ghat_road', 'mi_road', 'law_garden'],
  pink: ['mall_road', 'bapu_bazaar', 'lake_pichola'],
  orange: ['calangute', 'white_town', 'rock_beach'],
  red: ['mg_road', 'marina_beach', 'banjara_hills'],
  yellow: ['park_street', 'fc_road', 'sg_highway'],
  green: ['bandra_west', 'connaught_place', 'cyber_hub'],
  dark_blue: ['marine_drive', 'altamount_road'],
};

export const GROUP_COLORS: Record<GroupId, string> = {
  brown: '#8B4513', light_blue: '#87CEEB', pink: '#FF69B4', orange: '#FF8C00',
  red: '#FF0000', yellow: '#FFD700', green: '#006400', dark_blue: '#00008B',
};

export function tileToSpaceId(pos: number): SpaceId {
  return TILE_LAYOUT[pos]?.space ?? 'go';
}

export function tileToPropertyId(pos: number): PropertyId | null {
  const id = TILE_LAYOUT[pos]?.space;
  if (!id) return null;
  if (id in BOARD && (BOARD[id].type === 'property' || BOARD[id].type === 'railroad' || BOARD[id].type === 'utility')) {
    return id as PropertyId;
  }
  return null;
}

export function spaceIsPurchasable(space: SpaceConfig): boolean {
  return space.type === 'property' || space.type === 'railroad' || space.type === 'utility';
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
  { id: 4, text: 'Advance to nearest Utility', type: 'move' },
  { id: 5, text: 'Advance to nearest Express Train', type: 'move' },
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

function findNearestRailroad(state: GameState, playerIndex: number): PropertyId {
  const pos = state.players[playerIndex].position;
  let nearest = RAILROAD_IDS[0];
  let minDist = 40;
  const rrPositions = [5, 15, 25, 35];
  for (let i = 0; i < RAILROAD_IDS.length; i++) {
    const dist = (rrPositions[i] - pos + 40) % 40;
    if (dist > 0 && dist < minDist) { minDist = dist; nearest = RAILROAD_IDS[i]; }
  }
  return nearest;
}

function findNearestUtility(state: GameState, playerIndex: number): PropertyId {
  const pos = state.players[playerIndex].position;
  let nearest = UTILITY_IDS[0];
  let minDist = 40;
  const uPositions = [12, 28];
  for (let i = 0; i < UTILITY_IDS.length; i++) {
    const dist = (uPositions[i] - pos + 40) % 40;
    if (dist > 0 && dist < minDist) { minDist = dist; nearest = UTILITY_IDS[i]; }
  }
  return nearest;
}

// ─── Player & Property State ─────────────────────────

export interface PlayerStats {
  propertiesBought: number;
  housesBuilt: number;
  villasBuilt: number;
  rentPaid: number;
  rentReceived: number;
  timesPassedGo: number;
  timesWentToJail: number;
  totalMoneyEarned: number;
  totalMoneySpent: number;
  auctionsWon: number;
  tradesCompleted: number;
}

export function createEmptyStats(): PlayerStats {
  return {
    propertiesBought: 0, housesBuilt: 0, villasBuilt: 0,
    rentPaid: 0, rentReceived: 0,
    timesPassedGo: 0, timesWentToJail: 0,
    totalMoneyEarned: 0, totalMoneySpent: 0,
    auctionsWon: 0, tradesCompleted: 0,
  };
}

export interface PlayerState {
  money: number; position: number; inJail: boolean;
  jailTurns: number; jailFreeCards: number; bankrupt: boolean;
  monopolies: GroupId[];
  stats: PlayerStats;
}

export interface PropertyState {
  owner: number | null; houses: number; mortgaged: boolean;
}

export interface GameState {
  players: PlayerState[];
  properties: Record<PropertyId, PropertyState>;
  currentPlayer: number; phase: TurnPhase;
  dice: [number, number] | null; diceTotal: number | null;
  doublesCount: number; rolledBy: number | null; rollId: string | null;
  lastAction: string | null; landedIndex: number | null;
  winner: number | null;
  housesRemaining: number; hotelsRemaining: number;
  interaction: Interaction | null;
  eventLog: GameEvent[];
  _sv: number;
}

// ─── Interaction Types ────────────────────────────────

export interface AuctionInteraction {
  type: 'auction';
  propertyId: PropertyId;
  declinedBy: number;
  currentBid: number;
  currentBidder: number | null;
  activePlayer: number;
  passedPlayers: number[];
}

export interface TradeInteraction {
  type: 'trade';
  fromPlayer: number;
  toPlayer: number;
  give: { money: number; properties: PropertyId[]; jailCards: number };
  ask: { money: number; properties: PropertyId[]; jailCards: number };
  phase: 'editing' | 'proposed';
}

export interface BankruptcyInteraction {
  type: 'bankruptcy';
  playerIndex: number;
  creditor: number | null;
  amountOwed: number;
  phase: 'mortgage_opportunity' | 'forced_bankruptcy';
}

export type Interaction = AuctionInteraction | TradeInteraction | BankruptcyInteraction;

export type GameActionType = 'ROLL_DICE' | 'CONFIRM_DICE' | 'BUY_PROPERTY' | 'DECLINE_PROPERTY' | 'END_TURN'
  | 'PAY_GHOOS' | 'USE_SIFARISH_CARD'
  | 'BUILD_BUNGALOW' | 'SELL_BUNGALOW' | 'BUILD_VILLA' | 'SELL_VILLA'
  | 'MORTGAGE' | 'UNMORTGAGE'
  | 'BID' | 'PASS'
  | 'PROPOSE_TRADE' | 'UPDATE_TRADE' | 'SEND_TRADE' | 'ACCEPT_TRADE' | 'REJECT_TRADE';

export interface GameAction {
  type: GameActionType;
  payload?: any;
}

export interface GameEvent {
  type: 'PLAYER_MOVED' | 'PASSED_GO' | 'BOUGHT_PROPERTY' | 'PAID_RENT' | 'PAID_TAX'
    | 'WENT_TO_JAIL' | 'BANKRUPT' | 'PLAYER_WON' | 'ROLLED_DOUBLES' | 'THREE_DOUBLES'
    | 'TURN_ENDED' | 'DREW_CARD' | 'CARD_EFFECT' | 'BUNGALOW_BUILT' | 'VILLA_BUILT'
    | 'BUNGALOW_SOLD' | 'VILLA_SOLD' | 'GHOOS_PAID' | 'SIFARISH_USED';
  playerIndex: number;
  amount?: number; toPlayer?: number; propertyIndex?: number;
  from?: number; to?: number; path?: number[];
  cardType?: 'kismat' | 'jugaad'; cardIndex?: number; cardText?: string;
}

export interface GameResult {
  state: GameState; valid: boolean; error?: string;
  events?: GameEvent[]; diceValue?: [number, number]; diceTotal?: number;
  rollId?: string; validActions?: GameActionType[];
}

// ─── Helpers ───────────────────────────────────────────

function getGroupPropertyIds(group: GroupId): PropertyId[] {
  return GROUP_PROPERTIES[group] ?? [];
}

function refreshMonopolies(state: GameState, playerIndex: number): void {
  const player = state.players[playerIndex];
  player.monopolies = (Object.keys(GROUP_PROPERTIES) as GroupId[]).filter(g =>
    GROUP_PROPERTIES[g].every(id => state.properties[id]?.owner === playerIndex)
  );
}

function bump(state: GameState): void { state._sv++; }

function pushEvent(state: GameState, event: GameEvent): void {
  state.eventLog.push(event);
  if (state.eventLog.length > GAME_RULES.maxEventLog) state.eventLog.shift();
}

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

function handleBankruptcy(state: GameState, playerIndex: number, creditor?: number | null): GameEvent[] {
  const player = state.players[playerIndex];
  if (player.bankrupt) return [];
  if (player.money >= 0) return [];
  player.bankrupt = true;
  const events: GameEvent[] = [{ type: 'BANKRUPT', playerIndex, toPlayer: creditor ?? undefined }];
  if (creditor !== null && creditor !== undefined && creditor !== playerIndex && !state.players[creditor]?.bankrupt) {
    for (const id of Object.keys(state.properties) as PropertyId[]) {
      const prop = state.properties[id];
      if (prop.owner === playerIndex) {
        prop.owner = creditor;
        if (prop.mortgaged) {
          const interest = Math.ceil((BOARD[id].mortgageValue ?? 0) * GAME_RULES.mortgageInterestRate);
          state.players[creditor].money -= interest;
        }
      }
    }
    state.players[creditor].jailFreeCards += player.jailFreeCards;
    player.jailFreeCards = 0;
    refreshMonopolies(state, creditor);
  } else {
    for (const id of Object.keys(state.properties) as PropertyId[]) {
      const prop = state.properties[id];
      if (prop.owner === playerIndex) {
        prop.owner = null;
        if (prop.houses === 5) state.hotelsRemaining++;
        else state.housesRemaining += prop.houses;
        prop.houses = 0;
        prop.mortgaged = false;
      }
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
  return RAILROAD_IDS.filter(id => state.properties[id]?.owner === ownerIndex).length;
}

function countOwnerUtilities(state: GameState, ownerIndex: number): number {
  return UTILITY_IDS.filter(id => state.properties[id]?.owner === ownerIndex).length;
}

function computeRentAmount(state: GameState, propId: PropertyId, diceTotal: number): number {
  const prop = state.properties[propId];
  const space = BOARD[propId];
  const owner = prop.owner;
  if (owner === null || owner === undefined) return 0;
  if (prop.mortgaged) return 0;
  if (space.type === 'railroad') return 25 * Math.pow(2, countOwnerRailroads(state, owner) - 1);
  if (space.type === 'utility') {
    const count = countOwnerUtilities(state, owner);
    return count === 1 ? 4 * diceTotal : 10 * diceTotal;
  }
  if (space.type === 'property') {
    if (prop.houses === 5) return space.rent![5];
    if (prop.houses > 0) return space.rent![prop.houses];
    const groupProps = GROUP_PROPERTIES[space.group!];
    const monopoly = groupProps.every(id => state.properties[id]?.owner === owner);
    return monopoly ? space.rent![0] * 2 : space.rent![0];
  }
  return 0;
}

function payRent(state: GameState, playerIndex: number, propId: PropertyId): { amount: number; events: GameEvent[] } {
  const prop = state.properties[propId];
  const owner = prop.owner!;
  const diceTotal = state.diceTotal ?? 0;
  const amount = computeRentAmount(state, propId, diceTotal);
  state.players[playerIndex].money -= amount;
  state.players[owner].money += amount;
  state.players[playerIndex].stats.rentPaid += amount;
  state.players[owner].stats.rentReceived += amount;
  state.players[playerIndex].stats.totalMoneySpent += amount;
  state.players[owner].stats.totalMoneyEarned += amount;
  return {
    amount,
    events: [{ type: 'PAID_RENT', playerIndex, amount, toPlayer: owner, propertyIndex: TILE_LAYOUT.findIndex(t => t.space === propId) }],
  };
}

// ─── Card execution ─────────────────────────────────────

function executeCard(state: GameState, playerIndex: number, card: Card): GameEvent[] {
  const events: GameEvent[] = [];
  const player = state.players[playerIndex];

  switch (card.type) {
    case 'money': {
      const amt = card.amount || 0;
      player.money += amt;
      if (amt >= 0) player.stats.totalMoneyEarned += amt;
      else player.stats.totalMoneySpent += -amt;
      if (amt < 0) {
        events.push({ type: 'PAID_TAX', playerIndex, amount: -amt });
      }
      events.push({ type: 'CARD_EFFECT', playerIndex, amount: amt, cardText: card.text });
      break;
    }
    case 'move': {
      let targetPos = card.targetPosition!;
      if (card.id === 4) { const u = findNearestUtility(state, playerIndex); targetPos = TILE_LAYOUT.findIndex(t => t.space === u); }
      if (card.id === 5) { const rr = findNearestRailroad(state, playerIndex); targetPos = TILE_LAYOUT.findIndex(t => t.space === rr); }
      const oldPos = player.position;
      if (targetPos <= oldPos) {
        player.money += GAME_RULES.passGoSalary;
        player.stats.timesPassedGo++;
        player.stats.totalMoneyEarned += GAME_RULES.passGoSalary;
        events.push({ type: 'PASSED_GO', playerIndex, amount: GAME_RULES.passGoSalary });
      }
      player.position = targetPos;
      events.push({ type: 'PLAYER_MOVED', playerIndex, from: oldPos, to: targetPos });
      events.push({ type: 'CARD_EFFECT', playerIndex, cardText: card.text });
      break;
    }
    case 'jail': {
      player.position = GAME_RULES.jailPosition;
      player.inJail = true;
      player.jailTurns = 0;
      events.push({ type: 'WENT_TO_JAIL', playerIndex, to: GAME_RULES.jailPosition });
      events.push({ type: 'CARD_EFFECT', playerIndex, cardText: card.text });
      break;
    }
    case 'repairs': {
      let cost = 0;
      for (const id of Object.keys(state.properties) as PropertyId[]) {
        if (state.properties[id].owner === playerIndex) {
          if (state.properties[id].houses === 5) cost += (card.perHotel || 0);
          else if (state.properties[id].houses > 0) cost += (card.perHouse || 0) * state.properties[id].houses;
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
          state.players[i].stats.totalMoneySpent += c;
          collected += c;
        }
      }
      player.money += collected;
      player.stats.totalMoneyEarned += collected;
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
  const allPropIds = [...GROUP_PROPERTIES.brown, ...GROUP_PROPERTIES.light_blue, ...GROUP_PROPERTIES.pink,
    ...GROUP_PROPERTIES.orange, ...GROUP_PROPERTIES.red, ...GROUP_PROPERTIES.yellow,
    ...GROUP_PROPERTIES.green, ...GROUP_PROPERTIES.dark_blue, ...RAILROAD_IDS, ...UTILITY_IDS];
  const props: Record<string, PropertyState> = {};
  for (const id of allPropIds) props[id] = { owner: null, houses: 0, mortgaged: false };
  return {
    players: Array.from({ length: playerCount }, () => ({
      money: GAME_RULES.startMoney, position: 0, inJail: false,
      jailTurns: 0, jailFreeCards: 0, bankrupt: false, monopolies: [],
      stats: createEmptyStats(),
    })),
    properties: props as Record<PropertyId, PropertyState>,
    currentPlayer: startingPlayer ?? Math.floor(Math.random() * playerCount),
    phase: 'waiting_for_roll',
    dice: null, diceTotal: null, doublesCount: 0,
    rolledBy: null, rollId: null, lastAction: null, landedIndex: null,
    winner: null,
    housesRemaining: GAME_RULES.maxHouses,
    hotelsRemaining: GAME_RULES.maxHotels,
    interaction: null,
    eventLog: [],
    _sv: 0,
  };
}

// ─── Command Queue (internal) ─────────────────────────

type CommandFunction = () => GameEvent[];

function runQueue(commands: CommandFunction[]): GameEvent[] {
  const allEvents: GameEvent[] = [];
  for (const cmd of commands) {
    const evts = cmd();
    if (evts) allEvents.push(...evts);
  }
  return allEvents;
}

// ─── resolveLanding ─────────────────────────────────────

function resolveLanding(state: GameState, playerIndex: number): GameEvent[] {
  const pos = state.players[playerIndex].position;
  const spaceId = tileToSpaceId(pos);
  const space = BOARD[spaceId];
  const propId = tileToPropertyId(pos);
  const events: GameEvent[] = [];
  state.landedIndex = pos;

  if (space.type === 'go_to_jail') {
    state.players[playerIndex].position = GAME_RULES.jailPosition;
    state.players[playerIndex].inJail = true;
    state.players[playerIndex].jailTurns = 0;
    state.players[playerIndex].stats.timesWentToJail++;
    state.phase = 'turn_end';
    state.lastAction = 'went_to_jail';
    events.push({ type: 'WENT_TO_JAIL', playerIndex, to: GAME_RULES.jailPosition });
    return events;
  }

  if (propId && (space.type === 'property' || space.type === 'railroad' || space.type === 'utility')) {
    const prop = state.properties[propId];
    if (prop.owner === null) {
      state.phase = 'waiting_for_action';
      state.lastAction = 'can_buy';
    } else if (prop.owner === playerIndex) {
      state.phase = 'turn_end';
      state.lastAction = 'own_property';
    } else {
      const rentResult = payRent(state, playerIndex, propId);
      events.push(...rentResult.events);
      const bankruptcyEvents = handleBankruptcy(state, playerIndex, prop.owner);
      events.push(...bankruptcyEvents);
      state.phase = 'turn_end';
      state.lastAction = 'paid_rent';
    }
    return events;
  }

  if (space.type === 'tax') {
    const amount = space.taxAmount!;
    state.players[playerIndex].money -= amount;
    state.players[playerIndex].stats.totalMoneySpent += amount;
    const bankruptcyEvents = handleBankruptcy(state, playerIndex, null);
    events.push(...bankruptcyEvents);
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

  if (player.inJail) {
    if (isDoubles) {
      player.inJail = false;
      player.jailTurns = 0;
      escapedJailByDoubles = true;
    } else {
      player.jailTurns++;
      if (player.jailTurns >= 3) {
        const payAmount = Math.min(GAME_RULES.jailFine, player.money);
        player.money -= payAmount;
        player.stats.totalMoneySpent += payAmount;
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

  if (isDoubles && !escapedJailByDoubles) {
    state.doublesCount++;
    if (state.doublesCount >= 3) {
      events.push({ type: 'THREE_DOUBLES', playerIndex });
      player.position = GAME_RULES.jailPosition;
      player.inJail = true;
      player.jailTurns = 0;
      player.stats.timesWentToJail++;
      state.phase = 'turn_end';
      state.lastAction = 'three_doubles_jail';
      events.push({ type: 'WENT_TO_JAIL', playerIndex, to: GAME_RULES.jailPosition });
      bump(state);
      return { state, valid: true, diceValue: values, diceTotal: total, events, validActions: ['END_TURN'] };
    }
    events.push({ type: 'ROLLED_DOUBLES', playerIndex });
  } else if (!escapedJailByDoubles) {
    state.doublesCount = 0;
  }

  const queueEvents = runQueue([
    () => {
      const oldPos = player.position;
      const newPos = (oldPos + total) % 40;
      const path: number[] = [];
      for (let step = 1; step <= total; step++) path.push((oldPos + step) % 40);
      player.position = newPos;
      const evts: GameEvent[] = [{ type: 'PLAYER_MOVED', playerIndex, from: oldPos, to: newPos, path }];
      if ((oldPos + total) >= 40 && oldPos !== 0) {
        player.money += GAME_RULES.passGoSalary;
        player.stats.timesPassedGo++;
        player.stats.totalMoneyEarned += GAME_RULES.passGoSalary;
        evts.push({ type: 'PASSED_GO', playerIndex, amount: GAME_RULES.passGoSalary });
      }
      return evts;
    },
    () => resolveLanding(state, playerIndex),
  ]);
  events.push(...queueEvents);

  if (state.winner !== null) {
    bump(state);
    return { state, valid: true, diceValue: values, diceTotal: total, events, validActions: [] };
  }

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
  const propId = tileToPropertyId(state.landedIndex);
  if (!propId) return { state, valid: false, error: 'Not a purchasable space' };
  const space = BOARD[propId];
  if (!space.price) return { state, valid: false, error: 'Not a purchasable space' };
  if (state.properties[propId].owner !== null) return { state, valid: false, error: 'Already owned' };
  const player = state.players[playerIndex];
  if (player.money < space.price) return { state, valid: false, error: 'Not enough money' };
  player.money -= space.price;
  player.stats.propertiesBought++;
  player.stats.totalMoneySpent += space.price;
  state.properties[propId].owner = playerIndex;
  refreshMonopolies(state, playerIndex);
  const events: GameEvent[] = [{ type: 'BOUGHT_PROPERTY', playerIndex, propertyIndex: state.landedIndex, amount: space.price }];
  const bankruptcyEvents = handleBankruptcy(state, playerIndex, null);
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
  if (state.landedIndex !== null) {
    const propId = tileToPropertyId(state.landedIndex);
    if (propId && state.properties[propId]?.owner === null) {
      startAuction(state, propId, playerIndex);
      bump(state);
      const actions = getValidActions(state, playerIndex);
      return { state, valid: true, events: [], validActions: actions };
    }
  }
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

// ─── Mortgages (Phase 3) ────────────────────────────────

export function mortgageProperty(state: GameState, playerIndex: number, payload?: { propertyId?: PropertyId }): GameResult {
  if (state.winner !== null) return { state, valid: false, error: 'Game over' };
  if (state.currentPlayer !== playerIndex) return { state, valid: false, error: 'Not your turn' };
  if (state.phase === 'rolling_dice' || state.phase === 'waiting_for_action') return { state, valid: false, error: 'Cannot mortgage now' };
  if (state.interaction) return { state, valid: false, error: 'Cannot mortgage during ' + state.interaction.type };
  const propId = payload?.propertyId;
  if (!propId) return { state, valid: false, error: 'No property specified' };
  const prop = state.properties[propId];
  const space = BOARD[propId];
  if (!prop || !space.mortgageValue) return { state, valid: false, error: 'Not a mortgageable property' };
  if (prop.owner !== playerIndex) return { state, valid: false, error: 'Not your property' };
  if (prop.mortgaged) return { state, valid: false, error: 'Already mortgaged' };
  if (prop.houses > 0) return { state, valid: false, error: 'Must sell all buildings first' };
  const value = space.mortgageValue;
  state.players[playerIndex].money += value;
  state.players[playerIndex].stats.totalMoneyEarned += value;
  prop.mortgaged = true;
  const events: GameEvent[] = [{ type: 'PAID_TAX' as any, playerIndex, amount: value }];
  events[0].type = 'PROPERTY_MORTGAGED' as GameEvent['type'];
  (events[0] as any).propertyIndex = TILE_LAYOUT.findIndex(t => t.space === propId);
  bump(state);
  return { state, valid: true, events, validActions: getValidActions(state, playerIndex) };
}

export function unmortgageProperty(state: GameState, playerIndex: number, payload?: { propertyId?: PropertyId }): GameResult {
  if (state.winner !== null) return { state, valid: false, error: 'Game over' };
  if (state.currentPlayer !== playerIndex) return { state, valid: false, error: 'Not your turn' };
  if (state.phase === 'rolling_dice' || state.phase === 'waiting_for_action') return { state, valid: false, error: 'Cannot unmortgage now' };
  if (state.interaction) return { state, valid: false, error: 'Cannot unmortgage during ' + state.interaction.type };
  const propId = payload?.propertyId;
  if (!propId) return { state, valid: false, error: 'No property specified' };
  const prop = state.properties[propId];
  const space = BOARD[propId];
  if (!prop || !space.mortgageValue) return { state, valid: false, error: 'Not a mortgageable property' };
  if (prop.owner !== playerIndex) return { state, valid: false, error: 'Not your property' };
  if (!prop.mortgaged) return { state, valid: false, error: 'Not mortgaged' };
  const cost = Math.ceil(space.mortgageValue * (1 + GAME_RULES.mortgageInterestRate));
  if (state.players[playerIndex].money < cost) return { state, valid: false, error: 'Not enough money' };
  state.players[playerIndex].money -= cost;
  state.players[playerIndex].stats.totalMoneySpent += cost;
  prop.mortgaged = false;
  const events: GameEvent[] = [{ type: 'PAID_TAX' as any, playerIndex, amount: cost }];
  events[0].type = 'PROPERTY_UNMORTGAGED' as GameEvent['type'];
  (events[0] as any).propertyIndex = TILE_LAYOUT.findIndex(t => t.space === propId);
  bump(state);
  return { state, valid: true, events, validActions: getValidActions(state, playerIndex) };
}

// ─── Auction (Phase 3) ──────────────────────────────────

function startAuction(state: GameState, propertyId: PropertyId, declinedBy: number): void {
  const nextPlayer = ((declinedBy + 1) % state.players.length);
  state.interaction = {
    type: 'auction',
    propertyId,
    declinedBy,
    currentBid: 0,
    currentBidder: null,
    activePlayer: nextPlayer,
    passedPlayers: [],
  };
  pushEvent(state, { type: 'CARD_EFFECT' as GameEvent['type'], playerIndex: declinedBy, propertyIndex: TILE_LAYOUT.findIndex(t => t.space === propertyId) });
}

export function bid(state: GameState, playerIndex: number, payload?: { amount?: number }): GameResult {
  if (state.winner !== null) return { state, valid: false, error: 'Game over' };
  if (!state.interaction || state.interaction.type !== 'auction') return { state, valid: false, error: 'No active auction' };
  const ix = state.interaction as AuctionInteraction;
  if (playerIndex !== ix.activePlayer) return { state, valid: false, error: 'Not your turn to bid' };
  if (ix.passedPlayers.includes(playerIndex) || playerIndex === ix.declinedBy) return { state, valid: false, error: 'Cannot bid' };
  const amount = payload?.amount ?? 0;
  if (amount <= ix.currentBid) return { state, valid: false, error: 'Bid must be higher than current bid' };
  if (state.players[playerIndex].money < amount) return { state, valid: false, error: 'Not enough money' };
  ix.currentBid = amount;
  ix.currentBidder = playerIndex;
  let nextPlayer = ((playerIndex + 1) % state.players.length);
  while (nextPlayer === ix.declinedBy || ix.passedPlayers.includes(nextPlayer)) {
    nextPlayer = (nextPlayer + 1) % state.players.length;
  }
  ix.activePlayer = nextPlayer;
  const events: GameEvent[] = [{ type: 'CARD_EFFECT' as GameEvent['type'], playerIndex, amount }];
  events[0].type = 'AUCTION_BID' as GameEvent['type'];
  (events[0] as any).propertyIndex = TILE_LAYOUT.findIndex(t => t.space === ix.propertyId);
  bump(state);
  return { state, valid: true, events, validActions: getValidActions(state, playerIndex) };
}

export function pass(state: GameState, playerIndex: number): GameResult {
  if (state.winner !== null) return { state, valid: false, error: 'Game over' };
  if (!state.interaction || state.interaction.type !== 'auction') return { state, valid: false, error: 'No active auction' };
  const ix = state.interaction as AuctionInteraction;
  if (playerIndex !== ix.activePlayer) return { state, valid: false, error: 'Not your turn to pass' };
  ix.passedPlayers.push(playerIndex);
  const total = state.players.length;
  const activeCount = total - new Set([...ix.passedPlayers, ix.declinedBy]).size;
  if (activeCount <= 0 || ix.currentBidder === null) {
    if (ix.currentBidder !== null) {
      state.players[ix.currentBidder].money -= ix.currentBid;
      state.players[ix.currentBidder].stats.totalMoneySpent += ix.currentBid;
      state.players[ix.currentBidder].stats.auctionsWon++;
      state.properties[ix.propertyId].owner = ix.currentBidder;
      refreshMonopolies(state, ix.currentBidder);
    }
    state.interaction = null;
    const events: GameEvent[] = [{ type: 'CARD_EFFECT' as GameEvent['type'], playerIndex: ix.currentBidder ?? -1, amount: ix.currentBid }];
    events[0].type = 'AUCTION_WON' as GameEvent['type'];
    (events[0] as any).propertyIndex = TILE_LAYOUT.findIndex(t => t.space === ix.propertyId);
    bump(state);
    return { state, valid: true, events, validActions: getValidActions(state, playerIndex) };
  }
  // Find next eligible player: skip passed players and the declinedBy
  let next = (playerIndex + 1) % total;
  let safety = 0;
  while (
    (ix.passedPlayers.includes(next) || next === ix.declinedBy || state.players[next]?.bankrupt) &&
    safety < total
  ) {
    next = (next + 1) % total;
    safety++;
  }
  ix.activePlayer = next;
  const events: GameEvent[] = [{ type: 'CARD_EFFECT' as GameEvent['type'], playerIndex }];
  events[0].type = 'AUCTION_PASS' as GameEvent['type'];
  bump(state);
  return { state, valid: true, events, validActions: getValidActions(state, playerIndex) };
}

// ─── Trading (Phase 3) ──────────────────────────────────

export function proposeTrade(state: GameState, playerIndex: number, payload?: { toPlayer?: number; giveMoney?: number; giveProperties?: PropertyId[]; giveJailCards?: number; askMoney?: number; askProperties?: PropertyId[]; askJailCards?: number }): GameResult {
  if (state.winner !== null) return { state, valid: false, error: 'Game over' };
  if (state.currentPlayer !== playerIndex) return { state, valid: false, error: 'Not your turn' };
  if (state.phase === 'rolling_dice') return { state, valid: false, error: 'Cannot trade now' };
  if (state.interaction) return { state, valid: false, error: 'Cannot trade during ' + state.interaction.type };
  const toPlayer = payload?.toPlayer;
  if (toPlayer === undefined || toPlayer === playerIndex) return { state, valid: false, error: 'Invalid trade target' };
  if (state.players[toPlayer]?.bankrupt) return { state, valid: false, error: 'Target player is bankrupt' };
  const giveProps = payload?.giveProperties ?? [];
  const askProps = payload?.askProperties ?? [];
  if (!giveProps.every(id => state.properties[id]?.owner === playerIndex)) return { state, valid: false, error: 'You do not own property you are giving' };
  if (giveProps.some(id => state.properties[id]?.houses > 0 && state.properties[id]?.houses < 5)) return { state, valid: false, error: 'Must sell buildings before trading' };
  state.interaction = {
    type: 'trade',
    fromPlayer: playerIndex,
    toPlayer,
    give: { money: payload?.giveMoney ?? 0, properties: giveProps, jailCards: payload?.giveJailCards ?? 0 },
    ask: { money: payload?.askMoney ?? 0, properties: askProps, jailCards: payload?.askJailCards ?? 0 },
    phase: 'proposed',
  };
  const events: GameEvent[] = [{ type: 'CARD_EFFECT' as GameEvent['type'], playerIndex }];
  events[0].type = 'TRADE_PROPOSED' as GameEvent['type'];
  bump(state);
  return { state, valid: true, events, validActions: getValidActions(state, playerIndex) };
}

export function updateTrade(state: GameState, playerIndex: number, payload?: { giveMoney?: number; giveProperties?: PropertyId[]; giveJailCards?: number; askMoney?: number; askProperties?: PropertyId[]; askJailCards?: number }): GameResult {
  if (!state.interaction || state.interaction.type !== 'trade') return { state, valid: false, error: 'No active trade' };
  const ix = state.interaction as TradeInteraction;
  if (ix.fromPlayer !== playerIndex || ix.phase !== 'editing') return { state, valid: false, error: 'Cannot update trade' };
  if (payload) {
    if (payload.giveProperties && !payload.giveProperties.every(id => state.properties[id]?.owner === playerIndex)) return { state, valid: false, error: 'You do not own property you are giving' };
    ix.give = { money: payload.giveMoney ?? ix.give.money, properties: payload.giveProperties ?? ix.give.properties, jailCards: payload.giveJailCards ?? ix.give.jailCards };
    ix.ask = { money: payload.askMoney ?? ix.ask.money, properties: payload.askProperties ?? ix.ask.properties, jailCards: payload.askJailCards ?? ix.ask.jailCards };
  }
  bump(state);
  return { state, valid: true, events: [], validActions: getValidActions(state, playerIndex) };
}

export function sendTrade(state: GameState, playerIndex: number): GameResult {
  if (!state.interaction || state.interaction.type !== 'trade') return { state, valid: false, error: 'No active trade' };
  const ix = state.interaction as TradeInteraction;
  if (ix.fromPlayer !== playerIndex || ix.phase !== 'editing') return { state, valid: false, error: 'Cannot send trade' };
  ix.phase = 'proposed';
  bump(state);
  return { state, valid: true, events: [], validActions: getValidActions(state, playerIndex) };
}

export function acceptTrade(state: GameState, playerIndex: number): GameResult {
  if (!state.interaction || state.interaction.type !== 'trade') return { state, valid: false, error: 'No active trade' };
  const ix = state.interaction as TradeInteraction;
  if (ix.toPlayer !== playerIndex || ix.phase !== 'proposed') return { state, valid: false, error: 'Cannot accept trade' };
  const from = ix.fromPlayer;
  const to = ix.toPlayer;
  if (state.players[from]?.bankrupt) return { state, valid: false, error: 'Giver is bankrupt' };
  if (state.players[to]?.bankrupt) return { state, valid: false, error: 'Receiver is bankrupt' };
  if (!ix.give.properties.every(id => state.properties[id]?.owner === from)) return { state, valid: false, error: 'Giver no longer owns promised properties' };
  if (!ix.ask.properties.every(id => state.properties[id]?.owner === to)) return { state, valid: false, error: 'Receiver no longer owns promised properties' };
  // Transfer properties
  for (const id of ix.give.properties) {
    state.properties[id].owner = to;
    if (state.properties[id].mortgaged) {
      const interest = Math.ceil((BOARD[id].mortgageValue ?? 0) * GAME_RULES.mortgageInterestRate);
      state.players[to].money -= interest;
    }
  }
  for (const id of ix.ask.properties) {
    state.properties[id].owner = from;
    if (state.properties[id].mortgaged) {
      const interest = Math.ceil((BOARD[id].mortgageValue ?? 0) * GAME_RULES.mortgageInterestRate);
      state.players[from].money -= interest;
    }
  }
  refreshMonopolies(state, from);
  refreshMonopolies(state, to);
  state.players[from].money -= ix.give.money;
  state.players[to].money += ix.give.money;
  state.players[to].money -= ix.ask.money;
  state.players[from].money += ix.ask.money;
  state.players[from].jailFreeCards -= ix.give.jailCards;
  state.players[to].jailFreeCards += ix.give.jailCards;
  state.players[to].jailFreeCards -= ix.ask.jailCards;
  state.players[from].jailFreeCards += ix.ask.jailCards;
  state.players[from].stats.tradesCompleted++;
  state.players[to].stats.tradesCompleted++;
  state.interaction = null;
  const events: GameEvent[] = [{ type: 'CARD_EFFECT' as GameEvent['type'], playerIndex: from }];
  events[0].type = 'TRADE_ACCEPTED' as GameEvent['type'];
  bump(state);
  return { state, valid: true, events, validActions: getValidActions(state, playerIndex) };
}

export function rejectTrade(state: GameState, playerIndex: number): GameResult {
  if (!state.interaction || state.interaction.type !== 'trade') return { state, valid: false, error: 'No active trade' };
  const ix = state.interaction as TradeInteraction;
  if (ix.toPlayer !== playerIndex || ix.phase !== 'proposed') return { state, valid: false, error: 'Cannot reject trade' };
  state.interaction = null;
  const events: GameEvent[] = [{ type: 'CARD_EFFECT' as GameEvent['type'], playerIndex }];
  events[0].type = 'TRADE_REJECTED' as GameEvent['type'];
  bump(state);
  return { state, valid: true, events, validActions: getValidActions(state, playerIndex) };
}

// ─── Jail Actions (Phase 2) ────────────────────────────

export function payGhoos(state: GameState, playerIndex: number): GameResult {
  if (state.winner !== null) return { state, valid: false, error: 'Game over' };
  if (state.currentPlayer !== playerIndex) return { state, valid: false, error: 'Not your turn' };
  if (state.phase !== 'waiting_for_roll') return { state, valid: false, error: 'Cannot pay ghoos now' };
  const player = state.players[playerIndex];
  if (!player.inJail) return { state, valid: false, error: 'Not in jail' };
  if (player.money < GAME_RULES.jailFine) return { state, valid: false, error: 'Not enough money' };
  player.money -= GAME_RULES.jailFine;
  player.stats.totalMoneySpent += GAME_RULES.jailFine;
  player.inJail = false;
  player.jailTurns = 0;
  const events: GameEvent[] = [{ type: 'GHOOS_PAID', playerIndex, amount: GAME_RULES.jailFine }];
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

export function buildBungalow(state: GameState, playerIndex: number, payload?: { propertyIndex?: number; propertyId?: PropertyId }): GameResult {
  if (state.winner !== null) return { state, valid: false, error: 'Game over' };
  if (state.phase !== 'turn_end' && state.phase !== 'waiting_for_roll') return { state, valid: false, error: 'Cannot build now' };
  if (state.currentPlayer !== playerIndex) return { state, valid: false, error: 'Not your turn' };
  const propId = payload?.propertyId;
  if (!propId) return { state, valid: false, error: 'No property specified' };
  const prop = state.properties[propId];
  const space = BOARD[propId];
  if (!prop || space.type !== 'property') return { state, valid: false, error: 'Not a property' };
  if (prop.owner !== playerIndex) return { state, valid: false, error: 'Not your property' };
  if (prop.mortgaged) return { state, valid: false, error: 'Property is mortgaged' };
  if (state.housesRemaining <= 0) return { state, valid: false, error: 'No bungalows remaining' };
  if (prop.houses >= GAME_RULES.maxBungalowPerProperty) return { state, valid: false, error: 'Max 4 bungalows (build villa instead)' };
  if (!space.group) return { state, valid: false, error: 'No color group' };

  if (!state.players[playerIndex].monopolies.includes(space.group)) {
    const groupProps = getGroupPropertyIds(space.group);
    if (!groupProps.every(id => state.properties[id]?.owner === playerIndex)) {
      return { state, valid: false, error: 'Must own entire color group' };
    }
    refreshMonopolies(state, playerIndex);
  }

  const groupProps = getGroupPropertyIds(space.group);
  const groupHouseCounts = groupProps.map(id => state.properties[id].houses);
  const min = Math.min(...groupHouseCounts);
  if (prop.houses > min) return { state, valid: false, error: 'Must build evenly across group' };

  const cost = space.houseCost!;
  if (state.players[playerIndex].money < cost) return { state, valid: false, error: 'Not enough money' };

  state.players[playerIndex].money -= cost;
  state.players[playerIndex].stats.housesBuilt++;
  state.players[playerIndex].stats.totalMoneySpent += cost;
  prop.houses++;
  state.housesRemaining--;
  const events: GameEvent[] = [{ type: 'BUNGALOW_BUILT', playerIndex, propertyIndex: TILE_LAYOUT.findIndex(t => t.space === propId), amount: cost }];
  bump(state);
  return { state, valid: true, events, validActions: getValidActions(state, playerIndex) };
}

export function sellBungalow(state: GameState, playerIndex: number, payload?: { propertyIndex?: number; propertyId?: PropertyId }): GameResult {
  if (state.winner !== null) return { state, valid: false, error: 'Game over' };
  if (state.currentPlayer !== playerIndex) return { state, valid: false, error: 'Not your turn' };
  const propId = payload?.propertyId;
  if (!propId) return { state, valid: false, error: 'No property specified' };
  const prop = state.properties[propId];
  const space = BOARD[propId];
  if (!prop || space.type !== 'property') return { state, valid: false, error: 'Not a property' };
  if (prop.owner !== playerIndex) return { state, valid: false, error: 'Not your property' };
  if (prop.houses <= 0 || prop.houses >= 5) return { state, valid: false, error: 'No bungalows to sell' };
  const refund = Math.floor(space.houseCost! / 2);
  state.players[playerIndex].money += refund;
  prop.houses--;
  state.housesRemaining++;
  const events: GameEvent[] = [{ type: 'BUNGALOW_SOLD', playerIndex, propertyIndex: TILE_LAYOUT.findIndex(t => t.space === propId), amount: refund }];
  bump(state);
  return { state, valid: true, events, validActions: getValidActions(state, playerIndex) };
}

export function buildVilla(state: GameState, playerIndex: number, payload?: { propertyIndex?: number; propertyId?: PropertyId }): GameResult {
  if (state.winner !== null) return { state, valid: false, error: 'Game over' };
  if (state.currentPlayer !== playerIndex) return { state, valid: false, error: 'Not your turn' };
  const propId = payload?.propertyId;
  if (!propId) return { state, valid: false, error: 'No property specified' };
  const prop = state.properties[propId];
  const space = BOARD[propId];
  if (!prop || space.type !== 'property') return { state, valid: false, error: 'Not a property' };
  if (prop.owner !== playerIndex) return { state, valid: false, error: 'Not your property' };
  if (prop.mortgaged) return { state, valid: false, error: 'Property is mortgaged' };
  if (state.hotelsRemaining <= 0) return { state, valid: false, error: 'No villas remaining' };
  if (prop.houses !== 4) return { state, valid: false, error: 'Need 4 bungalows first' };
  if (!space.group) return { state, valid: false, error: 'No color group' };

  if (!state.players[playerIndex].monopolies.includes(space.group)) {
    const groupProps = getGroupPropertyIds(space.group);
    if (!groupProps.every(id => state.properties[id]?.owner === playerIndex)) {
      return { state, valid: false, error: 'Must own entire color group' };
    }
    refreshMonopolies(state, playerIndex);
  }

  const groupProps = getGroupPropertyIds(space.group);
  if (!groupProps.every(id => state.properties[id]?.owner === playerIndex && state.properties[id]?.houses === 4)) {
    return { state, valid: false, error: 'All group properties must have 4 bungalows' };
  }

  const cost = space.houseCost!;
  if (state.players[playerIndex].money < cost) return { state, valid: false, error: 'Not enough money' };

  state.players[playerIndex].money -= cost;
  state.players[playerIndex].stats.villasBuilt++;
  state.players[playerIndex].stats.totalMoneySpent += cost;
  prop.houses = 5;
  state.hotelsRemaining--;
  state.housesRemaining += 4;
  const events: GameEvent[] = [{ type: 'VILLA_BUILT', playerIndex, propertyIndex: TILE_LAYOUT.findIndex(t => t.space === propId), amount: cost }];
  bump(state);
  return { state, valid: true, events, validActions: getValidActions(state, playerIndex) };
}

export function sellVilla(state: GameState, playerIndex: number, payload?: { propertyIndex?: number; propertyId?: PropertyId }): GameResult {
  if (state.winner !== null) return { state, valid: false, error: 'Game over' };
  if (state.currentPlayer !== playerIndex) return { state, valid: false, error: 'Not your turn' };
  const propId = payload?.propertyId;
  if (!propId) return { state, valid: false, error: 'No property specified' };
  const prop = state.properties[propId];
  const space = BOARD[propId];
  if (!prop || space.type !== 'property') return { state, valid: false, error: 'Not a property' };
  if (prop.owner !== playerIndex) return { state, valid: false, error: 'Not your property' };
  if (prop.houses !== 5) return { state, valid: false, error: 'Not a villa' };
  const refund = Math.floor(space.houseCost! / 2);
  state.players[playerIndex].money += refund;
  prop.houses = 4;
  state.hotelsRemaining++;
  state.housesRemaining -= 4;
  const events: GameEvent[] = [{ type: 'VILLA_SOLD', playerIndex, propertyIndex: TILE_LAYOUT.findIndex(t => t.space === propId), amount: refund }];
  bump(state);
  return { state, valid: true, events, validActions: getValidActions(state, playerIndex) };
}

// ─── getValidActions ──────────────────────────────────

export function getValidActions(state: GameState, playerIndex: number): GameActionType[] {
  if (state.winner !== null) return [];
  if (state.players[playerIndex]?.bankrupt) return [];

  if (state.interaction) {
    const ix = state.interaction;
    if (ix.type === 'auction') {
      const inAuction = ix.passedPlayers.includes(playerIndex) || playerIndex === ix.declinedBy;
      if (inAuction) return [];
      return ['BID', 'PASS'];
    }
    if (ix.type === 'trade') {
      if (ix.phase === 'editing' && ix.fromPlayer === playerIndex) return ['UPDATE_TRADE', 'SEND_TRADE'];
      if (ix.phase === 'proposed' && ix.toPlayer === playerIndex) return ['ACCEPT_TRADE', 'REJECT_TRADE'];
      return [];
    }
    if (ix.type === 'bankruptcy') {
      const actions: GameActionType[] = [];
      if (ix.phase === 'mortgage_opportunity' && ix.playerIndex === playerIndex) {
        actions.push('MORTGAGE');
      }
      return actions;
    }
    return [];
  }

  if (state.currentPlayer !== playerIndex) return [];
  const player = state.players[playerIndex];
  switch (state.phase) {
    case 'waiting_for_roll': {
      const actions: GameActionType[] = ['ROLL_DICE'];
      if (player.inJail && player.money >= 50) actions.push('PAY_GHOOS');
      if (player.inJail && player.jailFreeCards > 0) actions.push('USE_SIFARISH_CARD');
      actions.push('MORTGAGE', 'UNMORTGAGE', 'PROPOSE_TRADE');
      return actions;
    }
    case 'waiting_for_action':
      return state.lastAction === 'can_buy' ? ['BUY_PROPERTY', 'DECLINE_PROPERTY'] : [];
    case 'turn_end':
      return ['END_TURN', 'BUILD_BUNGALOW', 'SELL_BUNGALOW', 'BUILD_VILLA', 'SELL_VILLA', 'MORTGAGE', 'UNMORTGAGE', 'PROPOSE_TRADE'];
    default:
      return [];
  }
}

// ─── handleAction ─────────────────────────────────────

export function handleAction(state: GameState, playerIndex: number, action: GameAction): GameResult {
  const result = (() => {
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
      case 'MORTGAGE': return mortgageProperty(state, playerIndex, action.payload);
      case 'UNMORTGAGE': return unmortgageProperty(state, playerIndex, action.payload);
      case 'BID': return bid(state, playerIndex, action.payload);
      case 'PASS': return pass(state, playerIndex);
      case 'PROPOSE_TRADE': return proposeTrade(state, playerIndex, action.payload);
      case 'UPDATE_TRADE': return updateTrade(state, playerIndex, action.payload);
      case 'SEND_TRADE': return sendTrade(state, playerIndex);
      case 'ACCEPT_TRADE': return acceptTrade(state, playerIndex);
      case 'REJECT_TRADE': return rejectTrade(state, playerIndex);
      default: return { state, valid: false, error: `Unknown action: ${(action as any).type}` };
    }
  })();

  if (result.valid && result.events) {
    for (const ev of result.events) pushEvent(state, ev);
  }

  return result;
}

// ─── sanitizeState ────────────────────────────────────

export function sanitizeState(state: GameState, playerIndex: number) {
  const isMyTurn = playerIndex === state.currentPlayer;
  return {
    players: state.players.map(p => ({ ...p, stats: p.stats })),
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
    interaction: state.interaction,
    eventLog: state.eventLog,
    isMyTurn,
    validActions: isMyTurn ? getValidActions(state, playerIndex) : [],
    _sv: state._sv,
  };
}
