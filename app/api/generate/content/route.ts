import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/middleware';
import { generateContent, generateImagePrompt, generateCarouselSlidePrompts } from '@/lib/ai/claude';
import { prisma } from '@/lib/db/prisma';
import OpenAI from 'openai';
import { canGeneratePostType, getRequiredPlanForPostType, type SubscriptionPlan, type PostType as PlanPostType } from '@/lib/features/permissions';

function getOpenAIClient() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export async function POST(request: NextRequest) {
  // Check authentication
  const auth = await withAuth(request);
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const { prompt, postType, tone, generateImage, style, slideCount, promptMode } = body;

    // Validate input
    if (!prompt || !postType) {
      return NextResponse.json(
        { error: 'Prompt and postType are required' },
        { status: 400 }
      );
    }

    // Get user subscription plan
    const user = await prisma.user.findUnique({
      where: { id: auth.user!.userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if user has permission to generate this post type
    const userPlan = (user.subscriptionPlan || 'FREE') as SubscriptionPlan;
    if (!canGeneratePostType(userPlan, postType as PlanPostType)) {
      const requiredPlan = getRequiredPlanForPostType(postType as PlanPostType);
      return NextResponse.json(
        {
          error: `This feature requires ${requiredPlan} plan. Upgrade to unlock ${postType} generation.`,
          requiredPlan,
          feature: postType,
        },
        { status: 403 }
      );
    }

    // Check subscription limits
    const postsThisMonth = await prisma.post.count({
      where: {
        userId: user.id,
        createdAt: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        },
      },
    });

    const limits = {
      FREE: 20,
      PRO: 200,
      ENTERPRISE: Infinity,
    };

    const limit = limits[user.subscriptionPlan as keyof typeof limits];
    if (postsThisMonth >= limit) {
      return NextResponse.json(
        { error: `Subscription limit reached. You can generate ${limit} posts per month.` },
        { status: 429 }
      );
    }

    // Generate content with Claude (full brand memory injection)
    const content = await generateContent({
      prompt,
      postType: postType as any,
      tone,
      language: user.language,
      brandContext: user.brandName ?? undefined,
      brandTone: (user as any).brandTone ?? undefined,
      brandIndustry: (user as any).brandIndustry ?? undefined,
      brandKeywords: (user as any).brandKeywords ?? undefined,
      brandVoiceExample: (user as any).brandVoiceExample ?? undefined,
      maxTokens: 1000,
    });

    let imagePrompt = null;
    let imageUrl = null;
    let imageUrls: string[] = [];

    if (generateImage) {
      if (postType === 'CAROUSEL') {
        // Generate 3 slide prompts then 3 images
        const slidePrompts = await generateCarouselSlidePrompts({
          prompt,
          postType: 'CAROUSEL',
          style,
          language: user.language,
          mode: promptMode === 'passthrough' ? 'passthrough' : 'expand',
          brandColors: (user as any).brandColors,
          brandVisualStyle: (user as any).brandVisualStyle,
        }, typeof slideCount === 'number' && slideCount > 0 ? slideCount : 5);
        imagePrompt = slidePrompts[0];

        const imagePromises = slidePrompts.map((slidePrompt) =>
          getOpenAIClient().images.generate({
            model: 'dall-e-3',
            prompt: slidePrompt,
            n: 1,
            size: '1024x1024',
            quality: 'standard',
          }).then((r) => r.data?.[0]?.url || null).catch(() => null)
        );
        const results = await Promise.all(imagePromises);
        imageUrls = results.filter(Boolean) as string[];
        imageUrl = imageUrls[0] || null;
      } else {
        // Single image for POST, REEL, VIDEO, AD
        imagePrompt = await generateImagePrompt({
          prompt,
          postType: postType as any,
          style,
          language: user.language,
          mode: promptMode === 'passthrough' ? 'passthrough' : 'expand',
          brandColors: (user as any).brandColors,
          brandVisualStyle: (user as any).brandVisualStyle,
        });

        try {
          const dalleSize = postType === 'REEL' || postType === 'VIDEO' ? '1024x1792' : '1024x1024';
          const imageResponse = await getOpenAIClient().images.generate({
            model: 'dall-e-3',
            prompt: imagePrompt,
            n: 1,
            size: dalleSize as any,
            quality: 'standard',
          });
          imageUrl = imageResponse.data?.[0]?.url || null;
          if (imageUrl) imageUrls = [imageUrl];
        } catch (imgError) {
          console.error('Image generation failed:', imgError);
        }
      }
    }

    return NextResponse.json({
      content,
      imagePrompt,
      imageUrl,
      imageUrls,
      postType,
      message: 'Content generated successfully',
    });
  } catch (error) {
    console.error('Generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate content' },
      { status: 500 }
    );
  }
}
