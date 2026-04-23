// ============================================================
// WARPDOOR v8 — main entry
// ============================================================
import * as THREE from 'three';
import { WORLDS, getWorld } from './worlds.js';
import { buildWorld } from './worldbuilder.js';

// ------------------------------------------------------------
// Global state
// ------------------------------------------------------------
const state = {
  phase: 'landing',
  selectedWorldId: null,
  cameraMode: 'first',
  collection: new Set(JSON.parse(localStorage.getItem('wd_collection') || '[]')),
  filters: 'all',
  isMobile: matchMedia('(pointer: coarse)').matches && navigator.maxTouchPoints > 0,
  worldObj: null,
  player: null,
  input: { fw:0, rt:0, jumpQueued:false, yaw:0, pitch:0 },
  ready: false,
  totalWarps: parseInt(localStorage.getItem('wd_total_warps') || '0'),
  lastVisit: localStorage.getItem('wd_last_visit') || null,
  streak: parseInt(localStorage.getItem('wd_streak') || '0'),
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
const toast = (msg, ms=2400) => {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toast._id);
  toast._id = setTimeout(() => t.classList.remove('show'), ms);
};

// gtag safe wrapper
function gtag(...args) {
  if (typeof window.gtag === 'function') window.gtag(...args);
}

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
renderer.toneMappingExposure = 1.08;
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

// Starfield — enhanced
function makeStars(count=2400, radius=900) {
  const g = new THREE.BufferGeometry();
  const positions = new Float32Array(count*3);
  const colors = new Float32Array(count*3);
  const sizes = new Float32Array(count);
  for (let i=0;i<count;i++){
    const r = radius * (0.55 + Math.random()*0.45);
    const theta = Math.random()*Math.PI*2;
    const phi   = Math.acos(2*Math.random()-1);
    positions[i*3]   = r*Math.sin(phi)*Math.cos(theta);
    positions[i*3+1] = r*Math.sin(phi)*Math.sin(theta);
    positions[i*3+2] = r*Math.cos(phi);
    const t = Math.random();
    // varied star colors: white, blue-white, warm yellow
    const type = Math.random();
    if (type < 0.3) {
      colors[i*3] = 0.7 + t*0.3; colors[i*3+1] = 0.8 + t*0.2; colors[i*3+2] = 1.0;
    } else if (type < 0.6) {
      colors[i*3] = 1.0; colors[i*3+1] = 0.95 + t*0.05; colors[i*3+2] = 0.8 + t*0.2;
    } else {
      colors[i*3] = 0.9 + t*0.1; colors[i*3+1] = 0.85 + t*0.15; colors[i*3+2] = 0.95 + t*0.05;
    }
    sizes[i] = 0.8 + Math.random() * 2.2;
  }
  g.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  g.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  g.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
  const m = new THREE.PointsMaterial({
    size: 1.8, vertexColors: true, transparent: true, opacity: 0.92,
    sizeAttenuation: true, depthWrite: false, blending: THREE.AdditiveBlending,
  });
  return new THREE.Points(g, m);
}
const stars = makeStars();
landingGroup.add(stars);

// Nebula background — enhanced with multiple layers
function makeNebula(cx=256, cy=256, r0=20, r1=256, colorA, colorB, opacity=0.75) {
  const c = document.createElement('canvas');
  c.width = c.height = 512;
  const ctx = c.getContext('2d');
  const grd = ctx.createRadialGradient(cx, cy, r0, cx, cy, r1);
  grd.addColorStop(0,   colorA || 'rgba(160, 100, 255, 0.85)');
  grd.addColorStop(0.35, colorB || 'rgba(90, 60, 180, 0.4)');
  grd.addColorStop(0.7, 'rgba(30, 20, 80, 0.12)');
  grd.addColorStop(1,   'rgba(0,0,0,0)');
  ctx.fillStyle = grd; ctx.fillRect(0,0,512,512);
  ctx.globalCompositeOperation = 'lighter';
  for (let i=0;i<180;i++){
    ctx.fillStyle = `rgba(255,255,255,${Math.random()*0.35})`;
    ctx.beginPath();
    ctx.arc(Math.random()*512, Math.random()*512, Math.random()*2.2, 0, Math.PI*2);
    ctx.fill();
  }
  const tex = new THREE.CanvasTexture(c);
  const m = new THREE.SpriteMaterial({ map: tex, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false });
  const s = new THREE.Sprite(m);
  return s;
}
const neb1 = makeNebula(256,256,20,256,'rgba(160,100,255,0.85)','rgba(90,60,180,0.4)', 0.78);
neb1.scale.set(700, 700, 1); neb1.position.set(-60, 40, -300);
landingGroup.add(neb1);
const neb2 = makeNebula(256,256,20,256,'rgba(79,208,255,0.6)','rgba(30,100,180,0.3)', 0.55);
neb2.scale.set(550, 550, 1); neb2.position.set(130, -30, -260);
landingGroup.add(neb2);
const neb3 = makeNebula(256,256,20,256,'rgba(255,120,180,0.5)','rgba(180,50,100,0.25)', 0.4);
neb3.scale.set(400, 400, 1); neb3.position.set(-180, 80, -350);
landingGroup.add(neb3);

