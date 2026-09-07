const axios = require('axios');
const fs = require('fs');

const API_URL = 'http://localhost:3001';

const results = {
  total: 0,
  passed: 0,
  failed: 0,
  skipped: 0,
  failedAssertions: []
};

function assert(condition, message) {
  results.total++;
  if (condition) {
    results.passed++;
    console.log(`[PASS] ${message}`);
  } else {
    results.failed++;
    console.error(`[FAIL] ${message}`);
    results.failedAssertions.push(message);
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function runE2E() {
  console.log('Starting E2E Workflow Test...\n');

  try {
    // 1. Authenticate / Setup Admin
    console.log('--- Phase 1: Setup Admin ---');
    const adminCreds = { email: 'admin2@cbe.com', password: 'password123' };
    
    // login or create if doesn't exist? Wait, admin is seeded by seed-admin.ts
    // Let's assume the admin from seed-admin.ts exists.
    let adminToken;
    try {
      const res = await axios.post(`${API_URL}/auth/login`, {
        email: 'admin2@cbe.com',
        password: 'password123'
      });
      adminToken = res.data.access_token;
      assert(!!adminToken, 'Admin authentication successful');
    } catch (err) {
      console.error('Admin login failed. Please ensure db is seeded:', err.response?.data || err.message);
      throw err;
    }

    const adminApi = axios.create({ baseURL: API_URL, headers: { Authorization: `Bearer ${adminToken}` } });

    // Fetch Roles
    const rolesRes = await adminApi.get('/roles');
    const roles = rolesRes.data;
    const getRoleId = (name) => roles.find(r => r.role_name === name)?.role_id;

    const adminRoleId = getRoleId('System Administrator / Admin');
    const officerRoleId = getRoleId('IT Inventory Officer');
    const managerRoleId = getRoleId('Branch Manager');
    const techRoleId = getRoleId('Hardware Technician');
    
    assert(!!adminRoleId && !!officerRoleId && !!managerRoleId && !!techRoleId, 'All standard roles exist');

    // Users
    console.log('--- Phase 2: User Setup ---');
    const runId = Date.now();
    const users = {
      officer: { email: `officer_${runId}@cbe.com`, password: 'password123', full_name: 'E2E Officer', employee_id: 'EMP-OFF-' + runId, role_id: officerRoleId },
      manager: { email: `manager_${runId}@cbe.com`, password: 'password123', full_name: 'E2E Manager', employee_id: 'EMP-MGR-' + runId, role_id: managerRoleId },
      tech: { email: `tech_${runId}@cbe.com`, password: 'password123', full_name: 'E2E Tech', employee_id: 'EMP-TECH-' + runId, role_id: techRoleId },
    };

    const userTokens = { admin: adminToken };
    const userIds = {};

    for (const [key, user] of Object.entries(users)) {
      // Create user
      try {
        const res = await adminApi.post('/users', user);
        userIds[key] = res.data.user_id;
        console.log(`Created ${key} user`);
      } catch (e) {
        // if exists, fetch
        const res = await adminApi.get(`/users`);
        const existing = res.data.find(u => u.email === user.email);
        if (existing) {
          userIds[key] = existing.user_id;
          console.log(`Reused ${key} user`);
        } else {
          throw new Error(`Failed to create/find ${key} user`);
        }
      }
      // Login
      const loginRes = await axios.post(`${API_URL}/auth/login`, { email: user.email, password: user.password });
      userTokens[key] = loginRes.data.access_token;
      assert(!!userTokens[key], `${key} authentication successful`);
    }

    const apis = {
      admin: adminApi,
      officer: axios.create({ baseURL: API_URL, headers: { Authorization: `Bearer ${userTokens.officer}` } }),
      manager: axios.create({ baseURL: API_URL, headers: { Authorization: `Bearer ${userTokens.manager}` } }),
      tech: axios.create({ baseURL: API_URL, headers: { Authorization: `Bearer ${userTokens.tech}` } })
    };

    console.log('--- Phase 3: Branch and Asset Type Setup ---');
    
    // Branch creation
    const branches = [
      { branch_code: `SRC-${Date.now()}`, branch_name: 'E2E Source Branch', location: 'Addis Ababa' },
      { branch_code: `DST-${Date.now()}`, branch_name: 'E2E Dest Branch', location: 'Addis Ababa', manager_id: userIds.manager }
    ];
    const branchIds = {};

    for (const b of branches) {
      const res = await apis.admin.post('/branches', b);
      branchIds[b.branch_name] = res.data.branch_id;
      assert(!!res.data.branch_id, `Created ${b.branch_name}`);
    }

    // Set Manager's branchId so they belong to the destination branch
    await apis.admin.patch(`/users/${userIds.manager}`, { branch_id: branchIds['E2E Dest Branch'] });
    console.log('Assigned manager to Dest Branch');

    // Asset Type
    const typeRes = await apis.admin.post('/asset-types', { type_name: `E2E Laptop ${Date.now()}` });
    const assetTypeId = typeRes.data.asset_type_id;
    assert(!!assetTypeId, 'Created E2E Asset Type');

    console.log('--- Phase 4: Registration ---');
    const assetTag = `E2E-TAG-${Date.now()}`;
    const assetRes = await apis.officer.post('/assets', {
      tag_no: assetTag,
      asset_type_id: assetTypeId,
      current_branch_id: branchIds['E2E Source Branch'],
      description: 'E2E Test Asset'
    });
    const assetId = assetRes.data.asset_id;
    assert(!!assetId, 'Asset registered by Officer');
    assert(assetRes.data.status === 'AVAILABLE', 'Asset is initially AVAILABLE');

    console.log('--- Phase 5: Assignment ---');
    const assignRes = await apis.officer.post('/assignments', {
      asset_id: assetId,
      employee_id: 'EMP-001',
      employee_name: 'Test Employee',
      branch_id: branchIds['E2E Source Branch']
    });
    const assignmentId = assignRes.data.assignment_id;
    assert(!!assignmentId, 'Assignment created');
    assert(assignRes.data.status === 'ACTIVE', 'Assignment is ACTIVE');
    
    const assetAfterAssign = await apis.officer.get(`/assets/${assetId}`);
    assert(assetAfterAssign.data.status === 'ASSIGNED', 'Asset became ASSIGNED');

    console.log('--- Phase 6: Return ---');
    const returnRes = await apis.officer.patch(`/assignments/${assignmentId}/return`);
    assert(returnRes.data.status === 'RETURNED', 'Assignment is RETURNED');

    const assetAfterReturn = await apis.officer.get(`/assets/${assetId}`);
    assert(assetAfterReturn.data.status === 'AVAILABLE', 'Asset became AVAILABLE after return');

    console.log('--- Phase 7: Dispatch ---');
    const dispatchRes = await apis.officer.post('/dispatches', {
      asset_id: assetId,
      source_location: 'E2E Source Branch',
      destination_branch_id: branchIds['E2E Dest Branch'],
      receiver_name: 'E2E Manager',
      receiver_id: 'MGR-01',
      receiver_phone: '0911000000'
    });
    const dispatchId = dispatchRes.data.dispatch_id;
    assert(!!dispatchId, 'Dispatch created');
    assert(dispatchRes.data.status === 'DISPATCHED', 'Dispatch is DISPATCHED');

    const assetAfterDispatch = await apis.officer.get(`/assets/${assetId}`);
    assert(assetAfterDispatch.data.status === 'IN_TRANSIT', 'Asset became IN_TRANSIT');

    console.log('--- Phase 8: Receipt ---');
    const receiveRes = await apis.manager.patch(`/dispatches/${dispatchId}/receive`);
    assert(receiveRes.data.status === 'RECEIVED', 'Dispatch is RECEIVED');

    const assetAfterReceipt = await apis.manager.get(`/assets/${assetId}`);
    assert(assetAfterReceipt.data.current_branch_id === branchIds['E2E Dest Branch'], 'Asset current branch updated to destination');
    assert(assetAfterReceipt.data.status === 'AVAILABLE', 'Asset became AVAILABLE after receipt');

    console.log('--- Phase 9: Maintenance Request ---');
    const maintReqRes = await apis.manager.post('/maintenance/requests', {
      asset_id: assetId,
      problem_description: 'Screen broken',
      priority: 'HIGH'
    });
    const maintId = maintReqRes.data.request_id;
    assert(!!maintId, 'Maintenance request created');

    const assetAfterMaint = await apis.manager.get(`/assets/${assetId}`);
    assert(assetAfterMaint.data.status === 'UNDER_MAINTENANCE', 'Asset became UNDER_MAINTENANCE');

    console.log('--- Phase 10: Technician Assignment ---');
    const techAssignRes = await apis.tech.post(`/maintenance/requests/${maintId}/assign`, { technician_id: userIds.tech });
    assert(techAssignRes.data.technician_id === userIds.tech, 'Technician self-assigned');
    assert(techAssignRes.data.status === 'ASSIGNED', 'Maintenance record became ASSIGNED');

    console.log('--- Phase 11: Maintenance Lifecycle ---');
    const recordsRes = await apis.tech.post(`/maintenance/requests/${maintId}/records`, {
      diagnosis: 'Screen needs replacement',
      start_date: new Date().toISOString()
    });
    assert(!!recordsRes.data, 'Maintenance record updated');

    const statusInspRes = await apis.tech.patch(`/maintenance/requests/${maintId}/status`, { status: 'UNDER_INSPECTION' });
    assert(statusInspRes.data.status === 'UNDER_INSPECTION', 'Status updated to UNDER_INSPECTION');

    await apis.tech.patch(`/maintenance/requests/${maintId}/status`, { status: 'WAITING_FOR_PARTS' });
    await apis.tech.patch(`/maintenance/requests/${maintId}/status`, { status: 'UNDER_REPAIR' });
    await apis.tech.patch(`/maintenance/requests/${maintId}/status`, { status: 'REPAIRED' });
    
    await apis.tech.post(`/maintenance/requests/${maintId}/records`, {
      repair_action: 'Replaced screen',
      parts_used: 'LCD Screen',
      condition: 'Working',
      completion_date: new Date().toISOString()
    });

    const statusCompRes = await apis.tech.patch(`/maintenance/requests/${maintId}/status`, { status: 'COMPLETED' });
    assert(statusCompRes.data.status === 'COMPLETED', 'Status updated to COMPLETED');

    console.log('--- Phase 12: Closure ---');
    const closeRes = await apis.admin.patch(`/maintenance/requests/${maintId}/status`, { status: 'CLOSED' });
    assert(closeRes.data.status === 'CLOSED', 'Maintenance request CLOSED');

    const assetAfterClose = await apis.admin.get(`/assets/${assetId}`);
    assert(assetAfterClose.data.status === 'AVAILABLE', 'Asset returned to AVAILABLE post-maintenance');

    console.log('--- Phase 13: Notifications ---');
    const adminNotifs = await apis.admin.get('/notifications');
    assert(Array.isArray(adminNotifs.data), 'Admin notifications retrieved');

    const techNotifs = await apis.tech.get('/notifications');
    assert(Array.isArray(techNotifs.data), 'Tech notifications retrieved');
    
    // RBAC: Verify tech cannot access another's notifications? (Not directly supported, GET /notifications returns own)
    
    console.log('--- Phase 14: Audit Logs ---');
    const auditRes = await apis.admin.get('/audit-logs');
    assert(Array.isArray(auditRes.data), 'Audit logs retrieved by Admin');
    const creationLog = auditRes.data.find(log => log.action === 'CREATE' && log.entity_type === 'ASSET' && log.entity_id === assetId);
    if (!creationLog) {
      console.log('Available audit logs for this asset:', auditRes.data.filter(l => l.entity_id === assetId));
      console.log('Sample audit logs:', auditRes.data.slice(0, 5));
    }
    assert(!!creationLog, 'Asset creation audit log exists');

    console.log('--- Phase 15: Dashboard ---');
    for (const [role, api] of Object.entries(apis)) {
      const dbRes = await api.get('/dashboard');
      assert(!!dbRes.data, `${role} dashboard retrieved`);
    }

    console.log('--- Phase 16: Reports ---');
    const reportTypes = ['inventory', 'assignments', 'dispatches', 'maintenance'];
    for (const rt of reportTypes) {
      const res = await apis.officer.get(`/reports/${rt}`);
      assert(Array.isArray(res.data), `JSON Report ${rt} retrieved`);
    }

    console.log('--- Phase 17: PDF/Excel ---');
    const formats = ['pdf', 'excel'];
    for (const format of formats) {
      const invRes = await apis.officer.get(`/reports/inventory/${format}`, { responseType: 'arraybuffer' });
      assert(invRes.status === 200, `Inventory ${format} HTTP 200`);
      assert(invRes.data.byteLength > 0, `Inventory ${format} has content`);

      const maintRes = await apis.officer.get(`/reports/maintenance/${format}`, { responseType: 'arraybuffer' });
      assert(maintRes.status === 200, `Maintenance ${format} HTTP 200`);
      assert(maintRes.data.byteLength > 0, `Maintenance ${format} has content`);
    }

    console.log('--- Phase 18: Negative RBAC/Security ---');
    // Branch Manager cannot POST /dispatches
    try {
      await apis.manager.post('/dispatches', { asset_id: assetId, source_location: 'A', destination_branch_id: branchIds['E2E Dest Branch'], receiver_name: 'N', receiver_id: 'I', receiver_phone: 'P' });
      assert(false, 'Manager should not be able to create dispatch');
    } catch (err) {
      assert(err.response?.status === 403 || err.response?.status === 401, 'Manager forbidden from creating dispatch');
    }

    // Technician cannot POST /dispatches
    try {
      await apis.tech.post('/dispatches', { asset_id: assetId, source_location: 'A', destination_branch_id: branchIds['E2E Dest Branch'], receiver_name: 'N', receiver_id: 'I', receiver_phone: 'P' });
      assert(false, 'Technician should not be able to create dispatch');
    } catch (err) {
      assert(err.response?.status === 403 || err.response?.status === 401, 'Technician forbidden from creating dispatch');
    }

    // Unauthorized access to audit logs
    try {
      await apis.officer.get('/audit-logs');
      assert(false, 'Officer should not be able to access audit logs');
    } catch (err) {
      assert(err.response?.status === 403 || err.response?.status === 401, 'Officer forbidden from accessing audit logs');
    }

    // Unauthenticated
    try {
      await axios.get(`${API_URL}/assets`);
      assert(false, 'Unauthenticated access should be rejected');
    } catch (err) {
      assert(err.response?.status === 401, 'Unauthenticated request rejected with 401');
    }

    console.log('\n--- E2E TEST COMPLETED SUCCESSFULLY ---\n');

  } catch (err) {
    console.error('\n--- E2E TEST FAILED ---');
    console.error(err.message);
    if (err.response) {
       console.error('Status:', err.response.status);
       console.error('Data:', err.response.data);
    }
  } finally {
    console.log('\n=============================================');
    console.log('TEST SUMMARY');
    console.log('=============================================');
    console.log(`Total Assertions: ${results.total}`);
    console.log(`Passed: ${results.passed}`);
    console.log(`Failed: ${results.failed}`);
    console.log(`Skipped: ${results.skipped}`);
    
    if (results.failed > 0) {
      console.log('\nFailed Assertions:');
      results.failedAssertions.forEach(a => console.log(`- ${a}`));
    }
    
    console.log('\nFiles Created/Modified: backend/test_e2e_workflow.js');
    console.log('Application Source Code Modified: NONE');
    console.log(`Complete Lifecycle Passed: ${results.failed === 0 ? 'YES' : 'NO'}`);
  }
}

runE2E();
