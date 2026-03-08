// ============================================================================
// CREATE ADMIN USER WITH ENTERPRISE ACCESS
// Flowly 2.0 - Test Account Creation
// ============================================================================

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createAdminUser() {
  console.log('🚀 Creating Flowly 2.0 Admin User...\n');

  try {
    // Check if user already exists
    const existing = await prisma.user.findUnique({
      where: { email: 'admin@flowly.app' },
    });

    if (existing) {
      console.log('⚠️  User already exists!');
      console.log('\n📧 Email: admin@flowly.app');
      console.log('🔑 Password: FlowlyAdmin2024!');
      console.log('💎 Plan: ENTERPRISE\n');
      return;
    }

    // Create admin user
    const passwordHash = await bcrypt.hash('FlowlyAdmin2024!', 10);

    const user = await prisma.user.create({
      data: {
        email: 'admin@flowly.app',
        passwordHash,
        firstName: 'Admin',
        lastName: 'Flowly',

        // ENTERPRISE subscription
        subscriptionPlan: 'ENTERPRISE',
        subscriptionStart: new Date(),
        subscriptionEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year

        // Brand settings
        brandName: 'Flowly',
        brandTone: 'professional',
        brandIndustry: 'SaaS',
        brandKeywords: ['AI', 'Social Media', 'Content Creation'],

        // Complete onboarding
        onboardingCompleted: true,
      },
    });

    console.log('✅ Admin user created successfully!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 Email:    admin@flowly.app');
    console.log('🔑 Password: FlowlyAdmin2024!');
    console.log('💎 Plan:     ENTERPRISE (Unlimited)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n🎯 Login at: http://localhost:3000/auth/login');
    console.log('\n✨ All features unlocked!');
    console.log('   - Unlimited post generation');
    console.log('   - Image generation');
    console.log('   - Carousel creation');
    console.log('   - Video uploads');
    console.log('   - All premium features\n');

  } catch (error) {
    console.error('❌ Error creating user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdminUser();
