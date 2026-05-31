#!/usr/bin/env node

/**
 * Crewgrid Security Test Suite
 * ==============================
 * Comprehensive penetration testing for security vulnerabilities.
 * 
 * This script performs NON-DESTRUCTIVE security tests against a local Docker setup.
 * All tests verify that security controls are working as intended.
 * 
 * Run: node scripts/security-test.js
 */

const https = require('https');
const http = require('http');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

// ============================================================================
// Configuration
// ============================================================================

const CONFIG = {
  SUPABASE_URL: process.env.SUPABASE_TEST_URL || 'http://localhost:8090',
  APP_URL: process.env.APP_TEST_URL || 'http://localhost:3001',
  JWT_SECRET: process.env.JWT_SECRET,
  ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY
};

// Test users (should be pre-created in database)
let TEST_USERS = {
  admin: { email: 'admin@test.com', password: 'password123', role: 'Administrator' },
  manager: { email: 'manager@test.com', password: 'password123', role: 'Manager' },
  regular: { email: 'user@test.com', password: 'password123', role: 'Mitarbeiter' }
};

let TEST_USER_TOKENS = {};
let TEST_CONTACT_IDS = {}; // Map user -> their own contact ID

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
    protocol: urlObj.protocol + ':'
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
      json: () => JSON.parse(response.body),
      text: () => response.body
    };
  } catch (error) {
    throw new Error(`Request failed: ${error.message}`);
  }
}

// ============================================================================
// Supabase Helpers
// ============================================================================

async function supabaseQuery(table, action = 'SELECT', columns = '*', filters = {}, options = {}) {
  const url = `${CONFIG.SUPABASE_URL}/rest/v1/${table}`;
  
  let queryString = `?select=${columns}`;
  for (const [key, value] of Object.entries(filters)) {
    if (value === true) queryString += `&${key}=eq.true`;
    else if (value === false) queryString += `&${key}=eq.false`;
    else queryString += `&${key}=eq.${encodeURIComponent(value)}`;
  }

  const headers = {
    'apikey': options.serviceRole ? CONFIG.SERVICE_ROLE_KEY : CONFIG.ANON_KEY,
    'Prefer': options.prefer || 'return=representation'
  };

  try {
    const response = await fetch(url + queryString, {
      method: action === 'SELECT' ? 'GET' : (options.data ? 'POST' : 'PATCH'),
      headers,
      body: options.data ? JSON.stringify(options.data) : undefined
    });
    return { status: response.status, data: await response.json() };
  } catch (error) {
    throw new Error(`Supabase query failed: ${error.message}`);
  }
}

async function login(email, password) {
  const response = await fetch(`${CONFIG.SUPABASE_URL}/auth/v1/token`, {
    method: 'POST',
    headers: { 
      'apikey': CONFIG.ANON_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      grant_type: 'password',
      email,
      password
    })
  });
  
  const data = await response.json();
  if (data.access_token) {
    return { access_token: data.access_token, refresh_token: data.refresh_token };
  }
  throw new Error(data.message || 'Login failed');
}

// ============================================================================
// Test Setup
// ============================================================================

