// ============================================================
// WARPDOOR v6 — World Definitions & Cinematic 3D Scene Builders
// Powered by Three.js (module import via importmap)
// ============================================================
import * as THREE from 'three'

/* ------------------------------------------------------------
 * WORLDS METADATA
 * ------------------------------------------------------------ */
export const WORLDS = [
  {
    id: 'rome',
    name: '古代ローマ',
    subtitle: 'Roma Aeterna',
    year: '紀元前 50年',
    desc: '剣闘士が闘い、テルマエで市民が語らう。神殿が黄金に輝く永遠の都。',
    color: '#e8a060',
    accent: '#f5cc80',
    sky: '#f2b974',
    fog: 0xf3c380,
    emoji: '🏛',
    tags: ['古代', '地中海', '帝国'],
    warps: 84231,
    discoveries: [
      'テルマエ（公衆浴場）で市民が談笑しています',
      '剣闘士が訓練場で腕を磨いています',
      '神官が神殿で厳かな祭事を行っています',
      '商人が市場でワインと香辛料を売っています',
      '競技場から歓声が聴こえます',
      '詩人がフォロで演説を始めました',
      '黄金の夕日が石畳を照らしています',
    ],
    soundscape: { tone: 'warm', freq: 220, ambient: 'crowd' },
  },
  {
    id: 'tokyo2150',
    name: '未来の東京',
    subtitle: 'Neo Tokyo 2150',
    year: '2150年',
    desc: 'どこでもドアが路上に並び、空飛ぶ車が行き交う。AIと人間が融合した光の都市。',
    color: '#00d4ff',
    accent: '#ff4488',
    sky: '#060018',
    fog: 0x0a0030,
    emoji: '🚀',
    tags: ['未来', 'SF', 'テクノロジー'],
    warps: 201847,
    discoveries: [
      'どこでもドアから見知らぬ場所の市民が現れました',
      '自律走行の空飛ぶ車が低空通過しました',
      'AIアシスタントホログラムが道案内をしています',
      '量子通信タワーが夜空を照らしています',
      'バイオ発光の植物が歩道を彩っています',
      'ネオン広告が摩天楼に映り込んでいます',
      'データストリームが夜を貫いています',
    ],
    soundscape: { tone: 'cool', freq: 110, ambient: 'cyberpunk' },
  },
  {
    id: 'edo',
    name: '江戸時代',
    subtitle: 'Edo Period',
    year: '1680年',
    desc: '桜が舞い、侍が歩く。世界最大の都市・江戸の喧騒と詫び寂びの美。',
    color: '#ff8860',
    accent: '#ffcc88',
    sky: '#f0c9ad',
    fog: 0xeec8a4,
    emoji: '⛩',
    tags: ['歴史', '日本', '武士'],
    warps: 118562,
    discoveries: [
      '桜の花びらが風に舞い上がっています',
      '商人が橋の袂で鈴カステラを売っています',
      '花魁行列が練り歩いています',
      '職人が木版画を刷っています',
      '寺の鐘が低く響き渡ります',
      '薪売りが町を流し歩いています',
      '長屋から三味線の音が聞こえます',
    ],
    soundscape: { tone: 'warm', freq: 180, ambient: 'wind' },
  },
  {
    id: 'nyc1924',
    name: '1920年代 NY',
    subtitle: 'Jazz Age NY',
    year: '1924年',
    desc: 'ジャズが響き、摩天楼が育つ。雨濡れた石畳と黄金の狂騒時代。',
    color: '#d4a840',
    accent: '#f0cc70',
    sky: '#1a1a2a',
    fog: 0x1a1a2a,
    emoji: '🎷',
    tags: ['歴史', '音楽', 'アメリカ'],
    warps: 72109,
    discoveries: [
      'サックス奏者が路地でブルースを演奏しています',
      '秘密のスピークイージーへの入口を発見しました',
      'ダンサーたちがチャールストンを踊っています',
      '摩天楼の鉄骨が空高くそびえています',
      '雨粒が石畳にジャズのリズムを刻んでいます',
      'T型フォードが路面を軋ませて走っています',
      '葉巻の煙がバーから漏れています',
    ],
    soundscape: { tone: 'warm', freq: 140, ambient: 'rain' },
  },
  {
    id: 'egypt',
    name: '古代エジプト',
    subtitle: 'Kingdom of Egypt',
    year: '紀元前 1280年',
    desc: 'ラムセス2世が統治し、ピラミッドが建設される。ナイルの水が命を育む黄金文明。',
    color: '#f0c040',
    accent: '#ff9900',
    sky: '#f6d26b',
    fog: 0xe8ba5a,
    emoji: '🏺',
    tags: ['古代', 'アフリカ', '神話'],
    warps: 93440,
    discoveries: [
      'ピラミッドが砂漠の熱気に揺らいでいます',
      'ファラオの衛兵が宮殿の門を守っています',
      'ヒエログリフが黄金に輝いています',
      'ナイル川の貿易船が港に着岸しました',
      '天文学者が夜空の星の動きを観測しています',
      'オベリスクが太陽を貫いています',
      'ラクダが隊商と共に砂漠を渡っています',
    ],
    soundscape: { tone: 'warm', freq: 200, ambient: 'wind' },
  },
  {
    id: 'medieval',
    name: '中世ヨーロッパ',
    subtitle: 'Medieval Kingdom',
    year: '1180年',
    desc: '城壁に囲まれた王国。騎士が馬を駆り、市場に商人が集まる。鐘の音が谷に響く。',
    color: '#7a9e5c',
    accent: '#c8e888',
    sky: '#97b8d2',
    fog: 0x9bbad4,
    emoji: '🏰',
    tags: ['中世', 'ヨーロッパ', '騎士'],
    warps: 51203,
    discoveries: [
      '騎士が城壁の上から遠征の準備をしています',
      '鍛冶屋が剣を打ちながら火花を散らしています',
      '市場で香辛料と布地が交換されています',
      '修道士が写本を丁寧に筆写しています',
      '城の宴会場から音楽と笑い声が聞こえます',
      '吟遊詩人が叙事詩を詠い上げています',
      '城の旗が風になびいています',
    ],
    soundscape: { tone: 'warm', freq: 160, ambient: 'wind' },
  },
  {
    id: 'mars2200',
    name: '火星コロニー',
    subtitle: 'Mars Colony',
    year: '2200年',
    desc: '赤い大地に光るドームの街。低重力の空を、人類の子供たちが駆け抜ける。',
    color: '#ff6a4a',
    accent: '#ffbc88',
    sky: '#b85038',
    fog: 0xc05a38,
    emoji: '🪐',
    tags: ['未来', '宇宙', 'SF'],
    warps: 28194,
    locked: true,
    discoveries: [
      'ドームの向こうに地球が青く輝いています',
      '低重力の砂嵐が地表を走っています',
      'テラフォーミング装置が空気を再生しています',
      '採掘ロボットが赤鉄鉱を運んでいます',
      '火星生まれの子供が宙を舞って遊んでいます',
      '第二の太陽が人工の月として輝いています',
      '火星開拓記念碑に名前が刻まれています',
    ],
    soundscape: { tone: 'cool', freq: 90, ambient: 'space' },
  },
  {
    id: 'atlantis',
    name: 'アトランティス',
    subtitle: 'Lost Kingdom',
    year: '紀元前 9600年',
    desc: '失われた大陸。金と銀の塔が海底に沈み、発光する魚が宮殿を泳ぐ。',
    color: '#44d4e0',
    accent: '#88f0e0',
    sky: '#003045',
    fog: 0x003045,
    emoji: '🌊',
    tags: ['幻想', '水中', '神話'],
    warps: 19877,
    locked: true,
    discoveries: [
      '発光するクラゲが宮殿を照らしています',
      '海底神殿に古の呪文が刻まれています',
      '巨大な海亀が悠然と泳いでいます',
      'オリハルコンの柱が虹色に輝いています',
      '海中の虹が水柱を貫いています',
      '失われた王家の紋章を発見しました',
      '深海の底から不思議な光が漂っています',
    ],
    soundscape: { tone: 'cool', freq: 130, ambient: 'water' },
  },
]

