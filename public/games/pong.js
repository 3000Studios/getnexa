export function mountPong(root, { onScore }) {
  root.innerHTML = '';
  const W = 600, H = 400;
  const canvas = document.createElement('canvas');
  canvas.className = 'game-canvas'; canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');
  const hud = document.createElement('div');
  hud.style.cssText = 'display:flex; justify-content:center; gap:20px; margin-bottom:10px; font-weight:700;';
  hud.innerHTML = 'You: <span id="sp">0</span> · CPU: <span id="sc">0</span> · Rally: <span id="rl">0</span>';
  root.appendChild(hud); root.appendChild(canvas);
  const help = document.createElement('div');
  help.style.cssText = 'text-align:center; margin-top:10px; color:var(--muted); font-size:13px;';
  help.innerHTML = 'Mouse / ↑↓ to move paddle · First to 7 wins';
  root.appendChild(help);

  const PAD_H = 80, PAD_W = 10;
  let p, c, ball, sp = 0, sc = 0, rally = 0, over = false, won = false;
  function reset() { p = H / 2 - PAD_H / 2; c = H / 2 - PAD_H / 2; ball = { x: W / 2, y: H / 2, vx: 4 * (Math.random() < 0.5 ? 1 : -1), vy: (Math.random() - 0.5) * 4, r: 8 }; rally = 0; }
  reset();

  let my = H / 2;
  canvas.addEventListener('mousemove', (e) => { const r = canvas.getBoundingClientRect(); my = e.clientY - r.top; });
  window.addEventListener('keydown', (e) => { if (e.key === 'ArrowUp') my -= 30; if (e.key === 'ArrowDown') my += 30; });

  function loop() {
    if (over) return;
    p += ((my - PAD_H / 2) - p) * 0.28; p = Math.max(0, Math.min(H - PAD_H, p));
    const targetY = ball.y - PAD_H / 2; c += (targetY - c) * 0.08; c = Math.max(0, Math.min(H - PAD_H, c));
    ball.x += ball.vx; ball.y += ball.vy;
    if (ball.y < ball.r || ball.y > H - ball.r) ball.vy *= -1;
    if (ball.x - ball.r < PAD_W && ball.y > p && ball.y < p + PAD_H && ball.vx < 0) { ball.vx *= -1.05; rally++; document.getElementById('rl').textContent = rally; }
    if (ball.x + ball.r > W - PAD_W && ball.y > c && ball.y < c + PAD_H && ball.vx > 0) { ball.vx *= -1.05; rally++; document.getElementById('rl').textContent = rally; }
    if (ball.x < 0) { sc++; document.getElementById('sc').textContent = sc; reset(); }
    else if (ball.x > W) { sp++; document.getElementById('sp').textContent = sp; reset(); }
    if (sp >= 7 || sc >= 7) { over = true; won = sp > sc; }

    ctx.fillStyle = '#05091a'; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    for (let y = 0; y < H; y += 18) ctx.fillRect(W / 2 - 1, y, 2, 10);
    ctx.fillStyle = '#7c5cff'; ctx.fillRect(0, p, PAD_W, PAD_H);
    ctx.fillStyle = '#24d1a1'; ctx.fillRect(W - PAD_W, c, PAD_W, PAD_H);
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2); ctx.fill();
    if (over) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#fff'; ctx.font = 'bold 32px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(won ? 'You win!' : 'CPU wins', W / 2, H / 2);
      const score = sp * 100 + rally * 5; if (score > 0 && onScore) onScore(score);
      return;
    }
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
}
