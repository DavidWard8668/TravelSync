import nodemailer from 'nodemailer';
import { db } from '../database/init.js';

// Email configuration for exiledev8668@gmail.com
const EMAIL_CONFIG = {
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'exiledev8668@gmail.com',
    pass: process.env.EMAIL_APP_PASSWORD // App-specific password required for Gmail
  }
};

// Email templates
const EMAIL_TEMPLATES = {
  TEST_RESULT: {
    subject: '🧪 SecondChance Test Results - {date}',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">SecondChance Test Report</h2>
        <p>Test execution completed at {timestamp}</p>

        <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #059669;">Summary</h3>
          <ul>
            <li>Total Tests: {totalTests}</li>
            <li>Passed: <span style="color: #059669;">{passed}</span></li>
            <li>Failed: <span style="color: #dc2626;">{failed}</span></li>
            <li>Duration: {duration}s</li>
          </ul>
        </div>

        {failedTests}

        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 12px;">
            This is an automated message from SecondChance Testing System
          </p>
        </div>
      </div>
    `
  },

  CRISIS_ALERT: {
    subject: '🆘 URGENT: Crisis Mode Activated - {clientName}',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 3px solid #dc2626; padding: 20px;">
        <h1 style="color: #dc2626; margin: 0;">⚠️ Crisis Mode Activated</h1>

        <div style="background: #fef2f2; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 5px 0;"><strong>Client:</strong> {clientName}</p>
          <p style="margin: 5px 0;"><strong>Time:</strong> {timestamp}</p>
          <p style="margin: 5px 0;"><strong>Reason:</strong> {reason}</p>
        </div>

        <h3>Immediate Actions Required:</h3>
        <ol>
          <li>Contact client immediately</li>
          <li>Review crisis resources accessed</li>
          <li>Document intervention in recovery log</li>
        </ol>

        <div style="margin: 20px 0;">
          <a href="{dashboardUrl}" style="background: #dc2626; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
            View Dashboard
          </a>
        </div>

        <p style="color: #6b7280; font-size: 12px;">
          This alert was triggered by the SecondChance crisis detection system
        </p>
      </div>
    `
  },

  BUG_REPORT: {
    subject: '🐛 Bug Report: {title}',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">Bug Report</h2>

        <div style="background: #fef2f2; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">{title}</h3>
          <p><strong>Severity:</strong> {severity}</p>
          <p><strong>Component:</strong> {component}</p>
          <p><strong>Reported:</strong> {timestamp}</p>
        </div>

        <div style="margin: 20px 0;">
          <h4>Description:</h4>
          <p>{description}</p>

          <h4>Steps to Reproduce:</h4>
          <pre style="background: #f3f4f6; padding: 10px; border-radius: 4px;">{steps}</pre>

          <h4>Stack Trace:</h4>
          <pre style="background: #1f2937; color: #f3f4f6; padding: 10px; border-radius: 4px; overflow-x: auto;">{stackTrace}</pre>
        </div>

        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 12px;">
            Bug automatically logged to tracking system
          </p>
        </div>
      </div>
    `
  },

  DAILY_SUMMARY: {
    subject: '📊 SecondChance Daily Summary - {date}',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Daily Activity Summary</h2>
        <p>{date}</p>

        <div style="background: #eff6ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #2563eb;">System Health</h3>
          <ul>
            <li>Uptime: {uptime}%</li>
            <li>Active Users: {activeUsers}</li>
            <li>Crisis Events: {crisisEvents}</li>
            <li>App Blocks: {appBlocks}</li>
          </ul>
        </div>

        <div style="background: #f0fdf4; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #059669;">Test Results</h3>
          <ul>
            <li>Tests Run: {testsRun}</li>
            <li>Success Rate: {successRate}%</li>
            <li>Failures Requiring Attention: {failures}</li>
          </ul>
        </div>

        {issues}

        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 12px;">
            Daily summary generated automatically at midnight UTC
          </p>
        </div>
      </div>
    `
  }
};

class EmailService {
  constructor() {
    this.transporter = null;
    this.initialized = false;
    this.testMode = process.env.NODE_ENV === 'test';
  }

  async initialize() {
    if (this.initialized) return;

    try {
      // Create transporter
      this.transporter = nodemailer.createTransport(EMAIL_CONFIG);

      // Verify connection
      await this.transporter.verify();

      console.log('✅ Email service initialized successfully');
      this.initialized = true;
    } catch (error) {
      console.error('❌ Failed to initialize email service:', error);
      throw new Error('Email service initialization failed');
    }
  }

