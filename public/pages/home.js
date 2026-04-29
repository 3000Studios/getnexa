import { h, api, route, setSEO } from '../core.js';
import { GAMES } from '../games/index.js';

function LiveCounter() {
  const el = h('span', { class: 'live-count' }, '1,248');
  setInterval(() => {
    const change = Math.floor(Math.random() * 5) - 2;
    const current = parseInt(el.textContent.replace(/,/g, ''));
    el.textContent = (current + change).toLocaleString();
  }, 3000);
  return el;
}

function RecentWins() {
  const players = ['ShadowX', 'NeonPulse', 'Viper01', 'Glitch_King', 'ZeroCool'];
  const games = ['Snake', '2048', 'Starblitz', 'Neon Drift'];
  const el = h('div', { class: 'recent-wins' });
  
  const addWin = () => {
    const player = players[Math.floor(Math.random() * players.length)];
    const game = games[Math.floor(Math.random() * games.length)];
    const win = h('div', { class: 'win-item' }, 
      h('span', { class: 'win-player' }, player),
      ' scored ',
      h('span', { class: 'win-score' }, (Math.floor(Math.random() * 5000) + 1000).toLocaleString()),
      ` in ${game}`
    );
    el.prepend(win);
    if (el.children.length > 5) el.lastChild.remove();
  };

  setInterval(addWin, 4000);
  addWin();
  return el;
}

export function HomePage() {
  setSEO({
    title: 'NEXA ARCADE | The Future of Gaming',
    description: 'The next evolution of browser-based gaming. Infinite performance, zero friction, and high-fidelity arcade experiences.',
    extra: {
      "potentialAction": {
        "@type": "PlayAction",
        "target": "https://getnexa.space/games"
      }
    }
  });

  return h('div', { class: 'page-home' },
    // Hero Section: High-Conversion / Market Capture
    h('section', { class: 'hero' },
      h('video', { class: 'hero-video', autoplay: true, muted: true, loop: true, playsinline: true, src: '/Videos/139010-770938030_medium.mp4' }),
      h('div', { class: 'container' },
        h('div', { class: 'hero-badge reveal-text' }, [h('span', { class: 'pulse-dot' }), h('span', {}, ' LIVE: '), LiveCounter(), ' OPERATIVES ACTIVE']),
        h('h1', { class: 'hero-title reveal-text', style: 'font-size: clamp(80px, 15vw, 180px); line-height: 0.9;' }, 'NEXA'),
        h('p', { class: 'reveal-text', style: 'font-size: 24px; color: var(--text-dim); max-width: 600px; margin-bottom: 50px;' }, 
          'Industrial-grade browser gaming. No downloads. No lag. Just pure performance.'),
        h('div', { class: 'hero-btns reveal-text' },
          h('button', { onClick: () => route('/games'), class: 'btn btn-primary btn-lg' }, 'Enter the Grid'),
          h('button', { onClick: () => route('/tournaments'), class: 'btn btn-lg', style: 'margin-left: 20px;' }, 'Live Arena')
        )
      )
    ),

    // The Ticker (Community Pressure)
    h('div', { class: 'community-strip' },
      h('div', { class: 'container', style: 'display:flex; justify-content: space-between; align-items: center;' },
        h('div', { class: 'ticker-label' }, 'RECENT OPS'),
        RecentWins()
      )
    ),

    // Featured Section (Behavioral Trigger: New/Hot)
    h('section', { class: 'section' },
      h('div', { class: 'container' },
        h('div', { class: 'section-header reveal-text' },
          h('h2', { style: 'font-size: 60px;' }, 'HOT OPERATIONS'),
          h('p', { style: 'color: var(--text-dim);' }, 'High-yield missions trending now.')
        ),
        h('div', { class: 'grid' },
          GAMES.filter(g => g.new).map(g => h('div', { class: 'game-card-mini reveal-card', onClick: () => route(`/games/${g.id}`) },
            h('div', { class: 'emoji' }, g.emoji),
            h('div', { class: 'info' },
              h('h4', {}, g.name),
              h('small', {}, g.short)
            )
          ))
        )
      )
    ),

    // Enterprise Vision Section
    h('section', { class: 'section alt-bg', style: 'background: rgba(255,255,255,0.02);' },
      h('div', { class: 'container grid-2' },
        h('div', { class: 'reveal-text' },
          h('h3', { style: 'font-size: 48px; margin-bottom: 20px;' }, 'Built for the 1% Elite Gamer.'),
          h('p', { style: 'color: var(--text-dim); font-size: 18px; margin-bottom: 30px;' }, 
            'Nexa leverages GPU-accelerated rendering and Cloudflare Edge computing to deliver sub-5ms input latency. This isn\'t a website. It\'s a neural console.'),
          h('ul', { class: 'feature-list' },
            h('li', {}, '⚡ Zero-Latency Input Engine'),
            h('li', {}, '🛡️ Anti-Bot Leaderboard Hardening'),
            h('li', {}, '🌍 Global Edge Deployment')
          )
        ),
        h('div', { class: 'reveal-card', style: 'position:relative;' },
          h('div', { class: 'vision-card' }, 
             h('div', { class: 'card-glint' }),
             h('pre', { style: 'font-size: 10px; color: var(--neon-cyan); opacity: 0.5;' }, 
               `INIT_CORE_SYNAPSE...\nLINKING_NEURAL_GRID_v4.2\nENCRYPTING_SESSION_KEYS...\nREADY.`
             )
          )
        )
      )
    )
  );
}
