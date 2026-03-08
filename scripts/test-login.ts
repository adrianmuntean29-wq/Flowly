import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function testLogin() {
  try {
    const email = 'admin@flowly.test';
    const password = 'Flowly2024!';

    console.log('🔍 Testing login for:', email);
    console.log('🔑 Password:', password);
    console.log('');

    // Get user from database
    const user = await prisma.$queryRaw<any[]>`
      SELECT id, email, "passwordHash", "subscriptionPlan", "onboardingCompleted"
      FROM "User"
      WHERE email = ${email}
    `;

    if (!user || user.length === 0) {
      console.log('❌ User NOT found in database!');
      return;
    }

    console.log('✅ User found in database:');
    console.log('   ID:', user[0].id);
    console.log('   Email:', user[0].email);
    console.log('   Plan:', user[0].subscriptionPlan);
    console.log('   Onboarding:', user[0].onboardingCompleted);
    console.log('');

    // Test password
    const passwordHash = user[0].passwordHash;
    const isValid = await bcrypt.compare(password, passwordHash);

    if (isValid) {
      console.log('✅ PASSWORD MATCHES! Login should work.');
      console.log('');
      console.log('Try logging in with:');
      console.log('📧 Email:', email);
      console.log('🔑 Password:', password);
    } else {
      console.log('❌ PASSWORD DOES NOT MATCH!');
      console.log('');
      console.log('Resetting password now...');

      const newHash = await bcrypt.hash(password, 10);
      await prisma.$executeRaw`
        UPDATE "User"
        SET "passwordHash" = ${newHash}
        WHERE email = ${email}
      `;

      console.log('✅ Password reset successfully!');
      console.log('Try logging in again with:');
      console.log('📧 Email:', email);
      console.log('🔑 Password:', password);
    }

  } catch (error: any) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testLogin();
