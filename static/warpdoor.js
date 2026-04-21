// ============================================================
// WARPDOOR v6 — Cinematic 3D Experience
// Flow: Landing → Door (3D open) → Wormhole → World (3D immersive)
// ============================================================
import * as THREE from 'three'
import { WORLDS, SCENE_BUILDERS } from './worlds.js'

/* ─── Utils ───────────────────────────────────── */
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
    // deep resonance chord
    const freqs = [55, 82.5, 165, 220]
    freqs.forEach((f, i) => {
      const o = ctx.createOscillator(); const g = ctx.createGain()
      o.type = i < 2 ? 'sine' : 'triangle'; o.frequency.value = f
      g.gain.setValueAtTime(0, now + i*0.15)
      g.gain.linearRampToValueAtTime(0.08, now + i*0.15 + 0.1)
      g.gain.exponentialRampToValueAtTime(0.001, now + i*0.15 + 1.6)
      o.connect(g); g.connect(this.master); o.start(now + i*0.15); o.stop(now + i*0.15 + 1.7)
    })
    // sparkle burst
    setTimeout(() => {
      for (let i = 0; i < 6; i++) {
        const o = ctx.createOscillator(); const g = ctx.createGain()
        o.type = 'sine'; o.frequency.value = 1200 + Math.random() * 2400
        const t = now + 0.4 + i * 0.08
        g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.04, t + 0.02)
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.3)
        o.connect(g); g.connect(this.master); o.start(t); o.stop(t + 0.35)
      }
    }, 0)
  }
  playWarpWhoosh() {
    this.ensure(); if (!this.ctx) return
    const ctx = this.ctx, now = ctx.currentTime
    // downward sweep
    const o = ctx.createOscillator(); const g = ctx.createGain()
    o.type = 'sawtooth'; o.frequency.setValueAtTime(80, now)
    o.frequency.exponentialRampToValueAtTime(1400, now + 1.4)
    g.gain.setValueAtTime(0, now); g.gain.linearRampToValueAtTime(0.18, now + 0.12)
    g.gain.linearRampToValueAtTime(0, now + 1.7)
    o.connect(g); g.connect(this.master); o.start(now); o.stop(now + 1.8)
    // noise burst
    const bufSize = ctx.sampleRate * 1.2
    const buffer = ctx.createBuffer(1, bufSize, ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1) * (1 - i/bufSize)
    const noise = ctx.createBufferSource(); noise.buffer = buffer
    const nf = ctx.createBiquadFilter(); nf.type = 'bandpass'; nf.frequency.value = 1400; nf.Q.value = 2
    const ng = ctx.createGain(); ng.gain.value = .22
    noise.connect(nf); nf.connect(ng); ng.connect(this.master); noise.start(now + .2)
  }
  playArrival() {
    this.ensure(); if (!this.ctx) return
    const ctx = this.ctx, now = ctx.currentTime
    const freqs = [440, 554.37, 659.25, 880]
    freqs.forEach((f, i) => {
      const o = ctx.createOscillator(); const g = ctx.createGain()
      o.type = 'sine'; o.frequency.value = f
      const t = now + i * 0.1
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.06, t + 0.03)
      g.gain.exponentialRampToValueAtTime(0.001, t + 1.8)
      o.connect(g); g.connect(this.master); o.start(t); o.stop(t + 2)
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
    const ambient = world.soundscape?.ambient
    if (ambient) {
      const bufSize = ctx.sampleRate * 2
      const buffer = ctx.createBuffer(1, bufSize, ctx.sampleRate)
      const data = buffer.getChannelData(0)
      for (let i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1) * 0.5
      const n = ctx.createBufferSource(); n.buffer = buffer; n.loop = true
      const nf = ctx.createBiquadFilter()
      if (ambient === 'rain')       { nf.type = 'highpass'; nf.frequency.value = 2000 }
      else if (ambient === 'water') { nf.type = 'lowpass';  nf.frequency.value = 600 }
      else if (ambient === 'wind')  { nf.type = 'lowpass';  nf.frequency.value = 400 }
      else if (ambient === 'space') { nf.type = 'bandpass'; nf.frequency.value = 200; nf.Q.value = 2 }
      else if (ambient === 'cyberpunk') { nf.type = 'bandpass'; nf.frequency.value = 1200; nf.Q.value = 1 }
      else                          { nf.type = 'lowpass';  nf.frequency.value = 900 }
      const ng = ctx.createGain(); ng.gain.value = ambient === 'rain' ? 0.18 : 0.07
      n.connect(nf); nf.connect(ng); ng.connect(this.master); n.start(); this.nodes.push(n)
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
}

function incrementStamp(worldId) {
  gtag("event", "world_arrived", { world_id: worldId });
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
  for (let i = 0; i < 180; i++) {
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
    h('div', { id: 'live-count' }, h('span', { class: 'k' }, '—'), ' ONLINE'),
    h('button', {
      class: 'hud-btn',
      onclick: () => { sound.playUI(660); renderCollectionModal() }
    }, '🏆 コレクション'),
    h('button', {
      class: 'hud-btn',
      title: sound.enabled ? 'サウンドをオフ' : 'サウンドをオン',
      onclick: (e) => { sound.setEnabled(!sound.enabled); e.currentTarget.textContent = sound.enabled ? '🔊' : '🔇' }
    }, sound.enabled ? '🔊' : '🔇'),
  )

  landing.appendChild(h('div', { class: 'topbar' },
    h('div', { class: 'topbar-brand' }, 'WARPDOOR', h('span', { class: 'brand-version' }, 'v6.0')),
    stats
  ))

  // Hero
  landing.appendChild(h('div', { class: 'hero' },
    h('div', { class: 'hero-tag' }, '✦  SPACETIME  EXPERIENCE  ✦'),
    h('h1', { class: 'hero-title' }, 'WARPDOOR'),
    h('p', { class: 'hero-sub' }, '扉の向こうは、いつかの時代 —— 時空間を旅する、没入型3D体験'),
    h('div', { class: 'hero-cap' },
      h('div', { class: 'live-dot' }),
      h('span', { id: 'live-indicator-text' }, 'LIVE — 読み込み中…')
    )
  ))

  // Action row
  landing.appendChild(h('div', { class: 'action-row' },
    h('button', {
      class: 'action-btn primary',
      onclick: () => { sound.playUI(880); randomWarp() }
    }, h('span', { class: 'act-icon' }, '🎲'), '運命の場所へ（ランダムワープ）'),
    h('button', {
      class: 'action-btn',
      onclick: () => { sound.playUI(660); renderCollectionModal() }
    }, h('span', { class: 'act-icon' }, '🏆'), `コレクション（${Object.keys(state.stamps).length}/${WORLDS.length}）`),
  ))

  // Daily theme banner
  landing.appendChild(h('div', { id: 'daily-theme-holder' }))

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
      onmouseenter: (e) => {
        e.currentTarget.style.borderColor = w.color + '88'
        e.currentTarget.style.boxShadow = `0 20px 60px ${w.color}26, 0 0 40px ${w.color}1a`
        e.currentTarget.style.background = `linear-gradient(180deg, rgba(10,8,24,.9) 0%, ${w.color}16 100%)`
      },
      onmouseleave: (e) => {
        e.currentTarget.style.borderColor = 'rgba(255,255,255,.08)'
        e.currentTarget.style.boxShadow = 'none'
        e.currentTarget.style.background = ''
      },
    })
    if (idx === 1) card.appendChild(h('div', {
      class: 'badge',
      style: { color: w.color, borderColor: w.color + '55', background: w.color + '18' }
    }, '人気 #1'))
    card.appendChild(h('div', { class: 'emoji' }, w.emoji))
    card.appendChild(h('div', { class: 'wname' }, w.name))
    card.appendChild(h('div', { class: 'wyear' }, `${w.year} · ${w.subtitle}`))
    card.appendChild(h('div', { class: 'wdesc' }, w.desc))
    const tags = h('div', { class: 'tags' })
    w.tags.forEach(t => tags.appendChild(h('span', { class: 'tag', style: { color: w.color, borderColor: w.color + '55' } }, t)))
    card.appendChild(tags)
    card.appendChild(h('div', { class: 'row-bottom' },
      h('div', { class: 'warps' }, `${w.warps.toLocaleString()} warps`),
      h('div', { class: 'warp-btn', style: { color: w.color } }, 'WARP →')
    ))
    if (isLocked) card.appendChild(h('div', { class: 'lock-badge' }, '🔒 COLLECTOR PASS'))
    grid.appendChild(card)
  })
  worldsSection.appendChild(grid)
  landing.appendChild(worldsSection)

  // Live feed
  landing.appendChild(h('div', { class: 'live-feed' },
    h('div', { class: 'section-title' }, 'いま、誰かがワープ中'),
    h('div', { class: 'feed-list', id: 'feed-list' })
  ))

  // Footer
  landing.appendChild(h('div', { class: 'footer' },
    '🖱️ クリック / タップで WARP　|　ドラッグ で視点回転　|　WASD または矢印キーで移動',
    h('br'),
    h('span', { style: { color: 'rgba(255,255,255,.18)' } }, 'Three.js cinematic edition — by WARPDOOR Lab'),
    h('br'),
    h('span', {}, 'Pass 特典で ', h('span', { style: { color: '#ff6a4a' } }, '火星コロニー'), ' · ', h('span', { style: { color: '#44d4e0' } }, 'アトランティス'), ' へ → '),
    h('a', { href: '#', onclick: (e) => { e.preventDefault(); renderPaywall() } }, 'Collector Pass')
  ))

  root.appendChild(landing)

  fetchLiveFeed()
  fetchDailyTheme()
}

