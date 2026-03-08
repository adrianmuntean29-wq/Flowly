import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/middleware';
import { prisma } from '@/lib/db/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await withAuth(req);
  if (auth.error) return auth.error;

  try {
    const { id } = await params;
    const carousel = await prisma.carousel.findUnique({
      where: { id },
      include: { slides: { orderBy: { order: 'asc' } } },
    });

    if (!carousel) {
      return NextResponse.json({ error: 'Carousel not found' }, { status: 404 });
    }
    if (carousel.userId !== auth.user!.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    return NextResponse.json(carousel);
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to fetch carousel' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await withAuth(req);
  if (auth.error) return auth.error;

  try {
    const { id } = await params;
    const carousel = await prisma.carousel.findUnique({ where: { id } });

    if (!carousel || carousel.userId !== auth.user!.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await prisma.carousel.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to delete carousel' }, { status: 500 });
  }
}
