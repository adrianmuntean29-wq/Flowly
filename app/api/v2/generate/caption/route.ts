// ============================================================================
// API V2: Generate Caption
// Marketing-focused captions (Flowly 2.0)
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/middleware';
import { prisma } from '@/lib/db/prisma';
import { generateCaption } from '@/lib/ai/caption-generator';
import { getBestTextProvider } from '@/lib/ai/providers';
import { z } from 'zod';

const PLAN_LIMITS: Record<string, number | null> = {
  FREE: 20,
  PRO: 200,
  ENTERPRISE: null,
};

const captionRequestSchema = z.object({
  context: z.object({
    imageDescription: z.string().min(10).max(500),
    targetPlatform: z.enum(['INSTAGRAM', 'FACEBOOK', 'LINKEDIN', 'TIKTOK', 'TWITTER']),
    tone: z.enum(['casual', 'professional', 'funny', 'inspirational']).default('casual'),
    audience: z.string().optional(),
    includeHashtags: z.boolean().default(true),
    includeHook: z.boolean().default(true),
    includeCTA: z.boolean().default(true),
  }),
});

export async function POST(req: NextRequest) {
  // 1. Authenticate with custom JWT (replaces next-auth)
  const auth = await withAuth(req);
  if (auth.error) return auth.error;

  try {
    // 2. Validate request body
    const body = await req.json();
    const validated = captionRequestSchema.parse(body);

    // 3. Check monthly generation limit (counted from Post model — no migration needed)
    const user = await prisma.user.findUnique({
      where: { id: auth.user!.userId },
      select: { subscriptionPlan: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const plan = user.subscriptionPlan || 'FREE';
    const limit = PLAN_LIMITS[plan] ?? 20;

    if (limit !== null) {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const monthlyCount = await prisma.post.count({
        where: {
          userId: auth.user!.userId,
          createdAt: { gte: startOfMonth },
        },
      });

      if (monthlyCount >= limit) {
        return NextResponse.json(
          { error: `Monthly limit reached (${limit} posts). Upgrade your plan for more.` },
          { status: 429 }
        );
      }
    }

    // 4. Find the best AI provider for this user
    const providerConfig = await getBestTextProvider(auth.user!.userId);
    if (!providerConfig) {
      return NextResponse.json(
        {
          error: 'No AI provider configured. Add an API key in Settings → Integrations.',
          action: 'add_api_key',
        },
        { status: 402 }
      );
    }

    // 5. Generate caption using the user's provider
    const caption = await generateCaption(
      {
        imageDescription: validated.context.imageDescription,
        platform: validated.context.targetPlatform,
        tone: validated.context.tone,
        audience: validated.context.audience,
        includeHashtags: validated.context.includeHashtags,
        includeHook: validated.context.includeHook,
        includeCTA: validated.context.includeCTA,
      },
      providerConfig
    );

    // 6. Return response
    return NextResponse.json({
      caption,
      metadata: {
        platform: validated.context.targetPlatform,
        tone: validated.context.tone,
        characterCount: caption.characterCount,
        plan,
        aiProvider: providerConfig.provider,
      },
    });

  } catch (error: any) {
    console.error('[/api/v2/generate/caption]', error);

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid request format', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to generate caption' },
      { status: 500 }
    );
  }
}
