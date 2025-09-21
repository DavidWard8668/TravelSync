import { google } from 'googleapis';
import emailService from './emailService.js';
import { db } from '../database/init.js';
import { v4 as uuidv4 } from 'uuid';

class EmailMonitor {
  constructor() {
    this.gmail = null;
    this.auth = null;
    this.checkInterval = 5 * 60 * 1000; // Check every 5 minutes
    this.lastCheckedMessageId = null;
  }

  async initialize() {
    try {
      // Initialize OAuth2 client for Gmail API
      const oauth2Client = new google.auth.OAuth2(
        process.env.GMAIL_CLIENT_ID,
        process.env.GMAIL_CLIENT_SECRET,
        process.env.GMAIL_REDIRECT_URI
      );

      // Set credentials
      oauth2Client.setCredentials({
        refresh_token: process.env.GMAIL_REFRESH_TOKEN
      });

      this.auth = oauth2Client;
      this.gmail = google.gmail({ version: 'v1', auth: oauth2Client });

      console.log('✅ Email monitor initialized');

      // Start monitoring
      this.startMonitoring();
    } catch (error) {
      console.error('❌ Failed to initialize email monitor:', error);
    }
  }

  startMonitoring() {
    // Initial check
    this.checkInbox();

    // Schedule periodic checks
    setInterval(() => {
      this.checkInbox();
    }, this.checkInterval);

    console.log('📬 Email monitoring started - checking every 5 minutes');
  }

  async checkInbox() {
    try {
      // Search for unread bug report emails
      const res = await this.gmail.users.messages.list({
        userId: 'me',
        q: 'is:unread subject:(bug OR error OR issue OR failure) to:exiledev8668@gmail.com',
        maxResults: 10
      });

      if (!res.data.messages || res.data.messages.length === 0) {
        return;
      }

      console.log(`📧 Found ${res.data.messages.length} unread bug reports`);

      // Process each message
      for (const message of res.data.messages) {
        await this.processMessage(message.id);
      }
    } catch (error) {
      console.error('❌ Failed to check inbox:', error);
    }
  }

  async processMessage(messageId) {
    try {
      // Get full message
      const res = await this.gmail.users.messages.get({
        userId: 'me',
        id: messageId
      });

      const message = res.data;
      const headers = message.payload.headers;

      // Extract email details
      const subject = headers.find(h => h.name === 'Subject')?.value || 'No Subject';
      const from = headers.find(h => h.name === 'From')?.value || 'Unknown';
      const date = headers.find(h => h.name === 'Date')?.value || new Date().toISOString();

      // Extract body
      const body = this.extractBody(message.payload);

      // Parse bug report
      const bugReport = this.parseBugReport(subject, body);

      // Create TODO item
      await this.createTodoFromBug(bugReport, from, date);

      // Mark as read
      await this.gmail.users.messages.modify({
        userId: 'me',
        id: messageId,
        requestBody: {
          removeLabelIds: ['UNREAD']
        }
      });

      console.log(`✅ Processed bug report: ${subject}`);
    } catch (error) {
      console.error(`❌ Failed to process message ${messageId}:`, error);
    }
  }

  extractBody(payload) {
    let body = '';

    if (payload.parts) {
      // Multipart message
      for (const part of payload.parts) {
        if (part.mimeType === 'text/plain' || part.mimeType === 'text/html') {
          const data = part.body.data;
          if (data) {
            body += Buffer.from(data, 'base64').toString('utf-8');
          }
        }
      }
    } else if (payload.body && payload.body.data) {
      // Simple message
      body = Buffer.from(payload.body.data, 'base64').toString('utf-8');
    }

    return body;
  }

