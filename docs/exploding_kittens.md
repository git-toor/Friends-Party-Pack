# Exploding Kittens — Implementation Plan

## Overview

A full-featured **Exploding Kittens** multiplayer card game with all expansions, NSFW mode, AI-generated card art, 2–9 player support, real-time multiplayer via WebSockets, and Framer Motion animations.

---

## Current Status (July 2026)

### ✅ Fully Implemented — Server Engine

| Area | Details |
|------|---------|
| **Base Game** | All 12 base cards: Exploding Kitten, Defuse, Attack, Skip, Favor, Shuffle, See the Future, Nope, TacoCat, Cattermelon, Hairy Potato Cat, Beard Cat |
| **Imploding Kittens** | Imploding Kitten (two-phase face-up/face-down), Alter the Future 3x, Draw from the Bottom, Reverse, Targeted Attack, Feral Cat |
| **Streaking Kittens** | Streaking Kitten (safe EK hold via `player.streakingKitten` flag), Super Skip, See/Alter Future 5x, Swap Top & Bottom, Garbage Collection, Catomic Bomb, Mark, Curse of the Cat Butt |
| **Barking Kittens** | Barking Kitten (chicken duel), Tower of Power stash (`player.stash`), Potluck, Bury, Personal Attack, Share the Future |
| **Zombie Kittens** | Zombie Kitten (defuse + revive), Clone (copies top deck card), Clairvoyance (view top 3), Dig Deeper, Feed the Dead, Grave Robber, Attack of the Dead, Shuffle Now |
| **Core Architecture** | Data-driven card definitions (44 types, no effect classes), EffectEngine with 24+ effect type handlers, Deferred execution system (effects execute AFTER nope window closes), ActionStack with pendingCard tracking, Per-player state serializer |

### ✅ Fully Implemented — Game Mechanics

| Mechanic | Details |
|----------|---------|
| **Deferred Effects** | All nopeable cards execute AFTER 3-second nope window. Effect is skipped if noped. |
| **Nope Chain** | Real-time LIFO chain. Single nope cancels action. Double nope (counter-nope) lets action through. |
| **Cat Combos** | Two of a Kind (2 matching → steal random), Three of a Kind (3 matching → name a card), Five Different Cards (5 different cats → search discard). All nopeable via deferred execution. |
| **Turn System** | Attack stacking, turn direction (Reverse), dead player skip, attack count tracking. |
| **Defuse/Explosion** | Defuse/Defuse window with numbered deck slots. Streaking Kitten protection. Imploding Kitten two-phase. Zombie Kitten revive. |
| **Favor** | Victim selects card via modal, card transfers to attacker. Works with actionStack payload. |

### ✅ Fully Implemented — Client UI

| Component | Details |
|-----------|---------|
| **Card.tsx** | Procedural SVG with 44 card type color/icon mappings |
| **Hand.tsx** | Fan layout with multi-select support for cat combos |
| **OpponentBar.tsx** | Card count, alive/dead status, Streaking Kitten, cursed, stash indicators |
| **ActionBar.tsx** | Context-sensitive: Play Card, Draw, End Turn, Nope (pulse), combo buttons (Pair/Triple/Five) |
| **PlayArea.tsx** | Deck/discard display, nope countdown timer, imploding kitten indicator |
| **DefuseModal.tsx** | Numbered deck slot picker |
| **FavorModal.tsx** | Victim card selection |
| **ZombieReviveModal.tsx** | Dead player picker |
| **GameOverOverlay.tsx** | Winner + Rematch + Back to Lobby |
| **See the Future modal** | Shows top cards via `pendingCardView` |
| **Discard Picker modal** | For Five Different Cards combo — shows discard pile contents |
| **Game Settings** | EK presets (Classic/Chaos/Custom) with expansion checkboxes |
| **Lobby Integration** | Dynamic game loading by gameId, EK registered in gameRegistry |

### ✅ Test Coverage — 85 Tests

| File | Tests | What It Covers |
|------|-------|----------------|
| `engine.test.ts` | 21 | Base actions: play card, draw, attack, skip, favor, shuffle, nope, defuse, end turn, win condition |
| `imploding.test.ts` | 13 | IK two-phase, reverse, targeted attack, draw from bottom, feral cat |
| `streaking.test.ts` | 12 | Streaking Kitten protection, super skip, swap, garbage, catomic, mark, curse |
| `barking.test.ts` | 9 | Barking Kitten duel, personal attack, potluck, bury, tower of power |
| `zombie.test.ts` | 9 | Zombie Kitten revive, dead state (keep hand), dig deeper, feed the dead, grave robber, clone |
| `integration.test.ts` | 21 | Full flow: Attack (nope/no-nope), Skip, Favor, Shuffle, See Future, Nope chain (single/nope-a-nope), Defuse, Draw, Personal Attack, Reverse, IK two-phase, Streaking Kitten, multi-card turns, nope timeout, Cat combos (pair/triple/five) |

### ⚠️ Known Gaps

| Gap | Priority | Description |
|-----|----------|-------------|
| **Three of a Kind client UI** | Medium | Server handles triple combos, but client needs a "name the card you want" modal. Currently shows an alert. |
| **Tower of Power stash management** | Medium | Server tracks `player.stash` and serializes it, but client has no "move card to stash" / "take from stash" UI. |
| **Feral Cat wildcard display** | Low | Feral Cat works server-side (acts as any cat type for combos), but client combo detection doesn't handle the wildcard properly. |
| **NSFW mode** | Low | Toggle in settings works, but no NSFW card art generated yet. |
| **AI Art Pipeline** | Low | ComfyUI workflows exist but no automated generation script ported. |
| **Framer Motion animations** | Low | Card draw/play/discard transitions are instant. No animation library added yet. |
| **Sound effects** | Low | Placeholder hooks only. Disabled by default. |
| **Replay system** | Low | `eventLog` exists in GameState but isn't exposed or persisted. |
| **Spectator mode** | Future | No support for read-only game joins. |
| **9-player support** | Future | Currently limited to 6 (max for Barking + Imploding). Party Pack recipe not implemented. |

### 📊 Test Summary

```bash
cd server && npx vitest run src/games/exploding-kittens/tests/
# 6 files, 85 tests, all passing
# Runs in ~400ms
```

---