/* ------------------------------------------------------------
 * HELPERS
 * ------------------------------------------------------------ */
function makeNoiseTexture(size = 256, tint = 0xffffff) {
  const c = document.createElement('canvas'); c.width = c.height = size
  const ctx = c.getContext('2d')
  const img = ctx.createImageData(size, size)
  const r = (tint >> 16) & 0xff, g = (tint >> 8) & 0xff, b = tint & 0xff
  for (let i = 0; i < img.data.length; i += 4) {
    const n = Math.random()
    img.data[i]     = Math.min(255, r * n)
    img.data[i + 1] = Math.min(255, g * n)
    img.data[i + 2] = Math.min(255, b * n)
    img.data[i + 3] = 255
  }
  ctx.putImageData(img, 0, 0)
  const tex = new THREE.CanvasTexture(c)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  return tex
}

function makeGroundTexture(colorA, colorB, size = 512, pattern = 'stone') {
  const c = document.createElement('canvas'); c.width = c.height = size
  const ctx = c.getContext('2d')
  ctx.fillStyle = colorA; ctx.fillRect(0, 0, size, size)
  if (pattern === 'stone') {
    // Cobblestone-ish
    for (let i = 0; i < 180; i++) {
      ctx.fillStyle = `rgba(${Math.random()*40|0}, ${Math.random()*30|0}, ${Math.random()*20|0}, ${.15 + Math.random()*.25})`
      const x = Math.random() * size, y = Math.random() * size
      const w = 18 + Math.random() * 32, hh = 18 + Math.random() * 32
      ctx.beginPath()
      ctx.ellipse(x, y, w/2, hh/2, Math.random() * Math.PI, 0, Math.PI*2)
      ctx.fill()
    }
    // grout
    ctx.strokeStyle = `rgba(0,0,0,.35)`; ctx.lineWidth = 1.2
    for (let i = 0; i < 40; i++) {
      ctx.beginPath(); ctx.moveTo(Math.random()*size, Math.random()*size)
      ctx.lineTo(Math.random()*size, Math.random()*size); ctx.stroke()
    }
  } else if (pattern === 'sand') {
    for (let i = 0; i < 5000; i++) {
      ctx.fillStyle = `rgba(${220+Math.random()*30|0}, ${170+Math.random()*40|0}, ${80+Math.random()*40|0}, ${.1 + Math.random()*.15})`
      ctx.fillRect(Math.random()*size, Math.random()*size, 1 + Math.random()*2, 1 + Math.random()*2)
    }
    // dunes
    ctx.strokeStyle = 'rgba(160,110,40,.2)'; ctx.lineWidth = 3
    for (let y = 0; y < size; y += 18) {
      ctx.beginPath()
      for (let x = 0; x <= size; x += 10) ctx.lineTo(x, y + Math.sin(x*0.05) * 6)
      ctx.stroke()
    }
  } else if (pattern === 'grass') {
    for (let i = 0; i < 4000; i++) {
      ctx.fillStyle = `rgba(${60+Math.random()*30|0}, ${120+Math.random()*40|0}, ${50+Math.random()*30|0}, ${.15 + Math.random()*.2})`
      ctx.fillRect(Math.random()*size, Math.random()*size, 1 + Math.random()*1.5, 2 + Math.random()*3)
    }
  } else if (pattern === 'wet') {
    // wet asphalt
    for (let i = 0; i < 600; i++) {
      ctx.fillStyle = `rgba(${50 + Math.random()*60|0}, ${50 + Math.random()*60|0}, ${70 + Math.random()*70|0}, ${.2 + Math.random()*.2})`
      ctx.beginPath(); ctx.arc(Math.random()*size, Math.random()*size, 2 + Math.random()*6, 0, Math.PI*2); ctx.fill()
    }
    // reflections
    ctx.fillStyle = 'rgba(255,255,255,.04)'
    for (let i = 0; i < 20; i++) {
      const y = Math.random() * size
      ctx.fillRect(0, y, size, 1 + Math.random() * 3)
    }
  } else if (pattern === 'mars') {
    for (let i = 0; i < 2000; i++) {
      ctx.fillStyle = `rgba(${160+Math.random()*80|0}, ${60+Math.random()*40|0}, ${40+Math.random()*30|0}, ${.2 + Math.random()*.2})`
      ctx.fillRect(Math.random()*size, Math.random()*size, 1 + Math.random()*3, 1 + Math.random()*3)
    }
    // craters
    for (let i = 0; i < 40; i++) {
      const x = Math.random() * size, y = Math.random() * size, r = 8 + Math.random() * 22
      const grad = ctx.createRadialGradient(x, y, 1, x, y, r)
      grad.addColorStop(0, 'rgba(60,20,10,.4)')
      grad.addColorStop(1, 'rgba(60,20,10,0)')
      ctx.fillStyle = grad; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI*2); ctx.fill()
    }
  } else if (pattern === 'seafloor') {
    for (let i = 0; i < 2000; i++) {
      ctx.fillStyle = `rgba(${40+Math.random()*60|0}, ${100+Math.random()*80|0}, ${110+Math.random()*80|0}, ${.15 + Math.random()*.25})`
      ctx.fillRect(Math.random()*size, Math.random()*size, 1 + Math.random()*2, 1 + Math.random()*2)
    }
    // light caustics
    ctx.globalCompositeOperation = 'screen'
    for (let i = 0; i < 15; i++) {
      const x = Math.random()*size, y = Math.random()*size, r = 20 + Math.random()*40
      const g = ctx.createRadialGradient(x, y, 1, x, y, r)
      g.addColorStop(0, 'rgba(180,240,255,.25)')
      g.addColorStop(1, 'rgba(180,240,255,0)')
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI*2); ctx.fill()
    }
    ctx.globalCompositeOperation = 'source-over'
  }
  const tex = new THREE.CanvasTexture(c)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.anisotropy = 4
  return tex
}

