export function mountBreakout(root, { onScore }) {
  root.innerHTML = '';
  const W = 560, H = 420;
  const canvas = document.createElement('canvas');
  canvas.className = 'game-canvas';
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');
  const hud = document.createElement('div');
  hud.style.cssText = 'display:flex; justify-content:center; gap:14px; margin-bottom:10px; font-weight:700;';
  hud.innerHTML = 'Score: <span id="sc">0</span> · Lives: <span id="lv">3</span>';
  root.appendChild(hud); root.appendChild(canvas);
  const help = document.createElement('div');
  help.style.cssText = 'text-align:center; margin-top:10px; color:var(--muted); font-size:13px;';
  help.innerHTML = 'Mouse / ← → to move paddle · Space to launch';
  root.appendChild(help);

  const BR = 8, BC = 10, BRK_W = W / BC - 4, BRK_H = 18;
  let bricks, paddle, ball, score, lives, launched, over;
  function reset() {
    bricks = [];
    for (let r = 0; r < BR; r++) for (let c = 0; c < BC; c++) {
      bricks.push({ x: c * (BRK_W + 4) + 2, y: 40 + r * (BRK_H + 4), w: BRK_W, h: BRK_H, alive: true, color: `hsl(${r * 36}, 70%, 55%)` });
    }
    paddle = { x: W / 2 - 50, y: H - 24, w: 100, h: 10 };
    ball = { x: W / 2, y: H - 40, vx: 0, vy: 0, r: 7 };
    score = 0; lives = 3; launched = false; over = false;
    requestAnimationFrame(loop);
  }

  let mx = W / 2;
  canvas.addEventListener('mousemove', (e) => { const r = canvas.getBoundingClientRect(); mx = e.clientX - r.left; });
  canvas.addEventListener('touchmove', (e) => { const r = canvas.getBoundingClientRect(); mx = e.touches[0].clientX - r.left; }, { passive: true });
  canvas.addEventListener('click', () => { if (!launched) { ball.vx = 3.5; ball.vy = -4; launched = true; } });
  window.addEventListener('keydown', (e) => {
    if (e.key === ' ' && !launched) { ball.vx = 3.5; ball.vy = -4; launched = true; }
    if (e.key === 'ArrowLeft') paddle.x -= 20;
    if (e.key === 'ArrowRight') paddle.x += 20;
  });

  function loop() {
    if (over) { if (score > 0 && onScore) onScore(score); return; }
    paddle.x += ((mx - paddle.w / 2) - paddle.x) * 0.35;
    paddle.x = Math.max(0, Math.min(W - paddle.w, paddle.x));
    if (!launched) { ball.x = paddle.x + paddle.w / 2; ball.y = paddle.y - ball.r; }
    else {
      ball.x += ball.vx; ball.y += ball.vy;
      if (ball.x < ball.r || ball.x > W - ball.r) ball.vx *= -1;
      if (ball.y < ball.r) ball.vy *= -1;
      if (ball.y > H + 20) { lives--; document.getElementById('lv').textContent = lives; launched = false; if (lives <= 0) over = true; }
      if (ball.y > paddle.y - ball.r && ball.y < paddle.y + paddle.h && ball.x > paddle.x && ball.x < paddle.x + paddle.w && ball.vy > 0) {
        ball.vy *= -1;
        ball.vx = ((ball.x - (paddle.x + paddle.w / 2)) / (paddle.w / 2)) * 5;
      }
      for (const b of bricks) {
        if (!b.alive) continue;
        if (ball.x > b.x && ball.x < b.x + b.w && ball.y - ball.r < b.y + b.h && ball.y + ball.r > b.y) {
          b.alive = false; score += 10; document.getElementById('sc').textContent = score; ball.vy *= -1; break;
        }
      }
      if (bricks.every(b => !b.alive)) { alert(`You cleared it! Score: ${score}`); over = true; }
    }
    ctx.fillStyle = '#05091a'; ctx.fillRect(0, 0, W, H);
    for (const b of bricks) if (b.alive) { ctx.fillStyle = b.color; ctx.fillRect(b.x, b.y, b.w, b.h); }
    ctx.fillStyle = '#7c5cff'; ctx.fillRect(paddle.x, paddle.y, paddle.w, paddle.h);
    ctx.fillStyle = '#24d1a1'; ctx.beginPath(); ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2); ctx.fill();
    if (over) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#fff'; ctx.font = 'bold 26px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('Game Over', W / 2, H / 2);
    }
    requestAnimationFrame(loop);
  }
  reset();
}
