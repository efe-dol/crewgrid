#!/usr/bin/env node

/**
 * Simplified Security Test Suite for Crewgrid
 * ==============================================
 * Tests RLS and IDOR protection via PostgREST API directly.
 * 
 * Run: node scripts/security-test-simple.js
 */

const https = require('https');
const http = require('http');
const jwt = require('jsonwebtoken');

// ============================================================================
// Configuration
// ============================================================================

require('dotenv').config({ path: '.env.test' });

const CONFIG = {
  SUPABASE_URL: process.env.SUPABASE_TEST_URL || 'http://localhost:8090',
  JWT_SECRET: process.env.JWT_SECRET,
  ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY
};

// Test user configuration (must match database)
const TEST_USERS = {
  admin: { jwt_sub: 'test-user-Administrator', email: 'administrator@test.com', role: 'Administrator' },
  manager: { jwt_sub: 'test-user-Manager', email: 'manager@test.com', role: 'Manager' },
  regular: { jwt_sub: 'test-user-Mitarbeiter', email: 'mitarbeiter@test.com', role: 'Mitarbeiter' }
};

let USER_TOKENS = {};
let CONTACT_IDS = {};

// ============================================================================
// Test Results Tracking
// ============================================================================

const RESULTS = {
  passed: [],
  failed: [],
  warnings: [],
  skipped: []
};

function recordTest(name, category, passed, details = '') {
  const result = { name, category, passed, details };
  if (passed) RESULTS.passed.push(result);
  else RESULTS.failed.push(result);
  return result;
}

// ============================================================================
// HTTP Helpers
// ============================================================================

async function httpRequest(options) {
  return new Promise((resolve, reject) => {
    const client = options.protocol === 'https:' ? https : http;
    const req = client.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });
    req.on('error', reject);
    if (options.body) req.write(options.body);
    req.end();
  });
}

async function fetch(url, options = {}) {
  const urlObj = new URL(url);
  const reqOptions = {
    hostname: urlObj.hostname,
    port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
    path: urlObj.pathname + urlObj.search,
    method: options.method || 'GET',
    headers: options.headers || {},
    protocol: urlObj.protocol
  };

  if (options.body) {
    reqOptions.headers['Content-Type'] = 'application/json';
    reqOptions.body = typeof options.body === 'string' ? options.body : JSON.stringify(options.body);
  }

  try {
    const response = await httpRequest(reqOptions);
    return {
      status: response.status,
      headers: response.headers,
      json: () => response.body ? JSON.parse(response.body) : {},
      text: () => response.body
    };
  } catch (error) {
    throw new Error(`Request failed: ${error.message}`);
  }
}

// ============================================================================
// JWT Token Generation
// ============================================================================

function generateToken(user) {
  return jwt.sign(
    { 
      sub: user.jwt_sub,
      role: user.role,
      email: user.email 
    },
    CONFIG.JWT_SECRET,
    { expiresIn: '24h' }
  );
}

// ============================================================================
// Test Setup
// ============================================================================

async function setupTestEnvironment() {
  console.log('\n📋 Setting up test environment...\n');

  // Generate JWT tokens for all test users
  console.log('🔐 Generating test user tokens...');
  for (const [role, user] of Object.entries(TEST_USERS)) {
    USER_TOKENS[role] = generateToken(user);
    console.log(`   ✅ ${user.email} (${user.role})`);
  }

  // Fetch contact IDs using service role (bypass RLS)
  console.log('\n🔗 Retrieving contact IDs...');
  try {
    const response = await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/contacts?select=id,first_name,last_name`, {
      headers: { 'apikey': CONFIG.SERVICE_ROLE_KEY }
    });
    
    const contacts = await response.json();
    for (const contact of contacts) {
      if (contact.first_name === 'Admin') CONTACT_IDS.admin = contact.id;
      else if (contact.first_name === 'Manager') CONTACT_IDS.manager = contact.id;
      else if (contact.first_name === 'Regular') CONTACT_IDS.regular = contact.id;
    }
    
    for (const [role, contactId] of Object.entries(CONTACT_IDS)) {
      console.log(`   ✅ ${TEST_USERS[role].email} → Contact ID: ${contactId}`);
    }
  } catch (error) {
    console.log(`   ⚠️  Could not retrieve contacts: ${error.message}`);
  }

  console.log('\n✅ Test environment ready!\n');
}

// ============================================================================
// TEST SUITE
// ============================================================================

async function testRLSBypass() {
  console.log('\n🔴 CRITICAL: RLS Bypass Test');
  console.log('   Testing if unauthenticated users can access contact data...\n');

  // Try to read ALL contacts without authentication (using anon key only)
  const response = await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/contacts?select=*`, {
    headers: { 'apikey': CONFIG.ANON_KEY }
  });

  let data;
  try {
    data = await response.json();
  } catch {
    data = [];
  }

  const testPassed = data.length === 0 || (Array.isArray(data) && !data.find(c => c.id));
  
  return recordTest(
    'Unauthenticated Read Protection',
    'RLS Bypass',
    testPassed,
    `Anon key returned ${data.length} records. Expected: 0 or empty array.`
  );
}