// Gradient sky sphere
function makeGradientSky(colorTop, colorBottom) {
  const c = document.createElement('canvas'); c.width = 16; c.height = 512
  const ctx = c.getContext('2d')
  const g = ctx.createLinearGradient(0, 0, 0, 512)
  g.addColorStop(0, colorTop); g.addColorStop(1, colorBottom)
  ctx.fillStyle = g; ctx.fillRect(0, 0, 16, 512)
  const tex = new THREE.CanvasTexture(c)
  tex.mapping = THREE.EquirectangularReflectionMapping
  return tex
}

// A simple low-poly column (for temples)
function makeColumn({ height = 14, radius = .8, color = 0xf0e0b0 } = {}) {
  const g = new THREE.Group()
  const shaft = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius, height, 18, 1, false),
    new THREE.MeshStandardMaterial({ color, roughness: .85, metalness: .05, flatShading: false })
  )
  shaft.position.y = height / 2
  shaft.castShadow = true; shaft.receiveShadow = true
  g.add(shaft)
  // fluting marks
  const cap = new THREE.Mesh(
    new THREE.BoxGeometry(radius*2.6, .5, radius*2.6),
    new THREE.MeshStandardMaterial({ color, roughness: .6 })
  )
  cap.position.y = height + 0.25; g.add(cap)
  const base = new THREE.Mesh(
    new THREE.BoxGeometry(radius*2.4, .4, radius*2.4),
    new THREE.MeshStandardMaterial({ color: 0xd7c080, roughness: .7 })
  )
  base.position.y = .2; g.add(base)
  return g
}

// Mini tree (low-poly cone + trunk)
function makeTree({ trunkColor = 0x6d4524, leafColor = 0x5a8f3f, scale = 1 } = {}) {
  const g = new THREE.Group()
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(.18*scale, .22*scale, 1.2*scale, 8),
    new THREE.MeshStandardMaterial({ color: trunkColor, roughness: .95 })
  )
  trunk.position.y = .6 * scale; trunk.castShadow = true; g.add(trunk)
  const leaves = new THREE.Mesh(
    new THREE.ConeGeometry(1.2*scale, 2.6*scale, 8),
    new THREE.MeshStandardMaterial({ color: leafColor, roughness: .9, flatShading: true })
  )
  leaves.position.y = 2.2 * scale; leaves.castShadow = true; g.add(leaves)
  return g
}

// Starfield for night scenes
function addStarfield(scene, count = 800, radius = 400) {
  const g = new THREE.BufferGeometry()
  const positions = new Float32Array(count * 3)
  const colors = new Float32Array(count * 3)
  for (let i = 0; i < count; i++) {
    const phi = Math.acos(2 * Math.random() - 1)
    const theta = 2 * Math.PI * Math.random()
    const r = radius * (.9 + Math.random() * .1)
    positions[i*3]     = r * Math.sin(phi) * Math.cos(theta)
    positions[i*3 + 1] = Math.abs(r * Math.cos(phi)) // upper hemisphere
    positions[i*3 + 2] = r * Math.sin(phi) * Math.sin(theta)
    const c = 0.6 + Math.random() * 0.4
    colors[i*3] = c; colors[i*3+1] = c; colors[i*3+2] = Math.min(1, c + .1)
  }
  g.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  g.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  const mat = new THREE.PointsMaterial({
    size: 1.4, vertexColors: true, transparent: true, opacity: .9,
    sizeAttenuation: false,
  })
  const stars = new THREE.Points(g, mat)
  scene.add(stars)
  return stars
}

// Floating particles (dust / sakura / snow)
function addParticles(scene, { count = 240, color = 0xffffff, size = .08, area = 80, gravity = -.02, drift = .01, randomSpin = true } = {}) {
  const g = new THREE.BufferGeometry()
  const pos = new Float32Array(count * 3)
  const speed = new Float32Array(count)
  const offs = new Float32Array(count)
  for (let i = 0; i < count; i++) {
    pos[i*3]     = (Math.random() - .5) * area
    pos[i*3 + 1] = Math.random() * area * 0.5 + 2
    pos[i*3 + 2] = (Math.random() - .5) * area
    speed[i] = 0.7 + Math.random() * 1.4
    offs[i] = Math.random() * Math.PI * 2
  }
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  const mat = new THREE.PointsMaterial({ color, size, transparent: true, opacity: .9, depthWrite: false })
  const pts = new THREE.Points(g, mat)
  pts.userData = { speed, offs, gravity, drift, area, randomSpin }
  scene.add(pts)
  return pts
}

function animateParticles(pts, t) {
  const pos = pts.geometry.attributes.position.array
  const { speed, offs, gravity, drift, area } = pts.userData
  for (let i = 0; i < speed.length; i++) {
    pos[i*3 + 1] += gravity * speed[i]
    pos[i*3]     += Math.sin(t * 0.5 + offs[i]) * drift
    pos[i*3 + 2] += Math.cos(t * 0.4 + offs[i]) * drift
    if (pos[i*3 + 1] < -1) pos[i*3 + 1] = area * 0.5
  }
  pts.geometry.attributes.position.needsUpdate = true
}

// Stylized building (blocky)
function makeBuilding({ w = 6, h = 14, d = 6, color = 0x303040, windowColor = 0xffcc66, hasLights = true } = {}) {
  const g = new THREE.Group()
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(w, h, d),
    new THREE.MeshStandardMaterial({ color, roughness: .75, metalness: .15 })
  )
  body.position.y = h / 2
  body.castShadow = body.receiveShadow = true
  g.add(body)

  // Window lights (emissive grid)
  if (hasLights) {
    const winMat = new THREE.MeshStandardMaterial({
      color: 0x000000, emissive: windowColor, emissiveIntensity: 1.2, roughness: .4, metalness: .1,
    })
    const rows = Math.floor(h / 1.5) - 1
    const cols = Math.floor(w / 1.2)
    for (let iy = 1; iy <= rows; iy++) {
      for (let ix = 0; ix < cols; ix++) {
        if (Math.random() > 0.35) {
          const win = new THREE.Mesh(new THREE.PlaneGeometry(.5, .7), winMat)
          win.position.set(-w/2 + .6 + ix * 1.1, iy * 1.4, d/2 + 0.01)
          g.add(win)
          const win2 = win.clone(); win2.position.z = -d/2 - 0.01; win2.rotation.y = Math.PI; g.add(win2)
          const win3 = win.clone(); win3.position.set(w/2 + .01, iy * 1.4, -d/2 + .6 + ix * 1.1); win3.rotation.y = Math.PI/2
          if (ix < Math.floor(d/1.2)) g.add(win3)
        }
      }
    }
  }
  return g
}

/* ------------------------------------------------------------
 * SCENE BUILDERS
 * Each returns an object { scene, camera, update(dt, t), lookTargets }
 * ------------------------------------------------------------ */

// ----- Common: camera + renderer setup happens externally ----

function addGroundPlane(scene, tex, size = 400, repeat = 40) {
  tex.repeat.set(repeat, repeat)
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(size, size, 1, 1),
    new THREE.MeshStandardMaterial({ map: tex, roughness: .95 })
  )
  ground.rotation.x = -Math.PI / 2
  ground.receiveShadow = true
  scene.add(ground)
  return ground
}

