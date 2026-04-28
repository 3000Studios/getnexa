// Tiny vanilla framework: hyperscript + router + shared state + toast
import { mountBackground, setRoute as setBgRoute } from './bg-3d.js';

export const state = {
  user: null,
};

export function h(tag, attrs = {}, ...children) {
  if (typeof tag === 'function') return tag({ ...attrs, children: children.flat(Infinity) });
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (k === 'class' || k === 'className') el.className = v;
    else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
    else if (k === 'html') el.innerHTML = v;
    else if (k === 'ref') typeof v === 'function' && v(el);
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
    else if (v === true) el.setAttribute(k, '');
    else if (v === false || v === null || v === undefined) { /* skip */ }
    else el.setAttribute(k, v);
  }
  for (const child of children.flat(Infinity)) {
    if (child === null || child === undefined || child === false) continue;
    if (child instanceof Node) el.appendChild(child);
    else el.appendChild(document.createTextNode(String(child)));
  }
  return el;
}

export function route(path, push = true) {
  if (push) history.pushState({}, '', path);
  render(currentRoutes);
  window.scrollTo({ top: 0, behavior: 'instant' });
}

let currentRoutes = [];

function matchRoute(routes, pathname) {
  for (const r of routes) {
    const pathParts = r.path.split('/').filter(Boolean);
    const urlParts = pathname.split('/').filter(Boolean);
    if (pathParts.length !== urlParts.length) continue;
    const params = {};
    let ok = true;
    for (let i = 0; i < pathParts.length; i++) {
      if (pathParts[i].startsWith(':')) params[pathParts[i].slice(1)] = decodeURIComponent(urlParts[i]);
      else if (pathParts[i] !== urlParts[i]) { ok = false; break; }
    }
    if (ok) return { route: r, params };
  }
  return null;
}

export function render(routes) {
  currentRoutes = routes;
  const app = document.getElementById('app');
  app.innerHTML = '';
  const url = new URL(location.href);
  const match = matchRoute(routes, url.pathname);
  // Ensure animated background is mounted and updated per route
  try { mountBackground(); setBgRoute(url.pathname); } catch {}

  app.appendChild(Header());
  const main = document.createElement('main');
  if (!match) {
    main.appendChild(NotFound());
  } else {
    try {
      main.appendChild(match.route.view({ params: match.params, query: url.searchParams }));
    } catch (e) {
      console.error(e);
      main.appendChild(h('div', { class: 'container section' }, h('h2', {}, 'Something went wrong'), h('p', {}, String(e.message || e))));
    }
  }
  app.appendChild(main);
  app.appendChild(Footer());
  wireLinks(app);
  ensureToastContainer();
}

function wireLinks(root) {
  root.querySelectorAll('a[data-link]').forEach(a => {
    a.addEventListener('click', (e) => {
      const href = a.getAttribute('href');
      if (!href || href.startsWith('http') || href.startsWith('#')) return;
      e.preventDefault();
      route(href);
    });
  });
}

function Header() {
  const user = state.user;
  return h('header', { class: 'site-header' },
    h('div', { class: 'container nav' },
      h('a', { href: '/', 'data-link': true, class: 'brand' },
        h('div', { class: 'logo-mark' }, 'N'),
        h('span', {}, 'Nexa Arcade')
      ),
      h('nav', { class: 'nav-links' },
        h('a', { href: '/games', 'data-link': true }, 'Games'),
        h('a', { href: '/tournaments', 'data-link': true }, 'Tournaments'),
        h('a', { href: '/leaderboards', 'data-link': true }, 'Leaderboards'),
        h('a', { href: '/shop', 'data-link': true }, 'Shop'),
        h('a', { href: '/creators', 'data-link': true }, 'Creators'),
      ),
      h('div', { class: 'nav-spacer' }),
      h('div', { class: 'nav-cta' },
        user
          ? [
              h('span', { class: 'pill' }, `🪙 ${user.coins}`),
              h('a', { href: '/account', 'data-link': true, class: 'btn btn-sm' }, user.username),
            ]
          : [
              h('a', { href: '/login', 'data-link': true, class: 'btn btn-sm btn-ghost' }, 'Log in'),
              h('a', { href: '/signup', 'data-link': true, class: 'btn btn-sm btn-primary' }, 'Sign up'),
            ]
      )
    )
  );
}

