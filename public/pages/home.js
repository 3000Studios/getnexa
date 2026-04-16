import { h, AdSlot, api, toast } from '../core.js';
import { GAMES } from '../games/index.js';

export function HomePage() {
  const featured = GAMES.slice(0, 8);

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

  return h('div', {},
    // Hero
    h('section', { class: 'hero' },
      h('div', { class: 'container hero-content' },
        h('img', { src: '/favicon.svg', alt: 'Nexa Arcade logo', class: 'hero-logo', width: 100, height: 100 }),
        h('div', { class: 'hero-kicker' },
          h('span', { class: 'dot' }),
          h('span', {}, 'Live multiplayer · Tournaments · Cloud saves')
        ),
        h('h1', {}, 'Play. Compete. ', h('span', { class: 'accent' }, 'Conquer.')),
        h('p', { class: 'lead' },
          'Nexa Arcade is the modern browser gaming hub. Real-time multiplayer, paid tournaments with prize pools, live leaderboards, and cross-device saves — all free to start. No downloads. Just play.'),
        h('div', { class: 'hero-cta' },
          h('a', { href: '/games', 'data-link': true, class: 'btn btn-primary btn-lg' }, '▶  Play Now'),
          h('a', { href: '/tournaments', 'data-link': true, class: 'btn btn-lg' }, '🏆 Tournaments'),
          h('a', { href: '/signup', 'data-link': true, class: 'btn btn-lg btn-ghost' }, 'Free Account'),
        ),
        h('div', { class: 'hero-stats' },
          Stat('8+', 'Games'),
          Stat('∞', 'Leaderboards'),
          Stat('0$', 'To start'),
          Stat('24/7', 'Live'),
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
        h('div', { class: 'grid' }, ...featured.map(GameCard))
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

export function GameCard(g) {
  const badges = [];
  if (g.multiplayer) badges.push(h('span', { class: 'badge badge-mp' }, 'Multiplayer'));
  if (g.new) badges.push(h('span', { class: 'badge badge-new' }, 'New'));

  return h('a', { href: `/games/${g.id}`, 'data-link': true, class: 'card' },
    h('div', { class: 'card-thumb' },
      h('div', { class: 'icon', style: 'font-size: 68px;' }, g.emoji),
    ),
    h('div', { class: 'card-body' },
      h('div', { style: 'margin-bottom:8px;' }, ...badges),
      h('h3', { class: 'card-title' }, g.name),
      h('p', { class: 'card-desc' }, g.short)
    )
  );
}