function addSun(scene, pos = [80, 120, 40], color = 0xffe4b3, intensity = 1.2, withHelper = false) {
  const dir = new THREE.DirectionalLight(color, intensity)
  dir.position.set(...pos)
  dir.castShadow = true
  dir.shadow.mapSize.set(1024, 1024)
  dir.shadow.camera.near = 0.5; dir.shadow.camera.far = 400
  dir.shadow.camera.left = -80; dir.shadow.camera.right = 80
  dir.shadow.camera.top = 80; dir.shadow.camera.bottom = -80
  scene.add(dir)
  return dir
}

function addHemi(scene, skyCol, groundCol, intensity = 0.55) {
  const hemi = new THREE.HemisphereLight(skyCol, groundCol, intensity)
  scene.add(hemi); return hemi
}

// ----- 1. Rome -----
function buildRome() {
  const scene = new THREE.Scene()
  scene.background = makeGradientSky('#ffb86b', '#f8d4a6')
  scene.fog = new THREE.Fog(0xf3c380, 50, 260)

  const ground = addGroundPlane(scene, makeGroundTexture('#d7a366', '#b87742', 512, 'stone'), 500, 80)

  addSun(scene, [100, 150, 60], 0xffe0a0, 1.4)
  addHemi(scene, 0xffd1a0, 0x553322, 0.55)

  // Temple: 10 columns in two rows
  const temple = new THREE.Group()
  for (let i = 0; i < 7; i++) {
    const col = makeColumn({ height: 16, radius: 1, color: 0xf5e2b5 })
    col.position.set(-18 + i * 6, 0, -30); temple.add(col)
    const col2 = makeColumn({ height: 16, radius: 1, color: 0xf5e2b5 })
    col2.position.set(-18 + i * 6, 0, -42); temple.add(col2)
  }
  // Roof (triangle)
  const roof = new THREE.Mesh(
    new THREE.BoxGeometry(44, 3, 18),
    new THREE.MeshStandardMaterial({ color: 0xdcae75, roughness: .6 })
  )
  roof.position.set(0, 18.5, -36); temple.add(roof)
  const ped = new THREE.Mesh(
    new THREE.BoxGeometry(52, 1, 24),
    new THREE.MeshStandardMaterial({ color: 0xd4b582, roughness: .7 })
  )
  ped.position.set(0, 0.1, -36); ped.receiveShadow = true; temple.add(ped)
  scene.add(temple)

  // Side structures (villas)
  for (let i = 0; i < 6; i++) {
    const villa = new THREE.Mesh(
      new THREE.BoxGeometry(8, 6 + Math.random() * 4, 8),
      new THREE.MeshStandardMaterial({ color: 0xe8c798, roughness: .85 })
    )
    const angle = Math.random() * Math.PI * 2
    villa.position.set(Math.cos(angle) * (35 + Math.random()*20), 3, Math.sin(angle) * (35 + Math.random()*20))
    villa.castShadow = villa.receiveShadow = true
    // Roof
    const vroof = new THREE.Mesh(
      new THREE.ConeGeometry(6, 3, 4),
      new THREE.MeshStandardMaterial({ color: 0x8a3b28, roughness: .7 })
    )
    vroof.position.y = 4.5; vroof.rotation.y = Math.PI / 4; villa.add(vroof)
    scene.add(villa)
  }

  // Cypress trees
  for (let i = 0; i < 14; i++) {
    const t = makeTree({ trunkColor: 0x4a3020, leafColor: 0x2d5a30, scale: 2 + Math.random()*0.5 })
    const angle = Math.random() * Math.PI * 2
    t.position.set(Math.cos(angle) * (28 + Math.random()*40), 0, Math.sin(angle) * (28 + Math.random()*40))
    scene.add(t)
  }

  // Dust particles
  const dust = addParticles(scene, { count: 160, color: 0xffe0a0, size: .18, area: 120, gravity: -0.005, drift: 0.02 })

  const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 600)
  camera.position.set(0, 2.4, 22)
  camera.lookAt(0, 5, -30)

  return {
    scene, camera,
    update(dt, t) { animateParticles(dust, t) },
  }
}

// ----- 2. Neo Tokyo 2150 -----
function buildTokyo2150() {
  const scene = new THREE.Scene()
  scene.background = makeGradientSky('#0a0028', '#1a005a')
  scene.fog = new THREE.FogExp2(0x07042a, 0.012)

  // Wet street
  const ground = addGroundPlane(scene, makeGroundTexture('#121238', '#080820', 512, 'wet'), 500, 30)
  ground.material.metalness = .35; ground.material.roughness = .3

  // Ambient city lighting
  addHemi(scene, 0x5a00ff, 0x000010, 0.35)
  const key = new THREE.DirectionalLight(0x88aaff, 0.4); key.position.set(30, 80, 30); scene.add(key)

  // Point lights (neon)
  const neonColors = [0xff2680, 0x00e6ff, 0xa864ff, 0xffbe00, 0x00ffaa]
  for (let i = 0; i < 10; i++) {
    const c = neonColors[i % neonColors.length]
    const pl = new THREE.PointLight(c, 1.2, 40, 1.8)
    pl.position.set((Math.random()-.5)*80, 4 + Math.random()*10, (Math.random()-.5)*80)
    scene.add(pl)
  }

  // Buildings
  const bld = new THREE.Group()
  for (let i = 0; i < 40; i++) {
    const w = 4 + Math.random() * 6, h = 18 + Math.random() * 36, d = 4 + Math.random() * 6
    const color = [0x1a1a28, 0x202034, 0x10102a, 0x181830][Math.floor(Math.random()*4)]
    const winCol = [0xff4488, 0x00d4ff, 0xffcc66, 0xa864ff, 0x44ff88][Math.floor(Math.random()*5)]
    const b = makeBuilding({ w, h, d, color, windowColor: winCol })
    let x, z, safe = false, tries = 0
    while (!safe && tries < 20) {
      x = (Math.random()-.5) * 150; z = (Math.random()-.5) * 150
      if (Math.abs(x) > 10 || Math.abs(z) > 10) safe = true
      tries++
    }
    b.position.set(x, 0, z); bld.add(b)
    // Rooftop antenna
    if (Math.random() > .5) {
      const antenna = new THREE.Mesh(
        new THREE.CylinderGeometry(.1, .1, 4 + Math.random()*3, 6),
        new THREE.MeshStandardMaterial({ color: 0x222, emissive: winCol, emissiveIntensity: .3 })
      )
      antenna.position.set(x, h + 2, z); bld.add(antenna)
    }
  }
  scene.add(bld)

  // Neon signs (planes with emissive textures)
  for (let i = 0; i < 6; i++) {
    const c = document.createElement('canvas'); c.width = 256; c.height = 64
    const ctx = c.getContext('2d')
    const hue = Math.floor(Math.random() * 360)
    ctx.fillStyle = `hsl(${hue}, 90%, 55%)`; ctx.fillRect(0, 0, 256, 64)
    ctx.fillStyle = '#000'; ctx.font = 'bold 48px monospace'
    ctx.textAlign = 'center'; ctx.fillText(['東京2150','NEO','2150','未来','WARP','DREAM'][i], 128, 48)
    const tex = new THREE.CanvasTexture(c)
    const sign = new THREE.Mesh(
      new THREE.PlaneGeometry(8, 2),
      new THREE.MeshBasicMaterial({ map: tex, transparent: true })
    )
    sign.position.set((Math.random()-.5)*60, 8 + Math.random()*18, (Math.random()-.5)*60)
    sign.rotation.y = Math.random() * Math.PI * 2
    scene.add(sign)
  }

  // Flying vehicles
  const flyers = []
  for (let i = 0; i < 10; i++) {
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(2, .4, 1),
      new THREE.MeshStandardMaterial({ color: 0x555, emissive: 0xff6688, emissiveIntensity: .8 })
    )
    body.position.set((Math.random()-.5)*80, 14 + Math.random()*20, (Math.random()-.5)*80)
    scene.add(body)
    flyers.push({ mesh: body, speed: .1 + Math.random()*.2, radius: 40 + Math.random()*30, offset: Math.random()*Math.PI*2, height: body.position.y })
  }

  // Starfield (low)
  addStarfield(scene, 400, 240)

  const camera = new THREE.PerspectiveCamera(65, 1, 0.1, 600)
  camera.position.set(0, 2, 18)
  camera.lookAt(0, 10, 0)

  return {
    scene, camera,
    update(dt, t) {
      flyers.forEach((f, i) => {
        f.mesh.position.x = Math.cos(t * f.speed + f.offset) * f.radius
        f.mesh.position.z = Math.sin(t * f.speed + f.offset) * f.radius
        f.mesh.rotation.y = -t * f.speed + Math.PI/2
      })
    },
  }
}

