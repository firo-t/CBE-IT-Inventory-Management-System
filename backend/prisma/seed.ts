import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting CBE Mock Data Seed...');

  // --- CLEANUP ---
  console.log('Cleaning up existing data...');
  await prisma.notification.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.attachment.deleteMany();
  await prisma.maintenanceRecord.deleteMany();
  await prisma.maintenanceRequest.deleteMany();
  await prisma.dispatch.deleteMany();
  await prisma.assignment.deleteMany();
  await prisma.asset.deleteMany();
  await prisma.assetType.deleteMany();
  // Branches have manager_id linking to User, and Users have branch_id linking to Branch.
  // To avoid circular dependency issues, we update Users to remove branch_id first.
  await prisma.user.updateMany({ data: { branch_id: null } });
  await prisma.branch.deleteMany();
  await prisma.user.deleteMany();
  await prisma.role.deleteMany();

  // --- ROLES ---
  console.log('Seeding Roles...');
  const roleAdmin = await prisma.role.create({ data: { role_name: 'System Administrator / Admin', description: 'Full system access' } });
  const roleOfficer = await prisma.role.create({ data: { role_name: 'IT Inventory Officer', description: 'Manages assets and dispatches' } });
  const roleManager = await prisma.role.create({ data: { role_name: 'Branch Manager', description: 'Manages branch inventory' } });
  const roleTech = await prisma.role.create({ data: { role_name: 'Hardware Technician', description: 'Handles maintenance requests' } });
  const roleUser = await prisma.role.create({ data: { role_name: 'General User', description: 'Standard employee' } });

  // --- BRANCHES ---
  console.log('Seeding Branches (North Addis District)...');
  const b1 = await prisma.branch.create({ data: { branch_code: 'AAMB', branch_name: 'Addis Ababa Main Branch', location: 'Churchill Road', phone: '+251111223344', contact_person: 'Abebe Bikila' } });
  const b2 = await prisma.branch.create({ data: { branch_code: 'AKIL', branch_name: 'Arat Kilo Branch', location: 'Arat Kilo Square', phone: '+251111223355', contact_person: 'Tirunesh Dibaba' } });
  const b3 = await prisma.branch.create({ data: { branch_code: 'BMED', branch_name: 'Bole Medhanialem Branch', location: 'Bole Road', phone: '+251111223366', contact_person: 'Kenenisa Bekele' } });

  // --- USERS ---
  console.log('Seeding Users...');
  const passwordHash = await bcrypt.hash('password123', 10);

  const uAdmin = await prisma.user.create({
    data: { full_name: 'System Admin', employee_id: 'CBE-0001', email: 'admin@cbe.com.et', phone: '0911000001', role_id: roleAdmin.role_id, password_hash: passwordHash }
  });

  const uOfficer = await prisma.user.create({
    data: { full_name: 'Alemu Officer', employee_id: 'CBE-0002', email: 'alemu.officer@cbe.com.et', phone: '0911000002', role_id: roleOfficer.role_id, branch_id: b1.branch_id, password_hash: passwordHash }
  });

  const uManager1 = await prisma.user.create({
    data: { full_name: 'Selamawit Manager', employee_id: 'CBE-0003', email: 'selamawit.manager@cbe.com.et', phone: '0911000003', role_id: roleManager.role_id, branch_id: b1.branch_id, password_hash: passwordHash }
  });

  const uManager2 = await prisma.user.create({
    data: { full_name: 'Dawit Manager', employee_id: 'CBE-0004', email: 'dawit.manager@cbe.com.et', phone: '0911000004', role_id: roleManager.role_id, branch_id: b2.branch_id, password_hash: passwordHash }
  });

  const uTech = await prisma.user.create({
    data: { full_name: 'Yonas Technician', employee_id: 'CBE-0005', email: 'yonas.tech@cbe.com.et', phone: '0911000005', role_id: roleTech.role_id, branch_id: b1.branch_id, password_hash: passwordHash }
  });

  const uEmp1 = await prisma.user.create({
    data: { full_name: 'Marta Employee', employee_id: 'CBE-0006', email: 'marta.emp@cbe.com.et', phone: '0911000006', role_id: roleUser.role_id, branch_id: b1.branch_id, password_hash: passwordHash }
  });

  // Assign managers to branches
  await prisma.branch.update({ where: { branch_id: b1.branch_id }, data: { manager_id: uManager1.user_id } });
  await prisma.branch.update({ where: { branch_id: b2.branch_id }, data: { manager_id: uManager2.user_id } });

  console.log('Restoring Early Test Users...');
  await prisma.user.create({
    data: { full_name: 'Old Admin', employee_id: 'CBE-OLD-1', email: 'admin@cbe.com', phone: '0900000001', role_id: roleAdmin.role_id, password_hash: passwordHash }
  });
  await prisma.user.create({
    data: { full_name: 'Old Officer', employee_id: 'CBE-OLD-2', email: 'officer@cbe.com', phone: '0900000002', role_id: roleOfficer.role_id, branch_id: b1.branch_id, password_hash: passwordHash }
  });
  await prisma.user.create({
    data: { full_name: 'Old Manager', employee_id: 'CBE-OLD-3', email: 'mgr@cbe.com', phone: '0900000003', role_id: roleManager.role_id, branch_id: b3.branch_id, password_hash: passwordHash }
  });
  await prisma.user.create({
    data: { full_name: 'Old Tech', employee_id: 'CBE-OLD-4', email: 'tech@cbe.com', phone: '0900000004', role_id: roleTech.role_id, branch_id: b1.branch_id, password_hash: passwordHash }
  });

  // --- ASSET TYPES ---
  console.log('Seeding Asset Types...');
  const tDesktop = await prisma.assetType.create({ data: { type_name: 'Desktop Computer', description: 'Standard office desktop PC' } });
  const tLaptop = await prisma.assetType.create({ data: { type_name: 'Laptop', description: 'Portable work laptop' } });
  const tPrinter = await prisma.assetType.create({ data: { type_name: 'Printer', description: 'Laser and Inkjet printers' } });
  const tScanner = await prisma.assetType.create({ data: { type_name: 'Scanner', description: 'Document scanners' } });
  const tNetwork = await prisma.assetType.create({ data: { type_name: 'Network Switch', description: 'Cisco or similar network switches' } });

  // --- ASSETS ---
  console.log('Seeding Assets...');
  const a1 = await prisma.asset.create({ data: { tag_no: 'CBE-IT-001', serial_no: 'SNDESK001', model: 'HP ProDesk 400', ws_no: 'WS-AAMB-01', condition: 'Good', status: 'ASSIGNED', asset_type_id: tDesktop.asset_type_id, current_branch_id: b1.branch_id } });
  const a2 = await prisma.asset.create({ data: { tag_no: 'CBE-IT-002', serial_no: 'SNLAP002', model: 'Dell Latitude 5420', condition: 'Excellent', status: 'AVAILABLE', asset_type_id: tLaptop.asset_type_id, current_branch_id: b1.branch_id } });
  const a3 = await prisma.asset.create({ data: { tag_no: 'CBE-IT-003', serial_no: 'SNPRN003', model: 'HP LaserJet Pro M404n', condition: 'Needs Repair', status: 'UNDER_MAINTENANCE', asset_type_id: tPrinter.asset_type_id, current_branch_id: b1.branch_id } });
  const a4 = await prisma.asset.create({ data: { tag_no: 'CBE-IT-004', serial_no: 'SNDESK004', model: 'Lenovo ThinkCentre M720', ws_no: 'WS-AKIL-01', condition: 'Good', status: 'ASSIGNED', asset_type_id: tDesktop.asset_type_id, current_branch_id: b2.branch_id } });
  const a5 = await prisma.asset.create({ data: { tag_no: 'CBE-IT-005', serial_no: 'SNSCAN005', model: 'Epson WorkForce DS-530', condition: 'Good', status: 'AVAILABLE', asset_type_id: tScanner.asset_type_id, current_branch_id: b2.branch_id } });
  const a6 = await prisma.asset.create({ data: { tag_no: 'CBE-IT-006', serial_no: 'SNNET006', model: 'Cisco Catalyst 2960', condition: 'Excellent', status: 'AVAILABLE', asset_type_id: tNetwork.asset_type_id, current_branch_id: b3.branch_id } });
  const a7 = await prisma.asset.create({ data: { tag_no: 'CBE-IT-007', serial_no: 'SNLAP007', model: 'ThinkPad T14', condition: 'Good', status: 'IN_TRANSIT', asset_type_id: tLaptop.asset_type_id, current_branch_id: b1.branch_id } });

  // --- ASSIGNMENTS ---
  console.log('Seeding Assignments...');
  await prisma.assignment.create({
    data: { asset_id: a1.asset_id, employee_id: uEmp1.employee_id, employee_name: uEmp1.full_name, branch_id: b1.branch_id, assigned_by: uOfficer.user_id, status: 'ACTIVE' }
  });
  await prisma.assignment.create({
    data: { asset_id: a4.asset_id, employee_id: uManager2.employee_id, employee_name: uManager2.full_name, branch_id: b2.branch_id, assigned_by: uManager2.user_id, status: 'ACTIVE' }
  });

  // --- MAINTENANCE ---
  console.log('Seeding Maintenance Requests...');
  const mreq1 = await prisma.maintenanceRequest.create({
    data: { asset_id: a3.asset_id, reported_by: uEmp1.user_id, branch_id: b1.branch_id, problem_description: 'Printer is jamming paper and making grinding noises.', priority: 'HIGH', status: 'UNDER_REPAIR' }
  });
  
  await prisma.maintenanceRecord.create({
    data: { request_id: mreq1.request_id, technician_id: uTech.user_id, diagnosis: 'Fuser roller damaged', repair_action: 'Replacing fuser unit', status: 'UNDER_REPAIR', start_date: new Date() }
  });

  // --- DISPATCHES ---
  console.log('Seeding Dispatches...');
  await prisma.dispatch.create({
    data: { asset_id: a7.asset_id, source_location: 'Main Branch Store', destination_branch_id: b3.branch_id, status: 'DISPATCHED' }
  });

  // --- AUDIT LOGS ---
  console.log('Seeding Audit Logs...');
  await prisma.auditLog.createMany({
    data: [
      { user_id: uAdmin.user_id, action: 'CREATE', entity_type: 'Branch', entity_id: b1.branch_id, description: 'Created branch Addis Ababa Main Branch' },
      { user_id: uOfficer.user_id, action: 'CREATE', entity_type: 'Asset', entity_id: a1.asset_id, description: 'Registered new Desktop Computer CBE-IT-001' },
      { user_id: uOfficer.user_id, action: 'ASSIGN', entity_type: 'Assignment', entity_id: a1.asset_id, description: 'Assigned asset CBE-IT-001 to Marta Employee' },
      { user_id: uEmp1.user_id, action: 'CREATE', entity_type: 'MaintenanceRequest', entity_id: mreq1.request_id, description: 'Reported issue for asset CBE-IT-003' }
    ]
  });

  // --- NOTIFICATIONS ---
  console.log('Seeding Notifications...');
  await prisma.notification.createMany({
    data: [
      { user_id: uTech.user_id, title: 'New Maintenance Task', message: 'You have been assigned to repair CBE-IT-003.', type: 'MAINTENANCE' },
      { user_id: uManager2.user_id, title: 'Asset Assigned', message: 'Asset CBE-IT-004 has been assigned to you.', type: 'ASSIGNMENT' }
    ]
  });

  console.log('✅ CBE Mock Data Seed completed successfully!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
