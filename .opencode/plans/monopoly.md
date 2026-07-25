# Desi Monopoly — Complete Implementation Plan

## Overview

Desi Monopoly is an Indian-themed Monopoly game for 2-8 players with a portrait-first mobile layout, property card fan UI, and full standard Monopoly mechanics.

### Thematic Renames

| Classic | Desi Monopoly |
|---------|---------------|
| GO | GO (₹200 salary) |
| Chance | Kismat (Luck) |
| Community Chest | Jugaad (Life Hacks) |
| Houses | Bungalows |
| Hotels | Villas |
| Currency | ₹ |
| Railroads | Express Trains |
| Utilities | Municipal Water Supply, State Electricity Board |
| Trading | Bazaar |
| Get Out of Jail Free | Sifarish Card |
| Pay Jail Fine | Pay Ghoos (₹50) |

---

## Phase 1: Foundation — Engine, Desi Board & Fan UI

**Goal:** Playable basic game. Players roll 2 dice (3D physics), move around the Desi-themed board, buy properties, pay base rent, pass GO ($200), go bankrupt, winner declared.

### Board Data (40 Spaces)

```
 0: GO
 1: Chandni Chowk (Brown, ₹60)
 2: Jugaad
 3: Hazratganj (Brown, ₹60)
 4: Income Tax (₹200)
 5: Vande Bharat Express (RR, ₹200)
 6: Ghat Road (Light Blue, ₹100)
 7: Kismat
 8: MI Road (Light Blue, ₹100)
 9: Law Garden (Light Blue, ₹120)
10: Jail / Just Visiting
11: Mall Road (Pink, ₹140)
12: Municipal Water Supply (Utility, ₹150)
13: Bapu Bazaar (Pink, ₹140)
14: Lake Pichola View (Pink, ₹160)
15: Rajdhani Express (RR, ₹200)
16: Calangute Beach (Orange, ₹180)
17: Jugaad
18: White Town (Orange, ₹180)
19: Rock Beach (Orange, ₹200)
20: Free Parking
21: MG Road (Red, ₹220)
22: Kismat
23: Marina Beach (Red, ₹220)
24: Banjara Hills (Red, ₹240)
25: Shatabdi Express (RR, ₹200)
26: Park Street (Yellow, ₹260)
27: FC Road (Yellow, ₹260)
28: State Electricity Board (Utility, ₹150)
29: SG Highway (Yellow, ₹280)
30: Go To Jail
31: Bandra West (Green, ₹300)
32: Connaught Place (Green, ₹300)
33: Jugaad
34: Cyber Hub (Green, ₹320)
35: Tejas Express (RR, ₹200)
36: Kismat
37: Marine Drive (Dark Blue, ₹350)
38: Luxury Tax (₹100)
39: Altamount Road (Dark Blue, ₹400)
```

### Standard Monopoly Math

All prices, rents, house costs, mortgage values follow standard Monopoly. Rent tables are preserved exactly.

### Server Files

| File | Description |
|------|-------------|
| `server/src/games/monopoly/MonopolyEngine.ts` | Pure state machine. Exports: createGame, handleAction, getValidActions, sanitizeState, BOARD, types |
| `server/src/games/monopoly/MonopolyRouter.ts` | Express router: POST /create, POST /action, POST /rematch, GET /state/:sessionId |
| `server/src/games/monopoly/MonopolyServer.ts` | GameServer adapter { createSession, getState, setWsBroadcast, getRouter } |

### Client Files

| File | Description |
|------|-------------|
| `client/src/games/monopoly/constants.ts` | PLAYER_COLORS[8], PLAYER_NAMES[8], GROUP_COLORS |
| `client/src/games/monopoly/sounds.ts` | Placeholder sound hooks (same pattern as Ludo) |
| `client/src/games/monopoly/Dice.tsx` | 2-dice wrapper — calls diceOverlay.roll('d6', 2) |
| `client/src/games/monopoly/MonopolyGame.tsx` | Main game component, portrait layout |
| `client/src/games/monopoly/MonopolyBoard.tsx` | SVG 40-tile board with pinch-zoom + pan |
| `client/src/games/monopoly/PropertyCard.tsx` | Card component for the fan UI |
| `client/src/games/monopoly/PropertyFan.tsx` | Fan layout at bottom (adapted from EK Hand.tsx) |
| `client/src/games/monopoly/OpponentBar.tsx` | Compact top bar with avatars, ₹, property count |