// ----- 3. Edo -----
function buildEdo() {
  const scene = new THREE.Scene()
  scene.background = makeGradientSky('#e8b6a3', '#f2d2ba')
  scene.fog = new THREE.Fog(0xeec8a4, 40, 220)

  addGroundPlane(scene, makeGroundTexture('#6a5030', '#4a3820', 512, 'stone'), 400, 60)

  addSun(scene, [60, 100, 40], 0xffd099, 1.2)
  addHemi(scene, 0xffccb0, 0x553322, 0.5)

  // Torii gate
  const torii = new THREE.Group()
  const pillar1 = new THREE.Mesh(
    new THREE.CylinderGeometry(.8, .8, 14, 12),
    new THREE.MeshStandardMaterial({ color: 0xc44a28, roughness: .7 })
  )
  pillar1.position.set(-6, 7, -20); torii.add(pillar1)
  const pillar2 = pillar1.clone(); pillar2.position.x = 6; torii.add(pillar2)
  const beam = new THREE.Mesh(
    new THREE.BoxGeometry(18, 1.4, 1.4),
    new THREE.MeshStandardMaterial({ color: 0xc44a28, roughness: .7 })
  )
  beam.position.set(0, 13, -20); torii.add(beam)
  const beamTop = new THREE.Mesh(
    new THREE.BoxGeometry(20, 1.8, 2),
    new THREE.MeshStandardMaterial({ color: 0x2a1512, roughness: .8 })
  )
  beamTop.position.set(0, 14.5, -20); torii.add(beamTop)
  scene.add(torii)

  // Traditional houses (wooden)
  for (let i = 0; i < 16; i++) {
    const house = new THREE.Group()
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(6, 4, 8),
      new THREE.MeshStandardMaterial({ color: 0x8a6540, roughness: .9 })
    )
    body.position.y = 2; body.castShadow = body.receiveShadow = true; house.add(body)
    // Roof (pyramid-ish)
    const roof = new THREE.Mesh(
      new THREE.ConeGeometry(5.5, 2.5, 4),
      new THREE.MeshStandardMaterial({ color: 0x2c1f18, roughness: .8 })
    )
    roof.position.y = 5.25; roof.rotation.y = Math.PI/4; house.add(roof)
    const angle = Math.random() * Math.PI * 2
    house.position.set(Math.cos(angle) * (18 + Math.random()*30), 0, Math.sin(angle) * (18 + Math.random()*30))
    house.rotation.y = Math.random() * Math.PI * 2
    scene.add(house)
  }

  // Sakura trees (cherry blossom)
  for (let i = 0; i < 14; i++) {
    const t = new THREE.Group()
    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(.25, .3, 2.4, 8),
      new THREE.MeshStandardMaterial({ color: 0x4a2815, roughness: .95 })
    )
    trunk.position.y = 1.2; trunk.castShadow = true; t.add(trunk)
    const foliage = new THREE.Mesh(
      new THREE.SphereGeometry(1.6, 12, 10),
      new THREE.MeshStandardMaterial({ color: 0xffb5ce, roughness: .8 })
    )
    foliage.position.y = 3.4; foliage.scale.y = .8; foliage.castShadow = true; t.add(foliage)
    const angle = Math.random() * Math.PI * 2
    t.position.set(Math.cos(angle) * (14 + Math.random()*35), 0, Math.sin(angle) * (14 + Math.random()*35))
    scene.add(t)
  }

  // Stone lanterns on path
  for (let i = 0; i < 8; i++) {
    const lantern = new THREE.Group()
    const base = new THREE.Mesh(new THREE.CylinderGeometry(.4, .5, .6, 6), new THREE.MeshStandardMaterial({ color: 0x555, roughness: .95 }))
    base.position.y = .3; lantern.add(base)
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(.15, .15, 1.2, 6), new THREE.MeshStandardMaterial({ color: 0x555, roughness: .95 }))
    stem.position.y = 1.2; lantern.add(stem)
    const head = new THREE.Mesh(new THREE.BoxGeometry(.8, .8, .8), new THREE.MeshStandardMaterial({ color: 0x444, emissive: 0xffaa55, emissiveIntensity: .6 }))
    head.position.y = 2.2; lantern.add(head)
    lantern.position.set(-6, 0, -14 + i * -2)
    scene.add(lantern)
    const lantern2 = lantern.clone(); lantern2.position.x = 6; scene.add(lantern2)
  }

  // Sakura petals
  const petals = addParticles(scene, { count: 300, color: 0xffcfdc, size: .18, area: 100, gravity: -.04, drift: .1 })

  const camera = new THREE.PerspectiveCamera(62, 1, 0.1, 500)
  camera.position.set(0, 1.8, 14)
  camera.lookAt(0, 7, -20)

  return {
    scene, camera,
    update(dt, t) { animateParticles(petals, t) },
  }
}