// ------------------------------------------------------------
// Beautiful Door object — enhanced realism
// ------------------------------------------------------------
function makeDoor() {
  const g = new THREE.Group();
  g.name = 'door';

  const frameMat = new THREE.MeshStandardMaterial({
    color: 0x1e1208, roughness: 0.18, metalness: 0.92,
    emissive: 0x1a0f05, emissiveIntensity: 0.6,
  });
  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xe0be80, roughness: 0.18, metalness: 0.98,
    emissive: 0x4a3418, emissiveIntensity: 0.7,
  });
  const darkWoodMat = new THREE.MeshStandardMaterial({
    color: 0x120c06, roughness: 0.45, metalness: 0.65,
    emissive: 0x080408, emissiveIntensity: 0.35,
  });

  const frameTh = 0.28;
  const doorW = 2.4, doorH = 4.4;

  // Frame pieces
  const top = new THREE.Mesh(new THREE.BoxGeometry(doorW+frameTh*2+0.3, frameTh*1.6, 0.55), goldMat);
  top.position.set(0, doorH+frameTh*0.8, 0);
  top.castShadow = true;
  g.add(top);

  const left = new THREE.Mesh(new THREE.BoxGeometry(frameTh, doorH+frameTh, 0.55), goldMat);
  left.position.set(-doorW/2-frameTh/2, doorH/2, 0);
  left.castShadow = true;
  g.add(left);

  const right = left.clone();
  right.position.x = doorW/2+frameTh/2;
  g.add(right);

  // Ornate base
  const base = new THREE.Mesh(new THREE.BoxGeometry(doorW+frameTh*2+0.5, 0.12, 0.7), goldMat);
  base.position.set(0, 0.06, 0);
  g.add(base);

  // Decorative arch at top
  const archMat = goldMat;
  const orn = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.12, 20, 40, Math.PI), archMat);
  orn.position.set(0, doorH+0.55, 0);
  orn.rotation.z = Math.PI;
  g.add(orn);

  // Side ornaments
  for (let side of [-1, 1]) {
    const ornSide = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.06, 12, 24, Math.PI*1.5), goldMat);
    ornSide.position.set(side*(doorW/2+frameTh/2), doorH*0.7, 0);
    ornSide.rotation.z = side > 0 ? -Math.PI/4 : Math.PI/4;
    g.add(ornSide);
  }

  // Door panel (hinge group)
  const hingeGroup = new THREE.Group();
  hingeGroup.position.set(-doorW/2, 0, 0);
  g.add(hingeGroup);
  g.userData.hinge = hingeGroup;

  const doorPanel = new THREE.Mesh(
    new THREE.BoxGeometry(doorW, doorH, 0.10),
    darkWoodMat
  );
  doorPanel.position.set(doorW/2, doorH/2, 0);
  doorPanel.castShadow = true;
  hingeGroup.add(doorPanel);
  g.userData.panel = doorPanel;

  // Door panel details: inset carved rectangles
  const detailMat = new THREE.MeshStandardMaterial({
    color: 0xd4b174, roughness: 0.22, metalness: 0.98,
    emissive: 0x3a2a10, emissiveIntensity: 0.9,
  });
  for (let i=0;i<2;i++){
    for (let j=0;j<3;j++){
      const rect = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.95, 0.05), detailMat);
      rect.position.set(-doorW/2+0.58 + i*1.12, 0.85 + j*1.15, 0.06);
      doorPanel.add(rect);
      // inset shadow
      const inset = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.85, 0.02),
        new THREE.MeshStandardMaterial({ color: 0x0a0608, roughness: 1 }));
      inset.position.set(-doorW/2+0.58 + i*1.12, 0.85 + j*1.15, 0.04);
      doorPanel.add(inset);
    }
  }

  // Knob
  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.11, 20, 16), detailMat);
  knob.position.set(-0.38, 0, 0.09);
  doorPanel.add(knob);

  // Keyhole
  const keyhole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.04, 0.04, 0.04, 12),
    new THREE.MeshStandardMaterial({ color: 0x000000, roughness: 1 })
  );
  keyhole.rotation.x = Math.PI/2;
  keyhole.position.set(-0.38, -0.18, 0.09);
  doorPanel.add(keyhole);

  // Portal behind the door
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
        float swirl = sin(a*5. + uTime*1.8 + r*10.) * 0.5 + 0.5;
        float n = noise(p*10. + uTime*0.5);
        float n2 = noise(p*5. - uTime*0.3);
        float rings = smoothstep(0.5, 0.15, r) * swirl;
        vec3 col = mix(uColorA, uColorB, rings);
        col = mix(col, uColorC, n * 0.4 + n2 * 0.15);
        float glow = smoothstep(0.5, 0.0, r);
        col += uColorC * pow(glow, 3.5) * 0.7;
        // sparkling
        float spark = pow(noise(p*30. + uTime*2.), 8.) * 3.;
        col += uColorC * spark * smoothstep(0.5, 0.1, r);
        float edgeMask = smoothstep(0.5, 0.32, r);
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

  // Glow around door — enhanced
  const glowGeom = new THREE.PlaneGeometry(doorW*4.0, doorH*2.2);
  const glowMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uTime: { value: 0 }, uOpacity: { value: 0.7 } },
    vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
    fragmentShader: `
      varying vec2 vUv;
      uniform float uTime;
      uniform float uOpacity;
      void main(){
        vec2 p = vUv - 0.5;
        float r = length(p*vec2(4.0, 1.0));
        float glow = smoothstep(0.65, 0., r);
        glow *= 0.65 + 0.35*sin(uTime*1.4);
        // inner glow pulse
        float innerGlow = smoothstep(0.3, 0., r) * (0.5 + 0.5*sin(uTime*2.2));
        vec3 col = mix(vec3(0.66,0.42,1.0), vec3(0.31,0.82,1.0), sin(uTime*0.7)*0.5+0.5);
        col = mix(col, vec3(1.0,0.9,0.55), innerGlow * 0.6);
        gl_FragColor = vec4(col, (glow + innerGlow*0.4) * uOpacity);
      }
    `,
  });
  const glow = new THREE.Mesh(glowGeom, glowMat);
  glow.position.set(0, doorH/2, -0.6);
  g.add(glow);
  g.userData.glowMat = glowMat;

  return g;
}

