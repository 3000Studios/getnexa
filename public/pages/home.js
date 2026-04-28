import { h, api, AdSlot, state, route } from '../core.js';

export function HomePage() {
  const container = h('div', { class: 'container section' },
    h('div', { class: 'hero-content' },
      h('h1', { style: 'font-size: 56px; margin-bottom: 10px;' }, 'WELCOME TO NEXA'),
      h('h2', { style: 'color: var(--accent); margin-bottom: 40px;' }, 'THE ULTIMATE 8-BIT ARCADE'),
      h('div', { style: 'display:flex; gap: 20px; justify-content: center; flex-wrap: wrap;' },
        h('a', { href: '/games', 'data-link': true, class: 'btn btn-primary btn-lg' }, '🕹️ START PLAYING'),
        h('a', { href: '/signup', 'data-link': true, class: 'btn btn-lg' }, '🛡️ CREATE PROFILE'),
      )
    ),

    // Scrolling Marquee for Last Player
    h('div', { id: 'last-player-marquee', class: 'marquee-wrap' },
      h('div', { class: 'marquee' }, 'WAITING FOR DATA...')
    ),

    h('div', { style: 'margin-top: 60px; width: 100%;' },
      h('h2', { style: 'text-align: center;' }, '🏆 TOP THREE LEGENDS'),
      h('div', { id: 'top-players', class: 'top-players' }, 'LOADING CHAMPIONS...')
    ),

    h('div', { style: 'margin-top: 80px; width: 100%;' },
      h('h2', { style: 'margin-bottom: 30px;' }, 'FEATURED GAMES'),
      h('div', { id: 'featured-grid', class: 'grid' }, 'LOADING ARCADE...')
    ),

    AdSlot('728x90', 'Arcade Sponsor')
  );

  async function loadData() {
    // Last Player Marquee
    try {
      const { last } = await api('/api/activity/last');
      const marquee = container.querySelector('.marquee');
      if (last) {
        marquee.innerHTML = `*** LAST PLAYER: <span style="color:#fff">${last.username}</span> JUST PLAYED <span style="color:#fff">${last.game_id}</span> AND SCORED <span style="color:#fff">${last.score}</span>! *** `.repeat(10);
      } else {
        marquee.textContent = '*** WELCOME TO NEXA ARCADE! START PLAYING TO BECOME A LEGEND! *** '.repeat(10);
      }
    } catch {}

    // Top 3 Players
    try {
      const { players } = await api('/api/leaderboards/global');
      const topDiv = container.querySelector('#top-players');
      topDiv.innerHTML = '';
      (players || []).slice(0, 3).forEach((p, i) => {
        topDiv.appendChild(h('div', { class: `player-rank rank-${i + 1}` },
          h('div', { style: 'font-size: 24px; margin-bottom: 10px;' }, ['🥇', '🥈', '🥉'][i]),
          h('div', { style: 'font-weight: 900; color: #fff;' }, p.username),
          h('div', { style: 'font-size: 10px; color: var(--muted);' }, `LVL ${p.level}`),
          h('div', { style: 'font-size: 12px; color: var(--accent);' }, `${p.xp} XP`)
        ));
      });
    } catch {}

    // Featured Games
    try {
      const { featured } = await api('/api/catalog');
      const grid = container.querySelector('#featured-grid');
      grid.innerHTML = '';
      const GAMES_DATA = await import('../games/index.js');
      const games = featured.map(id => GAMES_DATA.findGame(id)).filter(Boolean);
      games.forEach(g => {
        grid.appendChild(h('div', { class: 'game-card', onClick: () => route(`/games/${g.id}`) },
          h('div', { class: 'emoji' }, g.emoji),
          h('div', { style: 'background: rgba(0,0,0,0.8); padding: 10px; border-top: 2px solid #fff;' },
            h('h3', { style: 'margin:0; font-size:12px;' }, g.name),
            h('p', { style: 'margin:5px 0 0; font-size:9px; color: var(--muted);' }, g.short)
          )
        ));
      });
    } catch {}
  }

  queueMicrotask(loadData);

  return container;
}
