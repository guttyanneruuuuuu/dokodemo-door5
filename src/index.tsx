import { Hono } from 'hono'
import { cors } from 'hono/cors'

const app = new Hono()
app.use('/api/*', cors())

// ============================================================
// Worlds metadata (mirrors static/worlds.js for server-side API)
// ============================================================
const WORLDS_META = [
  { id: 'rome',         emoji: '🏛', name: '古代ローマ',       eraLabel: '紀元117年',     place: 'ROME · ITALIA',     palette: ['#fab062','#ffe7c2','#7baee6'] },
  { id: 'edo',          emoji: '⛩', name: '江戸 · 日本橋',      eraLabel: '江戸 · 1750年', place: 'EDO · JAPAN',       palette: ['#ff9970','#ffc99f','#39456e'] },
  { id: 'egypt',        emoji: '🏺', name: '古代エジプト',     eraLabel: '紀元前2560年', place: 'GIZA · EGYPT',      palette: ['#ffcf7a','#ffe8b0','#87a6d0'] },
  { id: 'medieval',     emoji: '🏰', name: '中世ヨーロッパ',   eraLabel: '1350年',       place: 'BAVARIA · EUROPE',  palette: ['#6b7d9a','#a8b5c4','#3a4255'] },
  { id: 'nyc1924',      emoji: '🎷', name: '1920年代 NY',       eraLabel: '1924年',       place: 'NEW YORK · USA',    palette: ['#e5a87a','#ffd2a8','#6d83a6'] },
  { id: 'tokyo2150',    emoji: '🌃', name: '未来の東京',       eraLabel: '2150年',       place: 'NEO TOKYO · JAPAN', palette: ['#a86bff','#ff4dcf','#04050f'] },
  { id: 'mars2200',     emoji: '🪐', name: '火星コロニー',     eraLabel: '2200年',       place: 'OLYMPUS · MARS',    palette: ['#b04830','#d47040','#301418'] },
  { id: 'atlantis',     emoji: '🌊', name: 'アトランティス',   eraLabel: '神話',         place: 'LOST CITY',          palette: ['#0b4060','#1a7090','#041422'] },
  { id: 'ancient-china',emoji: '🏯', name: '唐の長安',         eraLabel: '唐 · 750年',   place: "CHANG'AN · CHINA",   palette: ['#d46040','#ffb880','#2a2040'] },
  { id: 'venice-1600',  emoji: '🛶', name: 'ヴェネツィア',     eraLabel: '1600年',       place: 'VENEZIA · ITALY',    palette: ['#c0d0e5','#ffe0c0','#6a7ba0'] },
  { id: 'space-station',emoji: '🛰', name: '軌道ステーション', eraLabel: '2450年',       place: 'ORBITAL EPSILON',    palette: ['#000008','#8aa0ff','#1a2030'] },
]