function Footer() {
  const year = new Date().getFullYear();
  const videoRef = { el: null };

  const loadRandomVideo = async () => {
    try {
      const res = await fetch('/Videos/videos.json');
      const list = await res.json();
      if (list.length) {
        const video = list[Math.floor(Math.random() * list.length)];
        if (videoRef.el) {
          videoRef.el.src = `/Videos/${video}`;
          videoRef.el.play().catch(() => {});
        }
      }
    } catch {}
  };

  queueMicrotask(loadRandomVideo);

  return h('footer', { class: 'site-footer' },
    h('div', { class: 'container' },
      h('div', { class: 'footer-video-wrap' },
        h('video', { ref: el => videoRef.el = el, autoplay: true, muted: true, loop: true, playsinline: true }),
        h('div', { class: 'footer-video-label' }, 'LIVE STREAM')
      ),
      h('div', { class: 'footer-grid', style: 'margin-top: 40px;' },
        h('div', { class: 'footer-col' },
          h('div', { class: 'brand', style: 'margin-bottom: 12px;' },
            h('div', { class: 'logo-mark' }, 'N'),
            h('span', {}, 'Nexa Arcade')
          ),
          h('p', { style: 'margin:0; max-width: 360px; font-size: 8px;' },
            'Nexa Arcade is a free online gaming hub — play browser games, compete on leaderboards, challenge friends, and collect rewards. Built and hosted on Cloudflare.'),
        ),
        h('div', { class: 'footer-col' },
          h('h4', { style: 'font-size: 8px;' }, 'Play'),
          h('a', { href: '/games', 'data-link': true, style: 'font-size: 8px;' }, 'All Games'),
          h('a', { href: '/tournaments', 'data-link': true, style: 'font-size: 8px;' }, 'Tournaments'),
        ),
        h('div', { class: 'footer-col' },
          h('h4', { style: 'font-size: 8px;' }, 'Legal'),
          h('a', { href: '/privacy', 'data-link': true, style: 'font-size: 8px;' }, 'Privacy'),
          h('a', { href: '/terms', 'data-link': true, style: 'font-size: 8px;' }, 'Terms'),
        ),
      ),
      h('div', { class: 'footer-bottom', style: 'font-size: 8px;' },
        h('div', {}, `© ${year} Nexa Arcade.`),
        h('div', {}, 'Made on Cloudflare')
      )
    )
  );
}

function NotFound() {
  return h('div', { class: 'container section', style: 'text-align:center; padding: 80px 0;' },
    h('h1', {}, '404'),
    h('p', {}, 'The page you are looking for was not found.'),
    h('a', { href: '/', 'data-link': true, class: 'btn btn-primary' }, 'Back to home')
  );
}

function ensureToastContainer() {
  if (document.getElementById('toast-container')) return;
  const c = document.createElement('div');
  c.id = 'toast-container';
  c.className = 'toast-container';
  document.body.appendChild(c);
}

export function toast(message, type = '') {
  ensureToastContainer();
  const c = document.getElementById('toast-container');
  const t = document.createElement('div');
  t.className = 'toast ' + type;
  t.textContent = message;
  c.appendChild(t);
  setTimeout(() => { t.style.opacity = '0'; t.style.transform = 'translateX(10px)'; }, 3000);
  setTimeout(() => t.remove(), 3500);
}

// Google AdSense responsive ad unit (ca-pub-5800977493749262).
// When AdSense approves the site, create ad units and pass slot IDs here,
// OR just enable Auto Ads in the AdSense dashboard — the script in <head>
// will handle placement automatically. Until a slotId is provided, we keep
// a reserved, styled container so the layout doesn't jump.
export function AdSlot(size = '728x90', label = 'Advertisement', slotId = '') {
  const wrap = h('div', { class: 'ad-slot', 'aria-label': label });
  if (slotId) {
    const ins = document.createElement('ins');
    ins.className = 'adsbygoogle';
    ins.style.display = 'block';
    ins.style.width = '100%';
    ins.setAttribute('data-ad-client', 'ca-pub-5800977493749262');
    ins.setAttribute('data-ad-slot', slotId);
    ins.setAttribute('data-ad-format', 'auto');
    ins.setAttribute('data-full-width-responsive', 'true');
    wrap.appendChild(ins);
    queueMicrotask(() => { try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch {} });
  } else {
    wrap.appendChild(h('small', {}, `${label} (${size})`));
  }
  return wrap;
}

export async function api(path, opts = {}) {
  const res = await fetch(path, {
    method: opts.method || 'GET',
    headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
    credentials: 'include',
  });
  let json = {};
  try { json = await res.json(); } catch {}
  if (!res.ok) throw new Error(json.error || `Request failed (${res.status})`);
  return json;
}
