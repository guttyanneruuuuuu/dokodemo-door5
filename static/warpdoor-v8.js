// WARPDOOR v8 — HYPER-REALISTIC IMMERSIVE EXPERIENCE
// Flow: Landing → Door (3D photorealistic) → Wormhole → World (360° exploration)
// ============================================================
import * as THREE from 'three'
import { WORLDS, SCENE_BUILDERS } from './worlds.js'
import { REAL_LOCATIONS, getRandomLocation, getTodayThemeLocations } from './maps-integration.js'
import { UserProfile, WarpRecord, WarpSpotRanking, DailyChallenge, PointsSystem, initializeSocialSystem } from './social-gamification.js'
import { createToast, createModal, createLocationCard } from './ui-components.js'

/* ─── Utils ───────────────────────────────── */
const h = (tag, props = {}, ...children) => {
  const el = document.createElement(tag)
  for (const [k, v] of Object.entries(props)) {
    if (k === 'class') el.className = v
    else if (k === 'style') Object.assign(el.style, v)
    else if (k.startsWith('on')) el.addEventListener(k.slice(2).toLowerCase(), v)
    else if (k === 'html') el.innerHTML = v
    else if (v !== false && v != null) el.setAttribute(k, v)
  }
  for (const c of children.flat()) {
    if (c == null || c === false) continue
    el.appendChild(c.nodeType ? c : document.createTextNode(String(c)))
  }
  return el
}
const qs = (sel, root = document) => root.querySelector(sel)
const clamp = (v, mn, mx) => Math.max(mn, Math.min(mx, v))
const lerp = (a, b, t) => a + (b - a) * t

/* ─── Local storage ──────────────────────────── */
const storage = {
  get(key, def) { try { const v = localStorage.getItem('wd_' + key); return v ? JSON.parse(v) : def } catch { return def } },
  set(key, val) { try { localStorage.setItem('wd_' + key, JSON.stringify(val)) } catch {} },
}

/* ─── Soundscape ─────────────────────────────── */
class Soundscape {
  constructor() { this.ctx = null; this.master = null; this.nodes = []; this.enabled = storage.get('soundEnabled', true) }
  ensure() {
    if (this.ctx) return
    const AC = window.AudioContext || window.webkitAudioContext
    if (!AC) return
    this.ctx = new AC()
    this.master = this.ctx.createGain(); this.master.gain.value = this.enabled ? 0.14 : 0
    this.master.connect(this.ctx.destination)
  }
  stop() {
    this.nodes.forEach(n => { try { n.stop() } catch {} try { n.disconnect() } catch {} })
    this.nodes = []
  }
  setEnabled(v) {
    this.enabled = v; storage.set('soundEnabled', v)
    if (this.master && this.ctx) this.master.gain.setTargetAtTime(v ? 0.14 : 0, this.ctx.currentTime, 0.3)
  }
  playUI(freq = 880, dur = .12, type = 'sine', gain = .08) {
    this.ensure(); if (!this.ctx) return
    const ctx = this.ctx, now = ctx.currentTime
    const o = ctx.createOscillator(); const g = ctx.createGain()
    o.type = type; o.frequency.value = freq
    g.gain.value = 0; g.gain.linearRampToValueAtTime(gain, now + 0.01)
    g.gain.exponentialRampToValueAtTime(0.0001, now + dur)
    o.connect(g); g.connect(this.master); o.start(now); o.stop(now + dur + .05)
  }
  playDoorOpen() {
    this.ensure(); if (!this.ctx) return
    const ctx = this.ctx, now = ctx.currentTime
    // 重厚で現実的なドア開閉音
    const freqs = [45, 67.5, 135, 180]
    freqs.forEach((f, i) => {
      const o = ctx.createOscillator(); const g = ctx.createGain()
      o.type = i < 2 ? 'sine' : 'triangle'; o.frequency.value = f
      g.gain.setValueAtTime(0, now + i*0.12)
      g.gain.linearRampToValueAtTime(0.12, now + i*0.12 + 0.08)
      g.gain.exponentialRampToValueAtTime(0.001, now + i*0.12 + 2.2)
      o.connect(g); g.connect(this.master); o.start(now + i*0.12); o.stop(now + i*0.12 + 2.3)
    })
    // スパークル
    setTimeout(() => {
      for (let i = 0; i < 8; i++) {
        const o = ctx.createOscillator(); const g = ctx.createGain()
        o.type = 'sine'; o.frequency.value = 1400 + Math.random() * 2800
        const t = now + 0.5 + i * 0.06
        g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.05, t + 0.02)
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.35)
        o.connect(g); g.connect(this.master); o.start(t); o.stop(t + 0.4)
      }
    }, 0)
  }
  playWarpWhoosh() {
    this.ensure(); if (!this.ctx) return
    const ctx = this.ctx, now = ctx.currentTime
    // 時空間歪み音
    const o = ctx.createOscillator(); const g = ctx.createGain()
    o.type = 'sawtooth'; o.frequency.setValueAtTime(60, now)
    o.frequency.exponentialRampToValueAtTime(1600, now + 1.6)
    g.gain.setValueAtTime(0, now); g.gain.linearRampToValueAtTime(0.22, now + 0.1)
    g.gain.linearRampToValueAtTime(0, now + 1.9)
    o.connect(g); g.connect(this.master); o.start(now); o.stop(now + 2.0)
  }
  playArrival() {
    this.ensure(); if (!this.ctx) return
    const ctx = this.ctx, now = ctx.currentTime
    const freqs = [440, 554.37, 659.25, 880]
    freqs.forEach((f, i) => {
      const o = ctx.createOscillator(); const g = ctx.createGain()
      o.type = 'sine'; o.frequency.value = f
      const t = now + i * 0.1
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.08, t + 0.03)
      g.gain.exponentialRampToValueAtTime(0.001, t + 2.0)
      o.connect(g); g.connect(this.master); o.start(t); o.stop(t + 2.1)
    })
  }
  startAmbient(world) {
    this.ensure(); if (!this.ctx) return
    this.stop()
    const ctx = this.ctx
    const tone = world.soundscape?.tone || 'warm'
    const baseFreq = world.soundscape?.freq || 180
    const pad = ctx.createOscillator(); pad.type = tone === 'cool' ? 'sawtooth' : 'triangle'
    pad.frequency.value = baseFreq
    const pf = ctx.createBiquadFilter(); pf.type = 'lowpass'; pf.frequency.value = 500
    const pg = ctx.createGain(); pg.gain.value = 0.06
    pad.connect(pf); pf.connect(pg); pg.connect(this.master); pad.start(); this.nodes.push(pad)
    if (tone === 'cool') {
      const sub = ctx.createOscillator(); sub.type = 'sine'; sub.frequency.value = baseFreq / 2
      const sg = ctx.createGain(); sg.gain.value = 0.08
      sub.connect(sg); sg.connect(this.master); sub.start(); this.nodes.push(sub)
    }
  }
}
const sound = new Soundscape()

