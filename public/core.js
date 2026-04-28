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
  if (warp && typeof gsap !== 'undefined') {
    try {
      sfx.transition();
      gsap.set(warp, { visibility: 'visible' });
      await gsap.to(warp, { scale: 1.5, rotate: 0, opacity: 1, duration: 0.8, ease: 'expo.inOut' });
      render(currentRoutes);
      window.scrollTo(0, 0);
      await gsap.to(warp, { scale: 0, rotate: 180, opacity: 0, duration: 0.8, ease: 'expo.inOut' });
      gsap.set(warp, { visibility: 'hidden' });
    } catch (e) {
      console.error("Transition Error:", e);
      gsap.set(warp, { scale: 0, opacity: 0, visibility: 'hidden' });
      render(currentRoutes);
    }
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
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
  
  try {
    gsap.registerPlugin(ScrollTrigger);
    
    // Reveal Text
    gsap.utils.toArray('.reveal-text').forEach(el => {
      gsap.to(el, {
        opacity: 1, y: 0, duration: 1, ease: 'expo.out',
        scrollTrigger: { trigger: el, start: 'top 95%', toggleActions: 'play none none none' }
      });
    });

    // Reveal Cards
    gsap.utils.toArray('.reveal-card').forEach((el, i) => {
      gsap.to(el, {
        opacity: 1, y: 0, duration: 1, ease: 'expo.out', delay: i * 0.05,
        scrollTrigger: { trigger: el, start: 'top 95%', toggleActions: 'play none none none' }
      });
    });

    // Sticky Header Logic
    const header = document.querySelector('.site-header');
    if (header) {
      ScrollTrigger.create({
        start: 'top -50',
        onUpdate: (self) => {
          if (self.direction === 1) header.classList.add('scrolled');
          else if (self.scroll() < 50) header.classList.remove('scrolled');
        }
      });
    }
    
    // Force refresh to catch elements already in view
    ScrollTrigger.refresh();
  } catch (e) { console.error("GSAP Error:", e); }
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

export function ensureToastContainer() {
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
    wrap.appendChild(h('small', { style: 'font-size: 8px; color: var(--text-dim);' }, `${label} (${size})`));
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
  let json = {}; try { json = await res.json(); } catch {}
  if (!res.ok) throw new Error(json.error || `Request failed (${res.status})`);
  return json;
}