1. [Architecture & Data Model](#1-architecture--data-model)
2. [Card Definitions (Data-Driven)](#2-card-definitions)
3. [Action System](#3-action-system)
4. [GameState & Serialization](#4-gamestate--serialization)
5. [Build Phases](#5-build-phases)
6. [Deck Recipe System](#6-deck-recipe-system)
7. [Lobby & Presets](#7-lobby--presets)
8. [Network Protocol](#8-network-protocol)
9. [Testing Strategy](#9-testing-strategy)
10. [Client UI / Animations](#10-client-ui--animations)
11. [Art Pipeline](#11-art-pipeline)
12. [Replay System](#12-replay-system)
13. [Time Estimates](#13-time-estimates)

---

## 1. Architecture & Data Model

### 1.1 High-Level Folder Layout

```
server/src/games/exploding-kittens/
├── engine/
│   ├── GameEngine.ts          # orchestrates turn → action → effect
│   ├── ActionEngine.ts        # validates & queues actions
│   ├── EffectEngine.ts        # resolves card effects
│   └── TurnEngine.ts          # turn order, attack-stacking, direction
├── cards/
│   ├── registry.ts            # CardRegistry — single source of truth
│   ├── definitions/
│   │   ├── base.ts            # base-game card defs
│   │   ├── imploding.ts
│   │   ├── streaking.ts
│   │   ├── barking.ts
│   │   └── zombie.ts
│   └── expansions/            # extra modifiers per expansion
├── state/
│   ├── GameState.ts           # full server-side state
│   ├── PlayerState.ts         # per-player state
│   └── Serializer.ts          # state → client-safe view
├── network/
│   ├── Router.ts              # REST + WS endpoints
│   └── Events.ts              # typed event names & payloads
└── tests/
    ├── deck.test.ts
    ├── attacks.test.ts
    ├── nope.test.ts
    ├── defuse.test.ts
    ├── zombie.test.ts
    └── streaking.test.ts

client/src/games/exploding-kittens/
├── ExplodingKittensGame.tsx
├── engine/                    # lightweight client-side prediction
│   ├── GameEngine.ts
│   ├── ActionEngine.ts
│   ├── EffectEngine.ts
│   └── TurnEngine.ts
├── cards/
│   ├── registry.ts            # mirrors server registry
│   └── definitions/           # mirrors server definitions
├── state/
│   ├── GameState.ts
│   ├── PlayerState.ts
│   └── Serializer.ts          # deserialize server view
├── network/
│   └── Router.ts
├── components/
│   ├── Card.tsx
│   ├── Hand.tsx
│   ├── PlayArea.tsx
│   └── ...
└── assets/
    └── cards/                 # AI-generated art (WebP)
```

### 1.2 Key Principles

- **Cards are data, not code.** A card is a plain object. Effects are resolved by a single EffectEngine that maps `effect.type → handler`.
- **Actions are queued.** Every player action (play, draw, defuse, nope, favor-give) is pushed onto an `actionStack`. The top action is resolved; when it reaches a state that requires input, it yields (awaiting a new action from the relevant player).
- **Never send full GameState to clients.** `Serializer` produces a per-player view that hides opponents' hands, deck order, pending-cards, and secret choices (defuse position, bury location, see-future results).
- **Expansions extend, they don't replace.** Each expansion registers additional cards, modifies initial deck composition, and may hook into game-phase callbacks (e.g., `beforeDraw`, `onPlayerEliminated`, `modifyDeckCount`).

---

## 2. Card Definitions (Data-Driven)

### 2.1 Card Definition Shape

```typescript
interface CardDefinition {
  id: string;                      // e.g. "attack", "defuse"
  name: string;                    // display name
  expansion: ExpansionId;          // "base" | "imploding" | "streaking" | "barking" | "zombie"

  /** Number of copies to include for a 'balanced' game.
   *  May be overridden by DeckRecipe. */
  copies: number | ((players: number) => number);

  /** When can this card be played? */
  playable: {
    requiresTarget: boolean;       // need to pick another player
    selfTarget?: boolean;           // can only be played on self (e.g. Personal Attack)
    targetMustBeAlive?: boolean;
    requiresResponse?: 'favor' | 'defuse' | 'bury' | 'zombie_revive';
    playAtAnyTime?: boolean;       // true for Nope, Alter Future NOW
  };

  /** The effect this card produces when resolved. */
  effect: EffectDefinition;
}
```

### 2.2 Effect Type System

```typescript
type EffectDefinition =
  | { type: 'ADD_TURNS';      amount: number; stackable: boolean; selfTarget?: boolean }
  | { type: 'SKIP_TURNS';     all?: boolean }
  | { type: 'DRAW_CARDS';     amount: number; from?: 'top' | 'bottom' }
  | { type: 'STEAL_CARD';     random?: boolean }
  | { type: 'FORCE_GIVE';     to: 'player' | 'draw_pile' }
  | { type: 'SHUFFLE_DECK' }
  | { type: 'SEE_FUTURE';     count: number; showOthers?: boolean }
  | { type: 'REARRANGE_DECK'; count: number; showNextPlayer?: boolean }
  | { type: 'SWAP_POSITIONS'; what: 'top_bottom' }
  | { type: 'EXPLODE';        defusable: boolean; insert?: 'face_up' | 'face_down' }
  | { type: 'DEFUSE_AND_INSERT'; reviveTarget?: boolean }
  | { type: 'BURY';           count: number }
  | { type: 'POTLUCK' }
  | { type: 'CURSE';          duration: 'until_draw' }
  | { type: 'MARK_CARD' }
  | { type: 'CLONE' }
  | { type: 'STASH' }
  | { type: 'NOPE';           windowMs: number }
  | { type: 'REVERSE_DIRECTION' }
  | { type: 'GARBAGE_COLLECTION' }
  | { type: 'DIG_DEEPER' }
  | { type: 'FEED_THE_DEAD' }
  | { type: 'GRAVE_ROBBER' }
  | { type: 'CLAIRVOYANCE' }
  | { type: 'SPECIAL';        handler: string }; // for truly unique cards (Catomic Bomb, etc.)
```

### 2.3 Example Definitions

```typescript
// base.ts
export const ATTACK: CardDefinition = {
  id: 'attack',
  name: 'Attack',
  expansion: 'base',
  copies: 4,
  playable: { requiresTarget: false },
  effect: { type: 'ADD_TURNS', amount: 2, stackable: true },
};

export const DEFUSE: CardDefinition = {
  id: 'defuse',
  name: 'Defuse',
  expansion: 'base',
  copies: (p: number) => p + 1,
  playable: { requiresResponse: 'defuse' },
  effect: { type: 'DEFUSE_AND_INSERT' },
};

export const FAVOR: CardDefinition = {
  id: 'favor',
  name: 'Favor',
  expansion: 'base',
  copies: 4,
  playable: { requiresTarget: true, targetMustBeAlive: true, requiresResponse: 'favor' },
  effect: { type: 'FORCE_GIVE', to: 'player', random: false },
};

export const EXPLODING_KITTEN: CardDefinition = {
  id: 'exploding_kitten',
  name: 'Exploding Kitten',
  expansion: 'base',
  copies: (p: number) => p - 1,
  playable: {},
  effect: { type: 'EXPLODE', defusable: true },
};

// imploding.ts
export const IMPLODING_KITTEN: CardDefinition = {
  id: 'imploding_kitten',
  name: 'Imploding Kitten',
  expansion: 'imploding',
  copies: 1,
  playable: {},
  effect: { type: 'EXPLODE', defusable: false, insert: 'face_up' },
};

// streaking.ts
export const STREAKING_KITTEN: CardDefinition = {
  id: 'streaking_kitten',
  name: 'Streaking Kitten',
  expansion: 'streaking',
  copies: 1,
  playable: {},
  effect: { type: 'SPECIAL', handler: 'STREAKING_KITTEN_HANDLER' },
};

// barking.ts
export const BARKING_KITTEN: CardDefinition = {
  id: 'barking_kitten',
  name: 'Barking Kitten',
  expansion: 'barking',
  copies: 2,           // pair
  playable: { requiresTarget: true, targetMustBeAlive: true, requiresResponse: 'barking_chicken' },
  effect: { type: 'SPECIAL', handler: 'BARKING_KITTEN_CHICKEN' },
};

// zombie.ts
export const ZOMBIE_KITTEN: CardDefinition = {
  id: 'zombie_kitten',
  name: 'Zombie Kitten',
  expansion: 'zombie',
  copies: 5,
  playable: { requiresResponse: 'zombie_revive' },
  effect: { type: 'DEFUSE_AND_INSERT', reviveTarget: true },
};

export const CLONE: CardDefinition = {
  id: 'clone',
  name: 'Clone',
  expansion: 'zombie',
  copies: 2,
  playable: { requiresResponse: 'clone_target' },
  effect: { type: 'CLONE' },
};
```

### 2.4 Registry

```typescript
// registry.ts
import { baseCards } from './definitions/base.js';
import { implodingCards } from './definitions/imploding.js';
import { streakingCards } from './definitions/streaking.js';
import { barkingCards } from './definitions/barking.js';
import { zombieCards } from './definitions/zombie.js';

const REGISTRY = new Map<string, CardDefinition>();

export function registerExpansion(expansion: ExpansionId, cards: CardDefinition[]) {
  for (const card of cards) {
    REGISTRY.set(card.id, card);
  }
}

export function getCardDef(id: string): CardDefinition | undefined {
  return REGISTRY.get(id);
}

export function getAllDefinitions(): CardDefinition[] {
  return Array.from(REGISTRY.values());
}

// Initialize
registerExpansion('base', baseCards);
registerExpansion('imploding', implodingCards);
registerExpansion('streaking', streakingCards);
registerExpansion('barking', barkingCards);
registerExpansion('zombie', zombieCards);
```

---

## 3. Action System

### 3.1 Action Model

```typescript
interface GameAction {
  id: string;                     // unique per game
  playerId: string;
  type: 'PLAY_CARD' | 'DRAW_CARD' | 'RESOLVE_DEFUSE' | 'RESOLVE_FAVOR'
      | 'RESOLVE_BURY' | 'RESOLVE_NOPE' | 'RESOLVE_ZOMBIE_REVIVE'
      | 'RESOLVE_SEE_FUTURE' | 'RESOLVE_POTLUCK' | 'RESOLVE_BARKING'
      | 'RESOLVE_CLONE' | 'END_TURN';
  payload?: any;
  status: 'pending' | 'awaiting_response' | 'resolving' | 'resolved' | 'noped';
  createdAt: number;
  resolvedAt?: number;
}
```

### 3.2 Engine Flow

```
Player sends PLAY_CARD("attack")
  │
  ▼
ActionEngine.validate(PLAY_CARD) → checks turn, hand, phase, nope window
  │
  ▼
GameEngine.pushAction(action)
  │
  ▼
EffectEngine.resolve(action.effect)  → calls ADD_TURNS handler
  │
  ▼
EffectEngine.checkForNopeWindow(action)
  │
  ▼
If nope window:  action.status = 'awaiting_response'
                  TurnEngine.waitForNope(3000ms)
                  Broadcast NOPE_WINDOW_OPEN
  │
  ▼
Else:            action.status = 'resolved'
                  Apply state mutations
                  TurnEngine.advanceOrHold()
```

### 3.3 Waiting-States

Each card that requires another player's input triggers an `awaiting_response` state:

| Card | Action Received | What Server Does |
|------|----------------|------------------|
| Favor | `PLAY_CARD` | Sets `action.status=awaiting_response`, broadcasts `FAVOR_REQUEST(to,from)`. Waits for `RESOLVE_FAVOR(cardId)` from victim |
| Defuse | Auto-triggered on draw | Broadcasts `DEFUSE_WINDOW(player, deckSize)`. Waits for `RESOLVE_DEFUSE(insertIndex)` |
| Bury | `PLAY_CARD` | Broadcasts `BURY_WINDOW(player)`. Waits for `RESOLVE_BURY(insertIndex)` |
| Nope | `PLAY_CARD` | Opens 3s window, broadcasts `NOPE_AVAILABLE`. Waits for `RESOLVE_NOPE(fromPlayer)` or timeout |
| Cat pair | `PLAY_CARD(target)` | Opens steal: `FAVOR_REQUEST(from=target, to=player)` |
| Zombie Kitten | `PLAY_CARD` | Broadcasts `ZOMBIE_REVIVE_WINDOW(player, deadPlayers[])` |

### 3.4 Nope Chain Logic

```
Action "Attack" played by Alice
  │
  ▼
Nope window opens (3s)
  ├── Bob plays NOPE  →  actionStack.push( NOPE(bob) )
  │                       Nope window reopens for NOPE(bob) (3s)
  │                       ├── Charlie plays NOPE → actionStack.push( NOPE(charlie) )
  │                       │                       Nope window ...
  │                       │                       ├── (timeout) → resolve LIFO
  │                       │                       │   NOPE(charlie) → cancels NOPE(bob)
  │                       │                       │   → Attack resolves
  │                       │                       └── ...
  │                       └── (timeout) → NOPE(bob) wins → Attack is cancelled
  └── (timeout) → Attack resolves normally (Alice adds 2 turns to next player)
```

---

## 4. GameState & Serialization

### 4.1 Server-Side GameState

```typescript
interface GameState {
  players: PlayerState[];
  deck: Card[];                    // full ordered deck
  discardPile: Card[];
  turn: {
    playerId: string;
    phase: 'playing' | 'drawing' | 'nope_window' | 'defusing'
         | 'favor_awaiting' | 'burying' | 'see_future' | 'potluck'
         | 'zombie_revive' | 'barking_chicken' | 'clone_target';
    direction: 1 | -1;
    attackCount: number;           // stacked turns
    superSkipActive: boolean;
  };
  actionStack: GameAction[];
  effectState: {
    streakingKittenHolder?: string;
    cursor?: string;                // see-the-future viewer
    buryCard?: Card;                // card being buried (hidden from others)
  };
  settings: GameSettings;
  eventLog: GameEvent[];            // for replay/debug
  winner?: string;
}
```

### 4.2 PlayerState

```typescript
interface PlayerState {
  id: string;
  name: string;
  hand: Card[];                    // full hand (never sent to client)
  alive: boolean;
  dead?: boolean;                  // zombie kittens: eliminated but can be revived
  stash: Card[];                   // Tower of Power
  markedCardIds: string[];         // cards visible to all via Mark
  cursed: boolean;
  pendingTurns: number;
  hasSuperSkip: boolean;
}
```

### 4.3 Serializer (per-player view)

```typescript
function serializeFor(state: GameState, playerId: string): ClientGameState {
  const player = state.players.find(p => p.id === playerId)!;

  return {
    myHand: player.hand.filter(c => !player.markedCardIds.includes(c.id)),    // hide marked cards? no, they're visible
    myHand: player.hand.map(c => ({ ...c, marked: player.markedCardIds.includes(c.id) })),
    stash: player.stash,
    cursed: player.cursed,
    markedCardIds: player.markedCardIds,
    pendingTurns: player.pendingTurns,
    alive: player.alive,
    dead: player.dead,

    opponents: state.players
      .filter(p => p.id !== playerId)
      .map(p => ({
        id: p.id,
        name: p.name,
        cardCount: p.hand.length,
        stashCount: p.stash.length,
        alive: p.alive,
        dead: p.dead,
        cursed: p.cursed,
        markedCards: p.markedCardIds,   // everyone sees marked cards
        pendingTurns: p.pendingTurns,
      })),

    turn: state.turn,
    deckSize: state.deck.length,
    discardCount: state.discardPile.length,
    actionStack: state.actionStack,      // only current visible state
    settings: state.settings,
    winner: state.winner,
    eventLog: state.eventLog.slice(-50), // last 50 events for animation replay
  };
}
```

**Never include in client view:**
- Opponent hand contents (except marked cards)
- Full deck order
- Future cards seen by a player (see-future results)
- Defuse/bury position chosen by a player
- Pending favor choices (hidden from non-participants)

---

## 5. Build Phases

### Phase 0 — Framework Extraction (8h)

Before writing any EK-specific code, extract shared infrastructure from Yahtzee:

```
games/
├── yahtzee/
└── shared/                        ← new
    ├── GameEngine.ts              ← interface/abstract
    ├── GameRouter.ts              ← generic REST + WS patterns
    ├── GameRegistry.ts            ← engine + router association
    ├── LobbyManager.ts            ← already somewhat generic; harden
    ├── SessionManager.ts          ← session CRUD, broadcast helpers
    ├── StateSerializer.ts         ← per-player view contract
    └── types.ts
```

**Deliverable:** A single `games/registry.ts` that maps `gameId → { engine, router, lobbySettings }`. Adding a new game becomes a 1-line registration.

### Phase 0 — Framework Extraction (8h) ✅ DONE

Extracted shared game infrastructure from Yahtzee:
- `games/shared/GameServer.ts` — Generic game server interface
- `games/shared/GameRegistry.ts` — Singleton registry with session→gameId tracking, mountRouters
- `games/yahtzee/YahtzeeServer.ts` — Adapter for GameServer interface
- Refactored `index.ts` and `ws/handlers.ts` to use registry
- Adding a new game: `gameRegistry.register('game-id', server)` + `gameRegistry.mountRouters(app)`

### Phase 1 — Base Exploding Kittens Only (20h) ✅ DONE (committed 01b3503)

- 12 card definitions (data-driven, 0 effect classes)
- EffectEngine with 9 effect handlers
- ActionEngine + GameEngine + StateSerializer + Router
- 21 passing tests

### Phase 2 — Imploding Kittens ✅ DONE (committed 6581811)

- Imploding Kitten (two-phase face-up/face-down)
- Alter the Future 3x, Draw from Bottom, Reverse, Targeted Attack, Feral Cat
- Expansion filtering in deck builder
- 13 tests

### Phase 3 — Streaking Kittens ✅ DONE (committed 1002234)

- Streaking Kitten (safe EK hold via player.streakingKitten flag)
- Super Skip, See/Alter Future 5x, Swap Top/Bottom
- Garbage Collection, Catomic Bomb, Mark, Curse of Cat Butt
- 12 tests

### Phase 4 — Barking Kittens ✅ DONE (committed a5914f0)

- Barking Kitten chicken duel (check target for pair)
- Tower of Power stash support
- Potluck, Bury, Personal Attack (selfTarget ADD_TURNS)
- Share the Future
- 9 tests

### Phase 5 — Zombie Kittens ✅ DONE (committed d87f15f)

- Dead player state (alive=false, dead=true, keeps hand)
- Zombie Kitten (alternative to Defuse with revive)
- Dig Deeper, Feed the Dead, Grave Robber, Attack of the Dead, Shuffle Now
- All elimination points updated for zombie mode
- 7 tests

### Phase 2 — Expansion Engine (10h)

Build the infrastructure that makes adding expansions cheap:

```typescript
interface Expansion {
  id: ExpansionId;
  name: string;
  description: string;
  cards: CardDefinition[];
  maxPlayers: number;               // some expansions increase player cap
  modifyInitialDeck?: (deck: Card[], players: number) => Card[];
  hooks?: {
    beforeDraw?: (state: GameState, playerId: string) => void;
    onPlayerEliminated?: (state: GameState, playerId: string) => void;
    onPlayerRevived?: (state: GameState, playerId: string) => void;
    afterStateResolved?: (state: GameState) => void;
  };
}
```

### Phase 3 — Imploding Kittens (6h)

- Imploding Kitten (undefusable, face-up)
- Alter the Future 3x
- Draw from Bottom
- Reverse
- Targeted Attack
- Feral Cat

### Phase 4 — Streaking Kittens (8h)

- Streaking Kitten (hold EK without exploding)
- Super Skip
- See the Future 5x / Alter the Future 5x
- Swap Top & Bottom
- Garbage Collection
- Catomic Bomb
- Mark
- Curse of the Cat Butt

### Phase 5 — Barking Kittens (8h)

- Barking Kitten pair (game of chicken)
- Tower of Power (Stash zone)
- Potluck
- Bury
- Personal Attack (3x)
- Share the Future (3x)
- I'll Take That

### Phase 6 — Zombie Kittens (10h)

- Zombie Kitten (defuse + revive)
- Clone (copy card beneath)
- Clairvoyance (watch zombie insertion)
- Dig Deeper (draw 1, keep or draw next)
- Feed the Dead (living → dead)
- Grave Robber (dead → deck)
- Attack of the Dead (attack from dead)
- Shuffle Now

**Major rule change:** Dead players keep their hand and can play certain cards.

### Phase 7 — Art Pipeline (10h)

- Prompt library per card
- Script to call ComfyUI / Python generation
- Manifest generation
- CardArt component with SVG fallback
- NSFW variant art

### Phase 8 — Lobby Presets & Polish (15h)

- Game presets (Classic, Chaos, Zombie Night, Custom)
- NSFW toggle
- Rematch
- Sound effect hooks (disabled)
- Mobile testing
- Edge-case bug fixes

---

## 6. Deck Recipe System

### 6.1 Recipe Format

```typescript
interface DeckRecipe {
  id: string;
  name: string;
  description: string;
  playerRange: [number, number];

  /** Override card copy counts.
   *  Keys are card IDs. Values are absolute counts or a function of player count. */
  cardCounts?: Record<string, number | ((players: number) => number)>;

  /** Include entire expansions (uses their built-in copy counts by default). */
  expansions: ExpansionId[];

  /** Fine-grained add/remove. Applied after expansions. */
  overrides?: {
    add?: { cardId: string; count: number }[];
    remove?: { cardId: string; count: number }[];
  };
}
```

### 6.2 Example Recipes

```typescript
const CLASSIC: DeckRecipe = {
  id: 'classic',
  name: 'Classic',
  description: 'The original game. 2–5 players.',
  playerRange: [2, 5],
  expansions: ['base'],
};

const CHAOS: DeckRecipe = {
  id: 'chaos',
  name: 'Chaos',
  description: 'Every expansion. Maximum catastrophe.',
  playerRange: [2, 9],
  expansions: ['base', 'imploding', 'streaking', 'barking', 'zombie'],
  overrides: {
    // Adjust kitten count for Streaking
    add: [{ cardId: 'exploding_kitten', count: 1 }],
  },
};

const ZOMBIE_NIGHT: DeckRecipe = {
  id: 'zombie_night',
  name: 'Zombie Night',
  description: 'Zombie Kittens + Imploding Kittens. Come back from the dead.',
  playerRange: [2, 6],
  expansions: ['base', 'zombie', 'imploding'],
};

const CUSTOM: DeckRecipe = {
  id: 'custom',
  name: 'Custom',
  description: 'Mix and match expansions manually.',
  playerRange: [2, 9],
  expansions: [], // determined by lobby settings
};
```

### 6.3 DeckBuilder

```typescript
class DeckBuilder {
  static generate(recipe: DeckRecipe, playerCount: number): Card[] {
    const deck: Card[] = [];

    for (const expId of recipe.expansions) {
      const expansion = getExpansion(expId);
      for (const def of expansion.cards) {
        const count = recipe.cardCounts?.[def.id]
          ? (typeof recipe.cardCounts[def.id] === 'function'
            ? (recipe.cardCounts[def.id] as Function)(playerCount)
            : recipe.cardCounts[def.id])
          : (typeof def.copies === 'function' ? def.copies(playerCount) : def.copies);
        for (let i = 0; i < count; i++) {
          deck.push({ id: crypto.randomUUID(), type: def.id, ...def });
        }
      }
    }

    // Apply overrides
    if (recipe.overrides?.add) {
      for (const add of recipe.overrides.add) {
        const def = getCardDef(add.cardId);
        if (def) {
          for (let i = 0; i < add.count; i++) {
            deck.push({ id: crypto.randomUUID(), type: def.id, ...def });
          }
        }
      }
    }

    // Apply overrides remove (not implemented for MVP; recipe trumps)

    return shuffle(deck);
  }
}
```

---

## 7. Lobby & Presets

### 7.1 GameSettingsPage Additions

```
Choose a Mode:
┌─────────────────────────────────────┐
│  🐱 Classic                         │
│  2–5 players · Base game only       │
├─────────────────────────────────────┤
│  🔥 Chaos                           │
│  2–9 players · All expansions       │
├─────────────────────────────────────┤
│  ☠ Zombie Night                     │
│  2–6 players · Zombie + Imploding   │
├─────────────────────────────────────┤
│  🤪 Custom                          │
│  Choose your expansions             │
└─────────────────────────────────────┘

Only when Custom is selected:
  ☐ Imploding Kittens    (+1 player max)
  ☐ Streaking Kittens    (+1 Exploding Kitten)
  ☐ Barking Kittens      (+1 player max, Tower of Power)
  ☐ Zombie Kittens       (dead players keep cards)

  ☐ NSFW Mode            (alternative card art)

  Players: [2] [3] [4] [5] [6] [`7`] [8] [9]
```

### 7.2 Lobby Settings Payload

```typescript
interface ExplodingKittensSettings {
  recipe: string;            // 'classic' | 'chaos' | 'zombie_night' | 'custom'
  expansions: ExpansionId[];
  nsfwMode: boolean;
  maxPlayers: number;
}
```

### 7.3 Server Start Handler

```typescript
// In lobby.ts start handler:
app.post('/api/lobby/start', (req, res) => {
  // ... existing validation ...

  const recipe = getRecipe(lobby.settings.recipe);
  const sessionId = uuid();
  createExplodingKittensSession(sessionId, {
    players: result.players,
    recipe,
    playerCount: result.players.length,
    nsfwMode: lobby.settings.nsfwMode,
  });

  // ... broadcast + respond ...
});
```

---

## 8. Network Protocol

### 8.1 Client → Server Messages

| Type | Payload | When |
|------|---------|------|
| `PLAY_CARD` | `{ cardId, targetId?, metadata? }` | Player plays a card from hand |
| `DRAW_CARD` | `{}` | Player ends turn by drawing |
| `RESOLVE_DEFUSE` | `{ insertIndex }` | Defusing player chooses position |
| `RESOLVE_FAVOR` | `{ cardId }` | Victim chooses which card to give |
| `RESOLVE_BURY` | `{ insertIndex }` | Burying player chooses position |
| `RESOLVE_NOPE` | `{}` | A player plays Nope in window |
| `RESOLVE_ZOMBIE_REVIVE` | `{ targetId, insertIndex }` | Zombie Kitten resolution |
| `RESOLVE_SEE_FUTURE` | `{}` | Player closes see-future view |
| `RESOLVE_POTLUCK` | `{ cardId }` | Player contributes to potluck |
| `RESOLVE_CLONE` | `{ targetCardId }` | Clone target selection |

### 8.2 Server → Client Messages

| Type | Payload | Visibility |
|------|---------|------------|
| `GAME_STATE` | `ClientGameState` (per-player view) | Private to each player |
| `PLAYER_ACTION` | `{ playerId, cardId, targetId? }` | Broadcast (public summary) |
| `NOPE_WINDOW_OPEN` | `{ actionId, expiresAt }` | Broadcast to all alive players |
| `NOPE_PLAYED` | `{ playerId }` | Broadcast |
| `NOPE_RESOLVED` | `{ actionId, noped: boolean }` | Broadcast |
| `DEFUSE_WINDOW` | `{ playerId, deckSize }` | Private to defusing player |
| `DEFUSE_RESOLVED` | `{ playerId }` | Broadcast (no position) |
| `FAVOR_REQUEST` | `{ fromPlayerId, toPlayerId }` | Private to victim |
| `FAVOR_RESOLVED` | `{ fromPlayerId, cardId }` | Private to attacker + victim |
| `FAVOR_COMPLETE` | `{}` | Broadcast (card given) |
| `BURY_WINDOW` | `{ playerId }` | Private to burying player |
| `BURY_RESOLVED` | `{ playerId }` | Broadcast (no position) |
| `ZOMBIE_REVIVE_OPEN` | `{ playerId, deadPlayerIds[] }` | Private to player |
| `ZOMBIE_REVIVED` | `{ playerId, revivedId }` | Broadcast |
| `CARD_DRAWN` | `{ playerId, card? }` | card is only sent to self; others see just `playerId` |
| `EXPLOSION` | `{ playerId, defusable }` | Broadcast |
| `PLAYER_ELIMINATED` | `{ playerId, isZombie }` | Broadcast |
| `PLAYER_REVIVED` | `{ playerId }` | Broadcast |
| `GAME_OVER` | `{ winnerId, scores }` | Broadcast |
| `TURN_CHANGED` | `{ playerId, direction, attackCount }` | Broadcast |
| `DECK_SHUFFLED` | `{}` | Broadcast |
| `STATE_SYNC` | `{ gameState }` | Private — full state resync on reconnect |

### 8.3 WS Room Setup

Same as Yahtzee:

```typescript
// In handlers.ts:
wsServer.joinRoom(ws, `game:${sessionId}`);
setWsBroadcast(sessionId, (event: string, payload: any) => {
  wsServer.broadcast(`game:${sessionId}`, { type: event, payload });
});

// Register per-player send for private messages:
const playerSend = new Map<string, (payload: any) => void>();
setWsSend(sessionId, playerId, (payload: any) => {
  const client = getClient(sessionId, playerId);
  if (client) wsServer.sendTo(client.ws, payload);
});
```

---

## 9. Testing Strategy

### 9.1 Test Framework

Use **Vitest** (already in client deps; add to server devDeps).

### 9.2 Test Files

```
server/src/games/exploding-kittens/tests/
├── setup.ts               # shared helpers: createGame, playCard, drawCard, etc.
├── deck.test.ts           # Deck composition per recipe + player count
├── attacks.test.ts        # Attack stacking, Personal Attack, Targeted Attack
├── nope.test.ts           # Nope chain, multi-nope, Nope on Nope
├── defuse.test.ts         # Defuse window, insert position, Streaking interaction
├── zombie.test.ts         # Zombie Kitten: revive, dead-state, Feed The Dead
├── streaking.test.ts      # Streaking Kitten: safe holding, explosion on loss
├── barking.test.ts        # Barking Kitten chicken, Tower of Power, Potluck, Bury
├── imploding.test.ts      # Imploding Kitten face-up/deadly cycle
├── cat_pairs.test.ts      # Cat pair steal (random card)
├── favor.test.ts          # Favor: victim choice, timeout
├── skip.test.ts           # Skip, Super Skip (skip all turns)
├── see_future.test.ts     # See future privacy, Alter Future reorder
├── win_condition.test.ts  # Last alive, all dead scenarios
└── edge_cases.test.ts     # Empty hand, only 1 alive, no defuses, full deck
```

### 9.3 Example Test

```typescript
// attacks.test.ts
import { describe, it, expect } from 'vitest';
import { createGame } from '../engine/GameEngine.js';
import { playCard, drawCard, skipTurn } from './setup.js';

describe('Attack', () => {
  it('adds 2 turns to the next player', () => {
    const game = createGame({ recipe: 'classic', playerCount: 3 });
    const nextPlayer = game.players[(game.turn.playerId + 1) % 3];

    playCard(game, game.turn.playerId, 'attack');

    expect(nextPlayer.pendingTurns).toBe(2);
  });

  it('stacks when multiple Attacks are played', () => {
    const game = createGame({ recipe: 'classic', playerCount: 2 });

    playCard(game, game.turn.playerId, 'attack');
    playCard(game, game.turn.playerId, 'attack');

    const nextPlayer = game.players[(game.turn.playerId + 1) % 2];
    expect(nextPlayer.pendingTurns).toBe(4);
  });

  it('does not skip the attacker\'s turn immediately', () => {
    const game = createGame({ recipe: 'classic', playerCount: 3 });
    const current = game.turn.playerId;

    playCard(game, current, 'attack');

    expect(game.turn.playerId).toBe(current); // still their turn
  });
});

describe('Nope Chain', () => {
  it('resolves to original action if Nope is noped', () => {
    const game = createGame({ recipe: 'classic', playerCount: 3 });
    const attacker = game.turn.playerId;
    const noper = game.players.find(p => p.id !== attacker && p.hand.some(c => c.type === 'nope'))!;

    playCard(game, attacker, 'attack');
    expect(game.actionStack[0].status).toBe('nope_window');

    playCard(game, noper.id, 'nope'); // Nope the attack
    expect(game.actionStack[0].status).toBe('nope_window'); // Nope can be noped

    playCard(game, attacker, 'nope'); // Nope the Nope
    // Resolve LIFO: Nope(attacker) cancels Nope(noper) → Attack resolves
    advanceTime(game, 3001); // nope window expires
    expect(game.actionStack.length).toBe(0);
    expect(game.players.find(p => p.id !== attacker)!.pendingTurns).toBe(2);
  });
});
```

---

## 10. Client UI / Animations

### 10.1 Screen Layout (Mobile-First)

```
┌─────────────────────────────┐
│  Top Bar: Phase | Turn | You│   48px
├─────────────────────────────┤
│                             │
│  OPPONENT AREA (horizontal) │   Other players (card count, stash count)
│  [P2: 4🧢] [P3: 2] [P4: 3] │
│                             │
├─────────────────────────────┤
│         PLAY AREA           │   Center: cards played, discard pile,
│    [Attack] [Nope] [Skip]   │   Nope chain stack, Tower of Power
│                             │
├─────────────────────────────┤
│     YOUR HAND (fan)         │   Bottom: your cards, tappable/draggable
│  [💣] [🛡️] [⚔️] [⏭️] [🔮]  │
│                             │
├─────────────────────────────┤
│  ⚡Action Bar (context)    │   56px
└─────────────────────────────┘
```

### 10.2 Components

| Component | Responsibility |
|-----------|----------------|
| `Card.tsx` | Renders procedural SVG frame + optional AI art overlay. Face-up/down. Marked indicator. Selected glow. |
| `Hand.tsx` | Fan layout via `transform: rotate(n * angle)`. Tap to select, drag to play (Framer Motion `drag`). |
| `PlayArea.tsx` | Cards played this turn (stacked). Discard pile with count badge. Nope chain visual. |
| `OpponentBar.tsx` | Horizontal scrollable list of opponents. Shows name, card count, stash icon/count, curse/dead status. |
| `ActionBar.tsx` | Context-sensitive: [Play] [End Turn] [Nope!] [Draw Card]. |
| `DefuseModal.tsx` | Shows deck as N slots. Player clicks one. Other players see "defusing..." animation. |
| `FavorModal.tsx` | Victim sees hand, selects card. Attacker sees waiting state. Others see nothing. |
| `NopeChain.tsx` | Card icons stack in vertical timeline during nope window. Timer bar. |
| `GameOverOverlay.tsx` | Winner reveal, final scores, rematch button, back to lobby. |

### 10.3 Framer Motion Animations

| Animation | Trigger | Duration |
|-----------|---------|----------|
| Card drawn (deck → hand) | Draw action | 400ms spring |
| Card played (hand → center) | Play action | 300ms ease-out |
| Card discarded (center → pile) | Resolution | 300ms ease-in |
| Card steal (opponent → you) | Cat pair / Favor | 500ms arc |
| Nope slide-in | Nope played | 200ms slide-up |
| Nope chain cascade | Chain resolve | 400ms |
| Defuse reinsert (deck) | Slot click | 500ms + ripple |
| Turn transition | Turn change | 300ms opacity |
| Attack stack pulse | Attack played | 400ms scale bounce |
| Elimination | Player loses | 800ms fade + slide out |
| Revive | Player returns | 600ms scale + glow |
| Mark glow | Mark card | Continous pulse |
| Selection lift | Tap card | 200ms spring |
| Timer bar | Nope window | Linear shrink |

---

## 11. Art Pipeline

### 11.1 Phasing

| Phase | Art Type | When |
|-------|----------|------|
| Dev / Early Testing | Procedural SVG (colored rectangles + emoji + text) | Phase 1-6 |
| Alpha | AI-generated card art (one batch per card type) | Phase 7 |
| Beta | NSFW variant art | Phase 7 |
| Launch | All art polished, manifest with fallbacks | Phase 8 |

### 11.2 Generation Approach

Reference files provided by user:
- `C:\AI_Workspace\Cryptarch\ST-comfyui-sdxl-workflow-template.json`
- `C:\AI_Workspace\Cryptarch\ST-comfyui-region-workflow.json`
- `C:\AI_Workspace\Cryptarch\ST-comfyui-map-workflow.json`
- `C:\AI_Workspace\Image_gen\generate_better_weapons.py`

```python
# generate-card-art.py
# Pattern: read prompt library → call ComfyUI API → save WebP → update manifest

import json, os, requests

PROMPT_LIBRARY = "server/scripts/card-prompts.json"
OUTPUT_DIR = "client/public/cards/"
COMFYUI_URL = "http://localhost:8188/prompt"

for card in prompt_library["cards"]:
    for variant in ["base", "nsfw"]:
        if variant == "nsfw" and not card.get("nsfw_prompt"):
            continue

        payload = build_comfyui_payload(
            workflow_template=workflow,
            prompt=card[f"{variant}_prompt"],
            negative_prompt=prompt_library["negative"],
            size=card.get("size", (512, 768)),
            seed=card.get("seed", 42),
        )

        response = requests.post(COMFYUI_URL, json={"prompt": payload})
        image_data = wait_for_completion(response.json()["id"])

        filename = f"{card['id']}.{variant}.webp"
        path = os.path.join(OUTPUT_DIR, card["expansion"], filename)
        with open(path, "wb") as f:
            f.write(image_data)

        manifest["cards"][card["id"]][variant] = f"/cards/{card['expansion']}/{filename}"

with open(f"{OUTPUT_DIR}/manifest.json", "w") as f:
    json.dump(manifest, f, indent=2)
```

### 11.3 Prompt Library Shape

```json
{
  "style": "The Oatmeal inspired, thick black outlines, flat colors, humorous cartoon, white background",
  "negative": "realistic, 3D, shaded, photorealistic, intricate details",
  "cards": [
    {
      "id": "exploding_kitten",
      "expansion": "base",
      "base_prompt": "A cute cartoon kitten with a lit stick of dynamite tied to its tail, cartoon explosion lines, bright red and orange palette",
      "nsfw_prompt": "A sexy devil cat with dynamite, suggestive pose, red lingerie, cartoon style, cheeky expression",
      "seed": 1001,
      "size": [512, 768]
    },
    {
      "id": "defuse",
      "expansion": "base",
      "base_prompt": "A cartoon laser pointer being used to defuse a bomb, green laser beam, tense cat face",
      "nsfw_prompt": "A cartoon cat in bondage gear holding a laser pointer, suggestive defusal scene",
      "seed": 1002
    }
  ]
}
```

### 11.4 Fallback Strategy

```typescript
function CardArt({ card }: { card: Card & { definition: CardDefinition } }) {
  const manifest = useCardManifest();
  const artUrl = manifest?.cards[card.definition.id]?.base;

  if (artUrl) {
    return <Image src={artUrl} onError={() => <SVGCard card={card} />} />;
  }

  return <SVGCard card={card} />;
}
```

---

## 12. Replay System

### 12.1 Event Log

```typescript
interface GameEvent {
  id: string;
  timestamp: number;
  type: string;
  playerId?: string;
  cardId?: string;
  targetId?: string;
  payload?: any;
}

// In GameEngine:
class ReplayLogger {
  private events: GameEvent[] = [];

  log(type: string, playerId?: string, cardId?: string, targetId?: string, payload?: any) {
    this.events.push({
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      type,
      playerId,
      cardId,
      targetId,
      payload,
    });
  }

  getEvents(since?: number): GameEvent[] {
    return since ? this.events.filter(e => e.timestamp > since) : this.events;
  }

  serialize(): string {
    return JSON.stringify(this.events);
  }
}
```

### 12.2 Use Cases

- **Debugging:** Full event replay in dev tools
- **Bug Reports:** User can export event log for reproduction
- **Spectator mode** (future): Subscribe to live replay stream
- **AI training** (future): Use as training data for bot

---

## 13. Time Estimates

### 13.1 Revised Timeline

| Phase | Deliverable | Est. Time |
|-------|-------------|-----------|
| 0 | Framework extraction (shared game infra from Yahtzee) | 8h |
| 1 | Base Exploding Kittens engine + multiplayer | 20h |
| 2 | Expansion engine + tests | 10h |
| 3 | Imploding Kittens expansion | 6h |
| 4 | Streaking Kittens expansion | 8h |
| 5 | Barking Kittens expansion | 8h |
| 6 | Zombie Kittens expansion | 10h |
| 7 | Art pipeline + AI generation | 10h |
| 8 | Lobby presets, NSFW mode, polish, testing | 15h |
| **Total** | | **95h** |

### 13.2 Milestones

| Milestone | Phases Done | Cumulative Time |
|-----------|-------------|-----------------|
| MVP (playable base game) | 0, 1, 2 | 38h |
| All expansions playable | 3, 4, 5, 6 | 70h |
| Full release (art + polish) | 7, 8 | 95h |

---

## Appendix A: Expansion Summary Table

| Expansion | Cards Added | Max Players | Key Mechanics | Priority |
|-----------|-------------|-------------|---------------|----------|
| Base | 56 | 5 | Core game | P0 |
| Imploding | 20 | 6 | Undefusable kitten, alter future, reverse direction, targeted attack | P1 |
| Streaking | 15 | 5 | Hold EK in hand, see/alter 5x, swap top-bottom, catomic bomb, mark, curse | P1 |
| Barking | 20 | 6 | Chicken duel, tower of power stash, potluck, bury, personal attack 3x | P1 |
| Zombie | 22 | 5 | Revive dead players, clone, clairvoyance, dig deeper, feed/grave rob, attack of dead | P1 |

## Appendix B: Effect Handler Registry

```typescript
// EffectEngine.ts
const EFFECT_HANDLERS = new Map<string, EffectHandler>();

function register(type: string, handler: EffectHandler) {
  EFFECT_HANDLERS.set(type, handler);
}

export function resolveEffect(state: GameState, effect: EffectDefinition, context: EffectContext): EffectResult {
  const handler = EFFECT_HANDLERS.get(effect.type);
  if (!handler) throw new Error(`Unknown effect type: ${effect.type}`);
  return handler(state, effect as any, context);
}

// Handlers registered in expansion modules:
register('ADD_TURNS', (state, e: AddTurnsEffect, ctx) => {
  const targetId = e.selfTarget ? ctx.playerId : nextPlayer(state);
  const target = state.players.find(p => p.id === targetId)!;
  target.pendingTurns += e.amount;
  return { success: true };
});

register('NOPE', (state, e, ctx) => {
  // Opens nope window on target action
  state.turn.phase = 'nope_window';
  return { success: true, awaitsResponse: true };
});

register('EXPLODE', (state, e: ExplodeEffect, ctx) => {
  if (e.defusable) {
    // Check for defuse cards or streaking kitten
    if (hasDefuse(ctx.player) || hasStreakingKitten(ctx.player)) {
      state.turn.phase = 'defusing';
      return { success: true, awaitsResponse: true };
    }
  }
  eliminatePlayer(state, ctx.playerId);
  return { success: true };
});
```

## Appendix C: ComfyUI Integration Plan

The user has existing ComfyUI workflows at:
- `C:\AI_Workspace\Cryptarch\ST-comfyui-sdxl-workflow-template.json` (SDXL image generation)
- `C:\AI_Workspace\Cryptarch\ST-comfyui-region-workflow.json` (regional prompting for framing)
- `C:\AI_Workspace\Cryptarch\ST-comfyui-map-workflow.json` (map/background generation)
- `C:\AI_Workspace\Image_gen\generate_better_weapons.py` (reference for small icon generation)

Our approach:
1. Port `generate_better_weapons.py` to TypeScript as `server/scripts/generate-card-art.ts`
2. Use the SDXL workflow template for card image generation (each card ~512x768)
3. Use the region workflow for card frame + art composition (artwork region + border/frame region)
4. Store output as WebP with transparency in `client/public/cards/`
5. Generate a `manifest.json` mapping card IDs → file paths

The script will:
- Read promt library
- Batch submit to running ComfyUI instance
- Poll for completion
- Save results
- Update manifest

This is **Phase 7** work and should not block earlier phases.
