import { h, api, toast, state, route, AdSlot } from '../core.js';
import { findGame } from '../games/index.js';

// --- Neural Network Background Animation ---
function NeuralBackground(canvas) {
  const ctx = canvas.getContext('2d');
  let nodes = [];
  const count = 50;
  let mouse = { x: -1000, y: -1000 };

  class Node {
    constructor() {
      this.x = Math.random() * canvas.width;
      this.y = Math.random() * canvas.height;
      this.vx = (Math.random() - 0.5) * 0.5;
      this.vy = (Math.random() - 0.5) * 0.5;
    }
    update() {
      this.x += this.vx;
      this.y += this.vy;
      if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
      if (this.y < 0 || this.y > canvas.height) this.vy *= -1;
    }
  }

  for (let i = 0; i < count; i++) nodes.push(new Node());

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = 'rgba(0, 243, 255, 0.1)';
    ctx.lineWidth = 1;

    nodes.forEach((n, i) => {
      n.update();
      nodes.slice(i + 1).forEach(m => {
        const dx = n.x - m.x;
        const dy = n.y - m.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 150) {
          ctx.beginPath();
          ctx.moveTo(n.x, n.y);
          ctx.lineTo(m.x, m.y);
          ctx.stroke();
        }
      });
      
      const mdx = n.x - mouse.x;
      const mdy = n.y - mouse.y;
      const mdist = Math.sqrt(mdx * mdx + mdy * mdy);
      if (mdist < 100) {
        ctx.fillStyle = 'rgba(0, 243, 255, 0.5)';
        ctx.beginPath();
        ctx.arc(n.x, n.y, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    });
    requestAnimationFrame(draw);
  }

  window.addEventListener('mousemove', e => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  });

  draw();
}

function MagneticButton(el) {
  el.addEventListener('mousemove', e => {
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    el.style.transform = `translate(${x * 0.3}px, ${y * 0.3}px) scale(1.1)`;
  });
  el.addEventListener('mouseleave', () => {
    el.style.transform = '';
  });
}

export function TournamentsPage() {
  const canvas = h('canvas', { style: 'position:fixed; inset:0; z-index:-1; pointer-events:none; opacity:0.3;' });
  
  const wrap = h('div', { class: 'container section' },
    canvas,
    // Global Live Ticker
    h('div', { class: 'live-ticker' },
      h('div', { class: 'ticker-content' }, 
        '🔥 TOURNAMENT UPDATE: User "ShadowWalker" just claimed 1st in Snake! • PRIZE POOL ALERT: 2048 Mega-Bowl just hit $100! • NEW ARENA: "The Neon Grid" is now live for all competitive operations. • '
      )
    ),
    h('div', { style: 'display:flex; justify-content: space-between; margin-top: 60px;' },
      h('div', { class: 'section-head' },
        h('div', { class: 'section-eyebrow' }, 'NEURAL GRID ACTIVE'),
        h('h1', {}, 'Competitive Operations'),
        h('p', { style: 'max-width: 680px; color: var(--text-dim);' }, 'Synchronize your performance data. High-fidelity prize pools distributed weekly to top performers.')
      ),
      // Hall of Fame Mini-Widget
      h('div', { class: 'hof-widget reveal-text' },
        h('h4', { style: 'margin-bottom: 15px; font-size: 14px; color: var(--neon-gold);' }, '🏆 DEFENDING CHAMPIONS'),
        h('div', { style: 'display:flex; gap: 10px;' },
          h('div', { class: 'hof-avatar', style: 'background: url(https://api.dicebear.com/7.x/avataaars/svg?seed=Felix) center/cover;' }),
          h('div', { class: 'hof-avatar', style: 'background: url(https://api.dicebear.com/7.x/avataaars/svg?seed=Nala) center/cover;' }),
          h('div', { class: 'hof-avatar', style: 'background: url(https://api.dicebear.com/7.x/avataaars/svg?seed=Milo) center/cover;' })
        )
      )
    ),
    h('div', { id: 'list', class: 'grid', style: 'margin-top: 60px;' }, h('div', { class: 'panel' }, 'INITIALIZING NEURAL GRID…')),
    AdSlot('728x90', 'Sponsored Transmission')
  );

  queueMicrotask(() => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    NeuralBackground(canvas);
  });

  api('/api/tournaments').then(({ tournaments, now }) => {
    const list = wrap.querySelector('#list');
    list.innerHTML = '';
    if (!tournaments.length) {
      list.appendChild(h('div', { class: 'panel' }, h('p', {}, 'No active operations detected.')));
      return;
    }
    tournaments.forEach((t, i) => {
      const card = TournamentCard(t, now);
      card.style.animationDelay = `${i * 100}ms`;
      card.classList.add('stagger-in');
      list.appendChild(card);
    });
  }).catch(e => {
    wrap.querySelector('#list').innerHTML = 'System Error: ' + e.message;
  });

  return wrap;
}

