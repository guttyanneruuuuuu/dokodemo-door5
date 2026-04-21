// WARPDOOR Social & Gamification v8
// User engagement, warp records, comments, friends, rankings
// ============================================================

/**
 * Local storage manager for social data
 */
class SocialDataManager {
  constructor() {
    this.prefix = 'wd_social_'
  }

  get(key, def = null) {
    try {
      const val = localStorage.getItem(this.prefix + key)
      return val ? JSON.parse(val) : def
    } catch {
      return def
    }
  }

  set(key, val) {
    try {
      localStorage.setItem(this.prefix + key, JSON.stringify(val))
    } catch {}
  }

  delete(key) {
    try {
      localStorage.removeItem(this.prefix + key)
    } catch {}
  }
}

const socialData = new SocialDataManager()

/**
 * User Profile
 */
export class UserProfile {
  constructor(userId = null) {
    this.userId = userId || this.generateUserId()
    this.username = socialData.get(`user_${this.userId}_name`, `Traveler_${this.userId.slice(0, 4)}`)
    this.avatar = socialData.get(`user_${this.userId}_avatar`, this.generateAvatar())
    this.totalWarps = socialData.get(`user_${this.userId}_warps`, 0)
    this.friends = socialData.get(`user_${this.userId}_friends`, [])
    this.achievements = socialData.get(`user_${this.userId}_achievements`, [])
    this.collectorPass = socialData.get(`user_${this.userId}_pass`, false)
    this.joinDate = socialData.get(`user_${this.userId}_joined`, new Date().toISOString())
  }

  generateUserId() {
    return 'user_' + Math.random().toString(36).substr(2, 12)
  }

  generateAvatar() {
    const emojis = ['🧑‍🚀', '👨‍🔬', '👩‍🎨', '🧑‍🌾', '👨‍💼', '👩‍⚕️', '🧑‍🍳', '👨‍🎓']
    return emojis[Math.floor(Math.random() * emojis.length)]
  }

  save() {
    socialData.set(`user_${this.userId}_name`, this.username)
    socialData.set(`user_${this.userId}_avatar`, this.avatar)
    socialData.set(`user_${this.userId}_warps`, this.totalWarps)
    socialData.set(`user_${this.userId}_friends`, this.friends)
    socialData.set(`user_${this.userId}_achievements`, this.achievements)
    socialData.set(`user_${this.userId}_pass`, this.collectorPass)
  }

  addWarp() {
    this.totalWarps++
    this.save()
    this.checkAchievements()
  }

  checkAchievements() {
    const achievements = [
      { id: 'first_warp', name: '初めてのワープ', condition: this.totalWarps >= 1 },
      { id: 'ten_warps', name: '10回ワープ', condition: this.totalWarps >= 10 },
      { id: 'fifty_warps', name: '50回ワープ', condition: this.totalWarps >= 50 },
      { id: 'hundred_warps', name: '100回ワープ', condition: this.totalWarps >= 100 },
      { id: 'collector', name: 'コレクター', condition: this.collectorPass },
      { id: 'social_butterfly', name: 'ソーシャルバタフライ', condition: this.friends.length >= 10 },
    ]

    achievements.forEach(ach => {
      if (ach.condition && !this.achievements.includes(ach.id)) {
        this.achievements.push(ach.id)
        this.save()
      }
    })
  }

  addFriend(friendId) {
    if (!this.friends.includes(friendId)) {
      this.friends.push(friendId)
      this.save()
    }
  }

  removeFriend(friendId) {
    this.friends = this.friends.filter(id => id !== friendId)
    this.save()
  }
}

/**
 * Warp Record (user's warp experience)
 */
export class WarpRecord {
  constructor(locationId, locationName, coordinates, description = '') {
    this.id = 'warp_' + Math.random().toString(36).substr(2, 12)
    this.locationId = locationId
    this.locationName = locationName
    this.coordinates = coordinates // [lat, lng]
    this.description = description
    this.timestamp = new Date().toISOString()
    this.likes = 0
    this.comments = []
    this.imageUrl = null
    this.visibility = 'public' // public | friends | private
  }

  addComment(userId, text) {
    this.comments.push({
      id: 'comment_' + Math.random().toString(36).substr(2, 9),
      userId,
      text,
      timestamp: new Date().toISOString(),
      likes: 0,
    })
  }

  like() {
    this.likes++
  }

  unlike() {
    this.likes = Math.max(0, this.likes - 1)
  }

  save() {
    socialData.set(`warp_${this.id}`, this)
  }

  static load(id) {
    return socialData.get(`warp_${id}`)
  }

  static getAllRecords() {
    const records = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith('wd_social_warp_')) {
        records.push(JSON.parse(localStorage.getItem(key)))
      }
    }
    return records.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
  }
}

/**
 * Warp Spot Ranking (popular destinations)
 */
export class WarpSpotRanking {
  static getPopularSpots(timeRange = 'week') {
    const records = WarpRecord.getAllRecords()
    const now = new Date()
    const cutoff = new Date(now.getTime() - this.getTimeRangeMs(timeRange))

    const spots = {}
    records.forEach(record => {
      if (new Date(record.timestamp) > cutoff) {
        const key = record.locationName
        if (!spots[key]) {
          spots[key] = {
            name: record.locationName,
            coordinates: record.coordinates,
            count: 0,
            likes: 0,
            topImage: null,
          }
        }
        spots[key].count++
        spots[key].likes += record.likes
        if (!spots[key].topImage && record.imageUrl) {
          spots[key].topImage = record.imageUrl
        }
      }
    })

    return Object.values(spots)
      .sort((a, b) => b.count - a.count || b.likes - a.likes)
      .slice(0, 20)
  }

