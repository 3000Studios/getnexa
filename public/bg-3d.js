// Full-screen WebGL background - unique per route via a seed hash.
// Pure WebGL (no libs), ~3KB, 60fps, animates subtly behind content.

const VERT = `
  attribute vec2 p;
  void main() { gl_Position = vec4(p, 0.0, 1.0); }
`;

const FRAG = `
  precision highp float;
  uniform vec2  uRes;
  uniform float uTime;
  uniform float uSeed;
  uniform vec3  uC1;
  uniform vec3  uC2;
  uniform vec3  uC3;
  uniform float uMode;

  // Hash / noise
  float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p){
    vec2 i = floor(p), f = fract(p);
    float a = hash(i), b = hash(i + vec2(1,0)), c = hash(i + vec2(0,1)), d = hash(i + vec2(1,1));
    vec2 u = f*f*(3.0-2.0*f);
    return mix(mix(a,b,u.x), mix(c,d,u.x), u.y);
  }
  float fbm(vec2 p){
    float v = 0.0, a = 0.5;
    for(int i = 0; i < 5; i++){ v += a * noise(p); p *= 2.02; a *= 0.5; }
    return v;
  }

  // 2D rotation
  mat2 rot(float a){ float s = sin(a), c = cos(a); return mat2(c,-s,s,c); }

  void main(){
    vec2 uv = (gl_FragCoord.xy - 0.5*uRes) / min(uRes.x, uRes.y);
    float t = uTime * 0.06 + uSeed * 10.0;

    // gradient mesh base
    vec2 q = uv;
    q *= rot(t * 0.15);
    float f = fbm(q * 1.3 + vec2(t * 0.2, -t * 0.15));
    float g = fbm(q * 2.6 - vec2(t * 0.1, t * 0.3));

    // concentric ripples from a moving center
    vec2 ctr = vec2(sin(t * 0.4 + uSeed) * 0.4, cos(t * 0.37 + uSeed * 1.3) * 0.3);
    float d = length(uv - ctr);
    float ring = smoothstep(0.02, 0.0, abs(sin(d * 18.0 - t * 1.2)) - 0.92);

    // color mix
    vec3 col = mix(uC1, uC2, clamp(f * 1.2, 0.0, 1.0));
    col = mix(col, uC3, clamp(g * g * 1.5, 0.0, 1.0));

    // mode 0: gradient mesh (default)
    // mode 1: synthwave grid tint
    // mode 2: nebula + stars
    if (uMode > 0.5 && uMode < 1.5) {
      // subtle grid wash
      vec2 gv = uv * 20.0;
      gv.y += t * 2.0;
      vec2 gf = abs(fract(gv) - 0.5);
      float line = smoothstep(0.48, 0.5, 1.0 - min(gf.x, gf.y));
      col += line * uC3 * 0.15 * smoothstep(0.2, -0.5, uv.y);
    } else if (uMode > 1.5) {
      // stars
      vec2 sp = uv * 80.0 + uSeed * 100.0;
      float s = step(0.998, hash(floor(sp)));
      col += s * (0.6 + 0.4 * sin(uTime * 4.0 + hash(floor(sp)) * 6.28));
    }

    col += ring * mix(uC2, uC3, 0.5) * 0.5;

    // vignette
    float v = smoothstep(1.3, 0.2, length(uv));
    col *= v;

    // soft fade so text above is always readable
    col *= 0.55;

    gl_FragColor = vec4(col, 1.0);
  }
`;

const PALETTES = [
  // each: [color1, color2, color3, mode]
  { a: [0.06, 0.08, 0.18], b: [0.49, 0.36, 1.00], c: [0.14, 0.82, 0.63], m: 0 }, // violet/mint
  { a: [0.04, 0.02, 0.12], b: [1.00, 0.36, 0.71], c: [0.36, 0.56, 1.00], m: 1 }, // pink/blue synthwave
  { a: [0.05, 0.10, 0.08], b: [0.14, 0.82, 0.63], c: [1.00, 0.69, 0.13], m: 0 }, // mint/gold
  { a: [0.02, 0.04, 0.14], b: [0.36, 0.56, 1.00], c: [1.00, 0.36, 0.42], m: 2 }, // nebula
  { a: [0.07, 0.04, 0.10], b: [0.72, 0.29, 1.00], c: [0.14, 0.80, 0.90], m: 0 }, // electric purple / cyan
];

function hashSeed(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return ((h >>> 0) / 4294967295);
}

let state = null;

export function mountBackground() {
  if (state) return; // already mounted, just switch scene on route
  const canvas = document.createElement('canvas');
  canvas.id = 'bg-3d';
  Object.assign(canvas.style, {
    position: 'fixed', inset: '0', width: '100%', height: '100%',
    zIndex: '-1', pointerEvents: 'none',
  });
  document.body.prepend(canvas);

  const gl = canvas.getContext('webgl', { antialias: false, alpha: false, preserveDrawingBuffer: false });
  if (!gl) return;

  function compile(type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      console.warn(gl.getShaderInfoLog(s));
      gl.deleteShader(s); return null;
    }
    return s;
  }
  const vs = compile(gl.VERTEX_SHADER, VERT);
  const fs = compile(gl.FRAGMENT_SHADER, FRAG);
  if (!vs || !fs) return;
  const prog = gl.createProgram();
  gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { console.warn(gl.getProgramInfoLog(prog)); return; }
  gl.useProgram(prog);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'p');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

  const uRes = gl.getUniformLocation(prog, 'uRes');
  const uTime = gl.getUniformLocation(prog, 'uTime');
  const uSeed = gl.getUniformLocation(prog, 'uSeed');
  const uC1 = gl.getUniformLocation(prog, 'uC1');
  const uC2 = gl.getUniformLocation(prog, 'uC2');
  const uC3 = gl.getUniformLocation(prog, 'uC3');
  const uMode = gl.getUniformLocation(prog, 'uMode');

  let current = { seed: 0, palette: PALETTES[0], target: null, start: 0 };

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    canvas.width = Math.floor(window.innerWidth * dpr);
    canvas.height = Math.floor(window.innerHeight * dpr);
    gl.viewport(0, 0, canvas.width, canvas.height);
  }
  window.addEventListener('resize', resize);
  resize();

  let running = true;
  let start = performance.now();

  function render(ts) {
    if (!running) return;
    const t = (ts - start) / 1000;
    gl.uniform2f(uRes, canvas.width, canvas.height);
    gl.uniform1f(uTime, t);
    gl.uniform1f(uSeed, current.seed);
    gl.uniform3fv(uC1, current.palette.a);
    gl.uniform3fv(uC2, current.palette.b);
    gl.uniform3fv(uC3, current.palette.c);
    gl.uniform1f(uMode, current.palette.m);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    requestAnimationFrame(render);
  }
  requestAnimationFrame(render);

  // pause when tab hidden
  document.addEventListener('visibilitychange', () => {
    running = !document.hidden;
    if (running) requestAnimationFrame(render);
  });

  state = {
    setRoute(path) {
      const seed = hashSeed(path || '/');
      const pal = PALETTES[Math.floor(seed * PALETTES.length) % PALETTES.length];
      current.seed = seed;
      current.palette = pal;
    },
  };
}

export function setRoute(path) {
  if (state) state.setRoute(path);
}
