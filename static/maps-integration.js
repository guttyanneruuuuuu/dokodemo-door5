// WARPDOOR Maps Integration v8
// Google Maps API + Street View + Nominatim for realistic world locations
// ============================================================

/**
 * Real-world location database
 * Each location has coordinates, name, description, and visual characteristics
 */
export const REAL_LOCATIONS = [
  // Japan
  { id: 'kyoto-fushimi', name: '京都・伏見稲荷', lat: 34.9674, lng: 135.7725, desc: '千本鳥居が立ち並ぶ神社', category: '神社', country: '日本' },
  { id: 'tokyo-shibuya', name: '東京・渋谷スクランブル交差点', lat: 35.6595, lng: 139.7004, desc: '世界最大級の交差点', category: '都市', country: '日本' },
  { id: 'tokyo-senso', name: '東京・浅草寺', lat: 35.7148, lng: 139.7967, desc: '江戸情緒が残る古刹', category: '寺院', country: '日本' },
  { id: 'osaka-castle', name: '大阪城', lat: 34.6873, lng: 135.5263, desc: '豊臣秀吉が築いた名城', category: '城', country: '日本' },
  { id: 'hiroshima-torii', name: '広島・厳島神社', lat: 34.2956, lng: 132.3197, desc: '海に浮かぶ大鳥居', category: '神社', country: '日本' },
  
  // Europe
  { id: 'paris-eiffel', name: 'パリ・エッフェル塔', lat: 48.8584, lng: 2.2945, desc: 'パリの象徴的ランドマーク', category: '建築', country: 'フランス' },
  { id: 'rome-colosseum', name: 'ローマ・コロッセオ', lat: 41.8902, lng: 12.4924, desc: '古代ローマの円形劇場', category: '遺跡', country: 'イタリア' },
  { id: 'venice-square', name: 'ベネチア・サン・マルコ広場', lat: 45.4346, lng: 12.3382, desc: '水の都の中心', category: '広場', country: 'イタリア' },
  { id: 'london-bigben', name: 'ロンドン・ビッグベン', lat: 51.4975, lng: -0.1357, desc: 'イギリスの象徴', category: '建築', country: 'イギリス' },
  { id: 'barcelona-sagrada', name: 'バルセロナ・サグラダ・ファミリア', lat: 41.4036, lng: 2.1744, desc: 'ガウディの傑作教会', category: '建築', country: 'スペイン' },
  
  // Americas
  { id: 'newyork-times', name: 'ニューヨーク・タイムズスクエア', lat: 40.7580, lng: -73.9855, desc: 'ネオンと人波の街', category: '都市', country: 'アメリカ' },
  { id: 'newyork-statue', name: 'ニューヨーク・自由の女神', lat: 40.6892, lng: -74.0445, desc: 'アメリカの自由の象徴', category: '彫像', country: 'アメリカ' },
  { id: 'rio-christ', name: 'リオ・キリスト像', lat: -22.9519, lng: -43.2105, desc: 'ブラジルの象徴', category: '彫像', country: 'ブラジル' },
  { id: 'machu-picchu', name: 'マチュピチュ', lat: -13.1631, lng: -72.5450, desc: 'インカ帝国の遺跡', category: '遺跡', country: 'ペルー' },
  
  // Asia
  { id: 'beijing-greatwall', name: '北京・万里の長城', lat: 40.4319, lng: 116.0072, desc: '世界最大の城壁', category: '遺跡', country: '中国' },
  { id: 'bangkok-temple', name: 'バンコク・ワット・アルン', lat: 13.7458, lng: 100.4863, desc: '暁の寺院', category: '寺院', country: 'タイ' },
  { id: 'dubai-burj', name: 'ドバイ・ブルジュ・ハリファ', lat: 25.1972, lng: 55.2744, desc: '世界最高層ビル', category: '建築', country: 'アラブ首長国連邦' },
  { id: 'istanbul-blue', name: 'イスタンブール・ブルーモスク', lat: 41.0054, lng: 28.9768, desc: 'オスマン帝国の傑作', category: '寺院', country: 'トルコ' },
  
  // Africa & Middle East
  { id: 'giza-pyramids', name: 'ギザ・ピラミッド', lat: 29.9773, lng: 31.1325, desc: '古代エジプトの奇跡', category: '遺跡', country: 'エジプト' },
  { id: 'petra-treasury', name: 'ペトラ・宝物殿', lat: 30.3286, lng: 35.4419, desc: '砂漠の中の古代都市', category: '遺跡', country: 'ヨルダン' },
  
  // Oceania
  { id: 'sydney-opera', name: 'シドニー・オペラハウス', lat: -33.8568, lng: 151.2153, desc: 'オーストラリアの象徴', category: '建築', country: 'オーストラリア' },
  { id: 'newzealand-milford', name: 'ニュージーランド・ミルフォードサウンド', lat: -44.6719, lng: 167.9258, desc: '自然の奇跡', category: '自然', country: 'ニュージーランド' },
]

/**
 * Get random location from database
 */
export function getRandomLocation() {
  return REAL_LOCATIONS[Math.floor(Math.random() * REAL_LOCATIONS.length)]
}

/**
 * Get locations by category
 */
export function getLocationsByCategory(category) {
  return REAL_LOCATIONS.filter(loc => loc.category === category)
}

/**
 * Get locations by country
 */
