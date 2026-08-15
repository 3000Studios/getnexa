import { h, api, AdSlot, state, toast, route } from '../core.js';
import { trackEvent } from '../firebase.js';
import { GAMES, findGame } from '../games/index.js';
import { setAdaptiveTheme } from '../bg-3d.js';
import { playSpecificSong } from '../music-player.js';

/* ── Category definitions ── */
const CATEGORIES = {
  all:        { label: 'All Games',       emoji: '🎮' },
  new:        { label: 'New',             emoji: '⭐' },
  action:     { label: 'Action',          emoji: '🚀', ids: ['neondrift','starblitz','fruit-slicer','whack-a-mole','emoji-catcher','insect-catch','shape-clicker','archery','balloon-pop','asteroid-dash','reaction-test','tap-tiles','breakout','snake'] },
  puzzle:     { label: 'Puzzle',          emoji: '🧩', ids: ['2048','2048-ext','tetris','tetris-ext','memory','memory-ext','minesweeper','minesweeper-ext','wordle','hangman','sudoku','tilting-maze','sliding-puzzle','hextris','tower-blocks','connect-four','number-guess','simon-says','color-flash','bubble-pop','math-blitz'] },
  arcade:     { label: 'Arcade',          emoji: '🕹️', ids: ['snake','snake-ext','breakout','breakout-ext','pong','ping-pong','flappy-bird','pacman','doodle-jump','crossy-road','candy-crush','insect-catch','shape-clicker','balloon-pop','tap-tiles','fruit-slicer'] },
  racing:     { label: 'Racing',          emoji: '🏎️', ids: ['neondrift','aviator','starblitz','asteroid-dash','flappy-bird','crossy-road','doodle-jump','balloon-pop','tap-tiles','reaction-test'] },
  strategy:   { label: 'Strategy',        emoji: '⚔️', ids: ['chess','tictactoe','tictactoe-ext','solitaire','rps','dice-roll','math-blitz','word-scramble','connect-four','number-guess','sudoku','quiz'] },
  word:       { label: 'Word & Typing',   emoji: '⌨️', ids: ['wordle','hangman','speed-typing','typing-hero','typing-pro','quiz','speak-guess','word-scramble','number-guess','math-blitz'] },
  multiplayer:{ label: 'Multiplayer',     emoji: '👥', ids: ['nexa-arena-3d','tictactoe','tictactoe-ext','pong','ping-pong','chess','connect-four','rps','wordle'] },
  card:       { label: 'Card & Board',    emoji: '🃏', ids: ['solitaire','chess','dice-roll','rps','connect-four','tictactoe','tictactoe-ext','memory','memory-ext','number-guess'] },
};

/* Color palettes for carousel rings — 10 slots */
const RING_COLORS = [
  '142,249,252','142,252,204','142,252,157','215,252,142','252,252,142',
  '252,208,142','252,142,142','252,142,239','204,142,252','142,202,252',
];

/* Cache video list once */
let _videosCache = null;
function getVideos() {
  if (_videosCache) return Promise.resolve(_videosCache);
  return fetch('/Videos/videos.json').then(r => r.json()).then(v => { _videosCache = v; return v; }).catch(() => []);
}

const GAME_PREVIEW_VIDEOS = {
  neondrift: '5165-183709910_medium.mp4',
  starblitz: '98615-649311005_medium.mp4',
  'flappy-bird': '91560-629172423_medium.mp4',
  tetris: '43245-435970515_medium.mp4',
  snake: '27775-365891076_medium.mp4',
  '2048': '141675-778335011_medium.mp4',
  chess: '37585-414024825_medium.mp4',
  wordle: '48354-453189085_medium.mp4',
};

const QUICK_PLAY_IDS = [
  'reaction-test', 'tap-tiles', 'balloon-pop', 'whack-a-mole', 'shape-clicker',
  'fruit-slicer', 'emoji-catcher', 'pong', 'ping-pong', 'rps', 'dice-roll',
];
const HIGH_SCORE_IDS = [
  '2048', 'tetris', 'snake', 'flappy-bird', 'neondrift', 'starblitz', 'breakout',
  'hextris', 'doodle-jump', 'crossy-road', 'pacman', 'tower-blocks',
];

function videoIndexForGame(game) {
  if (!game?.id) return 0;
  return Math.abs(game.id.split('').reduce((sum, ch) => sum + ch.charCodeAt(0), 0));
}

function attachPreviewVideo(videoEl, game) {
  getVideos().then((videos) => {
    if (!videoEl) return;
    const mapped = game?.id && GAME_PREVIEW_VIDEOS[game.id];
    const file = mapped || (videos.length ? videos[videoIndexForGame(game) % videos.length] : null);
    if (!file) return;
    videoEl.src = '/Videos/' + file;
    videoEl.addEventListener('loadeddata', () => { videoEl.play().catch(() => {}); }, { once: true });
  });
}

const QUICK_TAGS = [
  { key: 'all', label: 'All', type: 'category' },
  { key: 'quickplay', label: 'Quick Play', type: 'filter', match: (g) => QUICK_PLAY_IDS.includes(g.id) },
  { key: 'highscore', label: 'High Score', type: 'filter', match: (g) => HIGH_SCORE_IDS.includes(g.id) },
  { key: 'multiplayer', label: 'Multiplayer', type: 'category' },
  { key: 'new', label: 'New', type: 'category' },
  { key: 'puzzle', label: 'Puzzle', type: 'category' },
  { key: 'action', label: 'Action', type: 'category' },
];

const _lbCache = {};
function fetchTopScore(gameId) {
  if (_lbCache[gameId] !== undefined) return Promise.resolve(_lbCache[gameId]);
  return api('/api/scores/leaderboard/' + gameId).then((data) => {
    const top = data.leaderboard?.[0]?.score ?? null;
    _lbCache[gameId] = top;
    return top;
  }).catch(() => null);
}

function bindLeaderboardHover(card, game) {
  let scoreEl = null;
  const show = () => {
    if (!scoreEl) {
      scoreEl = h('div', { class: 'carousel-card-top-score' }, 'LOADING TOP SCORE…');
      card.appendChild(scoreEl);
    }
    fetchTopScore(game.id).then((top) => {
      if (!scoreEl) return;
      scoreEl.textContent = top != null
        ? '🏆 TOP SCORE: ' + Number(top).toLocaleString()
        : '🏆 BE FIRST ON THE BOARD';
    });
  };
  card.addEventListener('mouseenter', show);
  card.addEventListener('focus', show);
}