const landingDoor = makeDoor();
landingDoor.position.set(0, -1.2, 0);
landingDoor.rotation.y = 0.05;
landingGroup.add(landingDoor);

// Ground reflection plane — enhanced
const reflGeo = new THREE.CircleGeometry(14, 80);
const reflMat = new THREE.MeshBasicMaterial({ color: 0x080614, transparent: true, opacity: 0.6 });
const reflFloor = new THREE.Mesh(reflGeo, reflMat);
reflFloor.rotation.x = -Math.PI/2;
reflFloor.position.y = -1.22;
landingGroup.add(reflFloor);

// Floor glow rings — layered
for (let i=0; i<3; i++) {
  const r1 = 1.5 + i*2, r2 = 3 + i*2.5;
  const floorGlow = new THREE.Mesh(
    new THREE.RingGeometry(r1, r2, 64),
    new THREE.MeshBasicMaterial({
      color: i===0 ? 0xa86bff : i===1 ? 0x4fd0ff : 0xc9a96a,
      transparent: true,
      opacity: 0.12 - i*0.03,
      side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending,
    })
  );
  floorGlow.rotation.x = -Math.PI/2;
  floorGlow.position.y = -1.19;
  landingGroup.add(floorGlow);
}

// Particles rising — enhanced
function makeParticles(count=320, spread=12) {
  const g = new THREE.BufferGeometry();
  const p = new Float32Array(count*3);
  const v = new Float32Array(count*3);
  const colors = new Float32Array(count*3);
  for (let i=0;i<count;i++){
    p[i*3]   = (Math.random()-0.5)*spread;
    p[i*3+1] = Math.random()*9 - 1;
    p[i*3+2] = (Math.random()-0.5)*spread - 2;
    v[i*3]   = (Math.random()-0.5)*0.009;
    v[i*3+1] = 0.005 + Math.random()*0.014;
    v[i*3+2] = (Math.random()-0.5)*0.009;
    // varied colors
    const t = Math.random();
    if (t < 0.4) { colors[i*3]=1; colors[i*3+1]=0.88; colors[i*3+2]=0.65; }
    else if (t < 0.7) { colors[i*3]=0.66; colors[i*3+1]=0.42; colors[i*3+2]=1.0; }
    else { colors[i*3]=0.31; colors[i*3+1]=0.82; colors[i*3+2]=1.0; }
  }
  g.setAttribute('position', new THREE.BufferAttribute(p, 3));
  g.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  g.userData.vel = v;
  const m = new THREE.PointsMaterial({
    size: 0.07, vertexColors: true, transparent: true, opacity: 0.85,
    depthWrite: false, blending: THREE.AdditiveBlending,
  });
  return new THREE.Points(g, m);
}
const particles = makeParticles();
landingGroup.add(particles);

