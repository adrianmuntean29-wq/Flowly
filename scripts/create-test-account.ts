/**
 * Script pentru crearea contului de test ENTERPRISE
 * Rulare: npx tsx scripts/create-test-account.ts
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createTestAccount() {
  const testEmail = 'admin@flowly.test';
  const testPassword = 'Flowly2024!';

  try {
    // Verifică dacă există deja
    const existing = await prisma.user.findUnique({
      where: { email: testEmail },
    });

    if (existing) {
      console.log('✅ Test account already exists!');
      console.log('📧 Email:', testEmail);
      console.log('🔑 Password:', testPassword);
      console.log('💎 Plan: ENTERPRISE');
      return;
    }

    // Hash password
    const passwordHash = await bcrypt.hash(testPassword, 10);

    // Creează user
    const user = await prisma.user.create({
      data: {
        email: testEmail,
        passwordHash,
        firstName: 'Admin',
        lastName: 'Flowly',
        subscriptionPlan: 'ENTERPRISE',
        subscriptionStart: new Date(),
        subscriptionEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 an
        onboardingCompleted: true,
        brandName: 'Flowly Test Brand',
        brandTone: 'Professional',
        brandIndustry: 'Technology',
        language: 'en',
      },
    });

    console.log('\n🎉 Test account created successfully!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 Email:    ', testEmail);
    console.log('🔑 Password: ', testPassword);
    console.log('💎 Plan:     ', 'ENTERPRISE (unlimited)');
    console.log('👤 User ID:  ', user.id);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('✅ You can now log in at: http://localhost:3000/auth/login\n');
  } catch (error) {
    console.error('❌ Error creating test account:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createTestAccount();
