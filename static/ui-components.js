// WARPDOOR UI Components v8
// Responsive components for mobile & desktop
// ============================================================

/**
 * Create a responsive modal
 */
export function createModal(title, content, actions = []) {
  const overlay = document.createElement('div')
  overlay.className = 'modal-overlay'
  overlay.style.cssText = `
    position: fixed; inset: 0; background: rgba(0,0,0,.7);
    display: flex; align-items: center; justify-content: center;
    z-index: 1000; backdrop-filter: blur(4px);
  `

  const modal = document.createElement('div')
  modal.className = 'modal'
  modal.style.cssText = `
    background: linear-gradient(135deg, #1a0a35 0%, #2a1550 100%);
    border: 1px solid rgba(172,120,255,.3);
    border-radius: 12px;
    padding: 32px;
    max-width: 90vw;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: 0 20px 60px rgba(0,0,0,.5);
    animation: slideUp .3s ease;
  `

  const titleEl = document.createElement('h2')
  titleEl.textContent = title
  titleEl.style.cssText = `
    margin: 0 0 16px 0;
    font-size: 24px;
    color: #fff;
    font-family: 'Syne', serif;
  `
  modal.appendChild(titleEl)

  const contentEl = document.createElement('div')
  contentEl.className = 'modal-content'
  if (typeof content === 'string') {
    contentEl.innerHTML = content
  } else {
    contentEl.appendChild(content)
  }
  contentEl.style.cssText = `
    color: rgba(255,255,255,.8);
    margin-bottom: 24px;
    line-height: 1.6;
  `
  modal.appendChild(contentEl)

  if (actions.length > 0) {
    const actionsEl = document.createElement('div')
    actionsEl.className = 'modal-actions'
    actionsEl.style.cssText = `
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
    `

    actions.forEach(action => {
      const btn = document.createElement('button')
      btn.textContent = action.label
      btn.className = 'modal-btn' + (action.primary ? ' primary' : '')
      btn.style.cssText = `
        flex: 1;
        min-width: 120px;
        padding: 12px 20px;
        border: 1px solid rgba(172,120,255,.4);
        background: ${action.primary ? 'linear-gradient(135deg, #6b3fbf 0%, #b878ff 100%)' : 'rgba(255,255,255,.05)'};
        color: #fff;
        border-radius: 8px;
        cursor: pointer;
        font-size: 14px;
        transition: all .2s ease;
      `
      btn.onmouseover = () => {
        btn.style.background = action.primary ? 'linear-gradient(135deg, #7a4fcf 0%, #c888ff 100%)' : 'rgba(255,255,255,.1)'
      }
      btn.onmouseout = () => {
        btn.style.background = action.primary ? 'linear-gradient(135deg, #6b3fbf 0%, #b878ff 100%)' : 'rgba(255,255,255,.05)'
      }
      btn.onclick = () => {
        action.onClick()
        overlay.remove()
      }
      actionsEl.appendChild(btn)
    })

    modal.appendChild(actionsEl)
  }

  overlay.appendChild(modal)
  overlay.onclick = (e) => {
    if (e.target === overlay) overlay.remove()
  }

  return overlay
}

/**
 * Create a toast notification
 */
export function createToast(message, type = 'info', duration = 3000) {
  const toast = document.createElement('div')
  toast.className = `toast toast-${type}`
  toast.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    padding: 16px 24px;
    background: ${type === 'success' ? '#4afc9e' : type === 'error' ? '#ff6b6b' : '#a864ff'};
    color: ${type === 'success' ? '#000' : '#fff'};
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,.3);
    animation: slideIn .3s ease;
    z-index: 999;
    max-width: 90vw;
    word-wrap: break-word;
  `
  toast.textContent = message

  document.body.appendChild(toast)

  setTimeout(() => {
    toast.style.animation = 'slideOut .3s ease'
    setTimeout(() => toast.remove(), 300)
  }, duration)

  return toast
}

/**
 * Create a loading spinner
 */
export function createSpinner() {
  const spinner = document.createElement('div')
  spinner.className = 'spinner'
  spinner.style.cssText = `
    width: 40px;
    height: 40px;
    border: 4px solid rgba(172,120,255,.2);
    border-top-color: #a864ff;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  `
  return spinner
}

/**
 * Create a location card
 */
