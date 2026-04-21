// ============================================================
// WARPDOOR ULTRA — main entry
// ============================================================
import * as THREE from 'three';
import { WORLDS, getWorld } from './worlds.js';
import { buildWorld } from './worldbuilder.js';

// ------------------------------------------------------------
// Global state
// ------------------------------------------------------------
const state = {
  phase: 'landing',        // landing | picker | transition | world
  selectedWorldId: null,
  cameraMode: 'first',     // first | third
  collection: new Set(JSON.parse(localStorage.getItem('wd_collection') || '[]')),
  filters: 'all',
  isMobile: matchMedia('(pointer: coarse)').matches && navigator.maxTouchPoints > 0,
  worldObj: null,          // currently loaded world group
  player: null,            // player position / velocity
  input: { fw:0, rt:0, jumpQueued:false, yaw:0, pitch:0 },
  ready: false,
};

// ------------------------------------------------------------
// DOM helpers
// ------------------------------------------------------------
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => [...document.querySelectorAll(sel)];
const showScreen = (id) => {
  $$('.screen').forEach(s => s.classList.toggle('active', s.id === id));
  state.phase = id.replace('screen-', '');
};
const toast = (msg, ms=2200) => {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toast._id);
  toast._id = setTimeout(() => t.classList.remove('show'), ms);
};

// ------------------------------------------------------------
// Three.js bootstrap
// ------------------------------------------------------------
const canvas = $('#bg-canvas');
const renderer = new THREE.WebGLRenderer({
  canvas, antialias: true, alpha: true, powerPreference: 'high-performance',
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight, false);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000005);

const camera = new THREE.PerspectiveCamera(62, window.innerWidth/window.innerHeight, 0.1, 3000);
camera.position.set(0, 1.7, 8);

window.addEventListener('resize', () => {
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  camera.aspect = window.innerWidth/window.innerHeight;
  camera.updateProjectionMatrix();
}, { passive: true });

// ============================================================
// LANDING SCENE — floating door in a starfield
// ============================================================
const landingGroup = new THREE.Group();
scene.add(landingGroup);

// Starfield
function makeStars(count=1800, radius=800) {
  const g = new THREE.BufferGeometry();
  const positions = new Float32Array(count*3);
  const colors = new Float32Array(count*3);
  for (let i=0;i<count;i++){
    // sphere shell
    const r = radius * (0.6 + Math.random()*0.4);
    const theta = Math.random()*Math.PI*2;
    const phi   = Math.acos(2*Math.random()-1);
    positions[i*3]   = r*Math.sin(phi)*Math.cos(theta);
    positions[i*3+1] = r*Math.sin(phi)*Math.sin(theta);
    positions[i*3+2] = r*Math.cos(phi);
    const t = Math.random();
    colors[i*3]   = 0.8 + t*0.2;
    colors[i*3+1] = 0.7 + t*0.3;
    colors[i*3+2] = 0.9 + t*0.1;
  }
  g.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  g.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  const m = new THREE.PointsMaterial({
    size: 1.6, vertexColors: true, transparent: true, opacity: 0.9,
    sizeAttenuation: true, depthWrite: false, blending: THREE.AdditiveBlending,
  });
  return new THREE.Points(g, m);
}
const stars = makeStars();
landingGroup.add(stars);

// Nebula background (large glowing plane)
function makeNebula() {
  const c = document.createElement('canvas');
  c.width = c.height = 512;
  const ctx = c.getContext('2d');
  const grd = ctx.createRadialGradient(256, 256, 20, 256, 256, 256);
  grd.addColorStop(0,   'rgba(160, 100, 255, 0.8)');
  grd.addColorStop(0.35,'rgba(90, 60, 180, 0.35)');
  grd.addColorStop(0.7, 'rgba(30, 20, 80, 0.12)');
  grd.addColorStop(1,   'rgba(0,0,0,0)');
  ctx.fillStyle = grd; ctx.fillRect(0,0,512,512);
  // sparkles
  ctx.globalCompositeOperation = 'lighter';
  for (let i=0;i<120;i++){
    ctx.fillStyle = `rgba(255,255,255,${Math.random()*0.4})`;
    ctx.beginPath();
    ctx.arc(Math.random()*512, Math.random()*512, Math.random()*2, 0, Math.PI*2);
    ctx.fill();
  }
  const tex = new THREE.CanvasTexture(c);
  const m = new THREE.SpriteMaterial({ map: tex, transparent: true, opacity: 0.75, blending: THREE.AdditiveBlending, depthWrite: false });
  const s = new THREE.Sprite(m);
  s.scale.set(600, 600, 1);
  s.position.set(-60, 40, -300);
  return s;
}
landingGroup.add(makeNebula());
const neb2 = makeNebula();
neb2.position.set(120, -30, -250); neb2.scale.set(500, 500, 1);
landingGroup.add(neb2);

