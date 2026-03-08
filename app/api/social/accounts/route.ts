// ============================================================================
// API: GET /api/social/accounts
// Returns all connected social accounts for the authenticated user.
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/middleware';
import { prisma } from '@/lib/db/prisma';

export async function GET(req: NextRequest) {
  const auth = await withAuth(req);
  if (auth.error) return auth.error;

  const accounts = await prisma.socialAccount.findMany({
    where: {
      userId: auth.user!.userId,
      isConnected: true,
    },
    select: {
      id: true,
      platform: true,
      username: true,
      accountId: true,
      connectedAt: true,
      expiresAt: true,
      // Never return accessToken to the client
    },
    orderBy: { connectedAt: 'desc' },
  });

  return NextResponse.json({ accounts });
}
