# Monopoly (Desi) — Implementation Plan

## Overview

A full-featured **Desi Monopoly** multiplayer board game with SVG board, 3D dice, property fan UI, all standard Monopoly mechanics with Indian theming (Kismat/Jugaad cards, ₹ currency). Real-time via WebSockets + HTTP polling, Framer Motion animations, EK-style card components.

---

## Current Status (July 2026)

### ✅ Fully Implemented — Server Engine

| Area | Details |
|------|---------|
| **Board Model** | Typed `PropertyId`, `SpaceId`, `GroupId` for compile-time safety; `BOARD: Record<SpaceId, SpaceConfig>` immutable; `properties: Record<PropertyId, PropertyState>` mutable; `GAME_RULES` object centralizes all constants |
| **Movement** | Dice rolling (2d6), doubles system (3 doubles → jail), step-by-step Ludo-style tile-by-tile movement, PLAYER_MOVED event with full path array |
| **Property Purchase** | Buy at printed price, decline starts auction, price tags on tiles |
| **Rent System** | Per-property rent arrays [base, 1H, 2H, 3H, 4H, hotel], monopoly double rent (except mortgaged), railroad exponential (25/50/100/200), utility (4×/10× dice) |
| **Card Decks** | Kismat (Chance) 16 cards, Jugaad (CC) 16 cards — move, money, jail, repairs, collect, jail_card types. Shuffle and reshuffle when exhausted. |
| **Kismat Cards** | Advance to GO, MG Road, Mall Road, Vande Bharat, nearest Utility, nearest RR, dividend ₹50, GO TO JAIL, repairs, poor tax, Rajdhani, Marine Drive, Sarpanch, building loan, crossword, Sifarish Card |
| **Jugaad Cards** | Advance to GO, bank error ₹200, doctor's fee ₹50, stock sale ₹50, Sifarish Card, GO TO JAIL, opera night, holiday fund, tax refund, life insurance, hospital fees, school fees, consultancy, street repairs, beauty contest, inherit ₹100 |
| **Card Execution** | `executeCard()` handles money (+, -, collect_from_players), move (with Pass GO), jail (direct send), repairs (per-house/per-hotel), jail_card (Sifarish) |
| **Jail System** | 3 attempts to roll doubles; Sifarish card preferred over auto-pay on 3rd fail; PAY_GHOOS/USE_SIFARISH_CARD actions available; can collect rent and trade while in jail; jail turns tracked |
| **Building System** | Even-building rule enforced; max 4 bungalows per property; villa = 5 houses; housesRemaining(32)/hotelsRemaining(12) tracked; sell back half price; villa → 4 houses with housesRemaining check |
| **Mortgages** | Can't mortgage with buildings; unmortgage = mortgageValue + 10%; mortgaged = 0 rent; trade handles 10% interest for buyer |
| **Auctions** | Full bid/pass flow with rotation skipping passed/bankrupt players; starts on DECLINE_PROPERTY |
| **Trading** | PROPOSE_TRADE/ACCEPT_TRADE/REJECT_TRADE; properties, money, jail cards; buildings must be sold first; mortgaged properties transfer with 10% interest |
| **Bankruptcy** | Properties transfer to creditor (bankrupt to player) or return to bank (bankrupt to bank); buildings cleared and returned to pool; winner detection |
| **Interaction Model** | `interaction: Interaction | null` (not a stack) for auction/trade/bankruptcy flows; `getValidActions` checks interaction first |
| **PlayerStats** | 11 tracked fields: propertiesBought, housesBuilt, villasBuilt, rentPaid, rentReceived, timesPassedGo, timesWentToJail, totalMoneyEarned, totalMoneySpent, auctionsWon, tradesCompleted |

### ✅ Fully Implemented — Client

