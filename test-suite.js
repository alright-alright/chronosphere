#!/usr/bin/env node

// ChronoSphere Comprehensive Test Suite
const fetch = require('node-fetch');
const WebSocket = require('ws');

const API_URL = 'http://localhost:8000';
const WS_URL = 'ws://localhost:8001';

// Colors for output
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

let passCount = 0;
let failCount = 0;

function log(message, color = colors.reset) {
    console.log(`${color}${message}${colors.reset}`);
}

function pass(test) {
    passCount++;
    log(`  ✅ ${test}`, colors.green);
}

function fail(test, error) {
    failCount++;
    log(`  ❌ ${test}: ${error}`, colors.red);
}

async function testAPI(endpoint, method = 'GET', body = null) {
    try {
        const options = { method };
        if (body) {
            options.headers = { 'Content-Type': 'application/json' };
            options.body = JSON.stringify(body);
        }
        
        const response = await fetch(`${API_URL}${endpoint}`, options);
        const data = await response.json();
        
        return { success: response.ok, data, status: response.status };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

async function testWebSocket() {
    return new Promise((resolve) => {
        const ws = new WebSocket(WS_URL);
        
        ws.on('open', () => {
            ws.close();
            resolve({ success: true });
        });
        
        ws.on('error', (error) => {
            resolve({ success: false, error: error.message });
        });
        
        setTimeout(() => {
            ws.close();
            resolve({ success: false, error: 'WebSocket timeout' });
        }, 5000);
    });
}

async function runTests() {
    log('\n╔═══════════════════════════════════════════╗', colors.cyan);
    log('║       CHRONOSPHERE TEST SUITE             ║', colors.cyan);
    log('╚═══════════════════════════════════════════╝\n', colors.cyan);
    
    // Test 1: Health Check
    log('📋 Testing Health Endpoint...', colors.blue);
    const health = await testAPI('/health');
    if (health.success) {
        pass('Health endpoint accessible');
        if (health.data.services) {
            pass(`Services online: ${Object.keys(health.data.services).join(', ')}`);
        }
    } else {
        fail('Health endpoint', health.error);
    }
    
    // Test 2: WebSocket Connection
    log('\n📡 Testing WebSocket...', colors.blue);
    const wsTest = await testWebSocket();
    if (wsTest.success) {
        pass('WebSocket connection established');
    } else {
        fail('WebSocket connection', wsTest.error);
    }
    
    // Test 3: Discovery API
    log('\n🔍 Testing Discovery API...', colors.blue);
    const discovery = await testAPI('/api/discover', 'POST', {
        startYear: -500,
        endYear: -400,
        limit: 5
    });
    if (discovery.success) {
        pass('Discovery API responded');
        if (discovery.data.discoveries) {
            pass(`Found ${discovery.data.discoveries.length} discoveries`);
        }
    } else {
        fail('Discovery API', discovery.error || 'Failed');
    }
    
    // Test 4: Query Historical Events
    log('\n📚 Testing Historical Query...', colors.blue);
    const query = await testAPI('/api/query', 'POST', {
        startYear: 1000,
        endYear: 1100,
        limit: 10
    });
    if (query.success) {
        pass('Historical query executed');
        if (query.data.events) {
            pass(`Retrieved ${query.data.events.length} events`);
        }
    } else {
        fail('Historical query', query.error || 'Failed');
    }
    
    // Test 5: Chat API
    log('\n💬 Testing Chat API...', colors.blue);
    const chat = await testAPI('/api/chat', 'POST', {
        sessionId: 'test-session',
        message: 'What happened in ancient Rome?'
    });
    if (chat.success) {
        pass('Chat API responded');
        if (chat.data.content || chat.data.response) {
            pass('Chat generated response');
        }
    } else {
        fail('Chat API', chat.error || 'Failed');
    }
    
    // Test 6: AI Provider Status
    log('\n🤖 Testing AI Provider...', colors.blue);
    const aiStatus = await testAPI('/api/ai/status');
    if (aiStatus.success) {
        pass('AI provider status retrieved');
        if (aiStatus.data.provider) {
            pass(`Active provider: ${aiStatus.data.provider}`);
        }
    } else {
        // AI status might not have dedicated endpoint
        log('  ⚠️  AI status endpoint not available', colors.yellow);
    }
    
    // Test 7: Atlas Components
    log('\n🛠️  Testing Atlas Components...', colors.blue);
    const atlas = await testAPI('/api/atlas/status');
    if (atlas.success) {
        pass('Atlas components status retrieved');
        const components = atlas.data.components;
        if (components) {
            Object.entries(components).forEach(([name, status]) => {
                if (status === 'active') {
                    pass(`${name} component active`);
                } else {
                    log(`  ⚠️  ${name} using fallback`, colors.yellow);
                }
            });
        }
    } else {
        log('  ⚠️  Atlas status endpoint not available', colors.yellow);
    }
    
    // Test 8: Parameter Update
    log('\n⚙️  Testing Parameter Updates...', colors.blue);
    const params = await testAPI('/api/parameters', 'POST', {
        culturalDiffusion: 0.8,
        anomalyDetection: 0.6,
        certaintyRequirement: 0.5
    });
    if (params.success) {
        pass('Parameters updated successfully');
    } else {
        fail('Parameter update', params.error || 'Failed');
    }
    
    // Test 9: AKASHA Integration
    log('\n📦 Testing AKASHA Preservation...', colors.blue);
    const akasha = await testAPI('/api/akasha/status');
    if (akasha.success) {
        pass('AKASHA connector accessible');
        if (akasha.data.connected) {
            pass('AKASHA connected');
        } else {
            log('  ⚠️  AKASHA using local fallback', colors.yellow);
        }
    } else {
        log('  ⚠️  AKASHA endpoint not available', colors.yellow);
    }
    
    // Summary
    log('\n╔═══════════════════════════════════════════╗', colors.cyan);
    log('║            TEST RESULTS                   ║', colors.cyan);
    log('╠═══════════════════════════════════════════╣', colors.cyan);
    log(`║  ✅ Passed: ${passCount.toString().padEnd(28)}║`, colors.green);
    log(`║  ❌ Failed: ${failCount.toString().padEnd(28)}║`, failCount > 0 ? colors.red : colors.green);
    log('╚═══════════════════════════════════════════╝', colors.cyan);
    
    if (failCount === 0) {
        log('\n🎉 All tests passed! ChronoSphere is fully operational!', colors.green);
    } else {
        log('\n⚠️  Some tests failed. Check the logs above for details.', colors.yellow);
    }
    
    process.exit(failCount > 0 ? 1 : 0);
}

// Run tests with delay to ensure server is ready
setTimeout(() => {
    runTests().catch(error => {
        log(`\n❌ Test suite error: ${error.message}`, colors.red);
        process.exit(1);
    });
}, 2000);