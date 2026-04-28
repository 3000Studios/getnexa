import * as THREE from 'https://unpkg.com/three@0.152.2/build/three.module.js';

let scene, camera, renderer, object;
let currentPath = '';

const GEOMETRIES = [
  () => new THREE.TorusKnotGeometry(10, 3, 100, 16),
  () => new THREE.DodecahedronGeometry(12),
  () => new THREE.OctahedronGeometry(15),
  () => new THREE.IcosahedronGeometry(12),
  () => new THREE.TorusGeometry(10, 4, 16, 100),
  () => new THREE.CapsuleGeometry(8, 8, 4, 8),
];

const PALETTES = [
  { bg: 0x05091a, obj: 0x7c5cff }, // Purple
  { bg: 0x0a1e15, obj: 0x24d1a1 }, // Mint
  { bg: 0x1e0a0a, obj: 0xff5b6b }, // Red
  { bg: 0x1e1e0a, obj: 0xffb020 }, // Gold
  { bg: 0x0a1e1e, obj: 0x00d1ff }, // Cyan
  { bg: 0x150a1e, obj: 0xff00ff }, // Magenta
];

export function mountBackground() {
  if (scene) return;
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  
  const canvas = renderer.domElement;
  canvas.id = 'bg-3d';
  document.body.prepend(canvas);

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);
  const pointLight = new THREE.PointLight(0xffffff, 1);
  pointLight.position.set(20, 20, 20);
  scene.add(pointLight);

  camera.position.z = 40;

  function animate() {
    requestAnimationFrame(animate);
    if (object) {
      object.rotation.x += 0.01;
      object.rotation.y += 0.015;
      
      // Color cycle for the object
      if (object.material.color) {
        const time = Date.now() * 0.001;
        object.material.emissiveIntensity = 0.5 + Math.sin(time) * 0.5;
      }
    }
    // Background color animation
    const time = Date.now() * 0.0005;
    const r = (Math.sin(time) * 0.1 + 0.05);
    const g = (Math.sin(time + 2) * 0.1 + 0.05);
    const b = (Math.sin(time + 4) * 0.1 + 0.1);
    renderer.setClearColor(new THREE.Color(r, g, b), 1);

    renderer.render(scene, camera);
  }
  animate();

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
}

export function setRoute(path) {
  if (path === currentPath) return;
  currentPath = path;
  
  if (object) {
    scene.remove(object);
    object.geometry.dispose();
    object.material.dispose();
  }

  // Pick unique geometry and color based on path string hash
  let hash = 0;
  for (let i = 0; i < path.length; i++) {
    hash = path.charCodeAt(i) + ((hash << 5) - hash);
  }
  const geoIdx = Math.abs(hash) % GEOMETRIES.length;
  const palIdx = Math.abs(hash) % PALETTES.length;

  const geometry = GEOMETRIES[geoIdx]();
  const material = new THREE.MeshPhongMaterial({
    color: PALETTES[palIdx].obj,
    emissive: PALETTES[palIdx].obj,
    specular: 0xffffff,
    shininess: 100,
    wireframe: true,
  });

  object = new THREE.Mesh(geometry, material);
  scene.add(object);
}