// ------------------------------------------------------------
// Beautiful Door object — reusable
// ------------------------------------------------------------
function makeDoor() {
  const g = new THREE.Group();
  g.name = 'door';

  // Frame — carved stone/gold look (BoxGeometry pieces)
  const frameMat = new THREE.MeshStandardMaterial({
    color: 0x2a1b0a, roughness: 0.25, metalness: 0.85,
    emissive: 0x1a0f05, emissiveIntensity: 0.5,
  });
  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xd4b174, roughness: 0.22, metalness: 0.95,
    emissive: 0x3a2a10, emissiveIntensity: 0.6,
  });

  // Door frame
  const frameTh = 0.25;
  const doorW = 2.2, doorH = 4.2;
  const top = new THREE.Mesh(new THREE.BoxGeometry(doorW+frameTh*2+0.2, frameTh*1.4, 0.5), goldMat);
  top.position.set(0, doorH+frameTh*0.7, 0);
  g.add(top);
  const left = new THREE.Mesh(new THREE.BoxGeometry(frameTh, doorH+frameTh, 0.5), goldMat);
  left.position.set(-doorW/2-frameTh/2, doorH/2, 0);
  g.add(left);
  const right = left.clone();
  right.position.x = doorW/2+frameTh/2;
  g.add(right);
  // base
  const base = new THREE.Mesh(new THREE.BoxGeometry(doorW+frameTh*2+0.4, 0.08, 0.6), goldMat);
  base.position.set(0, 0.04, 0);
  g.add(base);

  // Ornament at top
  const orn = new THREE.Mesh(new THREE.TorusGeometry(0.35, 0.1, 16, 32, Math.PI), goldMat);
  orn.position.set(0, doorH+0.45, 0);
  orn.rotation.z = Math.PI;
  g.add(orn);

  // Door panel (the door itself), attached to left hinge
  const hingeGroup = new THREE.Group();
  hingeGroup.position.set(-doorW/2, 0, 0);
  g.add(hingeGroup);
  g.userData.hinge = hingeGroup;

  const doorPanel = new THREE.Mesh(
    new THREE.BoxGeometry(doorW, doorH, 0.08),
    new THREE.MeshStandardMaterial({
      color: 0x18120a, roughness: 0.55, metalness: 0.6,
      emissive: 0x060308, emissiveIntensity: 0.3,
    })
  );
  doorPanel.position.set(doorW/2, doorH/2, 0);
  hingeGroup.add(doorPanel);
  g.userData.panel = doorPanel;

  // Door panel detail: inset rectangles
  const detailMat = new THREE.MeshStandardMaterial({ color: 0xc9a96a, roughness: 0.3, metalness: 0.95, emissive: 0x2a1f0a, emissiveIntensity: 0.8 });
  for (let i=0;i<2;i++){
    for (let j=0;j<3;j++){
      const rect = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.9, 0.04), detailMat);
      rect.position.set(-doorW/2+0.55 + i*1.05, 0.8 + j*1.1, 0.05);
      doorPanel.add(rect);
    }
  }
  // Knob
  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.09, 16, 12), detailMat);
  knob.position.set(-0.35, 0, 0.08);
  doorPanel.add(knob);

  // Portal behind the door — this becomes the "view through" when open
  const portalMat = new THREE.ShaderMaterial({
    transparent: true,
    uniforms: {
      uTime: { value: 0 },
      uOpacity: { value: 0 },
      uColorA: { value: new THREE.Color(0xa86bff) },
      uColorB: { value: new THREE.Color(0x4fd0ff) },
      uColorC: { value: new THREE.Color(0xffffff) },
    },
    vertexShader: `
      varying vec2 vUv;
      void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }
    `,
    fragmentShader: `
      varying vec2 vUv;
      uniform float uTime;
      uniform float uOpacity;
      uniform vec3 uColorA;
      uniform vec3 uColorB;
      uniform vec3 uColorC;
      float hash(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
      float noise(vec2 p){
        vec2 i=floor(p), f=fract(p);
        float a=hash(i), b=hash(i+vec2(1,0)), c=hash(i+vec2(0,1)), d=hash(i+vec2(1,1));
        vec2 u=f*f*(3.-2.*f);
        return mix(mix(a,b,u.x), mix(c,d,u.x), u.y);
      }
      void main(){
        vec2 p = vUv - 0.5;
        float r = length(p);
        float a = atan(p.y, p.x);
        float swirl = sin(a*4. + uTime*1.5 + r*8.) * 0.5 + 0.5;
        float n = noise(p*8. + uTime*0.4);
        float rings = smoothstep(0.5, 0.2, r) * swirl;
        vec3 col = mix(uColorA, uColorB, rings);
        col = mix(col, uColorC, n * 0.45);
        float glow = smoothstep(0.5, 0.0, r);
        col += uColorC * pow(glow, 3.) * 0.6;
        // edge falloff
        float edgeMask = smoothstep(0.5, 0.35, r);
        gl_FragColor = vec4(col, edgeMask * uOpacity);
      }
    `,
    side: THREE.DoubleSide,
  });
  const portal = new THREE.Mesh(
    new THREE.PlaneGeometry(doorW*0.97, doorH*0.97),
    portalMat,
  );
  portal.position.set(0, doorH/2, -0.01);
  g.add(portal);
  g.userData.portal = portal;
  g.userData.portalMat = portalMat;

  // Glow around door
  const glowGeom = new THREE.PlaneGeometry(doorW*3.5, doorH*2.0);
  const glowMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uTime: { value: 0 }, uOpacity: { value: 0.6 } },
    vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
    fragmentShader: `
      varying vec2 vUv;
      uniform float uTime;
      uniform float uOpacity;
      void main(){
        vec2 p = vUv - 0.5;
        float r = length(p*vec2(3.5, 1.0));
        float glow = smoothstep(0.6, 0., r);
        glow *= 0.7 + 0.3*sin(uTime*1.2);
        vec3 col = mix(vec3(0.66,0.42,1.0), vec3(1.0,0.85,0.5), sin(uTime*0.6)*0.5+0.5);
        gl_FragColor = vec4(col, glow * uOpacity);
      }
    `,
  });
  const glow = new THREE.Mesh(glowGeom, glowMat);
  glow.position.set(0, doorH/2, -0.5);
  g.add(glow);
  g.userData.glowMat = glowMat;

  return g;
}

