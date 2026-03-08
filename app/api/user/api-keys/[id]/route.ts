// ============================================================================
// API: DELETE /api/user/api-keys/[id]
// PATCH /api/user/api-keys/[id] — toggle active/inactive
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

  const key = await prisma.userApiKey.findUnique({ where: { id } });
  if (!key || key.userId !== auth.user!.userId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  await prisma.userApiKey.delete({ where: { id } });

  return NextResponse.json({ success: true, message: `${key.label} deleted` });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await withAuth(req);
  if (auth.error) return auth.error;

  const { id } = await params;
  const { isActive } = await req.json();

  const key = await prisma.userApiKey.findUnique({ where: { id } });
  if (!key || key.userId !== auth.user!.userId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const updated = await prisma.userApiKey.update({
    where: { id },
    data: { isActive: Boolean(isActive) },
  });

  return NextResponse.json({
    success: true,
    message: `${updated.label} ${updated.isActive ? 'activated' : 'deactivated'}`,
  });
}
