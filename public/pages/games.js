import { h, api, AdSlot, state, toast, route } from '../core.js';
import { GAMES, findGame } from '../games/index.js';
import { GameCard } from './home.js';

export function GamesPage() {
  let query = '';
  let publishedOrder = GAMES.map((g) => g.id);
  const container = h('div', { class: 'container section' },
    h('h1', {}, 'All Games'),
    h('p', {}, 'Free browser games with hourly releases. Sign in to save your scores and climb the leaderboards.'),
    h('div', { style: 'margin: 16px 0 20px;' },
      h('input', { placeholder: 'Search games…', class: 'search', style: 'max-width: 360px; padding: 10px 14px; border-radius: 10px; background: var(--bg-2); border: 1px solid var(--border); color: var(--text);', onInput: (e) => { query = e.target.value.toLowerCase(); update(); } })
    ),
    h('div', { id: 'games-grid', class: 'grid' }, ...GAMES.map(GameCard)),
    AdSlot('728x90', 'Sponsored')
  );
  function update() {
    const grid = container.querySelector('#games-grid');
    grid.innerHTML = '';
    const orderedGames = publishedOrder.map((id) => findGame(id)).filter(Boolean);
    const filtered = orderedGames.filter(g => !query || g.name.toLowerCase().includes(query) || g.short.toLowerCase().includes(query));
    filtered.forEach(g => grid.appendChild(GameCard(g)));
  }
  api('/api/catalog')
    .then(({ order }) => {
      if (Array.isArray(order) && order.length) {
        publishedOrder = order;
        update();
      }
    })
    .catch(() => {});
  return container;
}