/* ─── State ──────────────────────────────────── */
const state = {
  phase: 'landing', // landing | door | warp | world
  world: null,
  arrivalDone: false,
  stamps: storage.get('stamps', {}),
  hasPass: storage.get('hasPass', false),
  totalWarps: storage.get('totalWarps', 0),
  cameraYaw: 0,
  cameraPitch: 0,
}

function incrementStamp(worldId) {
  state.stamps[worldId] = (state.stamps[worldId] || 0) + 1
  state.totalWarps++
  storage.set('stamps', state.stamps)
  storage.set('totalWarps', state.totalWarps)
}

/* ─── Scene lifecycle ────────────────────────── */
let currentScene = null

function disposeScene() {
  if (!currentScene) return
  if (currentScene.cleanup) { try { currentScene.cleanup() } catch (e) { console.warn(e) } }
  const { renderer, scene, raf } = currentScene
  if (raf) cancelAnimationFrame(raf)
  if (scene) {
    scene.traverse(obj => {
      if (obj.geometry) obj.geometry.dispose()
      if (obj.material) {
        if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose())
        else obj.material.dispose()
      }
    })
  }
  if (renderer) {
    renderer.dispose()
    if (renderer.domElement && renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement)
  }
  currentScene = null
}

/* ============================================================
 * LANDING
 * ============================================================ */
