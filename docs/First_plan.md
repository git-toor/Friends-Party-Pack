# Friends Party Pack — Implementation Plan

A multiplayer party game pack playable on mobile browsers. Host launches server, players join via link + code.

## Tech Stack

| Layer | Choice |
|---|---|
| **Language** | TypeScript |
| **Frontend** | React 19 + Vite |
| **Server** | Express + WebSocket (ws) |
| **3D Dice** | Three.js + cannon-es (DiceBox.js from Cryptarch) |
| **Persistence** | SQLite via better-sqlite3 |
| **Mobile** | Responsive CSS, touch events |

## Routes

| Route | Page | Purpose |
|---|---|---|
| `/` | HomePage | Game selection grid + "Join Game" button |
| `/game/:id/settings` | GameSettingsPage | Configure game (player count 2-8) |
| `/lobby/:code` | LobbyPage | Host: code + QR + share + start. Guest: ready toggle |
| `/join` | JoinPage | Enter code + nickname |
| `/join/:code` | JoinPage | Enter nickname (code pre-filled) |
| `/game/:sessionId` | GamePage | Gameplay (DiceOverlay + HTML UI) |

## Flow

```
HOST: Open site → Select Yahtzee → Settings (2-8 players) →
      Create Lobby → Share code + QR + link →
      Wait for players → All ready → Start Game

GUEST: Open link → Enter nickname → Join lobby →
       Mark ready → Game starts automatically
```

## Yahtzee Per-Turn Interaction

```
Tap "Roll" → 3D physics throw (cannon-es) → dice settle
  → Tap dice to select (green glow) → tap "Keep Selected"
    → Selected dice tween to kept row at bottom of 3D canvas
      → Tap "Roll Remaining" (unkept dice re-roll)
        → Repeat up to 3 roll phases total
          → Tap a scorecard category → score submitted → next player
```

## File Structure

```
friends-party-pack/
├── package.json                     # npm workspaces: ["server","client"]
├── tsconfig.base.json
│
├── server/
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── index.ts                 # Express + HTTP + WS bootstrap
│       ├── config.ts
│       ├── db/
│       │   ├── schema.ts            # SQLite CREATE TABLE
│       │   └── index.ts             # DB init
│       ├── lobby/
│       │   ├── LobbyManager.ts      # create/join/ready/start/leave
│       │   └── LobbyRepository.ts   # SQLite CRUD
│       ├── ws/
│       │   ├── WsServer.ts          # WS server + room management
│       │   └── handlers.ts          # Inbound message routing
│       └── games/
│           ├── registry.ts          # Game interface + registry
│           └── yahtzee/
│               ├── YahtzeeEngine.ts # Pure game logic + scoring
│               └── YahtzeeRouter.ts # REST + WS route handlers
│
├── client/
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts               # Proxy /api, /ws to server
│   ├── index.html
│   ├── public/textures/             # Dice texture images
│   └── src/
│       ├── main.tsx
│       ├── App.tsx                  # HashRouter
│       ├── styles/global.css        # Mobile-first responsive
│       │
│       ├── dice/                    # Copied from Cryptarch
│       │   ├── DiceBox.js           # + keepDice() + keep anim (~30 lines added)
│       │   ├── DiceFactory.js
│       │   ├── DiceColors.js
│       │   ├── DicePreset.js
│       │   ├── DiceNotation.js
│       │   ├── helper.js
│       │   └── const/
│       │       ├── dice.js
│       │       ├── colorsets.js
│       │       ├── texturelist.js
│       │       ├── themes.js
│       │       └── materialtypes.js
│       │
│       ├── components/
│       │   ├── DiceOverlay.tsx      # React wrapper (adapted from Cryptarch)
│       │   ├── Button.tsx
│       │   └── QRCode.tsx
│       │
│       ├── pages/
│       │   ├── HomePage.tsx
│       │   ├── GameSettingsPage.tsx
│       │   ├── JoinView.tsx
│       │   ├── LobbyPanel.tsx
│       │   └── GamePage.tsx         # DiceOverlay + HTML UI
│       │
│       ├── games/yahtzee/
│       │   ├── YahtzeeGame.tsx      # Main game UI
│       │   └── ScoreCard.tsx        # Score sheet + category buttons
│       │
│       ├── hooks/
│       │   ├── useWebSocket.ts      # WS connection + reconnect
│       │   └── useLobby.ts          # Lobby lifecycle
│       │
│       └── api/
│           ├── client.ts            # fetch() wrapper
│           └── ws.ts                # WS connection manager
│
└── shared/
    └── types.ts                     # Shared TS interfaces
```

---

## Phases

### Phase 1: Project Scaffold

Files to create:
- `package.json` (root with workspaces)
- `tsconfig.base.json`
- `server/package.json`, `server/tsconfig.json`
- `client/package.json`, `client/tsconfig.json`, `client/vite.config.ts`, `client/index.html`
- `shared/types.ts`
- `server/src/config.ts`
- `server/src/db/schema.ts`, `server/src/db/index.ts`
- `server/src/index.ts` (Express + WS + SQLite bootstrap, health endpoint)
- `client/src/main.tsx` (mount App)
- `client/src/App.tsx` (stub router)
- `client/src/styles/global.css`

