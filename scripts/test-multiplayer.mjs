const base = process.argv[2] || 'ws://127.0.0.1:8788';
const room = `smoke-${Date.now()}`;
const url = `${base}/api/mp/nexa-arena-3d/${room}`;

function connect() {
  return new Promise((resolve, reject) => {
    const socket = new WebSocket(url);
    const timer = setTimeout(() => reject(new Error('WebSocket welcome timeout')), 5000);
    socket.addEventListener('message', (event) => {
      const message = JSON.parse(event.data);
      if (message.type === 'welcome') {
        clearTimeout(timer);
        resolve(socket);
      }
    });
    socket.addEventListener('error', () => reject(new Error('WebSocket connection failed')), { once: true });
  });
}

const [first, second] = await Promise.all([connect(), connect()]);
const started = new Promise((resolve, reject) => {
  const timer = setTimeout(() => reject(new Error('Multiplayer start timeout')), 5000);
  second.addEventListener('message', (event) => {
    const message = JSON.parse(event.data);
    if (message.type === 'start') {
      clearTimeout(timer);
      resolve(message);
    }
  });
});
first.send(JSON.stringify({ type: 'ready', ready: true }));
second.send(JSON.stringify({ type: 'ready', ready: true }));
await started;
first.close();
second.close();
console.log(`Multiplayer smoke test passed: ${room}`);
