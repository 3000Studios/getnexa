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

Validate the full game catalog and Worker bundle before release:

```bash
npm test
npm run typecheck
npm run build
```

## Cloudflare live broadcast

The Live Arena reads a public HLS or DASH playback URL from the Worker binding
`STREAM_PLAYBACK_URL`. Configure it after creating the Cloudflare live input.
Never expose or commit the RTMPS/WHIP ingest key, Cloudflare API token, or
account credentials. Without the playback binding, the Arena stays available
and displays an offline broadcast state while game telemetry continues.

## Deploy

```bash
npm run typecheck
npm run build       # production Worker dry run
npm run deploy      # deploy through Cloudflare Workers
```

## Google AdSense setup

1. Apply at https://adsense.google.com with `https://getnexa.space`.
2. Keep the verified publisher ID aligned across `public/index.html`, `public/ads.js`, `public/ads.txt`, root `ads.txt`, and the `/ads.txt` Worker handler.
3. Keep manual ad units disabled until real AdSense slot IDs are configured in `public/ads.js`; the SPA renders no empty ad boxes when slots are blank.
4. Confirm `/ads.txt`, `/robots.txt`, `/sitemap.xml`, About, Contact, Privacy, Terms, and Cookies all work on the live custom domain before submitting for review.

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