### Files Modified

| File | Change |
|------|--------|
| `server/src/games/registry.ts` | Export monopolyServer |
| `server/src/index.ts` | Register 'monopoly' |
| `client/src/pages/HomePage.tsx` | Add game entry |
| `client/src/pages/GameSettingsPage.tsx` | Add game info (min 2, max 8 players) |
| `client/src/pages/LobbyPanel.tsx` | Add `|| lobby?.gameId === 'monopoly'` to dice check |
| `client/src/pages/GamePage.tsx` | Add lazy import + component map entry |

### Portrait Layout (MonopolyGame.tsx)

```
┌──────────────────────┐
│  OpponentBar         │  ← compact, ~50px
├──────────────────────┤
│                      │
│  MonopolyBoard       │  ← flex: 1, SVG scales to fit width
│  (SVG, 40 tiles)     │  pinch-zoom, middle-mouse pan
│                      │
├──────────────────────┤
│  Action buttons      │  ← [Roll] [Buy ₹X] [Decline] [End Turn]
├──────────────────────┤
│  PropertyFan         │  ← ~200px, owned property cards
└──────────────────────┘
```

### Engine Actions (Phase 1)

| Action | Description |
|--------|-------------|
| ROLL_DICE | Create roll slot (rollId), no RNG |
| CONFIRM_DICE | Accept [d1, d2] from 3D physics, resolve movement + landing |
| BUY_PROPERTY | Deduct price, set owner |
| DECLINE_PROPERTY | Skip buying |
| END_TURN | Advance to next player |

### Turn Flow

```
waiting_for_roll → ROLL_DICE → rolling_dice
  → CONFIRM_DICE (2 values) → server:
    1. Check doubles (track count, 3 = jail)
    2. Move player (check passing GO → +₹200)
    3. Resolve landing:
       - Unowned property → waiting_for_action [BUY|DECLINE]
       - Owned by other → payRent → turn_end
       - Self-owned → turn_end
       - Tax → pay → turn_end
       - Go To Jail → teleport pos 10, inJail → turn_end
       - Kismat/Jugaad → no-op (Phase 1) → turn_end
       - GO/Jail/Free Parking → turn_end
    4. If doubles && < 3 → back to waiting_for_roll
    5. If turn_end → wait for END_TURN → advanceTurn
```

### Jail (Phase 1)

Simplified: Go To Jail → pos 10, inJail=true. On turn in jail → auto-pay ₹50 (Ghoos), free, roll normally. (Full mechanics with doubles-escape, Sifarish cards, 3-turn limit — Phase 2.)

### Bankruptcy

If money < 0 after any transaction → bankrupt. All properties → unowned. If only 1 active player → winner.

---

## Phase 2: Kismat, Jugaad, Jail & Real Estate

**Goal:** Working Indian-themed card decks, full jail mechanics, Bungalow/Villa building.

### Engine Additions

| Function | Description |
|----------|-------------|
| drawKismat(state, pi) | Draw top Kismat card, execute effect |
| drawJugaad(state, pi) | Draw top Jugaad card, execute effect |
| executeCard(state, pi, card) | Branch: money ±, move to position, jail, repairs, etc. |
| payGhoos(state, pi) | Deduct ₹50, inJail=false |
| useSifarishCard(state, pi) | Consume "Get Out of Jail Free" card |
| handleJailTurn | Check doubles-escape, auto-pay on 3rd turn |
| buildBungalow(state, pi, prop) | Need monopoly, even building, deduct cost |
| sellBungalow(state, pi, prop) | Refund half cost |
| buildVilla(state, pi, prop) | Upgrade from 4 bungalows |
| computeRent | Full rent: bungalow/villa multipliers, railroad count, utility multiplier |

### Card Decks

**Kismat (16 cards):**
1. Advance to GO (collect ₹200)
2. Advance to MG Road, Bengaluru
3. Advance to Mall Road, Shimla
4. Advance to Vande Bharat Express
5. Advance to nearest Utility
6. Advance to nearest Express Train
7. Bank pays you dividend of ₹50
8. Go To Jail
9. Make general repairs on all properties (₹25/bungalow, ₹100/villa)
10. Pay poor tax of ₹15
11. Take a trip to Rajdhani Express
12. Take a walk on Marine Drive
13. You have been elected Sarpanch (pay ₹50 each)
14. Your building loan matures (₹150)
15. You won a crossword competition (₹100)
16. Get out of Jail Free (Sifarish Card)

