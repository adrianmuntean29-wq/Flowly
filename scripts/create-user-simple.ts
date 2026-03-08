import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createUser() {
  try {
    const email = 'admin@flowly.app';
    const password = 'Admin123!';

    // Check if exists
    const existing = await prisma.user.findUnique({
      where: { email },
    });

    if (existing) {
      console.log('✅ User already exists!');
      console.log('Email:', email);
      console.log('Password:', password);
      await prisma.$disconnect();
      return;
    }

    // Create user
    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        firstName: 'Admin',
        lastName: 'Flowly',
        subscriptionPlan: 'ENTERPRISE',
        subscriptionStart: new Date(),
        subscriptionEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        onboardingCompleted: true,
      },
    });

    console.log('\n✅ User created successfully!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 Email:    ' + email);
    console.log('🔑 Password: ' + password);
    console.log('💎 Plan:     ENTERPRISE');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error: any) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

createUser();