| Area | Details |
|------|---------|
| **SVG Board** | 40 tiles at 1.5× scale (S=1.5), viewBox 0 0 16.5 16.5, radial gradient background + dot pattern, empty center with card decks |
| **Card Decks on Board** | Kismat deck (left, purple gradient, orange star, count badge) and Jugaad deck (right, green gradient, green diamond, count badge) in EK CardBack style |
| **Horizontal Text** | All tile names rendered horizontally (no rotate transforms) |
| **Jail Visual** | SVG bars + "Just Visiting" label on JAIL tile |
| **Building Pool** | Houses/hotels remaining count with green/red icons in board center |
| **Building Tokens** | Green houses (1–4) and red villa (5) SVG icons on tiles with buildings |
| **Owner Indicators** | Colored dots on tiles showing ownership |
| **Player Tokens** | Colored circles with stack positions for same-tile players |
| **Ludo Movement** | Step-by-step per-tile movement animation (Ludo-style) |
| **OpponentBar** | Player names clickable → opens property panel; auto-opens on turn change; close button |
| **Player Property Panel** | Shows all owned properties for selected player with name, money, properties count, Sifarish cards |
| **Property Fan** | Fan layout with AnimatePresence, grow-in animation, spring physics |
| **Property Card** | Rent table showing base + 1H/2H/3H/4H/Villa rates with current level highlighted; monopoly glow; mortgage grayscale |
| **Unified Property Popup** | Build/sell/mortgage/trade actions + history log |
| **AuctionModal** | Bid +10/25/50/100/Custom/Pass buttons |
| **BazaarModal** | Steam-style side-by-side trade UI with property checkboxes |
| **GameLog** | Expandable log with 30+ event types, auto-scroll |
| **Event Messages** | Animated toast messages for PASSED_GO, PAID_RENT, GHOOS_PAID, etc. |
| **Rent Popup** | Shows rent amount, property name, owner, "Pay Rent" button |
| **Card Draw Popup** | Persistent modal with spring animation, close button, backdrop dismiss, type-colored (Kismat=orange/Jugaad=green) |
| **Building Inventory** | Remaining houses/hotels shown in board center with visual piles |
| **Winner Screen** | Trophy + player name + Rematch button |
| **Bankrupt Overlay** | Full-screen BANKRUPT! animation |

### ✅ Fully Implemented — Architecture

| Area | Details |
|------|---------|
| **State Management** | `GameState` with `_sv` version counter; `sanitizeState()` per-player filtering; `bump()` on every mutation |
| **Command Queue** | `runQueue()` synchronous internal queue (no persistence) for multi-step turns (movement + resolve landing) |
| **Deterministic** | No `Date.now()` in game state; auction timeout tracked by turn/action comparison |
| **Action Validation** | Per-action validation at entry (game over, turn, phase, interaction, ownership, funds) |
| **Event System** | Push-based log via `pushEvent()`, exposed to client for UI triggers |
| **Config-Driven** | `GAME_RULES`, `BOARD`, `KISMAT_DECK`, `JUGAAD_DECK` are const/exported |

### ✅ Tests — 163 Passing

| Suite | Tests | Status |
|-------|-------|--------|
| MonopolyEngine.test.ts | 128 unit tests (createGame, ROLL_DICE, CONFIRM_DICE, Pass GO, Doubles, Jail, Buy, Decline, Rent, Tax, Bankruptcy, End Turn, Buildings, Mortgages, Auctions, Trading, getValidActions, handleAction, Versioning, EventLog) | ✅ All passing |
| MonopolyRouter.test.ts | 12 integration tests (session create, state get, action flow, route registration, WebSocket broadcast) | ✅ All passing |
| MonopolyE2E.test.ts | 23 E2E tests (full games, Pass GO, Doubles, Tax, Railroads, Utilities, Bankruptcy, Building, Jail, Movement paths, PlayerStats, Mortgages, Auctions, Trades) | ✅ All passing |

---

## Rule Audit Status (July 2026)

### Rules Verified Correct

