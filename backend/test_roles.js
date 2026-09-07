const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');

const BASE_URL = 'http://localhost:3001';

async function request(endpoint, method, token, body) {
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (body) headers['Content-Type'] = 'application/json';

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });
  
  return { status: res.status, headers: res.headers, data: await res.json().catch(() => null) };
}

async function login(email, password) {
  const res = await request('/auth/login', 'POST', null, { email, password });
  if (res.status !== 200 && res.status !== 201) throw new Error(`Login failed for ${email}`);
  return res.data.access_token;
}

async function ensureUser(email, name, roleName, branchId) {
  const roles = await prisma.role.findMany();
  let u = await prisma.user.findUnique({ where: { email } });
  if (!u) {
    u = await prisma.user.create({
      data: {
        email, full_name: name, employee_id: `EMP-${Date.now()}-${Math.random()}`,
        password_hash: await bcrypt.hash('password123', 10),
        role_id: roles.find(r => r.role_name === roleName).role_id,
        branch_id: branchId
      }
    });
  }
  return await login(email, 'password123');
}

async function run() {
  console.log('--- STARTING PHASE 16A TESTS ---');

  const adminToken = await login('admin@cbe.com', 'SecureAdminPassword123!');
  const itToken = await ensureUser('it6@cbe.com', 'IT', 'IT Inventory Officer', null);

  let res;
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`[PASS] ${message}`);
      passed++;
    } else {
      console.error(`[FAIL] ${message}`);
      failed++;
    }
  }

  res = await request('/roles', 'GET', null);
  assert(res.status === 401, 'Missing JWT -> 401');

  res = await request('/roles', 'GET', itToken);
  assert(res.status === 403, 'Non-admin -> 403');

  res = await request('/roles', 'GET', adminToken);
  assert(res.status === 200, 'Admin -> 200');
  assert(Array.isArray(res.data), 'Response is an array');
  assert(res.data.length > 0, 'Response contains seeded roles');
  
  const sample = res.data[0];
  assert(sample.role_id && sample.role_name && sample.description, 'Roles contain role_id, role_name, description');
  assert(!sample.created_at && !sample.updated_at && !sample.password, 'Response does not expose sensitive/unnecessary fields');

  // Verify existing endpoints
  res = await request('/users', 'GET', adminToken);
  assert(res.status === 200, 'Existing user-management endpoints still work');

  console.log(`\nTests Passed: ${passed} | Failed: ${failed}`);
  process.exit(failed === 0 ? 0 : 1);
}

run().catch(console.error);