  static getTimeRangeMs(range) {
    const ranges = {
      'day': 24 * 60 * 60 * 1000,
      'week': 7 * 24 * 60 * 60 * 1000,
      'month': 30 * 24 * 60 * 60 * 1000,
      'all': Infinity,
    }
    return ranges[range] || ranges['week']
  }
}

/**
 * Daily Challenge System
 */
export class DailyChallenge {
  static getChallengeForToday() {
    const today = new Date().toDateString()
    const challenges = [
      {
        id: 'warp_3_times',
        name: '3回ワープ',
        description: '今日3回ワープしよう',
        reward: 100,
        condition: (user) => user.totalWarps >= 3,
      },
      {
        id: 'comment_on_record',
        name: 'コメント投稿',
        description: 'ワープ記録にコメントを投稿',
        reward: 50,
        condition: () => true,
      },
      {
        id: 'add_friend',
        name: 'フレンド追加',
        description: '新しいフレンドを追加',
        reward: 75,
        condition: () => true,
      },
      {
        id: 'explore_new_spot',
        name: '新しい場所を発見',
        description: '未訪問の場所にワープ',
        reward: 150,
        condition: () => true,
      },
    ]

    const hash = today.split('').reduce((a, b) => a + b.charCodeAt(0), 0)
    return challenges[hash % challenges.length]
  }

  static checkCompletion(user, challenge) {
    return challenge.condition(user)
  }
}

/**
 * Points & Rewards System
 */
export class PointsSystem {
  static getPoints(userId) {
    return socialData.get(`user_${userId}_points`, 0)
  }

  static addPoints(userId, amount, reason = 'activity') {
    const current = this.getPoints(userId)
    const newTotal = current + amount
    socialData.set(`user_${userId}_points`, newTotal)

    // Log transaction
    const history = socialData.get(`user_${userId}_points_history`, [])
    history.push({
      amount,
      reason,
      timestamp: new Date().toISOString(),
    })
    socialData.set(`user_${userId}_points_history`, history)

    return newTotal
  }

  static spendPoints(userId, amount) {
    const current = this.getPoints(userId)
    if (current >= amount) {
      const newTotal = current - amount
      socialData.set(`user_${userId}_points`, newTotal)
      return true
    }
    return false
  }

  static getPointsHistory(userId) {
    return socialData.get(`user_${userId}_points_history`, [])
  }

  static getPointsLeaderboard() {
    const leaderboard = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.includes('_points') && !key.includes('_history')) {
        const userId = key.replace('wd_social_user_', '').replace('_points', '')
        const points = parseInt(localStorage.getItem(key))
        leaderboard.push({ userId, points })
      }
    }
    return leaderboard.sort((a, b) => b.points - a.points).slice(0, 100)
  }
}

/**
 * Notification System
 */
export class NotificationManager {
  static notify(type, title, message, duration = 3000) {
    const notification = {
      id: 'notif_' + Math.random().toString(36).substr(2, 9),
      type, // 'success' | 'info' | 'warning' | 'error'
      title,
      message,
      timestamp: new Date().toISOString(),
    }

    // Store in queue
    const queue = socialData.get('notification_queue', [])
    queue.push(notification)
    socialData.set('notification_queue', queue.slice(-50)) // Keep last 50

    // Trigger UI update (would be handled by React/Vue in real app)
    window.dispatchEvent(new CustomEvent('warpdoor:notification', { detail: notification }))

    return notification.id
  }

  static getQueue() {
    return socialData.get('notification_queue', [])
  }

  static clearQueue() {
    socialData.set('notification_queue', [])
  }
}

/**
 * Engagement Tracking
 */
export class EngagementTracker {
  static trackEvent(eventType, data = {}) {
    const event = {
      type: eventType,
      timestamp: new Date().toISOString(),
      data,
    }

    const history = socialData.get('engagement_history', [])
    history.push(event)
    socialData.set('engagement_history', history.slice(-1000)) // Keep last 1000 events
  }

  static getEngagementStats() {
    const history = socialData.get('engagement_history', [])
    const now = new Date()
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)

    const stats = {
      totalEvents: history.length,
      eventsLast24h: history.filter(e => new Date(e.timestamp) > dayAgo).length,
      eventTypes: {},
    }

    history.forEach(event => {
      stats.eventTypes[event.type] = (stats.eventTypes[event.type] || 0) + 1
    })

    return stats
  }

  static getDailyActiveUsers() {
    const history = socialData.get('engagement_history', [])
    const now = new Date()
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)

    const users = new Set()
    history.forEach(event => {
      if (new Date(event.timestamp) > dayAgo && event.data.userId) {
        users.add(event.data.userId)
      }
    })

    return users.size
  }
}

/**
 * Initialize social system
 */
export function initializeSocialSystem() {
  // Create or load current user
  let userId = socialData.get('current_user_id')
  if (!userId) {
    const user = new UserProfile()
    userId = user.userId
    user.save()
    socialData.set('current_user_id', userId)
  }

  return userId
}

/**
 * Export all social data (for backup)
 */
export function exportSocialData() {
  const data = {
    version: '1.0',
    exportDate: new Date().toISOString(),
    records: [],
    achievements: [],
  }

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key && key.startsWith('wd_social_')) {
      data.records.push({
        key,
        value: localStorage.getItem(key),
      })
    }
  }

  return JSON.stringify(data, null, 2)
}

/**
 * Import social data (for restore)
 */
export function importSocialData(jsonString) {
  try {
    const data = JSON.parse(jsonString)
    if (data.version !== '1.0') {
      throw new Error('Unsupported data version')
    }

    data.records.forEach(record => {
      localStorage.setItem(record.key, record.value)
    })

    return true
  } catch (e) {
    console.error('Import failed:', e)
    return false
  }
}
