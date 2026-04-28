import * as THREE from 'https://unpkg.com/three@0.152.2/build/three.module.js';

let scene, camera, renderer, particles, controllers = [];
let scrollY = 0;

function createController() {
  const group = new THREE.Group();
  const bodyGeo = new THREE.CapsuleGeometry(2, 4, 4, 16);
  const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.9, roughness: 0.1, transparent: true, opacity: 0.1 });
  const body = new THREE.Mesh(bodyGeo, mat);
  body.rotation.z = Math.PI / 2;
  group.add(body);
  const btnGeo = new THREE.SphereGeometry(0.5, 16, 16);
  const btnMat = new THREE.MeshStandardMaterial({ color: 0x00f3ff, emissive: 0x00f3ff, emissiveIntensity: 2 });
  for (let i = 0; i < 4; i++) {
    const btn = new THREE.Mesh(btnGeo, btnMat);
    btn.position.set(2, 1, (i - 1.5) * 1);
    group.add(btn);
  }
  return group;
}

export function mountBackground() {
  if (scene) return;
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  
  const canvas = renderer.domElement;
  canvas.id = 'bg-3d';
  document.body.prepend(canvas);

  scene.add(new THREE.AmbientLight(0xffffff, 0.2));
  const light = new THREE.PointLight(0x00f3ff, 1, 500);
  light.position.set(50, 50, 50);
  light.name = 'adaptiveLight';
  scene.add(light);

  // Nebula Particles
  const geo = new THREE.BufferGeometry();
  const pos = [];
  for (let i = 0; i < 5000; i++) {
    pos.push((Math.random() - 0.5) * 1000, (Math.random() - 0.5) * 1000, (Math.random() - 0.5) * 1000);
  }
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  const pMat = new THREE.PointsMaterial({ size: 2, color: 0x00f3ff, transparent: true, opacity: 0.5 });
  particles = new THREE.Points(geo, pMat);
  scene.add(particles);

  // Cluster
  for (let i = 0; i < 15; i++) {
    const ctrl = createController();
    ctrl.position.set((Math.random() - 0.5) * 200, (Math.random() - 0.5) * 200, (Math.random() - 0.5) * 100 - 50);
    ctrl.userData = { rotX: Math.random() * 0.01, rotY: Math.random() * 0.01, speed: Math.random() * 0.005 + 0.002 };
    scene.add(ctrl);
    controllers.push(ctrl);
  }

  camera.position.z = 100;

  function animate() {
    requestAnimationFrame(animate);
    if (particles) {
      particles.rotation.y += 0.0005;
      particles.rotation.x += 0.0002;
    }
    controllers.forEach(c => {
      c.rotation.x += c.userData.rotX;
      c.rotation.y += c.userData.rotY;
      c.position.y -= (scrollY * 0.01) * (c.position.z / 100);
    });
    renderer.render(scene, camera);
  }
  animate();

  window.addEventListener('scroll', () => { scrollY = window.scrollY; });
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
}

export function setRoute(path) {
  // Global color shift logic
}

export function setAdaptiveTheme(hexColor) {
  const light = scene.getObjectByName('adaptiveLight');
  if (light && typeof gsap !== 'undefined') {
    gsap.to(light.color, { r: ((hexColor >> 16) & 0xFF) / 255, g: ((hexColor >> 8) & 0xFF) / 255, b: (hexColor & 0xFF) / 255, duration: 1.5 });
    if (particles) gsap.to(particles.material.color, { r: ((hexColor >> 16) & 0xFF) / 255, g: ((hexColor >> 8) & 0xFF) / 255, b: (hexColor & 0xFF) / 255, duration: 1.5 });
  }
}
