// WARPDOOR Social Screens v8
// Social feed, user profiles, rankings, and community features
// ============================================================

import { WarpRecord, UserProfile, WarpSpotRanking, PointsSystem, EngagementTracker } from './social-gamification.js'
import { createToast, createModal, createLeaderboard, createTabNav, createSearchInput, createResponsiveGrid, createWarpRecordCard } from './ui-components.js'

/**
 * Social Feed Screen
 */
export function renderSocialFeed() {
  const root = document.querySelector('#root')
  root.innerHTML = ''

  const container = document.createElement('div')
  container.style.cssText = `
    width: 100%;
    height: 100%;
    background: linear-gradient(135deg, #0a0612 0%, #1a0a35 50%, #0f0520 100%);
    overflow-y: auto;
    padding-top: 60px;
  `

  // Header
  const header = document.createElement('div')
  header.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    height: 60px;
    background: linear-gradient(180deg, rgba(10,6,18,.8) 0%, rgba(10,6,18,.4) 100%);
    backdrop-filter: blur(12px);
    border-bottom: 1px solid rgba(172,120,255,.1);
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 24px;
    z-index: 100;
  `

  const title = document.createElement('h1')
  title.textContent = 'Social Feed'
  title.style.cssText = `
    margin: 0;
    font-size: 20px;
    background: linear-gradient(135deg, #a864ff, #6b3fbf);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  `

  const backBtn = document.createElement('button')
  backBtn.textContent = '← Back'
  backBtn.className = 'hud-btn'
  backBtn.onclick = () => window.history.back()

  header.appendChild(title)
  header.appendChild(backBtn)
  container.appendChild(header)

  // Content
  const content = document.createElement('div')
  content.style.cssText = `
    max-width: 800px;
    margin: 0 auto;
    padding: 24px;
  `

  // Tabs
  const tabs = [
    { id: 'feed', label: '🌍 Feed' },
    { id: 'trending', label: '🔥 Trending' },
    { id: 'friends', label: '👥 Friends' },
  ]

  const tabNav = createTabNav(tabs, (tabId) => {
    renderTabContent(content, tabId)
  })
  content.appendChild(tabNav)

  const tabContent = document.createElement('div')
  tabContent.id = 'tab-content'
  content.appendChild(tabContent)

  container.appendChild(content)
  root.appendChild(container)

  // Initial render
  renderTabContent(tabContent, 'feed')
}

function renderTabContent(container, tabId) {
  container.innerHTML = ''

  if (tabId === 'feed') {
    renderFeedTab(container)
  } else if (tabId === 'trending') {
    renderTrendingTab(container)
  } else if (tabId === 'friends') {
    renderFriendsTab(container)
  }
}

function renderFeedTab(container) {
  const records = WarpRecord.getAllRecords()

  if (records.length === 0) {
    const empty = document.createElement('div')
    empty.style.cssText = `
      text-align: center;
      padding: 60px 24px;
      color: rgba(255,255,255,.5);
    `
    empty.innerHTML = `
      <div style="font-size: 48px; margin-bottom: 16px;">🌍</div>
      <div style="font-size: 16px;">No warp records yet</div>
      <div style="font-size: 12px; margin-top: 8px;">Start warping to share your adventures!</div>
    `
    container.appendChild(empty)
    return
  }

  records.forEach(record => {
    const user = new UserProfile(record.userId)
    const card = createWarpRecordCard(
      record,
      user,
      (recordId) => {
        const r = WarpRecord.load(recordId)
        r.like()
        r.save()
        createToast('❤️ Liked!', 'success')
        renderFeedTab(container)
      },
      (recordId) => {
        showCommentModal(recordId)
      }
    )
    container.appendChild(card)
  })
}

function renderTrendingTab(container) {
  const trending = WarpSpotRanking.getPopularSpots('week')

  if (trending.length === 0) {
    const empty = document.createElement('div')
    empty.style.cssText = `
      text-align: center;
      padding: 60px 24px;
      color: rgba(255,255,255,.5);
    `
    empty.textContent = 'No trending spots yet'
    container.appendChild(empty)
    return
  }

  const board = document.createElement('div')
  trending.forEach((spot, idx) => {
    const row = document.createElement('div')
    row.style.cssText = `
      background: rgba(14,12,36,.5);
      border: 1px solid rgba(172,120,255,.15);
      border-radius: 12px;
      padding: 16px;
      margin-bottom: 12px;
      backdrop-filter: blur(8px);
      cursor: pointer;
      transition: all .2s ease;
    `

    row.onmouseover = () => {
      row.style.background = 'rgba(14,12,36,.7)'
      row.style.borderColor = 'rgba(172,120,255,.3)'
    }

    row.onmouseout = () => {
      row.style.background = 'rgba(14,12,36,.5)'
      row.style.borderColor = 'rgba(172,120,255,.15)'
    }

    row.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: space-between;">
        <div>
          <div style="font-size: 18px; font-weight: 700; color: ${idx === 0 ? '#ffd700' : idx === 1 ? '#c0c0c0' : idx === 2 ? '#cd7f32' : '#a864ff'};">
            #${idx + 1} ${spot.name}
          </div>
          <div style="font-size: 12px; color: rgba(255,255,255,.5); margin-top: 4px;">
            ${spot.count} warps · ${spot.likes} likes
          </div>
        </div>
        <button style="
          background: linear-gradient(135deg, #a864ff, #6b3fbf);
          border: none;
          color: #fff;
          padding: 8px 16px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 12px;
          font-weight: 600;
        ">Warp</button>
      </div>
    `

    container.appendChild(row)
  })
}

function renderFriendsTab(container) {
  const user = new UserProfile()
  const friends = user.friends

  if (friends.length === 0) {
    const empty = document.createElement('div')
    empty.style.cssText = `
      text-align: center;
      padding: 60px 24px;
      color: rgba(255,255,255,.5);
    `
    empty.innerHTML = `
      <div style="font-size: 48px; margin-bottom: 16px;">👥</div>
      <div style="font-size: 16px;">No friends yet</div>
      <div style="font-size: 12px; margin-top: 8px;">Add friends to see their warp adventures!</div>
    `
    container.appendChild(empty)
    return
  }

  friends.forEach(friendId => {
    const friend = new UserProfile(friendId)
    const row = document.createElement('div')
    row.style.cssText = `
      background: rgba(14,12,36,.5);
      border: 1px solid rgba(172,120,255,.15);
      border-radius: 12px;
      padding: 16px;
      margin-bottom: 12px;
      backdrop-filter: blur(8px);
      display: flex;
      align-items: center;
      justify-content: space-between;
    `

    row.innerHTML = `
      <div style="display: flex; align-items: center; gap: 12px;">
        <div style="font-size: 32px;">${friend.avatar}</div>
        <div>
          <div style="font-size: 14px; font-weight: 600; color: #fff;">${friend.username}</div>
          <div style="font-size: 12px; color: rgba(255,255,255,.5);">${friend.totalWarps} warps</div>
        </div>
      </div>
      <button style="
        background: rgba(255,255,255,.05);
        border: 1px solid rgba(172,120,255,.3);
        color: #a864ff;
        padding: 8px 16px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 12px;
      ">Remove</button>
    `

    container.appendChild(row)
  })
}

/**
 * User Profile Screen
 */
export function renderUserProfile(userId) {
  const root = document.querySelector('#root')
  root.innerHTML = ''

  const user = new UserProfile(userId)

  const container = document.createElement('div')
  container.style.cssText = `
    width: 100%;
    height: 100%;
    background: linear-gradient(135deg, #0a0612 0%, #1a0a35 50%, #0f0520 100%);
    overflow-y: auto;
    padding-top: 60px;
  `

  // Header
  const header = document.createElement('div')
  header.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    height: 60px;
    background: linear-gradient(180deg, rgba(10,6,18,.8) 0%, rgba(10,6,18,.4) 100%);
    backdrop-filter: blur(12px);
    border-bottom: 1px solid rgba(172,120,255,.1);
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 24px;
    z-index: 100;
  `

  const title = document.createElement('h1')
  title.textContent = 'Profile'
  title.style.cssText = `
    margin: 0;
    font-size: 20px;
    background: linear-gradient(135deg, #a864ff, #6b3fbf);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  `

  const backBtn = document.createElement('button')
  backBtn.textContent = '← Back'
  backBtn.className = 'hud-btn'
  backBtn.onclick = () => window.history.back()

  header.appendChild(title)
  header.appendChild(backBtn)
  container.appendChild(header)

  // Content
  const content = document.createElement('div')
  content.style.cssText = `
    max-width: 600px;
    margin: 0 auto;
    padding: 24px;
  `

  // Profile header
  const profileHeader = document.createElement('div')
  profileHeader.style.cssText = `
    background: rgba(14,12,36,.5);
    border: 1px solid rgba(172,120,255,.15);
    border-radius: 12px;
    padding: 24px;
    text-align: center;
    backdrop-filter: blur(8px);
    margin-bottom: 24px;
  `

  profileHeader.innerHTML = `
    <div style="font-size: 64px; margin-bottom: 12px;">${user.avatar}</div>
    <div style="font-size: 20px; font-weight: 700; color: #fff; margin-bottom: 4px;">${user.username}</div>
    <div style="font-size: 12px; color: rgba(255,255,255,.5); margin-bottom: 16px;">Joined ${new Date(user.joinDate).toLocaleDateString('ja-JP')}</div>
    <div style="display: flex; justify-content: space-around; margin-top: 16px; padding-top: 16px; border-top: 1px solid rgba(172,120,255,.1);">
      <div>
        <div style="font-size: 24px; font-weight: 700; color: #a864ff;">${user.totalWarps}</div>
        <div style="font-size: 12px; color: rgba(255,255,255,.5);">Warps</div>
      </div>
      <div>
        <div style="font-size: 24px; font-weight: 700; color: #a864ff;">${user.friends.length}</div>
        <div style="font-size: 12px; color: rgba(255,255,255,.5);">Friends</div>
      </div>
      <div>
        <div style="font-size: 24px; font-weight: 700; color: #a864ff;">${user.achievements.length}</div>
        <div style="font-size: 12px; color: rgba(255,255,255,.5);">Achievements</div>
      </div>
    </div>
  `

  content.appendChild(profileHeader)

  // Achievements
  const achievementsSection = document.createElement('div')
  achievementsSection.innerHTML = '<h2 style="margin: 0 0 16px 0; font-size: 18px; color: #fff;">🏆 Achievements</h2>'

  const achievementsList = document.createElement('div')
  achievementsList.style.cssText = `
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
    gap: 12px;
  `

  const allAchievements = [
    { id: 'first_warp', name: '初めてのワープ', emoji: '🚀' },
    { id: 'ten_warps', name: '10回ワープ', emoji: '🎯' },
    { id: 'fifty_warps', name: '50回ワープ', emoji: '⭐' },
    { id: 'hundred_warps', name: '100回ワープ', emoji: '👑' },
    { id: 'collector', name: 'コレクター', emoji: '📚' },
    { id: 'social_butterfly', name: 'ソーシャルバタフライ', emoji: '🦋' },
  ]

  allAchievements.forEach(ach => {
    const card = document.createElement('div')
    const unlocked = user.achievements.includes(ach.id)
    card.style.cssText = `
      background: ${unlocked ? 'rgba(168,85,247,.2)' : 'rgba(0,0,0,.3)'};
      border: 1px solid ${unlocked ? 'rgba(172,120,255,.4)' : 'rgba(172,120,255,.1)'};
      border-radius: 8px;
      padding: 12px;
      text-align: center;
      opacity: ${unlocked ? 1 : 0.5};
      transition: all .2s ease;
    `

    card.innerHTML = `
      <div style="font-size: 32px; margin-bottom: 4px;">${ach.emoji}</div>
      <div style="font-size: 11px; color: rgba(255,255,255,.7);">${ach.name}</div>
    `

    achievementsList.appendChild(card)
  })

  achievementsSection.appendChild(achievementsList)
  content.appendChild(achievementsSection)

  container.appendChild(content)
  root.appendChild(container)
}

/**
 * Leaderboard Screen
 */
export function renderLeaderboard() {
  const root = document.querySelector('#root')
  root.innerHTML = ''

  const container = document.createElement('div')
  container.style.cssText = `
    width: 100%;
    height: 100%;
    background: linear-gradient(135deg, #0a0612 0%, #1a0a35 50%, #0f0520 100%);
    overflow-y: auto;
    padding-top: 60px;
  `

  // Header
  const header = document.createElement('div')
  header.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    height: 60px;
    background: linear-gradient(180deg, rgba(10,6,18,.8) 0%, rgba(10,6,18,.4) 100%);
    backdrop-filter: blur(12px);
    border-bottom: 1px solid rgba(172,120,255,.1);
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 24px;
    z-index: 100;
  `

  const title = document.createElement('h1')
  title.textContent = 'Leaderboard'
  title.style.cssText = `
    margin: 0;
    font-size: 20px;
    background: linear-gradient(135deg, #a864ff, #6b3fbf);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  `

  const backBtn = document.createElement('button')
  backBtn.textContent = '← Back'
  backBtn.className = 'hud-btn'
  backBtn.onclick = () => window.history.back()

  header.appendChild(title)
  header.appendChild(backBtn)
  container.appendChild(header)

  // Content
  const content = document.createElement('div')
  content.style.cssText = `
    max-width: 600px;
    margin: 0 auto;
    padding: 24px;
  `

  // Tabs
  const tabs = [
    { id: 'warps', label: '🚀 Most Warps' },
    { id: 'points', label: '⭐ Points' },
    { id: 'friends', label: '👥 Friends' },
  ]

  const tabNav = createTabNav(tabs, (tabId) => {
    renderLeaderboardTab(content, tabId)
  })
  content.appendChild(tabNav)

  const tabContent = document.createElement('div')
  tabContent.id = 'leaderboard-content'
  content.appendChild(tabContent)

  container.appendChild(content)
  root.appendChild(container)

  // Initial render
  renderLeaderboardTab(tabContent, 'warps')
}

function renderLeaderboardTab(container, tabId) {
  container.innerHTML = ''

  if (tabId === 'points') {
    const leaderboard = PointsSystem.getPointsLeaderboard()
    const entries = leaderboard.map((entry, idx) => ({
      rank: idx + 1,
      name: entry.userId,
      score: entry.points,
    }))
    container.appendChild(createLeaderboard(entries, 50))
  } else {
    // Mock data for other tabs
    const entries = [
      { rank: 1, name: 'Traveler_001', score: 152 },
      { rank: 2, name: 'Traveler_002', score: 148 },
      { rank: 3, name: 'Traveler_003', score: 145 },
    ]
    container.appendChild(createLeaderboard(entries, 50))
  }
}

/**
 * Comment Modal
 */
function showCommentModal(recordId) {
  const record = WarpRecord.load(recordId)
  const user = new UserProfile()

  const commentInput = document.createElement('textarea')
  commentInput.placeholder = 'Add a comment...'
  commentInput.style.cssText = `
    width: 100%;
    height: 80px;
    padding: 12px;
    background: rgba(255,255,255,.05);
    border: 1px solid rgba(172,120,255,.2);
    border-radius: 8px;
    color: #fff;
    font-family: inherit;
    resize: none;
  `

  const modal = createModal(
    'Add Comment',
    commentInput,
    [
      {
        label: 'Cancel',
        onClick: () => {},
      },
      {
        label: 'Post',
        primary: true,
        onClick: () => {
          if (commentInput.value.trim()) {
            record.addComment(user.userId, commentInput.value)
            record.save()
            createToast('💬 Comment posted!', 'success')
          }
        },
      },
    ]
  )

  document.body.appendChild(modal)
}