export function TournamentCard(t, now) {
  const game = findGame(t.game_id);
  const endsInMs = Math.max(0, t.ends_at - now);
  const totalDuration = 7 * 24 * 60 * 60 * 1000; // Assume 7 days total for progress bar
  const progress = Math.min(100, (1 - endsInMs / totalDuration) * 100);
  const days = Math.floor(endsInMs / (86400000));
  const hours = Math.floor((endsInMs % 86400000) / 3600000);
  const prize = (t.prize_pool_cents / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
  
  const joinBtn = h('button', { class: 'btn btn-primary magnetic', style: 'width: 100%;' }, 'Synchronize Entry');
  MagneticButton(joinBtn);

  const video = h('video', { 
    class: 'card-video', muted: true, loop: true, playsinline: true, 
    style: 'position:absolute; inset:0; width:100%; height:100%; object-fit:cover; opacity:0; transition:0.8s; z-index:-1;'
  });
  
  fetch('/Videos/videos.json').then(r => r.json()).then(v => {
    const randomVideo = v[Math.floor(Math.random() * v.length)];
    video.src = `/Videos/${randomVideo}`;
  });

  const card = h('div', { 
    class: 'tournament-card',
    onMouseEnter: () => video.play().then(() => video.style.opacity = '0.3'),
    onMouseLeave: () => { video.pause(); video.style.opacity = '0'; }
  },
    video,
    h('div', { style: 'display:flex; justify-content: space-between; align-items: center;' },
      h('div', { class: 'badge', style: 'background: rgba(0,243,255,0.1); color: var(--neon-cyan);' }, game?.emoji + ' ' + game?.name),
      h('div', { style: 'color: var(--neon-pink); font-size: 12px; font-weight: bold;' }, '🔥 12 PLAYERS ACTIVE')
    ),
    h('h3', { style: 'margin: 20px 0 10px;' }, t.title),
    h('p', { style: 'font-size: 14px; color: var(--text-dim);' }, t.description || 'Global competitive bracket for all eligible agents.'),
    
    h('div', { style: 'margin: 30px 0;' },
      h('div', { style: 'display:flex; justify-content: space-between; font-size: 13px; margin-bottom: 8px;' },
        h('span', { style: 'color: var(--neon-gold);' }, `PRIZE: ${prize}`),
        h('span', {}, `${days}d ${hours}h REMAINING`)
      ),
      h('div', { class: 'progress-container' },
        h('div', { class: `progress-bar ${days < 1 ? 'progress-pulse' : ''}`, style: `width: ${progress}%;` })
      )
    ),

    h('div', { style: 'display:grid; grid-template-columns: 1fr 1fr; gap: 10px;' },
      joinBtn,
      h('a', { href: `/games/${t.game_id}`, 'data-link': true, class: 'btn', style: 'text-align: center;' }, 'Preview Loop')
    )
  );

  joinBtn.onclick = async () => {
    if (!state.user) { toast('Log in to join', ''); route('/login'); return; }
    try {
      const res = await api(`/api/tournaments/${t.id}/join`, { method: 'POST' });
      toast('Entry synchronized!', 'success');
    } catch (e) { toast(e.message, 'error'); }
  };

  return card;
}