| Rule | Source | Status |
|------|--------|--------|
| 3 doubles → jail | Engine `confirmDice` | ✅ Correct |
| Go To Jail via card/space: no Pass Go money | Engine `executeCard(jail)` / `resolveLanding(go_to_jail)` | ✅ Correct |
| Jail: can pay Ghoos ₹50 or use Sifarish | `getValidActions`, `payGhoos`, `useSifarishCard` | ✅ Correct |
| Jail: can collect rent & manage properties | `computeRentAmount` has no jail check; building/mortgage available | ✅ Correct |
| Even building: one per property before second | `buildBungalow` enforces min-house rule across group | ✅ Correct |
| All group at 4 houses before villa | `buildVilla` checks `every(...houses === 4)` | ✅ Correct |
| Building hotel: 4 houses returned to pool | `buildVilla` housesRemaining += 4 | ✅ Correct |
| Max 1 hotel per property | `prop.houses = 5` replaces 4 houses | ✅ Correct |
| Fixed building inventory | GAME_RULES.maxHouses=32, maxHotels=12, tracked via housesRemaining/hotelsRemaining | ✅ Correct |
| Can't mortgage with buildings | `mortgageProperty` checks `prop.houses > 0` | ✅ Correct |
| Mortgaged = no rent | `computeRentAmount` returns 0 if mortgaged | ✅ Correct |
| Unmortgage = mortgageValue + 10% | `unmortgageProperty` computes `mortgageValue * 1.10` | ✅ Correct |
| Mortgaged properties tradable | `proposeTrade` allows, `acceptTrade` charges 10% interest | ✅ Correct |
| Buildings can't be traded | `proposeTrade` rejects if `houses > 0` (not hotel=5) | ✅ Correct |
| Sell building = half price | `sellBungalow`/`sellVilla` use `Math.floor(cost/2)` | ✅ Correct |
| House shortage = wait | `buildBungalow` checks `housesRemaining > 0` | ✅ Correct |
| Hotel shortage = wait | `buildVilla` checks `hotelsRemaining > 0` | ✅ Correct |
| Pass Go = ₹200 | `confirmDice` and `executeCard(move)` pay salary | ✅ Correct |
| Auction rotation skips bankrupt/passed | `pass()` and `startAuction()` use safety-counter forward scan | ✅ Correct |

### Rules Fixed (July 2026 Session)

| Rule | What Was Wrong | Fix | File |
|------|----------------|-----|------|
| Trade available anytime | `proposeTrade` checked `state.currentPlayer` | Removed turn check. Added PROPOSE_TRADE to alwaysAllowed in `getValidActions` | MonopolyEngine.ts:1018 |
| Building/selling available in jail | Only available during `turn_end`, not `waiting_for_roll` | Added BUILD/SELL actions to `waiting_for_roll` valid actions. Removed turn checks from all 6 portfolio actions | MonopolyEngine.ts:1308-1318 |
| Even selling rule | `sellBungalow` had no even-selling check | Added `prop.houses < max` check across group | MonopolyEngine.ts:1197 |
| Hotel sell houses check | `sellVilla` didn't check if 4 houses available | Added `state.housesRemaining < 4` guard | MonopolyEngine.ts:1257 |
| Mortgaged property monopoly | Mortgaged property still counted toward monopoly for double rent | Added `&& !state.properties[id]?.mortgaged` to monopoly check | MonopolyEngine.ts:475 |
| 3rd jail turn auto-pay | Auto-deducted money regardless of Sifarish card | Prefers using Sifarish card if available before deducting money | MonopolyEngine.ts:748 |

### Rules Not Yet Implemented

| Rule | Why | Complexity |
|------|-----|------------|
| Bankruptcy: sell buildings first before declaring bankrupt | Current code immediately marks bankrupt and transfers properties. Need interaction-based flow where player can sell buildings/mortgage during someone else's turn | **High** — requires new interaction type or extending BankruptcyInteraction |
| Bankruptcy to bank: auction properties to other players | Bank properties are returned to unowned state (not auctioned) | **Medium** — needs sequential auction calls |
| Pass Go salary for advance-to-GO cards | Card `Advance to GO` pays ₹200 via `executeCard(move)` correctly, but the `resolveLanding` for GO position should trigger another ₹200 | Needs verification |
| Trade: update trade (editing phase) | UPDATE_TRADE exists but client BazaarModal may not support editing | **Low** — UI gap |
| Cards reshuffled when exhausted | Kismat/Jugaad decks are reshuffled when exhausted. No bottom-of-deck placement required | Not a bug |

