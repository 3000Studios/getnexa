// Durable Object that hosts a multiplayer game room.
// Manages WebSocket sessions and relays/validates game messages.
// Supports small turn-based games (tic-tac-toe) and action games (pong-lite relay).

interface Env {}

interface Player {
  socket: WebSocket;
  userId?: number;
  username: string;
  ready: boolean;
}

export class GameRoom {
  state: DurableObjectState;
  players: Map<string, Player> = new Map();
  gameId: string = '';
  roomId: string = '';
  started: boolean = false;
  gameState: any = null;
  lastTick: number = 0;
  tickInterval: any = null;

  constructor(state: DurableObjectState, _env: Env) {
    this.state = state;
  }

  async fetch(req: Request): Promise<Response> {
    const url = new URL(req.url);
    this.gameId = url.searchParams.get('gameId') || 'unknown';
    this.roomId = url.searchParams.get('roomId') || 'lobby';
    const username = url.searchParams.get('username') || 'Guest';
    const userIdStr = url.searchParams.get('userId');
    const userId = userIdStr ? parseInt(userIdStr, 10) : undefined;

    if (req.headers.get('Upgrade') !== 'websocket') {
      return new Response(JSON.stringify({
        gameId: this.gameId, roomId: this.roomId,
        players: [...this.players.values()].map(p => ({ username: p.username })),
        started: this.started,
      }), { headers: { 'Content-Type': 'application/json' } });
    }

    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);
    server.accept();

    const pid = crypto.randomUUID();
    const player: Player = { socket: server, userId, username, ready: false };
    this.players.set(pid, player);

    this.broadcast({ type: 'presence', players: this.publicPlayers() });
    server.send(JSON.stringify({ type: 'welcome', pid, gameId: this.gameId, roomId: this.roomId, players: this.publicPlayers() }));

    server.addEventListener('message', (ev) => {
      let msg: any = null;
      try { msg = JSON.parse(ev.data as string); } catch { return; }
      this.handleMessage(pid, msg);
    });

    const onClose = () => {
      this.players.delete(pid);
      this.broadcast({ type: 'presence', players: this.publicPlayers() });
      if (this.players.size === 0) {
        this.started = false;
        this.gameState = null;
        if (this.tickInterval) {
          clearInterval(this.tickInterval);
          this.tickInterval = null;
        }
      }
    };
    server.addEventListener('close', onClose);
    server.addEventListener('error', onClose);

