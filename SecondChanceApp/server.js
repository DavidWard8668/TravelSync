#!/usr/bin/env node

// 🚀 Second Chance Recovery Support App
// Autonomous development by Claude Code
// Helping people overcome addiction through admin oversight

console.log('🚀 Second Chance Server Starting...');
console.log('Addiction Recovery Support with Admin Oversight');
console.log('===============================================');

const http = require('http');
const url = require('url');
const querystring = require('querystring');
const fs = require('fs');
const path = require('path');

// Mock database for Second Chance app
let monitoredApps = [
    { 
        id: '1', 
        name: 'Snapchat', 
        packageName: 'com.snapchat.android', 
        isBlocked: true,
        riskLevel: 'high',
        lastDetected: null
    },
    { 
        id: '2', 
        name: 'Telegram', 
        packageName: 'org.telegram.messenger', 
        isBlocked: true,
        riskLevel: 'high',
        lastDetected: null
    },
    { 
        id: '3', 
        name: 'WhatsApp', 
        packageName: 'com.whatsapp', 
        isBlocked: false,
        riskLevel: 'medium',
        lastDetected: null
    },
    { 
        id: '4', 
        name: 'Instagram', 
        packageName: 'com.instagram.android', 
        isBlocked: true,
        riskLevel: 'medium',
        lastDetected: null
    }
];

let adminRequests = [
    { 
        id: '1', 
        userId: 'user123',
        appName: 'Snapchat', 
        packageName: 'com.snapchat.android',
        requestedAt: new Date().toISOString(), 
        status: 'pending',
        reason: 'App installation detected',
        adminResponse: null
    }
];

let users = [
    {
        id: 'user123',
        email: 'user@example.com',
        role: 'user',
        adminId: 'admin456',
        cleanDays: 45,
        totalBlocked: 12
    },
    {
        id: 'admin456',
        email: 'admin@example.com',
        role: 'admin',
        managedUsers: ['user123']
    }
];

const crisisResources = [
    {
        name: 'National Suicide Prevention Lifeline',
        contact: '988',
        type: 'phone',
        available: '24/7',
        emergency: true
    },
    {
        name: 'Crisis Text Line',
        contact: '741741',
        keyword: 'HOME',
        type: 'text',
        available: '24/7',
        emergency: true
    },
    {
        name: 'SAMHSA National Helpline',
        contact: '1-800-662-4357',
        type: 'phone',
        available: '24/7',
        emergency: false
    },
    {
        name: 'Narcotics Anonymous',
        contact: 'https://www.na.org/meetingsearch/',
        type: 'website',
        available: '24/7',
        emergency: false
    }
];

