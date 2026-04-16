import { Hono } from 'hono';
import { getCookie, setCookie, deleteCookie } from 'hono/cookie';
import { cors } from 'hono/cors';
import {
  createStripeCheckoutSession,
  verifyStripeSignature,
  createPaypalOrder,
  capturePaypalOrder,
  type PayBindings,
} from './payments';

export { GameRoom } from './game-room';

type Bindings = PayBindings & {
  DB: D1Database;
  ASSETS: Fetcher;
  GAME_ROOM: DurableObjectNamespace;
  SITE_NAME: string;
  SITE_URL: string;
};

type Variables = {
  userId?: number;
  username?: string;
};

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

app.use('/api/*', cors({ origin: (o) => o ?? '*', credentials: true }));

// Security headers + caching — wrap the response so headers are mutable
app.use('*', async (c, next) => {
  await next();
  const url = new URL(c.req.url);
  const headers = new Headers(c.res.headers);
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('X-Frame-Options', 'SAMEORIGIN');
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  headers.set('Cross-Origin-Opener-Policy', 'same-origin');
  if (/\.(js|css|svg|webp|png|jpg|woff2?)$/.test(url.pathname)) {
    if (!headers.has('Cache-Control')) headers.set('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400');
  }
  c.res = new Response(c.res.body, { status: c.res.status, statusText: c.res.statusText, headers });
});

// ---------- helpers ----------
const enc = new TextEncoder();

async function hashPassword(password: string, salt: string): Promise<string> {
  const data = enc.encode(password + ':' + salt);
  const buf = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function randomHex(bytes = 16): string {
  const arr = new Uint8Array(bytes);
  crypto.getRandomValues(arr);
  return Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [salt, hash] = stored.split('$');
  if (!salt || !hash) return false;
  const h = await hashPassword(password, salt);
  return h === hash;
}

async function makePasswordHash(password: string): Promise<string> {
  const salt = randomHex(8);
  const h = await hashPassword(password, salt);
  return `${salt}$${h}`;
}

async function getUserFromSession(c: any): Promise<any | null> {
  const token = getCookie(c, 'nexa_session');
  if (!token) return null;
  const now = Date.now();
  const row = await c.env.DB.prepare(
    `SELECT u.id, u.username, u.email, u.tier, u.coins, u.xp, u.level, u.display_name
     FROM sessions s JOIN users u ON u.id = s.user_id
     WHERE s.token = ? AND s.expires_at > ?`
  ).bind(token, now).first();
  return row;
}

async function requireAuth(c: any, next: any) {
  const user = await getUserFromSession(c);
  if (!user) return c.json({ error: 'unauthorized' }, 401);
  c.set('userId', user.id);
  c.set('username', user.username);
  (c as any).user = user;
  await next();
}

// ---------- health ----------
app.get('/api/health', (c) => c.json({ ok: true, ts: Date.now(), site: c.env.SITE_NAME }));

/** Default order for /games catalog; hourly spotlight reorders by recency from D1. */
const HOME_PAGE_GAME_ORDER = [
  'snake',
  '2048',
  'tetris',
  'memory',
  'breakout',
  'minesweeper',
  'tictactoe',
  'pong',
] as const;

app.get('/api/home/featured', async (c) => {
  const grouped = await c.env.DB.prepare(
    `SELECT game_id, MAX(created_at) AS last_at FROM hourly_featured GROUP BY game_id ORDER BY last_at DESC`
  ).all<{ game_id: string; last_at: number }>();
  const latest = await c.env.DB.prepare('SELECT game_id FROM hourly_featured ORDER BY id DESC LIMIT 1').first<{
    game_id: string;
  }>();

  const seen = new Set<string>();
  const order: string[] = [];
  for (const row of grouped.results || []) {
    if (!seen.has(row.game_id)) {
      seen.add(row.game_id);
      order.push(row.game_id);
    }
  }
  for (const id of HOME_PAGE_GAME_ORDER) {
    if (!seen.has(id)) {
      seen.add(id);
      order.push(id);
    }
  }

  return c.json({
    order: order.slice(0, 8),
    highlightId: latest?.game_id ?? null,
  });
});

// ---------- auth ----------
app.post('/api/auth/signup', async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const username = (body.username || '').toString().trim().toLowerCase();
  const email = (body.email || '').toString().trim().toLowerCase();
  const password = (body.password || '').toString();

  if (!/^[a-z0-9_]{3,20}$/.test(username)) return c.json({ error: 'Username must be 3-20 chars, letters/numbers/underscore' }, 400);
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return c.json({ error: 'Invalid email' }, 400);
  if (password.length < 8) return c.json({ error: 'Password must be at least 8 characters' }, 400);

  const existing = await c.env.DB.prepare('SELECT id FROM users WHERE username = ? OR email = ?').bind(username, email).first();
  if (existing) return c.json({ error: 'Username or email already taken' }, 409);

  const hash = await makePasswordHash(password);
  const now = Date.now();
  const res = await c.env.DB.prepare(
    'INSERT INTO users (username, email, password_hash, display_name, created_at, last_login) VALUES (?, ?, ?, ?, ?, ?)'
  ).bind(username, email, hash, username, now, now).run();
  const userId = res.meta.last_row_id as number;

  const token = randomHex(32);
  const expires = now + 1000 * 60 * 60 * 24 * 30;
  await c.env.DB.prepare('INSERT INTO sessions (token, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)')
    .bind(token, userId, now, expires).run();

  setCookie(c, 'nexa_session', token, { httpOnly: true, secure: true, sameSite: 'Lax', path: '/', maxAge: 60 * 60 * 24 * 30 });

  return c.json({ ok: true, user: { id: userId, username, email, tier: 'free', coins: 100, xp: 0, level: 1 } });
});