async function fetchLiveFeed() {
  try {
    const res = { ok: true, json: () => ({ onlineNow: 120 + Math.floor(Math.random() * 420), totalWarpsToday: 4200 + Math.floor(Math.random() * 3800), feed: [] }) }
    const data = await res.json()
    const lc = qs('#live-count'); if (lc) lc.innerHTML = `<span class="k">${data.onlineNow}</span> ONLINE`
    const ind = qs('#live-indicator-text'); if (ind) ind.textContent = `LIVE — 今 ${data.onlineNow} 人が旅行中 / 本日 ${data.totalWarpsToday.toLocaleString()} 回ワープ`
    const list = qs('#feed-list')
    if (list) {
      list.innerHTML = ''
      data.feed.forEach((item, i) => {
        list.appendChild(h('div', { class: 'feed-item', style: { animationDelay: (i * 0.06) + 's' } },
          h('span', { class: 'fi-emoji' }, item.emoji),
          h('div', {},
            h('div', { class: 'fi-name' }, item.name),
            h('div', { style: { fontSize: '9px', opacity: 0.55, letterSpacing: '.2em', textTransform: 'uppercase' } }, item.worldName)
          ),
          h('span', { class: 'fi-ago' }, `${item.minutesAgo}分前`)
        ))
      })
    }
  } catch (e) { console.warn('live-feed fail', e) }
}

async function fetchDailyTheme() {
  try {
    const res = { ok: true, json: () => ({ id: "sunrise", title: "夜明けの街", desc: "朝焼けが美しい時代の街を訪れよう", worldIds: ["edo", "rome", "medieval"] }) }
    const d = await res.json()
    const holder = qs('#daily-theme-holder')
    if (!holder) return
    holder.innerHTML = ''
    holder.appendChild(h('div', { class: 'daily-theme' },
      h('div', { class: 'daily-icon' }, '✨'),
      h('div', { class: 'daily-info' },
        h('div', { class: 'daily-label' }, '本日のテーマ ─ ' + d.date),
        h('div', { class: 'daily-title' }, d.title),
        h('div', { class: 'daily-desc' }, d.desc)
      ),
      h('button', {
        class: 'hud-btn',
        onclick: () => {
          const pool = d.worldIds.map(id => WORLDS.find(w => w.id === id)).filter(Boolean)
          const w = pool[Math.floor(Math.random() * pool.length)]
          if (w) selectWorld(w)
        }
      }, 'テーマへワープ')
    ))
  } catch (e) { console.warn('daily fail', e) }
}