function initInfiniteCarousel(track) {
  if (!track || track.dataset.loopInit || track.scrollWidth <= track.clientWidth + 40) return;
  const originals = [...track.querySelectorAll('.carousel-card:not([data-clone])')];
  if (originals.length < 4) return;

  const gap = parseFloat(getComputedStyle(track).gap) || 16;
  const bindClone = (clone, source) => {
    clone.dataset.clone = '1';
    clone.setAttribute('aria-hidden', 'true');
    const srcId = source.dataset.gameId;
    if (srcId) {
      clone.dataset.gameId = srcId;
      clone.addEventListener('click', () => route('/games/' + srcId));
    }
  };

  originals.slice(-3).reverse().forEach((card) => {
    const clone = card.cloneNode(true);
    bindClone(clone, card);
    track.insertBefore(clone, track.firstChild);
  });
  originals.slice(0, 3).forEach((card) => {
    const clone = card.cloneNode(true);
    bindClone(clone, card);
    track.appendChild(clone);
  });

  track.dataset.loopInit = '1';
  const stride = () => originals[0].offsetWidth + gap;
  const jump = () => {
    const s = stride();
    track.scrollLeft = s * 3;
  };
  requestAnimationFrame(jump);

  let autoPaused = false;
  let dragging = false;
  let pointerStartX = 0;
  let scrollStart = 0;
  let lastTick = performance.now();
  const stopAuto = () => { autoPaused = true; };
  const resumeAuto = () => { autoPaused = false; lastTick = performance.now(); };

  track.addEventListener('pointerdown', (e) => {
    dragging = true;
    pointerStartX = e.clientX;
    scrollStart = track.scrollLeft;
    track.setPointerCapture?.(e.pointerId);
    stopAuto();
  });
  track.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const dx = e.clientX - pointerStartX;
    track.scrollLeft = scrollStart - dx * 1.8;
  });
  track.addEventListener('pointerup', () => { dragging = false; resumeAuto(); });
  track.addEventListener('pointercancel', () => { dragging = false; resumeAuto(); });
  track.addEventListener('mouseenter', stopAuto);
  track.addEventListener('mouseleave', resumeAuto);

  let ticking = false;
  track.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      const s = stride();
      const max = track.scrollWidth - track.clientWidth;
      if (track.scrollLeft <= s * 0.5) track.scrollLeft += s * originals.length;
      else if (track.scrollLeft >= max - s * 0.5) track.scrollLeft -= s * originals.length;
    });
  }, { passive: true });

  const autoStep = (now) => {
    if (!dragging && !autoPaused) {
      const elapsed = Math.min(32, now - lastTick || 16);
      lastTick = now;
      track.scrollLeft += Math.max(0.3, elapsed * 0.018);
    } else {
      lastTick = now;
    }
    requestAnimationFrame(autoStep);
  };
  requestAnimationFrame(autoStep);

}

function bindCarouselCard(card, game, video) {
  card.addEventListener('mouseenter', () => {
    video.play().catch(() => {});
    if (game.song) playSpecificSong(game.song);
    if (game.theme !== undefined) setAdaptiveTheme([0x7c5cff, 0xff5b6b, 0x24d1a1, 0xffb020, 0x00d1ff][game.theme] || 0x00f3ff);
  });
  card.addEventListener('mouseleave', () => {
    video.pause();
    setAdaptiveTheme(0x00f3ff);
  });
  card.addEventListener('focus', () => video.play().catch(() => {}));
}

function createCarouselCard(game, i, opts = {}) {
  const hero = !!opts.hero;
  const color = RING_COLORS[i % RING_COLORS.length];
  const video = document.createElement('video');
  video.className = 'carousel-card-video';
  video.muted = true;
  video.loop = true;
  video.playsInline = true;
  video.setAttribute('preload', 'metadata');
  attachPreviewVideo(video, game);

  const card = h('div', {
    class: 'carousel-card' + (hero ? ' carousel-card-hero' : ''),
    style: `--color-card:${color}`,
    role: 'button',
    tabIndex: 0,
    'data-game-id': game.id,
    'data-game-name': game.name.toLowerCase(),
    'data-game-short': (game.short || '').toLowerCase(),
    'aria-label': 'Play ' + game.name,
    onClick: () => route('/games/' + game.id),
    onKeydown: (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); route('/games/' + game.id); } }
  },
    video,
    h('div', { class: 'carousel-card-shade' }),
    game.new && h('div', { class: 'carousel-card-badge-new' }, 'NEW'),
    game.multiplayer && h('div', { class: 'carousel-card-badge-mp' }, '2P'),
    h('div', { class: 'carousel-card-body' },
      h('div', { class: 'carousel-card-emoji' }, game.emoji),
      h('div', { class: 'carousel-card-name' }, game.name),
      h('div', { class: 'carousel-card-short' }, game.short || '')
    )
  );

  bindCarouselCard(card, game, video);
  bindLeaderboardHover(card, game);
  return card;
}

function observeCarouselVideos(root) {
  if (!root || typeof IntersectionObserver === 'undefined') return;
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const video = entry.target.querySelector('.carousel-card-video');
      if (!video) return;
      if (entry.isIntersecting && entry.intersectionRatio > 0.35) video.play().catch(() => {});
      else video.pause();
    });
  }, { threshold: [0, 0.35, 0.6] });
  root.querySelectorAll('.carousel-card:not([data-clone])').forEach((card) => io.observe(card));
}

function wireCarousels(root) {
  if (!root) return;
  root.querySelectorAll('.carousel-inner').forEach((track) => {
    observeCarouselVideos(track);
    initInfiniteCarousel(track);
  });
}

function fillToEight(games, fallbackPool = []) {
  const seen = new Set();
  const out = [];
  const push = (game) => {
    if (!game || seen.has(game.id)) return;
    seen.add(game.id);
    out.push(game);
  };
  games.forEach(push);
  fallbackPool.forEach(push);
  GAMES.forEach(push);
  return out.slice(0, Math.max(8, out.length));
}

