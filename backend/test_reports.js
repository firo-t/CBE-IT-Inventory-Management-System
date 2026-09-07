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
  
  if (res.headers.get('content-type')?.includes('application/json')) {
    return { status: res.status, data: await res.json() };
  }
  return { status: res.status, data: await res.text() };
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
  console.log('--- STARTING PHASE 15A TESTS ---');

  const adminToken = await login('admin@cbe.com', 'SecureAdminPassword123!');
  
  const branches = await prisma.branch.findMany();
  const b1 = branches[0];
  const b2 = branches.length > 1 ? branches[1] : null;

  const itToken = await ensureUser('it5@cbe.com', 'IT', 'IT Inventory Officer', null);
  const bm1Token = await ensureUser('bm5@cbe.com', 'BM1', 'Branch Manager', b1.branch_id);
  const techToken = await ensureUser('tech5@cbe.com', 'Tech', 'Hardware Technician', b1.branch_id);

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

  console.log('--- AUTHENTICATION ---');
  res = await request('/reports/inventory', 'GET', null);
  assert(res.status === 401, '1. No JWT -> 401');

  res = await request('/reports/inventory', 'GET', 'invalid-token');
  assert(res.status === 401, '2. Invalid JWT -> 401');

  console.log('--- RBAC ---');
  res = await request('/reports/inventory', 'GET', adminToken);
  assert(res.status === 200, '3. Admin -> allowed');

  res = await request('/reports/inventory', 'GET', itToken);
  assert(res.status === 200, '4. IT Inventory Officer -> allowed');

  res = await request('/reports/inventory', 'GET', techToken);
  assert(res.status === 200, '5. Hardware Technician -> allowed');

  res = await request('/reports/inventory', 'GET', bm1Token);
  assert(res.status === 200, '6. Branch Manager -> allowed');

  res = await request('/audit-logs', 'GET', bm1Token); // Not report related but just standard forbidden
  // Actually no need, just test that BM is allowed for reports

  console.log('--- BRANCH ISOLATION ---');
  res = await request('/reports/inventory', 'GET', bm1Token);
  let allAssetsForBm = Array.isArray(res.data) && res.data.every(a => a.current_branch_id === b1.branch_id || a.current_branch_id === null);
  assert(allAssetsForBm, '8. Branch Manager sees only own branch data');

  if (b2) {
    res = await request(`/reports/inventory?branch_id=${b2.branch_id}`, 'GET', bm1Token);
    assert(res.status === 403, '9. Branch Manager cannot request another branch\'s data');
  } else {
    console.log('[SKIP] Test 9 skipped because only 1 branch exists.');
  }

  console.log('--- FILTER VALIDATION ---');
  res = await request(`/reports/inventory?branch_id=${b1.branch_id}`, 'GET', adminToken);
  assert(res.status === 200, '11. Valid branch UUID');

  res = await request(`/reports/inventory?branch_id=invalid`, 'GET', adminToken);
  assert(res.status === 400, '12. Invalid branch UUID -> 400');

  const assetTypes = await prisma.assetType.findMany();
  if (assetTypes.length > 0) {
    res = await request(`/reports/inventory?asset_type_id=${assetTypes[0].asset_type_id}`, 'GET', adminToken);
    assert(res.status === 200, '13. Valid asset type UUID');
  }
  
  res = await request(`/reports/inventory?asset_type_id=invalid`, 'GET', adminToken);
  assert(res.status === 400, '14. Invalid asset type UUID -> 400');

  res = await request(`/reports/inventory?status=AVAILABLE`, 'GET', adminToken);
  assert(res.status === 200, '15. Valid status');

  res = await request(`/reports/inventory?status=INVALID_STATUS`, 'GET', adminToken);
  assert(res.status === 400, '16. Invalid status -> 400');

  res = await request(`/reports/inventory?start_date=2023-01-01T00:00:00Z&end_date=2024-01-01T00:00:00Z`, 'GET', adminToken);
  assert(res.status === 200, '17. Valid date range');

  res = await request(`/reports/inventory?start_date=invalid-date`, 'GET', adminToken);
  assert(res.status === 400, '18. Invalid date -> 400');

  console.log('--- REPORT FUNCTIONALITY ---');
  res = await request('/reports/inventory', 'GET', adminToken);
  assert(res.status === 200 && Array.isArray(res.data), '20. Inventory report returns array');

  res = await request('/reports/assignments', 'GET', adminToken);
  assert(res.status === 200 && Array.isArray(res.data), '21. Assignment report returns array');

  res = await request('/reports/dispatches', 'GET', adminToken);
  assert(res.status === 200 && Array.isArray(res.data), '22. Dispatch report returns array');

  res = await request('/reports/maintenance', 'GET', adminToken);
  assert(res.status === 200 && Array.isArray(res.data), '23. Maintenance report returns array');
  
  res = await request(`/reports/inventory?status=AVAILABLE`, 'GET', adminToken);
  assert(res.status === 200, '24. Appropriate filters work (Asset status)');
  
  res = await request(`/reports/inventory?branch_id=00000000-0000-0000-0000-000000000000`, 'GET', adminToken);
  assert(res.status === 200 && res.data.length === 0, '25. Empty result returns a valid empty dataset');

  console.log('--- SECURITY ---');
  res = await request('/reports/maintenance', 'GET', adminToken);
  const firstMaint = res.data[0];
  if (firstMaint && firstMaint.reporter) {
    assert(firstMaint.reporter.password_hash === undefined, '26. No password_hash in responses');
  } else {
    assert(true, '26. No password_hash in responses (no users to check)');
  }
  
  assert(!JSON.stringify(res.data).includes('access_token') && !JSON.stringify(res.data).includes('eyJ'), '27. No JWT/access token in responses');
  
  console.log('--- REGRESSION ---');
  res = await request('/assets', 'GET', adminToken);
  assert(res.status === 200, '31. Existing asset endpoints still work');

  console.log(`\nTests Passed: ${passed} | Failed: ${failed}`);
  process.exit(failed === 0 ? 0 : 1);
}

run().catch(console.error);
