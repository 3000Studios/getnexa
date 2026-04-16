import { h, api, toast, state, route, AdSlot } from '../core.js';
import { findGame } from '../games/index.js';

export function TournamentsPage() {
  const wrap = h('div', { class: 'container section' },
    h('div', { class: 'section-head' },
      h('div', {},
        h('div', { class: 'section-eyebrow' }, 'Compete for cash'),
        h('h1', {}, '🏆 Tournaments'),
        h('p', { style: 'max-width: 680px;' }, 'Enter for a small fee, climb the bracket, win real prize pools. Scores from your games auto-submit to any tournament you\'ve joined.'),
      )
    ),
    h('div', { id: 'list', class: 'grid' }, h('div', { class: 'panel' }, 'Loading tournaments…')),
    AdSlot('728x90', 'Sponsored')
  );

  api('/api/tournaments').then(({ tournaments, now }) => {
    const list = wrap.querySelector('#list');
    list.innerHTML = '';
    if (!tournaments.length) {
      list.appendChild(h('div', { class: 'panel' }, h('p', {}, 'No tournaments scheduled. Check back soon!')));
      return;
    }
    tournaments.forEach(t => list.appendChild(TournamentCard(t, now)));
  }).catch(e => {
    wrap.querySelector('#list').innerHTML = '';
    wrap.querySelector('#list').appendChild(h('div', { class: 'panel' }, 'Error: ' + e.message));
  });

  return wrap;
}

function TournamentCard(t, now) {
  const game = findGame(t.game_id);
  const endsInMs = Math.max(0, t.ends_at - now);
  const days = Math.floor(endsInMs / (86400000));
  const hours = Math.floor((endsInMs % 86400000) / 3600000);
  const prize = (t.prize_pool_cents / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
  const entry = t.entry_cents === 0 ? 'Free' : `$${(t.entry_cents / 100).toFixed(2)}`;

  const join = async () => {
    if (!state.user) { toast('Log in to enter', ''); route('/login'); return; }
    try {
      const res = await api(`/api/tournaments/${t.id}/join`, { method: 'POST' });
      if (res.need_payment) {
        toast('Redirecting to checkout…', '');
        const c = await api('/api/pay/stripe/checkout', { method: 'POST', body: { product_id: 'tournament_entry' } }).catch(() => null);
        if (c?.url) location.href = c.url;
        else toast('Payment provider not configured yet — pay with coins or ask admin to set Stripe keys', 'error');
        return;
      }
      toast(res.paid_with === 'coins' ? `Joined! Used ${res.coin_cost} 🪙` : 'Joined! Play the game to submit scores.', 'success');
    } catch (e) { toast(e.message, 'error'); }
  };

  return h('div', { class: 'tournament panel' },
    h('div', { class: 'row' },
      h('span', { class: 'badge badge-new' }, game?.emoji + ' ' + (game?.name || t.game_id)),
      h('span', { class: 'badge' }, 'Active'),
    ),
    h('h3', { style: 'margin: 10px 0 4px; font-size: 20px;' }, t.title),
    h('p', { style: 'margin: 0 0 6px;' }, t.description || ''),
    h('div', { class: 'prize' }, `Prize pool: ${prize}`),
    h('div', { class: 'meta' },
      h('span', {}, `⏱ Ends in ${days}d ${hours}h`),
      h('span', {}, `💵 Entry: ${entry}`),
      h('span', {}, `👥 ${t.entries} players`),
    ),
    h('div', { class: 'row', style: 'margin-top: 10px;' },
      h('button', { class: 'btn btn-hot', onClick: join }, 'Enter now'),
      h('a', { href: `/games/${t.game_id}`, 'data-link': true, class: 'btn' }, '▶ Play'),
      h('a', { href: `/leaderboards/${t.game_id}`, 'data-link': true, class: 'btn btn-ghost' }, 'Live standings'),
    )
  );
}