const landingDoor = makeDoor();
landingDoor.position.set(0, -1.2, 0);
landingDoor.rotation.y = 0.05;
landingGroup.add(landingDoor);

// Ground reflection plane (subtle mirror)
const reflGeo = new THREE.CircleGeometry(12, 64);
const reflMat = new THREE.MeshBasicMaterial({ color: 0x0a0818, transparent: true, opacity: 0.5 });
const reflFloor = new THREE.Mesh(reflGeo, reflMat);
reflFloor.rotation.x = -Math.PI/2;
reflFloor.position.y = -1.22;
landingGroup.add(reflFloor);

// Floor fog ring
const floorGlow = new THREE.Mesh(
  new THREE.RingGeometry(1.5, 6, 64),
  new THREE.MeshBasicMaterial({
    color: 0xa86bff, transparent: true, opacity: 0.15,
    side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending,
  })
);
floorGlow.rotation.x = -Math.PI/2;
floorGlow.position.y = -1.19;
landingGroup.add(floorGlow);

// Particles rising
function makeParticles(count=220, spread=10) {
  const g = new THREE.BufferGeometry();
  const p = new Float32Array(count*3);
  const v = new Float32Array(count*3);
  for (let i=0;i<count;i++){
    p[i*3]   = (Math.random()-0.5)*spread;
    p[i*3+1] = Math.random()*8 - 1;
    p[i*3+2] = (Math.random()-0.5)*spread - 2;
    v[i*3]   = (Math.random()-0.5)*0.008;
    v[i*3+1] = 0.006 + Math.random()*0.012;
    v[i*3+2] = (Math.random()-0.5)*0.008;
  }
  g.setAttribute('position', new THREE.BufferAttribute(p, 3));
  g.userData.vel = v;
  const m = new THREE.PointsMaterial({ size: 0.06, color: 0xffe0b0, transparent: true, opacity: 0.8, depthWrite: false, blending: THREE.AdditiveBlending });
  return new THREE.Points(g, m);
}
const particles = makeParticles();
landingGroup.add(particles);

// Lighting for landing
const landingAmb = new THREE.AmbientLight(0x4a3a7a, 0.6);
landingGroup.add(landingAmb);
const landingKey = new THREE.DirectionalLight(0xc9a96a, 1.2);
landingKey.position.set(5, 10, 6);
landingGroup.add(landingKey);
const landingRim = new THREE.PointLight(0xa86bff, 2.5, 20);
landingRim.position.set(0, 2, -3);
landingGroup.add(landingRim);

// Camera target for landing
const landingCamTarget = new THREE.Vector3(0, 0.6, 0);

// ============================================================
// WORLD HOST — container for currently loaded world
// ============================================================
const worldHost = new THREE.Group();
scene.add(worldHost);
worldHost.visible = false;

