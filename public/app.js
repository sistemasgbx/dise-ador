import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const inputs = {
  largo: document.getElementById('largo'),
  ancho: document.getElementById('ancho'),
  alto: document.getElementById('alto'),
  colorPared: document.getElementById('colorPared')
};
const areaEl = document.getElementById('area');
const volumenEl = document.getElementById('volumen');
const statusEl = document.getElementById('status');
const btnGuardar = document.getElementById('guardar');
const viewport = document.getElementById('viewport');

// Three.js Setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0d0d15);
const camera = new THREE.PerspectiveCamera(55, viewport.clientWidth / viewport.clientHeight, 0.1, 1000);
camera.position.set(8, 6, 10);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(viewport.clientWidth, viewport.clientHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
viewport.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.target.set(0, 1.3, 0);

// Luces
scene.add(new THREE.AmbientLight(0xffffff, 0.6));
const dir = new THREE.DirectionalLight(0xffffff, 1.2);
dir.position.set(10, 15, 8);
dir.castShadow = true;
dir.shadow.mapSize.set(1024, 1024);
scene.add(dir);
const fill = new THREE.DirectionalLight(0xa0c0ff, 0.4);
fill.position.set(-8, 6, -6);
scene.add(fill);

// Grid y Grupo
const grid = new THREE.GridHelper(40, 40, 0x2a2a40, 0x1a1a28);
scene.add(grid);
const habitacionGroup = new THREE.Group();
scene.add(habitacionGroup);

function construirHabitacion({ largo, ancho, alto, colorPared }) {
  while (habitacionGroup.children.length > 0) {
    const obj = habitacionGroup.children.pop();
    obj.geometry?.dispose?.();
    obj.material?.dispose?.();
  }

  const halfL = largo / 2;
  const halfA = ancho / 2;

  // Piso
  const pisoGeo = new THREE.BoxGeometry(largo, 0.05, ancho);
  const pisoMat = new THREE.MeshStandardMaterial({ color: 0x6b5b4b, roughness: 0.9 });
  const pisoMesh = new THREE.Mesh(pisoGeo, pisoMat);
  pisoMesh.position.y = -0.025;
  pisoMesh.receiveShadow = true;
  habitacionGroup.add(pisoMesh);

  // Paredes
  const paredMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(colorPared), roughness: 0.85, side: THREE.DoubleSide
  });
  const grosor = 0.08;
  const paredDefs = [
    { pos: [0, alto / 2, -halfA], rotY: 0, w: largo, h: alto, d: grosor },
    { pos: [0, alto / 2, halfA], rotY: 0, w: largo, h: alto, d: grosor },
    { pos: [-halfL, alto / 2, 0], rotY: Math.PI / 2, w: ancho, h: alto, d: grosor },
    { pos: [halfL, alto / 2, 0], rotY: Math.PI / 2, w: ancho, h: alto, d: grosor }
  ];

  paredDefs.forEach((def) => {
    const geo = new THREE.BoxGeometry(def.w, def.h, def.d);
    const mesh = new THREE.Mesh(geo, paredMat.clone());
    mesh.position.set(...def.pos);
    mesh.rotation.y = def.rotY;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    habitacionGroup.add(mesh);
  });

  const maxDim = Math.max(largo, ancho, alto);
  camera.position.set(maxDim * 1.4, maxDim * 1.1, maxDim * 1.7);
  controls.target.set(0, alto / 2, 0);
  controls.update();
}

function leerMedidas() {
  return {
    largo: parseFloat(inputs.largo.value) || 1,
    ancho: parseFloat(inputs.ancho.value) || 1,
    alto: parseFloat(inputs.alto.value) || 1,
    colorPared: inputs.colorPared.value
  };
}

function actualizarEscena() {
  const medidas = leerMedidas();
  construirHabitacion(medidas);
  areaEl.textContent = (medidas.largo * medidas.ancho).toFixed(2);
  volumenEl.textContent = (medidas.largo * medidas.ancho * medidas.alto).toFixed(2);
}

Object.values(inputs).forEach((input) => input.addEventListener('input', actualizarEscena));

btnGuardar.addEventListener('click', async () => {
  const medidas = leerMedidas();
  statusEl.textContent = 'Guardando...';
  statusEl.classList.remove('error');

  try {
    const res = await fetch('/api/habitacion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(medidas)
    });
    const data = await res.json();
    if (!res.ok) {
      statusEl.textContent = '❌ ' + (data.errores?.join(', ') || 'Error');
      statusEl.classList.add('error');
      return;
    }
    statusEl.textContent = '✅ Guardado correctamente';
  } catch (err) {
    statusEl.textContent = '❌ Error de conexión';
    statusEl.classList.add('error');
  }
});

async function cargarInicial() {
  try {
    const res = await fetch('/api/habitacion');
    const data = await res.json();
    inputs.largo.value = data.largo;
    inputs.ancho.value = data.ancho;
    inputs.alto.value = data.alto;
    inputs.colorPared.value = data.colorPared;
  } catch (e) {}
  actualizarEscena();
}

window.addEventListener('resize', () => {
  const w = viewport.clientWidth;
  const h = viewport.clientHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
});

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}

cargarInicial();
animate();