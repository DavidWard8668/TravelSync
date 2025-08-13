#!/usr/bin/env node

/**
 * Synthetic User Monitoring for Second Chance Recovery App
 * Simulates real user interactions to detect issues before users encounter them
 */

import cron from 'node-cron'
import fetch from 'node-fetch'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Configuration
const CONFIG = {
  baseUrl: process.env.SECOND_CHANCE_URL || 'https://second-chance-recovery.vercel.app',
  monitoringInterval: '*/5 * * * *', // Every 5 minutes
  logFile: path.join(__dirname, '..', 'logs', 'synthetic-monitoring.log'),
  alertsFile: path.join(__dirname, '..', 'logs', 'alerts.log'),
  timeout: 30000, // 30 seconds
  maxRetries: 3,
  criticalEndpoints: [
    '/',
    '/crisis-support',
    '/recovery',
    '/resources',
    '/api/health'
  ]
}

// Ensure logs directory exists
const logsDir = path.dirname(CONFIG.logFile)
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true })
}

class SyntheticMonitor {
  constructor() {
    this.isRunning = false
    this.cronJob = null
    this.testResults = []
  }

  log(level, message, data = null) {
    const timestamp = new Date().toISOString()
    const logEntry = {
      timestamp,
      level,
      message,
      data
    }
    
    console.log(`[${timestamp}] ${level.toUpperCase()}: ${message}`)
    
    // Write to log file
    const logLine = `${timestamp} [${level.toUpperCase()}] ${message}${data ? ` | Data: ${JSON.stringify(data)}` : ''}\\n`
    fs.appendFileSync(CONFIG.logFile, logLine)
    
    // Write alerts to separate file
    if (level === 'error' || level === 'critical') {
      fs.appendFileSync(CONFIG.alertsFile, logLine)
    }
  }