// Clouds / fog will be added per world. Return-door in world too.
let worldReturnDoor = null;

// ============================================================
// Input handling
// ============================================================
const keys = new Set();
window.addEventListener('keydown', (e) => {
  keys.add(e.code);
  if (e.code === 'Space') state.input.jumpQueued = true;
  // View toggle with V
  if (e.code === 'KeyV' && state.phase === 'world') toggleView();
  if (e.code === 'Escape' && state.phase === 'world') leaveWorld();
});
window.addEventListener('keyup', (e) => keys.delete(e.code));

// Pointer lock for desktop
let pointerLocked = false;
canvas.addEventListener('click', () => {
  if (state.phase === 'world' && !state.isMobile && !pointerLocked) {
    canvas.requestPointerLock?.();
  }
});
document.addEventListener('pointerlockchange', () => {
  pointerLocked = document.pointerLockElement === canvas;
});
document.addEventListener('mousemove', (e) => {
  if (state.phase !== 'world') return;
  if (!pointerLocked) return;
  state.input.yaw   -= e.movementX * 0.0022;
  state.input.pitch -= e.movementY * 0.0022;
  state.input.pitch = Math.max(-1.2, Math.min(1.2, state.input.pitch));
});

// Mobile joystick
const joystick = $('#joystick');
const knob = $('#knob');
let jActive = false, jCenter = { x: 0, y: 0 };
function joyStart(e) {
  jActive = true;
  const t = e.touches ? e.touches[0] : e;
  const rect = joystick.getBoundingClientRect();
  jCenter.x = rect.left + rect.width/2;
  jCenter.y = rect.top + rect.height/2;
  joyMove(e);
}
function joyMove(e) {
  if (!jActive) return;
  const t = e.touches ? e.touches[0] : e;
  let dx = t.clientX - jCenter.x;
  let dy = t.clientY - jCenter.y;
  const max = 40;
  const mag = Math.hypot(dx, dy);
  if (mag > max) { dx = dx/mag*max; dy = dy/mag*max; }
  knob.style.transform = `translate(${dx}px, ${dy}px)`;
  state.input.rt = dx/max;
  state.input.fw = -dy/max;
}
function joyEnd() {
  jActive = false;
  knob.style.transform = '';
  state.input.rt = 0; state.input.fw = 0;
}
joystick.addEventListener('touchstart', joyStart, { passive: true });
joystick.addEventListener('touchmove', joyMove, { passive: true });
joystick.addEventListener('touchend', joyEnd, { passive: true });
joystick.addEventListener('mousedown', joyStart);
window.addEventListener('mousemove', (e) => { if (jActive) joyMove(e); });
window.addEventListener('mouseup', joyEnd);

// Mobile swipe for camera look
let touchLookActive = false, lastTouchX = 0, lastTouchY = 0, lookTouchId = null;
canvas.addEventListener('touchstart', (e) => {
  if (state.phase !== 'world') return;
  // use last touch as look touch (not if on joystick area)
  for (const t of e.changedTouches) {
    if (joystick.contains(document.elementFromPoint(t.clientX, t.clientY))) continue;
    if (t.clientX < joystick.getBoundingClientRect().right + 20 && t.clientY > window.innerHeight - 200) continue;
    lastTouchX = t.clientX; lastTouchY = t.clientY;
    lookTouchId = t.identifier;
    touchLookActive = true;
    break;
  }
}, { passive: true });
canvas.addEventListener('touchmove', (e) => {
  if (!touchLookActive) return;
  for (const t of e.changedTouches) {
    if (t.identifier !== lookTouchId) continue;
    const dx = t.clientX - lastTouchX, dy = t.clientY - lastTouchY;
    state.input.yaw   -= dx * 0.005;
    state.input.pitch -= dy * 0.005;
    state.input.pitch = Math.max(-1.0, Math.min(1.0, state.input.pitch));
    lastTouchX = t.clientX; lastTouchY = t.clientY;
  }
}, { passive: true });
canvas.addEventListener('touchend', (e) => {
  for (const t of e.changedTouches) {
    if (t.identifier === lookTouchId) { touchLookActive = false; lookTouchId = null; }
  }
}, { passive: true });

// Jump button
$('#jumpBtn').addEventListener('click', () => state.input.jumpQueued = true);

// View toggle
$('#viewToggleBtn').addEventListener('click', toggleView);
function toggleView() {
  state.cameraMode = state.cameraMode === 'first' ? 'third' : 'first';
  toast(state.cameraMode === 'first' ? '一人称視点' : '三人称視点', 1200);
}

