#!/usr/bin/env node

/**
 * Second Chance Recovery App - Bug Reporter System
 * Email notification system for critical issues and test failures
 */

import nodemailer from 'nodemailer'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Configuration
const CONFIG = {
  // Email configuration (use environment variables in production)
  smtp: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER || 'your-email@gmail.com',
      pass: process.env.SMTP_PASS || 'your-app-password'
    }
  },
  
  // Recipients for different alert types
  recipients: {
    critical: [
      process.env.ALERT_CRITICAL_EMAIL || 'david@secondchance.dev',
      'admin@secondchance.dev'
    ],
    warnings: [
      process.env.ALERT_WARNING_EMAIL || 'dev-team@secondchance.dev'
    ],
    reports: [
      process.env.ALERT_REPORT_EMAIL || 'reports@secondchance.dev'
    ]
  },
  
  // Rate limiting
  rateLimits: {
    critical: 5 * 60 * 1000, // 5 minutes between critical alerts
    warning: 15 * 60 * 1000, // 15 minutes between warnings
    report: 60 * 60 * 1000   // 1 hour between reports
  },
  
  // Project info
  project: {
    name: 'Second Chance Recovery App',
    url: process.env.SECOND_CHANCE_URL || 'https://second-chance-recovery.vercel.app',
    repository: 'https://github.com/david/second-chance-recovery',
    dashboardUrl: process.env.DASHBOARD_URL || 'http://localhost:3000/admin'
  }
}

// Rate limiting storage
const rateLimitStore = new Map()
const logFile = path.join(__dirname, '..', 'logs', 'bug-reporter.log')

// Ensure logs directory exists
const logsDir = path.dirname(logFile)
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true })
}

class BugReporter {
  constructor() {
    this.transporter = null
    this.initializeTransporter()
  }

  async initializeTransporter() {
    try {
      this.transporter = nodemailer.createTransporter(CONFIG.smtp)
      
      // Verify connection
      await this.transporter.verify()
      this.log('info', 'Email transporter initialized successfully')
      
    } catch (error) {
      this.log('error', `Failed to initialize email transporter: ${error.message}`)
      console.error('Email configuration error:', error.message)
    }
  }

  log(level, message, data = null) {
    const timestamp = new Date().toISOString()
    const logEntry = `[${timestamp}] [${level.toUpperCase()}] ${message}${data ? ` | ${JSON.stringify(data)}` : ''}\\n`
    
    console.log(`[${level.toUpperCase()}] ${message}`)
    
    try {
      fs.appendFileSync(logFile, logEntry)
    } catch (error) {
      console.error('Failed to write to log file:', error.message)
    }
  }

  checkRateLimit(alertType) {
    const now = Date.now()
    const key = `${alertType}-ratelimit`
    const lastSent = rateLimitStore.get(key)
    const rateLimit = CONFIG.rateLimits[alertType] || CONFIG.rateLimits.warning
    
    if (lastSent && (now - lastSent) < rateLimit) {
      return false // Rate limited
    }
    
    rateLimitStore.set(key, now)
    return true
  }

  generateEmailTemplate(type, data) {
    const templates = {
      criticalFailure: this.generateCriticalFailureEmail(data),
      testFailure: this.generateTestFailureEmail(data),
      crisisSystemDown: this.generateCrisisSystemDownEmail(data),
      performanceIssue: this.generatePerformanceIssueEmail(data),
      securityAlert: this.generateSecurityAlertEmail(data),
      dailyReport: this.generateDailyReportEmail(data)
    }
    
    return templates[type] || this.generateGenericAlertEmail(data)
  }