async function renderLanding() {
  disposeScene(); sound.stop()
  state.phase = 'landing'
  const root = qs('#root'); root.innerHTML = ''

  const landing = h('div', { class: 'landing' })

  // Stars
  for (let i = 0; i < 200; i++) {
    landing.appendChild(h('div', {
      class: 'star',
      style: {
        left: Math.random()*100 + '%', top: Math.random()*100 + '%',
        width: (Math.random()*2.4+0.4) + 'px', height: (Math.random()*2.4+0.4) + 'px',
        animation: `twinkle ${(Math.random()*4+2)}s ${Math.random()*5}s infinite`,
      }
    }))
  }
  landing.appendChild(h('div', { class: 'aurora' }))
  landing.appendChild(h('div', { class: 'scanline' }))
  landing.appendChild(h('div', { class: 'grain' }))

  // Topbar
  const stats = h('div', { class: 'stats' },
    h('div', {}, '🚪 ', h('span', { class: 'k' }, state.totalWarps.toLocaleString()), ' YOUR WARPS'),
    h('button', {
      class: 'hud-btn',
      title: sound.enabled ? 'サウンドをオフ' : 'サウンドをオン',
      onclick: (e) => { sound.setEnabled(!sound.enabled); e.currentTarget.textContent = sound.enabled ? '🔊' : '🔇' }
    }, sound.enabled ? '🔊' : '🔇'),
  )

  landing.appendChild(h('div', { class: 'topbar' },
    h('div', { class: 'topbar-brand' }, 'WARPDOOR', h('span', { class: 'brand-version' }, 'v8.0')),
    stats
  ))

  // Hero
  landing.appendChild(h('div', { class: 'hero' },
    h('div', { class: 'hero-tag' }, '✦  SPACETIME  EXPERIENCE  ✦'),
    h('h1', { class: 'hero-title' }, 'WARPDOOR'),
    h('p', { class: 'hero-sub' }, '扉の向こうは、いつかの時代 —— 本物のように没入する、時空間旅行体験'),
  ))

  // Action row
  landing.appendChild(h('div', { class: 'action-row' },
    h('button', {
      class: 'action-btn primary',
      onclick: () => { sound.playUI(880); randomWarp() }
    }, h('span', { class: 'act-icon' }, '🎲'), '運命の場所へ（ランダムワープ）'),
  ))

  // Worlds
  const worldsSection = h('div', { class: 'worlds-section' },
    h('div', { class: 'section-title' }, '時代を選ぶ')
  )
  const grid = h('div', { class: 'worlds-grid' })
  WORLDS.forEach((w, idx) => {
    const isLocked = w.locked && !state.hasPass
    const card = h('button', {
      class: 'wcard' + (isLocked ? ' locked' : ''),
      style: { '--color': w.color, color: w.color, animationDelay: (idx * 0.06) + 's' },
      onclick: () => { sound.playUI(700 + idx * 40); if (isLocked) renderPaywall(); else selectWorld(w) },
    })
    card.appendChild(h('div', { class: 'emoji' }, w.emoji))
    card.appendChild(h('div', { class: 'wname' }, w.name))
    card.appendChild(h('div', { class: 'wyear' }, `${w.year} · ${w.subtitle}`))
    card.appendChild(h('div', { class: 'wdesc' }, w.desc))
    grid.appendChild(card)
  })
  worldsSection.appendChild(grid)
  landing.appendChild(worldsSection)

  root.appendChild(landing)
}

function selectWorld(world) {
  state.world = world
  renderDoorScene()
}

function randomWarp() {
  const world = WORLDS[Math.floor(Math.random() * WORLDS.length)]
  selectWorld(world)
}

/* ============================================================
 * DOOR SCENE — HYPER-REALISTIC 3D DOOR
 * ============================================================ */