// ============================================================
// API: beautifully stylized SVG cover for each world card
// ============================================================
function coverSVG(w: typeof WORLDS_META[number]) {
  const [c1, c2, c3] = w.palette
  // Layered silhouette landscape with era-specific glyph
  const stars = Array.from({length: 40}).map(() => {
    const x = Math.random()*600, y = Math.random()*400*0.6, r = Math.random()*1.4 + 0.2
    return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(1)}" fill="#fff" opacity="${(Math.random()*0.7+0.15).toFixed(2)}"/>`
  }).join('')

  // Unique skyline/landscape per world
  const scenes: Record<string, string> = {
    rome: `
      <g opacity="0.85">
        <!-- Colosseum -->
        <ellipse cx="300" cy="380" rx="180" ry="60" fill="${c3}" opacity="0.6"/>
        <path d="M 140 380 Q 140 260 300 260 Q 460 260 460 380 Z" fill="#2a1a1a"/>
        <g fill="#1a0f0f">
          ${Array.from({length:7}).map((_,i)=>`<rect x="${170+i*40}" y="295" width="16" height="30" rx="2"/>`).join('')}
          ${Array.from({length:6}).map((_,i)=>`<rect x="${185+i*40}" y="335" width="16" height="30" rx="2"/>`).join('')}
        </g>
      </g>
      <!-- Pine tree silhouette -->
      <g fill="#1c1010" opacity="0.9">
        <rect x="60" y="310" width="6" height="70"/>
        <ellipse cx="63" cy="305" rx="30" ry="40"/>
      </g>
    `,
    edo: `
      <!-- Fuji mountain -->
      <path d="M -50 380 L 200 180 L 250 210 L 330 150 L 420 220 L 650 380 Z" fill="#2a1f2e" opacity="0.9"/>
      <path d="M 210 192 L 250 210 L 270 195 L 255 185 Z" fill="#fff" opacity="0.85"/>
      <!-- Torii -->
      <g fill="#3a1010" opacity="0.95">
        <rect x="100" y="280" width="6" height="100"/>
        <rect x="180" y="280" width="6" height="100"/>
        <rect x="90" y="268" width="106" height="8"/>
        <rect x="85" y="256" width="116" height="10"/>
      </g>
      <!-- sakura -->
      ${Array.from({length:18}).map(()=>{
        const x=Math.random()*600, y=Math.random()*380, s=Math.random()*3+1.2
        return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${s.toFixed(1)}" fill="#ffd0e0" opacity="0.7"/>`
      }).join('')}
    `,
    egypt: `
      <!-- Pyramids -->
      <path d="M 100 380 L 260 180 L 420 380 Z" fill="#3a2a18" opacity="0.9"/>
      <path d="M 260 180 L 320 225 L 420 380 Z" fill="#281a10" opacity="0.9"/>
      <path d="M 360 380 L 470 250 L 580 380 Z" fill="#3a2a18" opacity="0.85"/>
      <path d="M 470 250 L 520 285 L 580 380 Z" fill="#281a10" opacity="0.85"/>
      <!-- palm tree -->
      <g fill="#1e1208">
        <rect x="46" y="295" width="5" height="85"/>
        <path d="M 48 295 Q 30 275 10 282 Q 25 275 48 290"/>
        <path d="M 48 295 Q 66 275 86 282 Q 70 275 48 290"/>
        <path d="M 48 295 Q 30 280 14 262 Q 28 275 48 293"/>
      </g>
      <circle cx="480" cy="110" r="34" fill="#ffce80" opacity="0.8"/>
    `,
    medieval: `
      <!-- Castle on hill -->
      <path d="M -20 380 Q 200 320 310 320 Q 500 320 620 380 Z" fill="#1a2018" opacity="0.95"/>
      <g fill="#0f1210">
        <rect x="260" y="220" width="20" height="100"/>
        <rect x="285" y="195" width="28" height="125"/>
        <rect x="318" y="220" width="20" height="100"/>
        <polygon points="260,220 270,205 280,220"/>
        <polygon points="285,195 299,175 313,195"/>
        <polygon points="318,220 328,205 338,220"/>
        <rect x="294" y="260" width="8" height="14" fill="#ffd880"/>
      </g>
      <!-- Pine trees -->
      ${Array.from({length:6}).map((_,i)=>`
        <g fill="#0f1712" opacity="0.9" transform="translate(${40+i*90}, ${290+Math.random()*30})">
          <rect x="-2" y="30" width="4" height="24"/>
          <polygon points="0,0 14,30 -14,30"/>
          <polygon points="0,10 12,35 -12,35"/>
        </g>
      `).join('')}
    `,
    nyc1924: `
      <!-- Art deco skyline -->
      <g fill="#0f0a08" opacity="0.95">
        <rect x="20" y="220" width="60" height="160"/>
        <rect x="85" y="180" width="80" height="200"/>
        <polygon points="125,180 125,150 140,130 155,150 155,180"/>
        <rect x="170" y="200" width="50" height="180"/>
        <rect x="225" y="160" width="70" height="220"/>
        <polygon points="260,160 260,120 265,110 270,120 270,160"/>
        <rect x="300" y="190" width="60" height="190"/>
        <rect x="365" y="170" width="90" height="210"/>
        <polygon points="410,170 410,140 425,115 440,140 440,170"/>
        <rect x="460" y="210" width="60" height="170"/>
        <rect x="525" y="190" width="70" height="190"/>
        <!-- lit windows -->
        ${Array.from({length:40}).map(()=>{
          const x=40+Math.random()*540, y=180+Math.random()*180
          return `<rect x="${x.toFixed(0)}" y="${y.toFixed(0)}" width="3" height="3" fill="#ffd470" opacity="${(Math.random()*0.8+0.2).toFixed(2)}"/>`
        }).join('')}
      </g>
    `,
    tokyo2150: `
      <!-- Cyberpunk silhouette -->
      <g fill="#050310" opacity="0.96">
        <rect x="10" y="160" width="50" height="220"/>
        <rect x="65" y="190" width="40" height="190"/>
        <rect x="110" y="130" width="70" height="250"/>
        <rect x="185" y="170" width="45" height="210"/>
        <rect x="235" y="100" width="90" height="280"/>
        <rect x="330" y="150" width="55" height="230"/>
        <rect x="390" y="180" width="70" height="200"/>
        <rect x="465" y="120" width="60" height="260"/>
        <rect x="530" y="170" width="60" height="210"/>
      </g>
      <!-- neon signs -->
      ${Array.from({length:36}).map(()=>{
        const x=20+Math.random()*570, y=130+Math.random()*230
        const color = ['#ff2e8a','#2ee8ff','#c974ff','#ffdd00'][Math.floor(Math.random()*4)]
        const w = 2 + Math.random()*6
        return `<rect x="${x.toFixed(0)}" y="${y.toFixed(0)}" width="${w.toFixed(1)}" height="2" fill="${color}" opacity="${(Math.random()*0.8+0.4).toFixed(2)}"/>`
      }).join('')}
      <!-- flying vehicles -->
      <ellipse cx="120" cy="85" rx="12" ry="3" fill="#ff2e8a" opacity="0.7"/>
      <ellipse cx="420" cy="60" rx="10" ry="2.5" fill="#2ee8ff" opacity="0.7"/>
    `,
    mars2200: `
      <!-- Mars horizon -->
      <path d="M 0 300 Q 150 260 300 285 Q 450 310 600 275 L 600 400 L 0 400 Z" fill="#5a1f18" opacity="0.95"/>
      <path d="M 0 340 Q 200 320 400 335 Q 500 340 600 325 L 600 400 L 0 400 Z" fill="#3a120a" opacity="0.95"/>
      <!-- Dome colonies -->
      <path d="M 120 330 Q 120 275 175 275 Q 230 275 230 330 Z" fill="#ffb070" opacity="0.25" stroke="#ffa050" stroke-width="1.2"/>
      <path d="M 330 320 Q 330 255 400 255 Q 470 255 470 320 Z" fill="#ffb070" opacity="0.25" stroke="#ffa050" stroke-width="1.2"/>
      <!-- Two moons -->
      <circle cx="470" cy="90" r="14" fill="#fff" opacity="0.8"/>
      <circle cx="120" cy="130" r="8" fill="#ffe0c0" opacity="0.85"/>
    `,
    atlantis: `
      <!-- Underwater sun rays -->
      <g opacity="0.18" fill="#80e0ff">
        <polygon points="200,0 180,400 220,400"/>
        <polygon points="320,0 295,400 345,400"/>
        <polygon points="440,0 420,400 460,400"/>
      </g>
      <!-- Atlantean temple -->
      <g fill="#02242f" opacity="0.96">
        <rect x="220" y="260" width="180" height="130"/>
        <polygon points="210,260 310,215 410,260"/>
        ${Array.from({length:7}).map((_,i)=>`<rect x="${225+i*25}" y="290" width="5" height="90" fill="#052935"/>`).join('')}
      </g>
      <!-- Fish + bubbles -->
      ${Array.from({length:30}).map(()=>{
        const x=Math.random()*600, y=80+Math.random()*300, r=Math.random()*3+1
        return `<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="${r.toFixed(1)}" fill="#a0e8ff" opacity="${(Math.random()*0.6+0.2).toFixed(2)}"/>`
      }).join('')}
    `,
    'ancient-china': `
      <!-- Pagoda -->
      <g fill="#2a0a08" opacity="0.95">
        <rect x="265" y="310" width="70" height="70"/>
        <polygon points="250,310 300,275 350,310"/>
        <rect x="272" y="245" width="56" height="50"/>
        <polygon points="258,245 300,215 342,245"/>
        <rect x="279" y="190" width="42" height="40"/>
        <polygon points="266,190 300,165 334,190"/>
        <rect x="285" y="145" width="30" height="30"/>
        <polygon points="273,145 300,123 327,145"/>
      </g>
      <!-- Lanterns -->
      <circle cx="80" cy="220" r="10" fill="#ff6020" opacity="0.9"/>
      <circle cx="520" cy="200" r="8" fill="#ff6020" opacity="0.85"/>
      <circle cx="150" cy="260" r="7" fill="#ff6020" opacity="0.8"/>
      <!-- Mountains -->
      <path d="M 0 320 Q 100 270 200 310 Q 300 330 400 290 Q 500 260 600 320 L 600 400 L 0 400 Z" fill="#1a0608" opacity="0.95"/>
    `,
    'venice-1600': `
      <!-- Canal buildings -->
      <g fill="#0a0a12" opacity="0.92">
        <rect x="0" y="210" width="110" height="170"/>
        <rect x="115" y="180" width="90" height="200"/>
        <rect x="210" y="220" width="100" height="160"/>
        <rect x="315" y="170" width="80" height="210"/>
        <path d="M 395 170 L 435 170 L 435 150 L 435 170 Z"/>
        <rect x="400" y="200" width="90" height="180"/>
        <rect x="495" y="185" width="105" height="195"/>
      </g>
      <!-- Campanile -->
      <rect x="250" y="130" width="28" height="100" fill="#0a0a12" opacity="0.95"/>
      <polygon points="250,130 264,100 278,130" fill="#0a0a12"/>
      <!-- Canal reflection -->
      <rect x="0" y="330" width="600" height="70" fill="${c1}" opacity="0.3"/>
      <!-- Gondola -->
      <path d="M 160 350 Q 190 342 220 350 L 215 356 L 165 356 Z" fill="#000" opacity="0.9"/>
    `,
    'space-station': `
      <!-- Earth below -->
      <circle cx="300" cy="540" r="280" fill="#1e4a8a" opacity="0.9"/>
      <circle cx="300" cy="540" r="280" fill="url(#earthGlow-${w.id})" opacity="1"/>
      <!-- Clouds/continents -->
      <path d="M 180 420 Q 220 415 270 430 Q 320 445 370 430 Q 410 420 430 435 L 450 470 Q 380 475 310 465 Q 240 455 180 450 Z" fill="#4a7b4a" opacity="0.7"/>
      <!-- Station silhouette -->
      <g fill="#eae6dc" opacity="0.92">
        <rect x="50" y="200" width="500" height="14" rx="4"/>
        <rect x="260" y="150" width="80" height="50" rx="6"/>
        <rect x="70" y="180" width="40" height="40"/>
        <rect x="490" y="180" width="40" height="40"/>
      </g>
    `,
  }

  const scene = scenes[w.id] || scenes.rome

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400" preserveAspectRatio="xMidYMid slice">
    <defs>
      <linearGradient id="sky-${w.id}" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0%" stop-color="${c3}"/>
        <stop offset="55%" stop-color="${c1}"/>
        <stop offset="100%" stop-color="${c2}"/>
      </linearGradient>
      <radialGradient id="earthGlow-${w.id}" cx="50%" cy="50%" r="60%">
        <stop offset="70%" stop-color="#1e4a8a" stop-opacity="1"/>
        <stop offset="100%" stop-color="#0a1a2a" stop-opacity="1"/>
      </radialGradient>
      <filter id="blur-${w.id}"><feGaussianBlur stdDeviation="0.6"/></filter>
    </defs>
    <rect width="600" height="400" fill="url(#sky-${w.id})"/>
    <g>${stars}</g>
    <g filter="url(#blur-${w.id})">${scene}</g>
    <rect width="600" height="400" fill="url(#sky-${w.id})" opacity="0.08"/>
  </svg>`
}

