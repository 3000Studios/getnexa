import { h, AdSlot, api, toast } from '../core.js';
import { GAMES, findGame } from '../games/index.js';

export function HomePage() {

  const onNewsletter = async (e) => {
    e.preventDefault();
    const form = e.target;
    const email = form.email.value.trim();
    try {
      await api('/api/newsletter', { method: 'POST', body: { email } });
      toast('Thanks! You are subscribed.', 'success');
      form.reset();
    } catch (err) { toast(err.message, 'error'); }
  };

  const wrap = h('div', {},
    // Hero
    h('section', { class: 'hero' },
      h('div', { class: 'hero-aurora hero-aurora-a' }),
      h('div', { class: 'hero-aurora hero-aurora-b' }),
      h('div', { class: 'hero-gridlines' }),
      h('div', { class: 'container hero-content' },
        h('div', { class: 'hero-orbit hero-orbit-a' }),
        h('div', { class: 'hero-orbit hero-orbit-b' }),
        h('img', { src: '/favicon.svg', alt: 'Nexa Arcade logo', class: 'hero-logo', width: 100, height: 100 }),
        h('div', { class: 'hero-kicker' },
          h('span', { class: 'dot' }),
          h('span', {}, 'Live multiplayer · Tournaments · Cloud saves · Hourly game drops')
        ),
        h('h1', {}, 'Play. Compete. ', h('span', { class: 'accent' }, 'Conquer.')),
        h('p', { class: 'lead' },
          'Nexa Arcade is the modern browser gaming hub. Real-time multiplayer, paid tournaments with prize pools, live leaderboards, cross-device saves, and a release queue that ships new premium arcade experiences every hour.'),
        h('div', { class: 'hero-cta' },
          h('a', { href: '/games', 'data-link': true, class: 'btn btn-primary btn-lg' }, '▶  Play Now'),
          h('a', { href: '/tournaments', 'data-link': true, class: 'btn btn-lg' }, '🏆 Tournaments'),
          h('a', { href: '/signup', 'data-link': true, class: 'btn btn-lg btn-ghost' }, 'Free Account'),
        ),
        h('div', { class: 'hero-marquee', 'aria-hidden': true },
          h('div', { class: 'hero-marquee-track' },
            h('span', {}, 'Neon hover-runners'),
            h('span', {}, 'Cinematic space defense'),
            h('span', {}, 'Live tournament ladders'),
            h('span', {}, 'Hourly arcade releases'),
            h('span', {}, 'Creator-ready monetization'),
            h('span', {}, 'Neon hover-runners'),
            h('span', {}, 'Cinematic space defense'),
            h('span', {}, 'Live tournament ladders'),
          )
        ),
        h('div', { class: 'hero-stats' },
          Stat('10+', 'Games'),
          Stat('∞', 'Leaderboards'),
          Stat('0$', 'To start'),
          Stat('1/hr', 'Releases'),
        )
      )
    ),

    h('section', { class: 'section home-spotlight' },
      h('div', { class: 'container' },
        h('div', { class: 'section-head' },
          h('div', {},
            h('div', { class: 'section-eyebrow' }, 'Fresh on deck'),
            h('h2', {}, 'Hourly Release Pipeline')
          )
        ),
        h('div', { class: 'release-grid' },
          ReleasePanel('This hour', 'New games are promoted automatically from the release queue every hour, not just re-labeled in place.', 'Live queue'),
          ReleasePanel('Visual bar', 'The new flagship titles lean into richer lighting, particles, parallax, and stronger arcade silhouettes.', 'Better graphics'),
          ReleasePanel('Retention loop', 'Fresh game drops, tournaments, and stronger card motion keep the front page from feeling static.', 'More return visits'),
        )
      )
    ),

    // Featured games
    h('section', { class: 'section' },
      h('div', { class: 'container' },
        h('div', { class: 'section-head' },
          h('div', {},
            h('div', { class: 'section-eyebrow' }, 'The arcade'),
            h('h2', {}, 'Featured Games'),
          ),
          h('a', { href: '/games', 'data-link': true, class: 'btn btn-sm' }, 'See all →')
        ),
        h('div', { id: 'featured-grid', class: 'grid' }, h('div', { class: 'panel', style: 'grid-column: 1 / -1;' }, 'Loading featured games…'))
      )
    ),

    // Ad slot
    h('div', { class: 'container' }, AdSlot('728x90', 'Sponsored')),

    // Features
    h('section', { class: 'section' },
      h('div', { class: 'container' },
        h('div', { class: 'section-head' },
          h('div', {},
            h('div', { class: 'section-eyebrow' }, 'Why Nexa'),
            h('h2', {}, 'Built for the modern player')
          )
        ),
        h('div', { class: 'features' },
          Feature('🎯', 'Skill-based leaderboards', 'Every score ranked globally. Climb to the top and stay there.'),
          Feature('⚡', 'Instant browser play', 'Zero installs. Tap a game and you are playing in under a second.'),
          Feature('🕹️', 'Real-time multiplayer', 'Share a room link and play live over Cloudflare\'s global edge.'),
          Feature('☁️', 'Cross-device saves', 'Log in anywhere, pick up where you left off.'),
          Feature('🏆', 'Paid tournaments', 'Enter weekly tournaments with real prize pools.'),
          Feature('🛒', 'Rewards + cosmetics', 'Earn coins, unlock frames, themes, and XP boosts.'),
        )
      )
    ),

    // Tournaments CTA
    h('section', { class: 'section' },
      h('div', { class: 'container' },
        h('div', { class: 'panel', style: 'padding: 40px; display: grid; grid-template-columns: 1fr auto; gap: 30px; align-items: center;' },
          h('div', {},
            h('div', { class: 'section-eyebrow', style: 'margin-bottom: 8px;' }, 'Compete for cash'),
            h('h2', { style: 'margin-bottom: 10px;' }, 'Enter a live tournament'),
            h('p', { style: 'margin: 0; max-width: 520px;' }, 'Weekly and daily tournaments across our games. Low entry fees. Real prize pools. Climb brackets, win coins, and convert to real payouts via PayPal or Stripe.'),
          ),
          h('a', { href: '/tournaments', 'data-link': true, class: 'btn btn-hot btn-lg' }, 'View Tournaments →')
        )
      )
    ),

    // Ad slot
    h('div', { class: 'container' }, AdSlot('970x250', 'Sponsored')),

    // Creators CTA
    h('section', { class: 'section' },
      h('div', { class: 'container' },
        h('div', { class: 'features' },
          h('div', { class: 'feature', style: 'padding: 28px;' },
            h('div', { class: 'emoji' }, '🎨'),
            h('h3', {}, 'Nexa Studio'),
            h('p', {}, 'Publish your HTML5 game on Nexa. We handle hosting, accounts, leaderboards, ads, and payments — you keep 70% of revenue.'),
            h('a', { href: '/creators', 'data-link': true, class: 'btn btn-sm', style: 'margin-top: 12px;' }, 'Learn more →')
          ),
          h('div', { class: 'feature', style: 'padding: 28px;' },
            h('div', { class: 'emoji' }, '💎'),
            h('h3', {}, 'Nexa Pro'),
            h('p', {}, 'Ad-free, 2x XP, private multiplayer rooms, exclusive cosmetics, and priority tournament access.'),
            h('a', { href: '/shop', 'data-link': true, class: 'btn btn-sm', style: 'margin-top: 12px;' }, 'Upgrade →')
          ),
          h('div', { class: 'feature', style: 'padding: 28px;' },
            h('div', { class: 'emoji' }, '🎁'),
            h('h3', {}, 'Invite & earn'),
            h('p', {}, 'Refer friends — when they play, you both get bonus coins. Build your crew and climb together.'),
            h('a', { href: '/signup', 'data-link': true, class: 'btn btn-sm', style: 'margin-top: 12px;' }, 'Start free →')
          ),
        )
      )
    ),

    // Newsletter
    h('section', { class: 'section' },
      h('div', { class: 'container' },
        h('div', { class: 'panel', style: 'max-width: 720px; margin: 0 auto; text-align:center; padding: 40px;' },
          h('div', { class: 'section-eyebrow', style: 'margin-bottom: 8px;' }, 'Stay in the loop'),
          h('h2', {}, 'New games, new tournaments — every week'),
          h('p', { style: 'max-width: 520px; margin: 0 auto 22px;' }, 'One short email. No spam, ever.'),
          h('form', { class: 'form', onSubmit: onNewsletter, style: 'flex-direction: row; max-width: 500px; margin: 0 auto;' },
            h('input', { name: 'email', type: 'email', required: true, placeholder: 'your@email.com' }),
            h('button', { class: 'btn btn-primary', type: 'submit' }, 'Subscribe'),
          )
        )
      )
    ),
  );

  const grid = wrap.querySelector('#featured-grid');
  if (grid) {
    api('/api/home/featured')
      .then(({ order, highlightId }) => {
        grid.innerHTML = '';
        const byId = Object.fromEntries(GAMES.map((g) => [g.id, g]));
        for (const id of order) {
          const g = byId[id] || findGame(id);
          if (g) grid.appendChild(GameCard(g, highlightId));
        }
        if (!grid.children.length) {
          GAMES.slice(0, 8).forEach((g) => grid.appendChild(GameCard(g, null)));
        }
      })
      .catch(() => {
        grid.innerHTML = '';
        GAMES.slice(0, 8).forEach((g) => grid.appendChild(GameCard(g, null)));
      });
  }

  return wrap;
}

