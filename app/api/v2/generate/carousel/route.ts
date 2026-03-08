// ============================================================================
// API V2: Generate Carousel
// AI-powered carousel creation (Flowly 2.0)
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/middleware';
import { prisma } from '@/lib/db/prisma';
import { generateCarouselContent } from '@/lib/ai/carousel-generator';
import { z } from 'zod';

const carouselRequestSchema = z.object({
  topic: z.string().min(5).max(200),
  slideCount: z.number().min(3).max(10).default(5),
  style: z.string().default('modern'),
  colorScheme: z.string().default('blue-gradient'),
  includeImages: z.boolean().default(true),
  platform: z.enum(['INSTAGRAM', 'FACEBOOK', 'LINKEDIN', 'TIKTOK']).default('INSTAGRAM'),
  tone: z.enum(['casual', 'professional', 'funny', 'inspirational']).default('professional'),
});

export async function POST(req: NextRequest) {
  // 1. Authenticate with custom JWT
  const auth = await withAuth(req);
  if (auth.error) return auth.error;

  try {
    // 2. Check user exists + plan
    const user = await prisma.user.findUnique({
      where: { id: auth.user!.userId },
      select: { subscriptionPlan: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const plan = user.subscriptionPlan || 'FREE';
    if (plan === 'FREE') {
      return NextResponse.json(
        { error: 'Carousel generation requires PRO plan', requiredPlan: 'PRO' },
        { status: 403 }
      );
    }

    // 3. Validate request
    const body = await req.json();
    const validated = carouselRequestSchema.parse(body);

    // 4. Generate carousel structure with AI
    const { slides } = await generateCarouselContent({
      topic: validated.topic,
      slideCount: validated.slideCount,
      platform: validated.platform,
      tone: validated.tone,
    });

    // 5. Create carousel record
    const carousel = await prisma.carousel.create({
      data: {
        userId: auth.user!.userId,
        name: validated.topic,
        description: `${validated.slideCount}-slide carousel about ${validated.topic}`,
        prompt: validated.topic,
        theme: validated.style,
        slideCount: validated.slideCount,
        generatedBy: 'CLAUDE',
      },
    });

    // 6. Create slides
    for (let i = 0; i < slides.length; i++) {
      const slideData = slides[i];
      await prisma.carouselSlide.create({
        data: {
          carouselId: carousel.id,
          order: i,
          heading: slideData.heading,
          subheading: slideData.subheading,
          bodyText: slideData.bodyText,
          backgroundColor: validated.colorScheme,
          backgroundType: validated.includeImages ? 'IMAGE' : 'GRADIENT',
        },
      });
    }

    // 7. Fetch complete carousel with slides
    const completeCarousel = await prisma.carousel.findUnique({
      where: { id: carousel.id },
      include: { slides: { orderBy: { order: 'asc' } } },
    });

    return NextResponse.json({
      carousel: completeCarousel,
      message: 'Carousel generated successfully',
    });

  } catch (error: any) {
    console.error('Carousel generation error:', error);
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid request format', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: error.message || 'Failed to generate carousel' },
      { status: 500 }
    );
  }
}

// GET endpoint - fetch user's carousels
export async function GET(req: NextRequest) {
  const auth = await withAuth(req);
  if (auth.error) return auth.error;

  try {
    const carousels = await prisma.carousel.findMany({
      where: { userId: auth.user!.userId },
      include: {
        slides: { orderBy: { order: 'asc' }, take: 1 },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return NextResponse.json({ carousels });
  } catch (error: any) {
    console.error('Fetch carousels error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
