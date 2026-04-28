import { h, render, route, api, state, toast, AdSlot } from './core.js';
import { sfx } from './sfx.js';

// Global interaction to unlock audio
window.addEventListener('mousedown', () => sfx.startAmbient(), { once: true });
window.addEventListener('keydown', () => sfx.startAmbient(), { once: true });

// Check core.js for real content