app.post('/api/auth/login', async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const identifier = (body.identifier || body.username || body.email || '').toString().trim().toLowerCase();
  const password = (body.password || '').toString();

  const user = await c.env.DB.prepare('SELECT * FROM users WHERE username = ? OR email = ?')
    .bind(identifier, identifier).first<any>();
  if (!user) return c.json({ error: 'Invalid credentials' }, 401);
  const ok = await verifyPassword(password, user.password_hash);
  if (!ok) return c.json({ error: 'Invalid credentials' }, 401);

  const token = randomHex(32);
  const now = Date.now();
  const expires = now + 1000 * 60 * 60 * 24 * 30;
  await c.env.DB.prepare('INSERT INTO sessions (token, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)')
    .bind(token, user.id, now, expires).run();
  await c.env.DB.prepare('UPDATE users SET last_login = ? WHERE id = ?').bind(now, user.id).run();

  setCookie(c, 'nexa_session', token, { httpOnly: true, secure: true, sameSite: 'Lax', path: '/', maxAge: 60 * 60 * 24 * 30 });

  return c.json({ ok: true, user: { id: user.id, username: user.username, email: user.email, tier: user.tier, coins: user.coins, xp: user.xp, level: user.level } });
});

app.post('/api/auth/logout', async (c) => {
  const token = getCookie(c, 'nexa_session');
  if (token) await c.env.DB.prepare('DELETE FROM sessions WHERE token = ?').bind(token).run();
  deleteCookie(c, 'nexa_session', { path: '/' });
  return c.json({ ok: true });
});

app.get('/api/auth/me', async (c) => {
  const user = await getUserFromSession(c);
  return c.json({ user: user || null });
});

// ---------- scores ----------
app.post('/api/scores', requireAuth, async (c) => {
  const user = (c as any).user;
  const body = await c.req.json().catch(() => ({}));
  const gameId = (body.game_id || '').toString();
  const score = parseInt(body.score, 10);
  if (!gameId || isNaN(score) || score < 0 || score > 1_000_000_000) return c.json({ error: 'Invalid score' }, 400);
  const now = Date.now();
  await c.env.DB.prepare('INSERT INTO scores (user_id, game_id, score, created_at) VALUES (?, ?, ?, ?)')
    .bind(user.id, gameId, score, now).run();

  const xpGained = Math.min(100, Math.floor(score / 10) + 5);
  const coinsGained = Math.min(50, Math.floor(score / 25) + 2);
  const newXp = user.xp + xpGained;
  const newLevel = Math.max(1, Math.floor(Math.sqrt(newXp / 50)) + 1);
  await c.env.DB.prepare('UPDATE users SET xp = ?, level = ?, coins = coins + ? WHERE id = ?')
    .bind(newXp, newLevel, coinsGained, user.id).run();

  // Update any open tournament entries for this game+user
  await c.env.DB.prepare(
    `UPDATE tournament_entries
     SET best_score = MAX(best_score, ?)
     WHERE user_id = ? AND tournament_id IN (
       SELECT id FROM tournaments WHERE game_id = ? AND status = 'active' AND starts_at <= ? AND ends_at >= ?
     )`
  ).bind(score, user.id, gameId, now, now).run();

  return c.json({ ok: true, xpGained, coinsGained, newLevel });
});

