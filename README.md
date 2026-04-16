# Nexa Arcade — getnexa.space

A production-ready, full-stack gaming platform on Cloudflare Workers.

- **Frontend**: vanilla JS SPA with hand-rolled hyperscript + router. Zero build step.
- **Backend**: Hono on Cloudflare Workers.
- **Database**: Cloudflare D1 (SQLite).
- **Realtime multiplayer**: Cloudflare Durable Objects over WebSockets.
- **Static assets**: Workers Static Assets.
- **Auth**: cookie sessions + PBKDF-style salted SHA-256 password hashes (upgrade to Argon2id via WebCrypto when ready).
- **Domain**: `getnexa.space` + `www.getnexa.space` (Cloudflare Custom Domain).
- **Ads**: Google AdSense-ready markup, `ads.txt`, `robots.txt`, `sitemap.xml`.

## Games included

Snake · 2048 · Tetris · Memory Match · Brick Breaker · Minesweeper · Tic-Tac-Toe (realtime multiplayer) · Pong (singleplayer vs. CPU).

## Monetization surfaces

- AdSense ad slots in homepage, in-game sidebar, article pages.
- Shop with 18+ products: coin packs, Nexa Pro / Nexa Legend subscriptions, Remove Ads subscription, cosmetic themes, avatar frames, XP boosts, power-ups, tournament entries, private rooms.
- Coin economy earned from gameplay.

## Local dev

```bash
npm install
npx wrangler d1 create getnexa-db
# put the returned database_id into wrangler.jsonc d1_databases[0].database_id
npm run db:init-local
npm run dev
```

## Deploy

```bash
npm run db:init     # push schema to production D1
npm run deploy
```

## Google AdSense setup

1. Apply at https://adsense.google.com with `https://getnexa.space`.
2. Once approved, replace `ca-pub-0000000000000000` in `public/index.html` and the AdSense publisher ID in `src/index.ts` `/ads.txt` handler.
3. Replace the placeholder `.ad-slot` divs with proper `<ins class="adsbygoogle">` units (see `public/core.js` `AdSlot`).

## Project structure

```
src/
  index.ts          # Hono API + static asset serving
  game-room.ts      # Durable Object for realtime multiplayer
public/
  index.html
  styles.css
  app.js core.js    # SPA shell + router
  pages/            # home, games, account, shop, leaderboards, static
  games/            # per-game modules (snake, 2048, tetris, …)
schema.sql          # D1 schema
wrangler.jsonc      # Cloudflare config
```