// ============================================================
// Landing → Picker
// ============================================================
$('#openDoor').addEventListener('click', () => {
  gtag("event", "door_opened");
  // Quick door swing + go to picker
  const hinge = landingDoor.userData.hinge;
  const startRot = hinge.rotation.y;
  const duration = 900, startTime = performance.now();
  (function anim() {
    const t = Math.min(1, (performance.now()-startTime)/duration);
    hinge.rotation.y = startRot + -Math.PI*0.55 * easeOutCubic(t);
    landingDoor.userData.portalMat.uniforms.uOpacity.value = t;
    if (t < 1) requestAnimationFrame(anim);
    else setTimeout(() => {
      showScreen('screen-picker');
      // Close door back
      setTimeout(() => {
        const startTime2 = performance.now();
        (function anim2(){
          const t2 = Math.min(1, (performance.now()-startTime2)/600);
          hinge.rotation.y = startRot + -Math.PI*0.55 * (1 - easeInCubic(t2));
          landingDoor.userData.portalMat.uniforms.uOpacity.value = 1 - t2;
          if (t2 < 1) requestAnimationFrame(anim2);
        })();
      }, 400);
    }, 120);
  })();
});

$('#pickerBack').addEventListener('click', () => showScreen('screen-landing'));

// ============================================================
// Picker: build destination cards + filter
// ============================================================
function renderFilters() {
  const eras = ['all', 'Ancient', 'Modern', 'Future', 'Myth'];
  const labels = { all: 'すべて', Ancient: '古代・歴史', Modern: '近代', Future: '未来', Myth: '神話' };
  const bar = $('#filterBar');
  bar.innerHTML = '';
  eras.forEach(era => {
    const b = document.createElement('button');
    b.className = 'filter-pill' + (state.filters === era ? ' active' : '');
    b.textContent = labels[era] || era;
    b.addEventListener('click', () => { state.filters = era; renderFilters(); renderDestinations(); });
    bar.appendChild(b);
  });
}
function renderDestinations() {
  const grid = $('#destGrid');
  grid.innerHTML = '';
  const filtered = WORLDS.filter(w => state.filters === 'all' || w.era === state.filters);
  filtered.forEach((w, i) => {
    const card = document.createElement('div');
    card.className = 'dest-card';
    card.style.animationDelay = `${Math.min(i * 0.05, 0.6)}s`;
    const visited = state.collection.has(w.id);
    card.innerHTML = `
      <div class="cover" style="background-image: url('/api/cover/${w.id}')"></div>
      <div class="cover-grad"></div>
      <div class="year-mark">${w.eraLabel.split(' ')[0]}</div>
      <div class="hover-arrow">→</div>
      <div class="info">
        <div class="era-tag">${w.eraLabel}${visited ? ' · VISITED' : ''}</div>
        <div class="name">${w.name}</div>
        <div class="place">${w.place}</div>
      </div>
    `;
    card.addEventListener('click', () => startWarp(w.id));
    grid.appendChild(card);
  });
}

// ============================================================
// Warp sequence: picker → transition → world
// ============================================================
function startWarp(worldId) {
  gtag("event", "warp_started", { world_id: worldId });
  state.selectedWorldId = worldId;
  const w = getWorld(worldId);
  $('#transitionTitle').textContent = `${w.name}へ接続中...`;
  $('#transitionSub').textContent = `QUANTUM TUNNEL · ${w.eraLabel.toUpperCase()}`;
  showScreen('screen-transition');

  // Prepare world in background while transition shows
  setTimeout(() => {
    prepareWorld(w);
  }, 300);

  // After transition bar completes (~2.8s), enter the world
  setTimeout(() => {
    enterWorld(w);
  }, 2900);
}

// ============================================================
// Prepare & enter world
// ============================================================
function prepareWorld(w) {
  // Clear old world
  while (worldHost.children.length) {
    const c = worldHost.children[0];
    worldHost.remove(c);
    disposeObject(c);
  }
  // Build the world (returns { group, spawn, returnDoor })
  const built = buildWorld(w, THREE);
  worldHost.add(built.group);
  state.worldObj = built;
  worldReturnDoor = built.returnDoor;

  // Configure scene palette
  const p = w.palette;
  scene.background = new THREE.Color(p.sky[2] ?? 0x000005);
  scene.fog = new THREE.Fog(p.fog, p.fogNear, p.fogFar);

  // Sky dome
  if (built.skyDome) worldHost.add(built.skyDome);

  // Spawn player
  state.player = {
    pos: built.spawn.clone(),
    vel: new THREE.Vector3(),
    onGround: true,
    radius: 0.45,
    height: 1.7,
    groundHeightAt: built.groundHeightAt || (() => 0),
    collide: built.collide || (() => null),
  };
  // Initial camera facing
  state.input.yaw   = built.spawnYaw ?? 0;
  state.input.pitch = 0;
}