// ----- 4. NYC 1924 -----
function buildNYC1924() {
  const scene = new THREE.Scene()
  scene.background = makeGradientSky('#0e0e1e', '#2a2a3a')
  scene.fog = new THREE.FogExp2(0x14141f, 0.018)

  const ground = addGroundPlane(scene, makeGroundTexture('#1a1a24', '#0a0a14', 512, 'wet'), 400, 40)
  ground.material.metalness = .3; ground.material.roughness = .35

  addHemi(scene, 0x554466, 0x110811, 0.35)
  const moonLight = new THREE.DirectionalLight(0xaacccc, 0.5); moonLight.position.set(-40, 80, 30); scene.add(moonLight)

  // Street lamps
  for (let i = 0; i < 10; i++) {
    const lamp = new THREE.Group()
    const post = new THREE.Mesh(new THREE.CylinderGeometry(.15, .2, 7, 8), new THREE.MeshStandardMaterial({ color: 0x222, roughness: .7 }))
    post.position.y = 3.5; lamp.add(post)
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(.4, 10, 10), new THREE.MeshStandardMaterial({ color: 0xffd48c, emissive: 0xffcc88, emissiveIntensity: 1.4 }))
    bulb.position.y = 7.2; lamp.add(bulb)
    const pl = new THREE.PointLight(0xffcc88, 1.2, 18, 1.4); pl.position.y = 7.2; lamp.add(pl)
    lamp.position.set(i % 2 === 0 ? -10 : 10, 0, -30 + i * 8)
    scene.add(lamp)
  }

  // Skyscrapers
  for (let i = 0; i < 30; i++) {
    const w = 6 + Math.random() * 8, h = 20 + Math.random() * 40, d = 6 + Math.random() * 8
    const b = makeBuilding({ w, h, d, color: 0x3a342c, windowColor: 0xffcc66 })
    let x, z
    do { x = (Math.random()-.5) * 160; z = (Math.random()-.5) * 160 } while (Math.abs(x) < 14 && Math.abs(z) < 14)
    b.position.set(x, 0, z)
    scene.add(b)
  }

  // Rain particles
  const rain = addParticles(scene, { count: 800, color: 0xaaccff, size: .08, area: 80, gravity: -.45, drift: 0 })
  rain.material.opacity = .4

  const camera = new THREE.PerspectiveCamera(62, 1, 0.1, 500)
  camera.position.set(0, 1.7, 15)
  camera.lookAt(0, 6, -10)

  return {
    scene, camera,
    update(dt, t) { animateParticles(rain, t) },
  }
}

// ----- 5. Egypt -----
function buildEgypt() {
  const scene = new THREE.Scene()
  scene.background = makeGradientSky('#f9cf7a', '#ffb74a')
  scene.fog = new THREE.Fog(0xe8ba5a, 60, 300)

  addGroundPlane(scene, makeGroundTexture('#e7c070', '#c0903a', 512, 'sand'), 500, 70)

  addSun(scene, [80, 140, 20], 0xffe8b0, 1.5)
  addHemi(scene, 0xffd070, 0x6a4820, 0.6)

  // Pyramid
  const pyramidMat = new THREE.MeshStandardMaterial({ color: 0xd4a868, roughness: .9, flatShading: true })
  const pyramid = new THREE.Mesh(new THREE.ConeGeometry(30, 34, 4), pyramidMat)
  pyramid.position.set(0, 17, -60); pyramid.rotation.y = Math.PI / 4
  pyramid.castShadow = true; scene.add(pyramid)

  // Small pyramid
  const pyr2 = new THREE.Mesh(new THREE.ConeGeometry(16, 20, 4), pyramidMat)
  pyr2.position.set(-38, 10, -70); pyr2.rotation.y = Math.PI / 4; pyr2.castShadow = true; scene.add(pyr2)
  const pyr3 = new THREE.Mesh(new THREE.ConeGeometry(12, 14, 4), pyramidMat)
  pyr3.position.set(28, 7, -78); pyr3.rotation.y = Math.PI / 4; pyr3.castShadow = true; scene.add(pyr3)

  // Obelisks
  for (let i = 0; i < 4; i++) {
    const ob = new THREE.Group()
    const shaft = new THREE.Mesh(
      new THREE.CylinderGeometry(.3, 1.2, 20, 4),
      new THREE.MeshStandardMaterial({ color: 0xd8b076, roughness: .7 })
    )
    shaft.position.y = 10; shaft.castShadow = true; ob.add(shaft)
    const tip = new THREE.Mesh(new THREE.ConeGeometry(1.2, 2.4, 4), new THREE.MeshStandardMaterial({ color: 0xffcf6b, roughness: .3, metalness: .4 }))
    tip.position.y = 21.2; ob.add(tip)
    ob.position.set(-24 + i * 16, 0, -10)
    scene.add(ob)
  }

  // Sphinx (stylized — large block with a smaller block head)
  const sphinx = new THREE.Group()
  const body = new THREE.Mesh(new THREE.BoxGeometry(6, 4, 18), new THREE.MeshStandardMaterial({ color: 0xc99656, roughness: .9 }))
  body.position.y = 2; sphinx.add(body)
  const head = new THREE.Mesh(new THREE.BoxGeometry(5, 5, 5), new THREE.MeshStandardMaterial({ color: 0xc99656, roughness: .9 }))
  head.position.set(0, 5.5, -8); sphinx.add(head)
  const hat = new THREE.Mesh(new THREE.ConeGeometry(3.2, 2.5, 4), new THREE.MeshStandardMaterial({ color: 0xd4a040, roughness: .6 }))
  hat.position.set(0, 8.4, -8); sphinx.add(hat)
  sphinx.position.set(28, 0, -20); sphinx.rotation.y = -0.4
  sphinx.children.forEach(m => m.castShadow = true)
  scene.add(sphinx)

  // Palms
  for (let i = 0; i < 10; i++) {
    const palm = new THREE.Group()
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(.18, .25, 4 + Math.random()*1.4, 8), new THREE.MeshStandardMaterial({ color: 0x4e3418 }))
    trunk.position.y = 2.2; trunk.castShadow = true; palm.add(trunk)
    for (let j = 0; j < 6; j++) {
      const frond = new THREE.Mesh(new THREE.ConeGeometry(.25, 2.6, 5), new THREE.MeshStandardMaterial({ color: 0x6c8f3a, side: THREE.DoubleSide, flatShading: true }))
      frond.position.y = 4.4
      frond.rotation.z = Math.PI/2.5 + (Math.random()-.5)*.3
      frond.rotation.y = (j / 6) * Math.PI * 2
      palm.add(frond)
    }
    const angle = Math.random() * Math.PI * 2
    palm.position.set(Math.cos(angle) * (15 + Math.random()*25), 0, Math.sin(angle) * (15 + Math.random()*25))
    scene.add(palm)
  }

  // Sand particles
  const sand = addParticles(scene, { count: 240, color: 0xffe2a0, size: .16, area: 140, gravity: -.01, drift: .2 })

  const camera = new THREE.PerspectiveCamera(62, 1, 0.1, 600)
  camera.position.set(0, 2, 22)
  camera.lookAt(0, 14, -60)

  return {
    scene, camera,
    update(dt, t) { animateParticles(sand, t) },
  }
}