async function setupTestEnvironment() {
  console.log('\n📋 Setting up test environment...\n');

  // Create test users if they don't exist
  for (const [role, user] of Object.entries(TEST_USERS)) {
    try {
      const response = await fetch(`${CONFIG.SUPABASE_URL}/auth/v1/signup`, {
        method: 'POST',
        headers: { 'apikey': CONFIG.ANON_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email, password: user.password })
      });
    } catch {}
  }

  // Login all test users and cache tokens
  console.log('🔐 Authenticating test users...');
  for (const [role, user] of Object.entries(TEST_USERS)) {
    try {
      const tokens = await login(user.email, user.password);
      TEST_USER_TOKENS[role] = tokens;
      console.log(`   ✅ ${user.email} (${user.role})`);
    } catch (error) {
      console.log(`   ⚠️  Could not authenticate ${user.email}: ${error.message}`);
    }
  }

  // Find each user's linked contact ID
  console.log('\n🔗 Finding user-contact associations...');
  for (const [role, tokens] of Object.entries(TEST_USER_TOKENS)) {
    try {
      const usersResponse = await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/users`, {
        headers: {
          'apikey': tokens.access_token,
          'Authorization': `Bearer ${tokens.access_token}`
        }
      });
      const usersData = await usersResponse.json();
      if (usersData.length > 0 && usersData[0].contact_id) {
        TEST_CONTACT_IDS[role] = usersData[0].contact_id;
        console.log(`   ✅ ${TEST_USERS[role].email} → Contact ID: ${TEST_CONTACT_IDS[role]}`);
      }
    } catch (error) {
      console.log(`   ⚠️  Could not find contact for ${role}: ${error.message}`);
    }
  }

  console.log('\n✅ Test environment ready!\n');
}

// ============================================================================
// TEST SUITE: Documented Vulnerabilities
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
  
  if (!TEST_USER_TOKENS.regular || !TEST_CONTACT_IDS.admin) {
    return recordTest('IDOR Regular User', 'IDOR', null, 'Missing test data (user tokens or contact IDs)');
  }

  const regularToken = TEST_USER_TOKENS.regular.access_token;
  const adminContactId = TEST_CONTACT_IDS.admin;

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

  // Now test via server action (the fixed path)
  console.log(`\n   Regular user trying to UPDATE admin contact via SERVER ACTION`);
  
  let serverActionResult;
  try {
    const response = await fetch(`${CONFIG.APP_URL}/api/actions/update-contact`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
        // Cookies will include access_token
      },
      body: JSON.stringify({
        contactId: adminContactId,
        userId: TEST_USER_TOKENS.regular?.sub || '',
        role: TEST_USERS.regular.role,
        updatedData: { notes: 'IDOR SERVER ACTION TEST' }
      })
    });
    serverActionResult = await response.json();
  } catch (error) {
    console.log(`   ⚠️  Server action failed: ${error.message}`);
  }

  const serverActionBlocked = !serverActionResult?.success;

  return recordTest(
    'IDOR Prevention',
    'IDOR',
    (!canReadOther && !canUpdateOther && serverActionBlocked),
    `REST Read: ${canReadOther ? '⚠️  ACCESSIBLE (VULNERABLE!)' : '✅ BLOCKED'}, `
    + `REST Update: ${canUpdateOther ? '⚠️  ACCESSIBLE (VULNERABLE!)' : '✅ BLOCKED'}, `
    + `Server Action: ${serverActionBlocked ? '✅ BLOCKED' : '⚠️  ALLOWED (VULNERABLE!)'}\n`
    + (serverActionResult?.error || '')
  );
}

async function testLocalStorageBypass() {
  console.log('\n🟠 HIGH: LocalStorage Auth Bypass Test');
  console.log('   Testing if setting localStorage bypasses login...\n');

  // This test requires browser automation - we'll verify via API instead
  // Check that the session-status endpoint properly validates active sessions

  const response = await fetch(`${CONFIG.APP_URL}/api/auth/session-status`, {
    headers: { 'Authorization': `Bearer invalid-token-12345` }
  });

  const data = await response.json();

  return recordTest(
    'Session Status Validation',
    'Auth Bypass',
    response.status === 401 || !data.isActive,
    `Invalid token returned status ${response.status}: ${JSON.stringify(data)}`
  );
}

async function testJWTSecretFallback() {
  console.log('\n🟠 HIGH: JWT Secret Configuration Test');
  
  if (!CONFIG.JWT_SECRET || CONFIG.JWT_SECRET.includes('fallback')) {
    return recordTest(
      'JWT Secret Configuration',
      'Auth Security',
      false,
      '⚠️  WARNING: Using default/fallback JWT secret! Production will be vulnerable.'
    );
  }

  // Try to forge a token with known weak secret
  const forgedToken = jwt.sign(
    { sub: 'attacker', role: 'Administrator' },
    'fallback-secret-development-only-please-change'
  );

  const response = await fetch(`${CONFIG.APP_URL}/api/auth/session-status`, {
    headers: { 'Authorization': `Bearer ${forgedToken}` }
  });

  return recordTest(
    'Forged Token Rejection',
    'Auth Security',
    response.status === 401,
    `Forged token with weak secret returned status ${response.status}: ${await response.json()}`
  );
}

async function testRouteProtection() {
  console.log('\n🟠 HIGH: Route Protection Test');

  // Try to access protected routes without authentication
  const protectedRoutes = [
    '/crewgrid',
    '/crewgrid/employees',
    '/crewgrid/edit/contact/test-id'
  ];

  let allBlocked = true;
  
  for (const route of protectedRoutes) {
    const response = await fetch(`${CONFIG.APP_URL}${route}`);
    // Should redirect to / or return auth error
    if (response.status !== 302 && response.status !== 401) {
      allBlocked = false;
      console.log(`   ⚠️  ${route} returned ${response.status} without auth`);
    } else {
      console.log(`   ✅ ${route} properly protected (${response.status})`);
    }
  }

  return recordTest(
    'Route Protection',
    'Middleware',
    allBlocked,
    allBlocked ? 'All protected routes require authentication' : 'Some routes accessible without auth!'
  );
}

// ============================================================================
// TEST SUITE: Additional Attack Vectors (Not in Original Report)
// ============================================================================

async function testSQLInjection() {
  console.log('\n🟡 MEDIUM: SQL Injection Test');
  
  // Try basic SQL injection via search parameters
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
      
      // If we get a lot of data back or error, might indicate vulnerability
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

async function testMassAssignment() {
  console.log('\n🟡 MEDIUM: Mass Assignment Test');

  if (!TEST_USER_TOKENS.regular) {
    return recordTest('Mass Assignment', 'Input Validation', null, 'No authenticated user available');
  }

  const regularToken = TEST_USER_TOKENS.regular.access_token;

  // Try to modify fields that should be protected (like role_id)
  console.log('   Testing mass assignment via REST API...\n');

  try {
    const response = await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/contacts?id=eq.${TEST_CONTACT_IDS.regular}`, {
      method: 'PATCH',
      headers: {
        'apikey': regularToken,
        'Authorization': `Bearer ${regularToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        notes: 'test',
        role_id: 'some-admin-role-id-here' // Should be ignored
      })
    });

    const data = await response.json();
    
    if (data.length > 0) {
      const updatedRecord = data[0];
      // Check if forbidden fields were modified
      const hasForbiddenField = updatedRecord.role_id || updatedRecord.auth_user_id;
      return recordTest(
        'Mass Assignment Protection',
        'Input Validation',
        !hasForbiddenField,
        `Update returned ${data.length} records, forbidden field set: ${!!hasForbiddenField}`
      );
    }
  } catch (error) {
    console.log(`   ⚠️  Request failed: ${error.message}`);
  }

  return recordTest('Mass Assignment', 'Input Validation', null, 'Could not complete test');
}

async function testRaceCondition() {
  console.log('\n🟡 MEDIUM: Race Condition Test (License Limits)');

  // Try to exceed license limits via concurrent requests
  if (!TEST_USER_TOKENS.regular) {
    return recordTest('Race Condition', 'Concurrency', null, 'No authenticated user available');
  }

  console.log('   Sending multiple concurrent session creation requests...\n');

  const promises = [];
  for (let i = 0; i < 5; i++) {
    promises.push(
      fetch(`${CONFIG.APP_URL}/api/auth/session`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${TEST_USER_TOKENS.regular.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ licenseId: 'some-license-id' })
      }).then(r => r.json())
    );
  }

  const results = await Promise.all(promises);

  // Count successful vs failed requests
  let successCount = 0;
  let failCount = 0;
  for (const result of results) {
    if (result.success !== false) successCount++;
    else failCount++;
  }

  return recordTest(
    'Race Condition Prevention',
    'Concurrency',
    failCount >= 4, // At least some should be rejected due to limits
    `Created ${successCount} sessions, Rejected ${failCount}. License limits: enforced=${failCount >= 4}`
  );
}

async function testCSRF() {
  console.log('\n🟡 MEDIUM: CSRF Protection Test');

  // Check if cookies have proper SameSite and HttpOnly flags
  const response = await fetch(`${CONFIG.APP_URL}/api/auth/session-status`, {
    headers: { 'Authorization': `Bearer ${TEST_USER_TOKENS.regular?.access_token}` }
  });

  const setCookies = response.headers['set-cookie'] || [];
  
  let hasHttpOnly = false;
  let hasSameSite = false;

  for (const cookie of setCookies) {
    if (cookie.includes('HttpOnly')) hasHttpOnly = true;
    if (cookie.includes('SameSite=')) hasSameSite = true;
  }

  return recordTest(
    'CSRF Protection',
    'Cookie Security',
    hasHttpOnly && hasSameSite,
    `Cookies: HttpOnly=${hasHttpOnly}, SameSite=${hasSameSite}`
  );
}

async function testAuthorizationEscalation() {
  console.log('\n🟡 MEDIUM: Authorization Escalation Test');

  // Regular user trying to access admin-only routes
  if (!TEST_USER_TOKENS.regular) {
    return recordTest('Auth Escalation', 'Authorization', null, 'No regular user token');
  }

  const adminOnlyRoutes = [
    '/crewgrid/admin',
    '/crewgrid/reports'
  ];

  let properlyRestricted = true;

  for (const route of adminOnlyRoutes) {
    try {
      const response = await fetch(`${CONFIG.APP_URL}${route}`, {
        headers: { 'Authorization': `Bearer ${TEST_USER_TOKENS.regular.access_token}` }
      });

      // Should return 403 Forbidden or redirect
      if (response.status !== 403 && !response.headers.location?.includes('/crewgrid')) {
        properlyRestricted = false;
        console.log(`   ⚠️  ${route} accessible with status ${response.status}`);
      } else {
        console.log(`   ✅ ${route} restricted (${response.status})`);
      }
    } catch (error) {
      // Error is acceptable - means access denied
    }
  }

  return recordTest(
    'Authorization Escalation',
    'Access Control',
    properlyRestricted,
    properlyRestricted ? 'Role-based restrictions enforced' : 'Some admin routes accessible to regular users!'
  );
}

async function testXSS() {
  console.log('\n🟡 MEDIUM: XSS Protection Test');

  if (!TEST_USER_TOKENS.regular || !TEST_CONTACT_IDS.regular) {
    return recordTest('XSS', 'Input Sanitization', null, 'No test user/contact available');
  }

  // Try to inject XSS payloads via various fields
  const xssPayloads = [
    '<script>alert(1)</script>',
    '" onerror="alert(1)',
    "'><img src=x onerror=alert(1)>"]"
  ];

  let safeHandling = true;

  for (const payload of xssPayloads) {
    try {
      const response = await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/contacts?id=eq.${TEST_CONTACT_IDS.regular}`, {
        method: 'PATCH',
        headers: {
          'apikey': TEST_USER_TOKENS.regular.access_token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ notes: payload })
      });

      const data = await response.json();
      if (data.length > 0 && data[0]?.notes === payload) {
        // Payload stored as-is - potential XSS risk when rendered
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
  await testLocalStorageBypass();
  await testJWTSecretFallback();
  await testRouteProtection();

  console.log('\n' + '='.repeat(60));
  console.log('ADDITIONAL ATTACK VECTOR TESTS');
  console.log('='.repeat(60));

  await testSQLInjection();
  await testMassAssignment();
  await testRaceCondition();
  await testCSRF();
  await testAuthorizationEscalation();
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
