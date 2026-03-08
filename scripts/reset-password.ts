import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function resetPassword() {
  try {
    const email = 'admin@flowly.test';
    const newPassword = 'Flowly2024!';

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Update user using raw SQL to avoid schema mismatch
    await prisma.$executeRaw`
      UPDATE "User"
      SET "passwordHash" = ${passwordHash}
      WHERE email = ${email}
    `;

    console.log('✅ Password reset successfully!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 Email:    admin@flowly.test');
    console.log('🔑 Password: Flowly2024!');
    console.log('💎 Plan:     ENTERPRISE');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n🎯 Login at: http://localhost:3000/auth/login\n');

  } catch (error: any) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

resetPassword();
