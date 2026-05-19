import * as THREE from 'https://esm.sh/three@0.150.1';
import { GLTFLoader } from 'https://esm.sh/three@0.150.1/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'https://esm.sh/three@0.150.1/examples/jsm/controls/OrbitControls.js';
import { DRACOLoader } from 'https://esm.sh/three@0.150.1/examples/jsm/loaders/DRACOLoader.js';
import posthog from 'posthog-js';
import * as Sentry from '@sentry/browser';

Sentry.init({
  dsn: 'https://d3f2f1cc0a35b56aae7cf3b7496e3474@o4511415513120768.ingest.de.sentry.io/4511415524786256',
  integrations: [
    Sentry.browserTracingIntegration(),
  ],
  tracesSampleRate: 1.0,
  environment: 'development', 
});

posthog.init('phc_z9yKc5BpVtnW3oUemz5H2NzrFmoj9KnLMKSWFRaT9Pca', {
  api_host: 'https://eu.posthog.com', // або https://app.posthog.com
  person_profiles: 'identified_only',
});

// ── DOM ────────────────────────────────────────────────
const canvas      = document.getElementById('viewport');
const loadScreen  = document.getElementById('loading-screen');
const loadBar     = document.getElementById('loading-bar');
const loadText    = document.getElementById('loading-text');
const gunLabel    = document.getElementById('gun-label');
const summary     = document.getElementById('selected-summary');
const panel       = document.getElementById('panel');
const toggleBtn   = document.getElementById('toggle-panel');

// ── Renderer ───────────────────────────────────────────
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;

// ── Scene & Camera ─────────────────────────────────────
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x2c3e50);

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.01, 100);
camera.position.set(0, 0.2, 1.2);

// ── Controls ───────────────────────────────────────────
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.07;
controls.minDistance = 0.3;
controls.maxDistance = 4;
controls.maxPolarAngle = Math.PI * 0.75;

// ── Lighting ───────────────────────────────────────────
const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
scene.add(ambientLight);

const keyLight = new THREE.DirectionalLight(0xffffff, 3.0);
keyLight.position.set(3, 4, 3);
keyLight.castShadow = true;
keyLight.shadow.mapSize.set(2048, 2048);
keyLight.shadow.camera.near = 0.1;
keyLight.shadow.camera.far = 20;
scene.add(keyLight);

const fillLight = new THREE.DirectionalLight(0xaaddff, 1.2);
fillLight.position.set(-3, 2, -2);
scene.add(fillLight);

const rimLight = new THREE.DirectionalLight(0x00ffcc, 0.8);
rimLight.position.set(0, 2, -3);
scene.add(rimLight);

const frontLight = new THREE.DirectionalLight(0xffffff, 1.0);
frontLight.position.set(0, 1, 5);
scene.add(frontLight);

// Підлога
const floorGeo = new THREE.PlaneGeometry(10, 10);
const floorMat = new THREE.ShadowMaterial({ opacity: 0.2 });
const floor = new THREE.Mesh(floorGeo, floorMat);
floor.rotation.x = -Math.PI / 2;
floor.position.y = -0.5;
floor.receiveShadow = true;
scene.add(floor);

// ── Loader ─────────────────────────────────────────────
const loader = new GLTFLoader();
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
loader.setDRACOLoader(dracoLoader);

let baseModel = null;
let currentGun = 'ak74';
const activeAccessories = {};
const selectedItems = {};

