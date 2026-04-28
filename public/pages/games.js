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
  // Fake explosion sound via Web Audio if needed, or just play a synthesized pop
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(10, ctx.currentTime + 0.5);
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.5);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(); osc.stop(ctx.currentTime + 0.5);
  } catch {}
}

export function GameCard(game) {
  const onPlay = (e) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    createExplosion(rect.left + rect.width / 2, rect.top + rect.height / 2);
    setTimeout(() => route(`/games/${game.id}`), 400);
  };

  return h('div', { class: 'game-card', onClick: onPlay },
    h('div', { class: 'emoji' }, game.emoji),
    h('div', { class: 'card-info' },
      h('h3', {}, game.name),
      h('p', {}, game.short)
    ),
    game.new && h('span', { class: 'badge', style: 'position:absolute; top:24px; right:24px; font-size:10px; opacity:0.6;' }, 'New')
  );
}

export function GamesPage() {
  let query = '';
  let publishedOrder = GAMES.map((g) => g.id);
  const container = h('div', { class: 'container section' },
    h('div', { style: 'display:flex; justify-content: space-between; align-items: center; margin-bottom: 30px;' },
      h('div', {},
        h('h1', { class: 'game-header' }, 'Arcade Catalog'),
        h('p', {}, 'Select a challenge to begin. Every game features unique rewards and live leaderboards.')
      ),
      h('div', { class: 'music-mini-controls' },
        h('button', { class: 'music-btn', onClick: playNextSong, title: 'Next Song' }, '⏭️'),
        h('button', { class: 'music-btn', onClick: (e) => {
          const enabled = toggleSFX();
          e.target.textContent = enabled ? '🔊' : '🔇';
          toast(enabled ? 'Sound Effects Enabled' : 'Sound Effects Muted', 'success');
        } }, '🔊')
      )
    ),
    h('div', { style: 'margin-bottom: 30px;' },
      h('input', { placeholder: 'Search games…', class: 'search', style: 'max-width: 400px; padding: 14px 20px; border-radius: 99px; background: var(--panel); border: 1px solid var(--border); color: var(--text);', onInput: (e) => { query = e.target.value.toLowerCase(); update(); } })
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
    h('div', { style: 'display:flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;' },
      h('div', {},
        h('h1', { class: 'game-header' }, `${game.emoji} ${game.name}`),
        h('p', {}, game.description),
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
          // Pause logic: show pause menu
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
    // Pause Overlay
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

  // Trigger immersive flow
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