  generateCriticalFailureEmail(data) {
    return {
      subject: `🚨 CRITICAL: Second Chance Crisis System Failure`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #dc2626; color: white; padding: 20px; text-align: center;">
            <h1>🚨 CRITICAL SYSTEM FAILURE</h1>
            <p><strong>Second Chance Recovery App</strong></p>
          </div>
          
          <div style="padding: 20px; background: #fef2f2; border-left: 5px solid #dc2626;">
            <h2 style="color: #dc2626;">Crisis Support System Down</h2>
            <p><strong>This is a CRITICAL alert that requires IMMEDIATE attention.</strong></p>
            <p>The crisis support features that help people in mental health emergencies are not functioning properly.</p>
          </div>
          
          <div style="padding: 20px;">
            <h3>Failure Details:</h3>
            <ul>
              <li><strong>Time:</strong> ${data.timestamp || new Date().toISOString()}</li>
              <li><strong>Component:</strong> ${data.component || 'Unknown'}</li>
              <li><strong>Error:</strong> ${data.error || 'No error message'}</li>
              <li><strong>Impact:</strong> ${data.impact || 'Crisis support features unavailable'}</li>
            </ul>
            
            <h3>Immediate Actions Required:</h3>
            <ol>
              <li>Investigate the root cause immediately</li>
              <li>Check 988 hotline integration status</li>
              <li>Verify crisis chat functionality</li>
              <li>Test emergency resources page</li>
              <li>Contact on-call engineer if needed</li>
            </ol>
            
            <div style="margin-top: 20px; padding: 15px; background: #f3f4f6; border-radius: 5px;">
              <h4>Quick Links:</h4>
              <p>
                📊 <a href="${CONFIG.project.dashboardUrl}/monitoring">System Dashboard</a><br>
                🔧 <a href="${CONFIG.project.repository}">Repository</a><br>
                🌐 <a href="${CONFIG.project.url}">Live Site</a><br>
                📞 Emergency Escalation: +1-800-XXX-XXXX
              </p>
            </div>
          </div>
          
          <div style="background: #f9fafb; padding: 20px; text-align: center; font-size: 14px; color: #666;">
            <p>This alert was generated by Second Chance Bug Reporter</p>
            <p>Time: ${new Date().toLocaleString()}</p>
          </div>
        </div>
      `
    }
  }

  generateTestFailureEmail(data) {
    return {
      subject: `⚠️ Second Chance Test Failures: ${data.testSuite || 'Unknown'}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #f59e0b; color: white; padding: 20px; text-align: center;">
            <h1>⚠️ TEST FAILURES DETECTED</h1>
            <p><strong>Second Chance Recovery App</strong></p>
          </div>
          
          <div style="padding: 20px;">
            <h3>Test Failure Summary:</h3>
            <ul>
              <li><strong>Test Suite:</strong> ${data.testSuite || 'Unknown'}</li>
              <li><strong>Failed Tests:</strong> ${data.failedCount || 'Unknown'}</li>
              <li><strong>Total Tests:</strong> ${data.totalCount || 'Unknown'}</li>
              <li><strong>Browser:</strong> ${data.browser || 'Unknown'}</li>
              <li><strong>Environment:</strong> ${data.environment || 'Unknown'}</li>
            </ul>
            
            ${data.criticalFailures ? `
            <div style="padding: 15px; background: #fef2f2; border-left: 5px solid #dc2626; margin: 15px 0;">
              <h4 style="color: #dc2626;">🚨 Critical Test Failures:</h4>
              <ul>
                ${data.criticalFailures.map(failure => `<li>${failure}</li>`).join('')}
              </ul>
            </div>
            ` : ''}
            
            <h3>Failed Test Details:</h3>
            <div style="background: #f9fafb; padding: 15px; border-radius: 5px;">
              <pre style="white-space: pre-wrap; font-size: 12px;">${data.errorDetails || 'No error details available'}</pre>
            </div>
            
            <div style="margin-top: 20px; padding: 15px; background: #f3f4f6; border-radius: 5px;">
              <h4>Next Steps:</h4>
              <ol>
                <li>Review failed test logs</li>
                <li>Check if issues affect critical user journeys</li>
                <li>Run tests locally to reproduce</li>
                <li>Fix failing tests before next deployment</li>
              </ol>
            </div>
          </div>
          
          <div style="background: #f9fafb; padding: 20px; text-align: center; font-size: 14px; color: #666;">
            <p>Generated by Second Chance Test Automation</p>
          </div>
        </div>
      `
    }
  }

  generateCrisisSystemDownEmail(data) {
    return {
      subject: `🚨 URGENT: Crisis Support System Offline - Second Chance`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #7f1d1d; color: white; padding: 20px; text-align: center;">
            <h1>🚨 CRISIS SYSTEM OFFLINE</h1>
            <p style="font-size: 18px;"><strong>IMMEDIATE ACTION REQUIRED</strong></p>
          </div>
          
          <div style="padding: 20px; background: #7f1d1d; color: white;">
            <h2>⚠️ LIFE-CRITICAL SYSTEM FAILURE</h2>
            <p style="font-size: 16px;">
              The Second Chance crisis support system is not responding. 
              This system helps people in mental health emergencies access 988 suicide prevention hotline and other critical resources.
            </p>
          </div>
          
          <div style="padding: 20px;">
            <h3>System Status:</h3>
            <ul>
              <li><strong>988 Hotline Integration:</strong> ${data.hotlineStatus || 'UNKNOWN'}</li>
              <li><strong>Crisis Chat:</strong> ${data.chatStatus || 'UNKNOWN'}</li>
              <li><strong>Local Resources:</strong> ${data.resourcesStatus || 'UNKNOWN'}</li>
              <li><strong>Emergency Contacts:</strong> ${data.contactsStatus || 'UNKNOWN'}</li>
            </ul>
            
            <div style="padding: 15px; background: #7f1d1d; color: white; margin: 15px 0; border-radius: 5px;">
              <h4>🚨 CRITICAL ESCALATION PROTOCOL:</h4>
              <ol>
                <li>Contact on-call engineer immediately</li>
                <li>Activate backup crisis support page</li>
                <li>Notify mental health partners</li>
                <li>Update status page</li>
                <li>Prepare emergency communication</li>
              </ol>
            </div>
            
            <h3>Error Details:</h3>
            <div style="background: #f3f4f6; padding: 15px; border-radius: 5px; font-family: monospace;">
              ${data.errorMessage || 'No error details available'}
            </div>
          </div>
          
          <div style="background: #7f1d1d; color: white; padding: 20px; text-align: center;">
            <p><strong>This is a LIFE-CRITICAL system. Act immediately.</strong></p>
            <p>Emergency Contact: ${process.env.EMERGENCY_PHONE || '+1-800-XXX-XXXX'}</p>
          </div>
        </div>
      `
    }
  }