  parseBugReport(subject, body) {
    const report = {
      title: subject,
      description: '',
      severity: 'medium',
      component: 'unknown',
      steps: '',
      stackTrace: ''
    };

    // Extract severity from subject or body
    if (/critical|urgent|high/i.test(subject + body)) {
      report.severity = 'high';
    } else if (/low|minor/i.test(subject + body)) {
      report.severity = 'low';
    }

    // Extract component if mentioned
    const componentMatch = body.match(/component:\s*([^\n]+)/i);
    if (componentMatch) {
      report.component = componentMatch[1].trim();
    }

    // Extract steps to reproduce
    const stepsMatch = body.match(/steps to reproduce:?\s*([\s\S]*?)(?:expected|actual|stack|$)/i);
    if (stepsMatch) {
      report.steps = stepsMatch[1].trim();
    }

    // Extract stack trace
    const stackMatch = body.match(/stack trace:?\s*([\s\S]*?)(?:additional|notes|$)/i);
    if (stackMatch) {
      report.stackTrace = stackMatch[1].trim();
    }

    // Use remaining body as description
    report.description = body
      .replace(/component:.*\n/gi, '')
      .replace(/steps to reproduce:[\s\S]*?(?:expected|actual|stack|$)/gi, '')
      .replace(/stack trace:[\s\S]*$/gi, '')
      .trim();

    return report;
  }

  async createTodoFromBug(bugReport, from, date) {
    const todoId = uuidv4();

    try {
      // Create TODO in database
      await db.run(`
        INSERT INTO todos (
          id,
          title,
          description,
          priority,
          source,
          source_email,
          component,
          status,
          created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
        todoId,
        `🐛 ${bugReport.title}`,
        `From: ${from}\nDate: ${date}\n\n${bugReport.description}\n\nSteps: ${bugReport.steps}\n\nStack: ${bugReport.stackTrace}`,
        bugReport.severity === 'high' ? 'urgent' : bugReport.severity === 'low' ? 'low' : 'normal',
        'email',
        from,
        bugReport.component,
        'pending',
        new Date().toISOString()
      );

      // Also log as bug report
      await db.run(`
        INSERT INTO bug_reports (
          id,
          title,
          description,
          severity,
          component,
          steps_to_reproduce,
          stack_trace,
          reported_by,
          reported_at,
          status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
        uuidv4(),
        bugReport.title,
        bugReport.description,
        bugReport.severity,
        bugReport.component,
        bugReport.steps,
        bugReport.stackTrace,
        from,
        date,
        'open'
      );

      console.log(`📝 Created TODO: ${bugReport.title}`);

      // Send notification to team
      if (bugReport.severity === 'high') {
        await this.notifyTeamUrgent(bugReport);
      }
    } catch (error) {
      console.error('❌ Failed to create TODO from bug:', error);
    }
  }

  async notifyTeamUrgent(bugReport) {
    // Send urgent notification via multiple channels
    console.log(`🚨 URGENT BUG: ${bugReport.title}`);

    // Could integrate with Slack, Discord, SMS, etc.
    // For now, just log urgently
  }

  async createTestFailureTodos() {
    // This would be called by the test runner when tests fail
    const failedTests = await this.getFailedTestsFromLastRun();

    for (const test of failedTests) {
      const todoId = uuidv4();

      await db.run(`
        INSERT INTO todos (
          id,
          title,
          description,
          priority,
          source,
          component,
          status,
          created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
        todoId,
        `🧪 Fix test: ${test.name}`,
        `Test failed in ${test.suite}\n\nError: ${test.error}\n\nFile: ${test.file}:${test.line}`,
        'normal',
        'test-failure',
        test.suite,
        'pending',
        new Date().toISOString()
      );
    }
  }

  async getFailedTestsFromLastRun() {
    // Query test results from database
    const results = await db.all(`
      SELECT * FROM test_results
      WHERE status = 'failed'
      AND run_id = (
        SELECT id FROM test_runs
        ORDER BY created_at DESC
        LIMIT 1
      )
    `);

    return results;
  }
}

// Create and export singleton
const emailMonitor = new EmailMonitor();

// Auto-initialize if credentials are available
if (process.env.GMAIL_CLIENT_ID && process.env.GMAIL_REFRESH_TOKEN) {
  emailMonitor.initialize().catch(console.error);
} else {
  console.log('⚠️ Gmail API credentials not configured - email monitoring disabled');
}

export default emailMonitor;