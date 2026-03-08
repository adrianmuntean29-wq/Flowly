// ============================================================================
// API: POST /api/generate/image
// Generates an image using the best available provider for the user.
// Free fallback: Pollinations.ai (no key needed)
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/middleware';
import { getBestImageProvider } from '@/lib/ai/providers';
import {
  generateWithPollinations,
  generateWithStability,
  generateWithDalle,
  generateWithReplicate,
} from '@/lib/ai/image-gen';
import { z } from 'zod';

const requestSchema = z.object({
  prompt: z.string().min(3).max(1000),
  negativePrompt: z.string().max(500).optional(),
  style: z
    .enum(['photorealistic', 'illustration', 'minimalist', 'cinematic', 'watercolor', 'flat-design'])
    .optional(),
  aspectRatio: z.enum(['1:1', '4:5', '16:9', '9:16', '3:2']).optional().default('1:1'),
  seed: z.number().optional(),
});

const ASPECT_RATIOS: Record<string, { width: number; height: number }> = {
  '1:1': { width: 1024, height: 1024 },
  '4:5': { width: 1024, height: 1280 },
  '16:9': { width: 1280, height: 720 },
  '9:16': { width: 720, height: 1280 },
  '3:2': { width: 1200, height: 800 },
};

export async function POST(req: NextRequest) {
  const auth = await withAuth(req);
  if (auth.error) return auth.error;

  try {
    const body = await req.json();
    const validated = requestSchema.parse(body);

    const { width, height } = ASPECT_RATIOS[validated.aspectRatio ?? '1:1'];

    // Get the best image provider for this user
    const { provider, apiKey, model } = await getBestImageProvider(auth.user!.userId);

    const genRequest = {
      prompt: validated.prompt,
      negativePrompt: validated.negativePrompt,
      style: validated.style,
      width,
      height,
      seed: validated.seed,
    };

    let result;
    switch (provider) {
      case 'pollinations':
        result = await generateWithPollinations(genRequest);
        break;
      case 'stability':
        result = await generateWithStability(genRequest, apiKey!);
        break;
      case 'openai':
        result = await generateWithDalle(genRequest, apiKey!);
        break;
      case 'replicate':
        result = await generateWithReplicate(genRequest, apiKey!);
        break;
      default:
        result = await generateWithPollinations(genRequest);
    }

    return NextResponse.json({
      url: result.url,
      provider: result.provider,
      width: result.width,
      height: result.height,
      prompt: validated.prompt,
    });
  } catch (err: any) {
    if (err.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid request', details: err.errors },
        { status: 400 }
      );
    }
    console.error('[generate/image]', err);
    return NextResponse.json(
      { error: err.message || 'Image generation failed' },
      { status: 500 }
    );
  }
}
