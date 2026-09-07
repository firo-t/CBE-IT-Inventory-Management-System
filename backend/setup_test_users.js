const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const admin = await prisma.user.findUnique({ where: { email: 'admin@cbe.com' } });
  if (!admin) {
    console.error("Admin not found");
    process.exit(1);
  }
  const password_hash = admin.password_hash;
  
  const officerRole = await prisma.role.findUnique({ where: { role_name: 'IT Inventory Officer' } });
  const techRole = await prisma.role.findUnique({ where: { role_name: 'Hardware Technician' } });
  
  if (!officerRole || !techRole) {
    console.error("Roles not found");
    process.exit(1);
  }

  await prisma.user.upsert({
    where: { email: 'officer@cbe.com' },
    update: { password_hash },
    create: {
      email: 'officer@cbe.com',
      password_hash,
      full_name: 'Test Officer',
      employee_id: 'EMP-OFFICER-001',
      role_id: officerRole.role_id,
      status: 'ACTIVE'
    }
  });

  await prisma.user.upsert({
    where: { email: 'tech@cbe.com' },
    update: { password_hash },
    create: {
      email: 'tech@cbe.com',
      password_hash,
      full_name: 'Test Tech',
      employee_id: 'EMP-TECH-001',
      role_id: techRole.role_id,
      status: 'ACTIVE'
    }
  });

  const mgrRole = await prisma.role.findUnique({ where: { role_name: 'Branch Manager' } });
  if (mgrRole) {
    await prisma.user.upsert({
      where: { email: 'mgr@cbe.com' },
      update: { password_hash },
      create: {
        email: 'mgr@cbe.com',
        password_hash,
        full_name: 'Test Mgr',
        employee_id: 'EMP-MGR-001',
        role_id: mgrRole.role_id,
        status: 'ACTIVE'
      }
    });
  }

  console.log("Users created successfully");
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
