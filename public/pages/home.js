import { h, api, route } from '../core.js';

export function HomePage() {
  const container = h('div', { class: 'page-home' },
    // Hero Section
    h('section', { class: 'hero' },
      h('video', { class: 'hero-video', autoplay: true, muted: true, loop: true, playsinline: true, src: '/Videos/139010-770938030_medium.mp4' }),
      h('div', { class: 'container' },
        h('h1', { class: 'hero-title reveal-text' }, 'NEXA'),
        h('p', { class: 'reveal-text', style: 'font-size: 20px; color: var(--text-dim); margin-bottom: 40px;' }, 
          'The next evolution of browser-based gaming. Infinite performance. Zero friction.'),
        h('div', { class: 'hero-btns reveal-text' },
          h('a', { href: '/games', 'data-link': true, class: 'btn btn-primary' }, 'Launch Arcade'),
          h('a', { href: '/tournaments', 'data-link': true, class: 'btn', style: 'margin-left: 20px;' }, 'Live Arena')
        )
      )
    ),

    // Giant Scrolling Leaderboard (Marquee)
    h('div', { class: 'leaderboard-marquee', style: 'background: rgba(255,255,255,0.02); border-y: 1px solid var(--glass-border); padding: 40px 0; overflow: hidden; white-space: nowrap;' },
      h('div', { id: 'marquee-content', class: 'marquee', style: 'font-family: var(--font-heading); font-size: 80px; font-weight: 900; opacity: 0.1; letter-spacing: -0.02em;' }, 
        'LOADING LEGENDS... LOADING LEGENDS... LOADING LEGENDS... '
      )
    ),

    // Featured Games Grid
    h('section', { class: 'section' },
      h('div', { class: 'container' },
        h('h2', { class: 'reveal-text', style: 'margin-bottom: 80px;' }, 'Trending Operations'),
        h('div', { id: 'featured-grid', class: 'grid' }, 'INITIALIZING GRID...')
      )
    ),

    // CTA Section
    h('section', { class: 'section', style: 'background: #000;' },
      h('div', { class: 'container' },
        h('h2', { class: 'reveal-text' }, 'Join the Vanguard'),
        h('p', { class: 'reveal-text', style: 'margin: 20px 0 40px; color: var(--text-dim);' }, 'Synchronize your profile to track progression and claim rewards.'),
        h('a', { href: '/signup', 'data-link': true, class: 'btn btn-primary reveal-text' }, 'Create Account')
      )
    )
  );

  async function loadData() {
    try {
      // Load Games
      const res = await api('/api/catalog');
      const featured = res.featured || [];
      const grid = container.querySelector('#featured-grid');
      if (grid) {
        grid.innerHTML = '';
        const GAMES_DATA = await import('../games/index.js');
        const games = (featured || []).map(id => GAMES_DATA.findGame(id)).filter(Boolean);
        
        // Video catalog
        const videoRes = await fetch('/Videos/videos.json');
        const videoList = await videoRes.json();

        games.forEach((g, i) => {
          const randomVideo = videoList[i % videoList.length];
          const card = h('div', { class: 'game-card reveal-card', onClick: (e) => {
            e.currentTarget.classList.add('spin-active');
            setTimeout(() => route(`/games/${g.id}`), 600);
          } },
            h('video', { class: 'card-video', muted: true, loop: true, playsinline: true, src: `/Videos/${randomVideo}`, onMouseEnter: e => e.target.play() }),
            h('div', { class: 'emoji', style: `background: ${['#7c5cff', '#ff5b6b', '#24d1a1', '#ffb020', '#00d1ff'][g.theme || 0]};` }, g.emoji),
            h('div', { class: 'card-info' },
              h('h3', {}, g.name),
              h('p', {}, g.short)
            )
          );
          grid.appendChild(card);
        });
      }

      // Load Leaders and Last Player for Marquee
      const leadersRes = await api('/api/leaderboards/global');
      const marquee = container.querySelector('#marquee-content');
      if (marquee && leadersRes.leaders) {
        const top3 = leadersRes.leaders.slice(0, 3);
        const lastPlayer = leadersRes.last_player || (top3[0]?.username) || 'GUEST';
        
        const text = `LAST AGENT ACTIVE: ${lastPlayer.toUpperCase()} • TOP PLAYERS: ` + 
                     top3.map((l, i) => `#${i+1} ${l.username.toUpperCase()} (${l.totalScore})`).join(' • ');
        
        marquee.textContent = `${text} • ${text} • ${text} • `;
        marquee.style.opacity = '0.6';
        marquee.style.color = 'var(--neon-cyan)';
      }

      ScrollTrigger.refresh();
    } catch (e) {
      console.error(e);
    }
  }

  queueMicrotask(loadData);

  return container;
}
