// ============================================================================
// CREATE TEST USER WITH CURRENT SCHEMA
// Works with existing database structure
// ============================================================================

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createTestUser() {
  console.log('🚀 Creating Test User...\n');

  try {
    // Check if user already exists
    const existing = await prisma.user.findUnique({
      where: { email: 'test@flowly.app' },
    });

    if (existing) {
      console.log('⚠️  User already exists!');
      console.log('\n📧 Email: test@flowly.app');
      console.log('🔑 Password: Test123!');
      console.log('💎 Plan: ENTERPRISE\n');
      return;
    }

    // Create test user with CURRENT schema
    const passwordHash = await bcrypt.hash('Test123!', 10);

    const user = await prisma.user.create({
      data: {
        email: 'test@flowly.app',
        passwordHash,
        firstName: 'Test',
        lastName: 'User',

        // ENTERPRISE subscription
        subscriptionPlan: 'ENTERPRISE',
        subscriptionStart: new Date(),
        subscriptionEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year

        // Brand settings
        brandName: 'Test Brand',
        brandTone: 'professional',
        brandIndustry: 'Technology',
        brandKeywords: ['AI', 'Innovation'],

        // Complete onboarding
        onboardingCompleted: true,
      },
    });

    console.log('✅ Test user created successfully!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 Email:    test@flowly.app');
    console.log('🔑 Password: Test123!');
    console.log('💎 Plan:     ENTERPRISE (Unlimited Access)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n🎯 Login at: http://localhost:3000/auth/login');
    console.log('\n✨ Features unlocked:');
    console.log('   ✓ All post types (Image, Carousel, Video)');
    console.log('   ✓ Unlimited generations');
    console.log('   ✓ Premium templates');
    console.log('   ✓ Full platform access\n');

  } catch (error) {
    console.error('❌ Error creating user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUser();