---

## Card Art Generation (ComfyAI + Flux)

| Item | Status | Details |
|------|--------|---------|
| Master prompts | ✅ Created | `server/scripts/monopoly-card-prompts.json` — Desi-themed master style, card back options, 32 card prompts |
| Batch script | ✅ Created | `server/scripts/monopoly_batch_gen.py` — reuses EK's `generate-card-art.py` with Flux workflow |
| Kismat card art (16) | ✅ Generated | `client/public/art/monopoly/kismat_*.webp` |
| Jugaad card art (16) | ✅ Generated | `client/public/art/monopoly/jugaad_*.webp` |
| Board property art (28) | ✅ Generated | `client/public/art/monopoly/*_001.webp` — 512×512 icons for each tile |
| Card back art | ⏳ Not yet | Run `python generate-card-art.py --back` after adding back to card-prompts.json |

### Usage

```bash
# Generate all 32 card arts
python server/scripts/monopoly_batch_gen.py

# Generate preview (first 4)
python server/scripts/monopoly_batch_gen.py --preview

# Generate a single card
python server/scripts/monopoly_batch_gen.py --card kismat_advance_go

# Generate board property art
python server/scripts/generate-card-art.py --prompts monopoly-board-prompts.json --all
```

## Token Selection System

| Component | Status | Location |
|-----------|--------|----------|
| Token definitions (12 tokens) | ✅ Done | `client/src/components/TokenList.ts` |
| Server: token in LobbyPlayer | ✅ Done | Added `token` field + `selectToken()` in `LobbyManager.ts` |
| Server: DB schema + migration | ✅ Done | Added `token TEXT` column to `lobby_players`, migration in `schema.ts` |
| Server: API route | ✅ Done | `POST /api/lobby/select-token` in `index.ts` |
| Client: API method | ✅ Done | `api.selectToken()` in `client.ts` |
| Client: TokenSelector UI | ✅ Done | Grid of 12 emoji buttons in `LobbyPanel.tsx`, locked when taken |
| Client: Token passed to game | ✅ Done | `playerTokens` prop → `MonopolyBoard` |
| Client: Token rendered on board | ✅ Done | `TokenCircle` renders emoji with color ring instead of colored circle |

### Available Tokens

| Emoji | Name | Color |
|-------|------|-------|
| 🛺 | Auto Rickshaw | `#FF6B35` |
| 🐘 | Elephant | `#7B68EE` |
| 🦚 | Peacock | `#00BFFF` |
| 🏛️ | Taj Mahal | `#FFD700` |
| 🏏 | Cricket Bat | `#32CD32` |
| 🚂 | Train | `#DC143C` |
| 🪷 | Lotus | `#FF69B4` |
| 🛕 | Temple | `#FF8C00` |
| 🙏 | Namaste | `#9370DB` |
| 🫖 | Chai | `#8B4513` |
| 🥟 | Samosa | `#DAA520` |
| 🪔 | Diya | `#FF4500` |

## Remaining Work

### High Priority

| # | Task | Files | Details |
|---|------|-------|---------|
| 1 | **Bankruptcy: sell buildings first** | `MonopolyEngine.ts:427` | When money < 0, show bankruptcy interaction allowing player to sell buildings/mortgage before declaring bankrupt. Must work during any player's turn |
| 2 | **Bankruptcy to bank: auction properties** | `MonopolyEngine.ts:447-458` | When bankrupt to bank (not creditor), auction all properties to remaining players instead of just returning them unowned |
| 3 | **Ludo-style capture/fail animations** | `MonopolyGame.tsx`, `MonopolyBoard.tsx` | Animated jail send (token slides to jail), tax payment (token bounces), capture events |

