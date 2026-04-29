-- Migration 005: Live Arena Presence
CREATE TABLE IF NOT EXISTS live_presence (
  user_id INTEGER PRIMARY KEY,
  username TEXT NOT NULL,
  game_id TEXT NOT NULL,
  score INTEGER DEFAULT 0,
  last_heartbeat INTEGER NOT NULL,
  status TEXT DEFAULT 'playing',
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_live_presence_heartbeat ON live_presence(last_heartbeat);
CREATE INDEX IF NOT EXISTS idx_live_presence_score ON live_presence(score);