/* ── Hero featured row ── */
function HeroCarousel(games) {
  const track = h('div', { class: 'carousel-inner carousel-inner-hero', 'aria-label': 'Featured games' });
  fillToEight(games).forEach((game, i) => track.appendChild(createCarouselCard(game, i, { hero: true })));
  queueMicrotask(() => wireCarousels(track.parentElement?.parentElement || track));
  return h('section', { class: 'archive-hero', id: 'carousel-featured' },
    h('div', { class: 'archive-hero-copy' },
      h('p', { class: 'eyebrow' }, 'Swipe & Discover'),
      h('h2', { class: 'archive-hero-title text-3d' }, '⚡ Featured Releases'),
      h('p', { class: 'archive-hero-sub' }, 'Swipe left or right — each card plays a live video preview. Tap to jump in.')
    ),
    h('div', { class: 'carousel-wrapper carousel-wrapper-hero' }, track)
  );
}

/* ── Horizontal touch carousel per category ── */
function GameCarousel(games, label, emoji, catKey) {
  const track = h('div', { class: 'carousel-inner', 'aria-label': label + ' games' });
  fillToEight(games).forEach((game, i) => track.appendChild(createCarouselCard(game, i)));
  queueMicrotask(() => wireCarousels(track.parentElement?.parentElement || track));

  return h('div', { class: 'carousel-section', id: 'carousel-' + catKey, 'data-cat': catKey },
    h('div', { class: 'carousel-section-hdr' },
      h('span', {}, emoji + '  ' + label),
      h('em', {}, Math.max(8, games.length) + ' games · swipe →')
    ),
    h('div', { class: 'carousel-wrapper' }, track)
  );
}

/* ── GameCard (used in search/grid mode) ── */
const GAME_COLORS = [
  ['#1a0a3a','#0a0a2a','#7c3aed'],['#0a1a2e','#0a0a1a','#00e5ff'],
  ['#0a1a0a','#0a1a10','#10b981'],['#1a1a0a','#1a0f0a','#f59e0b'],
  ['#2a0a0a','#1a0a0a','#ef4444'],['#0a0a2a','#10082a','#a855f7'],
  ['#0a1a1a','#0a1210','#06b6d4'],['#1a0a10','#2a0a18','#f0abfc'],
];
export function GameCard(game, index = 0) {
  const [c1, c2, glow] = GAME_COLORS[index % GAME_COLORS.length];
  const video = document.createElement('video');
  video.className = 'game-card-video'; video.muted = true; video.loop = true; video.playsInline = true;
  attachPreviewVideo(video, game);

  const badge = game.new  ? h('div', { class: 'game-card-badge new' }, 'NEW')
    : game.multiplayer    ? h('div', { class: 'game-card-badge mp' }, '2P')
    : null;

  const card = h('div', {
    class: 'game-card reveal-card',
    style: '--c1:' + c1 + ';--c2:' + c2 + ';--glow-color:' + glow,
    role: 'button', tabIndex: 0, 'aria-label': 'Play ' + game.name,
    onClick: () => { card.classList.add('spin-active'); setTimeout(() => route('/games/' + game.id), 300); },
    onKeydown: (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); route('/games/' + game.id); } }
  },
    h('div', { class: 'game-card-bg' }), video, badge,
    h('div', { class: 'player-count' }, h('span', { class: 'pulse-dot' }), 'LIVE'),
    h('div', { class: 'game-card-glow' }),
    h('div', { class: 'game-card-art' }, game.emoji),
    h('div', { class: 'game-card-info' }, h('h3', {}, game.name), h('p', {}, game.short))
  );
  const lbEl = h('div', { class: 'game-card-lb' }, '');
  card.querySelector('.game-card-info')?.appendChild(lbEl);
  card.addEventListener('mouseenter', () => {
    video.play().catch(() => {});
    if (game.theme !== undefined) setAdaptiveTheme([0x7c5cff,0xff5b6b,0x24d1a1,0xffb020,0x00d1ff][game.theme] || 0x00f3ff);
    if (game.song) playSpecificSong(game.song);
    fetchTopScore(game.id).then((top) => {
      lbEl.textContent = top != null ? '🏆 Top: ' + Number(top).toLocaleString() : '🏆 Be first!';
    });
  });
  card.addEventListener('mouseleave', () => { video.pause(); setAdaptiveTheme(0x00f3ff); lbEl.textContent = ''; });
  return card;
}

/* ── Activity ticker ── */
function GlobalActivityTicker() {
  const content = h('span', { class: 'ticker-content' }, '⚡ NEXA GRID ACTIVE — MISSIONS IN PROGRESS...');
  const el = h('div', { class: 'activity-ticker' }, h('div', { class: 'container' }, content));
  const update = () => {
    api('/api/stats/real-time').then(data => {
      if (!data.activity?.length) return;
      content.innerHTML = data.activity.map(a =>
        '⚡ <strong>' + a.username + '</strong> scored ' + Number(a.score).toLocaleString() + ' in ' + a.game_id
      ).join(' &nbsp;•&nbsp; ');
    }).catch(() => {});
  };
  setInterval(update, 30000); update();
  return el;
}