async function testIDORRegularUser() {
  console.log('\n🔴 CRITICAL: IDOR Test - Regular User Accessing Another Contact');
  
  if (!USER_TOKENS.regular || !CONTACT_IDS.admin) {
    return recordTest('IDOR Regular User', 'IDOR', null, 'Missing test data (user tokens or contact IDs)');
  }

  const regularToken = USER_TOKENS.regular;
  const adminContactId = CONTACT_IDS.admin;

  console.log(`   Regular user trying to READ admin contact: ${adminContactId}`);
  
  // Try to read another user's contact via REST API
  let readResponse;
  try {
    readResponse = await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/contacts?id=eq.${adminContactId}`, {
      headers: {
        'apikey': regularToken,
        'Authorization': `Bearer ${regularToken}`
      }
    });
  } catch (error) {
    console.log(`   ⚠️  Read request failed: ${error.message}`);
  }

  let readResult;
  try { readResult = await readResponse.json(); } catch { readResult = []; }

  const canReadOther = readResult.length > 0 && readResult[0]?.id === adminContactId;

  console.log(`\n   Regular user trying to UPDATE admin contact: ${adminContactId}`);
  
  // Try to update another user's contact via REST API
  let updateResponse;
  try {
    updateResponse = await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/contacts?id=eq.${adminContactId}`, {
      method: 'PATCH',
      headers: {
        'apikey': regularToken,
        'Authorization': `Bearer ${regularToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ notes: 'IDOR TEST - SHOULD FAIL' })
    });
  } catch (error) {
    console.log(`   ⚠️  Update request failed: ${error.message}`);
  }

  let updateResult;
  try { updateResult = await updateResponse.json(); } catch { updateResult = []; }

  const canUpdateOther = updateResult.length > 0 && updateResult[0]?.id === adminContactId;

  // Clean up: revert any changes
  if (canUpdateOther) {
    await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/contacts?id=eq.${adminContactId}`, {
      method: 'PATCH',
      headers: { 'apikey': CONFIG.SERVICE_ROLE_KEY },
      body: JSON.stringify({ notes: 'Administrator contact' })
    });
  }

  return recordTest(
    'IDOR Prevention',
    'IDOR',
    (!canReadOther && !canUpdateOther),
    `REST Read: ${canReadOther ? '⚠️  ACCESSIBLE (VULNERABLE!)' : '✅ BLOCKED'}, `
    + `REST Update: ${canUpdateOther ? '⚠️  ACCESSIBLE (VULNERABLE!)' : '✅ BLOCKED'}\n`
    + (readResponse?.status || '')
  );
}

async function testIDORAdminAccessAll() {
  console.log('\n🟢 Admin Access Test - Administrator Should Access All Contacts');
  
  if (!USER_TOKENS.admin) {
    return recordTest('Admin Access', 'Authorization', null, 'No admin token available');
  }

  const adminToken = USER_TOKENS.admin;

  console.log('   Admin trying to read all contacts...\n');
  
  const response = await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/contacts?select=*`, {
    headers: { 'apikey': adminToken }
  });

  let data;
  try { data = await response.json(); } catch { data = []; }

  // Admin should be able to see at least their own contact, ideally all
  const testPassed = data.length >= 1;
  
  return recordTest(
    'Admin Access All Contacts',
    'Authorization',
    testPassed,
    `Admin returned ${data.length} records (expected: ≥1)`
  );
}

async function testSQLInjection() {
  console.log('\n🟡 MEDIUM: SQL Injection Test');
  
  const maliciousInputs = [
    "test' OR '1'='1",
    "test'; DROP TABLE contacts;--",
    "test' UNION SELECT * FROM users WHERE"
  ];

  let vulnerableFound = false;

  for (const input of maliciousInputs) {
    try {
      const response = await fetch(
        `${CONFIG.SUPABASE_URL}/rest/v1/contacts?search=${encodeURIComponent(input)}`,
        { headers: { 'apikey': CONFIG.ANON_KEY } }
      );
      
      const data = await response.json();
      if (data && Array.isArray(data) && data.length > 10) {
        vulnerableFound = true;
        console.log(`   ⚠️  SQL injection may work with: ${input}`);
      }
    } catch (error) {
      // Error is expected for invalid queries - not necessarily a vuln
    }
  }

  return recordTest(
    'SQL Injection Protection',
    'Input Validation',
    !vulnerableFound,
    vulnerableFound ? '⚠️  Possible SQL injection vulnerability detected!' : '✅ No obvious SQL injection vectors found'
  );
}

async function testXSS() {
  console.log('\n🟡 MEDIUM: XSS Protection Test');

  if (!USER_TOKENS.regular || !CONTACT_IDS.regular) {
    return recordTest('XSS', 'Input Sanitization', null, 'No test user/contact available');
  }

  const xssPayloads = [
    '<script>alert(1)</script>',
    '" onerror="alert(1)'
  ];

  let safeHandling = true;

  for (const payload of xssPayloads) {
    try {
      const response = await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/contacts?id=eq.${CONTACT_IDS.regular}`, {
        method: 'PATCH',
        headers: {
          'apikey': USER_TOKENS.regular,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ notes: payload })
      });

      const data = await response.json();
      if (data.length > 0 && data[0]?.notes === payload) {
        safeHandling = false;
        console.log(`   ⚠️  XSS payload stored without sanitization`);
      }
    } catch {}
  }

  return recordTest(
    'XSS Prevention',
    'Input Sanitization',
    safeHandling,
    safeHandling ? 'Inputs sanitized/escaped properly' : '⚠️  XSS payloads stored - check rendering!'
  );
}