    return new Response(null, { status: 101, webSocket: client });
  }

  publicPlayers() {
    return [...this.players.values()].map(p => ({ username: p.username, ready: p.ready }));
  }

  broadcast(msg: any, exclude?: string) {
    const s = JSON.stringify(msg);
    for (const [pid, p] of this.players) {
      if (pid === exclude) continue;
      try { p.socket.send(s); } catch {}
    }
  }

  sendTo(pid: string, msg: any) {
    const p = this.players.get(pid);
    if (!p) return;
    try { p.socket.send(JSON.stringify(msg)); } catch {}
  }

  handleMessage(pid: string, msg: any) {
    if (!msg || typeof msg !== 'object') return;
    const player = this.players.get(pid);
    if (!player) return;

    switch (msg.type) {
      case 'chat': {
        const text = (msg.text || '').toString().slice(0, 200);
        this.broadcast({ type: 'chat', from: player.username, text, ts: Date.now() });
        return;
      }
      case 'ready': {
        player.ready = !!msg.ready;
        this.broadcast({ type: 'presence', players: this.publicPlayers() });
        const allReady = [...this.players.values()].length >= 2 && [...this.players.values()].every(p => p.ready);
        if (allReady && !this.started) this.startGame();
        return;
      }
      case 'move': {
        if (!this.started) return;
        this.handleMove(pid, msg);
        return;
      }
      case 'relay': {
        // For action games: just relay authoritative-ish state from host
        this.broadcast({ type: 'relay', from: player.username, payload: msg.payload }, pid);
        return;
      }
      case 'reset': {
        this.started = false;
        this.gameState = null;
        if (this.tickInterval) clearInterval(this.tickInterval);
        this.tickInterval = null;
        for (const p of this.players.values()) p.ready = false;
        this.broadcast({ type: 'reset' });
        this.broadcast({ type: 'presence', players: this.publicPlayers() });
        return;
      }
    }
  }

  startGame() {
    this.started = true;
    const pids = [...this.players.keys()];
    if (this.gameId === 'tictactoe') {
      this.gameState = {
        board: Array(9).fill(null),
        turn: 'X',
        assignments: { [pids[0]]: 'X', [pids[1]]: 'O' },
        winner: null,
      };
      for (const pid of pids) {
        this.sendTo(pid, { type: 'start', symbol: this.gameState.assignments[pid], turn: this.gameState.turn, board: this.gameState.board });
      }
    } else if (this.gameId === 'pong') {
      this.gameState = {
        p1: { pid: pids[0], y: 160, score: 0 },
        p2: { pid: pids[1], y: 160, score: 0 },
        ball: { x: 300, y: 200, vx: 4, vy: 2 },
        w: 600, h: 400,
        padH: 80, padW: 10,
        winner: null,
      };
      for (const pid of pids) {
        this.sendTo(pid, { type: 'start', side: pid === pids[0] ? 'left' : 'right' });
      }
      this.lastTick = Date.now();
      if (this.tickInterval) clearInterval(this.tickInterval);
      this.tickInterval = setInterval(() => this.tickPong(), 33); // ~30fps authoritative update
    } else {
      this.broadcast({ type: 'start', gameId: this.gameId });
    }
  }

  tickPong() {
    if (!this.started || !this.gameState) return;
    const s = this.gameState;
    const ball = s.ball;

    ball.x += ball.vx;
    ball.y += ball.vy;

    // Walls
    if (ball.y < 8 || ball.y > s.h - 8) ball.vy *= -1;

    // Paddles
    if (ball.x < s.padW + 8 && ball.y > s.p1.y && ball.y < s.p1.y + s.padH && ball.vx < 0) {
      ball.vx *= -1.05;
      ball.vy += (ball.y - (s.p1.y + s.padH / 2)) * 0.1;
    }
    if (ball.x > s.w - s.padW - 8 && ball.y > s.p2.y && ball.y < s.p2.y + s.padH && ball.vx > 0) {
      ball.vx *= -1.05;
      ball.vy += (ball.y - (s.p2.y + s.padH / 2)) * 0.1;
    }

    // Scoring
    if (ball.x < 0) {
      s.p2.score++;
      this.resetBall();
    } else if (ball.x > s.w) {
      s.p1.score++;
      this.resetBall();
    }

    if (s.p1.score >= 10 || s.p2.score >= 10) {
      s.winner = s.p1.score >= 10 ? 'p1' : 'p2';
      this.started = false;
      clearInterval(this.tickInterval);
      this.tickInterval = null;
    }

    this.broadcast({ type: 'state', ball: s.ball, p1y: s.p1.y, p2y: s.p2.y, p1s: s.p1.score, p2s: s.p2.score, winner: s.winner });
  }

  resetBall() {
    if (!this.gameState) return;
    this.gameState.ball = { x: 300, y: 200, vx: (Math.random() > 0.5 ? 4 : -4), vy: (Math.random() - 0.5) * 4 };
  }

  handleMove(pid: string, msg: any) {
    if (this.gameId === 'tictactoe') {
      const s = this.gameState;
      if (!s || s.winner) return;
      const symbol = s.assignments[pid];
      if (symbol !== s.turn) return;
      const i = parseInt(msg.index, 10);
      if (isNaN(i) || i < 0 || i > 8 || s.board[i]) return;
      s.board[i] = symbol;
      s.turn = symbol === 'X' ? 'O' : 'X';
      const wins = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
      for (const [a,b,c] of wins) {
        if (s.board[a] && s.board[a] === s.board[b] && s.board[a] === s.board[c]) {
          s.winner = s.board[a];
          break;
        }
      }
      if (!s.winner && s.board.every((v: any) => v)) s.winner = 'draw';
      this.broadcast({ type: 'state', board: s.board, turn: s.turn, winner: s.winner });
    } else if (this.gameId === 'pong') {
      const s = this.gameState;
      if (!s || !this.started) return;
      if (pid === s.p1.pid) s.p1.y = msg.y;
      else if (pid === s.p2.pid) s.p2.y = msg.y;
    }
  }
}
