-- Second Chance App Database Schema
-- Complete schema for addiction recovery support app

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users table
CREATE TABLE users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    admin_id UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Monitored apps table
CREATE TABLE monitored_apps (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    package_name VARCHAR(255) NOT NULL,
    is_blocked BOOLEAN DEFAULT true,
    last_used TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, package_name)
);

-- Admin requests table
CREATE TABLE admin_requests (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    admin_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    app_name VARCHAR(255) NOT NULL,
    package_name VARCHAR(255) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied')),
    reason TEXT NOT NULL,
    admin_note TEXT,
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    responded_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications table
CREATE TABLE notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    data JSONB,
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- App usage logs table
CREATE TABLE app_usage_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    app_name VARCHAR(255) NOT NULL,
    package_name VARCHAR(255) NOT NULL,
    action VARCHAR(20) NOT NULL CHECK (action IN ('opened', 'closed', 'blocked', 'approved')),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    duration INTEGER, -- in seconds
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User settings table
CREATE TABLE user_settings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    emergency_contacts JSONB DEFAULT '[]'::jsonb,
    notification_preferences JSONB DEFAULT '{
        "push_notifications": true,
        "email_notifications": true,
        "sms_notifications": false,
        "admin_approval_required": true,
        "daily_usage_reports": true
    }'::jsonb,
    recovery_goals JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Support resources table
CREATE TABLE support_resources (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50) NOT NULL, -- 'hotline', 'website', 'app', 'meeting'
    contact_info JSONB NOT NULL,
    is_emergency BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User progress table
CREATE TABLE user_progress (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    clean_days INTEGER DEFAULT 0,
    apps_blocked INTEGER DEFAULT 0,
    requests_made INTEGER DEFAULT 0,
    requests_approved INTEGER DEFAULT 0,
    mood_rating INTEGER CHECK (mood_rating BETWEEN 1 AND 10),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, date)
);

-- Create indexes for better performance
CREATE INDEX idx_monitored_apps_user_id ON monitored_apps(user_id);
CREATE INDEX idx_monitored_apps_package_name ON monitored_apps(package_name);
CREATE INDEX idx_admin_requests_user_id ON admin_requests(user_id);
CREATE INDEX idx_admin_requests_admin_id ON admin_requests(admin_id);
CREATE INDEX idx_admin_requests_status ON admin_requests(status);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read);
CREATE INDEX idx_app_usage_logs_user_id ON app_usage_logs(user_id);
CREATE INDEX idx_app_usage_logs_timestamp ON app_usage_logs(timestamp);
CREATE INDEX idx_user_progress_user_id ON user_progress(user_id);
CREATE INDEX idx_user_progress_date ON user_progress(date);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers to relevant tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_monitored_apps_updated_at BEFORE UPDATE ON monitored_apps
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admin_requests_updated_at BEFORE UPDATE ON admin_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON user_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE monitored_apps ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;

-- Users can only see their own data
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

-- Monitored apps policies
CREATE POLICY "Users can view own monitored apps" ON monitored_apps
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own monitored apps" ON monitored_apps
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own monitored apps" ON monitored_apps
    FOR UPDATE USING (auth.uid() = user_id);

-- Admin requests policies
CREATE POLICY "Users can view own requests" ON admin_requests
    FOR SELECT USING (
        auth.uid() = user_id OR 
        auth.uid() = admin_id
    );

CREATE POLICY "Users can create requests" ON admin_requests
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can update requests" ON admin_requests
    FOR UPDATE USING (auth.uid() = admin_id);

-- Notifications policies
CREATE POLICY "Users can view own notifications" ON notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- App usage logs policies
CREATE POLICY "Users can view own usage logs" ON app_usage_logs
    FOR SELECT USING (
        auth.uid() = user_id OR
        auth.uid() IN (
            SELECT admin_id FROM users WHERE id = user_id
        )
    );

CREATE POLICY "Users can insert usage logs" ON app_usage_logs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User settings policies
CREATE POLICY "Users can view own settings" ON user_settings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings" ON user_settings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settings" ON user_settings
    FOR UPDATE USING (auth.uid() = user_id);

-- User progress policies
CREATE POLICY "Users can view own progress" ON user_progress
    FOR SELECT USING (
        auth.uid() = user_id OR
        auth.uid() IN (
            SELECT admin_id FROM users WHERE id = user_id
        )
    );

CREATE POLICY "Users can insert own progress" ON user_progress
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progress" ON user_progress
    FOR UPDATE USING (auth.uid() = user_id);