/* ── Games Page ── */
export function GamesPage({ query }) {
  let currentCat = query?.get('cat') || 'all';
  let searchQ = query?.get('q') || '';

  /* ------ search grid ------ */
  const searchGrid = h('div', { class: 'games-grid-search' });

  function matchGameQuery(g, q) {
    const hay = (g.name + ' ' + g.short + ' ' + g.id).toLowerCase();
    return hay.includes(q);
  }

  function updateSearchGrid(q, games = null) {
    searchGrid.innerHTML = '';
    const filtered = games || GAMES.filter((g) => matchGameQuery(g, q));
    filtered.forEach((g, i) => searchGrid.appendChild(GameCard(g, i)));
    // GSAP animate if available
    if (typeof gsap !== 'undefined') {
      try {
        gsap.utils.toArray(searchGrid.children).forEach((el, i) =>
          gsap.fromTo(el, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.4, ease: 'expo.out', delay: i * 0.025 })
        );
      } catch {}
    } else {
      Array.from(searchGrid.children).forEach(el => { el.style.opacity = '1'; el.style.transform = 'none'; });
    }
  }

  /* ------ build carousels ------ */
  function buildCarousels(cat) {
    const stack = h('div', { class: 'carousels-stack' });

    const groups = cat === 'all'
      ? [
          { key: 'new',        label: 'New Releases', emoji: '⭐', games: GAMES.filter(g => g.new) },
          { key: 'action',     label: 'Action',       emoji: '🚀', games: GAMES.filter(g => CATEGORIES.action.ids?.includes(g.id)) },
          { key: 'puzzle',     label: 'Puzzle',        emoji: '🧩', games: GAMES.filter(g => CATEGORIES.puzzle.ids?.includes(g.id)) },
          { key: 'arcade',     label: 'Arcade',        emoji: '🕹️', games: GAMES.filter(g => CATEGORIES.arcade.ids?.includes(g.id)) },
          { key: 'strategy',   label: 'Strategy',      emoji: '⚔️', games: GAMES.filter(g => CATEGORIES.strategy.ids?.includes(g.id)) },
          { key: 'word',       label: 'Word & Typing', emoji: '⌨️', games: GAMES.filter(g => CATEGORIES.word.ids?.includes(g.id)) },
          { key: 'card',       label: 'Card & Board',  emoji: '🃏', games: GAMES.filter(g => CATEGORIES.card.ids?.includes(g.id)) },
          { key: 'multiplayer',label: 'Multiplayer',   emoji: '👥', games: GAMES.filter(g => g.multiplayer) },
        ]
      : cat === 'new'
        ? [{ key: 'new', label: 'New Releases', emoji: '⭐', games: GAMES.filter(g => g.new) }]
        : cat === 'multiplayer'
          ? [{ key: 'multiplayer', label: 'Multiplayer', emoji: '👥', games: GAMES.filter(g => g.multiplayer) }]
          : [{ key: cat, label: CATEGORIES[cat]?.label || cat, emoji: CATEGORIES[cat]?.emoji || '🎮',
               games: CATEGORIES[cat]?.ids ? GAMES.filter(g => CATEGORIES[cat].ids.includes(g.id)) : GAMES }];

    groups.filter(g => g.games.length > 0).forEach(g => {
      stack.appendChild(GameCarousel(g.games, g.label, g.emoji, g.key));
    });
    return stack;
  }

  const featuredGames = GAMES.filter(g => g.new).concat(
    GAMES.filter(g => !g.new && ['neondrift', 'starblitz', 'flappy-bird', 'tetris', 'chess', 'wordle'].includes(g.id))
  ).filter((g, i, arr) => arr.findIndex(x => x.id === g.id) === i).slice(0, 8);

  /* ------ page scaffold ------ */
  const carouselWrap = h('div', { class: 'archive-carousels' });
  if (currentCat === 'all' && !searchQ) carouselWrap.appendChild(HeroCarousel(featuredGames));
  carouselWrap.appendChild(buildCarousels(currentCat));

  const pageWrap = h('div', { class: 'archive-page no-search' });

  const countEl = h('span', { class: 'archive-count' }, GAMES.length + ' games');

  function setSearchMode(q, games = null) {
    searchQ = q;
    if (q || games) {
      pageWrap.classList.add('search-active');
      pageWrap.classList.remove('no-search');
      updateSearchGrid(q, games);
      const n = games ? games.length : GAMES.filter((g) => matchGameQuery(g, q)).length;
      countEl.textContent = n + ' match' + (n === 1 ? '' : 'es');
    } else {
      pageWrap.classList.remove('search-active');
      pageWrap.classList.add('no-search');
      countEl.textContent = GAMES.length + ' games';
    }
  }

  function setCategory(key, btn) {
    pills.querySelectorAll('.cat-pill').forEach(p => p.classList.remove('active'));
    tagRow.querySelectorAll('.quick-tag').forEach(t => t.classList.remove('active'));
    if (btn) btn.classList.add('active');
    currentCat = key;
    searchInput.value = '';
    setSearchMode('');
    carouselWrap.innerHTML = '';
    if (key === 'all') carouselWrap.appendChild(HeroCarousel(featuredGames));
    carouselWrap.appendChild(buildCarousels(key));
    queueMicrotask(() => wireCarousels(carouselWrap));
  }

  function scrollToCategory(key) {
    const el = pageWrap.querySelector('#carousel-' + key) || pageWrap.querySelector('[data-cat="' + key + '"]');
    if (!el) return false;
    const top = el.getBoundingClientRect().top + window.scrollY - (parseInt(getComputedStyle(document.documentElement).getPropertyValue('--header-h')) || 74) - 56;
    window.scrollTo({ top, behavior: 'smooth' });
    pills.querySelectorAll('.cat-pill').forEach(p => p.classList.remove('active'));
    const pill = pills.querySelector('[data-cat="' + key + '"]');
    if (pill) pill.classList.add('active');
    return true;
  }

  function applyQuickTag(tag, btn) {
    searchInput.value = '';
    pills.querySelectorAll('.cat-pill').forEach(p => p.classList.remove('active'));
    tagRow.querySelectorAll('.quick-tag').forEach(t => t.classList.remove('active'));
    if (btn) btn.classList.add('active');

    if (tag.type === 'filter' && tag.match) {
      currentCat = 'all';
      const matched = GAMES.filter(tag.match);
      setSearchMode('', matched);
      return;
    }
    if (tag.key === 'all') {
      setCategory('all', pills.querySelector('[data-cat="all"]'));
      return;
    }
    setCategory(tag.key, pills.querySelector('[data-cat="' + tag.key + '"]'));
  }

  const searchInput = h('input', {
    type: 'search',
    class: 'search archive-search',
    placeholder: 'Search ' + GAMES.length + '+ games instantly…',
    value: searchQ,
    'aria-label': 'Search games',
    onInput: (e) => {
      const q = e.target.value.toLowerCase().trim();
      if (q) {
        tagRow.querySelectorAll('.quick-tag').forEach(t => t.classList.remove('active'));
        pills.querySelectorAll('.cat-pill').forEach(p => p.classList.remove('active'));
      }
      setSearchMode(q);
    }
  });

  const pills = h('div', { class: 'cat-pills', role: 'tablist', 'aria-label': 'Game categories' },
    ...Object.entries(CATEGORIES).map(([key, cat]) =>
      h('button', {
        type: 'button',
        class: 'cat-pill' + (currentCat === key && !searchQ ? ' active' : ''),
        'data-cat': key,
        role: 'tab',
        'aria-selected': currentCat === key && !searchQ ? 'true' : 'false',
        onClick: (e) => {
          tagRow.querySelectorAll('.quick-tag').forEach(t => t.classList.remove('active'));
          if (key !== 'all' && currentCat === 'all' && !searchQ && scrollToCategory(key)) return;
          setCategory(key, e.currentTarget);
        }
      }, cat.emoji + ' ' + cat.label)
    )
  );

  const tagRow = h('div', { class: 'quick-tags', role: 'group', 'aria-label': 'Quick filters' },
    ...QUICK_TAGS.map((tag) =>
      h('button', {
        type: 'button',
        class: 'quick-tag' + (currentCat === tag.key && !searchQ ? ' active' : ''),
        onClick: (e) => applyQuickTag(tag, e.currentTarget)
      }, tag.label)
    )
  );

  if (searchQ) {
    pageWrap.classList.add('search-active');
    pageWrap.classList.remove('no-search');
    updateSearchGrid(searchQ);
  }

  pageWrap.appendChild(GlobalActivityTicker());
  pageWrap.appendChild(h('div', { class: 'container section archive-section' },
    h('header', { class: 'archive-header' },
      h('div', { class: 'archive-header-copy' },
        h('div', { class: 'eyebrow' }, 'The Archive'),
        h('h1', { class: 'archive-title text-3d' }, 'Game Vault'),
        countEl
      ),
      h('div', { class: 'archive-search-block' },
        h('div', { class: 'search-wrap' }, searchInput),
        tagRow
      )
    ),
    h('div', { class: 'archive-nav-sticky' }, pills),
    AdSlot('inContent'),
    carouselWrap,
    searchGrid
  ));

  queueMicrotask(() => wireCarousels(carouselWrap));
  return pageWrap;
}