  generatePerformanceIssueEmail(data) {
    return {
      subject: `📉 Second Chance Performance Alert: ${data.metric || 'Response Time'}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #f59e0b; color: white; padding: 20px; text-align: center;">
            <h1>📉 PERFORMANCE ALERT</h1>
          </div>
          
          <div style="padding: 20px;">
            <h3>Performance Issue Detected:</h3>
            <ul>
              <li><strong>Metric:</strong> ${data.metric || 'Unknown'}</li>
              <li><strong>Current Value:</strong> ${data.currentValue || 'Unknown'}</li>
              <li><strong>Threshold:</strong> ${data.threshold || 'Unknown'}</li>
              <li><strong>Impact:</strong> ${data.impact || 'User experience degraded'}</li>
            </ul>
            
            <h3>Affected Areas:</h3>
            <ul>
              ${(data.affectedAreas || ['Unknown']).map(area => `<li>${area}</li>`).join('')}
            </ul>
          </div>
        </div>
      `
    }
  }

  generateSecurityAlertEmail(data) {
    return {
      subject: `🛡️ Second Chance Security Alert: ${data.type || 'Security Issue'}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #dc2626; color: white; padding: 20px; text-align: center;">
            <h1>🛡️ SECURITY ALERT</h1>
          </div>
          
          <div style="padding: 20px;">
            <h3>Security Issue Detected:</h3>
            <p><strong>Type:</strong> ${data.type || 'Unknown security issue'}</p>
            <p><strong>Severity:</strong> ${data.severity || 'Unknown'}</p>
            <p><strong>Description:</strong> ${data.description || 'No description available'}</p>
            
            <div style="padding: 15px; background: #fef2f2; border-left: 5px solid #dc2626; margin: 15px 0;">
              <h4>Immediate Actions:</h4>
              <ol>
                <li>Investigate the security incident</li>
                <li>Check for data breaches</li>
                <li>Review access logs</li>
                <li>Update security measures if needed</li>
              </ol>
            </div>
          </div>
        </div>
      `
    }
  }

  generateDailyReportEmail(data) {
    return {
      subject: `📊 Second Chance Daily Report - ${new Date().toISOString().split('T')[0]}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #059669; color: white; padding: 20px; text-align: center;">
            <h1>📊 DAILY STATUS REPORT</h1>
            <p>${CONFIG.project.name}</p>
          </div>
          
          <div style="padding: 20px;">
            <h3>System Health Summary:</h3>
            <ul>
              <li><strong>Uptime:</strong> ${data.uptime || '99.9%'}</li>
              <li><strong>Response Time:</strong> ${data.avgResponseTime || '< 2s'}</li>
              <li><strong>Error Rate:</strong> ${data.errorRate || '< 0.1%'}</li>
              <li><strong>Active Users:</strong> ${data.activeUsers || 'N/A'}</li>
            </ul>
            
            <h3>Test Results (Last 24h):</h3>
            <ul>
              <li><strong>Unit Tests:</strong> ${data.unitTestResults || 'All passing'}</li>
              <li><strong>E2E Tests:</strong> ${data.e2eTestResults || 'All passing'}</li>
              <li><strong>Crisis Tests:</strong> ${data.crisisTestResults || 'All passing'}</li>
            </ul>
            
            <h3>Critical Metrics:</h3>
            <ul>
              <li><strong>988 Integration Status:</strong> ${data.hotlineStatus || 'Operational'}</li>
              <li><strong>Crisis Chat Availability:</strong> ${data.chatStatus || 'Available'}</li>
              <li><strong>Resource Database:</strong> ${data.resourcesStatus || 'Updated'}</li>
            </ul>
          </div>
        </div>
      `
    }
  }

