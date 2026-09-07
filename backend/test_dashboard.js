const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const BASE_URL = 'http://localhost:3001';

async function login(email, password) {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  if (!res.ok) throw new Error(`Login failed for ${email}`);
  const data = await res.json();
  return data.access_token;
}

async function request(endpoint, method, token, body) {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    },
    body: body ? JSON.stringify(body) : undefined
  });
  const data = await res.text();
  try { return { status: res.status, data: JSON.parse(data) }; } 
  catch { return { status: res.status, data }; }
}

async function run() {
  console.log('--- STARTING DASHBOARD TESTS ---');

  const adminToken = await login('admin@cbe.com', 'SecureAdminPassword123!');
  const itToken = await login('officer@cbe.com', 'SecureAdminPassword123!');
  const bmToken = await login('mgr@cbe.com', 'SecureAdminPassword123!');
  const techToken = await login('tech@cbe.com', 'SecureAdminPassword123!');

  // Create another branch manager for isolation testing
  const roles = (await request('/roles', 'GET', adminToken)).data;
  const bmRole = roles.find(r => r.role_name === 'Branch Manager');
  const branches = (await request('/branches', 'GET', adminToken)).data;
  
  const branchA = branches[0];
  const branchB = branches[1];

  const bmUserA = (await request('/auth/me', 'GET', bmToken)).data.user; // mgr@cbe.com is usually in branch A
  const techUser = (await request('/auth/me', 'GET', techToken)).data.user;

  // We need to ensure we have a manager for Branch B to test isolation
  const bm2Body = { email: `bm2${Date.now()}@cbe.com`, full_name: 'BM 2', employee_id: `EMP-${Date.now()}`, password: 'password', role_id: bmRole.role_id, branch_id: branchB.branch_id, status: 'ACTIVE' };
  const bm2Res = await request('/users', 'POST', adminToken, bm2Body);
  const bm2Token = await login(bm2Body.email, 'password');

  // Test 1. GET /dashboard without JWT -> 401
  let res = await request('/dashboard', 'GET', null);
  console.log(`1. GET /dashboard without JWT -> ${res.status === 401 ? 'Success' : 'FAILED'}`);

  // Test 2. Admin can access -> 200
  res = await request('/dashboard', 'GET', adminToken);
  console.log(`2. Admin can access -> ${res.status === 200 ? 'Success' : 'FAILED'}`);
  console.log(`7. Admin receives system-wide statistics -> ${res.data.role === 'System Administrator / Admin' && res.data.summary.totalAssets !== undefined ? 'Success' : 'FAILED'}`);
  // Check that password_hash is not returned in AuditLog user relation
  const adminRecent = res.data.recent.recentActivities || [];
  const hasPassword = adminRecent.some(log => log.user && log.user.password_hash !== undefined);
  console.log(`19/20. No password/token returned -> ${!hasPassword ? 'Success' : 'FAILED'}`);

  // Test 3. IT Inventory Officer can access -> 200
  res = await request('/dashboard', 'GET', itToken);
  console.log(`3. IT Inventory Officer can access -> ${res.status === 200 ? 'Success' : 'FAILED'}`);
  console.log(`8. IT Inventory Officer receives inventory statistics -> ${res.data.role === 'IT Inventory Officer' && res.data.summary.pendingDispatches !== undefined ? 'Success' : 'FAILED'}`);

  // Test 4. Hardware Technician can access -> 200
  res = await request('/dashboard', 'GET', techToken);
  console.log(`4. Hardware Technician can access -> ${res.status === 200 ? 'Success' : 'FAILED'}`);
  console.log(`9. Hardware Technician statistics are restricted -> ${res.data.role === 'Hardware Technician' && res.data.summary.assignedRequests !== undefined ? 'Success' : 'FAILED'}`);

  // Test 5. Branch Manager can access -> 200
  res = await request('/dashboard', 'GET', bmToken);
  console.log(`5. Branch Manager can access -> ${res.status === 200 ? 'Success' : 'FAILED'}`);
  console.log(`11. Branch Manager receives only their own branch statistics -> ${res.data.role === 'Branch Manager' && res.data.summary.branchTotalAssets !== undefined ? 'Success' : 'FAILED'}`);

  // Test 12, 13, 14, 15: Create test data in Branch A and Branch B
  const assetTypes = (await request('/asset-types', 'GET', adminToken)).data;
  
  // Asset in Branch B
  const assetB = await request('/assets', 'POST', adminToken, { tag_no: `TAG-${Date.now()}-B`, asset_type_id: assetTypes[0].asset_type_id, current_branch_id: branchB.branch_id });
  
  // Fetch dashboard for BM 1 (Branch A)
  const dashboardA = await request('/dashboard', 'GET', bmToken);
  // Fetch dashboard for BM 2 (Branch B)
  const dashboardB = await request('/dashboard', 'GET', bm2Token);

  console.log(`13. Branch Manager must NOT receive Branch B asset counts -> ${dashboardA.data.summary.branchTotalAssets !== dashboardB.data.summary.branchTotalAssets ? 'Success' : 'FAILED'}`);

  // 17. Verify missing Branch Manager branch_id is safely rejected with 403
  // Create a BM with NO branch
  const bmNoBranchBody = { email: `bm3${Date.now()}@cbe.com`, full_name: 'BM 3', employee_id: `EMP-${Date.now()}`, password: 'password', role_id: bmRole.role_id, status: 'ACTIVE' };
  const bmNoBranchRes = await request('/users', 'POST', adminToken, bmNoBranchBody);
  const bmNoBranchToken = await login(bmNoBranchBody.email, 'password');
  const dashboardNoBranch = await request('/dashboard', 'GET', bmNoBranchToken);
  console.log(`17. Verify missing BM branch_id rejected with 403 -> ${dashboardNoBranch.status === 403 ? 'Success' : 'FAILED'}`);

  console.log('All tests completed.');
  process.exit(0);
}

run().catch(console.error);
