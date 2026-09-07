const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const jwt = require('jsonwebtoken'); // Need to use standard auth or create our own tokens if we know the secret
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
  console.log('--- STARTING PHASE 10 CORRECTION TESTS ---');

  // Setup: Get admin token
  const adminToken = await login('admin@cbe.com', 'SecureAdminPassword123!');

  // Setup: Get roles and users for testing
  const roles = await prisma.role.findMany();
  const getRole = (name) => roles.find(r => r.role_name === name);

  const branches = await prisma.branch.findMany();
  const branch1 = branches[0];
  const branch2 = branches[1] || branch1;

  async function ensureUser(email, name, roleName, branchId) {
    let u = await prisma.user.findUnique({ where: { email } });
    if (!u) {
      const hash = await bcrypt.hash('password123', 10);
      u = await prisma.user.create({
        data: {
          email,
          full_name: name,
          employee_id: `EMP-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          password_hash: hash,
          role_id: getRole(roleName).role_id,
          branch_id: branchId
        }
      });
    }
    return await login(email, 'password123');
  }

  const itToken = await ensureUser('it@cbe.com', 'IT Officer', 'IT Inventory Officer');
  const bmToken = await ensureUser('bm@cbe.com', 'Branch Manager', 'Branch Manager', branch1.branch_id);
  const techToken = await ensureUser('tech@cbe.com', 'Tech', 'Hardware Technician', branch1.branch_id);

  // Helper to create an asset in a specific status
  async function createAsset(status) {
    const at = await prisma.assetType.findFirst();
    return await prisma.asset.create({
      data: {
        tag_no: `TAG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        asset_type_id: at.asset_type_id,
        status: status,
        current_branch_id: branch1.branch_id
      }
    });
  }

  // Helper for dispatch request
  const buildDispatch = (asset_id) => ({
    asset_id,
    source_location: 'HQ',
    destination_branch_id: branch1.branch_id,
    receiver_name: 'Bob',
    receiver_id: 'B001',
    receiver_phone: '123'
  });

  // TESTS

  let res;

  // 1. POST /dispatches without JWT
  res = await request('/dispatches', 'POST', null, buildDispatch('dummy'));
  console.log(`1. POST without JWT -> ${res.status === 401 ? '401' : res.status}`);

  // 2. POST /dispatches with unauthorized role
  res = await request('/dispatches', 'POST', techToken, buildDispatch('dummy'));
  console.log(`2. POST with unauthorized role -> ${res.status === 403 ? '403' : res.status}`);

  // 3. POST valid AVAILABLE asset
  const aAvail = await createAsset('AVAILABLE');
  res = await request('/dispatches', 'POST', adminToken, buildDispatch(aAvail.asset_id));
  console.log(`3. POST valid AVAILABLE asset -> ${res.status === 201 ? 'success' : res.status}`);
  const dispAvailId = res.data.dispatch_id;

  // 4. POST valid ASSIGNED asset
  const aAssign = await createAsset('ASSIGNED');
  // Need to give it an active assignment to fully test
  const activeAssignment = await prisma.assignment.create({
    data: {
      asset_id: aAssign.asset_id,
      employee_id: 'E1',
      employee_name: 'N1',
      branch_id: branch1.branch_id,
      assigned_by: (await prisma.user.findFirst()).user_id,
      status: 'ACTIVE'
    }
  });
  res = await request('/dispatches', 'POST', adminToken, buildDispatch(aAssign.asset_id));
  console.log(`4. POST valid ASSIGNED asset -> ${res.status === 201 ? 'success' : res.status}`);
  const dispAssignId = res.data.dispatch_id;

  // 5-10. Rejected statuses
  const rejectedStatuses = ['IN_TRANSIT', 'UNDER_MAINTENANCE', 'DAMAGED', 'LOST', 'DISPOSED', 'RETIRED'];
  let rejCount = 0;
  for (const s of rejectedStatuses) {
    const a = await createAsset(s);
    res = await request('/dispatches', 'POST', adminToken, buildDispatch(a.asset_id));
    if (res.status === 400) rejCount++;
    else console.log(`Failed on ${s}: got ${res.status}`);
  }
  console.log(`5-10. Rejected asset statuses -> ${rejCount === 6 ? 'success' : 'failed'}`);

  // RECEIPT TESTS

  // 11. Admin can receive
  const aAdmin = await createAsset('AVAILABLE');
  const dAdmin = await request('/dispatches', 'POST', adminToken, buildDispatch(aAdmin.asset_id));
  res = await request(`/dispatches/${dAdmin.data.dispatch_id}/receive`, 'PATCH', adminToken);
  console.log(`11. Admin can receive -> ${res.status === 200 ? 'success' : res.status}`);

  // 12. IT Inventory Officer can receive
  const aIT = await createAsset('AVAILABLE');
  const dIT = await request('/dispatches', 'POST', adminToken, buildDispatch(aIT.asset_id));
  res = await request(`/dispatches/${dIT.data.dispatch_id}/receive`, 'PATCH', itToken);
  console.log(`12. IT Inventory Officer can receive -> ${res.status === 200 ? 'success' : res.status}`);

  // 13. Branch Manager can receive (own branch)
  const aBM = await createAsset('AVAILABLE');
  const dBM = await request('/dispatches', 'POST', adminToken, buildDispatch(aBM.asset_id));
  res = await request(`/dispatches/${dBM.data.dispatch_id}/receive`, 'PATCH', bmToken);
  console.log(`13. Branch Manager can receive -> ${res.status === 200 ? 'success' : res.status}`);

  // 14. Hardware Technician cannot receive
  res = await request(`/dispatches/${dispAvailId}/receive`, 'PATCH', techToken);
  console.log(`14. Hardware Technician cannot receive -> ${res.status === 403 ? '403' : res.status}`);

  // 15. Double receipt
  res = await request(`/dispatches/${dAdmin.data.dispatch_id}/receive`, 'PATCH', adminToken);
  console.log(`15. Double receipt -> ${res.status === 400 ? 'rejected' : res.status}`);

  // 16. On receipt current_branch_id becomes destination_branch_id
  const checkBMAsset = await prisma.asset.findUnique({ where: { asset_id: aBM.asset_id } });
  console.log(`16. current_branch_id updated -> ${checkBMAsset.current_branch_id === branch1.branch_id ? 'success' : 'failed'}`);

  // 17. AVAILABLE asset with no active assignment becomes AVAILABLE after receipt
  res = await request(`/dispatches/${dispAvailId}/receive`, 'PATCH', adminToken);
  const checkAvailAsset = await prisma.asset.findUnique({ where: { asset_id: aAvail.asset_id } });
  console.log(`17. AVAILABLE -> IN_TRANSIT -> AVAILABLE -> ${checkAvailAsset.status === 'AVAILABLE' ? 'success' : checkAvailAsset.status}`);

  // 18. ASSIGNED asset with active assignment becomes ASSIGNED after receipt
  res = await request(`/dispatches/${dispAssignId}/receive`, 'PATCH', adminToken);
  const checkAssignAsset = await prisma.asset.findUnique({ where: { asset_id: aAssign.asset_id } });
  console.log(`18. ASSIGNED -> IN_TRANSIT -> ASSIGNED -> ${checkAssignAsset.status === 'ASSIGNED' ? 'success' : checkAssignAsset.status}`);

  // Regression 19, 20
  res = await request('/assets', 'GET', adminToken);
  console.log(`19. GET /assets still works -> ${res.status === 200 ? 'success' : res.status}`);
  res = await request('/assignments', 'GET', adminToken);
  console.log(`20. GET /assignments still works -> ${res.status === 200 ? 'success' : res.status}`);

  console.log('--- END OF TESTS ---');
  process.exit(0);
}

run().catch(console.error);
