#!/usr/bin/env node

// 🧪 Second Chance App Test Suite
// Autonomous testing by Claude Code

console.log('🧪 Second Chance Recovery App - Test Suite');
console.log('==========================================');
console.log('');

const http = require('http');

// Test configuration
const BASE_URL = 'http://localhost:3000';
let testsPassed = 0;
let testsTotal = 0;

function runTest(name, testFunction) {
    testsTotal++;
    console.log(`Test ${testsTotal}: ${name}`);
    
    return new Promise((resolve) => {
        testFunction((passed, message) => {
            if (passed) {
                console.log(`   ✅ PASS: ${message || 'Test passed'}`);
                testsPassed++;
            } else {
                console.log(`   ❌ FAIL: ${message || 'Test failed'}`);
            }
            resolve(passed);
        });
    });
}

function makeRequest(path, callback) {
    const req = http.get(`${BASE_URL}${path}`, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
            try {
                const parsed = JSON.parse(data);
                callback(null, res.statusCode, parsed);
            } catch (err) {
                callback(err, res.statusCode, data);
            }
        });
    });
    
    req.on('error', (err) => callback(err, 0, null));
    req.setTimeout(5000, () => {
        req.destroy();
        callback(new Error('Request timeout'), 0, null);
    });
}

async function runAllTests() {
    console.log('🚀 Starting Second Chance test suite...\n');
    
    // Test 1: Server health check
    await runTest('Server Health Check', (done) => {
        makeRequest('/health', (err, status, data) => {
            if (err) {
                done(false, `Server not responding: ${err.message}`);
            } else if (status === 200 && data.status === 'healthy') {
                done(true, `Server healthy (${data.message})`);
            } else {
                done(false, `Unexpected response: ${status}`);
            }
        });
    });
    
    // Test 2: API overview endpoint
    await runTest('API Overview', (done) => {
        makeRequest('/', (err, status, data) => {
            if (err) {
                done(false, `API overview failed: ${err.message}`);
            } else if (status === 200 && data.message) {
                done(true, 'API overview working');
            } else {
                done(false, `Unexpected response: ${status}`);
            }
        });
    });
    
    // Test 3: Monitored apps endpoint
    await runTest('Monitored Apps Endpoint', (done) => {
        makeRequest('/monitored-apps', (err, status, data) => {
            if (err) {
                done(false, `Monitored apps failed: ${err.message}`);
            } else if (status === 200 && data.apps && Array.isArray(data.apps)) {
                const blockedCount = data.apps.filter(app => app.isBlocked).length;
                done(true, `Found ${data.apps.length} monitored apps, ${blockedCount} blocked`);
            } else {
                done(false, `Unexpected response: ${status}`);
            }
        });
    });
    
    // Test 4: Admin requests endpoint
    await runTest('Admin Requests Endpoint', (done) => {
        makeRequest('/admin-requests', (err, status, data) => {
            if (err) {
                done(false, `Admin requests failed: ${err.message}`);
            } else if (status === 200 && data.requests) {
                const pendingCount = data.pending || 0;
                done(true, `Admin requests working, ${pendingCount} pending`);
            } else {
                done(false, `Unexpected response: ${status}`);
            }
        });
    });
    
    // Test 5: Crisis resources endpoint
    await runTest('Crisis Resources', (done) => {
        makeRequest('/crisis-resources', (err, status, data) => {
            if (err) {
                done(false, `Crisis resources failed: ${err.message}`);
            } else if (status === 200 && data.resources && data.emergency_numbers) {
                const emergencyCount = data.resources.filter(r => r.emergency).length;
                done(true, `Crisis resources working, ${emergencyCount} emergency contacts`);
            } else {
                done(false, `Unexpected response: ${status}`);
            }
        });
    });
    
    // Test 6: User stats endpoint
    await runTest('User Statistics', (done) => {
        makeRequest('/users/user123/stats', (err, status, data) => {
            if (err) {
                done(false, `User stats failed: ${err.message}`);
            } else if (status === 200 && data.cleanDays !== undefined) {
                done(true, `User stats working, ${data.cleanDays} clean days`);
            } else {
                done(false, `Unexpected response: ${status}`);
            }
        });
    });
    
    // Test 7: App detection simulation
    await runTest('App Detection Simulation', (done) => {
        const postData = '';
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: '/simulate-detection/1',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };
        
        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    if (res.statusCode === 200 && parsed.success) {
                        done(true, 'App detection simulation working');
                    } else {
                        done(false, `Detection failed: ${parsed.message || 'Unknown error'}`);
                    }
                } catch (err) {
                    done(false, `JSON parse error: ${err.message}`);
                }
            });
        });
        
        req.on('error', (err) => done(false, `Request error: ${err.message}`));
        req.setTimeout(5000, () => {
            req.destroy();
            done(false, 'Request timeout');
        });
        
        req.write(postData);
        req.end();
    });
    
    // Test 8: Error handling (404)
    await runTest('Error Handling', (done) => {
        makeRequest('/nonexistent-endpoint', (err, status, data) => {
            if (err) {
                done(false, `Error handling test failed: ${err.message}`);
            } else if (status === 404) {
                done(true, 'Error handling working (404 returned)');
            } else {
                done(false, `Expected 404, got ${status}`);
            }
        });
    });
    
    // Display results
    console.log('\n' + '='.repeat(50));
    console.log('📊 TEST RESULTS SUMMARY');
    console.log('='.repeat(50));
    
    const passRate = ((testsPassed / testsTotal) * 100).toFixed(1);
    console.log(`Tests Passed: ${testsPassed}/${testsTotal} (${passRate}%)`);
    
    if (testsPassed === testsTotal) {
        console.log('🎉 ALL TESTS PASSED! Second Chance app is working perfectly!');
        console.log('');
        console.log('✅ Core Features Verified:');
        console.log('   👥 Admin oversight system operational');
        console.log('   📱 App monitoring endpoints working');
        console.log('   🚨 Alert simulation functioning');
        console.log('   🆘 Crisis resources accessible');
        console.log('   📊 User statistics tracking');
        console.log('   🔧 Error handling robust');
        console.log('');
        console.log('🚀 Second Chance is ready to help people in recovery!');
    } else {
        console.log('⚠️  Some tests failed. Check server logs for details.');
        console.log('🔧 Run "npm start" first to ensure server is running.');
    }
    
    console.log('');
    console.log('🆘 Crisis Support Always Available:');
    console.log('   📞 National Suicide Prevention: 988');
    console.log('   📱 Crisis Text Line: Text HOME to 741741');
    console.log('   📞 SAMHSA Helpline: 1-800-662-4357');
    console.log('');
    console.log('💪 Testing completed - Built autonomously by Claude Code');
    
    process.exit(testsPassed === testsTotal ? 0 : 1);
}

// Start testing
console.log('⏱️  Waiting for server to be ready...\n');
setTimeout(() => {
    runAllTests().catch((err) => {
        console.error('❌ Test suite failed:', err.message);
        process.exit(1);
    });
}, 2000);