**Jugaad (16 cards):**
1. Advance to GO (₹200)
2. Bank error in your favor (₹200)
3. Doctor's fee (₹50)
4. From sale of stock you get ₹50
5. Get out of Jail Free (Sifarish Card)
6. Go To Jail
7. Grand opera night (₹50 from each)
8. Holiday fund matures (₹100)
9. Income tax refund (₹20)
10. Life insurance matures (₹100)
11. Hospital fees (₹100)
12. School fees (₹50)
13. Consultancy fee (₹25)
14. Street repairs (₹40/bungalow, ₹115/villa)
15. Second prize in beauty contest (₹10)
16. You inherit ₹100

### Jail Mechanics
- Go To Jail → pos 10, inJail=true, jailTurns=0
- On turn in jail: [Pay Ghoos ₹50] [Use Sifarish Card] [Roll]
  - Roll doubles → free, move normally
  - No doubles → jailTurns++. If >= 3 → auto-pay ₹50, free, move normally
- While in jail: cannot buy properties, but CAN collect rent from others landing on your properties. CAN trade, mortgage, build (standard Monopoly).

### Bungalows & Villas
- Must own all properties in a color group
- Build evenly: |b₁ - b₂| ≤ 1 in same group
- Max 4 bungalows, then upgrade to 1 villa (4 bungalows returned to bank)
- Building shortage: 32 bungalows, 12 villas
- Rent: uses full rent table (base → 1bg → 2bg → 3bg → 4bg → villa)
- Railroads: ₹25/50/100/200 based on count owned
- Utilities: 4× dice (1 owned), 10× dice (2 owned)

### New Actions
DRAW_CARD, PAY_GHOOS, USE_SIFARISH_CARD, BUILD_BUNGALOW, SELL_BUNGALOW, BUILD_VILLA, SELL_VILLA

### Client Additions
- Card draw animation (large popup in center)
- Jail UI (handcuff overlay on avatar, action buttons)
- Building menu on property card tap (["Build Bungalow ₹X"] ["Sell Bungalow"])
- Bungalow/Villa indicators on board tiles (green squares / red square)
- Property card popup on hover showing rent table

---

## Architecture Evolution (Phase 3 Refactor)

Before adding Phase 3 features, the engine is refactored to support typed property IDs,
an interaction-based state machine, and an event-driven client architecture. No gameplay
changes in the first two refactor commits.

### Commit 1: Board Model Refactor

**Changes:**
- `type PropertyId = 'chandni_chowk' | 'hazratganj' | ...` — typed IDs for all properties
- `type SpaceId = PropertyId | 'go' | 'jail' | 'free_parking' | ...` — typed IDs for all spaces
- `type GroupId = 'brown' | 'light_blue' | 'pink' | ...` — named color groups
- `BOARD: Record<SpaceId, SpaceConfig>` — immutable, fully typed, compile-time safety
- `BOARD_TILES: { position, space: SpaceId, corner?, rotation? }[]` — position → ID mapping
- `properties: Record<PropertyId, PropertyState>` — mutable property state keyed by ID
- `PlayerState.monopolies: GroupId[]` — cached monopoly ownership (updated on ownership change)
- `refreshMonopolies()` — recalculates all monopolies for a player
- `GAME_RULES` object — all constants centralized (GO salary, jail fine, house/hotel counts, etc.)
- All internal lookups convert from position to ID

### Commit 2: Engine Architecture Refactor

**Changes:**
- `interaction: Interaction | null` replaces flat phase-only branching for temporary flows
  (auctions, trades, bankruptcy). Only one interaction at a time — no stack needed.
- Internal command queue processed synchronously inside `handleAction` — not persisted to state.
  Makes turn resolution linear and debuggable without half-finished queues in saved games.
- `eventLog: GameEvent[]` capped at 300 entries — replaces unbounded event history.
  For replay support, save replays separately from live game state.