export function createLocationCard(location, onSelect) {
  const card = document.createElement('div')
  card.className = 'location-card'
  card.style.cssText = `
    background: rgba(14,12,36,.6);
    border: 1px solid rgba(172,120,255,.2);
    border-radius: 12px;
    padding: 16px;
    cursor: pointer;
    transition: all .2s ease;
    backdrop-filter: blur(8px);
  `

  card.innerHTML = `
    <div style="font-size: 32px; margin-bottom: 8px;">📍</div>
    <div style="font-size: 16px; color: #fff; font-weight: 600; margin-bottom: 4px;">${location.name}</div>
    <div style="font-size: 12px; color: rgba(255,255,255,.6); margin-bottom: 8px;">${location.desc}</div>
    <div style="display: flex; gap: 8px; flex-wrap: wrap;">
      <span style="font-size: 11px; background: rgba(172,120,255,.2); color: #a864ff; padding: 4px 8px; border-radius: 4px;">${location.category}</span>
      <span style="font-size: 11px; background: rgba(172,120,255,.1); color: rgba(255,255,255,.6); padding: 4px 8px; border-radius: 4px;">${location.country}</span>
    </div>
  `

  card.onmouseover = () => {
    card.style.background = 'rgba(14,12,36,.8)'
    card.style.borderColor = 'rgba(172,120,255,.4)'
    card.style.transform = 'translateY(-4px)'
  }

  card.onmouseout = () => {
    card.style.background = 'rgba(14,12,36,.6)'
    card.style.borderColor = 'rgba(172,120,255,.2)'
    card.style.transform = 'translateY(0)'
  }

  card.onclick = () => onSelect(location)

  return card
}

/**
 * Create a warp record card (for social feed)
 */
export function createWarpRecordCard(record, user, onLike, onComment) {
  const card = document.createElement('div')
  card.className = 'warp-record-card'
  card.style.cssText = `
    background: rgba(14,12,36,.5);
    border: 1px solid rgba(172,120,255,.15);
    border-radius: 12px;
    padding: 16px;
    margin-bottom: 12px;
    backdrop-filter: blur(8px);
  `

  const header = document.createElement('div')
  header.style.cssText = `
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 12px;
  `

  const avatar = document.createElement('div')
  avatar.textContent = user.avatar
  avatar.style.cssText = `
    font-size: 32px;
  `

  const userInfo = document.createElement('div')
  userInfo.innerHTML = `
    <div style="color: #fff; font-weight: 600;">${user.username}</div>
    <div style="font-size: 12px; color: rgba(255,255,255,.5);">${new Date(record.timestamp).toLocaleDateString('ja-JP')}</div>
  `

  header.appendChild(avatar)
  header.appendChild(userInfo)
  card.appendChild(header)

  const content = document.createElement('div')
  content.innerHTML = `
    <div style="font-size: 18px; color: #fff; font-weight: 600; margin-bottom: 4px;">${record.locationName}</div>
    <div style="font-size: 14px; color: rgba(255,255,255,.7); margin-bottom: 12px;">${record.description}</div>
  `
  card.appendChild(content)

  const actions = document.createElement('div')
  actions.style.cssText = `
    display: flex;
    gap: 12px;
    font-size: 12px;
  `

  const likeBtn = document.createElement('button')
  likeBtn.textContent = `❤️ ${record.likes}`
  likeBtn.style.cssText = `
    background: none;
    border: none;
    color: rgba(255,255,255,.6);
    cursor: pointer;
    padding: 0;
    transition: color .2s ease;
  `
  likeBtn.onmouseover = () => likeBtn.style.color = '#ff6b6b'
  likeBtn.onmouseout = () => likeBtn.style.color = 'rgba(255,255,255,.6)'
  likeBtn.onclick = () => onLike(record.id)

  const commentBtn = document.createElement('button')
  commentBtn.textContent = `💬 ${record.comments.length}`
  commentBtn.style.cssText = `
    background: none;
    border: none;
    color: rgba(255,255,255,.6);
    cursor: pointer;
    padding: 0;
    transition: color .2s ease;
  `
  commentBtn.onmouseover = () => commentBtn.style.color = '#a864ff'
  commentBtn.onmouseout = () => commentBtn.style.color = 'rgba(255,255,255,.6)'
  commentBtn.onclick = () => onComment(record.id)

  actions.appendChild(likeBtn)
  actions.appendChild(commentBtn)
  card.appendChild(actions)

  return card
}

/**
 * Create a leaderboard
 */
export function createLeaderboard(entries, limit = 10) {
  const board = document.createElement('div')
  board.className = 'leaderboard'
  board.style.cssText = `
    background: rgba(14,12,36,.5);
    border: 1px solid rgba(172,120,255,.15);
    border-radius: 12px;
    padding: 16px;
    backdrop-filter: blur(8px);
  `

  const title = document.createElement('h3')
  title.textContent = 'ランキング'
  title.style.cssText = `
    margin: 0 0 16px 0;
    color: #fff;
    font-size: 18px;
  `
  board.appendChild(title)

  entries.slice(0, limit).forEach((entry, idx) => {
    const row = document.createElement('div')
    row.style.cssText = `
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 0;
      border-bottom: 1px solid rgba(172,120,255,.1);
    `

    const rank = document.createElement('div')
    rank.textContent = idx + 1
    rank.style.cssText = `
      font-size: 20px;
      font-weight: 700;
      color: ${idx === 0 ? '#ffd700' : idx === 1 ? '#c0c0c0' : idx === 2 ? '#cd7f32' : 'rgba(255,255,255,.5)'};
      min-width: 30px;
    `

    const name = document.createElement('div')
    name.textContent = entry.name || 'Unknown'
    name.style.cssText = `
      flex: 1;
      color: #fff;
      margin-left: 12px;
    `

    const score = document.createElement('div')
    score.textContent = entry.score || entry.points || 0
    score.style.cssText = `
      color: #a864ff;
      font-weight: 600;
    `

    row.appendChild(rank)
    row.appendChild(name)
    row.appendChild(score)
    board.appendChild(row)
  })

  return board
}