// ── Конфіг аксесуарів ──────────────────────────────────
// Імена ключів = імена GLB файлів (без .glb)
const accessoryConfigs = {
  ak74: {
    // Прицілі (acsses_models/scopes/)
    'holo_scope-v1':   { pos: [0,  0.12,  0.05], rot: [0, 0, 0], scale: 1 },
    'acog_scope-v1':   { pos: [0,  0.12,  0.05], rot: [0, 0, 0], scale: 1 },
    // Руків'я (acsses_models/grips/)
    'light_grip-v1':   { pos: [0, -0.05,  0.30], rot: [0, 0, 0], scale: 1 },
    'tactical_grip':   { pos: [0, -0.05,  0.30], rot: [0, 0, 0], scale: 1 },
    // Приклади (acsses_models/stocks/) — якщо є файли
    'stock_pt1':       { pos: [0,  0.00, -0.35], rot: [0, 0, 0], scale: 1 },
    'stock_aps_black': { pos: [0,  0.00, -0.35], rot: [0, 0, 0], scale: 1 },
    // Лазери (acsses_models/lasers/)
    'flashlight-v1':   { pos: [0, -0.04,  0.15], rot: [0, 0, 0], scale: 1 },
    'laser-v1':        { pos: [0, -0.04,  0.15], rot: [0, 0, 0], scale: 1 },
    // Магазини (acsses_models/magazines/) — якщо є файли
    'mag_meh_120':     { pos: [0, -0.18,  0.05], rot: [0, 0, 0], scale: 1 },
    'mag_bunk_500':    { pos: [0, -0.18,  0.05], rot: [0, 0, 0], scale: 1 },
    // Дула (acsses_models/barrel/)
    'flash_hider-v1':  { pos: [0,  0.00,  0.50], rot: [0, 0, 0], scale: 1 },
    'silencer-v1':     { pos: [0,  0.00,  0.50], rot: [0, 0, 0], scale: 1 },
  },
  m4a1: {
    // Прицілі
    'holo_scope-v1':   { pos: [-0.4, 0.61, 0.01], rot: [0, Math.PI, 0], scale: 0.05 },
    'acog_scope-v1':   { pos: [-0.4, 0.41, 0.01], rot: [0, Math.PI, 0], scale: 7 },
    // Руків'я
    'light_grip-v1':   { pos: [0.85, 0.2,  0.008], rot: [0, ((Math.PI)/2)*Math.PI, 0], scale: 0.3 },
    'tactical_grip':   { pos: [0.85, -0.1,  0.008], rot: [0, 0, 0], scale: 0.3 },
    // Приклади
    'stock_pt1':       { pos: [0,  0.00, -0.40], rot: [0, 0, 0], scale: 1 },
    'stock_aps_black': { pos: [0,  0.00, -0.40], rot: [0, 0, 0], scale: 1 },
    // Лазери
    'flashlight-v1':   { pos: [0, -0.04,  0.10], rot: [0, 0, 0], scale: 1 },
    'laser-v1':        { pos: [0, -0.04,  0.10], rot: [0, 0, 0], scale: 1 },
    // Магазини
    'mag_meh_120':     { pos: [0, -0.18,  0.00], rot: [0, 0, 0], scale: 1 },
    'mag_bunk_500':    { pos: [0, -0.18,  0.00], rot: [0, 0, 0], scale: 1 },
    // Дула
    'flash_hider-v1':  { pos: [2.4,  0.35,  -0.1], rot: [0, ((Math.PI)/2)*Math.PI, 0], scale: 0.5 },
    'silencer-v1':     { pos: [0,  0.00,  0.5], rot: [0, 0, 0], scale: 0.1 },
  },
};

// ── Завантаження базової моделі ────────────────────────
function loadBaseModel(src, label) {
  loadScreen.style.display = 'flex';
  loadScreen.style.opacity = '1';
  loadBar.style.width = '0%';
  loadText.textContent = 'Завантаження моделі...';

  if (baseModel) { scene.remove(baseModel); baseModel = null; }

  Object.keys(activeAccessories).forEach(cat => {
    if (activeAccessories[cat]) { scene.remove(activeAccessories[cat]); activeAccessories[cat] = null; }
  });

  loader.load(src, (gltf) => {
    baseModel = gltf.scene;
    baseModel.traverse(node => {
      if (node.isMesh) { node.castShadow = true; node.receiveShadow = true; }
    });
    scene.add(baseModel);

    const box = new THREE.Box3().setFromObject(baseModel);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3()).length();

    baseModel.position.sub(center);
    floor.position.y = -size * 0.3;
    controls.target.set(0, 0, 0);
    controls.update();
    camera.position.set(0, size * 0.15, size * 2.5);

    if (label) gunLabel.textContent = label;

    loadBar.style.width = '100%';
    loadText.textContent = 'Готово!';
    loadScreen.style.opacity = '0';
    setTimeout(() => { loadScreen.style.display = 'none'; }, 600);

    console.log(`✅ Модель завантажена: ${src} | Розмір: ${size.toFixed(3)}`);
  },
  (xhr) => {
    if (xhr.total > 0) {
      const pct = Math.round(xhr.loaded / xhr.total * 100);
      loadBar.style.width = pct + '%';
      loadText.textContent = `Завантаження... ${pct}%`;
    }
  },
  (err) => {
    console.error('❌ Помилка:', err);
    loadText.textContent = '❌ Помилка завантаження';
  });
}

// ── Завантаження аксесуара ─────────────────────────────
function attachAccessory(category, accessoryFile) {
  if (activeAccessories[category]) {
    scene.remove(activeAccessories[category]);
    activeAccessories[category] = null;
  }

  const path = `acsses_models/${category}/${accessoryFile}.glb`;
  loader.load(path, (gltf) => {
    const obj = gltf.scene;
    obj.traverse(node => {
      if (node.isMesh) { node.castShadow = true; node.receiveShadow = true; }
    });

    const cfg = accessoryConfigs[currentGun]?.[accessoryFile];
    if (cfg) {
      obj.position.set(...cfg.pos);
      obj.rotation.set(...cfg.rot);
      obj.scale.setScalar(cfg.scale);
    } else {
      console.warn(`⚠️ Немає конфігу для [${currentGun}][${accessoryFile}]`);
    }

    scene.add(obj);
    activeAccessories[category] = obj;
    console.log(`✅ Аксесуар: ${accessoryFile}`);
  }, undefined, (err) => console.error(`❌ Не знайдено: ${path}`, err));
}

