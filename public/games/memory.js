export function mountMemory(root, { onScore }) {
  root.innerHTML = '';
  const ICONS = ['🐶', '🐱', '🦊', '🐻', '🐼', '🐵', '🐷', '🐨'];
  const pairs = [...ICONS, ...ICONS];
  pairs.sort(() => Math.random() - 0.5);

  const hud = document.createElement('div');
  hud.style.cssText = 'display:flex; justify-content:center; gap:14px; margin-bottom:12px; font-weight:700;';
  hud.innerHTML = 'Moves: <span id="mv">0</span> · Matched: <span id="mt">0</span>/8 · <button id="rst" class="btn btn-sm">Restart</button>';
  root.appendChild(hud);

  const board = document.createElement('div');
  board.className = 'mem-board';
  board.style.gridTemplateColumns = 'repeat(4, 1fr)';
  root.appendChild(board);

  let flipped = [], moves = 0, matched = 0, lock = false, started = Date.now();
  const cells = pairs.map(icon => {
    const c = document.createElement('div'); c.className = 'mem-card'; c.dataset.icon = icon; c.textContent = '?';
    c.addEventListener('click', () => onFlip(c));
    board.appendChild(c); return c;
  });

  function onFlip(c) {
    if (lock || c.classList.contains('flip') || c.classList.contains('matched')) return;
    c.classList.add('flip'); c.textContent = c.dataset.icon;
    flipped.push(c);
    if (flipped.length === 2) {
      moves++; document.getElementById('mv').textContent = moves;
      lock = true;
      const [a, b] = flipped;
      if (a.dataset.icon === b.dataset.icon) {
        setTimeout(() => { a.classList.add('matched'); b.classList.add('matched'); matched++; document.getElementById('mt').textContent = matched; flipped = []; lock = false;
          if (matched === 8) {
            const sec = Math.max(1, Math.round((Date.now() - started) / 1000));
            const score = Math.max(100, 2000 - moves * 20 - sec * 5);
            alert(`You matched them all! Score: ${score}`);
            if (onScore) onScore(score);
          }
        }, 300);
      } else {
        setTimeout(() => { a.classList.remove('flip'); b.classList.remove('flip'); a.textContent = '?'; b.textContent = '?'; flipped = []; lock = false; }, 700);
      }
    }
  }

  document.getElementById('rst').onclick = () => mountMemory(root, { onScore });
}