/* ============================================================
 * WORLD SELECTION
 * ============================================================ */
function selectWorld(world) {
  if (world.locked && !state.hasPass) return renderPaywall()
  state.world = world
  renderDoorScene()
}

function randomWarp() {
  const pool = WORLDS.filter(w => !w.locked || state.hasPass)
  const world = pool[Math.floor(Math.random() * pool.length)]
  selectWorld(world)
}

/* ============================================================
 * DOOR SCENE — 3D door that opens and reveals the portal
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
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  const resize = () => {
    renderer.setSize(window.innerWidth, window.innerHeight)
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
  }

  const scene = new THREE.Scene()
  scene.background = new THREE.Color(0x03030a)
  scene.fog = new THREE.FogExp2(0x02020a, 0.015)

  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 300)
  camera.position.set(0, 1.8, 9)
  camera.lookAt(0, 2, 0)

  // Floor (reflective dark marble)
  const floorTex = (() => {
    const c = document.createElement('canvas'); c.width = c.height = 256
    const ctx = c.getContext('2d')
    ctx.fillStyle = '#080812'; ctx.fillRect(0,0,256,256)
    for (let i = 0; i < 60; i++) {
      ctx.strokeStyle = `rgba(160,120,255,${.04 + Math.random()*.12})`; ctx.lineWidth = 1
      ctx.beginPath(); ctx.moveTo(Math.random()*256, Math.random()*256)
      ctx.lineTo(Math.random()*256, Math.random()*256); ctx.stroke()
    }
    const tex = new THREE.CanvasTexture(c); tex.wrapS = tex.wrapT = THREE.RepeatWrapping
    return tex
  })()
  floorTex.repeat.set(8, 8)
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(200, 200),
    new THREE.MeshStandardMaterial({ map: floorTex, roughness: .3, metalness: .7, color: 0x111128 })
  )
  floor.rotation.x = -Math.PI / 2
  floor.receiveShadow = true
  scene.add(floor)

  // Ambient
  scene.add(new THREE.HemisphereLight(0x2a2050, 0x08081a, 0.6))
  const key = new THREE.DirectionalLight(0xb092ff, 1.1)
  key.position.set(5, 10, 8); key.castShadow = true
  key.shadow.mapSize.set(1024, 1024); key.shadow.camera.near = 1; key.shadow.camera.far = 30
  scene.add(key)
  const rim = new THREE.PointLight(new THREE.Color(world.color), 2.2, 30, 2)
  rim.position.set(0, 4, -1.5); scene.add(rim)
  const rim2 = new THREE.PointLight(new THREE.Color(world.accent), 1.5, 22, 2.2)
  rim2.position.set(-3, 2, 3); scene.add(rim2)

  // ─── The Door ───
  const doorGroup = new THREE.Group()
  // Frame (ornate dark metal)
  const frameMat = new THREE.MeshStandardMaterial({ color: 0x1a0a3a, metalness: .85, roughness: .25, emissive: 0x0a0420, emissiveIntensity: .3 })
  const frameThickness = 0.3, doorW = 2.6, doorH = 4.4
  const frameTop = new THREE.Mesh(new THREE.BoxGeometry(doorW + frameThickness*2 + .3, frameThickness, .35), frameMat)
  frameTop.position.set(0, doorH + frameThickness/2, 0); doorGroup.add(frameTop)
  const frameL = new THREE.Mesh(new THREE.BoxGeometry(frameThickness, doorH, .35), frameMat)
  frameL.position.set(-doorW/2 - frameThickness/2, doorH/2, 0); doorGroup.add(frameL)
  const frameR = frameL.clone(); frameR.position.x = doorW/2 + frameThickness/2; doorGroup.add(frameR)
  // Pediment (top ornament)
  const pediment = new THREE.Mesh(
    new THREE.CylinderGeometry(doorW/2 + .3, doorW/2 + .3, .3, 24, 1, false, 0, Math.PI),
    frameMat
  )
  pediment.rotation.z = Math.PI; pediment.rotation.x = Math.PI/2
  pediment.position.set(0, doorH + frameThickness + .15, 0)
  doorGroup.add(pediment)

  // Door leaves (two halves)
  const doorMat = new THREE.MeshStandardMaterial({ color: 0x2a1440, metalness: .6, roughness: .4, emissive: 0x120422, emissiveIntensity: .2 })
  const leafL = new THREE.Mesh(new THREE.BoxGeometry(doorW/2, doorH, .12), doorMat)
  leafL.position.set(-doorW/4, doorH/2, 0.02); doorGroup.add(leafL)
  const leafR = leafL.clone(); leafR.position.x = doorW/4; doorGroup.add(leafR)
  // Door inner carving glow
  const carving = new THREE.Mesh(
    new THREE.CircleGeometry(.65, 24),
    new THREE.MeshBasicMaterial({ color: new THREE.Color(world.color), transparent: true, opacity: .5, blending: THREE.AdditiveBlending })
  )
  carving.position.set(0, doorH/2 + .7, 0.08); doorGroup.add(carving)
  const carving2 = carving.clone(); carving2.position.y = doorH/2 - .6
  carving2.scale.setScalar(.6); doorGroup.add(carving2)
  // Handles
  const handleMat = new THREE.MeshStandardMaterial({ color: 0xf0c068, metalness: 1, roughness: .1 })
  const handle1 = new THREE.Mesh(new THREE.SphereGeometry(.1, 12, 10), handleMat)
  handle1.position.set(-.18, doorH/2, .14); doorGroup.add(handle1)
  const handle2 = handle1.clone(); handle2.position.x = .18; doorGroup.add(handle2)

  // Portal (appears behind the door, hidden initially)
  const portalGeom = new THREE.CircleGeometry(1.6, 48)
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
        // spinning radial
        float n = noise(vec2(a*4.0 + time*0.9, r*12.0 - time*1.8));
        float ring = smoothstep(0.5, 0.48, r) - smoothstep(0.48, 0.46, r);
        float core = smoothstep(0.5, 0.0, r);
        vec3 col = mix(colorB, colorA, n);
        float brightness = core * (0.6 + n * 0.5) + ring * 0.8;
        float alpha = smoothstep(0.5, 0.44, r) * (0.75 + n * 0.3) * opacity;
        gl_FragColor = vec4(col * brightness * 1.3, alpha);
      }
    `,
    side: THREE.DoubleSide,
    depthWrite: false,
  })
  const portal = new THREE.Mesh(portalGeom, portalMat)
  portal.position.set(0, doorH/2, -0.05)
  portal.visible = false
  doorGroup.add(portal)

  scene.add(doorGroup)

  // Glowing particles around the door
  const spGeo = new THREE.BufferGeometry()
  const spCount = 200
  const spPos = new Float32Array(spCount * 3), spSp = new Float32Array(spCount)
  for (let i = 0; i < spCount; i++) {
    const a = Math.random() * Math.PI * 2, rr = 1.6 + Math.random() * 2.5
    spPos[i*3]   = Math.cos(a) * rr
    spPos[i*3+1] = Math.random() * 4 + .5
    spPos[i*3+2] = Math.sin(a) * rr
    spSp[i] = .3 + Math.random() * 1
  }
  spGeo.setAttribute('position', new THREE.BufferAttribute(spPos, 3))
  const spMat = new THREE.PointsMaterial({
    color: new THREE.Color(world.accent),
    size: 0.06, transparent: true, opacity: .8,
    blending: THREE.AdditiveBlending, depthWrite: false,
  })
  const sparks = new THREE.Points(spGeo, spMat); scene.add(sparks)

  // Pillars flanking the door
  for (let i = 0; i < 2; i++) {
    const col = new THREE.Group()
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(.22, .3, 4.8, 16), new THREE.MeshStandardMaterial({ color: 0x1a0a3a, metalness: .7, roughness: .3 }))
    shaft.position.y = 2.4; col.add(shaft)
    const cap = new THREE.Mesh(new THREE.BoxGeometry(.9, .4, .9), new THREE.MeshStandardMaterial({ color: 0x1a0a3a, metalness: .7, roughness: .3 }))
    cap.position.y = 4.8 + .2; col.add(cap)
    const orb = new THREE.Mesh(new THREE.SphereGeometry(.22, 12, 10), new THREE.MeshStandardMaterial({
      color: 0x000, emissive: new THREE.Color(world.color), emissiveIntensity: 2
    }))
    orb.position.y = 5.3; col.add(orb)
    col.position.set(i === 0 ? -3.2 : 3.2, 0, 0)
    scene.add(col)
  }

  // Ground ring glow
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(2.0, 4.5, 64),
    new THREE.MeshBasicMaterial({ color: new THREE.Color(world.color), transparent: true, opacity: .15, side: THREE.DoubleSide })
  )
  ring.rotation.x = -Math.PI / 2; ring.position.y = 0.01
  scene.add(ring)

  // Initial camera slightly away
  let camT = 0
  let openT = 0
  let doorOpened = false
  let warping = false
  const baseCamPos = new THREE.Vector3(0, 1.8, 9)
  const zoomCamPos = new THREE.Vector3(0, 2.0, 3.2)
  const throughCamPos = new THREE.Vector3(0, 2.2, -1.0)

  stage.appendChild(renderer.domElement)
  resize(); window.addEventListener('resize', resize)

  // Interaction: tap to open
  const openDoor = () => {
    if (doorOpened) return
    doorOpened = true
    sound.playDoorOpen() {
    gtag("event", "door_opened");   prompt.style.opacity = '0'
    prompt.style.transform = 'translateX(-50%) translateY(20px)'
    prompt.style.transition = 'all .6s ease'
    // Show portal after a beat
    setTimeout(() => { portal.visible = true }, 400)
    // After door fully opens and camera moves through, start warp
    setTimeout(() => { startWarp() }, 3000)
  }
  stage.addEventListener('click', openDoor)
  stage.addEventListener('touchstart', openDoor, { passive: true })

  // Keyboard shortcut
  const onKey = (e) => { if (e.code === 'Space' || e.code === 'Enter') openDoor() }
  window.addEventListener('keydown', onKey)

  // Gentle mouse-look before opening
  let mx = 0, my = 0
  const onMove = (e) => {
    const cx = (e.touches ? e.touches[0].clientX : e.clientX) / window.innerWidth - .5
    const cy = (e.touches ? e.touches[0].clientY : e.clientY) / window.innerHeight - .5
    mx = cx; my = cy
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
    const dt = Math.min(0.05, (now - last) / 1000); last = now
    camT += dt

    portalMat.uniforms.time.value = camT

    if (doorOpened) {
      openT += dt
      const openAmount = Math.min(1, openT / 1.2)
      const ease = 1 - Math.pow(1 - openAmount, 3)
      leafL.rotation.y = ease * Math.PI * 0.45
      leafR.rotation.y = -ease * Math.PI * 0.45
      portalMat.uniforms.opacity.value = ease
      // Camera zooms toward the door, then through
      if (openT < 1.4) {
        const t = openT / 1.4
        const e = 1 - Math.pow(1 - t, 2)
        camera.position.lerpVectors(baseCamPos, zoomCamPos, e)
      } else {
        const t = Math.min(1, (openT - 1.4) / 1.4)
        const e = t < .5 ? 2*t*t : 1 - Math.pow(-2*t + 2, 3) / 2
        camera.position.lerpVectors(zoomCamPos, throughCamPos, e)
        // Flash whitening
        renderer.setClearColor(new THREE.Color(world.color).multiplyScalar(e * 0.6), 1)
      }
      camera.lookAt(0, 2.2, -1)
    } else {
      // Gentle sway
      camera.position.x = baseCamPos.x + mx * .6
      camera.position.y = baseCamPos.y - my * .3
      camera.lookAt(0, 2.2, 0)
    }

    // Sparks orbit
    const positions = sparks.geometry.attributes.position.array
    for (let i = 0; i < spCount; i++) {
      const a = camT * 0.3 + (i / spCount) * Math.PI * 2
      const rr = 1.6 + Math.sin(camT * .5 + i) * .6
      positions[i*3]     = Math.cos(a) * rr
      positions[i*3 + 1] = 0.5 + Math.abs(Math.sin(camT * .3 + i * 0.4)) * 3
      positions[i*3 + 2] = Math.sin(a) * rr
    }
    sparks.geometry.attributes.position.needsUpdate = true
    sparks.material.opacity = .4 + Math.sin(camT * 2) * .3

    ring.material.opacity = .15 + Math.sin(camT * 1.2) * .08
    rim.intensity = 2.2 + Math.sin(camT * 2) * .8

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
 * WARP TRANSITION — wormhole tunnel
 * ============================================================ */
