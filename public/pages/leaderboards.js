import { h, api } from '../core.js';
import { GAMES, findGame } from '../games/index.js';

export function LeaderboardsPage({ params }) {
  const gameId = params.id || GAMES[0].id;
  const game = findGame(gameId) || GAMES[0];

  const tableBody = h('tbody', {});
  const page = h('div', { class: 'container section' },
    h('h1', {}, '🏆 Leaderboards'),
    h('div', { class: 'row', style: 'margin-bottom: 14px; flex-wrap: wrap;' },
      ...GAMES.map(g => h('a', {
        href: `/leaderboards/${g.id}`, 'data-link': true,
        class: 'btn btn-sm ' + (g.id === game.id ? 'btn-primary' : ''),
      }, `${g.emoji} ${g.name}`))
    ),
    h('div', { class: 'panel' },
      h('h3', {}, `${game.emoji}  ${game.name} · Top 25`),
      h('table', { class: 'table' },
        h('thead', {},
          h('tr', {},
            h('th', {}, 'Rank'),
            h('th', {}, 'Player'),
            h('th', { style: 'text-align:right' }, 'Best score')
          )
        ),
        tableBody
      )
    )
  );
  api(`/api/scores/leaderboard/${game.id}`).then(({ leaderboard }) => {
    if (!leaderboard || leaderboard.length === 0) {
      tableBody.appendChild(h('tr', {}, h('td', { colspan: 3, style: 'text-align:center; padding: 30px 0; color: var(--muted);' }, 'Be the first to score! Play now and top the board.')));
      return;
    }
    leaderboard.forEach((row, i) => {
      const rc = 'rank' + (i === 0 ? ' rank-1' : i === 1 ? ' rank-2' : i === 2 ? ' rank-3' : '');
      tableBody.appendChild(h('tr', {},
        h('td', { class: rc }, `#${i + 1}`),
        h('td', {}, row.display_name || row.username),
        h('td', { style: 'text-align:right; font-weight: 700;' }, row.best_score.toLocaleString())
      ));
    });
  }).catch(() => {
    tableBody.appendChild(h('tr', {}, h('td', { colspan: 3, style: 'color: var(--muted); padding: 20px;' }, 'Could not load leaderboard.')));
  });
  return page;
}