function renderDoorScene() {
  disposeScene(); sound.stop()
  state.phase = 'door'
  const root = qs('#root'); root.innerHTML = ''

  const world = state.world

  const stage = h('div', { class: 'door-scene' })
  const hud = h('div', { class: 'door-hud' })
  stage.appendChild(hud)
  stage.appendChild(h('div', { class: 'vignette' }))

  hud.appendChild(h('div', { class: 'door-top' },
    h('div', { class: 'door-top-info' }, 'DESTINATION ', h('b', {}, world.name), ' / ', world.year),
    h('button', { class: 'hud-btn', onclick: () => renderLanding() }, '← 戻る')
  ))

  const prompt = h('div', { class: 'door-prompt' },
    h('div', { class: 'key' }, '◆ タップして 扉を開く ◆'),
    h('div', { class: 'caption' }, `${world.subtitle}  ·  ${world.year}`)
  )
  hud.appendChild(prompt)

  root.appendChild(stage)

  // ─── Three.js setup ───
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance', alpha: false })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFShadowShadowMap
  
  const resize = () => {
    renderer.setSize(window.innerWidth, window.innerHeight)
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
  }

  const scene = new THREE.Scene()
  scene.background = new THREE.Color(0x0a0612)
  scene.fog = new THREE.FogExp2(0x03030a, 0.012)

  const camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 500)
  camera.position.set(0, 1.7, 10.5)
  camera.lookAt(0, 2.1, 0)

  // ─── ENVIRONMENT ───
  // 高品質な床（大理石風）
  const floorTex = (() => {
    const c = document.createElement('canvas'); c.width = c.height = 512
    const ctx = c.getContext('2d')
    ctx.fillStyle = '#0a0812'; ctx.fillRect(0,0,512,512)
    // 大理石のテクスチャ
    for (let i = 0; i < 150; i++) {
      const x = Math.random() * 512, y = Math.random() * 512
      ctx.strokeStyle = `rgba(140,100,200,${.02 + Math.random()*.08})`
      ctx.lineWidth = Math.random() * 2 + 0.5
      ctx.beginPath(); ctx.moveTo(x, y)
      ctx.lineTo(x + Math.random() * 80 - 40, y + Math.random() * 80 - 40)
      ctx.stroke()
    }
    const tex = new THREE.CanvasTexture(c); tex.wrapS = tex.wrapT = THREE.RepeatWrapping
    return tex
  })()
  floorTex.repeat.set(6, 6)
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(300, 300),
    new THREE.MeshStandardMaterial({ map: floorTex, roughness: .25, metalness: .6, color: 0x0f0818 })
  )
  floor.rotation.x = -Math.PI / 2
  floor.receiveShadow = true
  scene.add(floor)

  // 照明
  scene.add(new THREE.HemisphereLight(0x1a1550, 0x050410, 0.5))
  const key = new THREE.DirectionalLight(0xa080ff, 1.4)
  key.position.set(8, 14, 10)
  key.castShadow = true
  key.shadow.mapSize.set(2048, 2048)
  key.shadow.camera.near = 0.5
  key.shadow.camera.far = 50
  key.shadow.camera.left = -30
  key.shadow.camera.right = 30
  key.shadow.camera.top = 30
  key.shadow.camera.bottom = -30
  scene.add(key)

  const rim = new THREE.PointLight(new THREE.Color(world.color), 2.8, 40, 2)
  rim.position.set(0, 5, -2)
  scene.add(rim)

  const rim2 = new THREE.PointLight(new THREE.Color(world.accent), 2.0, 35, 2.2)
  rim2.position.set(-4, 3, 4)
  scene.add(rim2)

  // ─── THE DOOR ───
  const doorGroup = new THREE.Group()

  // Frame（重厚な金属フレーム）
  const frameMat = new THREE.MeshStandardMaterial({
    color: 0x0f0520,
    metalness: .9,
    roughness: .15,
    emissive: 0x1a0a30,
    emissiveIntensity: .4
  })
  const frameThickness = 0.35, doorW = 2.8, doorH = 4.6
  
  const frameTop = new THREE.Mesh(new THREE.BoxGeometry(doorW + frameThickness*2 + .4, frameThickness, .4), frameMat)
  frameTop.position.set(0, doorH + frameThickness/2, 0)
  frameTop.castShadow = true
  frameTop.receiveShadow = true
  doorGroup.add(frameTop)

  const frameL = new THREE.Mesh(new THREE.BoxGeometry(frameThickness, doorH, .4), frameMat)
  frameL.position.set(-doorW/2 - frameThickness/2, doorH/2, 0)
  frameL.castShadow = true
  frameL.receiveShadow = true
  doorGroup.add(frameL)

  const frameR = frameL.clone()
  frameR.position.x = doorW/2 + frameThickness/2
  frameR.castShadow = true
  frameR.receiveShadow = true
  doorGroup.add(frameR)

  // Pediment（装飾的な頂部）
  const pediment = new THREE.Mesh(
    new THREE.CylinderGeometry(doorW/2 + .4, doorW/2 + .4, .35, 32, 1, false, 0, Math.PI),
    frameMat
  )
  pediment.rotation.z = Math.PI
  pediment.rotation.x = Math.PI/2
  pediment.position.set(0, doorH + frameThickness + .2, 0)
  pediment.castShadow = true
  pediment.receiveShadow = true
  doorGroup.add(pediment)

  // Door leaves（2つの扉）
  const doorMat = new THREE.MeshStandardMaterial({
    color: 0x1a0a35,
    metalness: .7,
    roughness: .3,
    emissive: 0x0f0520,
    emissiveIntensity: .25
  })

  const leafL = new THREE.Mesh(new THREE.BoxGeometry(doorW/2, doorH, .15), doorMat)
  leafL.position.set(-doorW/4, doorH/2, 0.02)
  leafL.castShadow = true
  leafL.receiveShadow = true
  doorGroup.add(leafL)

  const leafR = leafL.clone()
  leafR.position.x = doorW/4
  leafR.castShadow = true
  leafR.receiveShadow = true
  doorGroup.add(leafR)

  // Portal（扉の奥に見える時空間ゲート）
  const portalGeom = new THREE.CircleGeometry(1.7, 64)
  const portalMat = new THREE.ShaderMaterial({
    transparent: true,
    uniforms: {
      time: { value: 0 },
      colorA: { value: new THREE.Color(world.color) },
      colorB: { value: new THREE.Color(world.accent) },
      opacity: { value: 0 },
    },
    vertexShader: `
      varying vec2 vUv;
      void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
    `,
    fragmentShader: `
      precision highp float;
      varying vec2 vUv;
      uniform float time;
      uniform float opacity;
      uniform vec3 colorA;
      uniform vec3 colorB;
      float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
      float noise(vec2 p){
        vec2 i = floor(p), f = fract(p);
        float a = hash(i);
        float b = hash(i + vec2(1., 0.));
        float c = hash(i + vec2(0., 1.));
        float d = hash(i + vec2(1., 1.));
        vec2 u = f*f*(3.-2.*f);
        return mix(a,b,u.x) + (c-a)*u.y*(1.-u.x) + (d-b)*u.x*u.y;
      }
      void main(){
        vec2 p = vUv - 0.5;
        float r = length(p);
        float a = atan(p.y, p.x);
        float n = noise(vec2(a*5.0 + time*1.2, r*15.0 - time*2.2));
        float ring = smoothstep(0.5, 0.48, r) - smoothstep(0.48, 0.46, r);
        float core = smoothstep(0.5, 0.0, r);
        vec3 col = mix(colorB, colorA, n);
        float brightness = core * (0.7 + n * 0.4) + ring * 0.9;
        float alpha = smoothstep(0.5, 0.44, r) * (0.8 + n * 0.25) * opacity;
        gl_FragColor = vec4(col * brightness * 1.4, alpha);
      }
    `,
    side: THREE.DoubleSide,
    depthWrite: false,
  })
  const portal = new THREE.Mesh(portalGeom, portalMat)
  portal.position.set(0, doorH/2, -0.08)
  portal.visible = false
  doorGroup.add(portal)

  // Handles（ドアノブ）
  const handleMat = new THREE.MeshStandardMaterial({
    color: 0xd4a840,
    metalness: 1,
    roughness: .08,
    emissive: 0x8a6820,
    emissiveIntensity: .3
  })
  const handle1 = new THREE.Mesh(new THREE.SphereGeometry(.12, 16, 12), handleMat)
  handle1.position.set(-.22, doorH/2, .18)
  handle1.castShadow = true
  doorGroup.add(handle1)

  const handle2 = handle1.clone()
  handle2.position.x = .22
  handle2.castShadow = true
  doorGroup.add(handle2)

  scene.add(doorGroup)

  // Glowing particles around the door
  const spGeo = new THREE.BufferGeometry()
  const spCount = 300
  const spPos = new Float32Array(spCount * 3), spSp = new Float32Array(spCount)
  for (let i = 0; i < spCount; i++) {
    const a = Math.random() * Math.PI * 2, rr = 1.8 + Math.random() * 3.2
    spPos[i*3]   = Math.cos(a) * rr
    spPos[i*3+1] = Math.random() * 5 + .3
    spPos[i*3+2] = Math.sin(a) * rr
    spSp[i] = .2 + Math.random() * 1.2
  }
  spGeo.setAttribute('position', new THREE.BufferAttribute(spPos, 3))
  const spMat = new THREE.PointsMaterial({
    color: new THREE.Color(world.accent),
    size: 0.08, transparent: true, opacity: .85,
    blending: THREE.AdditiveBlending, depthWrite: false,
  })
  const sparks = new THREE.Points(spGeo, spMat)
  scene.add(sparks)

  // Pillars（ドアの両脇の柱）
  for (let i = 0; i < 2; i++) {
    const col = new THREE.Group()
    const shaft = new THREE.Mesh(
      new THREE.CylinderGeometry(.25, .35, 5.2, 20),
      new THREE.MeshStandardMaterial({ color: 0x0f0520, metalness: .8, roughness: .25 })
    )
    shaft.position.y = 2.6
    shaft.castShadow = true
    shaft.receiveShadow = true
    col.add(shaft)

    const cap = new THREE.Mesh(
      new THREE.BoxGeometry(1.0, .45, 1.0),
      new THREE.MeshStandardMaterial({ color: 0x0f0520, metalness: .8, roughness: .25 })
    )
    cap.position.y = 5.2 + .25
    cap.castShadow = true
    cap.receiveShadow = true
    col.add(cap)

    const orb = new THREE.Mesh(
      new THREE.SphereGeometry(.25, 16, 12),
      new THREE.MeshStandardMaterial({
        color: 0x000,
        emissive: new THREE.Color(world.color),
        emissiveIntensity: 2.2
      })
    )
    orb.position.y = 5.7
    orb.castShadow = true
    col.add(orb)

    col.position.set(i === 0 ? -3.6 : 3.6, 0, 0)
    scene.add(col)
  }

  // Ground ring glow
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(2.2, 5.0, 80),
    new THREE.MeshBasicMaterial({ color: new THREE.Color(world.color), transparent: true, opacity: .12, side: THREE.DoubleSide })
  )
  ring.rotation.x = -Math.PI / 2
  ring.position.y = 0.01
  scene.add(ring)

  // Camera animation state
  let camT = 0
  let openT = 0
  let doorOpened = false
  let warping = false
  const baseCamPos = new THREE.Vector3(0, 1.7, 10.5)
  const zoomCamPos = new THREE.Vector3(0, 2.1, 3.5)
  const throughCamPos = new THREE.Vector3(0, 2.3, -1.2)

  stage.appendChild(renderer.domElement)
  resize()
  window.addEventListener('resize', resize)

  // Interaction: tap to open
  const openDoor = () => {
    if (doorOpened) return
    doorOpened = true
    sound.playDoorOpen()
    prompt.style.opacity = '0'
    prompt.style.transform = 'translateX(-50%) translateY(20px)'
    prompt.style.transition = 'all .6s ease'
    setTimeout(() => { portal.visible = true }, 350)
    setTimeout(() => { startWarp() }, 3200)
  }

  stage.addEventListener('click', openDoor)
  stage.addEventListener('touchstart', openDoor, { passive: true })

  const onKey = (e) => { if (e.code === 'Space' || e.code === 'Enter') openDoor() }
  window.addEventListener('keydown', onKey)

  // Gentle mouse-look
  let mx = 0, my = 0
  const onMove = (e) => {
    const cx = (e.touches ? e.touches[0].clientX : e.clientX) / window.innerWidth - .5
    const cy = (e.touches ? e.touches[0].clientY : e.clientY) / window.innerHeight - .5
    mx = cx * 0.8
    my = cy * 0.5
  }
  window.addEventListener('pointermove', onMove)

  const startWarp = () => {
    if (warping) return
    warping = true
    renderWarpTransition()
  }

  let last = performance.now()
  const loop = () => {
    const now = performance.now()
    const dt = Math.min(0.05, (now - last) / 1000)
    last = now
    camT += dt

    portalMat.uniforms.time.value = camT

    if (doorOpened) {
      openT += dt
      const openAmount = Math.min(1, openT / 1.3)
      const ease = 1 - Math.pow(1 - openAmount, 3)
      leafL.rotation.y = ease * Math.PI * 0.5
      leafR.rotation.y = -ease * Math.PI * 0.5
      portalMat.uniforms.opacity.value = ease * 0.95

      if (openT < 1.5) {
        const t = openT / 1.5
        const e = 1 - Math.pow(1 - t, 2)
        camera.position.lerpVectors(baseCamPos, zoomCamPos, e)
      } else {
        const t = Math.min(1, (openT - 1.5) / 1.5)
        const e = t < .5 ? 2*t*t : 1 - Math.pow(-2*t + 2, 3) / 2
        camera.position.lerpVectors(zoomCamPos, throughCamPos, e)
        renderer.setClearColor(new THREE.Color(world.color).multiplyScalar(e * 0.7), 1)
      }
      camera.lookAt(0, 2.3, -1)
    } else {
      camera.position.x = baseCamPos.x + mx * .8
      camera.position.y = baseCamPos.y - my * .4
      camera.lookAt(0, 2.3, 0)
    }

    // Sparks orbit
    const positions = sparks.geometry.attributes.position.array
    for (let i = 0; i < spCount; i++) {
      const a = camT * 0.25 + (i / spCount) * Math.PI * 2
      const rr = 1.8 + Math.sin(camT * .4 + i) * .8
      positions[i*3]     = Math.cos(a) * rr
      positions[i*3 + 1] = 0.3 + Math.abs(Math.sin(camT * .25 + i * 0.3)) * 3.5
      positions[i*3 + 2] = Math.sin(a) * rr
    }
    sparks.geometry.attributes.position.needsUpdate = true
    sparks.material.opacity = .5 + Math.sin(camT * 1.8) * .35

    ring.material.opacity = .12 + Math.sin(camT * 1.0) * .1
    rim.intensity = 2.8 + Math.sin(camT * 1.8) * 1.0

    renderer.render(scene, camera)
    currentScene.raf = requestAnimationFrame(loop)
  }

  currentScene = {
    renderer, scene, raf: null,
    cleanup: () => {
      window.removeEventListener('resize', resize)
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('pointermove', onMove)
    }
  }
  currentScene.raf = requestAnimationFrame(loop)
}

