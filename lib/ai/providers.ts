// ============================================================================
// AI PROVIDER ROUTER
// Routes generation requests through the user's own API keys.
// Falls back to free providers where available.
// ============================================================================

import { prisma } from '@/lib/db/prisma';
import { decryptToken } from '@/lib/social/tokens';

// ─── Provider definitions ─────────────────────────────────────────────────

export const AI_PROVIDERS = {
  // Text providers
  anthropic: {
    name: 'Claude (Anthropic)',
    type: 'text' as const,
    models: ['claude-sonnet-4-6', 'claude-haiku-4-5-20251001'],
    defaultModel: 'claude-sonnet-4-6',
    hasFreeOption: false,
    keyFormat: /^sk-ant-/,
    getKeyUrl: 'https://console.anthropic.com/account/keys',
  },
  openai: {
    name: 'GPT-4o (OpenAI)',
    type: 'text' as const,
    models: ['gpt-4o', 'gpt-4o-mini'],
    defaultModel: 'gpt-4o-mini',
    hasFreeOption: false,
    keyFormat: /^sk-/,
    getKeyUrl: 'https://platform.openai.com/api-keys',
  },
  gemini: {
    name: 'Gemini Flash (Google)',
    type: 'text' as const,
    models: ['gemini-1.5-flash-latest', 'gemini-1.5-pro-latest'],
    defaultModel: 'gemini-1.5-flash-latest',
    hasFreeOption: true, // 15 req/min free
    keyFormat: /^AIza/,
    getKeyUrl: 'https://aistudio.google.com/app/apikey',
  },
  groq: {
    name: 'Llama 3 (Groq)',
    type: 'text' as const,
    models: ['llama-3.1-70b-versatile', 'llama-3.1-8b-instant'],
    defaultModel: 'llama-3.1-70b-versatile',
    hasFreeOption: true, // 6000 tokens/min free
    keyFormat: /^gsk_/,
    getKeyUrl: 'https://console.groq.com/keys',
  },
  // Image providers
  stability: {
    name: 'Stable Diffusion (Stability AI)',
    type: 'image' as const,
    models: ['stable-diffusion-xl-1024-v1-0'],
    defaultModel: 'stable-diffusion-xl-1024-v1-0',
    hasFreeOption: false,
    keyFormat: /^sk-/,
    getKeyUrl: 'https://platform.stability.ai/account/keys',
  },
  replicate: {
    name: 'FLUX / SDXL (Replicate)',
    type: 'image' as const,
    models: ['black-forest-labs/flux-1.1-pro', 'stability-ai/sdxl'],
    defaultModel: 'black-forest-labs/flux-1.1-pro',
    hasFreeOption: false,
    keyFormat: /^r8_/,
    getKeyUrl: 'https://replicate.com/account/api-tokens',
  },
  pollinations: {
    name: 'Pollinations AI (Free)',
    type: 'image' as const,
    models: ['flux', 'turbo'],
    defaultModel: 'flux',
    hasFreeOption: true, // 100% free, no key
    keyFormat: null, // no key needed
    getKeyUrl: null,
  },
} as const;

export type ProviderName = keyof typeof AI_PROVIDERS;

// ─── Get decrypted API key for a provider ────────────────────────────────

export async function getUserApiKey(
  userId: string,
  provider: ProviderName
): Promise<string | null> {
  const keyRecord = await prisma.userApiKey.findFirst({
    where: { userId, provider, isActive: true },
    orderBy: { lastUsed: 'desc' },
  });

  if (!keyRecord) return null;

  try {
    const decrypted = decryptToken(keyRecord.encryptedKey);
    // Update last used (fire and forget)
    prisma.userApiKey.update({
      where: { id: keyRecord.id },
      data: { lastUsed: new Date(), usageCount: { increment: 1 } },
    }).catch(() => {});
    return decrypted;
  } catch {
    return null;
  }
}

// ─── Get the best available text provider for a user ─────────────────────

export type TextProvider = 'anthropic' | 'openai' | 'gemini' | 'groq';

export async function getBestTextProvider(userId: string): Promise<{
  provider: TextProvider;
  apiKey: string;
  model: string;
} | null> {
  // Priority order: Claude → GPT-4o → Gemini → Groq
  const textProviders: TextProvider[] = ['anthropic', 'openai', 'gemini', 'groq'];

  for (const provider of textProviders) {
    const key = await getUserApiKey(userId, provider);
    if (key) {
      return {
        provider,
        apiKey: key,
        model: AI_PROVIDERS[provider].defaultModel,
      };
    }
  }

  // Check platform-level fallback (Anthropic key from .env)
  const platformKey = process.env.ANTHROPIC_API_KEY;
  if (platformKey) {
    return { provider: 'anthropic', apiKey: platformKey, model: 'claude-sonnet-4-6' };
  }

  return null;
}

// ─── Get the best available image provider for a user ────────────────────

export type ImageProvider = 'pollinations' | 'stability' | 'replicate' | 'openai';

export async function getBestImageProvider(userId: string): Promise<{
  provider: ImageProvider;
  apiKey: string | null;
  model: string;
}> {
  // Check user's paid providers first
  const imageProviders: Array<'stability' | 'replicate'> = ['stability', 'replicate'];

  for (const provider of imageProviders) {
    const key = await getUserApiKey(userId, provider);
    if (key) {
      return {
        provider,
        apiKey: key,
        model: AI_PROVIDERS[provider].defaultModel,
      };
    }
  }

  // Check for OpenAI key (DALL-E 3)
  const openaiKey = await getUserApiKey(userId, 'openai');
  if (openaiKey) {
    return { provider: 'openai', apiKey: openaiKey, model: 'dall-e-3' };
  }

  // Free fallback: Pollinations.ai (no key needed)
  return { provider: 'pollinations', apiKey: null, model: 'flux' };
}
