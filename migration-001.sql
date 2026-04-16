-- Migration 001: Tournaments, payouts, creator applications
CREATE TABLE IF NOT EXISTS tournaments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  game_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  entry_cents INTEGER NOT NULL DEFAULT 0,
  prize_pool_cents INTEGER NOT NULL DEFAULT 0,
  starts_at INTEGER NOT NULL,
  ends_at INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'upcoming',
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_tournaments_status ON tournaments(status, ends_at);

CREATE TABLE IF NOT EXISTS tournament_entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tournament_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  best_score INTEGER NOT NULL DEFAULT 0,
  paid INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  UNIQUE (tournament_id, user_id),
  FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS payouts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  provider TEXT NOT NULL,
  amount_cents INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  reference TEXT,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS creator_applications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  website TEXT,
  portfolio TEXT,
  about TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at INTEGER NOT NULL
);

-- Seed a few tournaments so the page has real content on first load
INSERT INTO tournaments (game_id, title, description, entry_cents, prize_pool_cents, starts_at, ends_at, status, created_at) VALUES
  ('snake', 'Weekly Snake Slither', 'Highest score wins 70% of the pool. 2nd places 20%, 3rd 10%.', 199, 5000, strftime('%s','now') * 1000, (strftime('%s','now') + 7*24*3600) * 1000, 'active', strftime('%s','now')*1000),
  ('2048', '2048 Grand Merge', 'Top tile + score determines the winner. Weekly.', 199, 5000, strftime('%s','now')*1000, (strftime('%s','now')+7*24*3600)*1000, 'active', strftime('%s','now')*1000),
  ('tetris', 'Tetris Blitz Cup', '5-minute Tetris blitz. Single-bracket weekly cup.', 299, 10000, strftime('%s','now')*1000, (strftime('%s','now')+7*24*3600)*1000, 'active', strftime('%s','now')*1000),
  ('breakout', 'Brick Breaker Rally', 'Highest score within 7 days. Free entry this week!', 0, 2500, strftime('%s','now')*1000, (strftime('%s','now')+7*24*3600)*1000, 'active', strftime('%s','now')*1000);
