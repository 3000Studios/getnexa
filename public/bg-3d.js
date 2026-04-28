import * as THREE from 'https://unpkg.com/three@0.152.2/build/three.module.js';

let scene, camera, renderer, controllers = [];
let scrollY = 0;

function createController() {
  const group = new THREE.Group();
  
  // Body
  const bodyGeo = new THREE.CapsuleGeometry(2, 4, 4, 16);
  const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.9, roughness: 0.1, transparent: true, opacity: 0.2 });
  const body = new THREE.Mesh(bodyGeo, mat);
  body.rotation.z = Math.PI / 2;
  group.add(body);
  
  // Buttons (spheres)
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
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  
  const canvas = renderer.domElement;
  canvas.id = 'bg-3d';
  document.body.prepend(canvas);

  scene.add(new THREE.AmbientLight(0xffffff, 0.2));
  const light = new THREE.DirectionalLight(0xffffff, 1);
  light.position.set(10, 20, 10);
  scene.add(light);

  // Create Cluster
  for (let i = 0; i < 15; i++) {
    const ctrl = createController();
    ctrl.position.set(
      (Math.random() - 0.5) * 100,
      (Math.random() - 0.5) * 100,
      (Math.random() - 0.5) * 50 - 20
    );
    ctrl.userData = {
      rotX: Math.random() * 0.01,
      rotY: Math.random() * 0.01,
      speed: Math.random() * 0.005 + 0.002
    };
    scene.add(ctrl);
    controllers.push(ctrl);
  }

  camera.position.z = 50;

  function animate() {
    requestAnimationFrame(animate);
    controllers.forEach(c => {
      c.rotation.x += c.userData.rotX;
      c.rotation.y += c.userData.rotY;
      c.position.y += Math.sin(Date.now() * 0.001 * c.userData.speed) * 0.05;
      
      // Parallax scroll
      c.position.y -= (scrollY * 0.02) * (c.position.z / 50);
    });
    renderer.render(scene, camera);
  }
  animate();

  window.addEventListener('scroll', () => {
    scrollY = window.scrollY;
  });

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
}

export function setRoute(path) {
  // We keep the cluster for all pages but can change light colors
  const hue = Math.random();
  scene.children.forEach(c => {
    if (c instanceof THREE.DirectionalLight) {
      c.color.setHSL(hue, 0.5, 0.5);
    }
  });
}
