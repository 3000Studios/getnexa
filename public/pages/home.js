import { h, api, route } from '../core.js';

export function HomePage() {
  const container = h('div', { class: 'page-home' },
    // Hero Section with Cinematic Loop
    h('section', { class: 'hero' },
      h('video', { class: 'hero-video', autoplay: true, muted: true, loop: true, playsinline: true, src: '/Videos/139010-770938030_medium.mp4' }),
      h('div', { class: 'container' },
        h('h1', { class: 'hero-title reveal-text' }, 'NEXA'),
        h('p', { class: 'reveal-text', style: 'font-size: 20px; color: var(--text-dim); max-width: 600px; margin: 0 auto 40px;' }, 
          'Immerse yourself in the next generation of browser gaming. High performance, zero lag, total immersion.'),
        h('div', { class: 'hero-btns reveal-text' },
          h('a', { href: '/games', 'data-link': true, class: 'btn btn-primary' }, 'Explore Catalog'),
          h('a', { href: '/tournaments', 'data-link': true, class: 'btn', style: 'margin-left: 20px;' }, 'Live Arena')
        )
      )
    ),

    // Scrolling Stats / Marquee
    h('div', { class: 'marquee-wrap' },
      h('div', { class: 'marquee' }, 'OVER 1,000,000 GAMES PLAYED • LIVE TOURNAMENTS STARTING SOON • NEW AVATARS IN SHOP • JOIN THE NEXA REVOLUTION • '.repeat(5))
    ),

    // Featured Games Grid
    h('section', { class: 'section' },
      h('div', { class: 'container' },
        h('h2', { class: 'reveal-text', style: 'margin-bottom: 80px; text-align: center;' }, 'Trending Now'),
        h('div', { id: 'featured-grid', class: 'grid' }, 'LOADING ARCADE...')
      )
    ),

    // CTA Section
    h('section', { class: 'section', style: 'background: var(--bg-deep);' },
      h('div', { class: 'container', style: 'text-align: center;' },
        h('h2', { class: 'reveal-text' }, 'Ready to level up?'),
        h('p', { class: 'reveal-text', style: 'margin: 20px 0 40px; color: var(--text-dim);' }, 'Create an account to track your stats and join the global leaderboard.'),
        h('a', { href: '/signup', 'data-link': true, class: 'btn reveal-text' }, 'Get Started Free')
      )
    )
  );

  async function loadGames() {
    try {
      const { featured } = await api('/api/catalog');
      const grid = container.querySelector('#featured-grid');
      grid.innerHTML = '';
      
      const GAMES_DATA = await import('../games/index.js');
      const games = featured.map(id => GAMES_DATA.findGame(id)).filter(Boolean);
      
      // Video catalog for card previews
      const videoRes = await fetch('/Videos/videos.json');
      const videoList = await videoRes.json();

      games.forEach((g, i) => {
        const randomVideo = videoList[i % videoList.length];
        grid.appendChild(h('div', { class: 'game-card reveal-card', onClick: () => route(`/games/${g.id}`) },
          h('video', { class: 'card-video', muted: true, loop: true, playsinline: true, src: `/Videos/${randomVideo}`, onMouseEnter: e => e.target.play() }),
          h('div', { class: 'emoji' }, g.emoji),
          h('div', { class: 'card-info' },
            h('h3', {}, g.name),
            h('p', {}, g.short)
          )
        ));
      });
      
      // Refresh GSAP triggers after injection
      ScrollTrigger.refresh();
    } catch (e) {
      console.error(e);
    }
  }

  queueMicrotask(loadGames);

  return container;
}
