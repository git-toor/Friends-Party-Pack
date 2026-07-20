export const CREATE_TABLES = `
CREATE TABLE IF NOT EXISTS lobbies (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  game_id TEXT NOT NULL,
  host_player_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'OPEN' CHECK(status IN ('OPEN','STARTED','FINISHED')),
  max_players INTEGER NOT NULL DEFAULT 4,
  settings TEXT NOT NULL DEFAULT '{}',
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS lobby_players (
  id TEXT PRIMARY KEY,
  lobby_id TEXT NOT NULL REFERENCES lobbies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  is_host INTEGER NOT NULL DEFAULT 0,
  ready INTEGER NOT NULL DEFAULT 0,
  joined_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_lobbies_code ON lobbies(code);
CREATE INDEX IF NOT EXISTS idx_lobby_players_lobby ON lobby_players(lobby_id);
`;