function enterWorld(w) {
  gtag("event", "world_arrived", { world_id: w.id });
  landingGroup.visible = false;
  worldHost.visible = true;
  showScreen('screen-world');
  // Reset landing door state
  landingDoor.userData.hinge.rotation.y = 0;
  landingDoor.userData.portalMat.uniforms.uOpacity.value = 0;
  state._transStart = null;

  $('#worldEra').textContent = w.eraLabel;
  $('#worldName').textContent = w.name;
  $('#controlsHint').classList.remove('hide');
  setTimeout(() => $('#controlsHint').classList.add('hide'), 6500);

  // mobile controls
  if (state.isMobile) {
    $('#joystick').classList.add('visible');
    $('#jumpBtn').classList.add('visible');
    $('#viewToggle').classList.add('visible');
  } else {
    $('#viewToggle').classList.add('visible');
  }

  // Add to collection
  if (!state.collection.has(w.id)) {
    state.collection.add(w.id);
    localStorage.setItem('wd_collection', JSON.stringify([...state.collection]));
    updateCollectionCount();
    setTimeout(() => toast(`✨ 「${w.name}」を記憶に追加しました`, 3200), 1500);
  }

  // Request pointer lock on desktop (user still needs to click once)
  if (!state.isMobile) {
    setTimeout(() => toast('画面をクリックで視点操作を開始', 2500), 800);
  }
}

function leaveWorld() {
  // Short fade to black then back to picker
  document.body.style.transition = 'opacity 0.5s';
  document.body.style.opacity = '0.2';
  setTimeout(() => {
    worldHost.visible = false;
    landingGroup.visible = true;
    scene.background = new THREE.Color(0x000005);
    scene.fog = null;
    // Reset landing door
    landingDoor.userData.hinge.rotation.y = 0;
    landingDoor.userData.portalMat.uniforms.uOpacity.value = 0;
    // Reset input state
    state.input.fw = 0; state.input.rt = 0; state.input.yaw = 0; state.input.pitch = 0;
    state.cameraMode = 'first';
    if (worldReturnDoor) worldReturnDoor.userData.triggered = false;
    $('#joystick').classList.remove('visible');
    $('#jumpBtn').classList.remove('visible');
    $('#viewToggle').classList.remove('visible');
    $('#coordHud').classList.remove('visible');
    if (document.pointerLockElement) document.exitPointerLock?.();
    showScreen('screen-picker');
    document.body.style.opacity = '1';
    // reset camera for landing pass
    camera.position.set(0, 1.7, 8);
    camera.rotation.set(0, 0, 0);
  }, 500);
}

$('#btnLeave').addEventListener('click', leaveWorld);

// Share button
$('#btnShare').addEventListener('click', async () => {
  const w = getWorld(state.selectedWorldId);
  const txt = `${w.name}にワープしてきた。時代: ${w.eraLabel}\n#WARPDOOR #どこでもドア`;
  const url = location.href;
  if (navigator.share) {
    try { await navigator.share({ title: 'WARPDOOR', text: txt, url }); } catch {}
  } else {
    navigator.clipboard.writeText(`${txt}\n${url}`);
    toast('リンクをコピーしました', 2000);
  }
});

// Screenshot
$('#btnPhoto').addEventListener('click', () => {
  renderer.render(scene, camera);
  const a = document.createElement('a');
  a.href = canvas.toDataURL('image/png');
  a.download = `warpdoor-${state.selectedWorldId || 'snap'}-${Date.now()}.png`;
  a.click();
  toast('スナップショットを保存しました', 1500);
});

// Collection modal
$('#collectionChip').addEventListener('click', openCollection);
$('#modalClose').addEventListener('click', () => $('#collectionModal').classList.remove('open'));
$('#collectionModal').addEventListener('click', (e) => {
  if (e.target.id === 'collectionModal') $('#collectionModal').classList.remove('open');
});
function openCollection() {
  const grid = $('#collectionGrid');
  grid.innerHTML = '';
  WORLDS.forEach(w => {
    const visited = state.collection.has(w.id);
    const item = document.createElement('div');
    item.className = 'collection-item' + (visited ? '' : ' locked');
    item.style.backgroundImage = `url('/api/cover/${w.id}')`;
    item.innerHTML = `<div class="ci-label">${visited ? w.name : '???'}</div>`;
    if (visited) {
      item.style.cursor = 'pointer';
      item.addEventListener('click', () => {
        $('#collectionModal').classList.remove('open');
        startWarp(w.id);
      });
    }
    grid.appendChild(item);
  });
  $('#collectionModal').classList.add('open');
}
function updateCollectionCount() {
  $('#collectionCount').textContent = state.collection.size;
}