### Medium Priority

| # | Task | Files | Details |
|---|------|-------|---------|
| 4 | **Client: handle bankrupt player selling buildings** | `MonopolyGame.tsx` | When bankruptcy interaction active, show UI for selling/mortgaging before declaring bankrupt |
| 5 | **Client: trade editing phase in BazaarModal** | `BazaarModal.tsx` | Allow sender to UPDATE_TRADE before SEND_TRADE (editing phase) |
| 6 | **Pass Go on GO landing: verify double-pay edge case** | `MonopolyEngine.ts:531-541` | When card says "Advance to GO. Collect ₹200", landing on GO via card should not double-pay |
| 7 | **Sell-All-On-Color-Set when bank lacks houses** | `MonopolyEngine.ts:1257` | If a hotel is sold and bank has < 4 houses, require selling all buildings on that color group simultaneously |

### Low Priority

| # | Task | Files | Details |
|---|------|-------|---------|
| 8 | **Cards just reshuffled when deck exhausted** | `MonopolyEngine.ts:233-247` | Cards are reshuffled when exhausted. No bottom-of-deck required |
| 9 | **Animate token to jail on WENT_TO_JAIL** | `MonopolyBoard.tsx` | Extend stepAnim for jail send animation |
| 10 | **Animate Pass Go with coin collect** | `MonopolyGame.tsx` | Enhanced PASSED_GO animation |
| 11 | **Generate card art with ComfyAI** | `scripts/monopoly_batch_gen.py` | Run batch generation for all 32 cards + 28 board tiles |
| 12 | **IPlayerState cleanup** | `MonopolyEngine.ts` | Remove unused duplicate interfaces |

---

## Architecture Summary

### Server (`server/src/games/monopoly/`)

| File | Size | Purpose |
|------|------|---------|
| `MonopolyEngine.ts` | ~1386 lines | Core engine: state, types, BOARD, cards, all actions, validation, sanitization |
| `MonopolyRouter.ts` | — | Express routes: create, state, action, rematch; WebSocket broadcast |

### Client (`client/src/games/monopoly/`)

| File | Size | Purpose |
|------|------|---------|
| `MonopolyGame.tsx` | ~520 lines | Main game component: state management, event handling, all modals/overlays |
| `MonopolyBoard.tsx` | ~445 lines | SVG 40-tile board: rendering, tokens (emoji), buildings, card decks, jail visual |
| `PropertyCard.tsx` | ~98 lines | Property card: color band, rent table, building indicators, mortgage visual |
| `PropertyFan.tsx` | ~116 lines | Fan layout: spring-animated property card spread |
| `OpponentBar.tsx` | ~55 lines | Top bar: player names (clickable), money, property count, jail indicator |
| `AuctionModal.tsx` | — | Auction bid/pass UI |
| `BazaarModal.tsx` | — | Trade negotiation UI |
| `GameLog.tsx` | — | Expandable event log |
| `Dice.tsx` | — | 3D dice component |
| `constants.ts` | 13 lines | Player colors, names, group colors |
| `sounds.ts` | — | Sound effects |

### Shared Components

| File | Path | Purpose |
|------|------|---------|
| `TokenList.ts` | `client/src/components/` | 12 token definitions with emoji, name, color |
| `TokenCircle` | `MonopolyBoard.tsx` | Renders emoji token with colored ring, fallback to colored circle |

### Scripts (`server/scripts/`)

| File | Purpose |
|------|---------|
| `monopoly-card-prompts.json` | 32 Desi-themed card prompts (Kismat 16 + Jugaad 16) + master style + card back options |
| `monopoly-board-prompts.json` | 28 icon-style property tile prompts |
| `monopoly_batch_gen.py` | Batch generator calling EK's Flux workflow for all monopoly cards |
