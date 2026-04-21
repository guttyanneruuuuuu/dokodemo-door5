/**
 * WARPDOOR v6 DEBUG
 * Simplified version to test module loading
 */

console.log('🔍 [DEBUG] warpdoor-debug.js loaded')

// Check if THREE is available
console.log('🔍 [DEBUG] THREE available:', typeof THREE !== 'undefined')

if (typeof THREE === 'undefined') {
  console.error('❌ [ERROR] THREE is not defined. Check importmap.')
  document.body.innerHTML = '<h1>ERROR: Three.js failed to load</h1>'
  throw new Error('THREE not defined')
}

console.log('✅ [DEBUG] THREE loaded successfully')
console.log('✅ [DEBUG] THREE.Scene:', typeof THREE.Scene)

// Try to import worlds
console.log('🔍 [DEBUG] Attempting to import worlds.js...')

import('./worlds.js')
  .then(module => {
    console.log('✅ [DEBUG] worlds.js imported successfully')
    console.log('✅ [DEBUG] WORLDS:', module.WORLDS?.length, 'worlds')
    console.log('✅ [DEBUG] SCENE_BUILDERS:', typeof module.SCENE_BUILDERS)
    
    // Initialize the app
    initApp(module.WORLDS, module.SCENE_BUILDERS)
  })
  .catch(err => {
    console.error('❌ [ERROR] Failed to import worlds.js:', err)
    document.body.innerHTML = `<h1>ERROR: Failed to load worlds.js</h1><pre>${err.message}</pre>`
  })

/**
 * Initialize the app
 */
function initApp(WORLDS, SCENE_BUILDERS) {
  console.log('🚀 [DEBUG] Initializing app...')
  
  const root = document.getElementById('root')
  if (!root) {
    console.error('❌ [ERROR] #root element not found')
    return
  }
  
  console.log('✅ [DEBUG] #root element found')
  
  // Create a simple landing page
  root.innerHTML = `
    <div style="
      width: 100%;
      height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #0a0e27 0%, #1a1a3e 100%);
      color: white;
      font-family: 'Syne', sans-serif;
    ">
      <h1 style="font-size: 4rem; margin: 0; text-shadow: 0 0 20px rgba(0, 212, 255, 0.5);">🚪 WARPDOOR</h1>
      <p style="font-size: 1.2rem; margin-top: 1rem; opacity: 0.8;">v6.0 — 時空間3D没入体験</p>
      <p style="margin-top: 2rem; font-size: 1rem;">✅ All systems operational</p>
      <p style="margin-top: 0.5rem; font-size: 0.9rem; opacity: 0.6;">Worlds loaded: ${WORLDS.length}</p>
      <button style="
        margin-top: 2rem;
        padding: 12px 32px;
        font-size: 1rem;
        background: linear-gradient(135deg, #00d4ff, #ff4488);
        border: none;
        border-radius: 8px;
        color: white;
        cursor: pointer;
        font-weight: bold;
        transition: all 0.3s;
      " onclick="
        this.textContent = '⏳ Loading...';
        this.disabled = true;
        setTimeout(() => {
          alert('✨ Warp initiated! (Demo mode)');
          this.textContent = '🎲 Warp Again';
          this.disabled = false;
        }, 1000);
      ">🎲 Random Warp</button>
      <div style="margin-top: 3rem; display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem;">
        ${WORLDS.slice(0, 6).map(w => `
          <div style="
            padding: 1rem;
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 8px;
            text-align: center;
            cursor: pointer;
            transition: all 0.3s;
          " onmouseover="this.style.background='rgba(255, 255, 255, 0.1)'" onmouseout="this.style.background='rgba(255, 255, 255, 0.05)'">
            <div style="font-size: 2rem;">${w.emoji}</div>
            <div style="font-size: 0.9rem; margin-top: 0.5rem;">${w.name}</div>
          </div>
        `).join('')}
      </div>
    </div>
  `
  
  console.log('✅ [DEBUG] Landing page rendered')
}
