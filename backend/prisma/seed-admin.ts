import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting admin bootstrap...');

  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  const adminEmployeeId = process.env.ADMIN_EMPLOYEE_ID;
  const adminFullName = process.env.ADMIN_FULL_NAME || 'System Administrator';

  if (!adminEmail || !adminPassword || !adminEmployeeId) {
    console.error('Error: ADMIN_EMAIL, ADMIN_PASSWORD, and ADMIN_EMPLOYEE_ID must be set in environment variables.');
    process.exit(1);
  }

  // Check if admin already exists
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (existingAdmin) {
    console.log(`Admin user with email ${adminEmail} already exists. Skipping creation.`);
    return;
  }

  // Ensure Role exists
  const roleName = 'System Administrator / Admin';
  const adminRole = await prisma.role.findUnique({
    where: { role_name: roleName },
  });

  if (!adminRole) {
    console.error(`Error: Role "${roleName}" not found. Please run the standard db seed first.`);
    process.exit(1);
  }

  // Hash password
  const passwordHash = await bcrypt.hash(adminPassword, 10);

  // Create admin
  await prisma.user.create({
    data: {
      full_name: adminFullName,
      email: adminEmail,
      employee_id: adminEmployeeId,
      password_hash: passwordHash,
      role_id: adminRole.role_id,
      status: 'ACTIVE',
    },
  });

  console.log('Admin user successfully created.');
}

main()
  .catch((e) => {
    console.error('Bootstrap error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
