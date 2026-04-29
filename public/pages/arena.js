import { h, api, route } from '../core.js';
import { findGame } from '../games/index.js';

export function ArenaPage() {
  const tableBody = h('tbody', {});
  const featuredSection = h('div', { class: 'featured-player-arena' }, [
    h('div', { class: 'arena-loading' }, 'SYNCHRONIZING WITH LIVE BATTLE GRID...')
  ]);

  const container = h('div', { class: 'container section' },
    h('div', { style: 'text-align:center; margin-bottom: 60px;' },
      h('h1', { style: 'font-size: clamp(48px, 8vw, 100px); margin-bottom: 10px;' }, '🏟️ LIVE ARENA'),
      h('p', { style: 'color: var(--neon-cyan); letter-spacing: 2px; font-weight: 800;' }, 'REAL-TIME NEURAL COMBAT STREAM')
    ),
    
    // Main Display: Top Player
    h('div', { class: 'panel arena-hero', style: 'padding: 0; overflow: hidden; border-color: var(--neon-purple);' },
      featuredSection
    ),

    h('div', { class: 'row', style: 'margin-top: 60px;' },
      h('div', { class: 'col-lg-8' },
        h('div', { class: 'panel' },
          h('h3', { style: 'margin-bottom: 20px;' }, '⚡ TOP 10 ACTIVE OPERATIVES'),
          h('table', { class: 'table' },
            h('thead', {},
              h('tr', {},
                h('th', {}, 'OPERATIVE'),
                h('th', {}, 'MISSION'),
                h('th', { style: 'text-align:right' }, 'LIVE SCORE'),
                h('th', {}, '')
              )
            ),
            tableBody
          )
        )
      ),
      h('div', { class: 'col-lg-4' },
        h('div', { class: 'panel', style: 'background: rgba(0, 243, 255, 0.05);' },
          h('h4', {}, 'ARENA INTEL'),
          h('p', { style: 'font-size: 14px; margin-top: 10px; color: var(--text-dim);' }, 'The Live Arena displays real-time tactical feeds from the highest-ranking operatives currently active on the grid. If a top operative disconnects, the stream automatically synchronizes with the next high-value target.'),
          h('div', { style: 'margin-top: 20px; padding: 15px; border-left: 2px solid var(--neon-cyan);' }, 
            h('small', { style: 'display:block; margin-bottom: 5px;' }, 'SYSTEM STATUS:'),
            h('div', { style: 'color: var(--neon-cyan); font-weight: bold; font-size: 12px;' }, '✅ ALL NEURAL UPLINKS STABLE')
          )
        )
      )
    )
  );

  let lastTopPlayerId = null;

  function update() {
    api('/api/arena/live').then(data => {
      const { top_player, live_players } = data;

      // Update Featured
      if (!top_player) {
        featuredSection.innerHTML = '';
        featuredSection.appendChild(h('div', { style: 'padding: 100px; text-align:center; color: var(--text-dim);' }, [
          h('div', { style: 'font-size: 60px; margin-bottom: 20px;' }, '📡'),
          h('h3', {}, 'WAITING FOR COMBAT SIGNALS'),
          h('p', {}, 'No operatives are currently active in high-intensity sectors.')
        ]));
        lastTopPlayerId = null;
      } else if (top_player.user_id !== lastTopPlayerId) {
        const game = findGame(top_player.game_id);
        featuredSection.innerHTML = '';
        featuredSection.appendChild(h('div', { class: 'arena-featured-grid' }, [
          h('div', { class: 'arena-featured-info' }, [
            h('div', { class: 'operative-badge' }, [
              h('span', { class: 'pulse-dot' }),
              ' LIVE STREAM'
            ]),
            h('h2', { style: 'font-size: 48px; margin: 20px 0;' }, top_player.username),
            h('div', { class: 'arena-game-meta' }, [
              h('span', { style: 'font-size: 32px; margin-right: 10px;' }, game?.emoji || '🕹️'),
              h('div', {}, [
                h('div', { style: 'font-weight: bold;' }, game?.name || top_player.game_id),
                h('small', { style: 'color: var(--text-dim)' }, 'CURRENT MISSION')
              ])
            ]),
            h('div', { class: 'arena-live-score', style: 'margin-top: 40px;' }, [
              h('div', { style: 'font-size: 14px; letter-spacing: 2px; color: var(--neon-cyan);' }, 'REAL-TIME INTENSITY'),
              h('div', { id: 'featured-score', style: 'font-size: 80px; font-weight: 900; font-family: var(--font-heading);' }, top_player.score.toLocaleString())
            ])
          ]),
          h('div', { class: 'arena-visual-feed' }, [
             h('div', { class: 'scanline' }),
             h('div', { class: 'noise' }),
             h('div', { style: 'font-size: 200px; opacity: 0.2; filter: blur(10px);' }, game?.emoji || '🕹️')
          ])
        ]));
        lastTopPlayerId = top_player.user_id;
      } else {
        // Just update score if same player
        const scoreEl = featuredSection.querySelector('#featured-score');
        if (scoreEl) scoreEl.textContent = top_player.score.toLocaleString();
      }

      // Update Table
      tableBody.innerHTML = '';
      if (live_players.length === 0) {
        tableBody.appendChild(h('tr', {}, h('td', { colspan: 4, style: 'text-align:center; padding: 40px; color: var(--text-dim);' }, 'GRID EMPTY. JOIN A MISSION TO APPEAR HERE.')));
      } else {
        live_players.forEach((p, i) => {
          const game = findGame(p.game_id);
          tableBody.appendChild(h('tr', { style: p.user_id === lastTopPlayerId ? 'background: rgba(0, 243, 255, 0.1);' : '' }, [
            h('td', { style: 'display:flex; align-items:center; gap: 12px;' }, [
               h('div', { class: 'avatar-sm' }, p.avatar || '👤'),
               h('div', {}, [
                 h('div', { style: 'font-weight: bold;' }, p.username),
                 h('small', { style: 'color: var(--text-dim)' }, `LVL ${p.level}`)
               ])
            ]),
            h('td', {}, [
              h('span', { style: 'margin-right: 8px;' }, game?.emoji || '🕹️'),
              game?.name || p.game_id
            ]),
            h('td', { style: 'text-align:right; font-weight: bold; color: var(--neon-cyan);' }, p.score.toLocaleString()),
            h('td', { style: 'text-align:right' }, [
               h('button', { class: 'btn btn-sm', onClick: () => route(`/games/${p.game_id}`) }, 'SPECTATE')
            ])
          ]));
        });
      }
    }).catch(e => console.error("Arena Sync Error:", e));
  }

  const interval = setInterval(update, 5000);
  update();

  // Cleanup
  container.addEventListener('remove', () => clearInterval(interval));
  // Since we don't have a formal 'unmount' hook in core.js yet, we use a MutationObserver or similar if needed.
  // But for now, we'll just check if the element is still in DOM in the interval.
  const intWithCheck = setInterval(() => {
    if (!document.body.contains(container)) clearInterval(intWithCheck);
    else update();
  }, 5000);
  clearInterval(interval); // remove the first one

  return container;
}