// ============================================================================
// Run All Tests
// ============================================================================

async function runAllTests() {
  console.log('\n🔍 Starting Security Test Suite\n');

  await setupTestEnvironment();

  console.log('\n' + '='.repeat(60));
  console.log('DOCUMENTED VULNERABILITY TESTS');
  console.log('='.repeat(60));

  await testRLSBypass();
  await testIDORRegularUser();
  await testIDORAdminAccessAll();

  console.log('\n' + '='.repeat(60));
  console.log('ADDITIONAL ATTACK VECTOR TESTS');
  console.log('='.repeat(60));

  await testSQLInjection();
  await testXSS();

  // Print Summary
  console.log('\n' + '='.repeat(60));
  console.log('TEST SUMMARY');
  console.log('='.repeat(60));

  const total = RESULTS.passed.length + RESULTS.failed.length;
  
  console.log(`\n✅ PASSED: ${RESULTS.passed.length}/${total}`);
  console.log(`❌ FAILED: ${RESULTS.failed.length}/${total}\n`);

  if (RESULTS.failed.length > 0) {
    console.log('Failed Tests:');
    for (const test of RESULTS.failed) {
      console.log(`  ❌ [${test.category}] ${test.name}`);
      if (test.details) console.log(`     → ${test.details}`);
    }
  }

  if (RESULTS.passed.length > 0) {
    console.log('\nPassed Tests:');
    for (const test of RESULTS.passed) {
      console.log(`  ✅ [${test.category}] ${test.name}`);
    }
  }

  return RESULTS.failed.length === 0;
}

// Run the tests
runAllTests().then(success => {
  process.exit(success ? 0 : 1);
});
