import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/middleware';
import { prisma } from '@/lib/db/prisma';
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(request: NextRequest) {
  const auth = await withAuth(request);
  if (auth.error) return auth.error;

  try {
    const user = await prisma.user.findUnique({
      where: { id: auth.user!.userId },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await request.json();
    const { count = 10, postType } = body;

    const brandContext = [
      user.brandName ? `Brand: ${user.brandName}` : '',
      (user as any).brandIndustry ? `Industry: ${(user as any).brandIndustry}` : '',
      (user as any).brandTone ? `Tone: ${(user as any).brandTone}` : '',
      (user as any).brandKeywords?.length
        ? `Keywords: ${(user as any).brandKeywords.join(', ')}`
        : '',
    ]
      .filter(Boolean)
      .join('\n');

    const systemPrompt = `You are a creative social media strategist.
Generate viral, engaging content ideas that are specific and actionable.
${user.language ? `Language: ${user.language}` : 'Language: English'}
${brandContext ? `\nBrand context:\n${brandContext}` : ''}`;

    const userPrompt = `Generate exactly ${count} creative social media content ideas${
      postType && postType !== 'ALL' ? ` for ${postType} posts` : ''
    }.

For each idea, return a JSON object with:
- title: short catchy title (max 8 words)
- prompt: detailed prompt ready to use in the generator (2-3 sentences)
- type: one of POST, CAROUSEL, REEL, VIDEO, AD
- hook: the opening line that will grab attention
- why: why this content will perform well (1 sentence)

Return ONLY a valid JSON array with exactly ${count} objects, no other text.`;

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2000,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    });

    const text = message.content[0]?.type === 'text' ? message.content[0].text : '';
    const match = text.match(/\[[\s\S]*\]/);

    if (!match) {
      throw new Error('Invalid AI response format');
    }

    const ideas = JSON.parse(match[0]);
    return NextResponse.json({ ideas });
  } catch (error) {
    console.error('Ideas generation error:', error);
    return NextResponse.json({ error: 'Failed to generate ideas' }, { status: 500 });
  }
}
