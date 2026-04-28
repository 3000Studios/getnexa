import { h, api, AdSlot, state, toast, route } from '../core.js';
import { GAMES, findGame } from '../games/index.js';
import { setRoute as setBgRoute } from '../bg-3d.js';
import { playSpecificSong, playNextSong, toggleSFX, isSFXEnabled, playAnnouncer } from '../music-player.js';

// --- Particle System for Explosions ---
function createExplosion(x, y) {
  const count = 30;
  for (let i = 0; i < count; i++) {
    const el = document.createElement('div');
    el.className = 'particle';
    const size = Math.random() * 8 + 4;
    Object.assign(el.style, {
      width: `${size}px`, height: `${size}px`,
      left: `${x}px`, top: `${y}px`,
      background: `hsl(${Math.random() * 60 + 200}, 100%, 60%)`, // Sparks
      boxShadow: `0 0 10px rgba(255,255,255,0.8)`
    });
    document.body.appendChild(el);
    const angle = Math.random() * Math.PI * 2;
    const force = Math.random() * 10 + 5;
    const vx = Math.cos(angle) * force;
    const vy = Math.sin(angle) * force;
    let life = 1.0;
    const animate = () => {
      life -= 0.02;
      if (life <= 0) return el.remove();
      const curX = parseFloat(el.style.left) + vx;
      const curY = parseFloat(el.style.top) + vy;
      el.style.left = `${curX}px`;
      el.style.top = `${curY}px`;
      el.style.opacity = life;
      el.style.transform = `scale(${life})`;
      requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }
}

export function GameCard(game) {
  const onPlay = (e) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    createExplosion(rect.left + rect.width / 2, rect.top + rect.height / 2);
    setTimeout(() => route(`/games/${game.id}`), 400);
  };

  const themeColors = [
    'linear-gradient(135deg, #7c5cff, #00d1ff)', // Theme 0
    'linear-gradient(135deg, #ff5b6b, #ffb020)', // Theme 1
    'linear-gradient(135deg, #24d1a1, #00d1ff)', // Theme 2
    'linear-gradient(135deg, #ffb020, #ff5b6b)', // Theme 3
    'linear-gradient(135deg, #00d1ff, #7c5cff)'  // Theme 4
  ];
  const cardGradient = themeColors[game.theme || 0];

  return h('div', { class: 'game-card', onClick: onPlay },
    h('div', { class: 'emoji', style: `background: ${cardGradient};` }, game.emoji),
    h('div', { class: 'card-info' },
      h('h3', {}, game.name),
      h('p', {}, game.short)
    ),
    game.new && h('span', { class: 'badge', style: 'position:absolute; top:24px; right:24px; background: rgba(0,0,0,0.5); padding: 4px 10px; border-radius: 20px; font-size:10px; font-weight: bold; backdrop-filter: blur(5px);' }, 'NEW')
  );
}

export function GamesPage() {
  let query = '';
  let publishedOrder = GAMES.map((g) => g.id);
  
  const container = h('div', { class: 'container section' },
    h('div', { style: 'display:flex; justify-content: space-between; align-items: center; margin-bottom: 30px; width: 100%;' },
      h('div', { style: 'text-align: left;' },
        h('h1', { class: 'game-header' }, 'Arcade Catalog'),
        h('p', { style: 'color: var(--text-dim);' }, 'Explore our entire collection of high-performance neon arcade games.')
      ),
      h('div', { class: 'music-mini-controls' },
        h('button', { class: 'btn', style: 'margin-right: 10px;', onClick: playNextSong, title: 'Next Song' }, '⏭️'),
        h('button', { class: 'btn', onClick: (e) => {
          const enabled = toggleSFX();
          e.target.textContent = enabled ? '🔊' : '🔇';
          toast(enabled ? 'Sound Effects Enabled' : 'Sound Effects Muted', 'success');
        } }, '🔊')
      )
    ),
    h('div', { style: 'margin-bottom: 60px; width: 100%; display: flex; justify-content: center;' },
      h('input', { 
        placeholder: 'Search our collection of 40+ games…', 
        class: 'search', 
        style: 'max-width: 600px; width: 100%; padding: 20px 40px; border-radius: 99px; background: var(--glass); border: 1px solid var(--glass-border); color: var(--text); font-family: inherit; font-size: 18px;', 
        onInput: (e) => { query = e.target.value.toLowerCase(); update(); } 
      })
    ),
    h('div', { id: 'games-grid', class: 'grid' }, ...GAMES.map(GameCard)),
    AdSlot('728x90', 'Sponsored')
  );

  function update() {
    const grid = container.querySelector('#games-grid');
    if (!grid) return;
    grid.innerHTML = '';
    
    // Combine published order with any remaining games to ensure everything is visible
    const orderedIds = [...new Set([...publishedOrder, ...GAMES.map(g => g.id)])];
    const orderedGames = orderedIds.map((id) => findGame(id)).filter(Boolean);
    
    const filtered = orderedGames.filter(g => !query || g.name.toLowerCase().includes(query) || g.short.toLowerCase().includes(query));
    
    filtered.forEach(g => {
      const card = GameCard(g);
      card.classList.add('reveal-card');
      grid.appendChild(card);
    });
    
    // Refresh ScrollTrigger after grid update
    if (typeof ScrollTrigger !== 'undefined') ScrollTrigger.refresh();
  }

  api('/api/catalog')
    .then((res) => {
      const order = res.order || res.featured || [];
      if (Array.isArray(order) && order.length) {
        publishedOrder = order;
        update();
      }
    })
    .catch(() => {
      // Fallback to default grid if API fails
      update();
    });

  return container;
}