- `Interaction = TradeInteraction | AuctionInteraction | BankruptcyInteraction`
- `getValidActions` checks interaction first, falls through to turnPhase
- `sanitizeState` includes interaction, eventLog

---

## Phase 3: The Bazaar — Mortgages, Auctions & Trading

**Goal:** Full Monopoly-style mortgages, player auctions, and Steam-like trading (Bazaar).

All features built on the refactored interaction model.

### Engine Additions

#### Mortgages
| Function | Description |
|----------|-------------|
| mortgageProperty(state, pi, propId) | Receive mortgageValue (half price). No buildings, not already mortgaged. |
| unmortgageProperty(state, pi, propId) | Pay mortgageValue × 1.1 (rounded up). Must be mortgaged. |
| **Available any time** your turn, no interaction active (except rolling/game over). |

#### Auctions (triggered on DECLINE_PROPERTY)
| Function | Description |
|----------|-------------|
| startAuction(state, propId, declinedBy) | Push AuctionInteraction, set current/active players |
| bid(state, pi, amount) | Higher than current bid, bidder.money ≥ amount |
| pass(state, pi) | Add to passedPlayers. If 1 left → winner pays, property transfers |

**Auction interaction:**
```ts
{ type: 'auction', propertyId, declinedBy, currentBid, currentBidder,
  activePlayer, passedPlayers: number[] }
```
- Rotates through non-bankrupt, non-passed players
- 30-second timeout managed server-side (engine tracks `auctionStartedAtTurn`, server checks at action time)
- Last bidder wins, pays immediately. All pass → property stays unowned.
- Events: AUCTION_STARTED → AUCTION_BID / AUCTION_PASS → AUCTION_WON

#### Trading (Bazaar)
| Function | Description |
|----------|-------------|
| proposeTrade(state, pi, to, give, ask) | Create TradeInteraction in 'editing' phase |
| updateTrade(state, pi, give, ask) | Modify offer before sending |
| sendTrade(state, pi) | Lock offer, change phase to 'proposed', notify recipient |
| acceptTrade(state, pi) | Execute swap. Validate both sides still have assets. |
| rejectTrade(state, pi) | Clear interaction, return to turn |

**Trade interaction:**
```ts
{ type: 'trade', fromPlayer, toPlayer,
  give: { money, properties: PropertyId[], jailCards },
  ask: { money, properties: PropertyId[], jailCards },
  phase: 'editing' | 'proposed' }
```
- Available any time it's your turn, no other interaction active
- Properties with buildings cannot be traded (must sell buildings first)
- **Mortgaged properties CAN be traded** — receiver pays 10% interest immediately
- Editing: sender can modify before sending. Once sent → locked.
- Events: TRADE_PROPOSED → TRADE_ACCEPTED / TRADE_REJECTED → PROPERTY_TRANSFERRED

#### Bankruptcy Rewrite
```ts
{ type: 'bankruptcy', playerIndex, creditor: number | null, amountOwed, phase }
```
- When player can't pay: `phase: 'mortgage_opportunity'` — player can mortgage/sell to raise cash
- If still can't pay: `phase: 'forced_bankruptcy'`
  - Creditor is a player → all properties + jail cards → creditor
  - Creditor is bank (tax, repairs) → properties → unowned, houses → bank
- Events: BANKRUPTCY_ENTERED → BANKRUPT (with transfer details)

### New Actions
MORTGAGE, UNMORTGAGE, BID, PASS,
PROPOSE_TRADE, UPDATE_TRADE, SEND_TRADE, ACCEPT_TRADE, REJECT_TRADE

### Client Additions
- Unified property popup: Build | Mortgage | Trade | History | Info (one place, mobile-friendly)
- Auction modal: bid buttons (+10/+25/+50/+100/Custom), Pass, 30s countdown
- Bazaar modal: Steam-style side-by-side with miniature property card thumbnails
- Event-driven animations/sounds (client derives UI events from semantic game events)
- Player movement path animation (engine emits full path array)

---

## Phase 4: Animations, 3D Dice & Polish

**Goal:** Make it feel alive.

### 3D Dice
- Same DiceOverlay as Yahtzee/Ludo — full screen, pointer-events:none
- Roll of 2 dice over the board, bounces off walls
- Dice appearance settings from LobbyPanel apply