  async checkEndpoint(url, testName = 'HTTP Check') {
    const startTime = Date.now()
    const fullUrl = `${CONFIG.baseUrl}${url}`
    
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), CONFIG.timeout)
      
      const response = await fetch(fullUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'Second-Chance-Synthetic-Monitor/1.0',
          'Accept': 'text/html,application/json',
        },
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      const responseTime = Date.now() - startTime
      
      const result = {
        testName,
        url: fullUrl,
        status: response.status,
        responseTime,
        success: response.ok,
        timestamp: new Date().toISOString()
      }
      
      if (response.ok) {
        this.log('info', `✅ ${testName} passed`, result)
      } else {
        this.log('error', `❌ ${testName} failed - HTTP ${response.status}`, result)
      }
      
      return result
      
    } catch (error) {
      const responseTime = Date.now() - startTime
      const result = {
        testName,
        url: fullUrl,
        error: error.message,
        responseTime,
        success: false,
        timestamp: new Date().toISOString()
      }
      
      this.log('error', `❌ ${testName} failed - ${error.message}`, result)
      return result
    }
  }

  async checkCrisisFeatures() {
    const tests = []
    
    // Check crisis banner endpoint
    tests.push(await this.checkEndpoint('/api/crisis-resources', 'Crisis Resources API'))
    
    // Check 988 integration
    tests.push(await this.checkEndpoint('/crisis-support', 'Crisis Support Page'))
    
    // Check local resources API
    tests.push(await this.checkEndpoint('/api/local-resources?lat=40.7128&lng=-74.0060', 'Local Resources API'))
    
    return tests
  }

  async checkRecoveryFeatures() {
    const tests = []
    
    // Check recovery dashboard
    tests.push(await this.checkEndpoint('/recovery', 'Recovery Dashboard'))
    
    // Check progress tracking
    tests.push(await this.checkEndpoint('/api/progress', 'Progress Tracking API'))
    
    // Check goal management
    tests.push(await this.checkEndpoint('/api/goals', 'Goals API'))
    
    return tests
  }

  async checkPrivacyFeatures() {
    const tests = []
    
    // Check privacy policy
    tests.push(await this.checkEndpoint('/privacy', 'Privacy Policy'))
    
    // Check data encryption status
    tests.push(await this.checkEndpoint('/api/encryption-status', 'Encryption Status'))
    
    return tests
  }

  async checkOfflineCapabilities() {
    const tests = []
    
    // Check service worker registration
    tests.push(await this.checkEndpoint('/sw.js', 'Service Worker'))
    
    // Check offline manifest
    tests.push(await this.checkEndpoint('/manifest.json', 'Web App Manifest'))
    
    return tests
  }

  async runComprehensiveCheck() {
    this.log('info', '🚀 Starting comprehensive synthetic monitoring check')
    const allResults = []
    
    // Core endpoint checks
    for (const endpoint of CONFIG.criticalEndpoints) {
      const result = await this.checkEndpoint(endpoint, `Core Endpoint: ${endpoint}`)
      allResults.push(result)
      
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    
    // Feature-specific checks
    const crisisResults = await this.checkCrisisFeatures()
    const recoveryResults = await this.checkRecoveryFeatures()
    const privacyResults = await this.checkPrivacyFeatures()
    const offlineResults = await this.checkOfflineCapabilities()
    
    allResults.push(...crisisResults, ...recoveryResults, ...privacyResults, ...offlineResults)
    
    // Analyze results
    const successCount = allResults.filter(r => r.success).length
    const totalCount = allResults.length
    const successRate = ((successCount / totalCount) * 100).toFixed(2)
    const avgResponseTime = (allResults
      .filter(r => r.responseTime)
      .reduce((sum, r) => sum + r.responseTime, 0) / allResults.length).toFixed(2)
    
    const summary = {
      timestamp: new Date().toISOString(),
      totalTests: totalCount,
      successfulTests: successCount,
      failedTests: totalCount - successCount,
      successRate: `${successRate}%`,
      averageResponseTime: `${avgResponseTime}ms`,
      results: allResults
    }
    
    // Log summary
    if (successCount === totalCount) {
      this.log('info', `✅ All ${totalCount} synthetic tests passed (${successRate}% success rate, ${avgResponseTime}ms avg response)`)
    } else {
      this.log('error', `❌ ${totalCount - successCount}/${totalCount} synthetic tests failed (${successRate}% success rate)`)
    }
    
    // Save detailed results
    const resultsFile = path.join(__dirname, '..', 'logs', `synthetic-results-${Date.now()}.json`)
    fs.writeFileSync(resultsFile, JSON.stringify(summary, null, 2))
    
    // Store for trend analysis
    this.testResults.push(summary)
    
    // Keep only last 24 hours of results
    const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000)
    this.testResults = this.testResults.filter(r => new Date(r.timestamp).getTime() > oneDayAgo)
    
    return summary
  }

  async checkHealthTrends() {
    if (this.testResults.length < 2) return
    
    const recent = this.testResults.slice(-10) // Last 10 checks
    const avgSuccessRate = recent.reduce((sum, r) => sum + parseFloat(r.successRate), 0) / recent.length
    const avgResponseTime = recent.reduce((sum, r) => sum + parseFloat(r.averageResponseTime), 0) / recent.length
    
    // Alert on trends
    if (avgSuccessRate < 95) {
      this.log('critical', `🚨 Success rate trending down: ${avgSuccessRate.toFixed(2)}% over last ${recent.length} checks`)
    }
    
    if (avgResponseTime > 5000) {
      this.log('error', `⚠️ Response time trending up: ${avgResponseTime.toFixed(2)}ms average`)
    }
  }

  start() {
    if (this.isRunning) {
      this.log('warn', 'Synthetic monitoring is already running')
      return
    }
    
    this.log('info', '🎯 Starting Second Chance synthetic monitoring')
    this.log('info', `📊 Monitoring URL: ${CONFIG.baseUrl}`)
    this.log('info', `⏰ Check interval: ${CONFIG.monitoringInterval}`)
    
    // Run initial check
    this.runComprehensiveCheck()
    
    // Schedule recurring checks
    this.cronJob = cron.schedule(CONFIG.monitoringInterval, async () => {
      try {
        await this.runComprehensiveCheck()
        await this.checkHealthTrends()
      } catch (error) {
        this.log('error', 'Error during scheduled synthetic check', { error: error.message })
      }
    }, {
      scheduled: true,
      timezone: 'America/New_York'
    })
    
    this.isRunning = true
    this.log('info', '✅ Synthetic monitoring started successfully')
  }

  stop() {
    if (!this.isRunning) {
      this.log('warn', 'Synthetic monitoring is not running')
      return
    }
    
    if (this.cronJob) {
      this.cronJob.destroy()
      this.cronJob = null
    }
    
    this.isRunning = false
    this.log('info', '🛑 Synthetic monitoring stopped')
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      lastResults: this.testResults.slice(-5), // Last 5 results
      totalChecks: this.testResults.length
    }
  }
}

// CLI interface
const args = process.argv.slice(2)
const command = args[0]

const monitor = new SyntheticMonitor()

switch (command) {
  case 'start':
    monitor.start()
    break
  
  case 'stop':
    monitor.stop()
    process.exit(0)
    break
  
  case 'status':
    console.log(JSON.stringify(monitor.getStatus(), null, 2))
    process.exit(0)
    break
  
  case 'test':
    monitor.runComprehensiveCheck().then(() => process.exit(0))
    break
  
  default:
    console.log('Second Chance Synthetic Monitoring')
    console.log('Usage:')
    console.log('  node synthetic-monitoring.js start   - Start continuous monitoring')
    console.log('  node synthetic-monitoring.js stop    - Stop monitoring')
    console.log('  node synthetic-monitoring.js status  - Show current status')
    console.log('  node synthetic-monitoring.js test    - Run one-time test')
    process.exit(1)
}

// Keep process alive when starting
if (command === 'start') {
  process.on('SIGINT', () => {
    console.log('\\nReceived SIGINT, stopping synthetic monitoring...')
    monitor.stop()
    process.exit(0)
  })
  
  process.on('SIGTERM', () => {
    console.log('\\nReceived SIGTERM, stopping synthetic monitoring...')
    monitor.stop()
    process.exit(0)
  })
}