app.get('/api/scores/leaderboard/:gameId', async (c) => {
  const gameId = c.req.param('gameId');
  const rows = await c.env.DB.prepare(
    `SELECT u.username, u.display_name, MAX(s.score) AS best_score
     FROM scores s JOIN users u ON u.id = s.user_id
     WHERE s.game_id = ?
     GROUP BY s.user_id ORDER BY best_score DESC LIMIT 25`
  ).bind(gameId).all();
  return c.json({ leaderboard: rows.results });
});

app.get('/api/scores/me/:gameId', requireAuth, async (c) => {
  const user = (c as any).user;
  const gameId = c.req.param('gameId');
  const row = await c.env.DB.prepare('SELECT MAX(score) AS best FROM scores WHERE user_id = ? AND game_id = ?')
    .bind(user.id, gameId).first<any>();
  return c.json({ best: row?.best ?? 0 });
});

// ---------- game saves ----------
app.get('/api/saves/:gameId', requireAuth, async (c) => {
  const user = (c as any).user;
  const row = await c.env.DB.prepare('SELECT data, updated_at FROM game_saves WHERE user_id = ? AND game_id = ?')
    .bind(user.id, c.req.param('gameId')).first<any>();
  return c.json({ save: row ? JSON.parse(row.data) : null, updated_at: row?.updated_at ?? null });
});

app.post('/api/saves/:gameId', requireAuth, async (c) => {
  const user = (c as any).user;
  const body = await c.req.json().catch(() => ({}));
  const data = JSON.stringify(body.data ?? {}).slice(0, 20000);
  const now = Date.now();
  await c.env.DB.prepare(
    `INSERT INTO game_saves (user_id, game_id, data, updated_at) VALUES (?, ?, ?, ?)
     ON CONFLICT(user_id, game_id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at`
  ).bind(user.id, c.req.param('gameId'), data, now).run();
  return c.json({ ok: true });
});

// ---------- profile ----------
app.get('/api/profile/:username', async (c) => {
  const username = c.req.param('username').toLowerCase();
  const user = await c.env.DB.prepare(
    'SELECT id, username, display_name, avatar, tier, xp, level, created_at FROM users WHERE username = ?'
  ).bind(username).first<any>();
  if (!user) return c.json({ error: 'not_found' }, 404);
  const scores = await c.env.DB.prepare(
    `SELECT game_id, MAX(score) AS best FROM scores WHERE user_id = ? GROUP BY game_id`
  ).bind(user.id).all();
  return c.json({ user, scores: scores.results });
});

app.patch('/api/profile', requireAuth, async (c) => {
  const user = (c as any).user;
  const body = await c.req.json().catch(() => ({}));
  const display = (body.display_name || '').toString().slice(0, 40);
  const avatar = (body.avatar || '').toString().slice(0, 200);
  await c.env.DB.prepare('UPDATE users SET display_name = ?, avatar = ? WHERE id = ?')
    .bind(display, avatar, user.id).run();
  return c.json({ ok: true });
});