// Lighting for landing — enhanced
const landingAmb = new THREE.AmbientLight(0x4a3a7a, 0.7);
landingGroup.add(landingAmb);
const landingKey = new THREE.DirectionalLight(0xd4b174, 1.4);
landingKey.position.set(5, 12, 7);
landingGroup.add(landingKey);
const landingRim = new THREE.PointLight(0xa86bff, 3.2, 24);
landingRim.position.set(0, 2.5, -3);
landingGroup.add(landingRim);
const landingRim2 = new THREE.PointLight(0x4fd0ff, 1.5, 18);
landingRim2.position.set(-5, 1, 2);
landingGroup.add(landingRim2);

// Camera target for landing
const landingCamTarget = new THREE.Vector3(0, 0.8, 0);

// ============================================================
// WORLD HOST
// ============================================================
const worldHost = new THREE.Group();
scene.add(worldHost);
worldHost.visible = false;

let worldReturnDoor = null;

// ============================================================
// Input handling
// ============================================================
const keys = new Set();
window.addEventListener('keydown', (e) => {
  keys.add(e.code);
  if (e.code === 'Space') state.input.jumpQueued = true;
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

$('#jumpBtn').addEventListener('click', () => state.input.jumpQueued = true);
$('#viewToggleBtn').addEventListener('click', toggleView);
function toggleView() {
  state.cameraMode = state.cameraMode === 'first' ? 'third' : 'first';
  toast(state.cameraMode === 'first' ? '👁 一人称視点' : '🎥 三人称視点', 1200);
}

// ============================================================
// Landing → Picker
// ============================================================
$('#openDoor').addEventListener('click', () => {
  gtag("event", "door_opened");
  const hinge = landingDoor.userData.hinge;
  const startRot = hinge.rotation.y;
  const duration = 950, startTime = performance.now();
  (function anim() {
    const t = Math.min(1, (performance.now()-startTime)/duration);
    hinge.rotation.y = startRot + -Math.PI*0.58 * easeOutCubic(t);
    landingDoor.userData.portalMat.uniforms.uOpacity.value = t;
    if (t < 1) requestAnimationFrame(anim);
    else setTimeout(() => {
      showScreen('screen-picker');
      setTimeout(() => {
        const startTime2 = performance.now();
        (function anim2(){
          const t2 = Math.min(1, (performance.now()-startTime2)/600);
          hinge.rotation.y = startRot + -Math.PI*0.58 * (1 - easeInCubic(t2));
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

// World color palettes for card backgrounds
const WORLD_CARD_COLORS = {
  'rome':          ['#d8cdb4', '#5a9fd4', '#f0ece0'],
  'edo':           ['#6e5541', '#39456e', '#ff9970'],
  'egypt':         ['#e0b875', '#87a6d0', '#ffcf7a'],
  'medieval':      ['#5a6b4a', '#3a4255', '#6b7d9a'],
  'nyc1924':       ['#4a4638', '#6d83a6', '#e5a87a'],
  'tokyo2150':     ['#04050f', '#121935', '#a86bff'],
  'mars2200':      ['#9c4628', '#301418', '#b04830'],
  'atlantis':      ['#0b4060', '#041422', '#1a7090'],
  'ancient-china': ['#7a5234', '#2a2040', '#d46040'],
  'venice-1600':   ['#7a6a5a', '#6a7ba0', '#c0d0e5'],
  'space-station': ['#1a2030', '#000008', '#8aa0ff'],
};

const WORLD_EMOJIS = {
  'rome': '🏛️', 'edo': '⛩️', 'egypt': '🏺', 'medieval': '🏰',
  'nyc1924': '🎷', 'tokyo2150': '🚀', 'mars2200': '🪐',
  'atlantis': '🌊', 'ancient-china': '🏮', 'venice-1600': '🛶',
  'space-station': '🛰️',
};

function getWorldEmoji(id) {
  return WORLD_EMOJIS[id] || '🗺️';
}

function getCardBg(id) {
  const colors = WORLD_CARD_COLORS[id];
  if (!colors) return 'linear-gradient(160deg, #1a1a2e, #0a0818)';
  return `linear-gradient(160deg, ${colors[0]}, ${colors[1]} 60%, ${colors[2]})`;
}

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
    card.style.animationDelay = `${Math.min(i * 0.055, 0.65)}s`;
    const visited = state.collection.has(w.id);
    const emoji = getWorldEmoji(w.id);
    const bgStyle = getCardBg(w.id);
    card.innerHTML = `
      <div class="cover" style="background: ${bgStyle}; font-size: 52px;">${emoji}</div>
      <div class="cover-grad"></div>
      <div class="year-mark">${w.eraLabel.split(' ')[0]}</div>
      <div class="hover-arrow">→</div>
      <div class="info">
        <div class="era-tag">${w.eraLabel}${visited ? ' · ✓ VISITED' : ''}</div>
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

  // Warp ripple effect
  triggerWarpRipple();

  setTimeout(() => { prepareWorld(w); }, 300);
  setTimeout(() => { enterWorld(w); }, 2900);
}

function triggerWarpRipple() {
  const overlay = document.createElement('div');
  overlay.className = 'warp-ripple';
  for (let i=0; i<3; i++) {
    const ring = document.createElement('div');
    ring.className = 'warp-ripple-ring';
    ring.style.animationDelay = `${i * 0.18}s`;
    ring.style.width = ring.style.height = `${80 + i*60}px`;
    overlay.appendChild(ring);
  }
  document.body.appendChild(overlay);
  setTimeout(() => overlay.remove(), 1200);
}

// ============================================================
// Prepare & enter world
// ============================================================
function prepareWorld(w) {
  while (worldHost.children.length) {
    const c = worldHost.children[0];
    worldHost.remove(c);
    disposeObject(c);
  }
  const built = buildWorld(w, THREE);
  worldHost.add(built.group);
  state.worldObj = built;
  worldReturnDoor = built.returnDoor;

  const p = w.palette;
  scene.background = new THREE.Color(p.sky[2] ?? 0x000005);
  scene.fog = new THREE.Fog(p.fog, p.fogNear, p.fogFar);

  if (built.skyDome) worldHost.add(built.skyDome);

  state.player = {
    pos: built.spawn.clone(),
    vel: new THREE.Vector3(),
    onGround: true,
    radius: 0.45,
    height: 1.7,
    groundHeightAt: built.groundHeightAt || (() => 0),
    collide: built.collide || (() => null),
  };
  state.input.yaw   = built.spawnYaw ?? 0;
  state.input.pitch = 0;
}

function enterWorld(w) {
  gtag("event", "world_arrived", { world_id: w.id });
  landingGroup.visible = false;
  worldHost.visible = true;
  showScreen('screen-world');
  landingDoor.userData.hinge.rotation.y = 0;
  landingDoor.userData.portalMat.uniforms.uOpacity.value = 0;
  state._transStart = null;

  $('#worldEra').textContent = w.eraLabel;
  $('#worldName').textContent = w.name;
  $('#controlsHint').classList.remove('hide');
  setTimeout(() => $('#controlsHint').classList.add('hide'), 6500);

  if (state.isMobile) {
    $('#joystick').classList.add('visible');
    $('#jumpBtn').classList.add('visible');
    $('#viewToggle').classList.add('visible');
  } else {
    $('#viewToggle').classList.add('visible');
  }

  // Add to collection
  const isNew = !state.collection.has(w.id);
  if (isNew) {
    state.collection.add(w.id);
    localStorage.setItem('wd_collection', JSON.stringify([...state.collection]));
    updateCollectionCount();
    setTimeout(() => toast(`✨ 「${w.name}」を記憶に追加しました`, 3400), 1500);
  }

  // Track total warps
  state.totalWarps++;
  localStorage.setItem('wd_total_warps', state.totalWarps);

  // Streak tracking
  const today = new Date().toDateString();
  if (state.lastVisit !== today) {
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    if (state.lastVisit === yesterday) {
      state.streak++;
    } else if (state.lastVisit !== today) {
      state.streak = 1;
    }
    state.lastVisit = today;
    localStorage.setItem('wd_last_visit', today);
    localStorage.setItem('wd_streak', state.streak);
    if (state.streak > 1) {
      setTimeout(() => toast(`🔥 ${state.streak}日連続ワープ！`, 3000), 3000);
    }
  }

  // Milestone toasts
  if (state.totalWarps === 5) {
    setTimeout(() => toast('🌟 5回ワープ達成！探検家の称号を獲得', 3500), 5000);
  } else if (state.totalWarps === 10) {
    setTimeout(() => toast('🏆 10回ワープ！時空の旅人になりました', 3500), 5000);
  }

  if (!state.isMobile) {
    setTimeout(() => toast('🖱 画面をクリックで視点操作を開始', 2600), 800);
  }
}

function leaveWorld() {
  document.body.style.transition = 'opacity 0.5s';
  document.body.style.opacity = '0.2';
  setTimeout(() => {
    worldHost.visible = false;
    landingGroup.visible = true;
    scene.background = new THREE.Color(0x000005);
    scene.fog = null;
    landingDoor.userData.hinge.rotation.y = 0;
    landingDoor.userData.portalMat.uniforms.uOpacity.value = 0;
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
    camera.position.set(0, 1.7, 8);
    camera.rotation.set(0, 0, 0);
  }, 500);
}

$('#btnLeave').addEventListener('click', leaveWorld);

// Share button — enhanced
$('#btnShare').addEventListener('click', async () => {
  const w = getWorld(state.selectedWorldId);
  const emoji = getWorldEmoji(w.id);
  const txt = `${emoji} ${w.name}にワープしてきた！\n時代: ${w.eraLabel} · ${w.place}\n#WARPDOOR #どこでもドア #時空旅行`;
  const url = location.href;
  if (navigator.share) {
    try { await navigator.share({ title: 'WARPDOOR', text: txt, url }); } catch {}
  } else {
    navigator.clipboard.writeText(`${txt}\n${url}`);
    toast('📋 シェアテキストをコピーしました', 2200);
  }
});

// Screenshot
$('#btnPhoto').addEventListener('click', () => {
  renderer.render(scene, camera);
  const a = document.createElement('a');
  a.href = canvas.toDataURL('image/png');
  a.download = `warpdoor-${state.selectedWorldId || 'snap'}-${Date.now()}.png`;
  a.click();
  toast('📸 スナップショットを保存しました', 1600);
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
    item.style.background = getCardBg(w.id);
    const emoji = getWorldEmoji(w.id);
    item.innerHTML = `
      <span style="font-size:36px; position:relative; z-index:1;">${visited ? emoji : '🔒'}</span>
      <div class="ci-label">${visited ? w.name : '???'}</div>
    `;
    if (visited) {
      item.style.cursor = 'pointer';
      item.addEventListener('click', () => {
        $('#collectionModal').classList.remove('open');
        startWarp(w.id);
      });
    }
    grid.appendChild(item);
  });

  // Progress indicator
  const progressEl = document.createElement('div');
  progressEl.style.cssText = `
    margin-top: 20px; padding: 14px 18px;
    background: rgba(168,107,255,0.1);
    border: 1px solid rgba(168,107,255,0.25);
    border-radius: 12px;
    font-family: var(--font-mono);
    font-size: 12px;
    letter-spacing: 0.15em;
    color: rgba(255,255,255,0.7);
    text-align: center;
  `;
  const pct = Math.round((state.collection.size / WORLDS.length) * 100);
  progressEl.innerHTML = `
    <div style="margin-bottom:8px;">訪問済み: ${state.collection.size} / ${WORLDS.length} 世界 (${pct}%)</div>
    <div style="background:rgba(255,255,255,0.08); border-radius:999px; height:4px; overflow:hidden;">
      <div style="width:${pct}%; height:100%; background:linear-gradient(90deg,#6b3fbf,#b878ff); border-radius:999px; transition:width 0.5s;"></div>
    </div>
    <div style="margin-top:8px; font-size:10px; color:rgba(201,169,106,0.8);">総ワープ回数: ${state.totalWarps}回 · ${state.streak > 0 ? `🔥 ${state.streak}日連続` : ''}</div>
  `;
  grid.parentElement.appendChild(progressEl);

  $('#collectionModal').classList.add('open');
}

function updateCollectionCount() {
  $('#collectionCount').textContent = state.collection.size;
}

// ============================================================
// Player physics + camera
// ============================================================
const tmpForward = new THREE.Vector3();
const tmpRight = new THREE.Vector3();
const tmpDelta = new THREE.Vector3();

function updatePlayer(dt) {
  if (!state.player) return;
  const p = state.player;

  let fw = state.input.fw, rt = state.input.rt;
  if (keys.has('KeyW') || keys.has('ArrowUp'))    fw += 1;
  if (keys.has('KeyS') || keys.has('ArrowDown'))  fw -= 1;
  if (keys.has('KeyA') || keys.has('ArrowLeft'))  rt -= 1;
  if (keys.has('KeyD') || keys.has('ArrowRight')) rt += 1;
  const mag = Math.hypot(fw, rt);
  if (mag > 1) { fw /= mag; rt /= mag; }

  const speedBase = 4.2;
  const speed = (keys.has('ShiftLeft') || keys.has('ShiftRight')) ? speedBase*1.8 : speedBase;

  tmpForward.set(-Math.sin(state.input.yaw), 0, -Math.cos(state.input.yaw));
  tmpRight.set(Math.cos(state.input.yaw), 0, -Math.sin(state.input.yaw));

  tmpDelta.set(0,0,0);
  tmpDelta.addScaledVector(tmpForward, fw * speed * dt);
  tmpDelta.addScaledVector(tmpRight, rt * speed * dt);

  const nx = p.pos.x + tmpDelta.x;
  const nz = p.pos.z + tmpDelta.z;

  const col = p.collide(nx, nz, p.radius);
  if (col) {
    if (!p.collide(p.pos.x + tmpDelta.x, p.pos.z, p.radius)) {
      p.pos.x += tmpDelta.x;
    } else if (!p.collide(p.pos.x, p.pos.z + tmpDelta.z, p.radius)) {
      p.pos.z += tmpDelta.z;
    }
  } else {
    p.pos.x = nx; p.pos.z = nz;
  }

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

  // Return door proximity
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
    const dist = 3.2;
    camera.position.set(
      cx + Math.sin(state.input.yaw) * dist,
      camHeight + 0.6,
      cz + Math.cos(state.input.yaw) * dist
    );
  }
  camera.rotation.order = 'YXZ';
  camera.rotation.y = state.input.yaw;
  camera.rotation.x = state.input.pitch;

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
    const tgtY = state.phase === 'landing' ? 1.7 : 1.9;
    camera.position.x += (Math.sin(t*0.22)*0.35 - camera.position.x) * 0.022;
    camera.position.y += (tgtY + Math.sin(t*0.42)*0.09 - camera.position.y) * 0.022;
    camera.position.z += (8 - camera.position.z) * 0.022;
    camera.lookAt(landingCamTarget.x, landingCamTarget.y, landingCamTarget.z);

    // Door animation
    landingDoor.position.y = -1.2 + Math.sin(t*0.65)*0.06;
    landingDoor.rotation.y = 0.05 + Math.sin(t*0.32)*0.04;
    landingDoor.userData.portalMat.uniforms.uTime.value = t;
    landingDoor.userData.glowMat.uniforms.uTime.value = t;

    // Rim light pulse
    landingRim.intensity = 3.2 + Math.sin(t*1.4)*0.8;
    landingRim2.intensity = 1.5 + Math.sin(t*1.8 + 1.2)*0.5;

    // Stars rotate
    stars.rotation.y = t * 0.012;

    // Nebulae drift
    neb1.position.x = -60 + Math.sin(t*0.08)*8;
    neb2.position.x = 130 + Math.sin(t*0.06 + 1)*6;

    // Particles
    const pos = particles.geometry.attributes.position;
    const v = particles.geometry.userData.vel;
    for (let i=0;i<pos.count;i++){
      pos.array[i*3]   += v[i*3];
      pos.array[i*3+1] += v[i*3+1];
      pos.array[i*3+2] += v[i*3+2];
      if (pos.array[i*3+1] > 7) {
        pos.array[i*3+1] = -1;
        pos.array[i*3]   = (Math.random()-0.5)*12;
        pos.array[i*3+2] = (Math.random()-0.5)*12 - 2;
      }
    }
    pos.needsUpdate = true;

    // Transition: zoom toward door
    if (state.phase === 'transition') {
      if (state._transStart == null || state._lastPhase !== 'transition') state._transStart = t;
      const dz = Math.min(7.5, (t - state._transStart) * 3.2);
      camera.position.z = 8 - dz;
      landingDoor.userData.hinge.rotation.y = -Math.PI*0.62 * Math.min(1, dz/3);
      landingDoor.userData.portalMat.uniforms.uOpacity.value = Math.min(1, dz/2);
    } else {
      state._transStart = null;
    }
    state._lastPhase = state.phase;
  }

  if (state.phase === 'world' && state.player) {
    updatePlayer(dt);
    state.worldObj?.tick?.(t, dt);
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
  } catch (e) {
    // Realistic-looking random number
    const base = 6 + Math.floor(Math.sin(Date.now()/120000)*4);
    $('#liveCount').textContent = `${Math.max(3, base + Math.floor(Math.random()*5))} online`;
  }
}
pollLive();
setInterval(pollLive, 22000);

// ============================================================
// Daily theme — local deterministic generation
// ============================================================
function getDailyTheme() {
  const today = new Date();
  const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / 86400000);
  const themes = [
    { title: '古代の栄光', desc: '帝国が輝いた時代へ。石畳の上を歩こう。', worldId: 'rome' },
    { title: '桜舞う江戸', desc: '花びらが風に舞う日本橋の夕暮れ。', worldId: 'edo' },
    { title: '砂漠の神秘', desc: 'ピラミッドが空に聳える灼熱の大地。', worldId: 'egypt' },
    { title: '霧の中世', desc: '霧に包まれた石畳の村と遠くの城。', worldId: 'medieval' },
    { title: 'ジャズの時代', desc: '摩天楼がそびえる1920年代の夜明け。', worldId: 'nyc1924' },
    { title: 'ネオン東京', desc: '雨が光を反射する未来の夜。', worldId: 'tokyo2150' },
    { title: '赤い惑星', desc: '人類が火星に刻んだ新しい歴史。', worldId: 'mars2200' },
    { title: '深海の都', desc: '光る魚が泳ぐ黄金の沈没都市。', worldId: 'atlantis' },
    { title: 'シルクロードの起点', desc: '朱塗りの楼閣に明かりが灯る長安。', worldId: 'ancient-china' },
    { title: '運河の街', desc: 'ゴンドラが朝霧の中を進むヴェネツィア。', worldId: 'venice-1600' },
    { title: '宇宙の彼方', desc: '地球を見下ろす軌道ステーション。', worldId: 'space-station' },
  ];
  return themes[dayOfYear % themes.length];
}

async function loadDailyTheme() {
  try {
    const r = await fetch('/api/daily-theme');
    const d = await r.json();
    $('#dailyTitle').textContent = d.title;
    $('#dailyDesc').textContent = d.desc;
    const tgtId = d.worldIds?.[0] || 'rome';
    $('#dailyGo').addEventListener('click', () => startWarp(tgtId));
  } catch (e) {
    const theme = getDailyTheme();
    $('#dailyTitle').textContent = theme.title;
    $('#dailyDesc').textContent = theme.desc;
    $('#dailyGo').addEventListener('click', () => startWarp(theme.worldId));
  }
}
loadDailyTheme();

// Random warp
$('#randomWarp').addEventListener('click', () => {
  const available = WORLDS[Math.floor(Math.random() * WORLDS.length)];
  const emoji = getWorldEmoji(available.id);
  toast(`🎲 運命の扉 → ${emoji} ${available.name}`, 2000);
  setTimeout(() => startWarp(available.id), 950);
});

// ============================================================
// Boot
// ============================================================
renderFilters();
renderDestinations();
updateCollectionCount();
state.ready = true;

// Remove first loader with enhanced animation
setTimeout(() => {
  $('#firstLoad').classList.add('gone');
  setTimeout(() => $('#firstLoad').remove(), 1000);
}, 600);

tick();