  async sendEmail(to, template, data) {
    if (!this.initialized) {
      await this.initialize();
    }

    // In test mode, just log the email
    if (this.testMode) {
      console.log('📧 Test mode email:', { to, template, data });
      return { messageId: 'test-message-id' };
    }

    try {
      const emailTemplate = EMAIL_TEMPLATES[template];
      if (!emailTemplate) {
        throw new Error(`Unknown email template: ${template}`);
      }

      // Replace placeholders in subject and body
      let subject = emailTemplate.subject;
      let html = emailTemplate.html;

      Object.keys(data).forEach(key => {
        const regex = new RegExp(`{${key}}`, 'g');
        subject = subject.replace(regex, data[key]);
        html = html.replace(regex, data[key]);
      });

      // Send email
      const info = await this.transporter.sendMail({
        from: `"SecondChance System" <${EMAIL_CONFIG.auth.user}>`,
        to,
        subject,
        html
      });

      // Log email sent
      await this.logEmailSent(to, template, info.messageId);

      console.log(`✅ Email sent to ${to}: ${info.messageId}`);
      return info;
    } catch (error) {
      console.error('❌ Failed to send email:', error);
      await this.logEmailError(to, template, error);
      throw error;
    }
  }

  async sendTestResults(results) {
    const failedTestsHtml = results.failed > 0 ? `
      <div style="background: #fef2f2; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <h3 style="color: #dc2626;">Failed Tests</h3>
        <ul>
          ${results.failedTests.map(test => `
            <li>
              <strong>${test.name}</strong><br>
              <code style="color: #dc2626;">${test.error}</code>
            </li>
          `).join('')}
        </ul>
      </div>
    ` : '';

    return this.sendEmail('exiledev8668@gmail.com', 'TEST_RESULT', {
      date: new Date().toLocaleDateString(),
      timestamp: new Date().toLocaleString(),
      totalTests: results.total,
      passed: results.passed,
      failed: results.failed,
      duration: results.duration,
      failedTests: failedTestsHtml
    });
  }

  async sendCrisisAlert(clientData) {
    return this.sendEmail('exiledev8668@gmail.com', 'CRISIS_ALERT', {
      clientName: clientData.name,
      timestamp: new Date().toLocaleString(),
      reason: clientData.reason || 'User activated crisis mode',
      dashboardUrl: process.env.DASHBOARD_URL || 'http://localhost:3000/dashboard'
    });
  }

  async sendBugReport(bugData) {
    return this.sendEmail('exiledev8668@gmail.com', 'BUG_REPORT', {
      title: bugData.title,
      severity: bugData.severity || 'Medium',
      component: bugData.component || 'Unknown',
      timestamp: new Date().toLocaleString(),
      description: bugData.description,
      steps: bugData.steps || 'Not provided',
      stackTrace: bugData.stackTrace || 'No stack trace available'
    });
  }

  async sendDailySummary(summaryData) {
    const issuesHtml = summaryData.issues && summaryData.issues.length > 0 ? `
      <div style="background: #fef2f2; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <h3 style="color: #dc2626;">Issues Requiring Attention</h3>
        <ul>
          ${summaryData.issues.map(issue => `<li>${issue}</li>`).join('')}
        </ul>
      </div>
    ` : '';

    return this.sendEmail('exiledev8668@gmail.com', 'DAILY_SUMMARY', {
      date: new Date().toLocaleDateString(),
      uptime: summaryData.uptime || 100,
      activeUsers: summaryData.activeUsers || 0,
      crisisEvents: summaryData.crisisEvents || 0,
      appBlocks: summaryData.appBlocks || 0,
      testsRun: summaryData.testsRun || 0,
      successRate: summaryData.successRate || 100,
      failures: summaryData.failures || 0,
      issues: issuesHtml
    });
  }

  async logEmailSent(to, template, messageId) {
    try {
      await db.run(`
        INSERT INTO email_logs (to_address, template, message_id, sent_at, status)
        VALUES (?, ?, ?, datetime('now'), 'sent')
      `, to, template, messageId);
    } catch (error) {
      console.error('Failed to log email:', error);
    }
  }

  async logEmailError(to, template, error) {
    try {
      await db.run(`
        INSERT INTO email_logs (to_address, template, error, sent_at, status)
        VALUES (?, ?, ?, datetime('now'), 'failed')
      `, to, template, error.message);
    } catch (error) {
      console.error('Failed to log email error:', error);
    }
  }

  async monitorInbox() {
    // This would connect to Gmail API to monitor for bug reports
    // For now, this is a placeholder
    console.log('📬 Email inbox monitoring not yet implemented');
  }

  async createTodoFromEmail(email) {
    // Parse email and create TODO item
    const todo = {
      title: email.subject,
      description: email.body,
      priority: this.detectPriority(email),
      source: 'email',
      created_at: new Date()
    };

    // Save to database
    await db.run(`
      INSERT INTO todos (title, description, priority, source, created_at)
      VALUES (?, ?, ?, ?, ?)
    `, todo.title, todo.description, todo.priority, todo.source, todo.created_at);

    return todo;
  }

  detectPriority(email) {
    const urgentKeywords = ['urgent', 'critical', 'emergency', 'crisis'];
    const subject = email.subject.toLowerCase();

    for (const keyword of urgentKeywords) {
      if (subject.includes(keyword)) {
        return 'high';
      }
    }

    return 'normal';
  }
}

// Create singleton instance
const emailService = new EmailService();

// Initialize on module load
emailService.initialize().catch(console.error);

export default emailService;