// ---------- shop / products ----------
const PRODUCTS = [
  { id: 'coins_small', name: 'Coin Pack (500)', price_cents: 99, type: 'coins', amount: 500 },
  { id: 'coins_medium', name: 'Coin Pack (3,000)', price_cents: 499, type: 'coins', amount: 3000 },
  { id: 'coins_large', name: 'Coin Pack (10,000)', price_cents: 1499, type: 'coins', amount: 10000 },
  { id: 'coins_mega', name: 'Coin Pack (50,000)', price_cents: 4999, type: 'coins', amount: 50000 },
  { id: 'pro_month', name: 'Nexa Pro (Monthly)', price_cents: 499, type: 'subscription', recurring: true },
  { id: 'pro_year', name: 'Nexa Pro (Annual)', price_cents: 4999, type: 'subscription', recurring: false },
  { id: 'legend_month', name: 'Nexa Legend (Monthly)', price_cents: 999, type: 'subscription', recurring: true },
  { id: 'remove_ads_month', name: 'Remove Ads (Monthly)', price_cents: 299, type: 'subscription', recurring: true },
  { id: 'studio_creator', name: 'Nexa Studio - Creator Plan', price_cents: 1900, type: 'subscription', recurring: true },
  { id: 'theme_neon', name: 'Neon Theme Pack', price_cents: 199, type: 'cosmetic' },
  { id: 'theme_retro', name: 'Retro Theme Pack', price_cents: 199, type: 'cosmetic' },
  { id: 'avatar_frame_gold', name: 'Gold Avatar Frame', price_cents: 299, type: 'cosmetic' },
  { id: 'avatar_frame_diamond', name: 'Diamond Avatar Frame', price_cents: 499, type: 'cosmetic' },
  { id: 'boost_xp_24h', name: '2x XP Boost (24h)', price_cents: 149, type: 'consumable' },
  { id: 'boost_xp_7d', name: '2x XP Boost (7 days)', price_cents: 499, type: 'consumable' },
  { id: 'extra_life_pack', name: 'Extra Lives x10', price_cents: 99, type: 'consumable' },
  { id: 'hint_pack', name: 'Puzzle Hints x20', price_cents: 99, type: 'consumable' },
  { id: 'tournament_entry', name: 'Weekly Tournament Entry', price_cents: 199, type: 'entry' },
  { id: 'custom_room', name: 'Private Multiplayer Room', price_cents: 299, type: 'entry' },
  { id: 'tip_small', name: 'Tip the devs ($1)', price_cents: 100, type: 'tip' },
  { id: 'tip_medium', name: 'Tip the devs ($5)', price_cents: 500, type: 'tip' },
  { id: 'tip_large', name: 'Tip the devs ($20)', price_cents: 2000, type: 'tip' },
];

app.get('/api/shop/products', (c) => c.json({ products: PRODUCTS }));

app.post('/api/shop/spend-coins', requireAuth, async (c) => {
  const user = (c as any).user;
  const body = await c.req.json().catch(() => ({}));
  const itemId = (body.item_id || '').toString();
  const cost = parseInt(body.cost, 10);
  if (!itemId || isNaN(cost) || cost <= 0) return c.json({ error: 'Invalid' }, 400);
  if (user.coins < cost) return c.json({ error: 'Not enough coins' }, 402);
  const now = Date.now();
  await c.env.DB.prepare('UPDATE users SET coins = coins - ? WHERE id = ?').bind(cost, user.id).run();
  await c.env.DB.prepare(
    `INSERT INTO inventory (user_id, item_id, quantity, acquired_at) VALUES (?, ?, 1, ?)
     ON CONFLICT(user_id, item_id) DO UPDATE SET quantity = quantity + 1`
  ).bind(user.id, itemId, now).run();
  return c.json({ ok: true, remaining_coins: user.coins - cost });
});

app.get('/api/inventory', requireAuth, async (c) => {
  const user = (c as any).user;
  const rows = await c.env.DB.prepare('SELECT item_id, quantity, acquired_at FROM inventory WHERE user_id = ?')
    .bind(user.id).all();
  return c.json({ inventory: rows.results });
});

/* ─── Stripe Checkout ──────────────────────────── */
app.post('/api/pay/stripe/checkout', requireAuth, async (c) => {
  if (!c.env.STRIPE_SECRET_KEY) return c.json({ error: 'Stripe not configured. Admin: wrangler secret put STRIPE_SECRET_KEY' }, 503);
  const user = (c as any).user;
  const body = await c.req.json().catch(() => ({}));
  const product = PRODUCTS.find(p => p.id === body.product_id);
  if (!product) return c.json({ error: 'Unknown product' }, 400);

  const now = Date.now();
  const orderRes = await c.env.DB.prepare(
    'INSERT INTO purchases (user_id, product_id, price_cents, status, created_at) VALUES (?, ?, ?, ?, ?)'
  ).bind(user.id, product.id, product.price_cents, 'pending', now).run();
  const orderId = orderRes.meta.last_row_id as number;

  try {
    const session = await createStripeCheckoutSession(c.env, {
      productName: product.name,
      priceCents: product.price_cents,
      recurring: !!(product as any).recurring,
      successUrl: `${c.env.SITE_URL}/checkout?provider=stripe&status=success&order=${orderId}&sid={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${c.env.SITE_URL}/checkout?provider=stripe&status=cancel&order=${orderId}`,
      userId: user.id,
      productId: product.id,
      metadata: { order_id: String(orderId) },
    });
    return c.json({ url: session.url, id: session.id, order_id: orderId });
  } catch (e: any) {
    return c.json({ error: e.message || 'Stripe error' }, 500);
  }
});

