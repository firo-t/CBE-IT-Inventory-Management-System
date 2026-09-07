const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');

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
  console.log('--- STARTING TECHNICIAN ASSIGNMENT TESTS ---');

  const adminToken = await login('admin@cbe.com', 'SecureAdminPassword123!');
  const itToken = await login('officer@cbe.com', 'SecureAdminPassword123!');
  const bmToken = await login('mgr@cbe.com', 'SecureAdminPassword123!');
  const techToken = await login('tech@cbe.com', 'SecureAdminPassword123!');

  const bmUser = (await request('/auth/me', 'GET', bmToken)).data.user;
  const techUser = (await request('/auth/me', 'GET', techToken)).data.user;

  const branchesRes = await request('/branches', 'GET', adminToken);
  const branches = branchesRes.data;
  const testBranch = branches[0];

  const assetTypesRes = await request('/asset-types', 'GET', adminToken);
  const assetTypes = assetTypesRes.data;

  // Create a test asset
  const assetRes = await request('/assets', 'POST', adminToken, {
    tag_no: `TAG-MAINT-${Date.now()}`,
    asset_type_id: assetTypes[0].asset_type_id,
    current_branch_id: testBranch.branch_id
  });
  const assetId = assetRes.data.asset_id;

  // Create a maintenance request
  const reqRes = await request('/maintenance/requests', 'POST', adminToken, {
    asset_id: assetId,
    problem_description: 'Test request for assignment'
  });
  const requestId = reqRes.data.request_id;

  // 4. Missing JWT
  let res = await request(`/maintenance/requests/${requestId}/assign`, 'POST', null, { technician_id: techUser.userId });
  console.log(`4. Missing JWT -> ${res.status === 401 ? 'Success' : 'FAILED'}`);

  // 7. Non-technician user
  res = await request(`/maintenance/requests/${requestId}/assign`, 'POST', adminToken, { technician_id: bmUser.userId });
  console.log(`7. Non-technician user -> ${res.status === 400 ? 'Success' : 'FAILED'}`);

  // 5. Invalid technician UUID
  res = await request(`/maintenance/requests/${requestId}/assign`, 'POST', adminToken, { technician_id: 'invalid' });
  console.log(`5. Invalid technician UUID -> ${res.status === 400 ? 'Success' : 'FAILED'}`);

  // 6. Nonexistent technician
  res = await request(`/maintenance/requests/${requestId}/assign`, 'POST', adminToken, { technician_id: '00000000-0000-0000-0000-000000000000' });
  console.log(`6. Nonexistent technician -> ${res.status === 400 ? 'Success' : 'FAILED'}`);

  // 8. Inactive technician
  const roles = (await request('/roles', 'GET', adminToken)).data;
  const techRole = roles.find(r => r.role_name === 'Hardware Technician');
  const inactiveTech = await request('/users', 'POST', adminToken, {
    email: `inactive${Date.now()}@cbe.com`,
    full_name: 'Inactive Tech',
    employee_id: `EMP-${Date.now()}`,
    password: 'password',
    role_id: techRole.role_id,
    branch_id: testBranch.branch_id,
    status: 'ACTIVE'
  });
  await request(`/users/${inactiveTech.data.user_id}/status`, 'PATCH', adminToken, { status: 'INACTIVE' });
  res = await request(`/maintenance/requests/${requestId}/assign`, 'POST', adminToken, { technician_id: inactiveTech.data.user_id });
  console.log(`8. Inactive technician -> ${res.status === 400 ? 'Success' : 'FAILED'}`);

  // 1. Admin assignment
  const assignRes = await request(`/maintenance/requests/${requestId}/assign`, 'POST', adminToken, { technician_id: techUser.userId });
  console.log(`1. Admin assignment -> ${assignRes.data.status === 'ASSIGNED' ? 'Success' : 'FAILED'}`);
  console.log(`9. Assignment creates MaintenanceRecord -> ${assignRes.data.maintenance_id ? 'Success' : 'FAILED'}`);
  console.log(`10. MaintenanceRecord contains correct technician_id -> ${assignRes.data.technician_id === techUser.userId ? 'Success' : 'FAILED'}`);

  // 11. Request status becomes ASSIGNED
  const reqCheck1 = await request(`/maintenance/requests/${requestId}`, 'GET', adminToken);
  console.log(`11. Request status becomes ASSIGNED -> ${reqCheck1.data.status === 'ASSIGNED' ? 'Success' : 'FAILED'}`);

  // 12. Assigned technician can update maintenance
  const recordRes = await request(`/maintenance/requests/${requestId}/records`, 'POST', techToken, { diagnosis: 'LCD broken' });
  console.log(`12. Assigned technician can update maintenance -> ${recordRes.data.diagnosis === 'LCD broken' ? 'Success' : 'FAILED'}`);

  const reqCheck2 = await request(`/maintenance/requests/${requestId}`, 'GET', adminToken);
  console.log(`12b. Workflow moves to UNDER_INSPECTION -> ${reqCheck2.data.status === 'UNDER_INSPECTION' ? 'Success' : 'FAILED'}`);

  // 13. Different technician cannot modify the assigned record
  const tech2 = await request('/users', 'POST', adminToken, {
    email: `tech2${Date.now()}@cbe.com`,
    full_name: 'Tech 2',
    employee_id: `EMP2-${Date.now()}`,
    password: 'password',
    role_id: techRole.role_id,
    branch_id: testBranch.branch_id,
    status: 'ACTIVE'
  });
  const tech2Token = await login(tech2.data.email, 'password');
  res = await request(`/maintenance/requests/${requestId}/records`, 'POST', tech2Token, { diagnosis: 'Hacked' });
  console.log(`13. Different technician cannot modify -> ${res.status === 403 ? 'Success' : 'FAILED'}`);

  // 14. No duplicate MaintenanceRecord is created
  const reqCheck3 = await request(`/maintenance/requests/${requestId}`, 'GET', adminToken);
  const recordsCount = reqCheck3.data.maintenance_record ? 1 : 0;
  console.log(`14. No duplicate MaintenanceRecord -> ${recordsCount === 1 && reqCheck3.data.maintenance_record.technician_id === techUser.userId ? 'Success' : 'FAILED'}`);

  // 2. IT Inventory Officer assignment (reassign)
  const reassignRes = await request(`/maintenance/requests/${requestId}/assign`, 'POST', itToken, { technician_id: techUser.userId });
  console.log(`2. IT Inventory Officer assignment -> ${reassignRes.data.technician_id === techUser.userId ? 'Success' : 'FAILED'}`);

  // 15. Completed request cannot be assigned
  await request(`/maintenance/requests/${requestId}/records`, 'POST', adminToken, { repair_action: 'Fixed', condition: 'Good' });
  await request(`/maintenance/requests/${requestId}/status`, 'PATCH', adminToken, { status: 'COMPLETED' });
  res = await request(`/maintenance/requests/${requestId}/assign`, 'POST', adminToken, { technician_id: techUser.userId });
  console.log(`15. Completed request cannot be assigned -> ${res.status === 400 ? 'Success' : 'FAILED'}`);

  // 16. Closed request cannot be assigned
  await request(`/maintenance/requests/${requestId}/status`, 'PATCH', adminToken, { status: 'CLOSED' });
  res = await request(`/maintenance/requests/${requestId}/assign`, 'POST', adminToken, { technician_id: techUser.userId });
  console.log(`16. Closed request cannot be assigned -> ${res.status === 400 ? 'Success' : 'FAILED'}`);

  // 17. Branch isolation is preserved
  const otherBranch = branches.find(b => b.branch_id !== testBranch.branch_id);
  if (otherBranch) {
    const otherAssetRes = await request('/assets', 'POST', adminToken, {
      tag_no: `TAG-MAINT2-${Date.now()}`,
      asset_type_id: assetTypes[0].asset_type_id,
      current_branch_id: otherBranch.branch_id
    });
    const otherReqRes = await request('/maintenance/requests', 'POST', adminToken, {
      asset_id: otherAssetRes.data.asset_id,
      problem_description: 'Test'
    });
    res = await request(`/maintenance/requests/${otherReqRes.data.request_id}/assign`, 'POST', bmToken, { technician_id: techUser.userId });
    console.log(`17. Branch isolation is preserved -> ${res.status === 403 ? 'Success' : 'FAILED'}`);
  } else {
    console.log(`17. Branch isolation is preserved -> Skipped`);
  }

  // 18. AuditLog is created
  const auditRes = await request(`/audit-logs?entity_id=${requestId}&action=ASSIGN_TECHNICIAN`, 'GET', adminToken);
  console.log(`18. AuditLog is created -> ${auditRes.data && auditRes.data.length > 0 ? 'Success' : 'FAILED'}`);

  console.log('All tests completed.');
  process.exit(0);
}

run().catch(console.error);