// ============================================================
// Player physics + camera (runs every frame in world phase)
// ============================================================
const tmpForward = new THREE.Vector3();
const tmpRight = new THREE.Vector3();
const tmpDelta = new THREE.Vector3();

function updatePlayer(dt) {
  if (!state.player) return;
  const p = state.player;

  // Read keys
  let fw = state.input.fw, rt = state.input.rt;
  if (keys.has('KeyW') || keys.has('ArrowUp'))    fw += 1;
  if (keys.has('KeyS') || keys.has('ArrowDown'))  fw -= 1;
  if (keys.has('KeyA') || keys.has('ArrowLeft'))  rt -= 1;
  if (keys.has('KeyD') || keys.has('ArrowRight')) rt += 1;
  const mag = Math.hypot(fw, rt);
  if (mag > 1) { fw /= mag; rt /= mag; }

  const speedBase = 4.2;
  const speed = (keys.has('ShiftLeft') || keys.has('ShiftRight')) ? speedBase*1.8 : speedBase;

  // Forward based on yaw
  tmpForward.set(-Math.sin(state.input.yaw), 0, -Math.cos(state.input.yaw));
  tmpRight.set(Math.cos(state.input.yaw), 0, -Math.sin(state.input.yaw));

  tmpDelta.set(0,0,0);
  tmpDelta.addScaledVector(tmpForward, fw * speed * dt);
  tmpDelta.addScaledVector(tmpRight, rt * speed * dt);

  // Tentative new position
  const nx = p.pos.x + tmpDelta.x;
  const nz = p.pos.z + tmpDelta.z;

  // Basic collision (from worldbuilder)
  const col = p.collide(nx, nz, p.radius);
  if (col) {
    // Try slide on each axis separately
    if (!p.collide(p.pos.x + tmpDelta.x, p.pos.z, p.radius)) {
      p.pos.x += tmpDelta.x;
    } else if (!p.collide(p.pos.x, p.pos.z + tmpDelta.z, p.radius)) {
      p.pos.z += tmpDelta.z;
    }
  } else {
    p.pos.x = nx; p.pos.z = nz;
  }

  // Gravity & jump
  const gh = p.groundHeightAt(p.pos.x, p.pos.z);
  if (state.input.jumpQueued && p.onGround) {
    p.vel.y = 6.5;
    p.onGround = false;
  }
  state.input.jumpQueued = false;
  p.vel.y -= 18 * dt;
  p.pos.y += p.vel.y * dt;
  if (p.pos.y <= gh) {
    p.pos.y = gh;
    p.vel.y = 0;
    p.onGround = true;
  }

  // Check if close to return door
  if (worldReturnDoor) {
    const d = p.pos.distanceTo(worldReturnDoor.position);
    if (d < 2.5) {
      worldReturnDoor.userData.portalMat.uniforms.uOpacity.value = Math.min(1,
        (worldReturnDoor.userData.portalMat.uniforms.uOpacity.value ?? 0) + dt*2);
      if (d < 1.2 && !worldReturnDoor.userData.triggered) {
        worldReturnDoor.userData.triggered = true;
        leaveWorld();
      }
    } else {
      const m = worldReturnDoor.userData.portalMat.uniforms.uOpacity;
      m.value = Math.max(0.15, m.value - dt*0.8);
    }
  }

  // Camera
  const camHeight = p.pos.y + p.height;
  const cx = p.pos.x;
  const cz = p.pos.z;
  if (state.cameraMode === 'first') {
    camera.position.set(cx, camHeight, cz);
  } else {
    // third person: behind player
    const dist = 3.2;
    camera.position.set(
      cx + Math.sin(state.input.yaw) * dist,
      camHeight + 0.6,
      cz + Math.cos(state.input.yaw) * dist
    );
  }
  // Rotate camera
  camera.rotation.order = 'YXZ';
  camera.rotation.y = state.input.yaw;
  camera.rotation.x = state.input.pitch;

  // Coord hud
  $('#coordHud').classList.add('visible');
  $('#coordHud').textContent = `${state.worldObj?.name || ''}  ·  X ${p.pos.x.toFixed(1)}  Y ${p.pos.y.toFixed(1)}  Z ${p.pos.z.toFixed(1)}`;
}