app.post('/api/pay/stripe/webhook', async (c) => {
  if (!c.env.STRIPE_WEBHOOK_SECRET) return c.json({ error: 'webhook_not_configured' }, 503);
  const raw = await c.req.text();
  const sig = c.req.header('stripe-signature');
  const ok = await verifyStripeSignature(raw, sig || null, c.env.STRIPE_WEBHOOK_SECRET);
  if (!ok) return c.json({ error: 'invalid_signature' }, 400);

  let evt: any = {};
  try { evt = JSON.parse(raw); } catch {}
  if (evt.type === 'checkout.session.completed' || evt.type === 'checkout.session.async_payment_succeeded') {
    const s = evt.data?.object || {};
    const orderId = parseInt(s.metadata?.order_id, 10);
    const userId = parseInt(s.metadata?.user_id, 10);
    const productId = s.metadata?.product_id;
    if (orderId) await c.env.DB.prepare('UPDATE purchases SET status = ? WHERE id = ?').bind('completed', orderId).run();
    if (userId && productId) await fulfillProduct(c.env, userId, productId);
  }
  return c.json({ received: true });
});

/* ─── PayPal ──────────────────────────── */
app.post('/api/pay/paypal/create', requireAuth, async (c) => {
  if (!c.env.PAYPAL_CLIENT_ID) return c.json({ error: 'PayPal not configured. Admin: wrangler secret put PAYPAL_CLIENT_ID / PAYPAL_CLIENT_SECRET' }, 503);
  const user = (c as any).user;
  const body = await c.req.json().catch(() => ({}));
  const product = PRODUCTS.find(p => p.id === body.product_id);
  if (!product) return c.json({ error: 'Unknown product' }, 400);

  const now = Date.now();
  const orderRes = await c.env.DB.prepare(
    'INSERT INTO purchases (user_id, product_id, price_cents, status, created_at) VALUES (?, ?, ?, ?, ?)'
  ).bind(user.id, product.id, product.price_cents, 'pending', now).run();
  const orderId = orderRes.meta.last_row_id as number;

  try {
    const order = await createPaypalOrder(c.env, {
      productName: product.name,
      priceCents: product.price_cents,
      returnUrl: `${c.env.SITE_URL}/checkout?provider=paypal&status=success&order=${orderId}&pp=1`,
      cancelUrl: `${c.env.SITE_URL}/checkout?provider=paypal&status=cancel&order=${orderId}`,
      userId: user.id,
      productId: product.id,
    });
    await c.env.DB.prepare('UPDATE purchases SET status = ? WHERE id = ?').bind('pending_paypal:' + order.id, orderId).run();
    return c.json({ id: order.id, url: order.approveUrl, order_id: orderId });
  } catch (e: any) {
    return c.json({ error: e.message || 'PayPal error' }, 500);
  }
});

app.post('/api/pay/paypal/capture', requireAuth, async (c) => {
  if (!c.env.PAYPAL_CLIENT_ID) return c.json({ error: 'PayPal not configured' }, 503);
  const user = (c as any).user;
  const body = await c.req.json().catch(() => ({}));
  const orderId = body.paypal_order_id;
  if (!orderId) return c.json({ error: 'Missing paypal_order_id' }, 400);
  try {
    const result = await capturePaypalOrder(c.env, orderId);
    const completed = result.status === 'COMPLETED';
    if (completed) {
      const refId = result.purchase_units?.[0]?.reference_id || '';
      const [uidStr, productId] = refId.split(':');
      if (productId && parseInt(uidStr, 10) === user.id) {
        await fulfillProduct(c.env, user.id, productId);
      }
      await c.env.DB.prepare('UPDATE purchases SET status = ? WHERE user_id = ? AND status LIKE ?')
        .bind('completed', user.id, 'pending_paypal:' + orderId).run();
    }
    return c.json({ ok: completed, result });
  } catch (e: any) {
    return c.json({ error: e.message || 'PayPal capture error' }, 500);
  }
});

