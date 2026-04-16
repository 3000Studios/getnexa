export function mountTicTacToe(root, { onScore, user }) {
  root.innerHTML = '';
  const roomId = new URL(location.href).searchParams.get('room') || makeCode();
  if (!new URL(location.href).searchParams.get('room')) {
    const u = new URL(location.href); u.searchParams.set('room', roomId); history.replaceState({}, '', u.toString());
  }

  const header = document.createElement('div');
  header.style.cssText = 'display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; flex-wrap:wrap; gap:10px;';
  header.innerHTML = `<div><b>Room:</b> <span style="background: var(--bg-2); padding:4px 8px; border-radius:6px; font-family: monospace;">${roomId}</span> <button id="copy" class="btn btn-sm" style="margin-left:8px;">Copy link</button></div>
    <div id="status" style="color: var(--muted);">Connecting…</div>`;
  root.appendChild(header);

  const board = document.createElement('div'); board.className = 'ttt-board';
  for (let i = 0; i < 9; i++) {
    const c = document.createElement('div'); c.className = 'ttt-cell'; c.dataset.i = i;
    c.addEventListener('click', () => onCellClick(i));
    board.appendChild(c);
  }
  root.appendChild(board);

  const controls = document.createElement('div'); controls.style.cssText = 'display:flex; justify-content:center; gap:10px; margin-top:12px;';
  controls.innerHTML = `<button id="rdy" class="btn btn-primary">I'm ready</button><button id="rst" class="btn">Reset</button>`;
  root.appendChild(controls);

  // chat
  const chatW = document.createElement('div'); chatW.className = 'chat'; chatW.style.marginTop = '14px';
  chatW.innerHTML = `<div class="chat-log" id="clog"></div><div class="chat-input"><input id="cin" placeholder="Say something…" maxlength="200"/><button id="csend">Send</button></div>`;
  root.appendChild(chatW);

  document.getElementById('copy').onclick = () => { navigator.clipboard.writeText(location.href).catch(() => {}); };

  const wsUrl = (location.protocol === 'https:' ? 'wss:' : 'ws:') + '//' + location.host + '/api/mp/tictactoe/' + encodeURIComponent(roomId);
  const ws = new WebSocket(wsUrl);
  let mySymbol = null, myTurn = false, state = null;

  ws.onopen = () => setStatus('Waiting for opponent…');
  ws.onclose = () => setStatus('Disconnected');
  ws.onerror = () => setStatus('Connection error');
  ws.onmessage = (e) => {
    const m = JSON.parse(e.data);
    if (m.type === 'welcome') {
      setStatus(`${m.players.length} player${m.players.length === 1 ? '' : 's'} in room. Tap "Ready" to start.`);
    } else if (m.type === 'presence') {
      setStatus(`${m.players.length} player${m.players.length === 1 ? '' : 's'} in room. Both players must be ready to start.`);
    } else if (m.type === 'start') {
      mySymbol = m.symbol; state = { board: m.board, turn: m.turn, winner: null };
      myTurn = (mySymbol === m.turn);
      render();
      setStatus(myTurn ? 'Your turn' : "Opponent's turn");
    } else if (m.type === 'state') {
      state = { board: m.board, turn: m.turn, winner: m.winner };
      myTurn = (mySymbol === m.turn);
      render();
      if (m.winner === 'draw') setStatus("It's a draw");
      else if (m.winner) {
        setStatus(m.winner === mySymbol ? 'You won! 🎉' : 'You lost.');
        if (m.winner === mySymbol && onScore) onScore(100);
      } else setStatus(myTurn ? 'Your turn' : "Opponent's turn");
    } else if (m.type === 'reset') {
      state = null; mySymbol = null; render(); setStatus('Ready up to play again.');
    } else if (m.type === 'chat') {
      const log = document.getElementById('clog'); const d = document.createElement('div'); d.className = 'msg';
      d.innerHTML = `<b>${escapeHtml(m.from)}:</b> ${escapeHtml(m.text)}`; log.appendChild(d); log.scrollTop = log.scrollHeight;
    }
  };

  document.getElementById('rdy').onclick = () => ws.readyState === 1 && ws.send(JSON.stringify({ type: 'ready', ready: true }));
  document.getElementById('rst').onclick = () => ws.readyState === 1 && ws.send(JSON.stringify({ type: 'reset' }));
  document.getElementById('csend').onclick = sendChat;
  document.getElementById('cin').addEventListener('keydown', (e) => { if (e.key === 'Enter') sendChat(); });

  function sendChat() {
    const inp = document.getElementById('cin'); const v = inp.value.trim(); if (!v) return;
    ws.readyState === 1 && ws.send(JSON.stringify({ type: 'chat', text: v }));
    inp.value = '';
  }
  function onCellClick(i) {
    if (!state || state.winner || !myTurn) return;
    if (state.board[i]) return;
    ws.send(JSON.stringify({ type: 'move', index: i }));
  }
  function render() {
    for (let i = 0; i < 9; i++) {
      const c = board.children[i];
      const v = state?.board?.[i] || '';
      c.textContent = v;
      c.classList.toggle('O', v === 'O');
    }
  }
  function setStatus(t) { document.getElementById('status').textContent = t; }
  function makeCode() { return Math.random().toString(36).slice(2, 7).toUpperCase(); }
  function escapeHtml(s) { return s.replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch])); }
}