export function GamePage({ params }) {
  const game = findGame(params.id);
  if (!game) return h('div', { class: 'container section' }, h('h2', {}, 'Game not found'));

  const stageRef = { el: null };
  const statsRef = { best: null, level: null };
  const perksRef = { lives: null, skin: null };
  const perksState = { extraLives: 0, hasOutfit: false, skin: 'classic' };

  async function refreshBest() {
    if (!state.user) { statsRef.best.textContent = '— (log in to save)'; return; }
    try {
      const res = await api(`/api/scores/me/${game.id}`);
      statsRef.best.textContent = String(res.best || 0);
    } catch { statsRef.best.textContent = '0'; }
  }

  async function onScore(score) {
    if (!state.user) {
      toast('Sign up to save scores & climb the leaderboards!', '');
      return;
    }
    try {
      const res = await api('/api/scores', { method: 'POST', body: { game_id: game.id, score } });
      toast(`+${res.xpGained} XP, +${res.coinsGained} 🪙`, 'success');
      state.user.coins += res.coinsGained;
      state.user.xp += res.xpGained;
      state.user.level = res.newLevel;
      refreshBest();
    } catch (e) { toast(e.message, 'error'); }
  }

  async function refreshPerks() {
    if (!state.user) {
      perksState.extraLives = 0;
      perksState.hasOutfit = false;
      perksState.skin = 'classic';
      if (perksRef.lives) perksRef.lives.textContent = '0';
      if (perksRef.skin) perksRef.skin.textContent = 'Classic';
      return;
    }
    try {
      const res = await api('/api/inventory');
      const qty = Object.fromEntries((res.inventory || []).map((it) => [it.item_id, it.quantity]));
      perksState.extraLives = Number(qty.extra_life_pack || 0) + Number(qty.extra_life_1 || 0);
      perksState.hasOutfit = Boolean(qty.theme_neon || qty.outfit_starter_99);
      const preferred = localStorage.getItem('snake_skin') || 'classic';
      perksState.skin = perksState.hasOutfit && preferred === 'neon' ? 'neon' : 'classic';
      if (perksRef.lives) perksRef.lives.textContent = String(perksState.extraLives);
      if (perksRef.skin) perksRef.skin.textContent = perksState.skin === 'neon' ? 'Neon (owned)' : 'Classic';
    } catch {}
  }

  function buyStripe(productId) {
    if (!state.user) { toast('Please log in', ''); route('/login'); return; }
    api('/api/pay/stripe/checkout', { method: 'POST', body: { product_id: productId } })
      .then((res) => { if (res.url) location.href = res.url; })
      .catch((e) => toast(e.message, 'error'));
  }

  function buyPaypal(productId) {
    if (!state.user) { toast('Please log in', ''); route('/login'); return; }
    api('/api/pay/paypal/create', { method: 'POST', body: { product_id: productId } })
      .then((res) => { if (res.url) location.href = res.url; })
      .catch((e) => toast(e.message, 'error'));
  }

  const page = h('div', { class: 'container section' },
    h('div', { style: 'display:flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;' },
      h('div', {},
        h('h1', {}, `${game.emoji}  ${game.name}`),
        h('p', {}, game.description),
      ),
      h('a', { href: `/leaderboards/${game.id}`, 'data-link': true, class: 'btn' }, '🏆 Leaderboard'),
    ),
    h('div', { class: 'game-wrap', style: 'margin-top: 20px;' },
      h('div', { class: 'game-stage', ref: (el) => stageRef.el = el }),
      h('div', { class: 'game-side' },
        h('div', { class: 'panel' },
          h('h3', {}, 'Your Stats'),
          h('div', { class: 'stat-row' }, h('span', { class: 'k' }, 'Best score'), h('span', { ref: el => statsRef.best = el }, '—')),
          h('div', { class: 'stat-row' }, h('span', { class: 'k' }, 'Level'), h('span', {}, String(state.user?.level ?? 1))),
          h('div', { class: 'stat-row' }, h('span', { class: 'k' }, 'Coins'), h('span', {}, String(state.user?.coins ?? 0))),
          !state.user && h('div', { style: 'margin-top:10px;' },
            h('a', { href: '/signup', 'data-link': true, class: 'btn btn-primary btn-block' }, 'Sign up to save scores'))
        ),
        h('div', { class: 'panel' },
          h('h3', {}, 'Game Perks'),
          h('div', { class: 'stat-row' }, h('span', { class: 'k' }, 'Extra lives'), h('span', { ref: el => perksRef.lives = el }, '0')),
          h('div', { class: 'stat-row' }, h('span', { class: 'k' }, 'Skin'), h('span', { ref: el => perksRef.skin = el }, 'Classic')),
          h('p', { style: 'margin-top: 10px;' }, 'Cheap unlocks for this game:'),
          h('div', { class: 'row', style: 'margin-top: 6px;' },
            h('button', { class: 'btn btn-sm btn-primary', onClick: () => buyStripe('extra_life_pack') }, '$0.99 Extra Lives'),
            h('button', { class: 'btn btn-sm', onClick: () => buyPaypal('extra_life_pack'), style: 'background:#ffc439;color:#000;border-color:transparent;font-weight:800;' }, 'PayPal')
          ),
          h('div', { class: 'row', style: 'margin-top: 8px;' },
            h('button', { class: 'btn btn-sm btn-primary', onClick: () => buyStripe('outfit_starter_99') }, '$0.99 Outfit'),
            h('button', { class: 'btn btn-sm', onClick: () => buyPaypal('outfit_starter_99'), style: 'background:#ffc439;color:#000;border-color:transparent;font-weight:800;' }, 'PayPal')
          ),
          game.id === 'snake' && h('div', { class: 'row', style: 'margin-top: 8px;' },
            h('button', {
              class: 'btn btn-sm',
              onClick: async () => {
                if (!perksState.hasOutfit) { toast('Buy the outfit pack first.', ''); return; }
                perksState.skin = 'neon';
                localStorage.setItem('snake_skin', 'neon');
                if (perksRef.skin) perksRef.skin.textContent = 'Neon (owned)';
                toast('Neon skin equipped for Snake.', 'success');
              }
            }, 'Equip Neon Skin')
          )
        ),
        AdSlot('300x250', 'Sponsored'),
        h('div', { class: 'panel' },
          h('h3', {}, 'Tips'),
          h('p', {}, game.description),
        )
      )
    )
  );
  // mount game async (after DOM attached)
  queueMicrotask(() => {
    try {
      game.mount(stageRef.el, {
        onScore,
        user: state.user,
        perks: {
          getExtraLives: () => perksState.extraLives,
          consumeExtraLife: () => {
            if (!state.user || perksState.extraLives <= 0) return false;
            perksState.extraLives -= 1;
            if (perksRef.lives) perksRef.lives.textContent = String(perksState.extraLives);
            api('/api/inventory/use', { method: 'POST', body: { item_id: 'extra_life_pack', amount: 1 } })
              .catch(async () => {
                // Fallback for old redemptions from coin shop.
                try { await api('/api/inventory/use', { method: 'POST', body: { item_id: 'extra_life_1', amount: 1 } }); }
                catch { perksState.extraLives += 1; if (perksRef.lives) perksRef.lives.textContent = String(perksState.extraLives); }
              });
            return true;
          },
          getSkin: () => perksState.skin,
        }
      });
      refreshBest();
      refreshPerks();
    } catch (e) {
      stageRef.el.appendChild(h('p', { style: 'color: var(--danger);' }, String(e.message || e)));
    }
  });
  return page;
}
