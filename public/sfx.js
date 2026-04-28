// Advanced Web Audio UI Sound System
const ctx = new (window.AudioContext || window.webkitAudioContext)();

function playTone(freq, type, duration, volume = 0.1) {
  if (ctx.state === 'suspended') ctx.resume();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  
  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(freq * 0.5, ctx.currentTime + duration);
  
  gain.gain.setValueAtTime(volume, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
  
  osc.connect(gain);
  gain.connect(ctx.destination);
  
  osc.start();
  osc.stop(ctx.currentTime + duration);
}

export const sfx = {
  hover: () => playTone(880, 'sine', 0.1, 0.05),
  click: () => playTone(440, 'triangle', 0.15, 0.1),
  transition: () => {
    const dur = 0.5;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.setValueAtTime(100, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(1000, ctx.currentTime + dur);
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + dur);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + dur);
  },
  glitch: () => {
    for (let i = 0; i < 5; i++) {
      setTimeout(() => playTone(Math.random() * 1000 + 500, 'square', 0.05, 0.02), i * 30);
    }
  }
};

export function attachSfx(el) {
  el.addEventListener('mouseenter', () => sfx.hover());
  el.addEventListener('mousedown', () => sfx.click());
}