// Utility functions
function sendJSON(res, data, status = 200) {
    res.writeHead(status, { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
    res.end(JSON.stringify(data, null, 2));
}

function simulateAppDetection(appId) {
    const app = monitoredApps.find(a => a.id === appId);
    if (app && app.isBlocked) {
        // Create admin request
        const request = {
            id: Date.now().toString(),
            userId: 'user123',
            appName: app.name,
            packageName: app.packageName,
            requestedAt: new Date().toISOString(),
            status: 'pending',
            reason: 'App usage detected - requires admin approval',
            adminResponse: null
        };
        
        adminRequests.push(request);
        app.lastDetected = new Date().toISOString();
        
        console.log(`🚨 ALERT: ${app.name} usage detected - Admin notification sent`);
        return request;
    }
    return null;
}

// Create HTTP server
const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const method = req.method;
    const pathname = parsedUrl.pathname;
    
    console.log(`${method} ${pathname}`);
    
    // Handle CORS preflight
    if (method === 'OPTIONS') {
        res.writeHead(200, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        });
        res.end();
        return;
    }
    
    // Route handling
    switch (pathname) {
        case '/':
            // Serve the beautiful HTML dashboard
            const htmlPath = path.join(__dirname, 'public', 'index.html');
            fs.readFile(htmlPath, (err, data) => {
                if (err) {
                    // Fallback to JSON if HTML not found
                    sendJSON(res, { 
                message: 'Second Chance API - Recovery Support System',
                version: '1.0.0',
                features: [
                    'Admin oversight for addiction recovery',
                    'Real-time app monitoring',
                    'Permission-based access control',
                    'Crisis support integration'
                ],
                endpoints: {
                    '/health': 'Health check',
                    '/monitored-apps': 'Get monitored apps',
                    '/admin-requests': 'Get admin requests',
                    '/crisis-resources': 'Get crisis support resources',
                    '/users/:id/stats': 'Get user statistics',
                    '/simulate-detection/:appId': 'Simulate app detection'
                },
                crisis_support: {
                    suicide_prevention: '988',
                    crisis_text: 'Text HOME to 741741',
                    samhsa_helpline: '1-800-662-4357'
                }
            });
                } else {
                    res.writeHead(200, { 'Content-Type': 'text/html' });
                    res.end(data);
                }
            });
            break;
            
        case '/health':
            sendJSON(res, { 
                status: 'healthy', 
                app: 'Second Chance Recovery Support',
                version: '1.0.0',
                timestamp: new Date().toISOString(),
                message: 'System operational - Ready to support recovery'
            });
            break;
            
        case '/api/monitored-apps':
        case '/monitored-apps':
            if (method === 'GET') {
                sendJSON(res, {
                    apps: monitoredApps,
                    total: monitoredApps.length,
                    blocked: monitoredApps.filter(a => a.isBlocked).length,
                    allowed: monitoredApps.filter(a => !a.isBlocked).length
                });
            }
            break;
            
        case '/api/admin-requests':
        case '/admin-requests':
            if (method === 'GET') {
                const pending = adminRequests.filter(r => r.status === 'pending');
                sendJSON(res, {
                    requests: adminRequests,
                    total: adminRequests.length,
                    pending: pending.length,
                    urgent: pending.filter(r => r.reason.includes('detected')).length
                });
            }
            break;
            
        case '/crisis-resources':
            sendJSON(res, {
                resources: crisisResources,
                emergency_numbers: {
                    suicide_prevention: '988',
                    crisis_text: '741741 (Text HOME)',
                    samhsa: '1-800-662-4357'
                },
                message: 'Help is available 24/7'
            });
            break;
            
        case '/api/user/stats':
        case '/users/user123/stats':
            const user = users.find(u => u.id === 'user123');
            if (user) {
                sendJSON(res, {
                    userId: user.id,
                    cleanDays: user.cleanDays,
                    totalBlocked: user.totalBlocked,
                    monitoredApps: monitoredApps.length,
                    pendingRequests: adminRequests.filter(r => r.status === 'pending').length,
                    lastActivity: new Date().toISOString(),
                    recovery_progress: {
                        milestone: user.cleanDays > 30 ? '30+ days clean!' : 'Building momentum',
                        next_goal: user.cleanDays < 30 ? '30 days' : '60 days',
                        support_available: true
                    }
                });
            } else {
                sendJSON(res, { error: 'User not found' }, 404);
            }
            break;
            
        default:
            // Handle dynamic routes
            const simulateMatch = pathname.match(/^\/simulate-detection\/(.+)$/);
            const approveMatch = pathname.match(/^\/api\/admin-requests\/(.+)\/approved$/) || pathname.match(/^\/admin-requests\/(.+)\/approve$/);
            const denyMatch = pathname.match(/^\/api\/admin-requests\/(.+)\/denied$/) || pathname.match(/^\/admin-requests\/(.+)\/deny$/);
            
            if (simulateMatch && method === 'POST') {
                const appId = simulateMatch[1];
                const request = simulateAppDetection(appId);
                if (request) {
                    sendJSON(res, { 
                        success: true, 
                        message: `App detection simulated for app ${appId}`,
                        request: request,
                        alert_sent: true
                    });
                } else {
                    sendJSON(res, { 
                        success: false, 
                        message: 'App not found or not blocked' 
                    }, 400);
                }
            } else if (approveMatch && method === 'POST') {
                const requestId = approveMatch[1];
                const request = adminRequests.find(r => r.id === requestId);
                if (request) {
                    request.status = 'approved';
                    request.adminResponse = 'Request approved by admin';
                    
                    // Unblock the app temporarily
                    const app = monitoredApps.find(a => a.packageName === request.packageName);
                    if (app) {
                        app.isBlocked = false;
                    }
                    
                    sendJSON(res, { 
                        success: true, 
                        message: 'Request approved',
                        request: request
                    });
                } else {
                    sendJSON(res, { error: 'Request not found' }, 404);
                }
            } else if (denyMatch && method === 'POST') {
                const requestId = denyMatch[1];
                const request = adminRequests.find(r => r.id === requestId);
                if (request) {
                    request.status = 'denied';
                    request.adminResponse = 'Request denied by admin';
                    
                    sendJSON(res, { 
                        success: true, 
                        message: 'Request denied',
                        request: request
                    });
                } else {
                    sendJSON(res, { error: 'Request not found' }, 404);
                }
            } else {
                sendJSON(res, { 
                    error: 'Endpoint not found',
                    available_endpoints: [
                        '/', '/health', '/monitored-apps', '/admin-requests',
                        '/crisis-resources', '/users/:id/stats', '/simulate-detection/:appId'
                    ]
                }, 404);
            }
    }
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log('');
    console.log('✅ Second Chance server running successfully!');
    console.log(`🌐 Server: http://localhost:${PORT}`);
    console.log('');
    console.log('📱 API Endpoints:');
    console.log(`   GET  http://localhost:${PORT}/               - API overview`);
    console.log(`   GET  http://localhost:${PORT}/health         - Health check`);
    console.log(`   GET  http://localhost:${PORT}/monitored-apps - Monitored apps`);
    console.log(`   GET  http://localhost:${PORT}/admin-requests - Admin requests`);
    console.log(`   GET  http://localhost:${PORT}/crisis-resources - Crisis support`);
    console.log(`   POST http://localhost:${PORT}/simulate-detection/1 - Simulate app detection`);
    console.log('');
    console.log('🆘 Crisis Support Available 24/7:');
    console.log('   📞 National Suicide Prevention: 988');
    console.log('   📱 Crisis Text Line: Text HOME to 741741');
    console.log('   📞 SAMHSA Helpline: 1-800-662-4357');
    console.log('');
    console.log('🎯 Second Chance Features:');
    console.log('   👥 Admin oversight for addiction recovery');
    console.log('   📱 Real-time app monitoring (Snapchat, Telegram, etc.)');
    console.log('   ✅ Permission-based app access control');
    console.log('   🚨 Instant admin alerts for risky app usage');
    console.log('   📊 Recovery progress tracking');
    console.log('   🆘 Integrated crisis support resources');
    console.log('');
    console.log('💪 Ready to help people in their recovery journey!');
    console.log('🤖 Built autonomously by Claude Code');
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('🔄 Shutting down Second Chance server gracefully...');
    server.close(() => {
        console.log('✅ Second Chance server closed');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('\n🔄 Shutting down Second Chance server...');
    server.close(() => {
        console.log('✅ Second Chance server closed');
        process.exit(0);
    });
});