import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// ====== Referencias DOM ======
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

// ====== Escena Three.js ======
const viewport = document.getElementById('viewport');

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0d0d15);

const camera = new THREE.PerspectiveCamera(
  55,
  viewport.clientWidth / viewport.clientHeight,
  0.1,
  1000
);
camera.position.set(8, 6, 10);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(viewport.clientWidth, viewport.clientHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
viewport.appendChild(renderer.domElement);

// Controles orbitales
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.target.set(0, 1.3, 0);

// ====== Luces ======
const ambient = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambient);

const dir = new THREE.DirectionalLight(0xffffff, 1.2);
dir.position.set(10, 15, 8);
dir.castShadow = true;
dir.shadow.mapSize.set(1024, 1024);
scene.add(dir);

const fill = new THREE.DirectionalLight(0xa0c0ff, 0.4);
fill.position.set(-8, 6, -6);
scene.add(fill);

// ====== Piso (helper) ======
const grid = new THREE.GridHelper(40, 40, 0x2a2a40, 0x1a1a28);
scene.add(grid);

// ====== Grupo de la habitación (se reconstruye al cambiar medidas) ======
const habitacionGroup = new THREE.Group();
scene.add(habitacionGroup);

let paredes = [];
let pisoMesh = null;

/**
 * Construye (o reconstruye) la habitación a partir de las medidas.
 * El piso se centra en el origen y las paredes se levantan alrededor.
 */
function construirHabitacion({ largo, ancho, alto, colorPared }) {
  // Limpiar grupo anterior
  while (habitacionGroup.children.length > 0) {
    const obj = habitacionGroup.children.pop();
    obj.geometry?.dispose?.();
    obj.material?.dispose?.();
  }
  paredes = [];

  const halfL = largo / 2;
  const halfA = ancho / 2;

  // --- Piso ---
  const pisoGeo = new THREE.BoxGeometry(largo, 0.05, ancho);
  const pisoMat = new THREE.MeshStandardMaterial({
    color: 0x6b5b4b,
    roughness: 0.9
  });
  pisoMesh = new THREE.Mesh(pisoGeo, pisoMat);
  pisoMesh.position.y = -0.025;
  pisoMesh.receiveShadow = true;
  habitacionGroup.add(pisoMesh);

  // --- Material de paredes ---
  const paredMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(colorPared),
    roughness: 0.85,
    side: THREE.DoubleSide
  });

  const grosor = 0.08;

  // Definición de las 4 paredes:
  // [posición, rotación Y, ancho de la pared (X), alto, profundidad]
  const paredDefs = [
    // Pared trasera (a lo largo del eje X)
    { pos: [0, alto / 2, -halfA], rotY: 0, w: largo, h: alto, d: grosor },
    // Pared frontal
    { pos: [0, alto / 2, halfA], rotY: 0, w: largo, h: alto, d: grosor },
    // Pared izquierda (a lo largo del eje Z)
    { pos: [-halfL, alto / 2, 0], rotY: Math.PI / 2, w: ancho, h: alto, d: grosor },
    // Pared derecha
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
    paredes.push(mesh);
  });

  // Ajustar cámara/controles al tamaño
  const maxDim = Math.max(largo, ancho, alto);
  camera.position.set(maxDim * 1.4, maxDim * 1.1, maxDim * 1.7);
  controls.target.set(0, alto / 2, 0);
  controls.update();
}

/**
 * Lee los valores actuales de los inputs y los devuelve como objeto.
 */
function leerMedidas() {
  return {
    largo: parseFloat(inputs.largo.value) || 1,
    ancho: parseFloat(inputs.ancho.value) || 1,
    alto: parseFloat(inputs.alto.value) || 1,
    colorPared: inputs.colorPared.value
  };
}

/**
 * Actualiza el texto de área y volumen.
 */
function actualizarInfo({ largo, ancho, alto }) {
  areaEl.textContent = (largo * ancho).toFixed(2);
  volumenEl.textContent = (largo * ancho * alto).toFixed(2);
}

/**
 * Reconstruye la escena con los valores actuales.
 */
function actualizarEscena() {
  const medidas = leerMedidas();
  construirHabitacion(medidas);
  actualizarInfo(medidas);
}

// ====== Eventos: actualización en tiempo real ======
Object.values(inputs).forEach((input) => {
  input.addEventListener('input', actualizarEscena);
});

// ====== Guardar en el backend (Node.js) ======
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

// ====== Cargar medidas iniciales desde el backend ======
async function cargarInicial() {
  try {
    const res = await fetch('/api/habitacion');
    const data = await res.json();
    inputs.largo.value = data.largo;
    inputs.ancho.value = data.ancho;
    inputs.alto.value = data.alto;
    inputs.colorPared.value = data.colorPared;
  } catch (e) {
    // Si falla, usa los valores por defecto del HTML
  }
  actualizarEscena();
}

// ====== Resize ======
window.addEventListener('resize', () => {
  const w = viewport.clientWidth;
  const h = viewport.clientHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
});

// ====== Loop de render ======
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}

// ====== Inicio ======
cargarInicial();
animate();