function renderWarpTransition() {
  disposeScene(); sound.playWarpWhoosh() {
    gtag("event", "warp_started"); state.phase = 'warp'
  const root = qs('#root'); root.innerHTML = ''

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
  scene.background = new THREE.Color(0x000008)
  scene.fog = new THREE.FogExp2(0x000000, 0.04)

  const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 200)
  camera.position.set(0, 0, 0)

  // Tunnel (thousands of streaking particles)
  const tunnel = new THREE.Group()
  const starCount = 2500
  const sGeo = new THREE.BufferGeometry()
  const sPos = new Float32Array(starCount * 3)
  const sCol = new Float32Array(starCount * 3)
  const sVel = new Float32Array(starCount)
  const startColor = new THREE.Color(world.color)
  const endColor = new THREE.Color(world.accent)
  for (let i = 0; i < starCount; i++) {
    const r = 3 + Math.random() * 18
    const a = Math.random() * Math.PI * 2
    sPos[i*3]     = Math.cos(a) * r
    sPos[i*3 + 1] = Math.sin(a) * r
    sPos[i*3 + 2] = -Math.random() * 300
    const mix = Math.random()
    const c = startColor.clone().lerp(endColor, mix)
    sCol[i*3]     = c.r
    sCol[i*3 + 1] = c.g
    sCol[i*3 + 2] = c.b
    sVel[i] = 40 + Math.random() * 80
  }
  sGeo.setAttribute('position', new THREE.BufferAttribute(sPos, 3))
  sGeo.setAttribute('color', new THREE.BufferAttribute(sCol, 3))
  const sMat = new THREE.PointsMaterial({
    size: 0.4, vertexColors: true, transparent: true, opacity: .95,
    blending: THREE.AdditiveBlending, depthWrite: false,
  })
  const stars = new THREE.Points(sGeo, sMat); tunnel.add(stars)

  // Tunnel rings
  const rings = []
  for (let i = 0; i < 14; i++) {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(4 + Math.random()*2, 0.05, 8, 48),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(world.color).multiplyScalar(.8 + Math.random()*.4), transparent: true, opacity: .5 })
    )
    ring.position.z = -10 - i * 16
    rings.push(ring)
    tunnel.add(ring)
  }

  // Central glow sphere (destination)
  const dest = new THREE.Mesh(
    new THREE.SphereGeometry(0.4, 16, 12),
    new THREE.MeshBasicMaterial({ color: new THREE.Color(world.color), transparent: true, opacity: 0 })
  )
  dest.position.z = -200
  tunnel.add(dest)

  scene.add(tunnel)

  stage.appendChild(renderer.domElement)
  resize(); window.addEventListener('resize', resize)

  let t = 0
  const duration = 3.2

  const pbar = qs('#wpb')

  let last = performance.now()
  const loop = () => {
    const now = performance.now()
    const dt = Math.min(0.05, (now - last) / 1000); last = now
    t += dt

    // Move stars forward (toward camera)
    const positions = stars.geometry.attributes.position.array
    for (let i = 0; i < starCount; i++) {
      positions[i*3 + 2] += sVel[i] * dt
      if (positions[i*3 + 2] > 5) {
        const a = Math.random() * Math.PI * 2
        const r = 3 + Math.random() * 18
        positions[i*3]     = Math.cos(a) * r
        positions[i*3 + 1] = Math.sin(a) * r
        positions[i*3 + 2] = -280 - Math.random() * 30
      }
    }
    stars.geometry.attributes.position.needsUpdate = true
    stars.material.size = 0.3 + t * 0.15

    // Rings
    rings.forEach((r, i) => {
      r.position.z += 40 * dt * (1 + t * 0.4)
      if (r.position.z > 8) r.position.z = -220
      r.rotation.z += dt * (0.2 + i * 0.05)
    })

    // Camera shake during warp
    const shake = t < duration ? (1 - t/duration) * 0.04 : 0
    camera.position.x = (Math.random()-.5) * shake
    camera.position.y = (Math.random()-.5) * shake
    camera.rotation.z += dt * 0.15

    // Dest flash growing
    const p = Math.min(1, t / duration)
    if (pbar) pbar.style.width = (p * 100) + '%'
    dest.material.opacity = Math.pow(p, 2) * 0.9
    dest.scale.setScalar(1 + p * 20)
    dest.position.z = -200 + p * 200

    // End
    if (t > duration + 0.5) {
      cancelAnimationFrame(currentScene.raf)
      renderWorldScene()
      return
    }

    renderer.render(scene, camera)
    currentScene.raf = requestAnimationFrame(loop)
  }
  currentScene = {
    renderer, scene, raf: null,
    cleanup: () => { window.removeEventListener('resize', resize) }
  }
  currentScene.raf = requestAnimationFrame(loop)
}