/* ── Loot Box ── */
function LootBoxModal(onClose) {
  const rewards = [
    { id: 'skin_neon', name: 'NEON GHOST SKIN', icon: '👤', rarity: 'RARE' },
    { id: 'skin_gold', name: 'GOLDEN VANGUARD', icon: '🛡️', rarity: 'EPIC' },
    { id: 'rank_boost', name: '2X RANK BOOST', icon: '⚡', rarity: 'UNCOMMON' },
    { id: 'custom_crosshair', name: 'PRECISION CORE', icon: '🎯', rarity: 'RARE' },
  ];
  const reward = rewards[Math.floor(Math.random() * rewards.length)];
  const boxRef = {};
  const el = h('div', { class: 'loot-overlay' },
    h('div', { class: 'loot-container', ref: (e) => boxRef.el = e },
      h('div', { class: 'loot-box-visual' }, '🎁'),
      h('h2', { style: 'font-family:var(--font-display);margin-bottom:8px;' }, 'NEURAL CACHE'),
      h('p', { style: 'color:var(--text-dim);margin-bottom:28px;font-size:14px;' }, 'Decrypting tactical assets...'),
      h('button', { class: 'btn btn-primary btn-block', onClick: (ev) => {
        const btn = ev.target; btn.disabled = true; btn.textContent = 'DECRYPTING...';
        if (typeof gsap !== 'undefined' && boxRef.el) gsap.to(boxRef.el, { x: 8, repeat: 8, duration: 0.06, yoyo: true });
        api('/api/inventory/add', { method: 'POST', body: { item_id: reward.id } }).catch(() => {});
        setTimeout(() => {
          if (!boxRef.el) return;
          boxRef.el.innerHTML = '';
          const reveal = h('div', { class: 'reward-reveal' },
            h('div', { class: 'reward-icon' }, reward.icon),
            h('div', { class: 'reward-rarity' }, reward.rarity),
            h('h3', { style: 'font-family:var(--font-display);' }, reward.name),
            h('p', { style: 'color:var(--cyan);margin-top:8px;font-size:13px;' }, 'ASSET SYNCHRONIZED'),
            h('button', { class: 'btn btn-block', style: 'margin-top:20px;', onClick: onClose }, 'Accept')
          );
          boxRef.el.appendChild(reveal);
          if (typeof gsap !== 'undefined') gsap.from(reveal, { scale: 0.5, opacity: 0, duration: 0.5, ease: 'back.out' });
        }, 1000);
      }}, 'INITIATE DECRYPTION')
    )
  );
  return el;
}

/* ── Virtual D-Pad ──
   Native games listen on the parent window; external games run inside a
   same-origin iframe and only see events fired into THEIR window/document.
   So we forward every synthetic key to both targets, with real keyCodes
   (many older games still read e.keyCode / e.which). */
const KEY_CODES = { ArrowUp: 38, ArrowDown: 40, ArrowLeft: 37, ArrowRight: 39, ' ': 32 };
const KEY_NAMES = { ArrowUp: 'ArrowUp', ArrowDown: 'ArrowDown', ArrowLeft: 'ArrowLeft', ArrowRight: 'ArrowRight', ' ': 'Space' };

function makeKeyEvent(type, key) {
  const code = KEY_CODES[key] || 0;
  const ev = new KeyboardEvent(type, { key, code: KEY_NAMES[key] || key, bubbles: true, cancelable: true });
  // KeyboardEvent ctor ignores keyCode/which — force them for legacy games
  try { Object.defineProperty(ev, 'keyCode', { get: () => code }); Object.defineProperty(ev, 'which', { get: () => code }); } catch {}
  return ev;
}

export function dispatchGameKey(key, type, stageEl) {
  window.dispatchEvent(makeKeyEvent(type, key));
  document.dispatchEvent(makeKeyEvent(type, key));
  const ifr = stageEl?.querySelector('iframe') || document.querySelector('.game-stage iframe');
  if (ifr && ifr.contentWindow) {
    try {
      ifr.contentWindow.postMessage({ type: 'nexa-key', key, eventType: type }, '*');
      ifr.contentWindow.dispatchEvent(makeKeyEvent(type, key));
      const doc = ifr.contentDocument;
      if (doc) (doc.activeElement || doc.body || doc).dispatchEvent(makeKeyEvent(type, key));
    } catch {}
  }
}

function getFullscreenElement() {
  return document.fullscreenElement || document.webkitFullscreenElement || null;
}

function requestGameFullscreen(el) {
  if (!el) return Promise.reject();
  const req = el.requestFullscreen || el.webkitRequestFullscreen || el.msRequestFullscreen;
  return req ? Promise.resolve(req.call(el)) : Promise.reject();
}