// ============================================================
// Animate
// ============================================================
const clock = new THREE.Clock();
function tick() {
  const dt = Math.min(0.05, clock.getDelta());
  const t = clock.elapsedTime;

  if (state.phase === 'landing' || state.phase === 'picker' || state.phase === 'transition') {
    // Landing camera floats
    const tgtY = state.phase === 'landing' ? 1.7 : 1.9;
    camera.position.x += (Math.sin(t*0.2)*0.3 - camera.position.x) * 0.02;
    camera.position.y += (tgtY + Math.sin(t*0.4)*0.08 - camera.position.y) * 0.02;
    camera.position.z += (8 - camera.position.z) * 0.02;
    camera.lookAt(landingCamTarget.x, landingCamTarget.y, landingCamTarget.z);

    // Door subtle rotation + hover
    landingDoor.position.y = -1.2 + Math.sin(t*0.6)*0.05;
    landingDoor.rotation.y = 0.05 + Math.sin(t*0.3)*0.03;
    landingDoor.userData.portalMat.uniforms.uTime.value = t;
    landingDoor.userData.glowMat.uniforms.uTime.value = t;

    // Stars rotate
    stars.rotation.y = t * 0.01;

    // Particles
    const pos = particles.geometry.attributes.position;
    const v = particles.geometry.userData.vel;
    for (let i=0;i<pos.count;i++){
      pos.array[i*3]   += v[i*3];
      pos.array[i*3+1] += v[i*3+1];
      pos.array[i*3+2] += v[i*3+2];
      if (pos.array[i*3+1] > 6) {
        pos.array[i*3+1] = -1;
        pos.array[i*3]   = (Math.random()-0.5)*10;
        pos.array[i*3+2] = (Math.random()-0.5)*10 - 2;
      }
    }
    pos.needsUpdate = true;

    // Transition effect: zoom toward door
    if (state.phase === 'transition') {
      if (state._transStart == null || state._lastPhase !== 'transition') state._transStart = t;
      const dz = Math.min(7.5, (t - state._transStart) * 3.2);
      camera.position.z = 8 - dz;
      // Open the door progressively
      landingDoor.userData.hinge.rotation.y = -Math.PI*0.6 * Math.min(1, dz/3);
      landingDoor.userData.portalMat.uniforms.uOpacity.value = Math.min(1, dz/2);
    } else {
      state._transStart = null;
    }
    state._lastPhase = state.phase;
  }

  if (state.phase === 'world' && state.player) {
    updatePlayer(dt);
    // World's own tick (e.g. water waves, flying cars)
    state.worldObj?.tick?.(t, dt);
    // Return door shader
    if (worldReturnDoor) {
      worldReturnDoor.userData.portalMat.uniforms.uTime.value = t;
      worldReturnDoor.userData.glowMat.uniforms.uTime.value = t;
    }
  }

  renderer.render(scene, camera);
  requestAnimationFrame(tick);
}

// ============================================================
// Utilities
// ============================================================
function easeOutCubic(t){ return 1 - Math.pow(1-t, 3); }
function easeInCubic(t){ return t*t*t; }

function disposeObject(obj) {
  obj.traverse?.((o) => {
    o.geometry?.dispose?.();
    if (o.material) {
      if (Array.isArray(o.material)) o.material.forEach(m => m.dispose?.());
      else o.material.dispose?.();
    }
  });
}

// ============================================================
// Live feed poll
// ============================================================
async function pollLive() {
  try {
    const r = await fetch('/api/live-feed');
    const d = await r.json();
    $('#liveCount').textContent = `${d.onlineNow} online`;
  } catch (e) {}
}
pollLive();
setInterval(pollLive, 20000);

// ============================================================
// Daily theme
// ============================================================
async function loadDailyTheme() {
  try {
    const r = await fetch('/api/daily-theme');
    const d = await r.json();
    $('#dailyTitle').textContent = d.title;
    $('#dailyDesc').textContent = d.desc;
    // pick a target world from worldIds
    const tgtId = d.worldIds?.[0] || 'rome';
    $('#dailyGo').addEventListener('click', () => startWarp(tgtId));
  } catch (e) {
    $('#dailyTitle').textContent = '今日のテーマ';
    $('#dailyDesc').textContent = '扉の向こうで、あなたを待っている世界があります。';
  }
}
loadDailyTheme();

// Random warp
$('#randomWarp').addEventListener('click', () => {
  const available = WORLDS[Math.floor(Math.random() * WORLDS.length)];
  toast(`🎲 運命の場所 → ${available.name}`, 1800);
  setTimeout(() => startWarp(available.id), 900);
});

// ============================================================
// Boot
// ============================================================
renderFilters();
renderDestinations();
updateCollectionCount();
state.ready = true;

// Remove first loader
setTimeout(() => {
  $('#firstLoad').classList.add('gone');
  setTimeout(() => $('#firstLoad').remove(), 900);
}, 500);

tick();
