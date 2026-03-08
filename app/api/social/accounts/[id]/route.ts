// ============================================================================
// API: DELETE /api/social/accounts/[id]
// Disconnects (soft-deletes) a social account.
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/middleware';
import { prisma } from '@/lib/db/prisma';

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await withAuth(req);
  if (auth.error) return auth.error;

  const { id } = await params;

  // Ensure the account belongs to this user
  const account = await prisma.socialAccount.findUnique({
    where: { id },
    select: { userId: true, platform: true, username: true },
  });

  if (!account) {
    return NextResponse.json({ error: 'Account not found' }, { status: 404 });
  }

  if (account.userId !== auth.user!.userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Soft-delete: mark as disconnected (keeps history)
  await prisma.socialAccount.update({
    where: { id },
    data: { isConnected: false },
  });

  return NextResponse.json({
    success: true,
    message: `${account.platform} account "${account.username}" disconnected`,
  });
}
