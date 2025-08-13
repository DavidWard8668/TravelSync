// 🛡️ Second Chance - Professional Recovery Support Application
// Full-featured Express server with beautiful GUI

const express = require('express');
const path = require('path');
const { errorHandler, errorStats } = require('./middleware/errorHandler');
const app = express();
const PORT = 3001;

// Middleware
app.use(express.json());
app.use(express.static('public'));

// CORS for development
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    next();
});

// Mock database
let monitoredApps = [
    { 
        id: '1', 
        name: 'Snapchat', 
        packageName: 'com.snapchat.android', 
        isBlocked: true,
        icon: '👻',
        blockCount: 45,
        lastBlocked: new Date().toISOString()
    },
    { 
        id: '2', 
        name: 'Telegram', 
        packageName: 'org.telegram.messenger', 
        isBlocked: true,
        icon: '✈️',
        blockCount: 23,
        lastBlocked: new Date().toISOString()
    },
    { 
        id: '3', 
        name: 'Instagram', 
        packageName: 'com.instagram.android', 
        isBlocked: false,
        icon: '📸',
        blockCount: 0,
        lastBlocked: null
    },
    { 
        id: '4', 
        name: 'WhatsApp', 
        packageName: 'com.whatsapp', 
        isBlocked: false,
        icon: '💬',
        blockCount: 0,
        lastBlocked: null
    },
    { 
        id: '5', 
        name: 'TikTok', 
        packageName: 'com.zhiliaoapp.musically', 
        isBlocked: true,
        icon: '🎵',
        blockCount: 12,
        lastBlocked: new Date().toISOString()
    }
];

let adminRequests = [
    {
        id: 'req1',
        appId: '1',
        appName: 'Snapchat',
        timestamp: new Date(Date.now() - 600000).toISOString(),
        status: 'pending',
        reason: 'App usage detected - User trying to open Snapchat',
        userMessage: 'I need to check an important message from my sponsor',
        urgency: 'high'
    },
    {
        id: 'req2',
        appId: '2',
        appName: 'Telegram',
        timestamp: new Date(Date.now() - 1800000).toISOString(),
        status: 'pending',
        reason: 'App usage detected - Multiple attempts to open Telegram',
        userMessage: 'Work emergency - need to access work group',
        urgency: 'medium'
    },
    {
        id: 'req3',
        appId: '1',
        appName: 'Snapchat',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        status: 'approved',
        reason: 'User requested temporary access',
        userMessage: 'Family photo sharing',
        urgency: 'low',
        respondedAt: new Date(Date.now() - 3500000).toISOString(),
        respondedBy: 'Sarah (Admin)'
    }
];

let userStats = {
    userId: 'user123',
    name: 'John',
    cleanDays: 47,
    totalBlocked: 892,
    requestsApproved: 12,
    requestsDenied: 45,
    currentStreak: 8,
    longestStreak: 23,
    triggers: ['evening', 'weekends', 'stress'],
    recoveryScore: 78,
    weeklyData: [
        { day: 'Mon', blocks: 12, requests: 2 },
        { day: 'Tue', blocks: 8, requests: 1 },
        { day: 'Wed', blocks: 15, requests: 3 },
        { day: 'Thu', blocks: 6, requests: 0 },
        { day: 'Fri', blocks: 18, requests: 4 },
        { day: 'Sat', blocks: 22, requests: 5 },
        { day: 'Sun', blocks: 14, requests: 2 }
    ]
};

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API Routes
app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        app: 'Second Chance Recovery Support',
        version: '2.0.0',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        features: {
            monitoring: true,
            notifications: true,
            crisisSupport: true,
            adminControl: true
        }
    });
});

app.get('/api/monitored-apps', (req, res) => {
    res.json({
        apps: monitoredApps,
        total: monitoredApps.length,
        blocked: monitoredApps.filter(a => a.isBlocked).length,
        allowed: monitoredApps.filter(a => !a.isBlocked).length,
        totalBlocksToday: monitoredApps.reduce((sum, app) => sum + (app.blockCount || 0), 0)
    });
});

app.post('/api/monitored-apps', (req, res) => {
    const newApp = {
        id: Date.now().toString(),
        ...req.body,
        blockCount: 0,
        lastBlocked: null
    };
    monitoredApps.push(newApp);
    res.json({ success: true, app: newApp });
});