app.get('/api/cover/:id', (c) => {
  const id = c.req.param('id')
  const w = WORLDS_META.find(x => x.id === id) || WORLDS_META[0]
  const svg = coverSVG(w)
  return new Response(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=86400',
    },
  })
})

// ============================================================
// Live social-proof feed (deterministic-ish fake data)
// ============================================================
const FAKE_NAMES = ['Yuki','Ren','Aoi','Haru','Sora','Kai','Mei','Riku','Lena','Marco','Aya','Taro','Sakura','Leo','Nao','Jun','Emma','Noah','Olivia','Liam','Mia','Yuto','Rin','Kento']

app.get('/api/live-feed', (c) => {
  const feed = Array.from({length: 8}, () => {
    const world = WORLDS_META[Math.floor(Math.random()*WORLDS_META.length)]
    const name  = FAKE_NAMES[Math.floor(Math.random()*FAKE_NAMES.length)]
    const minutesAgo = Math.floor(Math.random()*58) + 1
    return { name, worldId: world.id, worldName: world.name, emoji: world.emoji, minutesAgo }
  })
  return c.json({
    onlineNow: 120 + Math.floor(Math.random()*520),
    totalWarpsToday: 4200 + Math.floor(Math.random()*3800),
    feed,
  })
})

// Daily theme
app.get('/api/daily-theme', (c) => {
  const themes = [
    { id: 'golden',  title: '黄金時代',    desc: 'ノスタルジックな夕日の時代へ', worldIds: ['rome','edo','ancient-china'] },
    { id: 'neon',    title: 'ネオンの夜',  desc: '未来都市で光に溺れる一夜',     worldIds: ['tokyo2150','nyc1924'] },
    { id: 'ancient', title: '古代の神秘',  desc: 'ピラミッドと神殿の世界',       worldIds: ['egypt','rome','atlantis'] },
    { id: 'castle',  title: '騎士の記憶',  desc: '霧の中の城下町',                worldIds: ['medieval','venice-1600'] },
    { id: 'space',   title: '宇宙の縁',    desc: '人類が宇宙に築いた街',         worldIds: ['tokyo2150','mars2200','space-station'] },
    { id: 'water',   title: '水の記憶',    desc: '運河と海底の世界',              worldIds: ['venice-1600','atlantis'] },
    { id: 'east',    title: '東方の風',    desc: '唐と江戸、アジアの夢',         worldIds: ['ancient-china','edo'] },
  ]
  const today = new Date()
  const day = today.getUTCFullYear()*1000 + today.getUTCMonth()*40 + today.getUTCDate()
  const theme = themes[day % themes.length]
  return c.json({ date: today.toISOString().slice(0,10), ...theme })
})