function exitGameFullscreen() {
  const exit = document.exitFullscreen || document.webkitExitFullscreen || document.msExitFullscreen;
  return exit ? Promise.resolve(exit.call(document)) : Promise.reject();
}

function MultiplayerPanel(game) {
  const defaultRoom = new URLSearchParams(location.search).get('room') || 'lobby';
  const status = h('div', { class: 'mp-status', role: 'status' }, 'Offline');
  const players = h('div', { class: 'mp-players' }, 'No players connected');
  const ready = h('button', { class: 'btn btn-sm', disabled: true }, 'Ready Up');
  const copy = h('button', { class: 'btn btn-sm' }, 'Copy Invite');
  const room = h('input', { class: 'form-input', value: defaultRoom, maxlength: 32, 'aria-label': 'Multiplayer room code' });
  let socket = null;
  let isReady = false;
  const roomCode = () => (room.value.toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 32) || 'lobby');
  const connect = () => {
    socket?.close();
    const code = roomCode(); room.value = code;
    const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
    socket = new WebSocket(`${protocol}//${location.host}/api/mp/${encodeURIComponent(game.id)}/${encodeURIComponent(code)}`);
    status.textContent = 'Connecting…';
    socket.addEventListener('open', () => { status.textContent = 'Live room: ' + code; ready.disabled = false; });
    socket.addEventListener('message', (event) => {
      let msg; try { msg = JSON.parse(event.data); } catch { return; }
      if (msg.players) players.textContent = msg.players.length ? msg.players.map(p => `${p.ready ? '✓ ' : ''}${p.username}`).join(' · ') : 'Waiting for players';
      if (msg.type === 'start') status.textContent = 'Match started';
      if (msg.type === 'reset') { isReady = false; ready.textContent = 'Ready Up'; }
    });
    socket.addEventListener('close', () => { status.textContent = 'Disconnected'; ready.disabled = true; });
    socket.addEventListener('error', () => { status.textContent = 'Room connection failed'; });
  };
  ready.addEventListener('click', () => {
    isReady = !isReady; ready.textContent = isReady ? 'Cancel Ready' : 'Ready Up';
    if (socket?.readyState === WebSocket.OPEN) socket.send(JSON.stringify({ type: 'ready', ready: isReady }));
  });
  copy.addEventListener('click', async () => {
    const url = `${location.origin}/games/${game.id}?room=${encodeURIComponent(roomCode())}`;
    await navigator.clipboard.writeText(url); toast('Multiplayer invite copied', 'success');
  });
  const join = h('button', { class: 'btn btn-primary btn-sm', onClick: connect }, 'Join Room');
  const panel = h('div', { class: 'panel multiplayer-panel' },
    h('h3', {}, 'Multiplayer Room'),
    h('p', { class: 'mp-copy' }, 'Share a room code, connect, then ready up together.'),
    h('div', { class: 'mp-room-row' }, room, join), status, players,
    h('div', { class: 'mp-actions' }, ready, copy)
  );
  queueMicrotask(connect);
  const observer = new MutationObserver(() => { if (!document.body.contains(panel)) { socket?.close(); observer.disconnect(); } });
  observer.observe(document.body, { childList: true, subtree: true });
  return panel;
}

function initGameFullscreen(shellEl, buttons) {
  const btns = (buttons || []).filter(Boolean);
  if (!shellEl || !btns.length) return;
  const notifyIframeResize = () => {
    const ifr = shellEl.querySelector('iframe');
    if (!ifr?.contentWindow) return;
    try { ifr.contentWindow.postMessage({ type: 'nexa-resize' }, '*'); } catch {}
  };
  const sync = () => {
    const on = getFullscreenElement() === shellEl;
    btns.forEach((btn) => {
      btn.classList.toggle('is-fullscreen', on);
      btn.setAttribute('aria-label', on ? 'Exit fullscreen' : 'Enter fullscreen');
      btn.setAttribute('title', on ? 'Exit fullscreen' : 'Fullscreen');
      btn.textContent = on ? 'Exit Fullscreen' : 'Fullscreen';
    });
    shellEl.classList.toggle('is-fullscreen', on);
    shellEl.querySelector('.game-stage')?.focus();
    requestAnimationFrame(() => {
      notifyIframeResize();
      setTimeout(notifyIframeResize, 120);
    });
  };
  const toggle = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (getFullscreenElement() === shellEl) exitGameFullscreen().catch(() => {});
    else requestGameFullscreen(shellEl).catch(() => toast('Fullscreen not supported on this device', 'error'));
  };
  btns.forEach((btn) => btn.addEventListener('click', toggle));
  document.addEventListener('fullscreenchange', sync);
  document.addEventListener('webkitfullscreenchange', sync);
  sync();
}

function VirtualControls() {
  const btn = (cls, label, key, glyph) => h('button', {
    class: 'v-btn ' + cls, 'aria-label': label,
    onPointerDown: (e) => { e.preventDefault(); dispatchGameKey(key, 'keydown'); },
    onPointerUp: (e) => { e.preventDefault(); dispatchGameKey(key, 'keyup'); },
    onContextMenu: (e) => e.preventDefault(),
  }, glyph);
  return h('div', { class: 'virtual-controls', 'aria-label': 'Game controls', role: 'group' },
    h('div', { class: 'dpad' },
      btn('v-up', 'Up', 'ArrowUp', '▲'),
      btn('v-left', 'Left', 'ArrowLeft', '◀'),
      btn('v-right', 'Right', 'ArrowRight', '▶'),
      btn('v-down', 'Down', 'ArrowDown', '▼'),
    ),
    h('div', { class: 'action-btns' },
      btn('v-action', 'Action', ' ', '⚡')
    )
  );
}