-- Support resources are publicly readable
CREATE POLICY "Support resources are publicly readable" ON support_resources
    FOR SELECT USING (true);

-- Functions for analytics and reporting
CREATE OR REPLACE FUNCTION get_user_stats(target_user_id UUID, days_back INTEGER DEFAULT 30)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total_requests', COUNT(*),
        'approved_requests', COUNT(*) FILTER (WHERE status = 'approved'),
        'denied_requests', COUNT(*) FILTER (WHERE status = 'denied'),
        'pending_requests', COUNT(*) FILTER (WHERE status = 'pending'),
        'apps_monitored', (
            SELECT COUNT(DISTINCT package_name) 
            FROM monitored_apps 
            WHERE user_id = target_user_id
        ),
        'current_clean_streak', (
            SELECT MAX(clean_days) 
            FROM user_progress 
            WHERE user_id = target_user_id 
            AND date >= CURRENT_DATE - INTERVAL '%s days'
        )
    ) INTO result
    FROM admin_requests
    WHERE user_id = target_user_id
    AND requested_at >= CURRENT_DATE - INTERVAL '%s days';
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to check if user can access app
CREATE OR REPLACE FUNCTION can_user_access_app(target_user_id UUID, app_package_name TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    app_blocked BOOLEAN;
    pending_request BOOLEAN;
BEGIN
    -- Check if app is blocked
    SELECT is_blocked INTO app_blocked
    FROM monitored_apps
    WHERE user_id = target_user_id AND package_name = app_package_name;
    
    IF app_blocked IS NULL THEN
        -- App not monitored, allow access
        RETURN TRUE;
    END IF;
    
    IF NOT app_blocked THEN
        -- App is explicitly allowed
        RETURN TRUE;
    END IF;
    
    -- Check if there's a pending or approved request
    SELECT EXISTS(
        SELECT 1 FROM admin_requests
        WHERE user_id = target_user_id
        AND package_name = app_package_name
        AND status = 'approved'
        AND requested_at >= CURRENT_DATE
    ) INTO pending_request;
    
    RETURN pending_request;
END;
$$ LANGUAGE plpgsql;

-- Insert default support resources
INSERT INTO support_resources (title, description, type, contact_info, is_emergency) VALUES
('National Suicide Prevention Lifeline', 'Free and confidential emotional support', 'hotline', '{"phone": "988"}', true),
('SAMHSA National Helpline', 'Treatment referral and information service', 'hotline', '{"phone": "1-800-662-4357"}', true),
('Crisis Text Line', 'Text-based crisis support', 'text', '{"number": "741741", "keyword": "HELLO"}', true),
('Narcotics Anonymous', 'Find local NA meetings', 'website', '{"url": "https://www.na.org/meetingsearch/"}', false),
('Alcoholics Anonymous', 'Find local AA meetings', 'website', '{"url": "https://www.aa.org/find-aa/north-america"}', false),
('SMART Recovery', 'Self-help meetings for addiction recovery', 'website', '{"url": "https://www.smartrecovery.org/meetings/"}', false);

-- Create default admin user (optional, for testing)
-- INSERT INTO auth.users (id, email) VALUES ('00000000-0000-0000-0000-000000000000', 'admin@secondchance.app');
-- INSERT INTO users (id, email, role) VALUES ('00000000-0000-0000-0000-000000000000', 'admin@secondchance.app', 'admin');

-- Example data for testing (remove in production)
-- INSERT INTO users (id, email, role, admin_id) VALUES 
--     ('11111111-1111-1111-1111-111111111111', 'user@example.com', 'user', '00000000-0000-0000-0000-000000000000');

-- INSERT INTO monitored_apps (user_id, name, package_name, is_blocked) VALUES
--     ('11111111-1111-1111-1111-111111111111', 'Snapchat', 'com.snapchat.android', true),
--     ('11111111-1111-1111-1111-111111111111', 'Telegram', 'org.telegram.messenger', true);

COMMENT ON TABLE users IS 'User accounts with role-based access';
COMMENT ON TABLE monitored_apps IS 'Apps that are monitored for each user';
COMMENT ON TABLE admin_requests IS 'Requests for app access approval';
COMMENT ON TABLE notifications IS 'Push notifications and alerts';
COMMENT ON TABLE app_usage_logs IS 'Log of all app interactions';
COMMENT ON TABLE user_settings IS 'User preferences and configuration';
COMMENT ON TABLE support_resources IS 'Crisis and recovery support resources';
COMMENT ON TABLE user_progress IS 'Daily progress tracking and mood logging';