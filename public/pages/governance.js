import { h, api, toast, state, route } from '../core.js';

export function GovernancePage() {
  const grid = h('div', { class: 'governance-grid' });
  const page = h('div', { class: 'container section' },
    h('div', { class: 'section-head' },
      h('div', {},
        h('div', { class: 'section-eyebrow' }, 'NEURAL GOVERNANCE'),
        h('h1', {}, 'The Grid Evolution'),
        h('p', { style: 'max-width: 680px;' }, 'Synchronize your tactical preference. The community decides which operations are prioritized for development. Every vote is a verifiable neural handshake.'),
      )
    ),
    grid
  );

  const loadProposals = () => {
    api('/api/governance').then(({ proposals }) => {
      grid.innerHTML = '';
      proposals.forEach(p => grid.appendChild(ProposalCard(p, loadProposals)));
    }).catch(e => toast(e.message, 'error'));
  };

  loadProposals();
  return page;
}

function ProposalCard(p, refresh) {
  const vote = (type) => {
    if (!state.user) { toast('Synchronize first (Log in)', ''); route('/login'); return; }
    api('/api/governance/vote', { method: 'POST', body: { game_id: p.id, type } })
      .then(() => {
        toast('Vote Synchronized', 'success');
        refresh();
      })
      .catch(e => toast(e.message, 'error'));
  };

  const total = p.upvotes + p.downvotes;
  const pct = total === 0 ? 0 : Math.round((p.upvotes / total) * 100);

  return h('div', { class: 'panel governance-card', style: 'border-left: 4px solid var(--primary);' },
    h('div', { style: 'display:flex; justify-content: space-between; align-items: center;' },
      h('div', {},
        h('div', { class: 'section-eyebrow' }, p.genre),
        h('h3', { style: 'margin: 5px 0;' }, p.name),
      ),
      h('div', { class: 'status-badge' }, p.status.toUpperCase())
    ),
    h('p', { style: 'font-size: 14px; color: var(--text-dim); margin: 15px 0;' }, p.description),
    h('div', { class: 'vote-stats', style: 'margin-bottom: 20px;' },
      h('div', { style: 'display:flex; justify-content: space-between; font-size: 12px; margin-bottom: 5px;' },
        h('span', {}, `${pct}% Approval`),
        h('span', { style: 'color: var(--text-dim);' }, `${total} Votes`)
      ),
      h('div', { class: 'progress-container', style: 'height: 4px;' },
        h('div', { class: 'progress-bar', style: `width: ${pct}%;` })
      )
    ),
    h('div', { class: 'row', style: 'gap: 10px;' },
      h('button', { class: 'btn btn-primary', style: 'flex: 1;', onClick: () => vote('up') }, '👍 AGREE'),
      h('button', { class: 'btn', style: 'flex: 1;', onClick: () => vote('down') }, '👎 REJECT')
    )
  );
}
