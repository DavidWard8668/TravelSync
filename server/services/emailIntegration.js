import emailService from './emailService.js';
import emailMonitor from './emailMonitor.js';
import { db } from '../database/init.js';
import cron from 'node-cron';

class EmailIntegration {
  constructor() {
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;

    try {
      // Apply email schema
      await this.applyEmailSchema();

      // Initialize email service
      await emailService.initialize();

      // Setup cron jobs
      this.setupCronJobs();

      // Setup test failure hooks
      this.setupTestHooks();

      // Setup crisis monitoring
      this.setupCrisisMonitoring();

      console.log('✅ Email integration initialized successfully');
      this.initialized = true;
    } catch (error) {
      console.error('❌ Failed to initialize email integration:', error);
    }
  }

  async applyEmailSchema() {
    const fs = await import('fs');
    const path = await import('path');
    const { fileURLToPath } = await import('url');

    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);

    const schemaPath = path.join(__dirname, '../database/email-schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    // Execute schema
    db.exec(schema);
    console.log('✅ Email schema applied');
  }

  setupCronJobs() {
    // Send daily summary at midnight
    cron.schedule('0 0 * * *', async () => {
      console.log('📊 Generating daily summary...');
      await this.sendDailySummary();
    });

    // Check for stale TODOs every 6 hours
    cron.schedule('0 */6 * * *', async () => {
      await this.checkStaleTodos();
    });

    // Cleanup old email logs monthly
    cron.schedule('0 0 1 * *', async () => {
      await this.cleanupOldLogs();
    });

    console.log('⏰ Cron jobs scheduled');
  }

  setupTestHooks() {
    // Hook into test runner events
    process.on('test:complete', async (results) => {
      await this.handleTestResults(results);
    });

    // Monitor test output files
    const testOutputPath = './test-results';
    if (process.env.MONITOR_TEST_OUTPUT === 'true') {
      const fs = await import('fs');
      fs.watch(testOutputPath, async (eventType, filename) => {
        if (filename?.endsWith('.json')) {
          await this.processTestOutput(filename);
        }
      });
    }
  }

  setupCrisisMonitoring() {
    // Listen for crisis events from socket
    if (global.io) {
      global.io.on('connection', (socket) => {
        socket.on('crisis:activated', async (data) => {
          await this.handleCrisisActivation(data);
        });
      });
    }
  }

  async handleTestResults(results) {
    try {
      // Save test run to database
      const runId = await this.saveTestRun(results);

      // Save individual test results
      await this.saveTestResults(runId, results.tests);

      // Send email if there are failures
      if (results.failed > 0) {
        await emailService.sendTestResults(results);

        // Create TODOs for failed tests
        await this.createTodosForFailedTests(results.failedTests);
      }

      console.log(`📧 Test results processed: ${results.passed}/${results.total} passed`);
    } catch (error) {
      console.error('❌ Failed to handle test results:', error);
    }
  }

  async saveTestRun(results) {
    const { v4: uuidv4 } = await import('uuid');
    const runId = uuidv4();

    await db.run(`
      INSERT INTO test_runs (
        id, run_type, total_tests, passed, failed, skipped,
        duration_seconds, branch, commit_hash, triggered_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
      runId,
      results.type || 'unit',
      results.total,
      results.passed,
      results.failed,
      results.skipped || 0,
      results.duration,
      results.branch || 'main',
      results.commit || 'unknown',
      results.triggeredBy || 'automated'
    );

    return runId;
  }

  async saveTestResults(runId, tests) {
    const { v4: uuidv4 } = await import('uuid');

    for (const test of tests) {
      await db.run(`
        INSERT INTO test_results (
          id, run_id, suite, name, status,
          duration_ms, error, file, line
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
        uuidv4(),
        runId,
        test.suite,
        test.name,
        test.status,
        test.duration,
        test.error || null,
        test.file || null,
        test.line || null
      );
    }
  }

  async createTodosForFailedTests(failedTests) {
    const { v4: uuidv4 } = await import('uuid');

    for (const test of failedTests) {
      // Check if TODO already exists for this test
      const existing = await db.get(
        'SELECT id FROM todos WHERE title = ? AND status != ?',
        `🧪 Fix test: ${test.name}`,
        'completed'
      );

      if (!existing) {
        await db.run(`
          INSERT INTO todos (
            id, title, description, priority,
            source, component, status
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `,
          uuidv4(),
          `🧪 Fix test: ${test.name}`,
          `Test failed in ${test.suite}\n\nError: ${test.error}`,
          'normal',
          'test-failure',
          test.suite,
          'pending'
        );
      }
    }
  }

