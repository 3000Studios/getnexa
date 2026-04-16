import { h, api, toast } from '../core.js';

export function CreatorsPage() {
  const onApply = async (e) => {
    e.preventDefault();
    const form = e.target;
    try {
      await api('/api/creators/apply', {
        method: 'POST',
        body: {
          name: form.name.value.trim(),
          email: form.email.value.trim(),
          website: form.website.value.trim(),
          portfolio: form.portfolio.value.trim(),
          about: form.about.value.trim(),
        },
      });
      toast('Application sent! We\'ll be in touch within 3 business days.', 'success');
      form.reset();
    } catch (err) { toast(err.message, 'error'); }
  };

  return h('div', {},
    h('section', { class: 'hero' },
      h('div', { class: 'container hero-content' },
        h('div', { class: 'hero-kicker' }, h('span', { class: 'dot' }), h('span', {}, '70% revenue share · no upfront cost')),
        h('h1', {}, 'Build games. ', h('span', { class: 'accent' }, 'Get paid.')),
        h('p', { class: 'lead' }, 'Nexa Studio is our creator program. Upload your HTML5 game, we handle hosting, accounts, leaderboards, payments, and ads. You keep 70% of ad and in-game revenue. No contracts. No exclusivity. Cancel anytime.'),
        h('div', { class: 'hero-cta' },
          h('a', { href: '#apply', class: 'btn btn-primary btn-lg' }, 'Apply to Studio'),
          h('a', { href: '#how', class: 'btn btn-lg btn-ghost' }, 'How it works')
        )
      )
    ),

    h('section', { class: 'section', id: 'how' },
      h('div', { class: 'container' },
        h('div', { class: 'section-head' }, h('div', {}, h('div', { class: 'section-eyebrow' }, 'How it works'), h('h2', {}, 'From upload to payout'))),
        h('div', { class: 'features' },
          f('1️⃣', 'Apply & upload', 'Send us a playable build. We review for quality, safety, and originality. Most reviews finish in 3 business days.'),
          f('2️⃣', 'We host it', 'Your game runs on Cloudflare\'s global edge. Player accounts, saves, leaderboards, and multiplayer are all wired in automatically.'),
          f('3️⃣', 'Monetize', 'Earn from ads, premium cosmetics, in-game currency, and tournament fees. Payouts monthly via PayPal or Stripe.'),
        )
      )
    ),

    h('section', { class: 'section' },
      h('div', { class: 'container' },
        h('div', { class: 'section-head' }, h('div', {}, h('div', { class: 'section-eyebrow' }, 'Revenue'), h('h2', {}, 'The deal'))),
        h('div', { class: 'features' },
          f('💰', '70% of ad revenue', 'Any AdSense or direct-sold ad revenue on your game\'s pages is split 70/30 in your favor, measured per-view.'),
          f('🪙', '70% of IAP revenue', 'When a player buys an XP boost, cosmetic, or coin pack tied to your game — you take 70% after payment fees.'),
          f('🏆', 'Tournament fees', 'We share 50% of tournament entry fees for any tournament held on your game.'),
          f('📊', 'Live analytics', 'See players, sessions, retention, and revenue updated in real time from your creator dashboard.'),
          f('🔁', 'No exclusivity', 'Publish anywhere else. Nexa is non-exclusive.'),
          f('💳', 'Monthly payouts', 'Minimum $20 payout threshold. Stripe Connect or PayPal.'),
        )
      )
    ),

    h('section', { class: 'section', id: 'apply' },
      h('div', { class: 'container', style: 'max-width: 720px;' },
        h('div', { class: 'panel' },
          h('h2', {}, 'Apply to Nexa Studio'),
          h('p', {}, 'Tell us about yourself and your game(s). We review every submission.'),
          h('form', { class: 'form', onSubmit: onApply },
            h('label', {}, 'Your name'),
            h('input', { name: 'name', required: true, maxLength: 100, placeholder: 'Full name or studio name' }),
            h('label', {}, 'Email'),
            h('input', { name: 'email', type: 'email', required: true, placeholder: 'you@example.com' }),
            h('label', {}, 'Website (optional)'),
            h('input', { name: 'website', placeholder: 'https://…' }),
            h('label', {}, 'Portfolio or game link (optional)'),
            h('input', { name: 'portfolio', placeholder: 'https://…' }),
            h('label', {}, 'Tell us about you and your game'),
            h('textarea', { name: 'about', required: true, minLength: 20, rows: 5, placeholder: 'What kind of games do you make? What is your next project?' }),
            h('button', { class: 'btn btn-primary', type: 'submit' }, 'Submit application')
          )
        )
      )
    )
  );

  function f(emoji, title, text) {
    return h('div', { class: 'feature' }, h('div', { class: 'emoji' }, emoji), h('h3', {}, title), h('p', {}, text));
  }
}