/* ============================================================
 * WARP TRANSITION — TIME-SPACE DISTORTION TUNNEL
 * ============================================================ */
function renderWarpTransition() {
  disposeScene()
  sound.playWarpWhoosh()
  state.phase = 'warp'
  const root = qs('#root')
  root.innerHTML = ''

  const world = state.world

  const stage = h('div', { class: 'warp-stage' })
  stage.appendChild(h('div', { class: 'warp-progress' }, h('div', { class: 'warp-progress-bar', id: 'wpb' })))
  stage.appendChild(h('div', { class: 'warp-caption' },
    h('div', { class: 'where' }, world.name),
    h('div', { class: 'when' }, `${world.year}  ·  ${world.subtitle}`)
  ))
  root.appendChild(stage)

  const renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  const resize = () => {
    renderer.setSize(window.innerWidth, window.innerHeight)
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
  }

  const scene = new THREE.Scene()
  scene.background = new THREE.Color(0x000005)
  scene.fog = new THREE.FogExp2(0x000000, 0.035)

  const camera = new THREE.PerspectiveCamera(80, window.innerWidth/window.innerHeight, 0.1, 300)
  camera.position.set(0, 0, 0)

  // Tunnel（時空間歪みトンネル）
  const tunnel = new THREE.Group()
  const starCount = 3500
  const sGeo = new THREE.BufferGeometry()
  const sPos = new Float32Array(starCount * 3)
  const sCol = new Float32Array(starCount * 3)
  const sVel = new Float32Array(starCount)
  const startColor = new THREE.Color(world.color)
  const endColor = new THREE.Color(world.accent)

  for (let i = 0; i < starCount; i++) {
    const r = 2.5 + Math.random() * 22
    const a = Math.random() * Math.PI * 2
    sPos[i*3]     = Math.cos(a) * r
    sPos[i*3 + 1] = (Math.random() - 0.5) * 20
    sPos[i*3 + 2] = -Math.random() * 400
    const mix = Math.random()
    const c = startColor.clone().lerp(endColor, mix)
    sCol[i*3]     = c.r
    sCol[i*3 + 1] = c.g
    sCol[i*3 + 2] = c.b
    sVel[i] = 50 + Math.random() * 120
  }
  sGeo.setAttribute('position', new THREE.BufferAttribute(sPos, 3))
  sGeo.setAttribute('color', new THREE.BufferAttribute(sCol, 3))
  const sMat = new THREE.PointsMaterial({
    size: 0.5, vertexColors: true, transparent: true, opacity: .98,
    blending: THREE.AdditiveBlending, depthWrite: false,
  })
  const stars = new THREE.Points(sGeo, sMat)
  tunnel.add(stars)

  // Tunnel rings
  const rings = []
  for (let i = 0; i < 18; i++) {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(5 + Math.random()*3, 0.08, 12, 64),
      new THREE.MeshBasicMaterial({
        color: new THREE.Color(world.color).multiplyScalar(.7 + Math.random()*.5),
        transparent: true,
        opacity: .6
      })
    )
    ring.position.z = -12 - i * 20
    rings.push(ring)
    tunnel.add(ring)
  }

  // Central glow
  const dest = new THREE.Mesh(
    new THREE.SphereGeometry(0.6, 20, 16),
    new THREE.MeshBasicMaterial({
      color: new THREE.Color(world.color),
      transparent: true,
      opacity: 0
    })
  )
  dest.position.z = -360
  tunnel.add(dest)

  scene.add(tunnel)

  stage.appendChild(renderer.domElement)
  resize()
  window.addEventListener('resize', resize)

  let warpT = 0
  const warpDur = 2.8
  const progressBar = qs('#wpb')

  let last = performance.now()
  const loop = () => {
    const now = performance.now()
    const dt = Math.min(0.05, (now - last) / 1000)
    last = now
    warpT += dt

    // Update particles
    const positions = stars.geometry.attributes.position.array
    for (let i = 0; i < starCount; i++) {
      positions[i*3 + 2] += sVel[i] * dt
      if (positions[i*3 + 2] > 50) {
        positions[i*3 + 2] = -400
      }
    }
    stars.geometry.attributes.position.needsUpdate = true

    // Update rings
    rings.forEach((r, i) => {
      r.position.z += 80 * dt
      if (r.position.z > 100) r.position.z = -360
      r.material.opacity = .6 * (1 - Math.abs(r.position.z) / 360)
    })

    // Destination glow
    dest.material.opacity = Math.max(0, 1 - (warpDur - warpT) * 0.5)

    // Progress
    const progress = Math.min(1, warpT / warpDur)
    progressBar.style.width = (progress * 100) + '%'

    renderer.render(scene, camera)

    if (warpT >= warpDur) {
      cancelAnimationFrame(currentScene.raf)
      renderWorldScene()
    } else {
      currentScene.raf = requestAnimationFrame(loop)
    }
  }

  currentScene = {
    renderer, scene, raf: null,
    cleanup: () => {
      window.removeEventListener('resize', resize)
    }
  }
  currentScene.raf = requestAnimationFrame(loop)
}

