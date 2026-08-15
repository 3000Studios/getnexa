export function mountNexaArena3D(root, { onScore }) {
  root.innerHTML = '';
  root.classList.add('nexa-arena-3d-stage');
  const canvas = document.createElement('canvas');
  canvas.className = 'game-canvas arena-3d-canvas';
  canvas.width = 960;
  canvas.height = 540;
  canvas.setAttribute('aria-label', 'Nexa Arena 3D game canvas');
  root.appendChild(canvas);
  const help = document.createElement('p');
  help.className = 'game-help';
  help.textContent = 'Move: arrows / left stick · Boost: Shift / trigger · Fire: Space / A · Touch and drag on mobile';
  root.appendChild(help);
  const ctx = canvas.getContext('2d');
  const keys = new Set();
  const player = { x: 0, y: 0, vx: 0, vy: 0, shield: 3 };
  const objects = [];
  let distance = 0;
  let score = 0;
  let lastScore = 0;
  let over = false;
  let raf = 0;
  let last = performance.now();

  const spawn = (z = 90 + Math.random() * 70) => objects.push({
    x: (Math.random() * 2 - 1) * 8,
    y: (Math.random() * 2 - 1) * 4.2,
    z,
    type: Math.random() < .28 ? 'core' : 'sentry',
    hit: false,
  });
  for (let i = 0; i < 24; i++) spawn(20 + i * 7);

  function project(x, y, z) {
    const scale = 440 / Math.max(1, z);
    return { x: canvas.width / 2 + (x - player.x) * scale, y: canvas.height / 2 + (y - player.y) * scale, scale };
  }
  function drawTunnel() {
    ctx.fillStyle = '#02040d'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    const glow = ctx.createRadialGradient(480, 270, 8, 480, 270, 500);
    glow.addColorStop(0, 'rgba(0,229,255,.18)'); glow.addColorStop(1, 'rgba(2,4,13,0)');
    ctx.fillStyle = glow; ctx.fillRect(0, 0, canvas.width, canvas.height);
    for (let z = 8; z < 120; z += 7) {
      const p = project(0, 0, z - (distance % 7));
      const w = 9 * p.scale, h = 5 * p.scale;
      ctx.strokeStyle = `rgba(0,229,255,${Math.min(.5, 8 / z)})`;
      ctx.strokeRect(p.x - w, p.y - h, w * 2, h * 2);
    }
    for (const [x, y] of [[-9,-5], [9,-5], [9,5], [-9,5]]) {
      const a = project(x, y, 5), b = project(x, y, 120);
      ctx.strokeStyle = 'rgba(124,92,255,.32)'; ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y); ctx.stroke();
    }
  }
  function drawObject(o) {
    const p = project(o.x, o.y, o.z);
    if (p.scale < 2 || p.scale > 120) return;
    const r = Math.max(4, p.scale * (o.type === 'core' ? .32 : .5));
    ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(distance * .02 + o.z);
    ctx.shadowBlur = r; ctx.shadowColor = o.type === 'core' ? '#ffd166' : '#ff3b81';
    ctx.fillStyle = o.type === 'core' ? '#ffd166' : '#ff3b81';
    ctx.beginPath();
    if (o.type === 'core') { for (let i=0;i<6;i++){const a=i*Math.PI/3;ctx.lineTo(Math.cos(a)*r,Math.sin(a)*r);} }
    else { ctx.moveTo(0,-r); ctx.lineTo(r,r); ctx.lineTo(-r,r); }
    ctx.closePath(); ctx.fill(); ctx.restore();
  }
  function drawHud() {
    ctx.fillStyle = 'rgba(2,6,18,.72)'; ctx.fillRect(18,18,260,72);
    ctx.font = '700 18px system-ui'; ctx.fillStyle = '#00e5ff'; ctx.fillText(`SCORE ${Math.floor(score).toLocaleString()}`, 34, 47);
    ctx.font = '600 13px system-ui'; ctx.fillStyle = '#fff'; ctx.fillText(`SHIELD ${'◆'.repeat(player.shield)}   SPEED ${keys.has('Shift') ? 'BOOST' : 'CRUISE'}`, 34, 73);
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(480,250);ctx.lineTo(480,290);ctx.moveTo(460,270);ctx.lineTo(500,270);ctx.stroke();
  }
  function frame(now) {
    const dt = Math.min(.04, (now-last)/1000); last = now;
    if (!over) {
      const ax = (keys.has('ArrowRight') ? 1 : 0) - (keys.has('ArrowLeft') ? 1 : 0);
      const ay = (keys.has('ArrowDown') ? 1 : 0) - (keys.has('ArrowUp') ? 1 : 0);
      player.vx = player.vx * .86 + ax * 8 * dt; player.vy = player.vy * .86 + ay * 7 * dt;
      player.x = Math.max(-7.5, Math.min(7.5, player.x + player.vx));
      player.y = Math.max(-4, Math.min(4, player.y + player.vy));
      const speed = keys.has('Shift') ? 26 : 15; distance += speed * dt; score += speed * dt * 8;
      for (const o of objects) {
        o.z -= speed * dt;
        if (o.z < 3) {
          if (!o.hit && Math.abs(o.x-player.x)<1.3 && Math.abs(o.y-player.y)<1.2) {
            o.hit = true;
            if (o.type === 'core') score += 500;
            else if (--player.shield <= 0) { over = true; onScore(Math.floor(score)); }
          }
          Object.assign(o, { x:(Math.random()*2-1)*8, y:(Math.random()*2-1)*4.2, z:120+Math.random()*50, type:Math.random()<.28?'core':'sentry', hit:false });
        }
      }
      if (score-lastScore > 250) { lastScore=score; onScore(Math.floor(score)); }
    }
    drawTunnel(); objects.slice().sort((a,b)=>b.z-a.z).forEach(drawObject); drawHud();
    if (over) { ctx.fillStyle='rgba(2,4,13,.82)';ctx.fillRect(0,0,960,540);ctx.textAlign='center';ctx.fillStyle='#ff3b81';ctx.font='800 42px system-ui';ctx.fillText('SYSTEM DOWN',480,250);ctx.fillStyle='#fff';ctx.font='18px system-ui';ctx.fillText('Press Enter or A to reboot',480,292);ctx.textAlign='left'; }
    raf=requestAnimationFrame(frame);
  }
  const down = e => { keys.add(e.key); if (over && (e.key==='Enter'||e.key===' ')) { over=false;score=0;player.shield=3;player.x=player.y=0; } };
  const up = e => keys.delete(e.key);
  window.addEventListener('keydown', down); window.addEventListener('keyup', up);
  let touch = null;
  canvas.addEventListener('pointerdown', e => { touch={x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId); });
  canvas.addEventListener('pointermove', e => { if(!touch)return; player.x=Math.max(-7.5,Math.min(7.5,player.x+(e.clientX-touch.x)*.025));player.y=Math.max(-4,Math.min(4,player.y+(e.clientY-touch.y)*.02));touch={x:e.clientX,y:e.clientY}; });
  canvas.addEventListener('pointerup', () => touch=null);
  raf=requestAnimationFrame(frame);
  const observer=new MutationObserver(()=>{if(!document.body.contains(root)){cancelAnimationFrame(raf);window.removeEventListener('keydown',down);window.removeEventListener('keyup',up);observer.disconnect();}});
  observer.observe(document.body,{childList:true,subtree:true});
}