Tests:
- Server starts and responds to GET /api/health
- SQLite initializes with correct tables
- Vite dev server starts without errors
- Dependencies install without conflicts

### Phase 2: Dice Engine

Files to create:
- Copy all `client/src/dice/` files from Cryptarch
- Modify `DiceBox.js` to add:
  - `keepDice(indices)` method — removes bodies from physics, tweens meshes to kept row
  - `getSettledValues()` — returns face-up values of settled dice
  - `resetKept()` — clears kept meshes for next turn
  - `onDieTap(callback)` — click handler for die selection
- `client/src/components/DiceOverlay.tsx` — React wrapper

Tests:
- DiceBox initializes canvas in container div
- `roll("5d6")` returns 5 values
- `keepDice([0,2])` animates 2 dice to kept row, removes from active physics
- `getSettledValues()` returns correct face values
- Tap on settled die triggers selection callback
- Canvas is full-screen, transparent background
- Pointer-events toggle between `auto` and `none`

### Phase 3: Lobby System

Files to create:
- `server/src/lobby/LobbyManager.ts`
- `server/src/lobby/LobbyRepository.ts`
- `server/src/ws/WsServer.ts`
- `server/src/ws/handlers.ts`
- `client/src/pages/HomePage.tsx`
- `client/src/pages/GameSettingsPage.tsx`
- `client/src/pages/JoinView.tsx`
- `client/src/pages/LobbyPanel.tsx`
- `client/src/components/Button.tsx`
- `client/src/components/QRCode.tsx`
- `client/src/hooks/useWebSocket.ts`
- `client/src/hooks/useLobby.ts`
- `client/src/api/client.ts`
- `client/src/api/ws.ts`

Tests:
- POST /lobby/create returns 4-char code, stores in SQLite
- POST /lobby/join adds player, broadcasts LOBBY_UPDATED
- POST /lobby/ready toggles ready state
- POST /lobby/start transitions to STARTED only when host + all ready
- Non-host cannot start lobby
- WS connects, receives LOBBY_UPDATED on join/ready/leave
- Duplicate names rejected
- Full lobby (max players) rejects new joins
- QR code renders valid URL
- Join with invalid code shows error
- Lobby survives server restart (SQLite persistence)

### Phase 4: Yahtzee Server Engine

Files to create:
- `server/src/games/registry.ts`
- `server/src/games/yahtzee/YahtzeeEngine.ts`
- `server/src/games/yahtzee/YahtzeeRouter.ts`

Tests:
- `rollDice()` returns 5 values 1-6
- `scoreCategory([1,1,1,2,2], "full_house")` returns 25
- `scoreCategory([1,1,1,1,1], "yahtzee")` returns 50
- `scoreCategory([1,2,3,4,5], "large_straight")` returns 40
- `scoreCategory([1,2,3,4,6], "small_straight")` returns 30
- Upper section bonus (63+): awards +35
- 3 roll phases enforced per turn
- Invalid category selection returns error
- Turn order round-robin across players
- 13 rounds per player, then game over
- Game state survives full round trip via REST
- All scoring categories produce correct values (ones through chance)

### Phase 5: Yahtzee Client UI

Files to create:
- `client/src/pages/GamePage.tsx`
- `client/src/games/yahtzee/YahtzeeGame.tsx`
- `client/src/games/yahtzee/ScoreCard.tsx`

Tests:
- ScoreCard renders 13 category rows + totals
- Tapping valid category highlights it
- Scoring a category fills the value and dims it
- Dice keeper renders kept dice row at bottom
- Roll button shows remaining roll count (2, 1, 0)
- Roll button disabled during other player's turn
- "Keep Selected" button only appears when dice are settled
- Tap on die toggles selection highlight
- Non-active player sees read-only view

### Phase 6: Integration

Files to modify:
- `client/src/App.tsx` — wire full router
- Wire YahtzeeGame → useWebSocket → server YahtzeeRouter
- Wire DiceOverlay keep → POST /game/yahtzee/keep
- Wire DiceOverlay roll → POST /game/yahtzee/roll
- Wire DiceOverlay score → POST /game/yahtzee/score

Tests:
- Full game: host creates → players join → all ready → game starts
- Roll flow: Roll → dice settle → tap 3 → Keep → animate → Roll remaining → ... → Score
- Server values match dice face-up values after settle
- Non-active player sees updated state after opponent's turn
- Game ends after all rounds, winner displayed
- Disconnect + reconnect restores game state
- Mobile responsive (320px, 768px, 1024px viewports)

### Phase 7: Deployment

Files to create:
- `Dockerfile` (or Railway config)
- `scripts/dev.ps1`, `scripts/dev.sh`
- `README.md`

Tests:
- `npm run dev` starts both server + client
- Client connects to server on localhost
- Railway deploy succeeds from GitHub
- Full game works on Railway URL

---

## Commit Strategy

After each phase, in order:
1. Write/run tests for the phase
2. Fix any failures
3. `git add .`
4. `git commit -m "Phase N: description"`
5. Proceed to next phase