/* ============================================================
 * WORLD SCENE — IMMERSIVE 360° EXPLORATION
 * ============================================================ */
function renderWorldScene() {
  disposeScene()
  sound.playArrival()
  sound.startAmbient(state.world)
  state.phase = 'world'
  state.arrivalDone = true

  incrementStamp(state.world.id)

  const root = qs('#root')
  root.innerHTML = ''

  const world = state.world
  const stage = h('div', { class: 'world-scene' })
  const hud = h('div', { class: 'world-hud' })

  hud.appendChild(h('div', { class: 'world-top' },
    h('div', { class: 'world-location' }, h('span', { class: 'emoji' }, world.emoji), ' ', world.name),
    h('button', { class: 'hud-btn', onclick: () => renderLanding() }, '← 帰る')
  ))

  const discovery = h('div', { class: 'discovery' })
  hud.appendChild(discovery)

  stage.appendChild(hud)
  root.appendChild(stage)

  const renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.shadowMap.enabled = true

  const resize = () => {
    renderer.setSize(window.innerWidth, window.innerHeight)
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
  }

  const scene = new THREE.Scene()
  scene.background = new THREE.Color(world.sky)
  scene.fog = new THREE.FogExp2(world.fog, 0.008)

  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
  camera.position.set(0, 1.7, 0)

  // Build world from SCENE_BUILDERS
  if (SCENE_BUILDERS[world.id]) {
    SCENE_BUILDERS[world.id](scene, world)
  }

  stage.appendChild(renderer.domElement)
  resize()
  window.addEventListener('resize', resize)

  // 360° camera control
  let yaw = 0, pitch = 0
  let isDragging = false
  let dragX = 0, dragY = 0

  const onMouseDown = (e) => {
    isDragging = true
    dragX = e.clientX
    dragY = e.clientY
  }

  const onMouseMove = (e) => {
    if (!isDragging) return
    const dx = e.clientX - dragX
    const dy = e.clientY - dragY
    yaw -= dx * 0.005
    pitch -= dy * 0.005
    pitch = clamp(pitch, -Math.PI / 2.5, Math.PI / 2.5)
    dragX = e.clientX
    dragY = e.clientY
  }

  const onMouseUp = () => {
    isDragging = false
  }

  const onTouchStart = (e) => {
    if (e.touches.length === 1) {
      isDragging = true
      dragX = e.touches[0].clientX
      dragY = e.touches[0].clientY
    }
  }

  const onTouchMove = (e) => {
    if (!isDragging || e.touches.length !== 1) return
    const dx = e.touches[0].clientX - dragX
    const dy = e.touches[0].clientY - dragY
    yaw -= dx * 0.005
    pitch -= dy * 0.005
    pitch = clamp(pitch, -Math.PI / 2.5, Math.PI / 2.5)
    dragX = e.touches[0].clientX
    dragY = e.touches[0].clientY
  }

  const onTouchEnd = () => {
    isDragging = false
  }

  stage.addEventListener('mousedown', onMouseDown)
  window.addEventListener('mousemove', onMouseMove)
  window.addEventListener('mouseup', onMouseUp)
  stage.addEventListener('touchstart', onTouchStart, { passive: true })
  window.addEventListener('touchmove', onTouchMove, { passive: true })
  window.addEventListener('touchend', onTouchEnd)

  // Show random discovery
  const showDiscovery = () => {
    const discoveries = world.discoveries || []
    if (discoveries.length === 0) return
    const msg = discoveries[Math.floor(Math.random() * discoveries.length)]
    discovery.textContent = '✦ ' + msg
    discovery.style.opacity = '1'
    setTimeout(() => {
      discovery.style.opacity = '0'
    }, 4000)
  }

  showDiscovery()
  const discoveryInterval = setInterval(showDiscovery, 8000)

  let last = performance.now()
  const loop = () => {
    const now = performance.now()
    const dt = Math.min(0.05, (now - last) / 1000)
    last = now

    // Update camera with 360° view
    const dir = new THREE.Euler(pitch, yaw, 0, 'YXZ')
    camera.quaternion.setFromEuler(dir)
    camera.position.set(0, 1.7, 0)

    renderer.render(scene, camera)
    currentScene.raf = requestAnimationFrame(loop)
  }

  currentScene = {
    renderer, scene, raf: null,
    cleanup: () => {
      window.removeEventListener('resize', resize)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('touchend', onTouchEnd)
      clearInterval(discoveryInterval)
    }
  }
  currentScene.raf = requestAnimationFrame(loop)
}

/* ============================================================
 * INIT
 * ============================================================ */
renderLanding()