function detachAccessory(category) {
  if (activeAccessories[category]) { scene.remove(activeAccessories[category]); activeAccessories[category] = null; }
}

function updateSummary() {
  const items = Object.values(selectedItems).filter(Boolean);
  summary.textContent = items.length > 0 ? `Обрано: ${items.join(', ')}` : 'Нічого не обрано';
}

// ── Рендер-луп ─────────────────────────────────────────
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}
animate();

// ── Resize ─────────────────────────────────────────────
window.addEventListener('resize', () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
});

// ── UI: Таби ───────────────────────────────────────────
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const cat = btn.dataset.category;
    document.querySelectorAll('.accessory-group').forEach(g => {
      g.classList.toggle('active-group', g.dataset.category === cat);
    });
  });
});

// ── UI: Картки аксесуарів ──────────────────────────────
document.querySelectorAll('.accessory-card').forEach(card => {
  card.addEventListener('click', () => {
    const file     = card.dataset.accessory;
    const category = card.dataset.category;
    const name     = card.querySelector('.card-name').textContent;

    if (card.classList.contains('selected')) {
      card.classList.remove('selected');
      detachAccessory(category);
      delete selectedItems[category];
      posthog.capture('accessory_removed', {  // ← додай сюди
        accessory_type: file,
        category: category,
      });
    } else {
      document.querySelectorAll(`.accessory-card[data-category="${category}"]`)
        .forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      attachAccessory(category, file);
      selectedItems[category] = name;
      posthog.capture('accessory_added', {  // ← додай сюди
        accessory_type: file,
        category: category,
      });
    }
    updateSummary();
  });
});

// ── UI: Вибір зброї ────────────────────────────────────
document.querySelectorAll('.weapon-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    if (btn.classList.contains('active')) return;
    document.querySelectorAll('.weapon-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentGun = btn.dataset.gun;
    document.querySelectorAll('.accessory-card').forEach(c => c.classList.remove('selected'));
    Object.keys(selectedItems).forEach(k => delete selectedItems[k]);
    updateSummary();
    loadBaseModel(btn.dataset.src, btn.textContent);
  });
});

// ── UI: Згорнути панель ────────────────────────────────
toggleBtn.addEventListener('click', () => {
  panel.classList.toggle('collapsed');
});

// ── DEBUG: рух аксесуара клавішами ────────────────────
// Змінюй debugCat на категорію яку налаштовуєш
// Після налаштування — видали цей блок
let debugCat = 'barrel';
const debugStep = 0.05;
window.addEventListener('keydown', (e) => {
  const obj = activeAccessories[debugCat];
  if (!obj) return;
  switch(e.key) {
    case 'ArrowUp':    obj.position.y += debugStep; break;
    case 'ArrowDown':  obj.position.y -= debugStep; break;
    case 'ArrowLeft':  obj.position.x -= debugStep; break;
    case 'ArrowRight': obj.position.x += debugStep; break;
    case 'w':          obj.position.z -= debugStep; break;
    case 's':          obj.position.z += debugStep; break;
  }
  console.log(`[${currentGun}][${debugCat}] pos: [${obj.position.x.toFixed(3)}, ${obj.position.y.toFixed(3)}, ${obj.position.z.toFixed(3)}]`);
});

posthog.onFeatureFlags(() => {
  if (posthog.isFeatureEnabled('show-urgent-filter')) {
    console.log('✅ Feature flag show-urgent-filter активний!');
    // тут можна показати додатковий UI елемент
  }
});

// ── Старт ──────────────────────────────────────────────
loadBaseModel('ak-74__upgrade.glb', 'AK-74');

async function saveCurrentConfig() {
    const response = await fetch('http://localhost:3000/api/config/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            gunId: currentGun,
            configData: accessoryConfigs[currentGun]
        })
    });
    const result = await response.json();
    posthog.capture('config_saved', {  // ← додай сюди
      gun: currentGun,
      total_accessories: Object.values(selectedItems).filter(Boolean).length,
    });
    alert(result.message);
}

// Можеш призначити це на клавішу 'Enter' у своєму debug-блоці
window.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    saveCurrentConfig();
  }
});

// Відображення змінної оточення
const envStatus = document.getElementById('env-status')
if (envStatus) {
  envStatus.textContent = import.meta.env.VITE_APP_STATUS || 'Unknown'
}

window.throwTestError = function() {
  throw new Error("Sentry Test Error: Something went wrong!" + Date.now());
}

Sentry.setUser({
  id: "12345",
  email: "student@example.com",
  segment: "premium_user"
});

// Очищення контексту при виході
// Sentry.setUser(null); // викликати при logout