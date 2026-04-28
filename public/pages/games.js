import { h, api, AdSlot, state, toast, route } from '../core.js';
import { GAMES, findGame } from '../games/index.js';
import { setAdaptiveTheme } from '../bg-3d.js';
import { playSpecificSong, playNextSong, toggleSFX } from '../music-player.js';

// --- Holographic Tilt Effect ---
function initTilt(el) {
  el.addEventListener('mousemove', e => {
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    gsap.to(el, {
      rotateY: x * 15,
      rotateX: -y * 15,
      scale: 1.05,
      duration: 0.5,
      ease: 'power2.out'
    });
  });
  el.addEventListener('mouseleave', () => {
    gsap.to(el, { rotateY: 0, rotateX: 0, scale: 1, duration: 0.5 });
  });
}

export function GameCard(game) {
  const video = h('video', { 
    class: 'card-video', muted: true, loop: true, playsinline: true, 
    style: 'position:absolute; inset:0; width:100%; height:100%; object-fit:cover; opacity:0; transition:0.8s; z-index:-1;'
  });

  fetch('/Videos/videos.json').then(r => r.json()).then(v => {
    const randomVideo = v[Math.floor(Math.random() * v.length)];
    video.src = `/Videos/${randomVideo}`;
  });

  const card = h('div', { 
    class: 'game-card reveal-card',
    ref: initTilt,
    onMouseEnter: () => {
      video.play().then(() => video.style.opacity = '0.3');
      setAdaptiveTheme([0x7c5cff, 0xff5b6b, 0x24d1a1, 0xffb020, 0x00d1ff][game.theme || 0]);
    },
    onMouseLeave: () => {
      video.pause();
      video.style.opacity = '0';
      setAdaptiveTheme(0x00f3ff); // Reset to default cyan
    },
    onClick: (e) => {
      e.currentTarget.classList.add('spin-active');
      setTimeout(() => route(`/games/${game.id}`), 600);
    }
  },
    video,
    h('div', { class: 'player-count' }, h('span', { class: 'pulse-dot' }), `🔥 ${Math.floor(Math.random()*50)+10} Playing`),
    h('div', { class: 'emoji', style: 'flex-grow: 1; display: flex; align-items: center; justify-content: center; font-size: 80px;' }, game.emoji),
    h('div', { class: 'card-info', style: 'padding: 30px; background: rgba(0,0,0,0.8);' },
      h('h3', { style: 'font-size: 28px; margin-bottom: 8px;' }, game.name),
      h('p', { style: 'font-size: 14px; color: var(--text-dim);' }, game.short)
    )
  );

  return card;
}

