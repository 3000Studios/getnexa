import { mountBackground, setRoute as setBgRoute } from './bg-3d.js';
import { sfx, attachSfx } from './sfx.js';

export const state = { user: null };

// Hyperscript with auto-SFX attachment
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
  
  // Auto-attach SFX to interactive elements
  if (tag === 'button' || tag === 'a' || (attrs && (attrs.class || '').includes('btn') || (attrs && (attrs.class || '').includes('game-card')))) {
    attachSfx(el);
  }

  for (const child of children.flat(Infinity)) {
    if (child === null || child === undefined || child === false) continue;
    if (child instanceof Node) el.appendChild(child);
    else el.appendChild(document.createTextNode(String(child)));
  }
  return el;
}

export async function route(path, push = true) {
  if (push) history.pushState({}, '', path);
  
  // Page Warp Transition
  const warp = document.getElementById('warp-overlay');
  if (warp) {
    sfx.transition();
    await gsap.to(warp, { scaleY: 1, duration: 0.5, ease: 'expo.inOut', transformOrigin: 'bottom' });
    render(currentRoutes);
    window.scrollTo(0, 0);
    await gsap.to(warp, { scaleY: 0, duration: 0.5, ease: 'expo.inOut', transformOrigin: 'top' });
  } else {
    render(currentRoutes);
  }
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

  try { mountBackground(); setBgRoute(url.pathname); } catch {}

  app.appendChild(Header());
  const main = document.createElement('main');
  if (!match) main.appendChild(NotFound());
  else main.appendChild(match.route.view({ params: match.params, query: url.searchParams }));
  app.appendChild(main);
  app.appendChild(Footer());
  
  // Initialize Scroll Animations
  initScrollAnimations();
  wireLinks(app);
}

function initScrollAnimations() {
  gsap.registerPlugin(ScrollTrigger);
  
  // Reveal Text
  gsap.utils.toArray('.reveal-text').forEach(el => {
    gsap.to(el, {
      opacity: 1, y: 0, filter: 'blur(0px)', duration: 1, ease: 'expo.out',
      scrollTrigger: { trigger: el, start: 'top 90%' }
    });
  });

  // Reveal Cards
  gsap.utils.toArray('.reveal-card').forEach((el, i) => {
    gsap.to(el, {
      opacity: 1, scale: 1, y: 0, filter: 'blur(0px)', duration: 1.2, ease: 'expo.out', delay: i * 0.1,
      scrollTrigger: { trigger: el, start: 'top 85%' }
    });
  });

  // Sticky Header Logic
  const header = document.querySelector('.site-header');
  ScrollTrigger.create({
    start: 'top -50',
    onUpdate: (self) => {
      if (self.direction === 1) header.classList.add('scrolled');
      else if (self.scroll() < 50) header.classList.remove('scrolled');
    }
  });
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
      h('a', { href: '/', 'data-link': true, class: 'brand' }, 'NEXA'),
      h('nav', { class: 'nav-links' },
        h('a', { href: '/games', 'data-link': true }, 'Catalog'),
        h('a', { href: '/tournaments', 'data-link': true }, 'Arena'),
        h('a', { href: '/leaderboards', 'data-link': true }, 'Legends'),
        h('a', { href: '/creators', 'data-link': true }, 'Studio'),
      ),
      h('div', { class: 'nav-cta' },
        user
          ? h('a', { href: '/account', 'data-link': true, class: 'btn btn-sm' }, user.username)
          : h('a', { href: '/login', 'data-link': true, class: 'btn btn-sm btn-primary' }, 'Join Now')
      )
    )
  );
}

function Footer() {
  return h('footer', { class: 'site-footer' },
    h('div', { class: 'container', style: 'text-align: center;' },
      h('div', { class: 'brand', style: 'font-size: 40px; margin-bottom: 20px;' }, 'NEXA ARCADE'),
      h('p', { style: 'color: var(--text-dim); font-size: 14px;' }, '© 2026 The Future of Gaming on Cloudflare.')
    )
  );
}

function NotFound() {
  return h('div', { class: 'container section' }, h('h1', {}, '404'), h('a', { href: '/', 'data-link': true, class: 'btn' }, 'Back Home'));
}

export async function api(path, opts = {}) {
  const res = await fetch(path, {
    method: opts.method || 'GET',
    headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
    credentials: 'include',
  });
  let json = {}; try { json = await res.json(); } catch {}
  if (!res.ok) throw new Error(json.error || `Request failed (${res.status})`);
  return json;
}
