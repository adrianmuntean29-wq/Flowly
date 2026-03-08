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
    const { postsPerDay = 1, startDate, platforms = [] } = body;

    const brandContext = [
      user.brandName ? `Brand: ${user.brandName}` : '',
      (user as any).brandIndustry ? `Industry: ${(user as any).brandIndustry}` : '',
      (user as any).brandTone ? `Tone: ${(user as any).brandTone}` : '',
      (user as any).brandKeywords?.length
        ? `Keywords: ${(user as any).brandKeywords.join(', ')}`
        : '',
      (user as any).brandVoiceExample
        ? `Voice example: ${(user as any).brandVoiceExample}`
        : '',
    ]
      .filter(Boolean)
      .join('\n');

    const start = startDate ? new Date(startDate) : new Date();
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      days.push(d.toISOString().split('T')[0]);
    }

    const systemPrompt = `You are a professional social media content strategist.
Create a comprehensive 7-day content plan that is varied, engaging, and strategic.
${user.language ? `Language: ${user.language}` : 'Language: English'}
${brandContext ? `\nBrand context:\n${brandContext}` : ''}`;

    const userPrompt = `Create a 7-day social media content plan.
Days: ${days.join(', ')}
Posts per day: ${postsPerDay}
${platforms.length > 0 ? `Target platforms: ${platforms.join(', ')}` : ''}

For each day, create ${postsPerDay} post(s). Return ONLY a valid JSON array where each item has:
- date: the date string (YYYY-MM-DD)
- title: short catchy title (max 8 words)
- content: full post content ready to publish (2-4 sentences with emojis)
- type: one of POST, CAROUSEL, REEL, VIDEO, AD
- hook: opening line to grab attention
- platforms: array of platforms (instagram, tiktok, linkedin, facebook)
- dayTheme: overall theme for this day (1-3 words)

Make each day have a different theme/angle. Total: ${7 * postsPerDay} items.
Return ONLY the JSON array, no other text.`;

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 4000,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    });

    const text = message.content[0]?.type === 'text' ? message.content[0].text : '';
    const match = text.match(/\[[\s\S]*\]/);

    if (!match) {
      throw new Error('Invalid AI response format');
    }

    const plan = JSON.parse(match[0]);
    return NextResponse.json({ plan, days });
  } catch (error) {
    console.error('Planner generation error:', error);
    return NextResponse.json({ error: 'Failed to generate plan' }, { status: 500 });
  }
}