// ----- 6. Medieval -----
function buildMedieval() {
  const scene = new THREE.Scene()
  scene.background = makeGradientSky('#7fa8c8', '#bcd5e8')
  scene.fog = new THREE.Fog(0x9fbbd5, 60, 300)

  addGroundPlane(scene, makeGroundTexture('#4a6c30', '#355020', 512, 'grass'), 500, 90)

  addSun(scene, [60, 120, 40], 0xfff4c8, 1.3)
  addHemi(scene, 0xaac8e0, 0x3a5022, 0.5)

  // Castle
  const castle = new THREE.Group()
  const keep = new THREE.Mesh(
    new THREE.CylinderGeometry(6, 7, 22, 10),
    new THREE.MeshStandardMaterial({ color: 0x8a8a90, roughness: .9 })
  )
  keep.position.set(0, 11, -40); keep.castShadow = true; castle.add(keep)
  const keepRoof = new THREE.Mesh(new THREE.ConeGeometry(6.4, 6, 10), new THREE.MeshStandardMaterial({ color: 0x5a2020, roughness: .7 }))
  keepRoof.position.set(0, 25, -40); castle.add(keepRoof)

  // Four corner towers
  const towerPositions = [[-14, -40], [14, -40], [-14, -20], [14, -20]]
  towerPositions.forEach(([x, z]) => {
    const tower = new THREE.Mesh(
      new THREE.CylinderGeometry(2.2, 2.6, 14, 8),
      new THREE.MeshStandardMaterial({ color: 0x90908a, roughness: .9 })
    )
    tower.position.set(x, 7, z); tower.castShadow = true; castle.add(tower)
    const troof = new THREE.Mesh(new THREE.ConeGeometry(2.6, 3, 8), new THREE.MeshStandardMaterial({ color: 0x5a2020 }))
    troof.position.set(x, 15.5, z); castle.add(troof)
  })

  // Walls
  const wallFront = new THREE.Mesh(new THREE.BoxGeometry(30, 6, 1.5), new THREE.MeshStandardMaterial({ color: 0x88887e, roughness: .9 }))
  wallFront.position.set(0, 3, -20); wallFront.castShadow = true; castle.add(wallFront)
  const wallL = wallFront.clone(); wallL.scale.x = 20/30; wallL.position.set(-14, 3, -30); wallL.rotation.y = Math.PI/2; castle.add(wallL)
  const wallR = wallL.clone(); wallR.position.set(14, 3, -30); castle.add(wallR)
  scene.add(castle)

  // Village houses (cottages)
  for (let i = 0; i < 16; i++) {
    const house = new THREE.Group()
    const body = new THREE.Mesh(new THREE.BoxGeometry(4, 3, 5), new THREE.MeshStandardMaterial({ color: 0xd0c090, roughness: .95 }))
    body.position.y = 1.5; body.castShadow = true; house.add(body)
    const roof = new THREE.Mesh(new THREE.ConeGeometry(3.6, 2, 4), new THREE.MeshStandardMaterial({ color: 0x6a3828, roughness: .8 }))
    roof.position.y = 4; roof.rotation.y = Math.PI / 4; house.add(roof)
    const angle = Math.random() * Math.PI * 2
    house.position.set(Math.cos(angle) * (18 + Math.random()*24), 0, Math.sin(angle) * (18 + Math.random()*24))
    house.rotation.y = Math.random() * Math.PI * 2
    scene.add(house)
  }

  // Trees
  for (let i = 0; i < 24; i++) {
    const tr = makeTree({ trunkColor: 0x3a220f, leafColor: 0x2f5a28, scale: 1.8 + Math.random()*.8 })
    const angle = Math.random() * Math.PI * 2
    tr.position.set(Math.cos(angle) * (32 + Math.random()*40), 0, Math.sin(angle) * (32 + Math.random()*40))
    scene.add(tr)
  }

  // Clouds
  const clouds = []
  for (let i = 0; i < 12; i++) {
    const cloud = new THREE.Mesh(
      new THREE.SphereGeometry(4 + Math.random()*3, 8, 6),
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1, transparent: true, opacity: .9 })
    )
    cloud.position.set((Math.random()-.5)*200, 40 + Math.random()*20, (Math.random()-.5)*200)
    cloud.scale.set(1 + Math.random()*1.5, .5, 1 + Math.random()*1.5)
    scene.add(cloud)
    clouds.push({ mesh: cloud, speed: .05 + Math.random()*.1 })
  }

  const camera = new THREE.PerspectiveCamera(62, 1, 0.1, 600)
  camera.position.set(0, 2.2, 22)
  camera.lookAt(0, 14, -40)

  return {
    scene, camera,
    update(dt, t) {
      clouds.forEach(c => {
        c.mesh.position.x += c.speed * 0.1
        if (c.mesh.position.x > 120) c.mesh.position.x = -120
      })
    },
  }
}

// ----- 7. Mars 2200 -----
function buildMars() {
  const scene = new THREE.Scene()
  scene.background = makeGradientSky('#7a2820', '#c8603a')
  scene.fog = new THREE.FogExp2(0xa04828, 0.008)

  addGroundPlane(scene, makeGroundTexture('#a04a2a', '#6e2a18', 512, 'mars'), 500, 60)

  addSun(scene, [90, 90, 40], 0xffa070, 1.0)
  addHemi(scene, 0xff7050, 0x2a0808, 0.4)

  // Domes (glass habitats)
  for (let i = 0; i < 7; i++) {
    const dome = new THREE.Mesh(
      new THREE.SphereGeometry(6 + Math.random()*3, 24, 16, 0, Math.PI*2, 0, Math.PI/2),
      new THREE.MeshPhysicalMaterial({
        color: 0x88ddff, transmission: .75, transparent: true, opacity: .45,
        roughness: .05, metalness: 0, thickness: 1, ior: 1.4,
        side: THREE.DoubleSide, emissive: 0x4488ff, emissiveIntensity: .05,
      })
    )
    const angle = Math.random() * Math.PI * 2
    dome.position.set(Math.cos(angle) * (18 + Math.random()*30), 0, Math.sin(angle) * (18 + Math.random()*30))
    scene.add(dome)
    // Base ring
    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(dome.geometry.parameters.radius, dome.geometry.parameters.radius, .6, 24),
      new THREE.MeshStandardMaterial({ color: 0x888, roughness: .6, metalness: .5 })
    )
    base.position.copy(dome.position); base.position.y = .3
    scene.add(base)
    // Inner light
    const pl = new THREE.PointLight(0x88ccff, .6, 20); pl.position.copy(dome.position); pl.position.y = 3; scene.add(pl)
  }

  // Tall tower
  const tower = new THREE.Mesh(
    new THREE.CylinderGeometry(1.2, 2, 30, 8),
    new THREE.MeshStandardMaterial({ color: 0xdddddd, metalness: .5, roughness: .4 })
  )
  tower.position.set(0, 15, -40); tower.castShadow = true; scene.add(tower)
  const beacon = new THREE.Mesh(
    new THREE.SphereGeometry(1.2, 12, 10),
    new THREE.MeshStandardMaterial({ color: 0x222, emissive: 0xff2244, emissiveIntensity: 2 })
  )
  beacon.position.set(0, 31, -40); scene.add(beacon)

  // Rocks
  for (let i = 0; i < 30; i++) {
    const rock = new THREE.Mesh(
      new THREE.DodecahedronGeometry(.6 + Math.random() * 1.8, 0),
      new THREE.MeshStandardMaterial({ color: 0x5a1a0e, roughness: 1, flatShading: true })
    )
    rock.position.set((Math.random()-.5)*150, 0, (Math.random()-.5)*150)
    rock.rotation.set(Math.random()*3, Math.random()*3, Math.random()*3)
    rock.castShadow = true
    scene.add(rock)
  }

  // Two moons
  const moon1 = new THREE.Mesh(new THREE.SphereGeometry(3, 16, 12), new THREE.MeshStandardMaterial({ color: 0xc88858, emissive: 0x442211, emissiveIntensity: .2 }))
  moon1.position.set(-80, 100, -120); scene.add(moon1)
  const moon2 = new THREE.Mesh(new THREE.SphereGeometry(1.6, 16, 12), new THREE.MeshStandardMaterial({ color: 0x888, emissive: 0x222211, emissiveIntensity: .15 }))
  moon2.position.set(50, 80, -150); scene.add(moon2)

  // Earth far in the sky
  const earth = new THREE.Mesh(
    new THREE.SphereGeometry(2.2, 24, 18),
    new THREE.MeshStandardMaterial({ color: 0x3a86ff, emissive: 0x1a4abb, emissiveIntensity: .4 })
  )
  earth.position.set(-40, 120, 90); scene.add(earth)

  // Dust
  const dust = addParticles(scene, { count: 300, color: 0xff9060, size: .18, area: 160, gravity: -.008, drift: .3 })

  // Stars (faint)
  addStarfield(scene, 200, 300)

  const camera = new THREE.PerspectiveCamera(62, 1, 0.1, 700)
  camera.position.set(0, 2.2, 20)
  camera.lookAt(0, 15, -40)

  return {
    scene, camera,
    update(dt, t) {
      animateParticles(dust, t)
      beacon.material.emissiveIntensity = 1.6 + Math.sin(t * 3) * 0.6
    },
  }
}

