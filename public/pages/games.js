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

// --- Virtual Controls for Mobile ---
function VirtualControls() {
  const sendKey = (key, type) => {
    window.dispatchEvent(new KeyboardEvent(type, { key }));
  };

  return h('div', { class: 'virtual-controls' },
    h('div', { class: 'dpad' },
      h('button', { class: 'v-btn v-up', onPointerDown: () => sendKey('ArrowUp', 'keydown'), onPointerUp: () => sendKey('ArrowUp', 'keyup') }, '▲'),
      h('button', { class: 'v-btn v-left', onPointerDown: () => sendKey('ArrowLeft', 'keydown'), onPointerUp: () => sendKey('ArrowLeft', 'keyup') }, '◀'),
      h('button', { class: 'v-btn v-right', onPointerDown: () => sendKey('ArrowRight', 'keydown'), onPointerUp: () => sendKey('ArrowRight', 'keyup') }, '▶'),
      h('button', { class: 'v-btn v-down', onPointerDown: () => sendKey('ArrowDown', 'keydown'), onPointerUp: () => sendKey('ArrowDown', 'keyup') }, '▼')
    ),
    h('div', { class: 'action-btns' },
      h('button', { class: 'v-btn', style: 'width: 100px; height: 100px; font-size: 32px;', onPointerDown: () => sendKey(' ', 'keydown'), onPointerUp: () => sendKey(' ', 'keyup') }, '⚡')
    )
  );
}

export function GamesPage() {
  let query = '';
  let page = 1;
  const perPage = 12;
  let publishedOrder = GAMES.map((g) => g.id);
  
  const container = h('div', { class: 'container section' },
    h('div', { style: 'display:flex; justify-content: space-between; align-items: flex-end; margin-bottom: 60px; width: 100%;' },
      h('div', {},
        h('h1', { style: 'font-size: 80px; margin-bottom: 20px;' }, 'CATALOG'),
        h('p', { style: 'color: var(--text-dim);' }, 'Access the full suite of Nexa-verified interactive experiences.')
      ),
      h('div', { style: 'display:flex; gap: 20px;' },
        h('button', { class: 'btn', onClick: playNextSong }, '⏭️'),
        h('button', { class: 'btn', onClick: () => {
          const enabled = toggleSFX();
          toast(enabled ? 'SFX Active' : 'SFX Muted', 'success');
        } }, '🔊')
      )
    ),
    h('div', { style: 'margin-bottom: 80px;' },
      h('input', { 
        placeholder: 'Search archive…', 
        class: 'search', 
        style: 'width: 100%; max-width: 500px; padding: 24px 0; background: transparent; border: none; border-bottom: 1px solid var(--glass-border); color: #fff; font-size: 24px; font-family: inherit; outline: none;', 
        onInput: (e) => { query = e.target.value.toLowerCase(); page = 1; update(); } 
      })
    ),
    h('div', { id: 'games-grid', class: 'grid' }),
    h('div', { id: 'pagination', style: 'margin-top: 60px; display: flex; gap: 10px; justify-content: center;' }),
    h('div', { style: 'margin-top: 100px;' }, AdSlot('728x90', 'Transmission'))
  );

  function update() {
    const grid = container.querySelector('#games-grid');
    const pag = container.querySelector('#pagination');
    if (!grid || !pag) return;

    grid.innerHTML = '';
    pag.innerHTML = '';

    const orderedIds = [...new Set([...publishedOrder, ...GAMES.map(g => g.id)])];
    const orderedGames = orderedIds.map((id) => findGame(id)).filter(Boolean);
    const filtered = orderedGames.filter(g => !query || g.name.toLowerCase().includes(query) || g.short.toLowerCase().includes(query));
    
    const totalPages = Math.ceil(filtered.length / perPage);
    const start = (page - 1) * perPage;
    const end = start + perPage;
    const paged = filtered.slice(start, end);

    paged.forEach(g => grid.appendChild(GameCard(g)));

    if (totalPages > 1) {
      for (let i = 1; i <= totalPages; i++) {
        pag.appendChild(h('button', { 
          class: `btn ${page === i ? 'btn-primary' : ''}`, 
          style: 'padding: 10px 20px; font-size: 14px;',
          onClick: () => { page = i; update(); window.scrollTo({ top: 0, behavior: 'smooth' }); } 
        }, i));
      }
    }

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
    state.isTouch && VirtualControls(),
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