async function fulfillProduct(env: Bindings, userId: number, productId: string) {
  const product = PRODUCTS.find(p => p.id === productId);
  if (!product) return;
  const now = Date.now();
  if (product.type === 'coins' && (product as any).amount) {
    await env.DB.prepare('UPDATE users SET coins = coins + ? WHERE id = ?').bind((product as any).amount, userId).run();
  } else if (product.type === 'subscription') {
    const tier = productId.startsWith('legend') ? 'legend' : productId.startsWith('studio') ? 'studio' : 'pro';
    await env.DB.prepare('UPDATE users SET tier = ? WHERE id = ?').bind(tier, userId).run();
  }
  await env.DB.prepare(
    `INSERT INTO inventory (user_id, item_id, quantity, acquired_at) VALUES (?, ?, 1, ?)
     ON CONFLICT(user_id, item_id) DO UPDATE SET quantity = quantity + 1`
  ).bind(userId, productId, now).run();
}

/* ─── Tournaments ──────────────────────────── */
app.get('/api/tournaments', async (c) => {
  const now = Date.now();
  const rows = await c.env.DB.prepare(
    `SELECT t.*,
       (SELECT COUNT(*) FROM tournament_entries e WHERE e.tournament_id = t.id) AS entries
     FROM tournaments t
     WHERE t.status != 'closed'
     ORDER BY t.starts_at ASC`
  ).all();
  return c.json({ tournaments: rows.results, now });
});

app.get('/api/tournaments/:id', async (c) => {
  const id = parseInt(c.req.param('id'), 10);
  const t = await c.env.DB.prepare('SELECT * FROM tournaments WHERE id = ?').bind(id).first<any>();
  if (!t) return c.json({ error: 'not_found' }, 404);
  const board = await c.env.DB.prepare(
    `SELECT u.username, u.display_name, e.best_score, e.paid
     FROM tournament_entries e JOIN users u ON u.id = e.user_id
     WHERE e.tournament_id = ?
     ORDER BY e.best_score DESC LIMIT 50`
  ).bind(id).all();
  return c.json({ tournament: t, leaderboard: board.results });
});

app.post('/api/tournaments/:id/join', requireAuth, async (c) => {
  const user = (c as any).user;
  const id = parseInt(c.req.param('id'), 10);
  const t = await c.env.DB.prepare('SELECT * FROM tournaments WHERE id = ?').bind(id).first<any>();
  if (!t) return c.json({ error: 'not_found' }, 404);
  const now = Date.now();
  if (t.ends_at < now) return c.json({ error: 'Tournament has ended' }, 400);

  const existing = await c.env.DB.prepare('SELECT id, paid FROM tournament_entries WHERE tournament_id = ? AND user_id = ?')
    .bind(id, user.id).first<any>();
  if (existing?.paid) return c.json({ ok: true, already: true });

  // If entry is free, join immediately. Otherwise return a checkout URL.
  if (t.entry_cents === 0) {
    await c.env.DB.prepare(
      `INSERT INTO tournament_entries (tournament_id, user_id, best_score, paid, created_at)
       VALUES (?, ?, 0, 1, ?)
       ON CONFLICT(tournament_id, user_id) DO UPDATE SET paid = 1`
    ).bind(id, user.id, now).run();
    return c.json({ ok: true, joined: true });
  }
  // Paid: deduct coins if the user has enough (free-to-play path), else point to shop.
  if (user.coins >= Math.ceil(t.entry_cents / 10)) {
    const coinCost = Math.ceil(t.entry_cents / 10);
    await c.env.DB.prepare('UPDATE users SET coins = coins - ? WHERE id = ?').bind(coinCost, user.id).run();
    await c.env.DB.prepare(
      `INSERT INTO tournament_entries (tournament_id, user_id, best_score, paid, created_at)
       VALUES (?, ?, 0, 1, ?)
       ON CONFLICT(tournament_id, user_id) DO UPDATE SET paid = 1`
    ).bind(id, user.id, now).run();
    return c.json({ ok: true, joined: true, paid_with: 'coins', coin_cost: coinCost });
  }
  return c.json({ ok: false, need_payment: true, entry_cents: t.entry_cents }, 402);
});