function Stat(n, l) {
  return h('div', { class: 'hero-stat' },
    h('div', { class: 'n' }, n),
    h('div', { class: 'l' }, l)
  );
}

function Feature(emoji, title, text) {
  return h('div', { class: 'feature' },
    h('div', { class: 'emoji' }, emoji),
    h('h3', {}, title),
    h('p', {}, text)
  );
}

function ReleasePanel(eyebrow, text, footer) {
  return h('div', { class: 'release-panel' },
    h('div', { class: 'release-panel-glow' }),
    h('div', { class: 'section-eyebrow' }, eyebrow),
    h('p', { class: 'release-copy' }, text),
    h('div', { class: 'release-footer' }, footer)
  );
}

export function GameCard(g, hourlyHighlightId = null) {
  const badges = [];
  if (g.multiplayer) badges.push(h('span', { class: 'badge badge-mp' }, 'Multiplayer'));
  if (hourlyHighlightId && g.id === hourlyHighlightId) {
    badges.push(h('span', { class: 'badge badge-new' }, 'New this hour'));
  } else if (g.new) {
    badges.push(h('span', { class: 'badge badge-new' }, 'New'));
  }

  return h('a', { href: `/games/${g.id}`, 'data-link': true, class: 'card' },
    h('div', { class: `card-thumb game-art game-art-${g.id}` },
      h('div', { class: 'art-layer art-layer-a' }),
      h('div', { class: 'art-layer art-layer-b' }),
      h('div', { class: 'icon', style: 'font-size: 68px;' }, g.emoji),
    ),
    h('div', { class: 'card-body' },
      h('div', { style: 'margin-bottom:8px;' }, ...badges),
      h('h3', { class: 'card-title' }, g.name),
      h('p', { class: 'card-desc' }, g.short)
    )
  );
}
