const { PrismaClient, Role, Status } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const usersData = [
    {
      name: 'Admin User',
      email: 'admin@valuemomentum.com',
      password: '$2b$10$abcdefghijklmnopqrstuvABCDEFGHIJKLMNOPQRSTUV', // replace with hashed password
      company: 'ValueMomentum',
      role: Role.ADMINISTRATOR,
      status: Status.APPROVED,
    },
    {
      name: 'Developer User',
      email: 'developer@valuemomentum.com',
      password: '$2b$10$abcdefghijklmnopqrstuvABCDEFGHIJKLMNOPQRSTUV',
      company: 'ValueMomentum',
      role: Role.DEVELOPER,
      status: Status.APPROVED,
    },
    {
      name: 'Viewer User',
      email: 'viewer@valuemomentum.com',
      password: '$2b$10$abcdefghijklmnopqrstuvABCDEFGHIJKLMNOPQRSTUV',
      company: 'ValueMomentum',
      role: Role.VIEWER,
      status: Status.APPROVED,
    },
  ];

  for (const userData of usersData) {
    await prisma.user.upsert({
      where: { email: userData.email },
      update: userData, // Update the existing user with new data
      create: userData, // Create the user if they don't exist
    });
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
