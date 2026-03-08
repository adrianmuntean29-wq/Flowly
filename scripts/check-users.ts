import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkUsers() {
  try {
    const users = await prisma.$queryRaw`
      SELECT email, "subscriptionPlan", "onboardingCompleted"
      FROM "User"
      LIMIT 5
    `;

    console.log('Existing users:', users);
  } catch (error: any) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();
