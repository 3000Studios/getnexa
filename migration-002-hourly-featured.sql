-- Hourly home-page game spotlight (see scheduled handler in src/index.ts)
CREATE TABLE IF NOT EXISTS hourly_featured (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  game_id TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_hourly_featured_created ON hourly_featured(created_at DESC);

-- One row so the home page shows the first release-queue game before the first cron runs
INSERT INTO hourly_featured (game_id, created_at)
SELECT 'neondrift', CAST(strftime('%s', 'now') AS INTEGER) * 1000
WHERE NOT EXISTS (SELECT 1 FROM hourly_featured);