/* ============================================================
 * WORLD SCENE — fully immersive 3D world (FPS-like)
 * ============================================================ */
function renderWorldScene() {
  disposeScene()
  state.phase = 'world'
  const root = qs('#root'); root.innerHTML = ''

  const world = state.world

  const stage = h('div', { class: 'world-stage' })
  const hud = h('div', { class: 'world-hud' })
  stage.appendChild(hud)
  stage.appendChild(h('div', { class: 'vignette' }))

  // Top HUD
  hud.appendChild(h('div', { class: 'world-top' },
    h('div', { class: 'world-name-block' },
      h('span', { class: 'emoji' }, world.emoji),
      h('div', {},
        h('h2', {}, world.name),
        h('div', { class: 'sub' }, `${world.subtitle}  ·  ${world.year}`)
      )
    ),
    h('div', { class: 'world-actions' },
      h('button', {
        class: 'world-btn',
        onclick: () => { sound.playUI(700); shareWorld() }
      }, '🔗 シェア'),
      h('button', {
        class: 'world-btn',
        onclick: () => { sound.playUI(520); screenshotWorld() }
      }, '📸 到着記録'),
      h('button', {
        class: 'world-btn',
        onclick: (e) => {
          sound.setEnabled(!sound.enabled)
          e.currentTarget.textContent = sound.enabled ? '🔊 音声 ON' : '🔇 音声 OFF'
        }
      }, sound.enabled ? '🔊 音声 ON' : '🔇 音声 OFF'),
      h('button', {
        class: 'world-btn danger',
        onclick: () => { sound.playUI(300); renderLanding() }
      }, '← 帰還')
    )
  ))

  // Discovery card (bottom)
  const discoveryEl = h('div', { class: 'discovery-text' }, '周囲を観察しています...')
  hud.appendChild(h('div', { class: 'world-bottom' },
    h('div', { class: 'discovery' },
      h('div', { class: 'discovery-label' }, '発見'),
      discoveryEl
    ),
    h('button', {
      class: 'world-btn',
      style: { color: world.color, borderColor: world.color + '55' },
      onclick: () => {
        const d = world.discoveries[Math.floor(Math.random() * world.discoveries.length)]
        discoveryEl.textContent = d; sound.playUI(980)
      }
    }, '◆ もっと発見する')
  ))

  // Crosshair + compass + controls help
  hud.appendChild(h('div', { class: 'crosshair' }))
  hud.appendChild(h('div', { class: 'mini-compass' }, '🧭'))
  hud.appendChild(h('div', { class: 'controls-help' },
    h('div', {}, h('span', { class: 'kbd' }, 'W'), h('span', { class: 'kbd' }, 'A'), h('span', { class: 'kbd' }, 'S'), h('span', { class: 'kbd' }, 'D'), ' 移動'),
    h('div', {}, h('span', { class: 'kbd' }, 'ドラッグ'), ' 視点'),
    h('div', {}, h('span', { class: 'kbd' }, 'Shift'), ' 走る'),
    h('div', {}, h('span', { class: 'kbd' }, 'Q'), ' 帰還'),
  ))

  root.appendChild(stage)

  // Build 3D world
  const builder = SCENE_BUILDERS[world.id]
  if (!builder) { alert('世界が構築できませんでした'); return renderLanding() }
  const built = builder()

  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.0
  renderer.outputColorSpace = THREE.SRGBColorSpace
  const resize = () => {
    renderer.setSize(window.innerWidth, window.innerHeight)
    built.camera.aspect = window.innerWidth / window.innerHeight
    built.camera.updateProjectionMatrix()
  }
  stage.appendChild(renderer.domElement)
  resize(); window.addEventListener('resize', resize)

  // First-person controls
  const camera = built.camera
  const scene = built.scene

  const keys = { forward: 0, back: 0, left: 0, right: 0, run: 0 }
  let yaw = 0, pitch = 0
  const eyeHeight = 2.0
  camera.position.y = eyeHeight

  // Arrive animation: fade from white
  const flashOverlay = h('div', { style: {
    position: 'absolute', inset: '0', background: world.sky || world.color,
    pointerEvents: 'none', zIndex: '408', transition: 'opacity 1.8s ease-out', opacity: '1',
  }})
  stage.appendChild(flashOverlay)
  setTimeout(() => { flashOverlay.style.opacity = '0' }, 80)
  setTimeout(() => flashOverlay.remove(), 2200)

  // Arrival pulse
  setTimeout(() => {
    if (!state.arrivalDone) {
      state.arrivalDone = true
      incrementStamp(world.id)
      sound.playArrival() {
    gtag("event", "world_arrived");     sound.startAmbient(world)
      const first = world.discoveries[0]
      discoveryEl.textContent = first
      // Auto-rotate discoveries
      let idx = 0
      const discI = setInterval(() => {
        if (state.phase !== 'world') return clearInterval(discI)
        idx = (idx + 1) % world.discoveries.length
        discoveryEl.style.opacity = '0'
        setTimeout(() => {
          discoveryEl.textContent = world.discoveries[idx]
          discoveryEl.style.transition = 'opacity .6s'
          discoveryEl.style.opacity = '1'
        }, 400)
      }, 6500)
      currentScene._discI = discI
    }
  }, 900)

  // Controls: pointer drag for look, WASD for walk
  let dragging = false, lastX = 0, lastY = 0
  const onPointerDown = (e) => {
    dragging = true
    lastX = e.clientX ?? e.touches?.[0]?.clientX ?? 0
    lastY = e.clientY ?? e.touches?.[0]?.clientY ?? 0
    stage.style.cursor = 'grabbing'
  }
  const onPointerUp = () => { dragging = false; stage.style.cursor = 'grab' }
  const onPointerMove = (e) => {
    if (!dragging) return
    const x = e.clientX ?? e.touches?.[0]?.clientX ?? 0
    const y = e.clientY ?? e.touches?.[0]?.clientY ?? 0
    const dx = (x - lastX), dy = (y - lastY); lastX = x; lastY = y
    yaw -= dx * 0.0035
    pitch = clamp(pitch - dy * 0.0035, -Math.PI/2.4, Math.PI/2.4)
  }
  const onTouchMove = (e) => {
    if (!dragging) return
    e.preventDefault()
    onPointerMove(e.touches[0])
  }

  renderer.domElement.addEventListener('pointerdown', onPointerDown)
  window.addEventListener('pointerup', onPointerUp)
  window.addEventListener('pointermove', onPointerMove)
  renderer.domElement.addEventListener('touchstart', (e) => onPointerDown(e.touches[0]), { passive: true })
  renderer.domElement.addEventListener('touchend', onPointerUp)
  renderer.domElement.addEventListener('touchmove', onTouchMove, { passive: false })
  stage.style.cursor = 'grab'

  const onKeyDown = (e) => {
    const k = e.key.toLowerCase()
    if (k === 'w' || e.key === 'ArrowUp')    keys.forward = 1
    if (k === 's' || e.key === 'ArrowDown')  keys.back = 1
    if (k === 'a' || e.key === 'ArrowLeft')  keys.left = 1
    if (k === 'd' || e.key === 'ArrowRight') keys.right = 1
    if (e.key === 'Shift') keys.run = 1
    if (k === 'q' || e.key === 'Escape') renderLanding()
  }
  const onKeyUp = (e) => {
    const k = e.key.toLowerCase()
    if (k === 'w' || e.key === 'ArrowUp')    keys.forward = 0
    if (k === 's' || e.key === 'ArrowDown')  keys.back = 0
    if (k === 'a' || e.key === 'ArrowLeft')  keys.left = 0
    if (k === 'd' || e.key === 'ArrowRight') keys.right = 0
    if (e.key === 'Shift') keys.run = 0
  }
  window.addEventListener('keydown', onKeyDown)
  window.addEventListener('keyup', onKeyUp)

  // Mobile joystick (touch)
  let joystick = null
  if ('ontouchstart' in window) {
    joystick = h('div', { style: {
      position: 'absolute', bottom: '20px', left: '20px',
      width: '110px', height: '110px', borderRadius: '50%',
      background: 'rgba(10,8,24,.6)', border: '1px solid rgba(255,255,255,.15)',
      backdropFilter: 'blur(10px)', zIndex: '430', touchAction: 'none',
    }})
    const knob = h('div', { style: {
      position: 'absolute', top: '50%', left: '50%', width: '44px', height: '44px',
      marginTop: '-22px', marginLeft: '-22px', borderRadius: '50%',
      background: 'rgba(172,120,255,.5)', border: '1px solid rgba(255,255,255,.25)',
      boxShadow: '0 4px 14px rgba(172,120,255,.4)',
    }})
    joystick.appendChild(knob)
    hud.appendChild(joystick)
    let jActive = false, jcx = 0, jcy = 0
    joystick.addEventListener('touchstart', (e) => {
      const r = joystick.getBoundingClientRect(); jcx = r.left + r.width/2; jcy = r.top + r.height/2
      jActive = true
    }, { passive: true })
    window.addEventListener('touchmove', (e) => {
      if (!jActive) return
      const t = e.touches[0]
      const dx = t.clientX - jcx, dy = t.clientY - jcy
      const mag = Math.min(Math.sqrt(dx*dx + dy*dy), 45)
      const ang = Math.atan2(dy, dx)
      const kx = Math.cos(ang) * mag, ky = Math.sin(ang) * mag
      knob.style.transform = `translate(${kx}px, ${ky}px)`
      keys.forward = ky < -8 ? 1 : 0
      keys.back    = ky >  8 ? 1 : 0
      keys.left    = kx < -8 ? 1 : 0
      keys.right   = kx >  8 ? 1 : 0
    })
    window.addEventListener('touchend', () => {
      jActive = false; knob.style.transform = 'translate(0,0)'
      keys.forward = keys.back = keys.left = keys.right = 0
    })
  }

  // Animation loop
  let last = performance.now()
  let simT = 0
  const velocity = new THREE.Vector3()
  const forward = new THREE.Vector3()
  const right = new THREE.Vector3()
  const WALK = 6.0, RUN = 14.0

  const loop = () => {
    const now = performance.now()
    const dt = Math.min(0.06, (now - last) / 1000); last = now
    simT += dt

    // Camera orientation
    camera.rotation.order = 'YXZ'
    camera.rotation.y = yaw
    camera.rotation.x = pitch

    // Movement
    forward.set(-Math.sin(yaw), 0, -Math.cos(yaw))
    right.set(Math.cos(yaw), 0, -Math.sin(yaw))
    const speed = (keys.run ? RUN : WALK)
    const moveX = (keys.forward - keys.back) * forward.x + (keys.right - keys.left) * right.x
    const moveZ = (keys.forward - keys.back) * forward.z + (keys.right - keys.left) * right.z
    const vx = moveX * speed, vz = moveZ * speed
    velocity.x = lerp(velocity.x, vx, clamp(dt * 10, 0, 1))
    velocity.z = lerp(velocity.z, vz, clamp(dt * 10, 0, 1))
    camera.position.x += velocity.x * dt
    camera.position.z += velocity.z * dt
    // Clamp within world
    camera.position.x = clamp(camera.position.x, -180, 180)
    camera.position.z = clamp(camera.position.z, -180, 180)
    // Head bobbing when walking
    const moving = Math.abs(velocity.x) + Math.abs(velocity.z) > 0.5
    const bob = moving ? Math.sin(simT * (keys.run ? 12 : 8)) * (keys.run ? 0.1 : 0.05) : 0
    camera.position.y = eyeHeight + bob

    // Per-world update
    if (built.update) built.update(dt, simT)

    renderer.render(scene, camera)
    currentScene.raf = requestAnimationFrame(loop)
  }

  currentScene = {
    renderer, scene, raf: null,
    cleanup: () => {
      window.removeEventListener('resize', resize)
      window.removeEventListener('pointerup', onPointerUp)
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      if (currentScene._discI) clearInterval(currentScene._discI)
    }
  }
  currentScene.raf = requestAnimationFrame(loop)
}

/* ============================================================
 * SHARE / SCREENSHOT
 * ============================================================ */
function showToast(msg, ms = 2400) {
  const t = h('div', { class: 'toast' }, msg)
  document.body.appendChild(t)
  setTimeout(() => { t.style.opacity = '0'; t.style.transform = 'translateX(-50%) translateY(10px)'; t.style.transition = 'all .3s' }, ms - 300)
  setTimeout(() => t.remove(), ms)
}

async function shareWorld() {
  const url = `${location.origin}/?w=${state.world.id}`
  const text = `${state.world.emoji} ${state.world.name} (${state.world.year}) にワープしてきた！`
  if (navigator.share) {
    try { await navigator.share({ title: 'WARPDOOR', text, url }); return } catch {}
  }
  try {
    await navigator.clipboard.writeText(`${text}\n${url}`)
    showToast('📋 シェア用リンクをコピーしました')
  } catch { showToast(url) }
}

function screenshotWorld() {
  try {
    const rc = currentScene && currentScene.renderer
    if (!rc) return showToast('スクリーンショット失敗')
    // Force one frame render synchronously
    rc.render(currentScene.scene, state.world ? SCENE_BUILDERS[state.world.id] : null) // ignore
    const data = rc.domElement.toDataURL('image/png')
    const a = document.createElement('a')
    a.download = `warpdoor-${state.world.id}-${Date.now()}.png`
    a.href = data; a.click()
    showToast('📸 記録を保存しました')
  } catch (e) {
    console.warn(e); showToast('保存失敗')
  }
}

/* ============================================================
 * MODAL — Collection + Paywall
 * ============================================================ */
function renderCollectionModal() {
  const overlay = h('div', { class: 'modal-overlay', onclick: (e) => { if (e.target === overlay) overlay.remove() } })
  const modal = h('div', { class: 'modal', style: { position: 'relative' } })
  overlay.appendChild(modal)
  modal.appendChild(h('button', { class: 'modal-close', onclick: () => overlay.remove() }, '×'))
  modal.appendChild(h('h2', {}, '🏆 あなたのコレクション'))
  modal.appendChild(h('p', {}, `これまで ${state.totalWarps.toLocaleString()} 回のワープで、${Object.keys(state.stamps).length} / ${WORLDS.length} 時代を訪れました。`))
  const grid = h('div', { class: 'stamp-grid' })
  WORLDS.forEach(w => {
    const earned = !!state.stamps[w.id]
    const st = h('div', {
      class: 'stamp' + (earned ? ' earned' : ''),
      title: earned ? `${w.name} - ${state.stamps[w.id]}回` : `${w.name} (未到達)`,
      onclick: () => { overlay.remove(); selectWorld(w) },
      style: { cursor: 'pointer' }
    }, w.emoji)
    if (earned) st.appendChild(h('span', { class: 'ct' }, `×${state.stamps[w.id]}`))
    grid.appendChild(st)
  })
  modal.appendChild(grid)
  modal.appendChild(h('div', { class: 'modal-actions' },
    h('button', { class: 'action-btn', onclick: () => { overlay.remove(); randomWarp() } }, '🎲 ランダムワープ'),
    h('button', { class: 'hud-btn', onclick: () => overlay.remove() }, '閉じる')
  ))
  document.body.appendChild(overlay)
}

function renderPaywall() {
  const overlay = h('div', { class: 'modal-overlay', onclick: (e) => { if (e.target === overlay) overlay.remove() } })
  const modal = h('div', { class: 'modal', style: { position: 'relative' } })
  overlay.appendChild(modal)
  modal.appendChild(h('button', { class: 'modal-close', onclick: () => overlay.remove() }, '×'))
  modal.appendChild(h('h2', {}, '✨ Collector Pass'))
  modal.appendChild(h('p', {}, 'より深い時空間体験を求めるあなたへ。月額 ¥980 で、特別な時代と機能が解放されます。'))
  const ul = h('ul', { class: 'pass-features' },
    h('li', {}, '🪐 火星コロニー（2200年）へのアクセス'),
    h('li', {}, '🌊 アトランティス（紀元前9600年）へのアクセス'),
    h('li', {}, '📸 4K解像度の記録写真ダウンロード'),
    h('li', {}, '🎨 限定「門」デザイン & カスタマイズ'),
    h('li', {}, '☁️ クラウドに無制限で思い出を保存'),
    h('li', {}, '🚫 広告完全非表示'),
  )
  modal.appendChild(ul)
  modal.appendChild(h('div', { class: 'modal-actions' },
    h('button', {
      class: 'action-btn primary',
      onclick: () => {
        state.hasPass = true; storage.set('hasPass', true)
        overlay.remove(); showToast('✨ Collector Pass を有効化しました（デモ）')
      }
    }, '✨ 今すぐ Pass を有効化 (DEMO)'),
    h('button', { class: 'hud-btn', onclick: () => overlay.remove() }, '後で')
  ))
  document.body.appendChild(overlay)
}

/* ============================================================
 * INIT — Deep-link support
 * ============================================================ */
function init() {
  const params = new URLSearchParams(location.search)
  const wid = params.get('w')
  if (wid) {
    const w = WORLDS.find(x => x.id === wid)
    if (w) { state.world = w; renderDoorScene(); return }
  }
  renderLanding()
}

init()

// Resume audio context on first user gesture (browser policy)
window.addEventListener('pointerdown', () => {
  sound.ensure()
  if (sound.ctx && sound.ctx.state === 'suspended') sound.ctx.resume()
}, { once: true })
