#!/usr/bin/env node

/**
 * Create Test Data for Security Testing
 * Creates test users, roles, licenses, and contact associations
 */

const fetch = require('node-fetch');

const CONFIG = {
  SUPABASE_URL: process.env.SUPABASE_TEST_URL || 'http://localhost:8090',
  SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  JWT_SECRET: process.env.JWT_SECRET
};

async function httpRequest(url, options) {
  const response = await fetch(url, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) }
  });
  return {
    status: response.status,
    data: await response.json()
  };
}

async function createRole(name) {
  const url = `${CONFIG.SUPABASE_URL}/rest/v1/roles`;
  try {
    const result = await httpRequest(url, {
      method: 'POST',
      headers: { apikey: CONFIG.SERVICE_ROLE_KEY },
      body: JSON.stringify({
        name,
        max_concurrent_sessions: 10
      })
    });
    return result.data[0]?.id;
  } catch (error) {
    console.error(`Failed to create role ${name}:`, error.message);
    return null;
  }
}

async function createLicense(type, name, maxUsers) {
  const url = `${CONFIG.SUPABASE_URL}/rest/v1/licenses`;
  try {
    const result = await httpRequest(url, {
      method: 'POST',
      headers: { apikey: CONFIG.SERVICE_ROLE_KEY },
      body: JSON.stringify({
        type,
        name,
        max_concurrent_users: maxUsers,
        is_active: true
      })
    });
    return result.data[0]?.id;
  } catch (error) {
    console.error(`Failed to create license ${name}:`, error.message);
    return null;
  }
}

async function createSupabaseUser(email, password, role_id, contact_id) {
  const url = `${CONFIG.SUPABASE_URL}/rest/v1/users`;
  try {
    // First sign up in auth system
    await fetch(`${CONFIG.SUPABASE_URL}/auth/v1/signup`, {
      method: 'POST',
      headers: { 
        apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });

    // Wait for auth to process
    await new Promise(r => setTimeout(r, 1000));

    // Get the auth user ID
    const authResult = await fetch(`${CONFIG.SUPABASE_URL}/auth/v1/user`, {
      headers: { apikey: CONFIG.SERVICE_ROLE_KEY }
    });
    
    let userId;
    try {
      const userData = await authResult.json();
      userId = userData.id;
    } catch {
      console.error(`Could not get user ID for ${email}`);
      return null;
    }

    // Create public.users record
    const result = await httpRequest(url, {
      method: 'POST',
      headers: { apikey: CONFIG.SERVICE_ROLE_KEY },
      body: JSON.stringify({
        auth_user_id: userId,
        email,
        first_name: email.split('@')[0],
        last_name: 'Testuser',
        initials: 'TU',
        role_id,
        contact_id
      })
    });
    
    return result.data[0]?.id;
  } catch (error) {
    console.error(`Failed to create user ${email}:`, error.message);
    return null;
  }
}

async function createContact(entityType, contactTypes, firstName, lastName) {
  const url = `${CONFIG.SUPABASE_URL}/rest/v1/contacts`;
  try {
    const result = await httpRequest(url, {
      method: 'POST',
      headers: { apikey: CONFIG.SERVICE_ROLE_KEY },
      body: JSON.stringify({
        entity_type: entityType,
        contact_type: contactTypes,
        first_name: firstName,
        last_name: lastName,
        status: 'Aktiv'
      })
    });
    return result.data[0]?.id;
  } catch (error) {
    console.error(`Failed to create contact:`, error.message);
    return null;
  }
}

async function main() {
  console.log('\n📦 Creating test data for security testing...\n');

  // Check required env vars
  if (!CONFIG.SERVICE_ROLE_KEY) {
    console.error('❌ Error: SUPABASE_SERVICE_ROLE_KEY not set in environment');
    process.exit(1);
  }

  // Create roles
  const adminRoleId = await createRole('Administrator');
  const managerRoleId = await createRole('Manager');
  const regularRoleId = await createRole('Mitarbeiter');

  console.log(`Roles created: Admin=${adminRoleId}, Manager=${managerRoleId}, Regular=${regularRoleId}`);

  // Create license
  const licenseId = await createLicense('TEST', 'Test License', 100);
  console.log(`License created: ${licenseId}\n`);

  // Create test users and contacts
  const testUsers = [
    {
      email: 'admin@test.com',
      password: 'password123',
      roleId: adminRoleId,
      firstName: 'Admin',
      lastName: 'User'
    },
    {
      email: 'manager@test.com', 
      password: 'password123',
      roleId: managerRoleId,
      firstName: 'Manager',
      lastName: 'User'
    },
    {
      email: 'user@test.com',
      password: 'password123',
      roleId: regularRoleId,
      firstName: 'Regular', 
      lastName: 'User'
    }
  ];

  for (const user of testUsers) {
    console.log(`\n👤 Creating ${user.email}...`);

    // Create contact first
    const contactId = await createContact('person', ['mitarbeiter'], user.firstName, user.lastName);
    if (!contactId) continue;

    console.log(`   Contact created: ${contactId}`);

    // Create user linked to contact
    const userId = await createSupabaseUser(user.email, user.password, user.roleId, contactId);
    if (userId) {
      console.log(`   User created: ${userId}`);
    }
  }

  console.log('\n✅ Test data setup complete!');
  console.log('\nNext steps:');
  console.log('1. Verify users can log in via Supabase auth');
  console.log('2. Run security tests: node scripts/security-test.js');
}

main().catch(error => {
  console.error('\n❌ Error:', error.message);
  process.exit(1);
});
