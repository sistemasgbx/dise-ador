import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const inputs = {
  largo: document.getElementById('largo'),
  ancho: document.getElementById('ancho'),
  alto: document.getElementById('alto'),
  ala: document.getElementById('ala')
};
const viewport3D = document.getElementById('viewport-3d');
const svgContainer = document.getElementById('svg-container');
const btnDescargar = document.getElementById('btn-descargar');

// ==========================================
// 1. CONFIGURACIÓN THREE.JS (VISTA 3D)
// ==========================================
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0d0d15);

const camera = new THREE.PerspectiveCamera(45, viewport3D.clientWidth / viewport3D.clientHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(viewport3D.clientWidth, viewport3D.clientHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
viewport3D.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// Luces
scene.add(new THREE.AmbientLight(0xffffff, 0.6));
const dir = new THREE.DirectionalLight(0xffffff, 1.2);
dir.position.set(50, 80, 40);
dir.castShadow = true;
scene.add(dir);
const fill = new THREE.DirectionalLight(0xa0c0ff, 0.4);
fill.position.set(-50, 20, -40);
scene.add(fill);

const cajaGroup = new THREE.Group();
scene.add(cajaGroup);

// Textura simple de cartón corrugado (color)
const materialCarton = new THREE.MeshStandardMaterial({ 
  color: 0xc19a6b, 
  roughness: 0.8,
  side: THREE.DoubleSide
});

// ==========================================
// 2. LÓGICA DE DIBUJO (3D y 2D)
// ==========================================

function actualizarDiseno() {
  const L = parseFloat(inputs.largo.value) || 1;
  const A = parseFloat(inputs.ancho.value) || 1;
  const H = parseFloat(inputs.alto.value) || 1;
  const ala = parseFloat(inputs.ala.value) || 1;

  dibujarCaja3D(L, A, H, ala);
  dibujarPlano2D(L, A, H, ala);
}

// --- VISTA 3D (Caja Armada con pestañas) ---
function dibujarCaja3D(L, A, H, ala) {
  // Limpiar escena anterior
  while (cajaGroup.children.length > 0) {
    const obj = cajaGroup.children.pop();
    obj.geometry?.dispose?.();
  }

  // Cuerpo de la caja (sin tapas)
  const geo = new THREE.BoxGeometry(L, H, A);
  const mesh = new THREE.Mesh(geo, materialCarton);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  
  // Centrar la caja
  mesh.position.y = H / 2;
  cajaGroup.add(mesh);

  // Pestañas superiores (aletas)
  const grosorPestana = 0.2;
  
  // Pestaña Largo Superior 1
  const pLargo = new THREE.Mesh(new THREE.BoxGeometry(L, grosorPestana, ala), materialCarton);
  pLargo.position.set(0, H, A/2 + ala/2);
  pLargo.rotation.x = -Math.PI / 2;
  pLargo.castShadow = true;
  cajaGroup.add(pLargo);

  // Pestaña Largo Superior 2
  const pLargo2 = new THREE.Mesh(new THREE.BoxGeometry(L, grosorPestana, ala), materialCarton);
  pLargo2.position.set(0, H, -A/2 - ala/2);
  pLargo2.rotation.x = Math.PI / 2;
  pLargo2.castShadow = true;
  cajaGroup.add(pLargo2);

  // Pestaña Ancho Superior 1
  const pAncho = new THREE.Mesh(new THREE.BoxGeometry(ala, grosorPestana, A), materialCarton);
  pAncho.position.set(L/2 + ala/2, H, 0);
  pAncho.rotation.z = Math.PI / 2;
  pAncho.castShadow = true;
  cajaGroup.add(pAncho);

  // Pestaña Ancho Superior 2
  const pAncho2 = new THREE.Mesh(new THREE.BoxGeometry(ala, grosorPestana, A), materialCarton);
  pAncho2.position.set(-L/2 - ala/2, H, 0);
  pAncho2.rotation.z = -Math.PI / 2;
  pAncho2.castShadow = true;
  cajaGroup.add(pAncho2);

  // Cámara dinámica
  const maxDim = Math.max(L, A, H) * 2.5;
  camera.position.set(maxDim, maxDim, maxDim);
  controls.target.set(0, H/2, 0);
  controls.update();
}

// --- VISTA 2D (Plano de Corte Desdoblado / Dieline) ---
function dibujarPlano2D(L, A, H, ala) {
  // El desarrollo plano de una caja RSC tiene:
  // Ancho total = 2 * L + 2 * A
  // Alto total = H + 2 * ala (pestañas)
  
  const anchoTotal = (2 * L) + (2 * A);
  const altoTotal = H + (2 * ala);
  
  // Escalar para que quepa en el div
  const padding = 20;
  const viewBox = `${-padding} ${-padding} ${anchoTotal + (padding*2)} ${altoTotal + (padding*2)}`;

  // Empezamos a dibujar el SVG
  // Colores: Rojo = Corte (Cuchilla), Azul = Doblez (Rule)
  let svg = `<svg viewBox="${viewBox}" xmlns="http://www.w3.org/2000/svg">`;
  
  // Estilos CSS para el SVG
  svg += `
    <style>
      .corte { stroke: #e74c3c; stroke-width: 0.5; fill: none; }
      .doblez { stroke: #3498db; stroke-width: 0.5; stroke-dasharray: 2, 2; fill: none; }
      .texto { font-family: sans-serif; font-size: 3px; fill: #333; text-anchor: middle; dominant-baseline: middle; }
    </style>
  `;

  // Coordenadas iniciales
  const x0 = 0;
  const y0 = 0;

  // 1. Contorno exterior de la caja (Líneas de corte)
  // Empezamos por la pestaña superior izquierda
  svg += `<polyline class="corte" points="
    ${x0 + A},${y0} 
    ${x0 + A + L},${y0} 
    ${x0 + A + L},${y0 + ala} 
    ${x0 + A + L + A},${y0 + ala} 
    ${x0 + A + L + A},${y0} 
    ${x0 + A + L + A + L},${y0} 
    ${x0 + A + L + A + L},${y0 + ala} 
    ${x0 + A + L + A + L + A},${y0 + ala} 
    ${x0 + A + L + A + L + A},${y0 + ala + H} 
    ${x0 + A + L + A + L},${y0 + ala + H} 
    ${x0 + A + L + A + L},${y0 + ala + H + ala} 
    ${x0 + A + L + A},${y0 + ala + H + ala} 
    ${x0 + A + L + A},${y0 + ala + H} 
    ${x0 + A + L},${y0 + ala + H} 
    ${x0 + A + L},${y0 + ala + H + ala} 
    ${x0 + A},${y0 + ala + H + ala} 
    ${x0 + A},${y0 + ala + H} 
    ${x0},${y0 + ala + H} 
    ${x0},${y0 + ala} 
    ${x0 + A},${y0 + ala} 
    ${x0 + A},${y0} 
  " />`;

  // 2. Líneas de doblez verticales
  svg += `<line class="doblez" x1="${x0 + A}" y1="${y0 + ala}" x2="${x0 + A}" y2="${y0 + ala + H}" />`;
  svg += `<line class="doblez" x1="${x0 + A + L}" y1="${y0 + ala}" x2="${x0 + A + L}" y2="${y0 + ala + H}" />`;
  svg += `<line class="doblez" x1="${x0 + A + L + A}" y1="${y0 + ala}" x2="${x0 + A + L + A}" y2="${y0 + ala + H}" />`;
  svg += `<line class="doblez" x1="${x0 + A + L + A + L}" y1="${y0 + ala}" x2="${x0 + A + L + A + L}" y2="${y0 + ala + H}" />`;

  // 3. Líneas de doblez horizontales (para las tapas)
  svg += `<line class="doblez" x1="${x0 + A}" y1="${y0 + ala}" x2="${x0 + A + L}" y2="${y0 + ala}" />`; // Tapa arriba
  svg += `<line class="doblez" x1="${x0 + A + L + A}" y1="${y0 + ala}" x2="${x0 + A + L + A + L}" y2="${y0 + ala}" />`; // Tapa arriba 2
  svg += `<line class="doblez" x1="${x0 + A}" y1="${y0 + ala + H}" x2="${x0 + A + L}" y2="${y0 + ala + H}" />`; // Tapa abajo
  svg += `<line class="doblez" x1="${x0 + A + L + A}" y1="${y0 + ala + H}" x2="${x0 + A + L + A + L}" y2="${y0 + ala + H}" />`; // Tapa abajo 2

  // 4. Línea de unión (la pestaña que se pega)
  svg += `<line class="doblez" x1="${x0}" y1="${y0 + ala}" x2="${x0}" y2="${y0 + ala + H}" />`;

  // 5. Textos de referencia (Medidas)
  svg += `<text class="texto" x="${x0 + A + L/2}" y="${y0 + ala/2}">L: ${L}</text>`;
  svg += `<text class="texto" x="${x0 + A/2}" y="${y0 + ala + H/2}">A: ${A}</text>`;
  
  svg += `</svg>`;
  svgContainer.innerHTML = svg;
}

// ==========================================
// 3. EVENTOS Y CONTROLES
// ==========================================

// Escuchar cambios en las medidas
Object.values(inputs).forEach(input => {
  input.addEventListener('input', actualizarDiseno);
});

// Redimensionar ventana
window.addEventListener('resize', () => {
  const w = viewport3D.clientWidth;
  const h = viewport3D.clientHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
});

// Bucle de animación 3D
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}

// Descargar SVG
btnDescargar.addEventListener('click', () => {
  const svgContent = svgContainer.innerHTML;
  const blob = new Blob([svgContent], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'plano_corte_caja.svg';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
});

// Iniciar
actualizarDiseno();
animate();