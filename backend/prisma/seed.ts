import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // 1. Seed Roles
  const roles = [
    { role_name: 'System Administrator / Admin', description: 'System Administrator with full access.' },
    { role_name: 'IT Inventory Officer', description: 'Manages asset registration, assignments, dispatches.' },
    { role_name: 'Hardware Technician', description: 'Handles maintenance requests.' },
    { role_name: 'Branch Manager', description: 'Manages operations at the branch level.' },
  ];

  console.log('Start seeding roles...');
  const createdRoles: Record<string, string> = {};
  for (const role of roles) {
    const roleCreated = await prisma.role.upsert({
      where: { role_name: role.role_name },
      update: {}, 
      create: role,
    });
    createdRoles[role.role_name] = roleCreated.role_id;
  }

  // 2. Seed Users
  console.log('Start seeding test users...');
  const passwordHash = await bcrypt.hash('password123', 10);
  const testUsers = [
    { full_name: 'Admin User', employee_id: 'TEST-ADM-01', email: 'admin@cbe.com', password_hash: passwordHash, role_id: createdRoles['System Administrator / Admin'], status: 'ACTIVE' as const },
    { full_name: 'IT Officer User', employee_id: 'TEST-IT-01', email: 'itofficer@cbe.com', password_hash: passwordHash, role_id: createdRoles['IT Inventory Officer'], status: 'ACTIVE' as const },
    { full_name: 'Technician User', employee_id: 'TEST-TECH-01', email: 'technician@cbe.com', password_hash: passwordHash, role_id: createdRoles['Hardware Technician'], status: 'ACTIVE' as const },
    { full_name: 'Branch Manager User', employee_id: 'TEST-MGR-01', email: 'manager@cbe.com', password_hash: passwordHash, role_id: createdRoles['Branch Manager'], status: 'ACTIVE' as const }
  ];

  const createdUsers: Record<string, string> = {};
  for (const user of testUsers) {
    const userCreated = await prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: user,
    });
    createdUsers[user.email] = userCreated.user_id;
  }

  // 3. Seed Branches
  console.log('Start seeding branches...');
  const branches = [
    { branch_code: 'HQ-001', branch_name: 'Headquarters Main', location: 'Addis Ababa', manager_id: createdUsers['manager@cbe.com'] },
    { branch_code: 'BR-002', branch_name: 'North City Branch', location: 'Addis Ababa', manager_id: null },
    { branch_code: 'BR-003', branch_name: 'Mekelle Branch', location: 'Mekelle', manager_id: null },
  ];
  for (const branch of branches) {
    await prisma.branch.upsert({
      where: { branch_code: branch.branch_code },
      update: {},
      create: branch,
    });
  }

  // 4. Seed Asset Types
  console.log('Start seeding asset types...');
  const assetTypes = [
    { type_name: 'Laptop', description: 'Portable computer devices' },
    { type_name: 'Desktop PC', description: 'Standard desktop workstations' },
    { type_name: 'Monitor', description: 'External display monitors' },
    { type_name: 'Printer', description: 'Office printers and scanners' },
    { type_name: 'Server', description: 'Rackmount server infrastructure' },
  ];
  for (const assetType of assetTypes) {
    await prisma.assetType.upsert({
      where: { type_name: assetType.type_name },
      update: {},
      create: assetType,
    });
  }

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