export function getLocationsByCountry(country) {
  return REAL_LOCATIONS.filter(loc => loc.country === country)
}

/**
 * Get today's theme locations (deterministic per day)
 */
export function getTodayThemeLocations() {
  const themes = [
    { name: '世界の美しい海', category: '自然', locations: getLocationsByCategory('自然').slice(0, 5) },
    { name: '古代遺跡の謎', category: '遺跡', locations: getLocationsByCategory('遺跡').slice(0, 5) },
    { name: '未来都市の光', category: '建築', locations: getLocationsByCategory('建築').slice(0, 5) },
    { name: '神聖な寺院', category: '寺院', locations: getLocationsByCategory('寺院').slice(0, 5) },
    { name: '都市の喧騒', category: '都市', locations: getLocationsByCategory('都市').slice(0, 5) },
  ]
  
  const today = new Date()
  const day = today.getUTCFullYear() * 1000 + today.getUTCMonth() * 40 + today.getUTCDate()
  const theme = themes[day % themes.length]
  return theme
}

/**
 * Generate Street View URL for a location
 */
export function getStreetViewUrl(lat, lng, width = 1200, height = 630) {
  return `https://maps.googleapis.com/maps/api/streetview?size=${width}x${height}&location=${lat},${lng}&fov=90&heading=0&pitch=0&key=YOUR_API_KEY`
}

/**
 * Generate Google Maps embed URL
 */
export function getMapEmbedUrl(lat, lng, zoom = 15) {
  return `https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d${Math.pow(2, 21-zoom)}!2d${lng}!3d${lat}!2m3!1f0!2f0!3f0!3m2!1i${1024}!2i${768}!4f13.1!3m3!1m2!1s0x0%3A0x0!2zCoKrLTMzLjg1NjgsIDE1MS4yMTU4!5e0!3m2!1sen!2sus!4v1234567890`
}

/**
 * Fetch location data from Nominatim (reverse geocoding)
 */
export async function getLocationName(lat, lng) {
  try {
    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`)
    const data = await response.json()
    return data.address?.city || data.address?.town || data.address?.village || 'Unknown Location'
  } catch (e) {
    console.warn('Nominatim reverse geocoding failed:', e)
    return 'Unknown Location'
  }
}

/**
 * Search location by name using Nominatim
 */
export async function searchLocation(query) {
  try {
    const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`)
    const data = await response.json()
    if (data.length > 0) {
      const result = data[0]
      return {
        name: result.display_name,
        lat: parseFloat(result.lat),
        lng: parseFloat(result.lon),
        category: result.type,
      }
    }
    return null
  } catch (e) {
    console.warn('Nominatim search failed:', e)
    return null
  }
}

/**
 * Calculate distance between two coordinates (Haversine formula)
 */
export function getDistance(lat1, lng1, lat2, lng2) {
  const R = 6371 // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng/2) * Math.sin(dLng/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}

/**
 * Get nearby locations
 */
export function getNearbyLocations(lat, lng, radiusKm = 100) {
  return REAL_LOCATIONS.filter(loc => {
    const dist = getDistance(lat, lng, loc.lat, loc.lng)
    return dist <= radiusKm
  }).sort((a, b) => {
    const distA = getDistance(lat, lng, a.lat, a.lng)
    const distB = getDistance(lat, lng, b.lat, b.lng)
    return distA - distB
  })
}

/**
 * Generate warp history entry
 */
export function createWarpRecord(location, userId = 'anonymous') {
  return {
    id: Math.random().toString(36).substr(2, 9),
    userId,
    location: location.name,
    coordinates: [location.lat, location.lng],
    category: location.category,
    country: location.country,
    description: location.desc,
    timestamp: new Date().toISOString(),
    likes: 0,
    comments: [],
  }
}

/**
 * Time-travel simulation: get historical imagery metadata
 * (In real implementation, would integrate with Google Earth Engine API)
 */
export function getHistoricalYears(location) {
  return [
    { year: 1945, label: '戦後直後', availability: 'limited' },
    { year: 1970, label: '高度成長期', availability: 'partial' },
    { year: 1990, label: 'バブル期', availability: 'good' },
    { year: 2000, label: '2000年代', availability: 'good' },
    { year: 2010, label: '2010年代', availability: 'excellent' },
    { year: 2020, label: '現在', availability: 'excellent' },
  ]
}

/**
 * Generate location preview card HTML
 */
export function generateLocationCard(location) {
  return `
    <div class="location-card" data-id="${location.id}">
      <div class="location-emoji">📍</div>
      <div class="location-name">${location.name}</div>
      <div class="location-desc">${location.desc}</div>
      <div class="location-meta">
        <span class="category">${location.category}</span>
        <span class="country">${location.country}</span>
      </div>
      <button class="warp-btn" onclick="warpToLocation('${location.id}')">ワープ</button>
    </div>
  `
}

/**
 * Export location data as JSON (for sharing/backup)
 */
export function exportLocationData(warpRecords) {
  return JSON.stringify({
    version: '1.0',
    exportDate: new Date().toISOString(),
    records: warpRecords,
  }, null, 2)
}

/**
 * Import location data from JSON
 */
export function importLocationData(jsonString) {
  try {
    const data = JSON.parse(jsonString)
    return data.records || []
  } catch (e) {
    console.error('Import failed:', e)
    return []
  }
}