/* ─── Creator applications (Nexa Studio) ───── */
app.post('/api/creators/apply', async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const name = (body.name || '').toString().trim().slice(0, 100);
  const email = (body.email || '').toString().trim().toLowerCase();
  const website = (body.website || '').toString().slice(0, 300);
  const portfolio = (body.portfolio || '').toString().slice(0, 300);
  const about = (body.about || '').toString().slice(0, 2000);
  if (!name || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || about.length < 20) {
    return c.json({ error: 'Please fill in name, valid email, and at least 20 characters about you.' }, 400);
  }
  const user = await getUserFromSession(c);
  const now = Date.now();
  await c.env.DB.prepare(
    `INSERT INTO creator_applications (user_id, name, email, website, portfolio, about, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).bind(user?.id || null, name, email, website, portfolio, about, now).run();
  return c.json({ ok: true });
});

// ---------- newsletter ----------
app.post('/api/newsletter', async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const email = (body.email || '').toString().trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return c.json({ error: 'Invalid email' }, 400);
  await c.env.DB.prepare('INSERT OR IGNORE INTO newsletter (email, created_at) VALUES (?, ?)').bind(email, Date.now()).run();
  return c.json({ ok: true });
});

// ---------- multiplayer (Durable Object) ----------
app.get('/api/mp/:gameId/:roomId', async (c) => {
  const { gameId, roomId } = c.req.param();
  const id = c.env.GAME_ROOM.idFromName(`${gameId}:${roomId}`);
  const stub = c.env.GAME_ROOM.get(id);
  const user = await getUserFromSession(c);
  const url = new URL(c.req.url);
  url.searchParams.set('gameId', gameId);
  url.searchParams.set('roomId', roomId);
  if (user) { url.searchParams.set('userId', String(user.id)); url.searchParams.set('username', user.username); }
  else { url.searchParams.set('username', 'Guest' + Math.floor(Math.random() * 10000)); }
  return stub.fetch(new Request(url.toString(), c.req.raw));
});

// ---------- ads.txt ----------
app.get('/ads.txt', (c) => c.text('google.com, pub-5800977493749262, DIRECT, f08c47fec0942fa0\n', 200, { 'Content-Type': 'text/plain' }));
app.get('/robots.txt', (c) => c.text(`User-agent: *\nAllow: /\nSitemap: https://getnexa.space/sitemap.xml\n`, 200, { 'Content-Type': 'text/plain' }));
app.get('/sitemap.xml', (c) => {
  const base = 'https://getnexa.space';
  const paths = ['/', '/games', '/tournaments', '/creators', '/about', '/privacy', '/terms', '/contact', '/shop', '/leaderboards',
    '/games/snake', '/games/tetris', '/games/2048', '/games/memory', '/games/pong', '/games/tictactoe', '/games/breakout', '/games/minesweeper'];
  const urls = paths.map(p => `<url><loc>${base}${p}</loc><changefreq>weekly</changefreq></url>`).join('');
  return c.text(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`, 200, { 'Content-Type': 'application/xml' });
});

// Fallback to static assets (SPA)
app.all('*', async (c) => c.env.ASSETS.fetch(c.req.raw));

async function appendHourlySpotlight(env: Bindings): Promise<void> {
  const row = await env.DB.prepare('SELECT COUNT(*) AS c FROM hourly_featured').first<{ c: number }>();
  const n = row?.c ?? 0;
  const gameId = HOME_PAGE_GAME_ORDER[n % HOME_PAGE_GAME_ORDER.length];
  const now = Date.now();
  await env.DB.prepare('INSERT INTO hourly_featured (game_id, created_at) VALUES (?, ?)').bind(gameId, now).run();
}

export default {
  fetch: app.fetch,
  async scheduled(_event: ScheduledEvent, env: Bindings, _ctx: ExecutionContext): Promise<void> {
    await appendHourlySpotlight(env);
  },
};