  async handleCrisisActivation(data) {
    try {
      // Send immediate email alert
      await emailService.sendCrisisAlert({
        name: data.clientName,
        reason: data.reason
      });

      // Log crisis event
      const { v4: uuidv4 } = await import('uuid');
      await db.run(`
        INSERT INTO crisis_events (
          id, client_id, event_type, resource_type,
          resource_details, ip_address, location
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
        uuidv4(),
        data.clientId,
        'crisis_mode_activated',
        'emergency',
        JSON.stringify(data),
        data.ipAddress || null,
        data.location || null
      );

      console.log(`🆘 Crisis alert sent for ${data.clientName}`);
    } catch (error) {
      console.error('❌ Failed to handle crisis activation:', error);
    }
  }

  async sendDailySummary() {
    try {
      // Gather daily stats
      const stats = await this.gatherDailyStats();

      // Send email
      await emailService.sendDailySummary(stats);

      // Save summary to database
      await this.saveDailySummary(stats);

      console.log('📊 Daily summary sent');
    } catch (error) {
      console.error('❌ Failed to send daily summary:', error);
    }
  }

  async gatherDailyStats() {
    const today = new Date().toISOString().split('T')[0];

    // Get user activity
    const activeUsers = await db.get(
      'SELECT COUNT(DISTINCT user_id) as count FROM app_events WHERE DATE(timestamp) = ?',
      today
    );

    // Get crisis events
    const crisisEvents = await db.get(
      'SELECT COUNT(*) as count FROM crisis_events WHERE DATE(timestamp) = ?',
      today
    );

    // Get app blocks
    const appBlocks = await db.get(
      'SELECT COUNT(*) as count FROM app_events WHERE event_type = ? AND DATE(timestamp) = ?',
      'block_attempt',
      today
    );

    // Get test results
    const testRuns = await db.get(
      'SELECT COUNT(*) as total, SUM(CASE WHEN failed = 0 THEN 1 ELSE 0 END) as successful FROM test_runs WHERE DATE(created_at) = ?',
      today
    );

    // Get pending urgent TODOs
    const urgentTodos = await db.all(
      'SELECT title FROM todos WHERE priority = ? AND status = ?',
      'urgent',
      'pending'
    );

    return {
      date: today,
      uptime: 99.9, // Would calculate from monitoring
      activeUsers: activeUsers?.count || 0,
      crisisEvents: crisisEvents?.count || 0,
      appBlocks: appBlocks?.count || 0,
      testsRun: testRuns?.total || 0,
      successRate: testRuns?.total > 0 ? (testRuns.successful / testRuns.total * 100) : 100,
      failures: testRuns?.total - testRuns?.successful || 0,
      issues: urgentTodos.map(t => t.title)
    };
  }

  async saveDailySummary(stats) {
    await db.run(`
      INSERT OR REPLACE INTO daily_summaries (
        id, date, uptime_percent, active_users, crisis_events,
        app_blocks, tests_run, test_success_rate, failures, issues
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
      stats.date, // Use date as ID for uniqueness
      stats.date,
      stats.uptime,
      stats.activeUsers,
      stats.crisisEvents,
      stats.appBlocks,
      stats.testsRun,
      stats.successRate,
      stats.failures,
      JSON.stringify(stats.issues)
    );
  }

  async checkStaleTodos() {
    // Find TODOs pending for more than 7 days
    const staleTodos = await db.all(`
      SELECT * FROM todos
      WHERE status = 'pending'
      AND datetime(created_at) < datetime('now', '-7 days')
    `);

    if (staleTodos.length > 0) {
      console.log(`⚠️ Found ${staleTodos.length} stale TODOs`);

      // Could send reminder email or escalate
    }
  }

  async cleanupOldLogs() {
    // Delete email logs older than 90 days
    await db.run(
      "DELETE FROM email_logs WHERE datetime(sent_at) < datetime('now', '-90 days')"
    );

    // Delete old test results
    await db.run(
      "DELETE FROM test_results WHERE datetime(created_at) < datetime('now', '-30 days')"
    );

    console.log('🧹 Old logs cleaned up');
  }

  async processTestOutput(filename) {
    const fs = await import('fs');
    const path = await import('path');

    try {
      const filePath = path.join('./test-results', filename);
      const content = fs.readFileSync(filePath, 'utf8');
      const results = JSON.parse(content);

      await this.handleTestResults(results);
    } catch (error) {
      console.error(`Failed to process test output ${filename}:`, error);
    }
  }
}

// Create and export singleton
const emailIntegration = new EmailIntegration();

// Auto-initialize
emailIntegration.initialize().catch(console.error);

export default emailIntegration;