/* ── Game Page ── */
export function GamePage({ params }) {
  const game = findGame(params.id);
  if (!game) {
    return h('div', { class: 'container section', style: 'text-align:center;padding-top:160px;' },
      h('h1', { style: 'font-family:var(--font-display);font-size:40px;margin-bottom:16px;' }, 'Game Not Found'),
      h('a', { href: '/games', 'data-link': true, class: 'btn btn-primary' }, '← All Games')
    );
  }

  const stageRef = {};
  const shellRef = {};
  const fsBtnRef = {};
  const optionsBtnRef = {};
  const optionsPanelRef = {};
  const uiPrefs = {
    fullUi: localStorage.getItem('nexa_full_ui') !== '0',
    sound: localStorage.getItem('nexa_game_sound') !== '0',
    controls: localStorage.getItem('nexa_game_controls') || 'auto',
  };
  const syncUiPrefs = () => {
    if (!page) return;
    page.classList.toggle('game-compact', !uiPrefs.fullUi);
    localStorage.setItem('nexa_full_ui', uiPrefs.fullUi ? '1' : '0');
    localStorage.setItem('nexa_game_sound', uiPrefs.sound ? '1' : '0');
    localStorage.setItem('nexa_game_controls', uiPrefs.controls);
    if (!uiPrefs.sound) {
      const iframe = shellRef.el?.querySelector('iframe');
      try { iframe?.contentWindow?.postMessage({ type: 'nexa-mute', muted: true }, '*'); } catch {}
    }
  };
  const loader = h('div', { class: 'game-loader-overlay' },
    h('div', { class: 'loader-name' }, (state.user?.username || 'ANONYMOUS').toUpperCase()),
    h('div', { class: 'loader-ready' }, 'LOADING ' + game.name.toUpperCase() + '...'),
    h('div', { class: 'loader-bar' })
  );
  document.body.appendChild(loader);

  const pauseOverlay = h('div', { class: 'pause-overlay', style: 'display:none;' },
    h('div', { class: 'pause-menu' },
      h('h2', {}, 'PAUSED'),
      h('button', { class: 'btn btn-primary btn-block', style: 'margin-bottom:12px;',
        onClick: () => { pauseOverlay.style.display = 'none'; stageRef.el?.focus(); }
      }, 'Resume'),
      h('button', { class: 'btn btn-block', onClick: () => route('/games') }, 'Quit to Menu')
    )
  );

  const lbPanel = h('div', { class: 'panel' },
    h('h3', {}, 'Top Scores'),
    h('div', { id: 'lb-list' }, h('div', { style: 'color:var(--text-muted);font-size:13px;' }, 'Loading...'))
  );
  api('/api/scores/leaderboard/' + game.id).then(data => {
    const lb = lbPanel.querySelector('#lb-list');
    lb.innerHTML = '';
    if (!data.leaderboard?.length) { lb.innerHTML = '<div style="color:var(--text-muted);font-size:13px;">Be the first!</div>'; return; }
    data.leaderboard.slice(0, 8).forEach((row, i) => {
      lb.appendChild(h('div', { class: 'lb-entry' },
        h('div', { class: 'lb-rank' }, '#' + (i + 1)),
        h('div', { class: 'lb-user' }, row.display_name || row.username),
        h('div', { class: 'lb-score' }, Number(row.best_score).toLocaleString())
      ));
    });
  }).catch(() => {});

  const page = h('div', { class: 'container section' },
    h('div', { style: 'display:flex;justify-content:space-between;align-items:center;margin-bottom:28px;flex-wrap:wrap;gap:12px;' },
      h('div', {},
        h('a', { href: '/games', 'data-link': true, class: 'game-back-link', style: 'color:var(--text-muted);font-size:13px;font-family:var(--font-display);letter-spacing:.1em;display:block;margin-bottom:8px;' }, '← GAMES'),
        h('h1', { style: 'font-family:var(--font-display);font-size:28px;font-weight:800;' }, game.emoji + ' ' + game.name),
        h('p', { style: 'color:var(--text-dim);font-size:14px;margin-top:4px;' }, game.description || game.short)
      ),
      h('div', { style: 'display:flex;gap:8px;flex-wrap:wrap;' },
        h('button', { class: 'btn btn-sm', 'aria-label': 'Share game',
          onClick: () => {
            const text = 'Playing ' + game.name + ' on NEXA ARCADE! 🎮';
            if (navigator.share) navigator.share({ title: 'NEXA ARCADE', text, url: location.href });
            else { navigator.clipboard.writeText(text + ' ' + location.href); toast('Link copied!', 'success'); }
          }
        }, '🔗 Share'),
        h('button', { class: 'btn btn-sm game-settings-btn', ref: (el) => optionsBtnRef.el = el, 'aria-label': 'Game options', title: 'Game options' }, '⚙ Options'),
        h('button', { class: 'btn btn-sm game-fs-btn', ref: (el) => fsBtnRef.header = el, 'aria-label': 'Enter fullscreen', title: 'Fullscreen' }, 'Fullscreen'),
        h('button', { class: 'btn btn-sm', onClick: () => { pauseOverlay.style.display = pauseOverlay.style.display === 'flex' ? 'none' : 'flex'; } }, '⏸'),
        h('a', { href: '/games', 'data-link': true, class: 'btn btn-sm' }, '✕ Exit')
      )
    ),

    h('div', { class: 'game-wrap' },
      h('div', { class: 'game-stage-shell', ref: (el) => shellRef.el = el },
        h('button', { class: 'game-fs-overlay-btn', ref: (el) => fsBtnRef.overlay = el, 'aria-label': 'Enter fullscreen', title: 'Fullscreen' }, 'Fullscreen'),
        h('button', {
          class: 'game-fs-overlay-btn game-options-float',
          ref: (el) => optionsBtnRef.overlay = el,
          'aria-label': 'Game options',
          title: 'Game options'
        }, '⚙'),
        h('div', { class: 'game-stage', ref: (el) => stageRef.el = el, tabIndex: 0, 'aria-label': game.name + ' game area' })
      ),
      h('div', {},
        lbPanel,
        game.multiplayer && MultiplayerPanel(game),
        h('div', { class: 'panel' },
          h('h3', {}, 'Controls'),
          h('div', { style: 'margin-top:4px;' },
            h('label', { class: 'v-option', style: 'margin-bottom:8px;' },
              h('input', { type: 'radio', name: 'ctrl', checked: uiPrefs.controls === 'auto',
                onChange: () => { uiPrefs.controls = 'auto'; state.forceVirtual = false; syncUiPrefs(); route(location.pathname, false); }
              }), ' AI Auto-Detect'
            ),
            h('label', { class: 'v-option', style: 'margin-bottom:8px;' },
              h('input', { type: 'radio', name: 'ctrl', checked: uiPrefs.controls === 'touch',
                onChange: () => { uiPrefs.controls = 'touch'; state.forceVirtual = true; syncUiPrefs(); route(location.pathname, false); }
              }), ' Swipe / Tap Controls'
            ),
            h('label', { class: 'v-option', style: 'margin-bottom:8px;' },
              h('input', { type: 'radio', name: 'ctrl', checked: uiPrefs.controls === 'keyboard',
                onChange: () => { uiPrefs.controls = 'keyboard'; state.forceVirtual = false; syncUiPrefs(); route(location.pathname, false); }
              }), ' Keyboard + Mouse'
            ),
            h('div', { style: 'font-size:11px;color:var(--cyan);margin-top:8px;font-family:var(--font-display);letter-spacing:.1em;' },
              state.hasGamepad ? '✅ GAMEPAD LINKED' : '⌨️ DEVICE READY'
            )
          )
        ),
        h('div', { class: 'panel', ref: (el) => optionsPanelRef.el = el, style: 'display:none;' },
          h('h3', {}, 'Game Options'),
          h('label', { class: 'v-option', style: 'margin-bottom:8px;' },
            h('input', { type: 'checkbox', checked: uiPrefs.fullUi, onChange: (e) => { uiPrefs.fullUi = e.target.checked; syncUiPrefs(); } }),
            ' Enable Full Game UI'
          ),
          h('label', { class: 'v-option', style: 'margin-bottom:8px;' },
            h('input', { type: 'checkbox', checked: uiPrefs.sound, onChange: (e) => { uiPrefs.sound = e.target.checked; syncUiPrefs(); } }),
            ' Sound'
          ),
          h('label', { class: 'v-option', style: 'margin-bottom:8px;' },
            h('input', { type: 'checkbox', checked: state.forceVirtual, onChange: (e) => { state.forceVirtual = e.target.checked; syncUiPrefs(); route(location.pathname, false); } }),
            ' Force Touch Controls'
          )
        ),
        state.user && h('div', { class: 'panel' },
          h('h3', {}, 'Your Best'),
          h('div', { id: 'my-best', style: 'font-family:var(--font-display);font-size:24px;font-weight:700;color:var(--gold);' }, '—')
        )
      )
    ),

    (state.isTouch || state.forceVirtual) && VirtualControls(),
    pauseOverlay,
    AdSlot('inContent')
  );

  if (state.user) {
    api('/api/scores/me/' + game.id).then(r => {
      const el = page.querySelector('#my-best');
      if (el) el.textContent = Number(r.best || 0).toLocaleString();
    }).catch(() => {});
  }

  queueMicrotask(() => {
    syncUiPrefs();
    initGameFullscreen(shellRef.el, [fsBtnRef.header, fsBtnRef.overlay]);
    const toggleOptions = () => {
      const on = optionsPanelRef.el.style.display === 'block';
      optionsPanelRef.el.style.display = on ? 'none' : 'block';
    };
    optionsBtnRef.el?.addEventListener('click', toggleOptions);
    optionsBtnRef.overlay?.addEventListener('click', toggleOptions);
    trackEvent('game_start', { game_id: game.id, game_name: game.name });
    setTimeout(() => { loader.classList.add('fade-out'); setTimeout(() => loader.remove(), 600); }, 1800);

    let heartbeatInt = setInterval(() => {
      if (!state.user) return;
      api('/api/arena/heartbeat', { method: 'POST', body: { game_id: game.id, score: state.currentScore || 0 } }).catch(() => {});
    }, 5000);

    // Stop arrow keys / space from scrolling the page while playing.
    // Self-detaches once the game stage leaves the DOM (SPA nav uses pushState,
    // so popstate alone is not reliable here).
    const SCROLL_KEYS = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', 'PageUp', 'PageDown'];
    const FORWARD_KEYS = [' ', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
    const blockScroll = (e) => {
      if (!document.body.contains(stageRef.el)) {
        window.removeEventListener('keydown', blockScroll);
        clearInterval(heartbeatInt);
        return;
      }
      const tag = (e.target && e.target.tagName) || '';
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (!SCROLL_KEYS.includes(e.key)) return;
      e.preventDefault();
      if (stageRef.el?.querySelector('iframe') && FORWARD_KEYS.includes(e.key)) {
        dispatchGameKey(e.key, 'keydown', stageRef.el);
      }
    };
    window.addEventListener('keydown', blockScroll, { passive: false });
    stageRef.el?.addEventListener('keydown', (e) => {
      const tag = (e.target && e.target.tagName) || '';
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (!FORWARD_KEYS.includes(e.key)) return;
      e.preventDefault();
      dispatchGameKey(e.key, 'keydown', stageRef.el);
    });
    window.addEventListener('popstate', () => {
      clearInterval(heartbeatInt);
      window.removeEventListener('keydown', blockScroll);
    }, { once: true });

    const onGameMessage = (e) => {
      if (!document.body.contains(stageRef.el)) {
        window.removeEventListener('message', onGameMessage);
        return;
      }
      if (!e.data || e.data.type !== 'nexa-score') return;
      if (e.data.gameId !== game.id) return;
      const score = Number(e.data.score) || 0;
      state.currentScore = score;
      if (state.user) {
        api('/api/scores', { method: 'POST', body: { game_id: game.id, score } }).catch(() => {});
      }
    };
    window.addEventListener('message', onGameMessage);

    game.mount(stageRef.el, {
      onScore: (score) => {
        state.currentScore = score;
        if (state.user) {
          api('/api/scores', { method: 'POST', body: { game_id: game.id, score } }).then(res => {
            const el = page.querySelector('#my-best');
            if (el && score > parseInt(el.textContent.replace(/,/g, '') || '0', 10)) el.textContent = Number(score).toLocaleString();
          }).catch(() => {});
        }
        if (score > 100 && Math.random() < 0.15) {
          const loot = LootBoxModal(() => loot.remove());
          document.body.appendChild(loot);
        }
      },
      onSave: (data) => {
        if (!state.user) return;
        const sync = h('div', { class: 'sync-status' }, 'SYNCING...');
        document.body.appendChild(sync);
        api('/api/saves/' + game.id, { method: 'POST', body: { data } })
          .then(() => { sync.textContent = 'SYNCED ✓'; })
          .catch(() => { sync.textContent = 'SYNC FAILED'; })
          .finally(() => setTimeout(() => sync.remove(), 1500));
      },
      onLoad: () => {
        if (!state.user) return Promise.resolve(null);
        return api('/api/saves/' + game.id).then(r => r.save).catch(() => null);
      },
      user: state.user
    });
    stageRef.el?.focus();
  });

  return page;
}
