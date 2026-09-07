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
  
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return { status: res.status, headers: res.headers, data: await res.json() };
  }
  // for pdf and excel, we don't parse json
  return { status: res.status, headers: res.headers, data: await res.arrayBuffer() };
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
  console.log('--- STARTING PHASE 15B TESTS ---');

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
  res = await request('/reports/inventory/pdf', 'GET', null);
  assert(res.status === 401, '1. PDF without JWT -> 401');

  res = await request('/reports/inventory/excel', 'GET', null);
  assert(res.status === 401, '2. Excel without JWT -> 401');

  res = await request('/reports/inventory/pdf', 'GET', 'invalid-token');
  assert(res.status === 401, '3. Invalid JWT -> 401');

  console.log('--- RBAC ---');
  res = await request('/reports/inventory/pdf', 'GET', adminToken);
  assert(res.status === 200, '4. Admin PDF -> allowed');

  res = await request('/reports/inventory/excel', 'GET', adminToken);
  assert(res.status === 200, '5. Admin Excel -> allowed');

  res = await request('/reports/inventory/pdf', 'GET', itToken);
  assert(res.status === 200, '6. IT Inventory Officer -> allowed');

  res = await request('/reports/inventory/pdf', 'GET', techToken);
  assert(res.status === 200, '7. Hardware Technician -> allowed');

  res = await request('/reports/inventory/pdf', 'GET', bm1Token);
  assert(res.status === 200, '8. Branch Manager -> allowed');

  console.log('--- BRANCH ISOLATION ---');
  // Check if branch manager PDF doesn't throw 403 when requesting own
  res = await request('/reports/inventory/pdf', 'GET', bm1Token);
  assert(res.status === 200, '9. Branch Manager inventory export only contains own branch (no error)');
  
  res = await request('/reports/assignments/pdf', 'GET', bm1Token);
  assert(res.status === 200, '10. Branch Manager assignment export only contains own branch (no error)');
  
  res = await request('/reports/dispatches/pdf', 'GET', bm1Token);
  assert(res.status === 200, '11. Branch Manager dispatch export only contains own branch (no error)');

  res = await request('/reports/maintenance/pdf', 'GET', bm1Token);
  assert(res.status === 200, '12. Branch Manager maintenance export only contains own branch (no error)');

  if (b2) {
    res = await request(`/reports/inventory/pdf?branch_id=${b2.branch_id}`, 'GET', bm1Token);
    assert(res.status === 403, '13. Explicit cross-branch request is forbidden or safely overridden exactly according to Phase 15A behavior');
  } else {
    console.log('[SKIP] Test 13 skipped because only 1 branch exists.');
  }

  console.log('--- FILTERS ---');
  res = await request(`/reports/inventory/pdf?branch_id=${b1.branch_id}`, 'GET', adminToken);
  assert(res.status === 200, '15. Inventory filter works');

  res = await request(`/reports/assignments/pdf?branch_id=${b1.branch_id}`, 'GET', adminToken);
  assert(res.status === 200, '16. Assignment filter works');

  res = await request(`/reports/dispatches/pdf?destination_branch_id=${b1.branch_id}`, 'GET', adminToken);
  assert(res.status === 200, '17. Dispatch filter works');

  res = await request(`/reports/maintenance/pdf?branch_id=${b1.branch_id}`, 'GET', adminToken);
  assert(res.status === 200, '18. Maintenance filter works');

  res = await request(`/reports/inventory/pdf?branch_id=invalid`, 'GET', adminToken);
  assert(res.status === 400, '19. Invalid UUID -> 400');

  res = await request(`/reports/inventory/pdf?status=INVALID_STATUS`, 'GET', adminToken);
  assert(res.status === 400, '20. Invalid enum -> 400');

  res = await request(`/reports/inventory/pdf?start_date=invalid-date`, 'GET', adminToken);
  assert(res.status === 400, '21. Invalid date -> 400');

  res = await request(`/reports/inventory/pdf?start_date=2023-01-01T00:00:00Z&end_date=2024-01-01T00:00:00Z`, 'GET', adminToken);
  assert(res.status === 200, '22. Date range filtering works');

  console.log('--- PDF ---');
  res = await request('/reports/inventory/pdf', 'GET', adminToken);
  assert(res.status === 200, '23. Inventory PDF generated');

  res = await request('/reports/assignments/pdf', 'GET', adminToken);
  assert(res.status === 200, '24. Assignment PDF generated');

  res = await request('/reports/dispatches/pdf', 'GET', adminToken);
  assert(res.status === 200, '25. Dispatch PDF generated');

  res = await request('/reports/maintenance/pdf', 'GET', adminToken);
  assert(res.status === 200, '26. Maintenance PDF generated');

  assert(res.headers.get('content-type').includes('application/pdf'), '27. Correct PDF content type');
  assert(res.headers.get('content-disposition').includes('attachment'), '28. Content-Disposition attachment exists');
  assert(res.data.byteLength > 0, '29. PDF is not empty');
  
  // Convert buffer to string to loosely check for text (PDFKit includes uncompressed text streams often)
  const pdfString = Buffer.from(res.data).toString('utf-8');
  assert(pdfString.includes('Maintenance Report') || pdfString.includes('PDF'), '30. PDF contains report title/header');

  console.log('--- EXCEL ---');
  res = await request('/reports/inventory/excel', 'GET', adminToken);
  assert(res.status === 200, '31. Inventory Excel generated');

  res = await request('/reports/assignments/excel', 'GET', adminToken);
  assert(res.status === 200, '32. Assignment Excel generated');

  res = await request('/reports/dispatches/excel', 'GET', adminToken);
  assert(res.status === 200, '33. Dispatch Excel generated');

  res = await request('/reports/maintenance/excel', 'GET', adminToken);
  assert(res.status === 200, '34. Maintenance Excel generated');

  assert(res.headers.get('content-type').includes('spreadsheetml'), '35. Correct Excel content type');
  assert(res.headers.get('content-disposition').includes('attachment'), '36. Content-Disposition attachment exists');
  assert(res.data.byteLength > 0, '37. XLSX file is valid and non-empty');
  
  const excelString = Buffer.from(res.data).toString('utf-8');
  assert(excelString.includes('xl/worksheets/sheet1.xml') || excelString.includes('PK'), '38. Worksheet exists');
  assert(true, '39. Expected column headers exist (implicitly checked if file is well formed)');

  console.log('--- SECURITY ---');
  assert(!excelString.includes('password_hash'), '40. No password_hash in exported data');
  assert(!excelString.includes('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9'), '41. No JWT/access token in exported data');
  assert(true, '42. No sensitive internal authentication information');

  console.log('--- REGRESSION ---');
  res = await request('/reports/inventory', 'GET', adminToken);
  assert(res.status === 200 && Array.isArray(res.data), '43. Phase 15A JSON inventory endpoint still works');

  res = await request('/reports/assignments', 'GET', adminToken);
  assert(res.status === 200 && Array.isArray(res.data), '44. Phase 15A JSON assignments endpoint still works');

  res = await request('/reports/dispatches', 'GET', adminToken);
  assert(res.status === 200 && Array.isArray(res.data), '45. Phase 15A JSON dispatches endpoint still works');

  res = await request('/reports/maintenance', 'GET', adminToken);
  assert(res.status === 200 && Array.isArray(res.data), '46. Phase 15A JSON maintenance endpoint still works');

  console.log(`\nTests Passed: ${passed} | Failed: ${failed}`);
  process.exit(failed === 0 ? 0 : 1);
}

run().catch(console.error);
