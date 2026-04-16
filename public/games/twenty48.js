export function mountTwenty48(root, { onScore }) {
  root.innerHTML = '';
  const N = 4;
  let grid, score, best = parseInt(localStorage.getItem('hi-2048') || '0', 10), over;

  const hud = document.createElement('div');
  hud.style.cssText = 'display:flex; gap:14px; justify-content: center; margin-bottom: 10px; font-weight:700;';
  hud.innerHTML = `Score: <span id="sc">0</span>   ·   Best: <span id="bb">${best}</span>   <button id="rst" class="btn btn-sm" style="margin-left:10px;">Restart</button>`;
  root.appendChild(hud);
  const board = document.createElement('div');
  board.className = 'grid-2048';
  root.appendChild(board);

  const help = document.createElement('div');
  help.style.cssText = 'text-align:center; margin-top:10px; color: var(--muted); font-size:13px;';
  help.innerHTML = 'Arrow keys / WASD or swipe · merge like tiles to reach 2048!';
  root.appendChild(help);

  function newGame() {
    grid = Array.from({ length: N }, () => Array(N).fill(0));
    score = 0; over = false;
    addTile(); addTile();
    render();
  }

  function addTile() {
    const empty = [];
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) if (!grid[r][c]) empty.push([r, c]);
    if (!empty.length) return;
    const [r, c] = empty[Math.floor(Math.random() * empty.length)];
    grid[r][c] = Math.random() < 0.9 ? 2 : 4;
  }

  function render() {
    board.innerHTML = '';
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
      const v = grid[r][c];
      const cell = document.createElement('div');
      cell.className = 'tile-2048';
      if (v) { cell.textContent = v; cell.setAttribute('data-v', String(v)); }
      board.appendChild(cell);
    }
    document.getElementById('sc').textContent = score;
    if (score > best) { best = score; localStorage.setItem('hi-2048', String(best)); document.getElementById('bb').textContent = best; }
  }

  function slide(row) {
    const arr = row.filter(v => v);
    for (let i = 0; i < arr.length - 1; i++) {
      if (arr[i] === arr[i + 1]) { arr[i] *= 2; score += arr[i]; arr.splice(i + 1, 1); }
    }
    while (arr.length < N) arr.push(0);
    return arr;
  }

  function move(dir) {
    const before = JSON.stringify(grid);
    const rotate = () => { grid = grid[0].map((_, i) => grid.map(r => r[i])).reverse(); };
    const rotateCCW = () => { grid = grid.map(r => r.reverse()); grid = grid[0].map((_, i) => grid.map(r => r[i])); };
    let rots = 0;
    if (dir === 'up') { rotate(); rotate(); rotate(); rots = 3; }
    else if (dir === 'right') { rotate(); rotate(); rots = 2; }
    else if (dir === 'down') { rotate(); rots = 1; }
    grid = grid.map(row => slide(row));
    for (let i = 0; i < rots; i++) rotate();
    if (JSON.stringify(grid) !== before) {
      addTile();
      render();
      if (isOver()) {
        over = true;
        alert(`Game over! Final score: ${score}`);
        if (onScore && score > 0) onScore(score);
      }
    }
  }

  function isOver() {
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
      if (!grid[r][c]) return false;
      if (c < N - 1 && grid[r][c] === grid[r][c + 1]) return false;
      if (r < N - 1 && grid[r][c] === grid[r + 1][c]) return false;
    }
    return true;
  }

  const keys = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', w: 'up', s: 'down', a: 'left', d: 'right', W: 'up', S: 'down', A: 'left', D: 'right' };
  const onKey = (e) => { const d = keys[e.key]; if (!d || over) return; e.preventDefault(); move(d); };
  window.addEventListener('keydown', onKey);

  let start = null;
  board.addEventListener('touchstart', (e) => { start = e.touches[0]; }, { passive: true });
  board.addEventListener('touchend', (e) => {
    if (!start) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - start.clientX, dy = t.clientY - start.clientY;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 20) return;
    if (Math.abs(dx) > Math.abs(dy)) move(dx > 0 ? 'right' : 'left');
    else move(dy > 0 ? 'down' : 'up');
    start = null;
  });

  document.getElementById('rst').onclick = newGame;
  newGame();
}