  generateGenericAlertEmail(data) {
    return {
      subject: `🔔 Second Chance Alert: ${data.title || 'System Notification'}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #6366f1; color: white; padding: 20px; text-align: center;">
            <h1>🔔 SYSTEM ALERT</h1>
          </div>
          
          <div style="padding: 20px;">
            <h3>Alert Details:</h3>
            <p><strong>Message:</strong> ${data.message || 'No message provided'}</p>
            <p><strong>Timestamp:</strong> ${data.timestamp || new Date().toISOString()}</p>
            
            ${data.details ? `
            <h3>Additional Details:</h3>
            <div style="background: #f9fafb; padding: 15px; border-radius: 5px;">
              <pre>${JSON.stringify(data.details, null, 2)}</pre>
            </div>
            ` : ''}
          </div>
        </div>
      `
    }
  }

  async sendAlert(type, data, recipientType = 'critical') {
    if (!this.transporter) {
      this.log('error', 'Email transporter not initialized')
      return false
    }

    // Check rate limiting
    if (!this.checkRateLimit(recipientType)) {
      this.log('warn', `Rate limit exceeded for ${type} alert`, { type, recipientType })
      return false
    }

    try {
      const template = this.generateEmailTemplate(type, data)
      const recipients = CONFIG.recipients[recipientType] || CONFIG.recipients.critical

      const mailOptions = {
        from: `"Second Chance Alert System" <${CONFIG.smtp.auth.user}>`,
        to: recipients.join(', '),
        subject: template.subject,
        html: template.html
      }

      const result = await this.transporter.sendMail(mailOptions)
      
      this.log('info', `Alert email sent successfully`, {
        type,
        recipientType,
        messageId: result.messageId,
        recipients: recipients.length
      })

      return true

    } catch (error) {
      this.log('error', `Failed to send alert email: ${error.message}`, { type, data })
      return false
    }
  }

  // Convenience methods for different alert types
  async reportCriticalFailure(data) {
    return this.sendAlert('criticalFailure', data, 'critical')
  }

  async reportTestFailure(data) {
    return this.sendAlert('testFailure', data, 'warnings')
  }

  async reportCrisisSystemDown(data) {
    return this.sendAlert('crisisSystemDown', data, 'critical')
  }

  async reportPerformanceIssue(data) {
    return this.sendAlert('performanceIssue', data, 'warnings')
  }

  async reportSecurityAlert(data) {
    return this.sendAlert('securityAlert', data, 'critical')
  }

  async sendDailyReport(data) {
    return this.sendAlert('dailyReport', data, 'reports')
  }

  // Test method
  async sendTestEmail() {
    const testData = {
      timestamp: new Date().toISOString(),
      message: 'This is a test email from the Second Chance Bug Reporter system.',
      component: 'Bug Reporter Test',
      environment: 'Test'
    }

    return this.sendAlert('generic', testData, 'reports')
  }
}

// CLI interface for testing
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2)
  const command = args[0]
  
  const bugReporter = new BugReporter()
  
  switch (command) {
    case 'test':
      console.log('Sending test email...')
      bugReporter.sendTestEmail()
        .then(success => {
          console.log(success ? 'Test email sent successfully!' : 'Failed to send test email')
          process.exit(success ? 0 : 1)
        })
        .catch(error => {
          console.error('Error sending test email:', error)
          process.exit(1)
        })
      break
      
    case 'crisis-test':
      console.log('Sending crisis system test alert...')
      bugReporter.reportCrisisSystemDown({
        hotlineStatus: 'OFFLINE',
        chatStatus: 'OFFLINE',
        resourcesStatus: 'OFFLINE',
        contactsStatus: 'UNKNOWN',
        errorMessage: 'Test crisis system failure alert'
      }).then(success => {
        console.log(success ? 'Crisis alert sent!' : 'Failed to send crisis alert')
        process.exit(success ? 0 : 1)
      })
      break
      
    default:
      console.log('Second Chance Bug Reporter')
      console.log('Usage:')
      console.log('  node bug-reporter.js test        - Send test email')
      console.log('  node bug-reporter.js crisis-test - Send crisis alert test')
      process.exit(1)
  }
}

export default BugReporter