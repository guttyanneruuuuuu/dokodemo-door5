// WARPDOOR Performance & Analytics v8
// Performance monitoring, metrics collection, and analytics
// ============================================================

/**
 * Performance Monitor
 */
export class PerformanceMonitor {
  constructor() {
    this.metrics = {
      fps: [],
      loadTime: 0,
      renderTime: [],
      memoryUsage: [],
    }
    this.isMonitoring = false
  }

  startFPSMonitoring() {
    if (this.isMonitoring) return
    this.isMonitoring = true

    let lastTime = performance.now()
    let frameCount = 0

    const measureFrame = () => {
      const now = performance.now()
      const deltaTime = now - lastTime

      if (deltaTime >= 1000) {
        const fps = Math.round((frameCount * 1000) / deltaTime)
        this.metrics.fps.push(fps)
        frameCount = 0
        lastTime = now
      } else {
        frameCount++
      }

      requestAnimationFrame(measureFrame)
    }

    requestAnimationFrame(measureFrame)
  }

  getAverageFPS() {
    if (this.metrics.fps.length === 0) return 0
    const sum = this.metrics.fps.reduce((a, b) => a + b, 0)
    return Math.round(sum / this.metrics.fps.length)
  }

  getAverageRenderTime() {
    if (this.metrics.renderTime.length === 0) return 0
    const sum = this.metrics.renderTime.reduce((a, b) => a + b, 0)
    return (sum / this.metrics.renderTime.length).toFixed(2)
  }

  recordRenderTime(ms) {
    this.metrics.renderTime.push(ms)
    if (this.metrics.renderTime.length > 100) {
      this.metrics.renderTime.shift()
    }
  }

  recordMemoryUsage() {
    if (performance.memory) {
      const used = (performance.memory.usedJSHeapSize / 1048576).toFixed(2)
      this.metrics.memoryUsage.push(parseFloat(used))
      if (this.metrics.memoryUsage.length > 100) {
        this.metrics.memoryUsage.shift()
      }
    }
  }

  getMetrics() {
    return {
      avgFPS: this.getAverageFPS(),
      avgRenderTime: this.getAverageRenderTime(),
      avgMemory: this.metrics.memoryUsage.length > 0
        ? (this.metrics.memoryUsage.reduce((a, b) => a + b, 0) / this.metrics.memoryUsage.length).toFixed(2)
        : 0,
      totalFrames: this.metrics.fps.reduce((a, b) => a + b, 0),
    }
  }

  logMetrics() {
    const metrics = this.getMetrics()
    console.log('=== WARPDOOR Performance Metrics ===')
    console.log(`Average FPS: ${metrics.avgFPS}`)
    console.log(`Average Render Time: ${metrics.avgRenderTime}ms`)
    console.log(`Average Memory: ${metrics.avgMemory}MB`)
    console.log(`Total Frames: ${metrics.totalFrames}`)
  }
}

/**
 * Analytics Tracker
 */
export class AnalyticsTracker {
  constructor() {
    this.sessionStart = new Date()
    this.events = []
    this.pageViews = []
    this.storage = this.getStorageManager()
  }

  getStorageManager() {
    return {
      get: (key, def) => {
        try {
          const val = localStorage.getItem('wd_analytics_' + key)
          return val ? JSON.parse(val) : def
        } catch {
          return def
        }
      },
      set: (key, val) => {
        try {
          localStorage.setItem('wd_analytics_' + key, JSON.stringify(val))
        } catch {}
      },
    }
  }

  trackEvent(eventName, properties = {}) {
    const event = {
      name: eventName,
      properties,
      timestamp: new Date().toISOString(),
      sessionId: this.getSessionId(),
    }

    this.events.push(event)

    // Keep last 1000 events
    if (this.events.length > 1000) {
      this.events.shift()
    }

    // Persist to storage
    const allEvents = this.storage.get('events', [])
    allEvents.push(event)
    this.storage.set('events', allEvents.slice(-5000))
  }

  trackPageView(pageName) {
    const pageView = {
      page: pageName,
      timestamp: new Date().toISOString(),
      sessionId: this.getSessionId(),
      referrer: document.referrer,
    }

    this.pageViews.push(pageView)

    // Persist to storage
    const allPageViews = this.storage.get('pageViews', [])
    allPageViews.push(pageView)
    this.storage.set('pageViews', allPageViews.slice(-1000))
  }

  trackError(errorMessage, errorStack) {
    this.trackEvent('error', {
      message: errorMessage,
      stack: errorStack,
      url: window.location.href,
      userAgent: navigator.userAgent,
    })
  }

  getSessionId() {
    let sessionId = this.storage.get('sessionId')
    if (!sessionId) {
      sessionId = 'session_' + Math.random().toString(36).substr(2, 12)
      this.storage.set('sessionId', sessionId)
    }
    return sessionId
  }

  getSessionDuration() {
    const now = new Date()
    return Math.round((now - this.sessionStart) / 1000) // seconds
  }

  getEventStats() {
    const stats = {}
    this.events.forEach(event => {
      stats[event.name] = (stats[event.name] || 0) + 1
    })
    return stats
  }

  getConversionFunnel() {
    const funnel = {
      landing: 0,
      door: 0,
      warp: 0,
      world: 0,
    }

    this.pageViews.forEach(view => {
      if (view.page === 'landing') funnel.landing++
      else if (view.page === 'door') funnel.door++
      else if (view.page === 'warp') funnel.warp++
      else if (view.page === 'world') funnel.world++
    })

    return funnel
  }

