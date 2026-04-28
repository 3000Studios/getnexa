export function mountNeonDrift(root, { onScore }) {
  root.innerHTML = '';
  const W = 540;
  const H = 760;
  const canvas = document.createElement('canvas');
  canvas.className = 'game-canvas';
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  const hud = document.createElement('div');
  hud.style.cssText = 'display:flex;justify-content:center;gap:16px;flex-wrap:wrap;margin-bottom:10px;font-weight:700;';
  hud.innerHTML = 'Distance: <span id="nd-score">0</span> · Speed: <span id="nd-speed">1.0x</span> · Boost: <span id="nd-boost">Ready</span>';
  root.appendChild(hud);
  root.appendChild(canvas);

  const help = document.createElement('div');
  help.style.cssText = 'text-align:center; margin-top:10px; color:var(--muted); font-size:13px;';
  help.innerHTML = 'A / D or ← / → to drift lanes · Hold Shift for boost · Swipe on mobile';
  root.appendChild(help);

  const laneX = [W * 0.27, W * 0.5, W * 0.73];
  const player = { lane: 1, x: laneX[1], y: H - 140, w: 56, h: 108, tilt: 0 };
  const state = {
    score: 0,
    speed: 1,
    boost: 100,
    boosting: false,
    over: false,
    traffic: [],
    particles: [],
    lastSpawn: 0,
    roadOffset: 0,
    skyGlow: 0,
  };

  let last = performance.now();
  let raf = 0;

  function spawnTraffic() {
    const lane = Math.floor(Math.random() * laneX.length);
    const type = Math.random() < 0.7 ? 'car' : 'truck';
    state.traffic.push({
      lane,
      x: laneX[lane],
      y: -140,
      w: type === 'car' ? 52 : 68,
      h: type === 'car' ? 96 : 128,
      color: ['#ff5b6b', '#24d1a1', '#7c5cff', '#ffb020'][Math.floor(Math.random() * 4)],
      speed: (7 + Math.random() * 5),
      type,
    });
  }

  function burst(x, y, color, amount = 12) {
    for (let i = 0; i < amount; i++) {
      state.particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.5) * 8,
        life: 0.8 + Math.random() * 0.7,
        size: 2 + Math.random() * 4,
        color,
      });
    }
  }

  function setLane(nextLane) {
    const clamped = Math.max(0, Math.min(laneX.length - 1, nextLane));
    if (clamped === player.lane || state.over) return;
    player.tilt = clamped > player.lane ? 0.22 : -0.22;
    player.lane = clamped;
    burst(player.x, player.y + 36, '#7c5cff', 10);
  }

  function drawBackground(dt) {
    state.skyGlow += dt * 0.4;
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, '#040712');
    sky.addColorStop(0.45, '#09142b');
    sky.addColorStop(1, '#02040a');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);

    for (let i = 0; i < 40; i++) {
      const y = (i * 83 + state.roadOffset * 0.18) % H;
      ctx.fillStyle = `rgba(124,92,255,${0.05 + (i % 6) * 0.01})`;
      ctx.fillRect(0, y, W, 1);
    }

    const glowX = W / 2 + Math.sin(state.skyGlow) * 90;
    const aura = ctx.createRadialGradient(glowX, 120, 30, glowX, 120, 260);
    aura.addColorStop(0, 'rgba(124,92,255,0.32)');
    aura.addColorStop(1, 'rgba(124,92,255,0)');
    ctx.fillStyle = aura;
    ctx.fillRect(0, 0, W, 280);
  }

  function drawRoad(dt) {
    state.roadOffset = (state.roadOffset + dt * 420 * state.speed) % 120;
    ctx.save();
    ctx.translate(W / 2, H * 0.62);

    ctx.beginPath();
    ctx.moveTo(-210, H * 0.45);
    ctx.lineTo(-90, -260);
    ctx.lineTo(90, -260);
    ctx.lineTo(210, H * 0.45);
    ctx.closePath();
    const road = ctx.createLinearGradient(0, -260, 0, H * 0.4);
    road.addColorStop(0, '#10192d');
    road.addColorStop(1, '#05070e');
    ctx.fillStyle = road;
    ctx.fill();

    ctx.strokeStyle = 'rgba(91,140,255,0.45)';
    ctx.lineWidth = 3;
    ctx.stroke();

    for (let i = 0; i < 2; i++) {
      ctx.strokeStyle = 'rgba(124,92,255,0.18)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-70 + i * 140, -260);
      ctx.lineTo(-135 + i * 270, H * 0.45);
      ctx.stroke();
    }

    for (let i = -2; i < 10; i++) {
      const y = i * 120 + state.roadOffset - 240;
      const perspective = (y + 260) / (H + 120);
      const dashWidth = 10 + perspective * 18;
      const dashHeight = 48 + perspective * 24;
      ctx.fillStyle = 'rgba(240,244,255,0.85)';
      ctx.fillRect(-dashWidth / 2, y, dashWidth, dashHeight);
    }

    ctx.restore();
  }

  function drawPlayer() {
    player.x += (laneX[player.lane] - player.x) * 0.18;
    player.tilt *= 0.88;
    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.rotate(player.tilt);

    const body = ctx.createLinearGradient(0, -50, 0, 54);
    body.addColorStop(0, '#f6fbff');
    body.addColorStop(0.18, '#79a7ff');
    body.addColorStop(0.55, '#7c5cff');
    body.addColorStop(1, '#1a1038');
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.moveTo(0, -52);
    ctx.bezierCurveTo(28, -30, 28, 28, 18, 52);
    ctx.lineTo(-18, 52);
    ctx.bezierCurveTo(-28, 28, -28, -30, 0, -52);
    ctx.fill();

    ctx.fillStyle = 'rgba(36,209,161,0.95)';
    ctx.fillRect(-8, -20, 16, 40);
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.fillRect(-20, 20, 10, 24);
    ctx.fillRect(10, 20, 10, 24);

    const exhaust = state.boosting ? '#ffb020' : '#24d1a1';
    ctx.fillStyle = exhaust;
    ctx.beginPath();
    ctx.moveTo(-10, 52);
    ctx.lineTo(0, 76 + Math.random() * (state.boosting ? 24 : 12));
    ctx.lineTo(10, 52);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  function drawTraffic() {
    for (const car of state.traffic) {
      ctx.save();
      ctx.translate(car.x, car.y);
      ctx.fillStyle = car.color;
      ctx.beginPath();
      ctx.roundRect(-car.w / 2, -car.h / 2, car.w, car.h, 14);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.2)';
      ctx.fillRect(-car.w / 2 + 8, -car.h / 2 + 12, car.w - 16, 18);
      ctx.fillStyle = '#09101d';
      ctx.fillRect(-car.w / 2 + 10, 8, car.w - 20, 28);
      ctx.restore();
    }
  }

  function drawParticles(dt) {
    state.particles = state.particles.filter((p) => p.life > 0);
    for (const p of state.particles) {
      p.x += p.vx;
      p.y += p.vy + dt * 15;
      p.life -= dt;
      ctx.fillStyle = p.color.replace(')', `, ${Math.max(p.life, 0)})`).replace('rgb', 'rgba');
      if (!ctx.fillStyle.includes('rgba')) ctx.fillStyle = `rgba(124,92,255,${Math.max(p.life, 0)})`;
      ctx.fillRect(p.x, p.y, p.size, p.size);
    }
  }

  function intersects(a, b) {
    return Math.abs(a.x - b.x) * 2 < a.w + b.w && Math.abs(a.y - b.y) * 2 < a.h + b.h;
  }

  function endRun() {
    state.over = true;
    burst(player.x, player.y, '#ff5b6b', 28);
    if (state.score > 0 && onScore) onScore(Math.floor(state.score));
  }

  function tick(ts) {
    const dt = Math.min(0.033, (ts - last) / 1000);
    last = ts;

    if (!state.over) {
      state.boosting = keys.ShiftLeft || keys.ShiftRight || boostTouch;
      if (state.boosting && state.boost > 0) {
        state.boost -= dt * 45;
        state.speed = 1.65;
      } else {
        state.boost = Math.min(100, state.boost + dt * 18);
        state.speed += (1 - state.speed) * 0.08;
        state.boosting = false;
      }

      state.lastSpawn += dt;
      if (state.lastSpawn > Math.max(0.34, 0.88 - state.speed * 0.14)) {
        state.lastSpawn = 0;
        spawnTraffic();
      }

      state.score += dt * 90 * state.speed;
      document.getElementById('nd-score').textContent = Math.floor(state.score);
      document.getElementById('nd-speed').textContent = `${state.speed.toFixed(1)}x`;
      document.getElementById('nd-boost').textContent = state.boost > 12 ? 'Ready' : 'Charging';

      for (const car of state.traffic) {
        car.y += car.speed * 60 * dt * state.speed;
        if (Math.abs(car.lane - player.lane) <= 1 && car.y > player.y - 130 && car.y < player.y + 120) {
          const near = Math.abs(car.x - player.x) > 44 && Math.abs(car.x - player.x) < 82;
          if (near && !car.scoredNearMiss) {
            car.scoredNearMiss = true;
            state.score += 25;
            burst(player.x, player.y + 16, '#24d1a1', 8);
          }
        }
      }
      state.traffic = state.traffic.filter((car) => car.y < H + 180);

      const playerHitbox = { x: player.x, y: player.y, w: 48, h: 92 };
      for (const car of state.traffic) {
        if (intersects(playerHitbox, { x: car.x, y: car.y, w: car.w - 10, h: car.h - 12 })) {
          endRun();
          break;
        }
      }
    }

    drawBackground(dt);
    drawRoad(dt);
    drawTraffic();
    drawPlayer();
    drawParticles(dt);

    if (state.over) {
      ctx.fillStyle = 'rgba(2,4,10,0.72)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.font = '700 40px Inter, sans-serif';
      ctx.fillText('Run Over', W / 2, H / 2 - 20);
      ctx.font = '500 18px Inter, sans-serif';
      ctx.fillText(`Distance ${Math.floor(state.score)} · Press Space to restart`, W / 2, H / 2 + 20);
    }

    raf = requestAnimationFrame(tick);
  }

  const keys = {};
  let boostTouch = false;
  const onKeyDown = (e) => {
    keys[e.code] = true;
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') setLane(player.lane - 1);
    if (e.code === 'ArrowRight' || e.code === 'KeyD') setLane(player.lane + 1);
    if (e.code === 'Space' && state.over) restart();
  };
  const onKeyUp = (e) => { keys[e.code] = false; };
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);

  let startX = null;
  canvas.addEventListener('touchstart', (e) => {
    const touch = e.touches[0];
    startX = touch.clientX;
    boostTouch = touch.clientY > canvas.getBoundingClientRect().top + H * 0.68;
  }, { passive: true });
  canvas.addEventListener('touchmove', (e) => {
    if (startX == null) return;
    const dx = e.touches[0].clientX - startX;
    if (dx > 40) { setLane(player.lane + 1); startX = e.touches[0].clientX; }
    else if (dx < -40) { setLane(player.lane - 1); startX = e.touches[0].clientX; }
  }, { passive: true });
  canvas.addEventListener('touchend', () => {
    startX = null;
    boostTouch = false;
    if (state.over) restart();
  });

  function restart() {
    cancelAnimationFrame(raf);
    state.score = 0;
    state.speed = 1;
    state.boost = 100;
    state.boosting = false;
    state.over = false;
    state.traffic = [];
    state.particles = [];
    state.lastSpawn = 0;
    player.lane = 1;
    player.x = laneX[1];
    player.tilt = 0;
    last = performance.now();
    raf = requestAnimationFrame(tick);
  }

  restart();
}
