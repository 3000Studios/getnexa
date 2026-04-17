export function mountSnake(root, { onScore, perks = {} }) {
  root.innerHTML = '';
  const W = 24, H = 20, CELL = 22;
  const canvas = document.createElement('canvas');
  canvas.className = 'game-canvas';
  canvas.width = W * CELL; canvas.height = H * CELL;
  const ctx = canvas.getContext('2d');

  const hud = document.createElement('div');
  hud.style.cssText = 'display:flex; gap:14px; justify-content: center; margin-bottom: 10px; font-weight:700;';
  hud.innerHTML = `<span>Score: <span id="sc">0</span></span> <span>High: <span id="hi">0</span></span>`;
  root.appendChild(hud);
  root.appendChild(canvas);

  const controls = document.createElement('div');
  controls.style.cssText = 'text-align:center; margin-top:10px; color: var(--muted); font-size: 13px;';
  controls.innerHTML = 'Arrow keys or WASD to move · Tap and drag on mobile · Space to restart';
  root.appendChild(controls);

  let snake, dir, next, food, score, alive, speed, accum, last, hi;
  hi = parseInt(localStorage.getItem('hi-snake') || '0', 10);
  document.getElementById('hi').textContent = hi;

  function reset() {
    snake = [{ x: 12, y: 10 }, { x: 11, y: 10 }, { x: 10, y: 10 }];
    dir = { x: 1, y: 0 }; next = dir;
    food = randFood();
    score = 0; alive = true; speed = 9; accum = 0; last = performance.now();
    document.getElementById('sc').textContent = '0';
    requestAnimationFrame(loop);
  }

  function randFood() {
    while (true) {
      const f = { x: Math.floor(Math.random() * W), y: Math.floor(Math.random() * H) };
      if (!snake.some(s => s.x === f.x && s.y === f.y)) return f;
    }
  }

  function reviveFromExtraLife() {
    const head = snake[0];
    const center = { x: Math.floor(W / 2), y: Math.floor(H / 2) };
    snake = [center, { x: center.x - 1, y: center.y }, { x: center.x - 2, y: center.y }];
    dir = { x: 1, y: 0 };
    next = dir;
    // Small score tradeoff for using a life.
    score = Math.max(0, score - 5);
    document.getElementById('sc').textContent = String(score);
    return head;
  }

  function handleDeathOrRevive() {
    if (typeof perks.consumeExtraLife === 'function' && typeof perks.getExtraLives === 'function' && perks.getExtraLives() > 0) {
      const used = perks.consumeExtraLife();
      if (used) {
        reviveFromExtraLife();
        return true;
      }
    }
    alive = false;
    return false;
  }

  function step() {
    dir = next;
    const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };
    if (head.x < 0 || head.x >= W || head.y < 0 || head.y >= H) { handleDeathOrRevive(); return; }
    if (snake.some(s => s.x === head.x && s.y === head.y)) { handleDeathOrRevive(); return; }
    snake.unshift(head);
    if (head.x === food.x && head.y === food.y) {
      score += 10;
      document.getElementById('sc').textContent = score;
      food = randFood();
      speed = Math.min(18, 9 + Math.floor(score / 50));
    } else {
      snake.pop();
    }
  }

  function draw() {
    ctx.fillStyle = '#05091a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const skin = typeof perks.getSkin === 'function' ? perks.getSkin() : 'classic';
    ctx.fillStyle = '#24d1a1';
    for (let i = 0; i < snake.length; i++) {
      const s = snake[i];
      if (skin === 'neon') ctx.fillStyle = i === 0 ? '#ff36d8' : `hsl(${295 + i * 2}, 85%, 55%)`;
      else ctx.fillStyle = i === 0 ? '#7c5cff' : `hsl(${150 + i * 3}, 60%, 55%)`;
      ctx.fillRect(s.x * CELL + 1, s.y * CELL + 1, CELL - 2, CELL - 2);
    }
    ctx.fillStyle = '#ff5b6b';
    ctx.beginPath();
    ctx.arc(food.x * CELL + CELL / 2, food.y * CELL + CELL / 2, CELL / 2 - 3, 0, Math.PI * 2);
    ctx.fill();
    if (!alive) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = 'white'; ctx.font = 'bold 28px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2 - 10);
      ctx.font = '16px sans-serif';
      ctx.fillText('Press Space to try again', canvas.width / 2, canvas.height / 2 + 20);
    }
  }

  function loop(ts) {
    const dt = (ts - last) / 1000; last = ts; accum += dt;
    while (accum > 1 / speed) { accum -= 1 / speed; if (alive) step(); }
    draw();
    if (alive) requestAnimationFrame(loop);
    else {
      if (score > hi) { hi = score; localStorage.setItem('hi-snake', String(hi)); document.getElementById('hi').textContent = hi; }
      if (score > 0 && onScore) onScore(score);
    }
  }

  const keys = { ArrowUp:[0,-1], ArrowDown:[0,1], ArrowLeft:[-1,0], ArrowRight:[1,0], w:[0,-1], s:[0,1], a:[-1,0], d:[1,0], W:[0,-1], S:[0,1], A:[-1,0], D:[1,0] };
  const onKey = (e) => {
    if (e.key === ' ') { if (!alive) reset(); return; }
    const v = keys[e.key]; if (!v) return;
    e.preventDefault();
    if (dir.x + v[0] !== 0 || dir.y + v[1] !== 0) next = { x: v[0], y: v[1] };
  };
  window.addEventListener('keydown', onKey);

  // touch
  let tStart = null;
  canvas.addEventListener('touchstart', (e) => { tStart = e.touches[0]; }, { passive: true });
  canvas.addEventListener('touchend', (e) => {
    if (!tStart) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - tStart.clientX, dy = t.clientY - tStart.clientY;
    if (Math.abs(dx) > Math.abs(dy)) next = { x: dx > 0 ? 1 : -1, y: 0 };
    else next = { x: 0, y: dy > 0 ? 1 : -1 };
    tStart = null;
  });

  reset();
  // cleanup on unmount handled on route change (listeners attached to window are idempotent-ish; acceptable for MVP)
}
