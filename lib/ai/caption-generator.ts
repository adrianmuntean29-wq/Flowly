// ============================================================================
// FLOWLY 2.0 CAPTION GENERATOR — Multi-Provider
// Supports: Claude, GPT-4o, Gemini Flash, Groq (Llama 3)
// ============================================================================

import Anthropic from '@anthropic-ai/sdk';
import type { TextProvider } from './providers';

export type Platform = 'INSTAGRAM' | 'FACEBOOK' | 'LINKEDIN' | 'TIKTOK' | 'TWITTER';
export type Tone = 'casual' | 'professional' | 'funny' | 'inspirational';

export interface CaptionGenerationContext {
  imageDescription: string;
  platform: Platform;
  tone: Tone;
  audience?: string;
  includeHashtags?: boolean;
  includeHook?: boolean;
  includeCTA?: boolean;
}

export interface ProviderConfig {
  provider: TextProvider;
  apiKey: string;
  model: string;
}

export interface GeneratedCaption {
  hook?: string;
  body: string;
  cta?: string;
  hashtags?: string[];
  fullCaption: string;
  characterCount: number;
}

// ─── Platform-specific prompt rules ─────────────────────────────────────────

const PLATFORM_RULES: Record<Platform, string> = {
  INSTAGRAM: 'Use 5-10 hashtags. Add 2-3 relevant emojis. Keep it personal and relatable. End with a question or CTA.',
  FACEBOOK: 'Conversational tone. Write in a storytelling style. Ask a question to drive comments. 2-3 hashtags max.',
  LINKEDIN: 'Professional tone. No emojis. Use line breaks for readability. Share a lesson or insight. 3-5 relevant hashtags.',
  TIKTOK: 'Very casual, energetic language. Use trending phrases. Short sentences. 5-8 hashtags. Sound like a real person.',
  TWITTER: 'Under 280 characters for the main text. Direct and punchy. 1-2 hashtags max.',
};

// ─── Build the prompt ────────────────────────────────────────────────────────

function buildPrompt(ctx: CaptionGenerationContext): string {
  const platformRule = PLATFORM_RULES[ctx.platform];
  const audience = ctx.audience || 'general audience';

  return `You are a professional social media copywriter who writes natural, human-sounding content that gets real engagement.

Write a ${ctx.platform} post about: "${ctx.imageDescription}"
Tone: ${ctx.tone}
Target audience: ${audience}

Platform rules: ${platformRule}

Requirements:
- Sound like a real human, NOT like AI or a marketing bot
- Be specific and concrete, not generic
- Use the brand voice consistently
${ctx.includeHook !== false ? '- Start with a scroll-stopping hook (first line must grab attention)' : ''}
${ctx.includeCTA !== false ? '- End with a clear call-to-action that drives engagement' : ''}
${ctx.includeHashtags !== false ? '- Include platform-appropriate hashtags' : '- Do NOT include hashtags'}

Return ONLY valid JSON (no markdown, no explanation):
{
  "hook": "The opening line that stops the scroll",
  "body": "Main caption text (2-3 sentences, natural and engaging)",
  "cta": "Call to action (question or invitation)",
  "hashtags": ["hashtag1", "hashtag2", "hashtag3"]
}`;
}

// ─── Parse AI response ───────────────────────────────────────────────────────

function parseResponse(text: string): any {
  // Strip markdown code blocks if present
  const clean = text.trim().replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
  return JSON.parse(clean);
}

// ─── Build full caption from parts ──────────────────────────────────────────

function assembleCaption(parsed: any, ctx: CaptionGenerationContext): GeneratedCaption {
  const parts: string[] = [];

  if (ctx.includeHook !== false && parsed.hook) {
    parts.push(parsed.hook);
    parts.push('');
  }

  parts.push(parsed.body);

  if (ctx.includeCTA !== false && parsed.cta) {
    parts.push('');
    parts.push(parsed.cta);
  }

  if (ctx.includeHashtags !== false && parsed.hashtags?.length > 0) {
    parts.push('');
    const tags = parsed.hashtags.map((t: string) => (t.startsWith('#') ? t : `#${t}`)).join(' ');
    parts.push(tags);
  }

  const fullCaption = parts.join('\n');
  return {
    hook: parsed.hook,
    body: parsed.body,
    cta: parsed.cta,
    hashtags: parsed.hashtags,
    fullCaption,
    characterCount: fullCaption.length,
  };
}

// ─── Provider implementations ────────────────────────────────────────────────

async function generateWithClaude(prompt: string, model: string, apiKey: string): Promise<string> {
  const client = new Anthropic({ apiKey });
  const msg = await client.messages.create({
    model,
    max_tokens: 1024,
    temperature: 0.8,
    messages: [{ role: 'user', content: prompt }],
  });
  return msg.content[0].type === 'text' ? msg.content[0].text : '';
}

async function generateWithOpenAI(prompt: string, model: string, apiKey: string): Promise<string> {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 1024,
      temperature: 0.8,
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || 'OpenAI error');
  return data.choices[0].message.content || '';
}

async function generateWithGemini(prompt: string, model: string, apiKey: string): Promise<string> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.8, maxOutputTokens: 1024 },
      }),
    }
  );
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || 'Gemini error');
  return data.candidates[0]?.content?.parts[0]?.text || '';
}

async function generateWithGroq(prompt: string, model: string, apiKey: string): Promise<string> {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 1024,
      temperature: 0.8,
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || 'Groq error');
  return data.choices[0].message.content || '';
}

// ─── Main export ──────────────────────────────────────────────────────────────

export async function generateCaption(
  ctx: CaptionGenerationContext,
  providerConfig?: ProviderConfig
): Promise<GeneratedCaption> {
  const prompt = buildPrompt(ctx);

  // Default to platform Anthropic key if no provider config given
  const config = providerConfig ?? {
    provider: 'anthropic' as TextProvider,
    apiKey: process.env.ANTHROPIC_API_KEY!,
    model: 'claude-sonnet-4-6',
  };

  try {
    let rawText: string;

    switch (config.provider) {
      case 'anthropic':
        rawText = await generateWithClaude(prompt, config.model, config.apiKey);
        break;
      case 'openai':
        rawText = await generateWithOpenAI(prompt, config.model, config.apiKey);
        break;
      case 'gemini':
        rawText = await generateWithGemini(prompt, config.model, config.apiKey);
        break;
      case 'groq':
        rawText = await generateWithGroq(prompt, config.model, config.apiKey);
        break;
      default:
        rawText = await generateWithClaude(prompt, 'claude-sonnet-4-6', process.env.ANTHROPIC_API_KEY!);
    }

    const parsed = parseResponse(rawText);
    return assembleCaption(parsed, ctx);

  } catch (err: any) {
    console.error(`[caption-generator/${config.provider}]`, err.message);

    // Structured fallback
    return {
      body: ctx.imageDescription,
      fullCaption: ctx.imageDescription,
      characterCount: ctx.imageDescription.length,
    };
  }
}