  exportAnalytics() {
    return {
      version: '1.0',
      exportDate: new Date().toISOString(),
      sessionId: this.getSessionId(),
      sessionDuration: this.getSessionDuration(),
      events: this.events,
      pageViews: this.pageViews,
      eventStats: this.getEventStats(),
      conversionFunnel: this.getConversionFunnel(),
    }
  }
}

/**
 * A/B Testing Framework
 */
export class ABTestManager {
  constructor() {
    this.tests = {}
    this.storage = this.getStorageManager()
  }

  getStorageManager() {
    return {
      get: (key, def) => {
        try {
          const val = localStorage.getItem('wd_abtest_' + key)
          return val ? JSON.parse(val) : def
        } catch {
          return def
        }
      },
      set: (key, val) => {
        try {
          localStorage.setItem('wd_abtest_' + key, JSON.stringify(val))
        } catch {}
      },
    }
  }

  createTest(testId, variants, distribution = {}) {
    const variant = this.assignVariant(testId, variants, distribution)
    this.tests[testId] = {
      id: testId,
      variant,
      variants,
      assignedAt: new Date().toISOString(),
    }
    this.storage.set(`test_${testId}`, this.tests[testId])
    return variant
  }

  assignVariant(testId, variants, distribution) {
    // Check if already assigned
    const existing = this.storage.get(`test_${testId}`)
    if (existing) return existing.variant

    // Assign new variant
    const rand = Math.random()
    let cumulative = 0

    for (const variant of variants) {
      const weight = distribution[variant] || (1 / variants.length)
      cumulative += weight
      if (rand <= cumulative) {
        return variant
      }
    }

    return variants[0]
  }

  trackTestConversion(testId, conversionValue = 1) {
    const test = this.tests[testId]
    if (!test) return

    this.storage.set(`test_${testId}_conversion`, {
      variant: test.variant,
      value: conversionValue,
      timestamp: new Date().toISOString(),
    })
  }

  getTestResults(testId) {
    const test = this.storage.get(`test_${testId}`)
    const conversion = this.storage.get(`test_${testId}_conversion`)

    return {
      testId,
      assignedVariant: test?.variant,
      converted: !!conversion,
      conversionValue: conversion?.value || 0,
    }
  }
}

/**
 * Heat Map Tracker (simplified)
 */
export class HeatMapTracker {
  constructor() {
    this.clicks = []
    this.hovers = []
    this.storage = this.getStorageManager()
  }

  getStorageManager() {
    return {
      get: (key, def) => {
        try {
          const val = localStorage.getItem('wd_heatmap_' + key)
          return val ? JSON.parse(val) : def
        } catch {
          return def
        }
      },
      set: (key, val) => {
        try {
          localStorage.setItem('wd_heatmap_' + key, JSON.stringify(val))
        } catch {}
      },
    }
  }

  trackClick(x, y, element) {
    const click = {
      x: Math.round(x),
      y: Math.round(y),
      element: element?.className || 'unknown',
      timestamp: new Date().toISOString(),
    }

    this.clicks.push(click)

    // Persist
    const allClicks = this.storage.get('clicks', [])
    allClicks.push(click)
    this.storage.set('clicks', allClicks.slice(-1000))
  }

  trackHover(x, y, element) {
    const hover = {
      x: Math.round(x),
      y: Math.round(y),
      element: element?.className || 'unknown',
      timestamp: new Date().toISOString(),
    }

    this.hovers.push(hover)

    // Persist (sample every 10th hover)
    if (this.hovers.length % 10 === 0) {
      const allHovers = this.storage.get('hovers', [])
      allHovers.push(hover)
      this.storage.set('hovers', allHovers.slice(-5000))
    }
  }

  getHotspots() {
    const hotspots = {}

    this.clicks.forEach(click => {
      const key = `${click.x},${click.y}`
      hotspots[key] = (hotspots[key] || 0) + 1
    })

    return Object.entries(hotspots)
      .map(([pos, count]) => {
        const [x, y] = pos.split(',').map(Number)
        return { x, y, intensity: count }
      })
      .sort((a, b) => b.intensity - a.intensity)
      .slice(0, 20)
  }
}

/**
 * Global instances
 */
export const performanceMonitor = new PerformanceMonitor()
export const analyticsTracker = new AnalyticsTracker()
export const abTestManager = new ABTestManager()
export const heatMapTracker = new HeatMapTracker()

/**
 * Initialize analytics
 */
export function initializeAnalytics() {
  // Start FPS monitoring
  performanceMonitor.startFPSMonitoring()

  // Track page views
  analyticsTracker.trackPageView('landing')

  // Track errors
  window.addEventListener('error', (event) => {
    analyticsTracker.trackError(event.message, event.error?.stack)
  })

  // Track unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    analyticsTracker.trackError('Unhandled Promise Rejection', event.reason)
  })

  // Track visibility changes
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      analyticsTracker.trackEvent('session_pause', {
        duration: analyticsTracker.getSessionDuration(),
      })
    } else {
      analyticsTracker.trackEvent('session_resume')
    }
  })

  // Periodic memory monitoring
  setInterval(() => {
    performanceMonitor.recordMemoryUsage()
  }, 5000)

  // Log metrics every 30 seconds
  setInterval(() => {
    performanceMonitor.logMetrics()
  }, 30000)

  console.log('Analytics initialized')
}

/**
 * Get analytics summary
 */
export function getAnalyticsSummary() {
  return {
    performance: performanceMonitor.getMetrics(),
    analytics: {
      sessionDuration: analyticsTracker.getSessionDuration(),
      eventStats: analyticsTracker.getEventStats(),
      conversionFunnel: analyticsTracker.getConversionFunnel(),
    },
    hotspots: heatMapTracker.getHotspots(),
  }
}
