// Advanced Web Audio UI Sound System
const ctx = new (window.AudioContext || window.webkitAudioContext)();
let ambientOsc = null;

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
  hover: () => playTone(120, 'sine', 0.2, 0.05), // Low "thud"
  click: () => playTone(440, 'triangle', 0.15, 0.1),
  transition: () => {
    const dur = 0.8;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.setValueAtTime(40, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + dur);
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + dur);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + dur);
  },
  startAmbient: () => {
    if (ambientOsc) return;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.02, ctx.currentTime);
    
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.1;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 5;
    lfo.connect(lfoGain);
    
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = 60; // Deep hum
    lfoGain.connect(osc.frequency);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    ambientOsc = osc;
  }
};

export function attachSfx(el) {
  el.addEventListener('mouseenter', () => sfx.hover());
  el.addEventListener('mousedown', () => sfx.click());
}
