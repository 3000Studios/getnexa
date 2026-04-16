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
        h('span', { class: 'badge' }, '🎮 New: Multiplayer Pong & Tic-Tac-Toe'),
        h('h1', {}, 'Play. Compete. Conquer.'),
        h('p', { class: 'lead' },
          'Nexa Arcade is your destination for free browser games. Live leaderboards, real-time multiplayer, achievements, and cross-device saves. No downloads. No installs. Just play.'),
        h('div', { class: 'hero-cta' },
          h('a', { href: '/games', 'data-link': true, class: 'btn btn-primary btn-lg' }, '▶  Browse Games'),
          h('a', { href: '/signup', 'data-link': true, class: 'btn btn-lg btn-ghost' }, 'Create Free Account'),
        )
      )
    ),

    // Featured games
    h('section', { class: 'section' },
      h('div', { class: 'container' },
        h('div', { class: 'section-head' },
          h('h2', {}, 'Featured Games'),
          h('a', { href: '/games', 'data-link': true, class: 'btn btn-sm btn-ghost' }, 'See all →')
        ),
        h('div', { class: 'grid' }, ...featured.map(GameCard))
      )
    ),

    // Ad slot (AdSense)
    h('div', { class: 'container' }, AdSlot('728x90', 'Sponsored')),

    // Features
    h('section', { class: 'section' },
      h('div', { class: 'container' },
        h('div', { class: 'section-head' }, h('h2', {}, 'Why Nexa Arcade')),
        h('div', { class: 'features' },
          Feature('🎯', 'Skill-based leaderboards', 'Every score you post is ranked globally. Climb to the top and stay there.'),
          Feature('⚡', 'Instant browser play', 'No downloads, no ads to click through. Tap a game and go.'),
          Feature('🕹️', 'Real-time multiplayer', 'Invite a friend or matchmake with anyone in the world over WebSockets.'),
          Feature('☁️', 'Saves that follow you', 'Log in on any device and pick up exactly where you left off.'),
          Feature('🏆', 'Achievements & XP', 'Level up, unlock badges, and earn coins for every game you play.'),
          Feature('🛒', 'Your gear, your way', 'Themes, avatar frames, XP boosts, and power-ups in our store.'),
        )
      )
    ),

    // How it works
    h('section', { class: 'section' },
      h('div', { class: 'container' },
        h('div', { class: 'section-head' }, h('h2', {}, 'How it works')),
        h('div', { class: 'features' },
          Feature('1️⃣', 'Sign up free', 'Grab a username in 10 seconds. No credit card required.'),
          Feature('2️⃣', 'Pick a game', 'Browse our library — new titles added weekly.'),
          Feature('3️⃣', 'Play & earn', 'Rack up high scores, earn XP, unlock achievements, and collect coins.'),
        )
      )
    ),

    // Ad slot
    h('div', { class: 'container' }, AdSlot('970x250', 'Sponsored')),

    // Newsletter
    h('section', { class: 'section' },
      h('div', { class: 'container' },
        h('div', { class: 'panel', style: 'max-width: 700px; margin: 0 auto; text-align:center;' },
          h('h2', {}, 'Get notified of new games'),
          h('p', {}, 'One short email a week — new games, tournaments, and big updates. No spam, ever.'),
          h('form', { class: 'form', onSubmit: onNewsletter, style: 'flex-direction: row; max-width: 480px; margin: 0 auto;' },
            h('input', { name: 'email', type: 'email', required: true, placeholder: 'your@email.com' }),
            h('button', { class: 'btn btn-primary', type: 'submit' }, 'Subscribe'),
          )
        )
      )
    ),
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
      h('div', { class: 'icon', style: 'font-size: 64px;' }, g.emoji),
    ),
    h('div', { class: 'card-body' },
      h('div', { style: 'margin-bottom:6px;' }, ...badges),
      h('h3', { class: 'card-title' }, g.name),
      h('p', { class: 'card-desc' }, g.short)
    )
  );
}
