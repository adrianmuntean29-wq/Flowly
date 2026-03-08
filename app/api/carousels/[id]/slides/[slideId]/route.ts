import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/middleware';
import { prisma } from '@/lib/db/prisma';
import { regenerateCarouselSlide } from '@/lib/ai/carousel-generator';

type RouteParams = { params: Promise<{ id: string; slideId: string }> };

// PUT — update slide text / design
export async function PUT(req: NextRequest, { params }: RouteParams) {
  const auth = await withAuth(req);
  if (auth.error) return auth.error;

  try {
    const { id, slideId } = await params;

    // Ownership check via carousel
    const carousel = await prisma.carousel.findUnique({ where: { id } });
    if (!carousel || carousel.userId !== auth.user!.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await req.json();
    const { heading, subheading, bodyText, backgroundColor, backgroundType, imagePrompt } = body;

    const updated = await prisma.carouselSlide.update({
      where: { id: slideId },
      data: {
        ...(heading !== undefined && { heading }),
        ...(subheading !== undefined && { subheading }),
        ...(bodyText !== undefined && { bodyText }),
        ...(backgroundColor !== undefined && { backgroundColor }),
        ...(backgroundType !== undefined && { backgroundType }),
        ...(imagePrompt !== undefined && { imagePrompt: imagePrompt } as any),
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Update slide error:', error);
    return NextResponse.json({ error: 'Failed to update slide' }, { status: 500 });
  }
}

// POST — regenerate this slide with AI
export async function POST(req: NextRequest, { params }: RouteParams) {
  const auth = await withAuth(req);
  if (auth.error) return auth.error;

  try {
    const { id, slideId } = await params;

    const carousel = await prisma.carousel.findUnique({
      where: { id },
      include: { slides: { orderBy: { order: 'asc' } } },
    });

    if (!carousel || carousel.userId !== auth.user!.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const slide = carousel.slides.find((s) => s.id === slideId);
    if (!slide) {
      return NextResponse.json({ error: 'Slide not found' }, { status: 404 });
    }

    // Call AI to regenerate this slide
    const newContent = await regenerateCarouselSlide(
      carousel.prompt || carousel.name,
      slide.order + 1,
      carousel.slides.length,
      slide.heading || undefined
    );

    const updated = await prisma.carouselSlide.update({
      where: { id: slideId },
      data: {
        heading: newContent.heading,
        subheading: newContent.subheading || null,
        bodyText: newContent.bodyText || null,
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Regenerate slide error:', error);
    return NextResponse.json({ error: 'Failed to regenerate slide' }, { status: 500 });
  }
}