/**
 * Create a progress bar
 */
export function createProgressBar(current, max, label = '') {
  const container = document.createElement('div')
  container.style.cssText = `
    width: 100%;
  `

  if (label) {
    const labelEl = document.createElement('div')
    labelEl.textContent = label
    labelEl.style.cssText = `
      font-size: 12px;
      color: rgba(255,255,255,.6);
      margin-bottom: 4px;
    `
    container.appendChild(labelEl)
  }

  const bar = document.createElement('div')
  bar.style.cssText = `
    width: 100%;
    height: 8px;
    background: rgba(172,120,255,.1);
    border-radius: 4px;
    overflow: hidden;
  `

  const fill = document.createElement('div')
  fill.style.cssText = `
    height: 100%;
    background: linear-gradient(90deg, #a864ff, #6b3fbf);
    width: ${(current / max) * 100}%;
    transition: width .3s ease;
  `

  bar.appendChild(fill)
  container.appendChild(bar)

  return container
}

/**
 * Create a tab navigation
 */
export function createTabNav(tabs, onSelect) {
  const nav = document.createElement('div')
  nav.className = 'tab-nav'
  nav.style.cssText = `
    display: flex;
    gap: 8px;
    border-bottom: 1px solid rgba(172,120,255,.1);
    margin-bottom: 16px;
    overflow-x: auto;
  `

  tabs.forEach((tab, idx) => {
    const btn = document.createElement('button')
    btn.textContent = tab.label
    btn.className = 'tab-btn' + (idx === 0 ? ' active' : '')
    btn.style.cssText = `
      padding: 12px 16px;
      background: none;
      border: none;
      color: ${idx === 0 ? '#a864ff' : 'rgba(255,255,255,.5)'};
      cursor: pointer;
      border-bottom: ${idx === 0 ? '2px solid #a864ff' : 'none'};
      transition: all .2s ease;
      white-space: nowrap;
    `

    btn.onclick = () => {
      document.querySelectorAll('.tab-btn').forEach(b => {
        b.style.color = 'rgba(255,255,255,.5)'
        b.style.borderBottom = 'none'
      })
      btn.style.color = '#a864ff'
      btn.style.borderBottom = '2px solid #a864ff'
      onSelect(tab.id)
    }

    nav.appendChild(btn)
  })

  return nav
}

/**
 * Create a responsive grid
 */
export function createResponsiveGrid(items, renderItem, columns = 3) {
  const grid = document.createElement('div')
  grid.className = 'responsive-grid'
  grid.style.cssText = `
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(${100 / columns}%, 1fr));
    gap: 16px;
  `

  items.forEach(item => {
    grid.appendChild(renderItem(item))
  })

  return grid
}

/**
 * Create a search input
 */
export function createSearchInput(placeholder = 'Search...', onSearch) {
  const container = document.createElement('div')
  container.style.cssText = `
    position: relative;
    margin-bottom: 16px;
  `

  const input = document.createElement('input')
  input.type = 'text'
  input.placeholder = placeholder
  input.style.cssText = `
    width: 100%;
    padding: 12px 16px;
    background: rgba(255,255,255,.05);
    border: 1px solid rgba(172,120,255,.2);
    border-radius: 8px;
    color: #fff;
    font-size: 14px;
    transition: all .2s ease;
  `

  input.onfocus = () => {
    input.style.background = 'rgba(255,255,255,.08)'
    input.style.borderColor = 'rgba(172,120,255,.4)'
  }

  input.onblur = () => {
    input.style.background = 'rgba(255,255,255,.05)'
    input.style.borderColor = 'rgba(172,120,255,.2)'
  }

  input.oninput = (e) => onSearch(e.target.value)

  container.appendChild(input)
  return container
}

/**
 * Add CSS animations
 */
export function injectAnimations() {
  const style = document.createElement('style')
  style.textContent = `
    @keyframes slideUp {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes slideIn {
      from { opacity: 0; transform: translateX(100%); }
      to { opacity: 1; transform: translateX(0); }
    }
    @keyframes slideOut {
      from { opacity: 1; transform: translateX(0); }
      to { opacity: 0; transform: translateX(100%); }
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `
  document.head.appendChild(style)
}

// Initialize animations on load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', injectAnimations)
} else {
  injectAnimations()
}