// ----- 8. Atlantis -----
function buildAtlantis() {
  const scene = new THREE.Scene()
  scene.background = makeGradientSky('#003b55', '#001220')
  scene.fog = new THREE.FogExp2(0x002a40, 0.025)

  addGroundPlane(scene, makeGroundTexture('#0a3b50', '#031520', 512, 'seafloor'), 400, 60)

  addHemi(scene, 0x88e0ff, 0x003040, 0.55)
  const caustics = new THREE.DirectionalLight(0x88ddff, 0.8); caustics.position.set(20, 100, 10); scene.add(caustics)

  // Central palace (octagonal tower)
  const palace = new THREE.Group()
  const tower = new THREE.Mesh(
    new THREE.CylinderGeometry(5, 6, 22, 8),
    new THREE.MeshStandardMaterial({ color: 0x22aabb, roughness: .4, metalness: .5, emissive: 0x114d5f, emissiveIntensity: .3 })
  )
  tower.position.y = 11; palace.add(tower)
  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(5, 20, 14, 0, Math.PI*2, 0, Math.PI/2),
    new THREE.MeshStandardMaterial({ color: 0xccf5ff, metalness: .7, roughness: .2, emissive: 0x66ccff, emissiveIntensity: .3 })
  )
  dome.position.y = 22; palace.add(dome)
  palace.position.set(0, 0, -40); scene.add(palace)

  // Surrounding columns
  for (let i = 0; i < 10; i++) {
    const angle = (i / 10) * Math.PI * 2
    const col = makeColumn({ height: 10, radius: .7, color: 0xaaeedd })
    col.position.set(Math.cos(angle) * 16, 0, -40 + Math.sin(angle) * 16)
    scene.add(col)
  }

  // Coral / seaweed (kelp)
  for (let i = 0; i < 40; i++) {
    const color = [0x33bbaa, 0x22aa55, 0xff6688, 0x5577ff][Math.floor(Math.random()*4)]
    const kelp = new THREE.Mesh(
      new THREE.CylinderGeometry(.1, .15, 4 + Math.random() * 3, 6),
      new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: .25 })
    )
    kelp.position.set((Math.random()-.5)*120, 2, (Math.random()-.5)*120)
    kelp.rotation.x = (Math.random()-.5) * 0.3; kelp.rotation.z = (Math.random()-.5) * 0.3
    scene.add(kelp)
  }

  // Ruined temples
  for (let i = 0; i < 4; i++) {
    const ruin = new THREE.Group()
    for (let j = 0; j < 4; j++) {
      const col = makeColumn({ height: 4 + Math.random() * 3, radius: .5, color: 0x9ec8c8 })
      col.position.set(-3 + j*2, 0, 0)
      ruin.add(col)
    }
    const angle = (i/4) * Math.PI * 2 + Math.PI/6
    ruin.position.set(Math.cos(angle) * 35, 0, -40 + Math.sin(angle) * 35)
    ruin.rotation.y = -angle
    scene.add(ruin)
  }

  // Bubbles
  const bubbles = addParticles(scene, { count: 220, color: 0xccf5ff, size: .22, area: 120, gravity: .14, drift: .05 })
  bubbles.material.opacity = .55

  // Glowing jellyfish (emissive spheres)
  const fish = []
  for (let i = 0; i < 14; i++) {
    const col = [0xff66cc, 0x88ccff, 0xffcc66, 0x99ff88][Math.floor(Math.random()*4)]
    const body = new THREE.Mesh(
      new THREE.SphereGeometry(.5, 12, 10),
      new THREE.MeshStandardMaterial({ color: 0x000, emissive: col, emissiveIntensity: 1.4, transparent: true, opacity: .8 })
    )
    body.position.set((Math.random()-.5)*80, 5 + Math.random()*12, (Math.random()-.5)*80 - 10)
    scene.add(body)
    fish.push({ mesh: body, offset: Math.random() * Math.PI * 2, speed: .5 + Math.random() * .8 })
  }

  const camera = new THREE.PerspectiveCamera(65, 1, 0.1, 400)
  camera.position.set(0, 4, 22)
  camera.lookAt(0, 10, -40)

  return {
    scene, camera,
    update(dt, t) {
      animateParticles(bubbles, t)
      fish.forEach((f, i) => {
        f.mesh.position.y += Math.sin(t * f.speed + f.offset) * 0.015
        f.mesh.position.x += Math.cos(t * f.speed * .5 + f.offset) * 0.01
      })
    },
  }
}

/* ------------------------------------------------------------
 * Exports
 * ------------------------------------------------------------ */
export const SCENE_BUILDERS = {
  rome: buildRome,
  tokyo2150: buildTokyo2150,
  edo: buildEdo,
  nyc1924: buildNYC1924,
  egypt: buildEgypt,
  medieval: buildMedieval,
  mars2200: buildMars,
  atlantis: buildAtlantis,
}