### Animations
- Token movement: framer-motion step-anim, 150ms per tile
- Passing GO: ₹+200 sprite floats up
- Card draw: large card flip in center
- Building: bungalow icons animate onto SVG tile
- Bankruptcy: flash overlay "💀 Bankrupt!"
- Winner: overlay with trophy + rematch button

### Game Log
- Expandable ticker between board and fan
- Shows action history: "Priya bought Marine Drive for ₹350"
- **Phase 1**: only game events (bought, moved, rent, turn end)
- **Phase 2+**: building, card draws

### Pinch-Zoom + Pan
- Board SVG wrapped in gesture container
- Touch: pinch-zoom, drag-to-pan
- Desktop: mouse wheel zoom, middle-mouse drag pan
- CSS transform: scale + translate, bounded

---

## Exhaustive Test List

### Server — Unit Tests (`server/src/games/monopoly/__tests__/MonopolyEngine.test.ts`)

#### createGame
- [ ] creates correct number of players (2-8)
- [ ] each player starts with ₹1500
- [ ] each player starts at position 0
- [ ] all properties start unowned with 0 houses, not mortgaged
- [ ] starts in waiting_for_roll phase
- [ ] no winner at start
- [ ] accepts optional startingPlayer parameter

#### ROLL_DICE
- [ ] creates roll slot with rollId
- [ ] sets phase to rolling_dice
- [ ] rejects from non-current player
- [ ] rejects double roll
- [ ] rejects after game over
- [ ] rejects for bankrupt player
- [ ] rejects when not waiting_for_roll

#### CONFIRM_DICE — basic
- [ ] accepts valid dice values [1-6, 1-6]
- [ ] sets diceTotal to sum
- [ ] moves player by diceTotal
- [ ] rejects stale rollId
- [ ] rejects rollId mismatch
- [ ] rejects invalid dice values (0, 7, negative)
- [ ] rejects when not rolling_dice phase
- [ ] rejects from wrong player
- [ ] rejects after game over

#### CONFIRM_DICE — Pass GO
- [ ] passing GO from pos 38 with roll 5 → pos 3, collect ₹200
- [ ] passing GO from pos 39 with roll 1 → pos 0, collect ₹200
- [ ] passing GO from pos 1 with roll 3 → pos 4, collect ₹200
- [ ] landing exactly on GO (pos 39 + 1) → pos 0, collect ₹200
- [ ] not passing GO (pos 5 + 3 = 8) → no salary
- [ ] player money increases by exactly ₹200 when passing GO

#### CONFIRM_DICE — Doubles
- [ ] rolling doubles sets doublesCount = 1
- [ ] rolling doubles allows re-roll (phase → waiting_for_roll)
- [ ] two doubles → doublesCount = 2
- [ ] three doubles → goes to jail immediately
- [ ] three doubles → position = 10, inJail = true
- [ ] three doubles → phase = turn_end
- [ ] non-doubles resets doublesCount to 0
- [ ] doubles event emitted
- [ ] three_doubles event emitted

#### CONFIRM_DICE — Landing Resolution
- [ ] unowned property → phase = waiting_for_action, lastAction = can_buy
- [ ] owned by other → phase = turn_end, rent paid
- [ ] self-owned → phase = turn_end, no rent
- [ ] income tax → ₹200 deducted, phase = turn_end
- [ ] luxury tax → ₹100 deducted, phase = turn_end
- [ ] go_to_jail → position = 10, inJail = true, phase = turn_end
- [ ] go_to_jail → WENT_TO_JAIL event emitted
- [ ] kismat → phase = turn_end, lastAction = landed_kismat
- [ ] jugaad → phase = turn_end, lastAction = landed_jugaad
- [ ] GO → phase = turn_end
- [ ] jail → phase = turn_end (just visiting)
- [ ] free_parking → phase = turn_end

#### confirmDice — Jail
- [ ] in jail + payGhoos → money - ₹50, inJail = false
- [ ] in jail + doubles → free, move normally
- [ ] in jail + no doubles → jailTurns++, stays in jail
- [ ] in jail + 3rd turn + no doubles → auto-pay ₹50, free, move
- [ ] in jail + 3rd turn → paid_tax event for ₹50