export function GamesPage() {
  let query = '';
  let page = 1;
  const perPage = 12;

  const container = h('div', { class: 'page-games' },
    // Global Activity Ticker
    h('div', { class: 'activity-ticker' },
      h('div', { class: 'container' }, 
        h('div', { class: 'ticker-content' }, 
          '⚡ NEXA ACTIVITY: Agent "ShadowX" just set a record in Snake! • ARENA ALERT: Prize pool for 2048 hit $100! • NEW OPERATIVE: "User99" joined the Vanguard. • '
        )
      )
    ),

    h('div', { class: 'container section' },
      // Trending Hero
      h('div', { class: 'trending-hero reveal-text' },
        h('video', { class: 'trending-video', autoplay: true, muted: true, loop: true, src: '/Videos/139010-770938030_medium.mp4' }),
        h('div', { class: 'trending-content' },
          h('div', { class: 'section-eyebrow', style: 'color: var(--neon-gold);' }, 'TRENDING OPERATION'),
          h('h1', { style: 'font-size: 80px;' }, 'Doodle Jump: The Glitch'),
          h('p', { style: 'margin: 20px 0 40px; font-size: 18px;' }, 'Outrun the glitch. Reclaim the platform. Join 4k+ agents in the climb.'),
          h('button', { class: 'btn btn-primary', onClick: () => route('/games/doodle-jump') }, 'Step into the Grid')
        )
      ),

      h('div', { style: 'display:flex; justify-content: space-between; align-items: flex-end; margin-bottom: 60px;' },
        h('div', {},
          h('h2', { style: 'font-size: 60px;' }, 'THE ARCHIVE'),
          h('p', { style: 'color: var(--text-dim);' }, 'Explore the verified collection of Nexa legends.')
        ),
        h('div', { style: 'display:flex; gap: 20px;' },
          h('input', { 
            placeholder: 'Search by title or vibe (e.g. "retro")...', 
            class: 'search', 
            style: 'width: 300px; padding: 15px 0; background: transparent; border: none; border-bottom: 1px solid var(--glass-border); color: #fff; font-size: 16px; outline: none;', 
            onInput: (e) => { query = e.target.value.toLowerCase(); page = 1; update(); } 
          })
        )
      ),

      h('div', { id: 'games-grid', class: 'grid' }),
      h('div', { id: 'pagination', style: 'margin-top: 60px; display: flex; gap: 10px; justify-content: center;' }),
      h('div', { style: 'margin-top: 100px;' }, AdSlot('728x90', 'Sponsored Stream'))
    )
  );

  function update() {
    const grid = container.querySelector('#games-grid');
    const pag = container.querySelector('#pagination');
    if (!grid || !pag) return;

    grid.innerHTML = '';
    pag.innerHTML = '';

    const filtered = GAMES.filter(g => {
      const q = query.toLowerCase();
      if (!q) return true;
      if (g.name.toLowerCase().includes(q)) return true;
      if (g.short.toLowerCase().includes(q)) return true;
      // "Vibe" search
      if (q === 'retro' && ['Pac-Man', 'Snake', 'Tetris'].includes(g.name)) return true;
      if (q === 'hard' && ['Flappy Bird', '2048'].includes(g.name)) return true;
      return false;
    });
    
    const totalPages = Math.ceil(filtered.length / perPage);
    const start = (page - 1) * perPage;
    const paged = filtered.slice(start, start + perPage);

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

  update();
  return container;
}

export function GamePage({ params }) {
  const game = findGame(params.id);
  if (!game) return h('div', { class: 'container section' }, h('h2', {}, 'System Error: Operative Missing'));

  const stageRef = { el: null };
  const statsRef = { best: null };

  const loader = h('div', { class: 'game-loader-overlay' },
    h('div', { class: 'loader-name' }, state.user?.username || 'ANONYMOUS'),
    h('div', { class: 'loader-ready' }, 'SYNCHRONIZING GRID...')
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
        h('a', { href: '/games', 'data-link': true, class: 'btn' }, 'Exit Grid'),
      )
    ),
    h('div', { class: 'game-wrap' },
      h('div', { class: 'game-stage', ref: (el) => stageRef.el = el, tabIndex: 0, onBlur: () => {
        const menu = page.querySelector('.pause-overlay');
        if (menu) menu.style.display = 'grid';
      }}),
      h('div', { class: 'game-side' },
        h('div', { class: 'panel' },
          h('h3', {}, 'Neural Sync'),
          h('div', { class: 'stat-row' }, h('span', { class: 'k' }, 'Sync Rank'), h('span', { ref: el => statsRef.best = el }, '—')),
        )
      )
    ),
    h('div', { class: 'pause-overlay', style: 'display:none;' },
      h('div', { class: 'pause-menu' },
        h('h2', {}, 'HALTED'),
        h('button', { class: 'btn btn-primary btn-block', onClick: () => {
          page.querySelector('.pause-overlay').style.display = 'none';
          stageRef.el.focus();
        } }, 'Resume Sync'),
        h('button', { class: 'btn btn-block', onClick: () => route('/games') }, 'Terminate')
      )
    )
  );

  queueMicrotask(async () => {
    if (game.song) playSpecificSong(game.song);
    setTimeout(() => {
      loader.classList.add('fade-out');
      setTimeout(() => { loader.remove(); }, 500);
    }, 2500);

    try {
      game.mount(stageRef.el, {
        onScore: async (score) => {
          if (!state.user) return;
          const res = await api('/api/scores', { method: 'POST', body: { game_id: game.id, score } });
          toast(`Data Logged: ${score} pts`, 'success');
          statsRef.best.textContent = res.best;
        },
        user: state.user
      });
    } catch (e) { console.error(e); }
  });

  return page;
}
