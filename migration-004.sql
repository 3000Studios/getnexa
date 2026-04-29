-- Neural Governance: Community Voting for Game Releases
CREATE TABLE IF NOT EXISTS upcoming_games (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  genre TEXT,
  status TEXT NOT NULL DEFAULT 'proposal', -- proposal | development | scheduled
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS governance_votes (
  user_id INTEGER NOT NULL,
  game_id TEXT NOT NULL,
  vote_type TEXT NOT NULL, -- 'up' | 'down'
  created_at INTEGER NOT NULL,
  PRIMARY KEY (user_id, game_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (game_id) REFERENCES upcoming_games(id) ON DELETE CASCADE
);

-- Seed some proposals
INSERT OR IGNORE INTO upcoming_games (id, name, description, genre, status, created_at) VALUES 
('cyber_chess', 'Cyber Chess', 'High-fidelity tactical grid combat.', 'Strategy', 'proposal', 1714362000),
('void_racer', 'Void Racer', 'Sub-millisecond reactive racing.', 'Racing', 'proposal', 1714362000),
('neuro_puzzle', 'Neuro Puzzle', 'Cognitive logic synchronization.', 'Puzzle', 'proposal', 1714362000);
