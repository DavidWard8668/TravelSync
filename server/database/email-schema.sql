-- Email logging table
CREATE TABLE IF NOT EXISTS email_logs (
  id TEXT PRIMARY KEY DEFAULT (hex(randomblob(16))),
  to_address TEXT NOT NULL,
  template TEXT NOT NULL,
  message_id TEXT,
  subject TEXT,
  status TEXT CHECK(status IN ('sent', 'failed', 'bounced')) DEFAULT 'sent',
  error TEXT,
  sent_at TEXT DEFAULT (datetime('now')),
  opened_at TEXT,
  clicked_at TEXT
);

-- TODOs generated from email/test failures
CREATE TABLE IF NOT EXISTS todos (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT CHECK(priority IN ('low', 'normal', 'high', 'urgent')) DEFAULT 'normal',
  source TEXT CHECK(source IN ('email', 'test-failure', 'manual', 'automated')) NOT NULL,
  source_email TEXT,
  component TEXT,
  status TEXT CHECK(status IN ('pending', 'in_progress', 'completed', 'cancelled')) DEFAULT 'pending',
  assigned_to TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  started_at TEXT,
  completed_at TEXT,
  notes TEXT
);

-- Bug reports from emails
CREATE TABLE IF NOT EXISTS bug_reports (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  severity TEXT CHECK(severity IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',
  component TEXT,
  steps_to_reproduce TEXT,
  stack_trace TEXT,
  reported_by TEXT,
  reported_at TEXT,
  status TEXT CHECK(status IN ('open', 'in_progress', 'resolved', 'closed', 'wont_fix')) DEFAULT 'open',
  assigned_to TEXT,
  resolution TEXT,
  resolved_at TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Test results for email notifications
CREATE TABLE IF NOT EXISTS test_runs (
  id TEXT PRIMARY KEY,
  run_type TEXT CHECK(run_type IN ('unit', 'integration', 'e2e', 'performance', 'security')) NOT NULL,
  total_tests INTEGER,
  passed INTEGER,
  failed INTEGER,
  skipped INTEGER,
  duration_seconds REAL,
  branch TEXT,
  commit_hash TEXT,
  triggered_by TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS test_results (
  id TEXT PRIMARY KEY,
  run_id TEXT REFERENCES test_runs(id) ON DELETE CASCADE,
  suite TEXT NOT NULL,
  name TEXT NOT NULL,
  status TEXT CHECK(status IN ('passed', 'failed', 'skipped', 'error')) NOT NULL,
  duration_ms INTEGER,
  error TEXT,
  file TEXT,
  line INTEGER,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Daily summary data
CREATE TABLE IF NOT EXISTS daily_summaries (
  id TEXT PRIMARY KEY,
  date TEXT UNIQUE NOT NULL,
  uptime_percent REAL,
  active_users INTEGER,
  crisis_events INTEGER,
  app_blocks INTEGER,
  tests_run INTEGER,
  test_success_rate REAL,
  failures INTEGER,
  issues TEXT, -- JSON array of issues
  created_at TEXT DEFAULT (datetime('now'))
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON email_logs(status);
CREATE INDEX IF NOT EXISTS idx_email_logs_sent_at ON email_logs(sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_todos_status ON todos(status);
CREATE INDEX IF NOT EXISTS idx_todos_priority ON todos(priority);
CREATE INDEX IF NOT EXISTS idx_todos_source ON todos(source);
CREATE INDEX IF NOT EXISTS idx_bug_reports_status ON bug_reports(status);
CREATE INDEX IF NOT EXISTS idx_bug_reports_severity ON bug_reports(severity);
CREATE INDEX IF NOT EXISTS idx_test_runs_created_at ON test_runs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_test_results_status ON test_results(status);
CREATE INDEX IF NOT EXISTS idx_daily_summaries_date ON daily_summaries(date);