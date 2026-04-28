export function mountStarblitz(root, { onScore }) {
  root.innerHTML = '';
  const W = 640;
  const H = 760;
  const canvas = document.createElement('canvas');
  canvas.className = 'game-canvas';
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  const hud = document.createElement('div');
  hud.style.cssText = 'display:flex;justify-content:center;gap:16px;flex-wrap:wrap;margin-bottom:10px;font-weight:700;';
  hud.innerHTML = 'Score: <span id="sb-score">0</span> · Wave: <span id="sb-wave">1</span> · Hull: <span id="sb-hp">5</span>';
  root.appendChild(hud);
  root.appendChild(canvas);

  const help = document.createElement('div');
  help.style.cssText = 'text-align:center; margin-top:10px; color:var(--muted); font-size:13px;';
  help.innerHTML = 'Move with mouse or WASD · Auto-fire engages continuously · Tap to restart after destruction';
  root.appendChild(help);

  const state = {
    score: 0,
    wave: 1,
    hp: 5,
    over: false,
    enemies: [],
    shots: [],
    enemyShots: [],
    particles: [],
    stars: Array.from({ length: 120 }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      z: 0.3 + Math.random() * 1.8,
    })),
  };

  const ship = { x: W / 2, y: H - 90, tx: W / 2, ty: H - 90, fireCooldown: 0 };
  let last = performance.now();
  let raf = 0;

  function spawnWave() {
    const cols = Math.min(7, 3 + state.wave);
    const rows = Math.min(4, 2 + Math.floor(state.wave / 2));
    state.enemies = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        state.enemies.push({
          x: 90 + c * 72,
          y: 80 + r * 58,
          baseX: 90 + c * 72,
          baseY: 80 + r * 58,
          phase: Math.random() * Math.PI * 2,
          hp: r >= rows - 1 ? 2 : 1,
          kind: r >= rows - 1 ? 'elite' : 'drone',
        });
      }
    }
  }

  function burst(x, y, color, amount = 14) {
    for (let i = 0; i < amount; i++) {
      state.particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 7,
        vy: (Math.random() - 0.5) * 7,
        life: 0.6 + Math.random() * 0.8,
        color,
        size: 2 + Math.random() * 4,
      });
    }
  }

  function drawBackground(dt) {
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#02040b');
    bg.addColorStop(0.5, '#071127');
    bg.addColorStop(1, '#02040b');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    for (const star of state.stars) {
      star.y += 28 * star.z * dt * (1 + state.wave * 0.04);
      if (star.y > H) {
        star.y = -10;
        star.x = Math.random() * W;
      }
      ctx.fillStyle = `rgba(180,210,255,${0.2 + star.z * 0.18})`;
      ctx.fillRect(star.x, star.y, star.z * 1.6, star.z * 8);
    }

    const haze = ctx.createRadialGradient(W / 2, 120, 10, W / 2, 120, 260);
    haze.addColorStop(0, 'rgba(91,140,255,0.2)');
    haze.addColorStop(1, 'rgba(91,140,255,0)');
    ctx.fillStyle = haze;
    ctx.fillRect(0, 0, W, 300);
  }

  function drawShip() {
    ship.x += (ship.tx - ship.x) * 0.22;
    ship.y += (ship.ty - ship.y) * 0.22;

    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.fillStyle = '#f3f7ff';
    ctx.beginPath();
    ctx.moveTo(0, -34);
    ctx.lineTo(20, 22);
    ctx.lineTo(6, 14);
    ctx.lineTo(0, 30);
    ctx.lineTo(-6, 14);
    ctx.lineTo(-20, 22);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#7c5cff';
    ctx.fillRect(-6, -10, 12, 20);
    ctx.fillStyle = '#24d1a1';
    ctx.fillRect(-16, 12, 10, 8);
    ctx.fillRect(6, 12, 10, 8);

    ctx.fillStyle = 'rgba(255,176,32,0.9)';
    ctx.beginPath();
    ctx.moveTo(-7, 30);
    ctx.lineTo(0, 46 + Math.random() * 8);
    ctx.lineTo(7, 30);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function drawEnemies(time) {
    for (const enemy of state.enemies) {
      const bob = Math.sin(time * 0.002 + enemy.phase) * 8;
      enemy.x = enemy.baseX + Math.sin(time * 0.0013 + enemy.phase) * 26;
      enemy.y = enemy.baseY + bob;
      ctx.save();
      ctx.translate(enemy.x, enemy.y);
      const color = enemy.kind === 'elite' ? '#ff5b6b' : '#5b8cff';
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(0, 20);
      ctx.lineTo(24, -12);
      ctx.lineTo(0, -24);
      ctx.lineTo(-24, -12);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.75)';
      ctx.fillRect(-8, -10, 16, 6);
      ctx.restore();
    }
  }

  function drawProjectiles() {
    ctx.fillStyle = '#24d1a1';
    for (const shot of state.shots) ctx.fillRect(shot.x - 2, shot.y - 12, 4, 18);
    ctx.fillStyle = '#ffb020';
    for (const shot of state.enemyShots) ctx.fillRect(shot.x - 2, shot.y, 4, 16);
  }

  function drawParticles(dt) {
    state.particles = state.particles.filter((p) => p.life > 0);
    for (const p of state.particles) {
      p.x += p.vx;
      p.y += p.vy;
      p.life -= dt;
      ctx.fillStyle = toAlpha(p.color, Math.max(0, p.life));
      ctx.fillRect(p.x, p.y, p.size, p.size);
    }
  }

  function toAlpha(color, alpha) {
    if (color.startsWith('rgba')) return color;
    const hex = color.replace('#', '');
    const expanded = hex.length === 3 ? hex.split('').map((x) => x + x).join('') : hex;
    const r = parseInt(expanded.slice(0, 2), 16);
    const g = parseInt(expanded.slice(2, 4), 16);
    const b = parseInt(expanded.slice(4, 6), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  }

  function rectHit(a, b, pad = 18) {
    return Math.abs(a.x - b.x) < pad && Math.abs(a.y - b.y) < pad;
  }

  function endGame() {
    if (state.over) return;
    state.over = true;
    burst(ship.x, ship.y, '#ff5b6b', 28);
    if (state.score > 0 && onScore) onScore(state.score);
  }

  function restart() {
    state.score = 0;
    state.wave = 1;
    state.hp = 5;
    state.over = false;
    state.shots = [];
    state.enemyShots = [];
    state.particles = [];
    ship.x = ship.tx = W / 2;
    ship.y = ship.ty = H - 90;
    ship.fireCooldown = 0;
    spawnWave();
    last = performance.now();
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(tick);
  }

  function tick(ts) {
    const dt = Math.min(0.033, (ts - last) / 1000);
    last = ts;

    drawBackground(dt);

    if (!state.over) {
      ship.fireCooldown -= dt;
      if (ship.fireCooldown <= 0) {
        ship.fireCooldown = 0.13;
        state.shots.push({ x: ship.x - 10, y: ship.y - 28, vy: -11 });
        state.shots.push({ x: ship.x + 10, y: ship.y - 28, vy: -11 });
      }

      for (const shot of state.shots) shot.y += shot.vy;
      for (const shot of state.enemyShots) shot.y += shot.vy;
      state.shots = state.shots.filter((shot) => shot.y > -30);
      state.enemyShots = state.enemyShots.filter((shot) => shot.y < H + 30);

      if (Math.random() < 0.018 + state.wave * 0.002 && state.enemies.length) {
        const shooter = state.enemies[Math.floor(Math.random() * state.enemies.length)];
        state.enemyShots.push({ x: shooter.x, y: shooter.y + 18, vy: 6 + state.wave * 0.2 });
      }

      for (const shot of state.shots) {
        for (const enemy of state.enemies) {
          if (enemy.hp > 0 && rectHit(shot, enemy, enemy.kind === 'elite' ? 22 : 18)) {
            shot.y = -100;
            enemy.hp -= 1;
            burst(enemy.x, enemy.y, enemy.kind === 'elite' ? '#ff5b6b' : '#5b8cff', 10);
            if (enemy.hp <= 0) {
              state.score += enemy.kind === 'elite' ? 80 : 35;
              burst(enemy.x, enemy.y, '#24d1a1', 16);
            }
            break;
          }
        }
      }
      state.enemies = state.enemies.filter((enemy) => enemy.hp > 0);

      for (const shot of state.enemyShots) {
        if (rectHit(shot, ship, 20)) {
          shot.y = H + 100;
          state.hp -= 1;
          burst(ship.x, ship.y - 12, '#ffb020', 10);
          if (state.hp <= 0) endGame();
        }
      }

      if (!state.enemies.length) {
        state.wave += 1;
        state.score += 120;
        spawnWave();
      }

      document.getElementById('sb-score').textContent = String(state.score);
      document.getElementById('sb-wave').textContent = String(state.wave);
      document.getElementById('sb-hp').textContent = String(state.hp);
    }

    drawEnemies(ts);
    drawProjectiles();
    drawShip();
    drawParticles(dt);

    if (state.over) {
      ctx.fillStyle = 'rgba(2,4,10,0.7)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.font = '700 38px Inter, sans-serif';
      ctx.fillText('Vanguard Lost', W / 2, H / 2 - 20);
      ctx.font = '500 18px Inter, sans-serif';
      ctx.fillText(`Final score ${state.score} · Tap or press Space to relaunch`, W / 2, H / 2 + 18);
    }

    raf = requestAnimationFrame(tick);
  }

  const onMove = (clientX, clientY) => {
    const rect = canvas.getBoundingClientRect();
    ship.tx = Math.max(40, Math.min(W - 40, ((clientX - rect.left) / rect.width) * W));
    ship.ty = Math.max(H * 0.55, Math.min(H - 70, ((clientY - rect.top) / rect.height) * H));
  };

  canvas.addEventListener('mousemove', (e) => onMove(e.clientX, e.clientY));
  canvas.addEventListener('touchmove', (e) => {
    const t = e.touches[0];
    onMove(t.clientX, t.clientY);
  }, { passive: true });

  const keys = {};
  const onKeyDown = (e) => {
    keys[e.code] = true;
    if (e.code === 'Space' && state.over) restart();
  };
  const onKeyUp = (e) => { keys[e.code] = false; };
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);

  function applyKeyboard() {
    if (keys.KeyA || keys.ArrowLeft) ship.tx -= 8;
    if (keys.KeyD || keys.ArrowRight) ship.tx += 8;
    if (keys.KeyW || keys.ArrowUp) ship.ty -= 8;
    if (keys.KeyS || keys.ArrowDown) ship.ty += 8;
    ship.tx = Math.max(40, Math.min(W - 40, ship.tx));
    ship.ty = Math.max(H * 0.55, Math.min(H - 70, ship.ty));
    requestAnimationFrame(applyKeyboard);
  }

  canvas.addEventListener('click', () => {
    if (state.over) restart();
  });

  applyKeyboard();
  restart();
}
