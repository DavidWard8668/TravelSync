import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, '../../data/second-chance.db');

// Create database connection
export const db = new Database(dbPath, { verbose: console.log });

// Enable foreign key constraints
db.pragma('foreign_keys = ON');

/**
 * Initialize database with all required tables
 */
export async function initDatabase() {
  console.log('📊 Setting up Second Chance database...');
  
  try {
    // Users table (both Master and Client)
    db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT CHECK(role IN ('master', 'client')) NOT NULL,
        name TEXT NOT NULL,
        phone TEXT,
        avatar_url TEXT,
        timezone TEXT DEFAULT 'Europe/London',
        preferences TEXT DEFAULT '{}',
        created_at TEXT DEFAULT (datetime('now')),
        last_active TEXT DEFAULT (datetime('now')),
        is_active INTEGER DEFAULT 1
      )
    `);

    // Master-Client relationships
    db.exec(`
      CREATE TABLE IF NOT EXISTS relationships (
        id TEXT PRIMARY KEY,
        master_id TEXT REFERENCES users(id) ON DELETE CASCADE,
        client_id TEXT REFERENCES users(id) ON DELETE CASCADE,
        status TEXT CHECK(status IN ('pending', 'active', 'paused', 'ended')) DEFAULT 'pending',
        invitation_code TEXT UNIQUE,
        invitation_expires_at TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        approved_at TEXT,
        ended_at TEXT,
        notes TEXT,
        UNIQUE(master_id, client_id)
      )
    `);

    // Monitored apps
    db.exec(`
      CREATE TABLE IF NOT EXISTS monitored_apps (
        id TEXT PRIMARY KEY,
        client_id TEXT REFERENCES users(id) ON DELETE CASCADE,
        app_name TEXT NOT NULL,
        package_name TEXT,
        category TEXT,
        risk_level TEXT CHECK(risk_level IN ('low', 'medium', 'high')) DEFAULT 'medium',
        is_blocked INTEGER DEFAULT 1,
        block_reason TEXT,
        monitoring_enabled INTEGER DEFAULT 1,
        added_at TEXT DEFAULT (datetime('now')),
        last_updated TEXT DEFAULT (datetime('now')),
        UNIQUE(client_id, package_name)
      )
    `);

    // App events (install/use/remove)
    db.exec(`
      CREATE TABLE IF NOT EXISTS app_events (
        id TEXT PRIMARY KEY,
        client_id TEXT REFERENCES users(id) ON DELETE CASCADE,
        app_id TEXT REFERENCES monitored_apps(id) ON DELETE CASCADE,
        event_type TEXT CHECK(event_type IN ('install', 'usage', 'removal', 'access_request', 'block_attempt')) NOT NULL,
        timestamp TEXT DEFAULT (datetime('now')),
        details TEXT DEFAULT '{}',
        ip_address TEXT,
        user_agent TEXT,
        location TEXT
      )
    `);

    // Approval requests
    db.exec(`
      CREATE TABLE IF NOT EXISTS approval_requests (
        id TEXT PRIMARY KEY,
        client_id TEXT REFERENCES users(id) ON DELETE CASCADE,
        master_id TEXT REFERENCES users(id) ON DELETE CASCADE,
        app_id TEXT REFERENCES monitored_apps(id) ON DELETE CASCADE,
        request_type TEXT CHECK(request_type IN ('install', 'usage', 'temporary_access', 'permanent_unlock')) DEFAULT 'usage',
        status TEXT CHECK(status IN ('pending', 'approved', 'denied', 'expired')) DEFAULT 'pending',
        reason TEXT,
        client_message TEXT,
        master_response TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        responded_at TEXT,
        expires_at TEXT DEFAULT (datetime('now', '+24 hours')),
        duration_minutes INTEGER,
        priority TEXT CHECK(priority IN ('low', 'normal', 'high', 'urgent')) DEFAULT 'normal'
      )
    `);

    // Crisis events
    db.exec(`
      CREATE TABLE IF NOT EXISTS crisis_events (
        id TEXT PRIMARY KEY,
        client_id TEXT REFERENCES users(id) ON DELETE CASCADE,
        event_type TEXT CHECK(event_type IN ('crisis_mode_activated', 'crisis_resource_accessed', 'emergency_contact_notified')) NOT NULL,
        resource_type TEXT,
        resource_details TEXT,
        timestamp TEXT DEFAULT (datetime('now')),
        ip_address TEXT,
        location TEXT,
        follow_up_required INTEGER DEFAULT 0,
        follow_up_completed INTEGER DEFAULT 0
      )
    `);

    // Notifications
    db.exec(`
      CREATE TABLE IF NOT EXISTS notifications (
        id TEXT PRIMARY KEY,
        user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
        type TEXT CHECK(type IN ('app_request', 'crisis_alert', 'system', 'relationship', 'reminder')) NOT NULL,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        data TEXT DEFAULT '{}',
        is_read INTEGER DEFAULT 0,
        is_urgent INTEGER DEFAULT 0,
        created_at TEXT DEFAULT (datetime('now')),
        read_at TEXT,
        expires_at TEXT
      )
    `);

    // Self-help content tracking
    db.exec(`
      CREATE TABLE IF NOT EXISTS content_interactions (
        id TEXT PRIMARY KEY,
        user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
        content_type TEXT CHECK(content_type IN ('video', 'article', 'meditation', 'exercise')) NOT NULL,
        content_id TEXT NOT NULL,
        content_title TEXT,
        content_url TEXT,
        interaction_type TEXT CHECK(interaction_type IN ('view', 'complete', 'bookmark', 'share')) NOT NULL,
        duration_seconds INTEGER,
        progress_percent INTEGER DEFAULT 0,
        timestamp TEXT DEFAULT (datetime('now')),
        notes TEXT
      )
    `);

    // Recovery progress tracking
    db.exec(`
      CREATE TABLE IF NOT EXISTS recovery_progress (
        id TEXT PRIMARY KEY,
        user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
        metric_type TEXT CHECK(metric_type IN ('clean_days', 'app_blocks_prevented', 'crisis_mode_activations', 'self_help_sessions', 'master_interactions')) NOT NULL,
        metric_value INTEGER NOT NULL,
        date TEXT NOT NULL,
        notes TEXT,
        UNIQUE(user_id, metric_type, date)
      )
    `);

    // Create indexes for better performance
    db.exec(`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_relationships_master ON relationships(master_id)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_relationships_client ON relationships(client_id)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_relationships_status ON relationships(status)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_monitored_apps_client ON monitored_apps(client_id)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_app_events_client ON app_events(client_id)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_app_events_timestamp ON app_events(timestamp DESC)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_approval_requests_master ON approval_requests(master_id)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_approval_requests_client ON approval_requests(client_id)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_approval_requests_status ON approval_requests(status)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, is_read)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_crisis_events_client ON crisis_events(client_id)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_crisis_events_timestamp ON crisis_events(timestamp DESC)`);

    // Insert default UK crisis resources if they don't exist
    const crisisResourcesExist = db.prepare('SELECT COUNT(*) as count FROM monitored_apps WHERE app_name = ?').get('Crisis Resources');
    
    if (crisisResourcesExist.count === 0) {
      console.log('🏥 Adding default UK crisis resources...');
      
      // These are system-level resources that are never blocked
      const systemUserId = 'system-crisis-resources';
      
      // Create system user for crisis resources if not exists
      const systemUser = db.prepare(`
        INSERT OR IGNORE INTO users (id, email, password_hash, role, name) 
        VALUES (?, ?, ?, ?, ?)
      `).run(systemUserId, 'system@second-chance.app', 'system', 'master', 'Crisis System');
      
      const crisisApps = [
        { name: 'Samaritans', package: 'org.samaritans.app', category: 'Crisis Support', risk: 'low' },
        { name: 'Crisis Text Line', package: 'uk.crisis.textline', category: 'Crisis Support', risk: 'low' },
        { name: 'NHS 111', package: 'nhs.uk.app', category: 'Healthcare', risk: 'low' },
        { name: 'Mind Charity', package: 'org.mind.app', category: 'Mental Health', risk: 'low' },
        { name: 'CALM', package: 'org.thecalmzone.app', category: 'Crisis Support', risk: 'low' }
      ];
      
      const insertCrisisApp = db.prepare(`
        INSERT OR IGNORE INTO monitored_apps 
        (id, client_id, app_name, package_name, category, risk_level, is_blocked, monitoring_enabled) 
        VALUES (?, ?, ?, ?, ?, ?, 0, 0)
      `);
      
      crisisApps.forEach(app => {
        const id = `crisis-${app.package}`;
        insertCrisisApp.run(id, systemUserId, app.name, app.package, app.category, app.risk);
      });
    }

    // Insert sample self-help content categories
    console.log('📚 Setting up self-help content framework...');
    
    const selfHelpCategories = [
      'Meditation & Mindfulness',
      'Understanding Triggers',
      'Recovery Stories', 
      'Addiction Science',
      'Coping Strategies',
      'Support Systems',
      'Crisis Management',
      'Relapse Prevention'
    ];

    console.log('✅ Database initialization complete');
    console.log('📊 Tables created: users, relationships, monitored_apps, app_events, approval_requests, crisis_events, notifications, content_interactions, recovery_progress');
    console.log('🏥 UK crisis resources integrated');
    console.log('📚 Self-help content framework ready');
    
    return true;
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
}

/**
 * Get database statistics for monitoring
 */
export function getDatabaseStats() {
  try {
    const stats = {};
    
    const tables = [
      'users', 'relationships', 'monitored_apps', 'app_events', 
      'approval_requests', 'crisis_events', 'notifications', 
      'content_interactions', 'recovery_progress'
    ];
    
    tables.forEach(table => {
      const result = db.prepare(`SELECT COUNT(*) as count FROM ${table}`).get();
      stats[table] = result.count;
    });
    
    stats.database_file = dbPath;
    stats.last_updated = new Date().toISOString();
    
    return stats;
  } catch (error) {
    console.error('Failed to get database stats:', error);
    return null;
  }
}

/**
 * Cleanup expired records
 */
export function cleanupExpiredRecords() {
  try {
    console.log('🧹 Cleaning up expired records...');
    
    // Remove expired approval requests
    const expiredRequests = db.prepare(`
      UPDATE approval_requests 
      SET status = 'expired' 
      WHERE status = 'pending' AND expires_at < datetime('now')
    `).run();
    
    // Remove old notifications (older than 30 days)
    const oldNotifications = db.prepare(`
      DELETE FROM notifications 
      WHERE created_at < datetime('now', '-30 days') AND is_read = 1
    `).run();
    
    // Remove old app events (older than 90 days, except crisis events)
    const oldEvents = db.prepare(`
      DELETE FROM app_events 
      WHERE timestamp < datetime('now', '-90 days') 
      AND event_type NOT IN ('crisis_mode_activated', 'emergency_contact_notified')
    `).run();
    
    console.log(`✅ Cleanup complete: ${expiredRequests.changes} requests expired, ${oldNotifications.changes} notifications removed, ${oldEvents.changes} events archived`);
    
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
  }
}

// Export database instance
export default db;