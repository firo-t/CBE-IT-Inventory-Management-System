import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const roles = [
    {
      role_name: 'System Administrator / Admin',
      description: 'System Administrator with full access to manage users, roles, and the entire system.',
    },
    {
      role_name: 'IT Inventory Officer',
      description: 'Manages asset registration, assignments, dispatches, and reports across the organization.',
    },
    {
      role_name: 'Hardware Technician',
      description: 'Handles maintenance requests, updates repair status, and maintains maintenance records.',
    },
    {
      role_name: 'Branch Manager',
      description: 'Manages operations at the branch level, views branch assets, and requests maintenance.',
    },
  ];

  console.log('Start seeding roles...');
  for (const role of roles) {
    const roleCreated = await prisma.role.upsert({
      where: { role_name: role.role_name },
      update: {}, // Empty update ensures idempotency without modifying existing records
      create: {
        role_name: role.role_name,
        description: role.description,
      },
    });
    console.log(`Upserted role: ${roleCreated.role_name}`);
  }
  console.log('Seeding completed.');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