// Share card
app.get('/api/share-card/:worldId', (c) => {
  const id = c.req.param('worldId')
  const w = WORLDS_META.find(x => x.id === id) || WORLDS_META[0]
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
    <defs>
      <radialGradient id="bg" cx="50%" cy="50%" r="70%">
        <stop offset="0%" stop-color="#1a0a40"/>
        <stop offset="60%" stop-color="#050216"/>
        <stop offset="100%" stop-color="#000"/>
      </radialGradient>
    </defs>
    <rect width="1200" height="630" fill="url(#bg)"/>
    <g opacity="0.3">
      ${Array.from({length:70}).map(() => {
        const x = Math.random()*1200, y = Math.random()*630, s = Math.random()*2 + 0.5
        return `<circle cx="${x}" cy="${y}" r="${s}" fill="#fff"/>`
      }).join('')}
    </g>
    <text x="600" y="120" text-anchor="middle" font-family="serif" font-size="22" fill="#c9a96a" letter-spacing="8">
      WARPDOOR — 時空間旅行
    </text>
    <text x="600" y="300" text-anchor="middle" font-size="180">${w.emoji}</text>
    <text x="600" y="430" text-anchor="middle" font-family="serif" font-size="72" font-weight="bold" fill="#fff" letter-spacing="4">
      ${w.name}
    </text>
    <text x="600" y="490" text-anchor="middle" font-family="serif" font-size="22" fill="rgba(255,255,255,0.5)" letter-spacing="6">
      にワープしました
    </text>
    <text x="600" y="570" text-anchor="middle" font-family="monospace" font-size="18" fill="rgba(255,255,255,0.3)" letter-spacing="10">
      warpdoor — 扉を開ければ、そこへ
    </text>
  </svg>`
  return new Response(svg, { headers: { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'public, max-age=3600' } })
})

// ============================================================
// Main HTML
// ============================================================
app.get('/', (c) => {
  return c.html(`<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
<meta name="theme-color" content="#000000" />
<title>WARPDOOR — 扉を開ければ、そこへ</title>
<meta name="description" content="ブラウザだけで本物のどこでもドア体験。扉を開けば、古代ローマへ、未来の東京へ、火星へ。歩ける・視点を変えられる3D没入型ワープサービス。" />
<meta property="og:title" content="WARPDOOR — どこでもドア3D体験" />
<meta property="og:description" content="扉を開ければ、そこは1000年前か1000年後。リアルに歩ける没入型ワープ体験。" />
<meta property="og:image" content="/api/share-card/rome" />
<meta property="og:type" content="website" />
<meta name="twitter:card" content="summary_large_image" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=IBM+Plex+Mono:wght@300;400;500&family=Shippori+Mincho:wght@400;700&family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
<link rel="stylesheet" href="/static/warpdoor.css" />
<link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🚪</text></svg>" />
</head>
<body>
  <div class="first-load" id="firstLoad">
    <div class="spinner"></div>
    <div class="label">WARPDOOR · LOADING</div>
  </div>
  <div id="root"></div>
  <canvas id="bg-canvas"></canvas>

  <!-- Top HUD -->
  <div class="top-hud">
    <div class="brand">
      <div class="brand-mark">🚪</div>
      <div>WARPDOOR</div>
    </div>
    <div class="hud-right">
      <div class="hud-chip" id="liveChip"><span class="pulse-dot"></span><span id="liveCount">— online</span></div>
      <div class="hud-chip" id="collectionChip" style="cursor:pointer;">◉ <span id="collectionCount">0</span> / 12</div>
    </div>
  </div>

  <!-- Landing screen -->
  <section class="screen active" id="screen-landing">
    <div class="veil"></div>
    <div class="landing-content">
      <div class="landing-kicker">A DOOR TO ANYWHERE · ANYTIME</div>
      <h1 class="landing-title">どこでもドア、<br/>ひらく。</h1>
      <p class="landing-sub">
        ブラウザだけで、時代と場所を超える。<br/>
        古代ローマの石畳、未来の東京の雨、火星の赤い大地。<br/>
        扉を開けば、そこへ。
      </p>
      <div class="landing-cta">
        <button class="cta-primary" id="openDoor">扉をひらく</button>
        <div class="cta-hint">TAP / CLICK TO BEGIN</div>
      </div>
    </div>
  </section>

  <!-- Destination Picker -->
  <section class="screen" id="screen-picker">
    <div class="picker-back" id="pickerBack" title="戻る">←</div>
    <div class="picker-wrap">
      <div class="picker-header">
        <div class="picker-kicker">SELECT YOUR DESTINATION</div>
        <h2 class="picker-title">どこへ、いつへ。</h2>
        <p class="picker-sub">時代を選べば、ドアがそこへ繋がる。歩いて、見て、触れて、また戻ってこよう。</p>
      </div>

      <div class="daily-banner" id="dailyBanner">
        <div class="daily-left">
          <div class="daily-kicker">TODAY'S JOURNEY</div>
          <div class="daily-title" id="dailyTitle">今日のテーマ</div>
          <div class="daily-desc" id="dailyDesc">毎日異なるテーマがあなたを迎えます。</div>
        </div>
        <button class="daily-go" id="dailyGo">→ ワープ</button>
      </div>

      <div class="quick-actions">
        <button class="quick-btn" id="randomWarp">🎲 ランダムでワープ</button>
      </div>

      <div class="filter-bar" id="filterBar"></div>
      <div class="dest-grid" id="destGrid"></div>
    </div>
  </section>

  <!-- Transition -->
  <section class="screen" id="screen-transition">
    <div class="transition-status">
      <div class="transition-title" id="transitionTitle">接続しています...</div>
      <div class="transition-sub" id="transitionSub">QUANTUM TUNNEL · OPENING</div>
      <div class="transition-bar"><span></span></div>
    </div>
  </section>

  <!-- World UI -->
  <section class="screen" id="screen-world">
    <div class="world-ui">
      <div class="world-info">
        <div class="world-era" id="worldEra">—</div>
        <div class="world-name" id="worldName">—</div>
      </div>

      <div class="world-actions">
        <button class="wa-btn" id="btnShare" title="シェア">⇪</button>
        <button class="wa-btn" id="btnPhoto" title="スナップショット">◎</button>
        <button class="wa-btn leave" id="btnLeave" title="扉に戻る">⤺</button>
      </div>

      <div class="controls-hint" id="controlsHint">
        <span class="desktop-only"><span class="kbd">W</span><span class="kbd">A</span><span class="kbd">S</span><span class="kbd">D</span> 移動</span>
        <span class="desktop-only">マウスで視点</span>
        <span class="desktop-only"><span class="kbd">SPACE</span> ジャンプ</span>
        <span class="mobile-only">ジョイスティックで移動 · スワイプで視点</span>
      </div>

      <!-- mobile joystick -->
      <div class="joystick" id="joystick">
        <div class="base"></div>
        <div class="knob" id="knob"></div>
      </div>

      <!-- jump btn mobile -->
      <button class="jump-btn" id="jumpBtn">JUMP</button>

      <!-- view toggle -->
      <div class="view-toggle" id="viewToggle">
        <button id="viewToggleBtn" title="視点切替">👁</button>
      </div>

      <!-- coordinates -->
      <div class="coord-hud" id="coordHud">— —</div>
    </div>
  </section>

  <!-- Modal: collection -->
  <div class="modal" id="collectionModal">
    <div class="modal-box">
      <button class="modal-close" id="modalClose">✕</button>
      <div class="modal-title">あなたの旅の記憶</div>
      <div class="modal-sub">訪れた世界はここに蓄積されます。全12世界を制覇しよう。</div>
      <div class="collection-grid" id="collectionGrid"></div>
    </div>
  </div>

  <!-- Toast -->
  <div class="toast" id="toast"></div>

  <script type="importmap">
  {
    "imports": {
      "three": "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js",
      "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/"
    }
  }
  </script>
  <script type="module" src="/static/warpdoor.js"></script>

  <style>
    .desktop-only { display: inline-flex; align-items: center; gap: 4px; }
    .mobile-only { display: none; }
    @media (pointer: coarse) {
      .desktop-only { display: none; }
      .mobile-only { display: inline; }
    }
  </style>
</body>
</html>`)
})

export default app
