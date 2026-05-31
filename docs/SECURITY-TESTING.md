# Crewgrid Security Testing Guide

## Overview

This guide provides step-by-step instructions for setting up a local Docker environment to perform comprehensive security testing on the Crewgrid application.

**Important:** All tests are designed to be NON-DESTRUCTIVE. They verify that security controls work without modifying production data permanently.

---

## Prerequisites

1. **Docker & Docker Compose** installed
2. **Node.js 18+** for running test scripts
3. **Environment variables configured** (see below)

---

## Setup Instructions

### Step 1: Configure Environment Variables

Create a `.env.test` file in the project root:

```bash
# Supabase Configuration
SUPABASE_TEST_URL=http://localhost:8090
NEXT_PUBLIC_SUPABASE_URL=http://localhost:8090
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# JWT Secret (CRITICAL - must be strong and unique)
JWT_SECRET=$(openssl rand -base64 32)  # Generate a secure random secret

# Database Password
DB_PASSWORD=secure-test-password-2026-change-me
```

### Step 2: Install Dependencies

```bash
cd D:/SecurityTest/crewgrid
npm install jsonwebtoken
```

### Step 3: Start Docker Environment

```bash
# Start all services (db, api, auth, app)
docker-compose -f docker-compose.yml up -d

# Wait for services to be ready
docker-compose wait db --exit-first

# Check logs if needed
docker-compose logs -f
```

### Step 4: Initialize Database Schema

Run the schema migration:

```bash
# Execute schema against the Docker database
docker exec crewgrid_db psql -U postgres -d crewgrid -f supabase/schema_v2.sql

# Or use a migration script if you have one
```

### Step 5: Create Test Users & Data

Run the test setup script to create test users:

```bash
node scripts/create-test-data.js
``

Or manually create users via Supabase dashboard or API.

---

## Running Security Tests

### Full Test Suite

```bash
# Run all security tests
node scripts/security-test.js
```

The test suite covers:

#### Documented Vulnerabilities (From Original Assessment)
- 🔴 **RLS Bypass** - Unauthenticated database access
- 🔴 **IDOR** - Unauthorized contact modification
- 🟠 **Auth Bypass** - LocalStorage session manipulation  
- 🟠 **JWT Secret** - Token forgery prevention
- 🟠 **Route Protection** - Middleware enforcement

#### Additional Attack Vectors (Beyond Original Report)
- 🟡 **SQL Injection** - Input validation testing
- 🟡 **Mass Assignment** - Protected field modification
- 🟡 **Race Conditions** - Concurrent request handling
- 🟡 **CSRF** - Cookie security flags
- 🟡 **Authorization Escalation** - Role-based access control
- 🟡 **XSS** - Input sanitization verification

---

## Test Output Format

```
🔍 Starting Security Test Suite

📋 Setting up test environment...

🔐 Authenticating test users...
   ✅ admin@test.com (Administrator)
   ✅ manager@test.com (Manager)  
   ✅ user@test.com (Mitarbeiter)

============================================================
DOCUMENTED VULNERABILITY TESTS
============================================================

🔴 CRITICAL: RLS Bypass Test
✅ PASSED: Unauthenticated users cannot access contact data

🔴 CRITICAL: IDOR Test - Regular User Accessing Another Contact
   ✅ REST Read: BLOCKED
   ✅ REST Update: BLOCKED  
   ✅ Server Action: BLOCKED
============================================================
ADDITIONAL ATTACK VECTOR TESTS
============================================================

✅ PASSED: SQL Injection Protection
✅ PASSED: Mass Assignment Protection
...
============================================================
TEST SUMMARY
============================================================

✅ PASSED: 12/12
❌ FAILED: 0/12

All security tests passed! ✅
```

---

## Troubleshooting

### Common Issues

**Issue:** Tests fail with "Cannot find module 'jsonwebtoken'"
```bash
npm install jsonwebtoken --save-dev
```

**Issue:** Database connection errors in Docker logs
- Check that `schema_v2.sql` was run against the database
- Verify environment variables match between docker-compose.yml and .env.test

**Issue:** Auth token validation fails  
- Ensure JWT_SECRET is identical in all configuration files
- Restart containers: `docker-compose restart auth app`

### Verifying Test Isolation

The test suite creates temporary data that can be cleaned up:

```bash
# Clean up test user sessions after testing
docker exec crewgrid_db psql -U postgres -d crewgrid \
  -c "DELETE FROM login_sessions WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%test%')"
```

---

## Manual Testing Checklist

For vulnerabilities not covered by automated tests:

### Client-Side Tests
- [ ] Try accessing `/crewgrid` without authentication → Should redirect to login
- [ ] Set `localStorage.setItem('has_session', 'true')` → AuthOverlay should still appear
- [ ] Modify JWT in browser dev tools → Should be rejected on next request
- [ ] Use Postman to call APIs with stolen tokens from another user

### Server-Side Tests
```bash
# Test unauthenticated access
curl http://localhost:8090/rest/v1/contacts?select=* \
  -H "apikey: $NEXT_PUBLIC_SUPABASE_ANON_KEY"

# Expected: Empty result or permission error
```

---

## Post-Test Cleanup

```bash
# Stop all containers
docker-compose -f docker-compose.yml down

# Remove test users (optional)
docker exec crewgrid_db psql -U postgres -d crewgrid \
  -c "DELETE FROM users WHERE email LIKE '%test.com'"
```

---

## Security Recommendations After Testing

If any tests **FAIL**, prioritize fixes in this order:

1. 🔴 **CRITICAL** - Immediate fix required before any deployment
2. 🟠 **HIGH** - Fix before production use  
3. 🟡 **MEDIUM** - Address in next development cycle
4. 🟢 **LOW** - Consider for future improvements

---

## Quick Start Command Reference

```bash
# 1. Set up environment
openssl rand -base64 32 | clip.exe  # Copy JWT secret to clipboard
# Paste into .env.test file

# 2. Start environment  
docker-compose -f docker-compose.yml up -d

# 3. Wait for readiness
docker-compose wait db --exit-first

# 4. Run schema migration
docker exec crewgrid_db psql -U postgres -d crewgrid -f supabase/schema_v2.sql

# 5. Run security tests
node scripts/security-test.js

# Output will show all test results and any failures
```
