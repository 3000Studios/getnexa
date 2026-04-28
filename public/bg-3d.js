import * as THREE from 'https://unpkg.com/three@0.152.2/build/three.module.js';

let scene, camera, renderer, object;
let currentPath = '';

const GEOMETRIES = [
  () => new THREE.TorusKnotGeometry(12, 1.5, 150, 20),
  () => new THREE.IcosahedronGeometry(15, 0),
  () => new THREE.SphereGeometry(15, 64, 64),
  () => new THREE.TorusGeometry(12, 3, 30, 200),
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

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
  scene.add(ambientLight);
  
  const light1 = new THREE.DirectionalLight(0xffffff, 0.8);
  light1.position.set(10, 20, 10);
  scene.add(light1);

  const light2 = new THREE.PointLight(0xd4af37, 1); // Gold light
  light2.position.set(-20, -20, 20);
  scene.add(light2);

  camera.position.z = 45;

  function animate() {
    requestAnimationFrame(animate);
    if (object) {
      object.rotation.y += 0.005;
      object.rotation.x += 0.002;
    }
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

  let hash = 0;
  for (let i = 0; i < path.length; i++) hash = path.charCodeAt(i) + ((hash << 5) - hash);
  const geoIdx = Math.abs(hash) % GEOMETRIES.length;

  const geometry = GEOMETRIES[geoIdx]();
  const material = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    metalness: 0.9,
    roughness: 0.1,
    transparent: true,
    opacity: 0.4,
  });

  object = new THREE.Mesh(geometry, material);
  scene.add(object);
}
