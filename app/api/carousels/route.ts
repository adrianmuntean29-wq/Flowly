import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/middleware';
import { prisma } from '@/lib/db/prisma';

export async function GET(req: NextRequest) {
  const auth = await withAuth(req);
  if (auth.error) return auth.error;

  try {
    const carousels = await prisma.carousel.findMany({
      where: { userId: auth.user!.userId },
      include: {
        slides: { orderBy: { order: 'asc' }, take: 1 },
        _count: { select: { slides: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return NextResponse.json({ carousels });
  } catch (error: any) {
    console.error('List carousels error:', error);
    return NextResponse.json({ error: 'Failed to list carousels' }, { status: 500 });
  }
}
