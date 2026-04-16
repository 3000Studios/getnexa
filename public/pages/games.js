import { h, api, AdSlot, state, toast, route } from '../core.js';
import { GAMES, findGame } from '../games/index.js';
import { GameCard } from './home.js';

export function GamesPage() {
  let query = '';
  const container = h('div', { class: 'container section' },
    h('h1', {}, 'All Games'),
    h('p', {}, 'Free browser games, updated weekly. Sign in to save your scores and climb the leaderboards.'),
    h('div', { style: 'margin: 16px 0 20px;' },
      h('input', { placeholder: 'Search games…', class: 'search', style: 'max-width: 360px; padding: 10px 14px; border-radius: 10px; background: var(--bg-2); border: 1px solid var(--border); color: var(--text);', onInput: (e) => { query = e.target.value.toLowerCase(); update(); } })
    ),
    h('div', { id: 'games-grid', class: 'grid' }, ...GAMES.map(GameCard)),
    AdSlot('728x90', 'Sponsored')
  );
  function update() {
    const grid = container.querySelector('#games-grid');
    grid.innerHTML = '';
    const filtered = GAMES.filter(g => !query || g.name.toLowerCase().includes(query) || g.short.toLowerCase().includes(query));
    filtered.forEach(g => grid.appendChild(GameCard(g)));
  }
  return container;
}

export function GamePage({ params }) {
  const game = findGame(params.id);
  if (!game) return h('div', { class: 'container section' }, h('h2', {}, 'Game not found'));

  const stageRef = { el: null };
  const sideRef = { el: null };
  const statsRef = { best: null, level: null };

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
      game.mount(stageRef.el, { onScore, user: state.user });
      refreshBest();
    } catch (e) {
      stageRef.el.appendChild(h('p', { style: 'color: var(--danger);' }, String(e.message || e)));
    }
  });
  return page;
}