#### BUY_PROPERTY
- [ ] deducts price from player money
- [ ] sets property owner
- [ ] BOUGHT_PROPERTY event emitted
- [ ] rejects if insufficient funds
- [ ] rejects if property already owned
- [ ] rejects if not in waiting_for_action phase
- [ ] rejects if lastAction !== 'can_buy'
- [ ] rejects game over
- [ ] rejects wrong player's turn
- [ ] transitions phase to turn_end

#### DECLINE_PROPERTY
- [ ] phase = turn_end with no owner change
- [ ] rejects if not can_buy phase
- [ ] validActions returns [END_TURN]

#### Pay Rent — Properties
- [ ] base rent deducted from payer, added to owner
- [ ] PAID_RENT event with correct amount and toPlayer
- [ ] monopoly: 2× base rent when all group owned
- [ ] mortgaged property: rent = 0
- [ ] bankrupt if money < rent amount

#### Pay Rent — Railroads
- [ ] 1 railroad: ₹25
- [ ] 2 railroads: ₹50
- [ ] 3 railroads: ₹100
- [ ] 4 railroads: ₹200
- [ ] correct event emitted

#### Pay Rent — Utilities
- [ ] 1 utility: 4 × diceTotal
- [ ] 2 utilities: 10 × diceTotal
- [ ] correct event emitted

#### Pay Tax
- [ ] income tax: -₹200
- [ ] luxury tax: -₹100
- [ ] bankrupt if money < tax

#### Bankruptcy
- [ ] player.money < 0 → bankrupt = true
- [ ] BANKRUPT event emitted
- [ ] all properties → unowned
- [ ] all houses removed from bankrupt's properties
- [ ] if 1 active player remains → winner declared
- [ ] PLAYER_WON event with winning playerIndex
- [ ] winner set on state
- [ ] game over — all actions rejected

#### END_TURN
- [ ] advances to next non-bankrupt player
- [ ] skips bankrupt players
- [ ] resets dice, doublesCount, rollId, lastAction
- [ ] phase = waiting_for_roll
- [ ] accepts only from turn_end phase
- [ ] rejects if not your turn
- [ ] TURN_ENDED event emitted

#### advanceTurn — Bankrupt skip
- [ ] skips 1 bankrupt player
- [ ] skips multiple bankrupt players
- [ ] if all players bankrupt (edge case) — loops back

#### getValidActions
- [ ] waiting_for_roll → ['ROLL_DICE']
- [ ] waiting_for_action + can_buy → ['BUY_PROPERTY', 'DECLINE_PROPERTY']
- [ ] turn_end → ['END_TURN']
- [ ] rolling_dice → []
- [ ] game over → []
- [ ] not your turn → []
- [ ] waiting_for_action + not can_buy → []

#### sanitizeState
- [ ] includes all public fields
- [ ] validActions only for current player
- [ ] validActions = [] for non-acting player
- [ ] includes _sv

#### Edge Cases
- [ ] handleAction dispatches all registered action types
- [ ] handleAction returns error for unknown action type
- [ ] state._sv increments on every mutation
- [ ] state._sv does not increment on validation failures

### Server — Integration Tests (`server/src/games/monopoly/__tests__/MonopolyRouter.test.ts`)

#### POST /create
- [ ] creates session, returns success
- [ ] accepts 2-8 players
- [ ] rejects playerCount < 2
- [ ] rejects playerCount > 8
- [ ] returns valid initial state

#### POST /action
- [ ] ROLL_DICE → returns rollId, phase = rolling_dice
- [ ] CONFIRM_DICE → returns state with moved player
- [ ] BUY_PROPERTY → property owned, money deducted
- [ ] DECLINE_PROPERTY → property still unowned
- [ ] END_TURN → advances player
- [ ] broadcasts GAME_STATE to non-acting players
- [ ] broadcasts DICE_EVENT on ROLL_DICE
- [ ] returns 404 for unknown session

#### POST /rematch
- [ ] resets game to initial state
- [ ] broadcasts new state to all players

#### GET /state/:sessionId
- [ ] returns correct state
- [ ] accepts playerIndex query param
- [ ] returns 404 for unknown session

#### Full Game Flow
- [ ] 2 players: complete simulation to winner
- [ ] 4 players: complete simulation
- [ ] doubles flow: roll, confirm, buy, end turn
- [ ] bankruptcy flow: drive to negative, winner declared

