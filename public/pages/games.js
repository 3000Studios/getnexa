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
      background: `hsl(${Math.random() * 60 + 200}, 100%, 60%)`,
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
    const card = e.currentTarget;
    card.classList.add('spin-active');
    const rect = card.getBoundingClientRect();
    createExplosion(rect.left + rect.width / 2, rect.top + rect.height / 2);
    setTimeout(() => route(`/games/${game.id}`), 600);
  };

  const themeColors = [
    'linear-gradient(135deg, #7c5cff, #00d1ff)',
    'linear-gradient(135deg, #ff5b6b, #ffb020)',
    'linear-gradient(135deg, #24d1a1, #00d1ff)',
    'linear-gradient(135deg, #ffb020, #ff5b6b)',
    'linear-gradient(135deg, #00d1ff, #7c5cff)'
  ];

  return h('div', { class: 'game-card reveal-card', onClick: onPlay },
    h('div', { class: 'emoji', style: `background: ${themeColors[game.theme || 0]};` }, game.emoji),
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
    h('div', { style: 'display:flex; justify-content: space-between; align-items: flex-end; margin-bottom: 60px; width: 100%;' },
      h('div', {},
        h('h1', { class: 'reveal-text', style: 'font-size: 80px; margin-bottom: 20px;' }, 'CATALOG'),
        h('p', { class: 'reveal-text', style: 'color: var(--text-dim);' }, 'Access the full suite of Nexa-verified interactive experiences.')
      ),
      h('div', { class: 'controls reveal-text', style: 'display:flex; gap: 20px;' },
        h('button', { class: 'btn', onClick: playNextSong }, '⏭️'),
        h('button', { class: 'btn', onClick: () => {
          const enabled = toggleSFX();
          toast(enabled ? 'SFX Active' : 'SFX Muted', 'success');
        } }, '🔊')
      )
    ),
    h('div', { class: 'reveal-text', style: 'margin-bottom: 80px;' },
      h('input', { 
        placeholder: 'Search archive…', 
        class: 'search', 
        style: 'width: 100%; max-width: 500px; padding: 24px 0; background: transparent; border: none; border-bottom: 1px solid var(--glass-border); color: #fff; font-size: 24px; font-family: inherit; outline: none;', 
        onInput: (e) => { query = e.target.value.toLowerCase(); update(); } 
      })
    ),
    h('div', { id: 'games-grid', class: 'grid' }, ...GAMES.map(GameCard)),
    h('div', { style: 'margin-top: 100px;' }, AdSlot('728x90', 'Transmission'))
  );

  function update() {
    const grid = container.querySelector('#games-grid');
    if (!grid) return;
    grid.innerHTML = '';
    const orderedIds = [...new Set([...publishedOrder, ...GAMES.map(g => g.id)])];
    const orderedGames = orderedIds.map((id) => findGame(id)).filter(Boolean);
    const filtered = orderedGames.filter(g => !query || g.name.toLowerCase().includes(query) || g.short.toLowerCase().includes(query));
    filtered.forEach(g => grid.appendChild(GameCard(g)));
    if (typeof ScrollTrigger !== 'undefined') ScrollTrigger.refresh();
  }

  api('/api/catalog').then((res) => {
    publishedOrder = res.order || res.featured || publishedOrder;
    update();
  }).catch(update);

  return container;
}

export function GamePage({ params }) {
  const game = findGame(params.id);
  if (!game) return h('div', { class: 'container section' }, h('h2', {}, 'System Error: Game not found'));

  const stageRef = { el: null };
  const statsRef = { best: null };
  const perksState = { extraLives: 0, skin: 'classic' };

  const loader = h('div', { class: 'game-loader-overlay' },
    h('div', { class: 'loader-name' }, state.user?.username || 'ANONYMOUS'),
    h('div', { class: 'loader-ready' }, 'PREPARING STREAM...')
  );
  document.body.appendChild(loader);

  const page = h('div', { class: 'container section' },
    h('div', { style: 'display:flex; justify-content: space-between; align-items: flex-end; margin-bottom: 60px;' },
      h('div', {},
        h('h1', { style: 'font-size: 60px;' }, `${game.emoji} ${game.name}`),
        h('p', { style: 'color: var(--text-dim);' }, game.description),
      ),
      h('div', { style: 'display:flex; gap: 10px;' },
        h('button', { class: 'btn', onClick: () => {
          const menu = page.querySelector('.pause-overlay');
          if (menu) menu.style.display = menu.style.display === 'grid' ? 'none' : 'grid';
        } }, '⏸️'),
        h('a', { href: '/games', 'data-link': true, class: 'btn' }, 'Exit'),
      )
    ),
    h('div', { class: 'game-wrap' },
      h('div', { class: 'game-stage', ref: (el) => stageRef.el = el, tabIndex: 0, onBlur: () => {
        const menu = page.querySelector('.pause-overlay');
        if (menu) menu.style.display = 'grid';
      }}),
      h('div', { class: 'game-side' },
        h('div', { class: 'panel' },
          h('h3', {}, 'Performance'),
          h('div', { class: 'stat-row' }, h('span', { class: 'k' }, 'Best'), h('span', { ref: el => statsRef.best = el }, '—')),
        )
      )
    ),
    h('div', { class: 'pause-overlay', style: 'display:none;' },
      h('div', { class: 'pause-menu' },
        h('h2', {}, 'HALTED'),
        h('button', { class: 'btn btn-primary btn-block', onClick: () => {
          page.querySelector('.pause-overlay').style.display = 'none';
          stageRef.el.focus();
        } }, 'Resume Stream'),
        h('button', { class: 'btn btn-block', onClick: () => route('/games') }, 'Terminate')
      )
    )
  );

  queueMicrotask(async () => {
    setBgRoute(`/games/${game.id}`, game.theme ?? 0);
    if (game.song) playSpecificSong(game.song);
    
    setTimeout(() => {
      loader.classList.add('fade-out');
      setTimeout(() => { loader.remove(); playAnnouncer('Play'); }, 500);
    }, 2500);

    try {
      game.mount(stageRef.el, {
        onScore: async (score) => {
          if (!state.user) return;
          const res = await api('/api/scores', { method: 'POST', body: { game_id: game.id, score } });
          toast(`Synced: +${res.xpGained} XP`, 'success');
          statsRef.best.textContent = res.best;
        },
        user: state.user,
        perks: {
          getExtraLives: () => perksState.extraLives,
          consumeExtraLife: () => {
            if (perksState.extraLives <= 0) return false;
            perksState.extraLives--; return true;
          },
          getSkin: () => perksState.skin,
        }
      });
      if (state.user) {
        const res = await api(`/api/scores/me/${game.id}`);
        statsRef.best.textContent = res.best || '0';
      }
    } catch (e) { console.error(e); }
  });

  return page;
}
