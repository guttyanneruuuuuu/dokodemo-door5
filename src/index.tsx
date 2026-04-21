import { Hono } from 'hono'
import { cors } from 'hono/cors'

const app = new Hono()

app.use('/api/*', cors())

// ============================================================
// API: Warp activity feed (fake live data for social proof)
// ============================================================
const WORLDS_META = [
  { id: 'rome',      emoji: '🏛', name: '古代ローマ'    },
  { id: 'tokyo2150', emoji: '🚀', name: '未来の東京'    },
  { id: 'edo',       emoji: '⛩', name: '江戸時代'      },
  { id: 'nyc1924',   emoji: '🎷', name: '1920年代 NY' },
  { id: 'egypt',     emoji: '🏺', name: '古代エジプト'  },
  { id: 'medieval',  emoji: '🏰', name: '中世ヨーロッパ' },
  { id: 'mars2200',  emoji: '🪐', name: '火星コロニー'  },
  { id: 'atlantis',  emoji: '🌊', name: 'アトランティス' },
]

const FAKE_NAMES = [
  'Yuki', 'Ren', 'Aoi', 'Haru', 'Sora', 'Kai', 'Mei', 'Riku',
  'Lena', 'Marco', 'Aya', 'Taro', 'Sakura', 'Leo', 'Nao', 'Jun',
  'Emma', 'Noah', 'Olivia', 'Liam', 'Mia', 'Yuto', 'Rin', 'Kento'
]

app.get('/api/live-feed', (c) => {
  const feed = Array.from({ length: 8 }, () => {
    const world = WORLDS_META[Math.floor(Math.random() * WORLDS_META.length)]
    const name = FAKE_NAMES[Math.floor(Math.random() * FAKE_NAMES.length)]
    const minutes = Math.floor(Math.random() * 58) + 1
    return {
      name,
      worldId: world.id,
      worldName: world.name,
      emoji: world.emoji,
      minutesAgo: minutes,
    }
  })
  return c.json({
    onlineNow: 120 + Math.floor(Math.random() * 420),
    totalWarpsToday: 4200 + Math.floor(Math.random() * 3800),
    feed,
  })
})

// Daily theme — deterministic per day
app.get('/api/daily-theme', (c) => {
  const themes = [
    { id: 'sunrise',  title: '夜明けの街',       desc: '朝焼けが美しい時代の街を訪れよう', worldIds: ['edo', 'rome', 'medieval'] },
    { id: 'neon',     title: 'ネオンの夜',       desc: '未来都市で光の海に溺れよう',       worldIds: ['tokyo2150', 'nyc1924'] },
    { id: 'ancient',  title: '古代の神秘',       desc: 'ピラミッドと神殿の時代へ',         worldIds: ['egypt', 'rome', 'atlantis'] },
    { id: 'samurai',  title: '侍の足跡',         desc: '武士が歩いた道を辿ろう',           worldIds: ['edo', 'medieval'] },
    { id: 'fantasy',  title: '幻想の王国',       desc: '騎士と魔法の中世へ',               worldIds: ['medieval', 'atlantis'] },
    { id: 'space',    title: '宇宙への扉',       desc: '人類が宇宙を拓いた時代',           worldIds: ['tokyo2150', 'mars2200'] },
    { id: 'jazz',     title: 'ジャズの記憶',     desc: '1920年代の黄金時代',              worldIds: ['nyc1924'] },
  ]
  const today = new Date()
  const day = today.getUTCFullYear() * 1000 + today.getUTCMonth() * 40 + today.getUTCDate()
  const theme = themes[day % themes.length]
  return c.json({ date: today.toISOString().slice(0, 10), ...theme })
})

// Share card — dynamic SVG (OGP alternative, works inline)
app.get('/api/share-card/:worldId', (c) => {
  const worldId = c.req.param('worldId')
  const w = WORLDS_META.find(x => x.id === worldId) || WORLDS_META[0]
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <radialGradient id="bg" cx="50%" cy="50%" r="70%">
      <stop offset="0%" stop-color="#1a0a40"/>
      <stop offset="60%" stop-color="#050216"/>
      <stop offset="100%" stop-color="#000"/>
    </radialGradient>
    <filter id="glow"><feGaussianBlur stdDeviation="8"/></filter>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <g opacity="0.3">
    ${Array.from({length: 60}).map(() => {
      const x = Math.random()*1200, y = Math.random()*630, s = Math.random()*2 + 0.5
      return `<circle cx="${x}" cy="${y}" r="${s}" fill="#fff"/>`
    }).join('')}
  </g>
  <text x="600" y="120" text-anchor="middle" font-family="serif" font-size="22" fill="#a864ff" letter-spacing="8">
    WARPDOOR EXPERIENCE
  </text>
  <text x="600" y="300" text-anchor="middle" font-size="180">${w.emoji}</text>
  <text x="600" y="430" text-anchor="middle" font-family="serif" font-size="72" font-weight="bold" fill="#fff" letter-spacing="4">
    ${w.name}
  </text>
  <text x="600" y="490" text-anchor="middle" font-family="serif" font-size="22" fill="rgba(255,255,255,0.5)" letter-spacing="6">
    にワープしました
  </text>
  <text x="600" y="570" text-anchor="middle" font-family="monospace" font-size="18" fill="rgba(255,255,255,0.3)" letter-spacing="10">
    warpdoor.app — 時空間旅行サービス
  </text>
</svg>`
  return new Response(svg, { headers: { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'public, max-age=3600' } })
})

// ============================================================
// HTML shell
// ============================================================
app.get('/', (c) => {
  return c.html(`<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
<meta name="theme-color" content="#000000" />
<title>WARPDOOR — 時空間3D没入体験</title>
<meta name="description" content="扉を開ければ、そこは1000年前か1000年後。Three.jsで作られた本物のどこでもドア体験。古代ローマ・未来の東京・江戸時代・火星コロニーへ、ブラウザだけでワープ。" />
<meta property="og:title" content="WARPDOOR — 3Dどこでもドア" />
<meta property="og:description" content="扉を開けば、そこは過去か未来。ブラウザで誰でも体験できる時空間3Dワープ。" />
<meta property="og:type" content="website" />
<meta property="og:image" content="/api/share-card/rome" />
<meta name="twitter:card" content="summary_large_image" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=IBM+Plex+Mono:wght@300;400;500&family=Shippori+Mincho:wght@400;700&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="/static/warpdoor-v8.css">
<link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🚪</text></svg>" />
</head>
<body>
  <div id="root"></div>
  <script type="importmap">
  {
    "imports": {
      "three": "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js"
    }
  }
  </script>
  <script type="module" src="/static/warpdoor-v8.js"></script>
</body>
</html>`)
})

export default app