app.put('/api/monitored-apps/:id', (req, res) => {
    const app = monitoredApps.find(a => a.id === req.params.id);
    if (app) {
        Object.assign(app, req.body);
        res.json({ success: true, app });
    } else {
        res.status(404).json({ error: 'App not found' });
    }
});

app.delete('/api/monitored-apps/:id', (req, res) => {
    const index = monitoredApps.findIndex(a => a.id === req.params.id);
    if (index !== -1) {
        monitoredApps.splice(index, 1);
        res.json({ success: true });
    } else {
        res.status(404).json({ error: 'App not found' });
    }
});

app.get('/api/admin-requests', (req, res) => {
    res.json({
        requests: adminRequests,
        total: adminRequests.length,
        pending: adminRequests.filter(r => r.status === 'pending').length,
        approved: adminRequests.filter(r => r.status === 'approved').length,
        denied: adminRequests.filter(r => r.status === 'denied').length
    });
});

app.post('/api/admin-requests/:id/:action', (req, res) => {
    const request = adminRequests.find(r => r.id === req.params.id);
    if (request) {
        request.status = req.params.action;
        request.respondedAt = new Date().toISOString();
        request.respondedBy = 'Sarah (Admin)';
        
        // If approved, temporarily unblock the app
        if (req.params.action === 'approved') {
            const app = monitoredApps.find(a => a.id === request.appId);
            if (app) {
                app.temporaryAccess = true;
                app.accessUntil = new Date(Date.now() + 3600000).toISOString(); // 1 hour access
            }
        }
        
        res.json({ success: true, request });
    } else {
        res.status(404).json({ error: 'Request not found' });
    }
});

app.get('/api/user/stats', (req, res) => {
    res.json(userStats);
});

app.get('/api/crisis-resources', (req, res) => {
    res.json({
        emergency: {
            suicide_prevention: {
                number: '988',
                text: 'Available 24/7',
                description: 'Suicide & Crisis Lifeline'
            },
            crisis_text: {
                number: '741741',
                text: 'Text HOME',
                description: 'Crisis Text Line'
            },
            samhsa: {
                number: '1-800-662-4357',
                text: 'Available 24/7',
                description: 'SAMHSA National Helpline'
            }
        },
        resources: [
            {
                name: 'Narcotics Anonymous',
                website: 'https://na.org',
                description: 'Find local meetings and support'
            },
            {
                name: 'SMART Recovery',
                website: 'https://smartrecovery.org',
                description: '4-Point Program for recovery'
            },
            {
                name: 'Recovery.org',
                website: 'https://recovery.org',
                description: 'Resources and treatment options'
            }
        ]
    });
});

// Simulate app detection event
app.post('/api/simulate-detection/:appId', (req, res) => {
    const app = monitoredApps.find(a => a.id === req.params.appId);
    if (app && app.isBlocked) {
        app.blockCount = (app.blockCount || 0) + 1;
        app.lastBlocked = new Date().toISOString();
        
        const newRequest = {
            id: 'req' + Date.now(),
            appId: app.id,
            appName: app.name,
            timestamp: new Date().toISOString(),
            status: 'pending',
            reason: `App usage detected - User trying to open ${app.name}`,
            userMessage: req.body.message || 'Requesting access',
            urgency: 'high'
        };
        
        adminRequests.unshift(newRequest);
        
        res.json({
            blocked: true,
            app: app.name,
            message: `${app.name} has been blocked. Admin notification sent.`,
            request: newRequest
        });
    } else {
        res.json({
            blocked: false,
            message: app ? `${app.name} is not blocked` : 'App not found'
        });
    }
});

// Error statistics endpoint
app.get('/api/error-stats', (req, res) => {
    res.json({
        status: 'success',
        stats: errorStats(),
        timestamp: new Date().toISOString(),
        message: 'Error tracking active for recovery support system'
    });
});

// Global error handler (must be last middleware)
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
    console.log('');
    console.log('🛡️  Second Chance Recovery Support Application');
    console.log('================================================');
    console.log(`✅ Server running at: http://localhost:${PORT}`);
    console.log(`📊 Dashboard: http://localhost:${PORT}`);
    console.log(`🔧 API Health: http://localhost:${PORT}/api/health`);
    console.log('');
    console.log('Features enabled:');
    console.log('  ✓ Beautiful Web Dashboard');
    console.log('  ✓ Real-time App Monitoring');
    console.log('  ✓ Admin Request Management');
    console.log('  ✓ Crisis Support Integration');
    console.log('  ✓ Usage Statistics & Analytics');
    console.log('');
    console.log('Ready to support recovery! 💪');
});