export function GamePage({ params }) {
  const game = findGame(params.id);
  if (!game) return h('div', { class: 'container section' }, h('h2', {}, 'Game not found'));

  const stageRef = { el: null };
  const statsRef = { best: null };
  const perksRef = { lives: null, skin: null };
  const perksState = { extraLives: 0, skin: 'classic' };

  // --- Loading Screen Logic ---
  const loader = h('div', { class: 'game-loader-overlay' },
    h('div', { class: 'loader-name' }, state.user?.username || 'GUEST'),
    h('div', { class: 'loader-ready' }, 'GET READY...')
  );
  document.body.appendChild(loader);

  async function refreshBest() {
    if (!state.user) { statsRef.best.textContent = '—'; return; }
    try {
      const res = await api(`/api/scores/me/${game.id}`);
      statsRef.best.textContent = String(res.best || 0);
    } catch { statsRef.best.textContent = '0'; }
  }

  async function onScore(score) {
    if (!state.user) return;
    try {
      const res = await api('/api/scores', { method: 'POST', body: { game_id: game.id, score } });
      toast(`+${res.xpGained} XP, +${res.coinsGained} 🪙`, 'success');
      state.user.coins += res.coinsGained;
      state.user.xp += res.xpGained;
      state.user.level = res.newLevel;
      refreshBest();
    } catch (e) { toast(e.message, 'error'); }
  }

  const page = h('div', { class: 'container section', style: `--game-accent: ${['#7c5cff', '#ff5b6b', '#24d1a1', '#ffb020', '#00d1ff'][game.theme || 0]}` },
    h('div', { style: 'display:flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; width: 100%;' },
      h('div', { style: 'text-align: left;' },
        h('h1', { class: 'game-header' }, `${game.emoji} ${game.name}`),
        h('p', { style: 'color: var(--text-dim);' }, game.description),
      ),
      h('div', { style: 'display:flex; gap: 10px;' },
        h('button', { class: 'btn', onClick: () => {
          const menu = page.querySelector('.pause-overlay');
          if (menu) menu.style.display = menu.style.display === 'grid' ? 'none' : 'grid';
        } }, '⏸️ Pause'),
        h('button', { class: 'btn', onClick: () => playNextSong() }, '⏭️ Next Song'),
        h('a', { href: `/leaderboards/${game.id}`, 'data-link': true, class: 'btn' }, '🏆 Rank'),
      )
    ),
    h('div', { class: 'game-wrap' },
      h('div', { 
        class: 'game-stage', 
        ref: (el) => stageRef.el = el,
        tabIndex: 0,
        onBlur: () => {
          const menu = page.querySelector('.pause-overlay');
          if (menu) menu.style.display = 'grid';
        }
      }),
      h('div', { class: 'game-side' },
        h('div', { class: 'panel' },
          h('h3', {}, 'Session Info'),
          h('div', { class: 'stat-row' }, h('span', { class: 'k' }, 'Best'), h('span', { ref: el => statsRef.best = el }, '—')),
          h('div', { class: 'stat-row' }, h('span', { class: 'k' }, 'SFX'), h('span', {}, isSFXEnabled() ? 'ON' : 'OFF')),
        ),
        h('div', { class: 'panel' },
          h('h3', {}, 'Inventory'),
          h('div', { class: 'stat-row' }, h('span', { class: 'k' }, 'Extra lives'), h('span', { ref: el => perksRef.lives = el }, '0')),
          h('button', { class: 'btn btn-primary btn-block', style: 'margin-top:10px;', onClick: () => route('/shop') }, 'Get More')
        )
      )
    ),
    h('div', { class: 'pause-overlay', style: 'display:none;' },
      h('div', { class: 'pause-menu' },
        h('h2', {}, 'Paused'),
        h('div', { class: 'stack' },
          h('button', { class: 'btn btn-primary btn-block', onClick: () => {
            page.querySelector('.pause-overlay').style.display = 'none';
            stageRef.el.focus();
          } }, 'Resume'),
          h('button', { class: 'btn btn-block', onClick: () => {
            const enabled = toggleSFX();
            toast(enabled ? 'SFX ON' : 'SFX OFF', 'success');
          } }, 'Toggle Sound'),
          h('button', { class: 'btn btn-block', onClick: () => route('/games') }, 'Back to Games')
        )
      )
    )
  );

  queueMicrotask(() => {
    setBgRoute(`/games/${game.id}`, game.theme ?? 0);
    if (game.song) playSpecificSong(game.song);
    
    setTimeout(() => {
      loader.classList.add('fade-out');
      setTimeout(() => {
        loader.remove();
        playAnnouncer('Play');
      }, 500);
    }, 2500);

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
            return true;
          },
          getSkin: () => perksState.skin,
        }
      });
      refreshBest();
    } catch (e) {
      stageRef.el.appendChild(h('p', { style: 'color: var(--danger);' }, String(e.message || e)));
    }
  });

  return page;
}