### Client — Component Tests

#### MonopolyBoard
- [ ] renders all 40 tiles
- [ ] tiles colored by property group
- [ ] corner tiles render correctly (GO, Jail, FP, Go To Jail)
- [ ] player token at correct position
- [ ] multiple tokens stack with offset
- [ ] step animates tile-by-tile
- [ ] step animation wraps modulo 40
- [ ] passing GO highlights
- [ ] pinch-zoom scales board
- [ ] middle-mouse pans board
- [ ] touch drag pans board

#### PropertyFan
- [ ] renders owned property cards
- [ ] cards layout in fan with rotation
- [ ] empty state ("No properties")
- [ ] card animates in on add
- [ ] card animates out on remove
- [ ] tap selects card (pops up)
- [ ] tap again deselects

#### PropertyCard
- [ ] shows property name
- [ ] shows price
- [ ] colored group banner
- [ ] shows bungalow/villa indicators
- [ ] shows mortgaged state
- [ ] medium size for fan
- [ ] small size for compact views

#### OpponentBar
- [ ] shows all players
- [ ] highlights current player
- [ ] shows ₹ balance
- [ ] shows property count
- [ ] compact layout (~50px)

#### MonopolyGame
- [ ] renders portrait layout
- [ ] board in center, fan at bottom
- [ ] Roll button when waiting_for_roll
- [ ] Buy/Decline buttons when waiting_for_action
- [ ] End Turn button when turn_end
- [ ] dice roll triggers ROLL_DICE → CONFIRM_DICE flow
- [ ] gameStatePush updates state
- [ ] winner overlay on game end
- [ ] rematch button in winner overlay
- [ ] "Waiting for..." when not my turn
- [ ] stepAnim updates on position change
- [ ] passing GO shows +₹200 event

### E2E Simulation Tests

- [ ] 2 players: roll → buy → pay rent → bankruptcy → winner
- [ ] 4 players: same flow with 4 players
- [ ] Doubles: roll doubles → roll again → end turn
- [ ] Three doubles → go to jail → pay ghoos → continue
- [ ] Pass GO: collect ₹200, money updates
- [ ] Full property purchase: all 28 purchasable spaces bought
- [ ] Railroad rent scaling: 1-4 railroads owned
- [ ] Utility rent: 1-2 utilities
- [ ] Tax payment: both income and luxury
- [ ] Bankruptcy cascade: multiple players go bankrupt, last wins

---

## File Structure

```
server/src/games/monopoly/
├── MonopolyEngine.ts       # Pure state machine (~550 lines)
├── MonopolyRouter.ts       # Express router (~130 lines)
├── MonopolyServer.ts       # GameServer adapter (~10 lines)
└── __tests__/
    ├── MonopolyEngine.test.ts  # Unit tests (~600 lines)
    └── MonopolyRouter.test.ts  # Integration tests (~200 lines)

client/src/games/monopoly/
├── MonopolyGame.tsx        # Main component, portrait layout (~450 lines)
├── MonopolyBoard.tsx       # SVG board with zoom/pan (~400 lines)
├── PropertyCard.tsx        # Fan card component (~120 lines)
├── PropertyFan.tsx         # Fan layout at bottom (~200 lines)
├── OpponentBar.tsx         # Compact top bar (~60 lines)
├── Dice.tsx                # 2-dice wrapper (~60 lines)
├── constants.ts            # Colors, names (~15 lines)
└── sounds.ts               # Placeholder sounds (~10 lines)
```

## Implementation Order (Phase 1)

1. MonopolyEngine.ts — pure state machine (server)
2. MonopolyEngine.test.ts — unit tests (server)
3. MonopolyRouter.ts — Express endpoints (server)
4. MonopolyRouter.test.ts — integration tests (server)
5. MonopolyServer.ts — GameServer adapter (server)
6. registry.ts + index.ts — register game (server)
7. constants.ts + sounds.ts — client setup
8. Dice.tsx — 2-dice wrapper (client)
9. MonopolyBoard.tsx — SVG board (client)
10. PropertyCard.tsx + PropertyFan.tsx — fan UI (client)
11. OpponentBar.tsx — top bar (client)
12. MonopolyGame.tsx — main component (client)
13. Wire HomePage, GameSettingsPage, LobbyPanel, GamePage
