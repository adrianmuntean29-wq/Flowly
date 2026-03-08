// ============================================================================
// API: /api/user/api-keys
// GET  — list all user's API keys (masked)
// POST — add a new API key
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/middleware';
import { prisma } from '@/lib/db/prisma';
import { encryptToken, decryptToken } from '@/lib/social/tokens';
import { AI_PROVIDERS, ProviderName } from '@/lib/ai/providers';

// Mask a key for display: sk-ant-api03-abc...xyz → sk-ant-...xyz
function maskKey(decryptedKey: string): string {
  if (decryptedKey.length <= 12) return '***';
  return decryptedKey.slice(0, 8) + '...' + decryptedKey.slice(-4);
}

// ─── GET — list keys ──────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const auth = await withAuth(req);
  if (auth.error) return auth.error;

  const keys = await prisma.userApiKey.findMany({
    where: { userId: auth.user!.userId },
    select: {
      id: true,
      provider: true,
      label: true,
      encryptedKey: true,
      isActive: true,
      isValid: true,
      lastUsed: true,
      usageCount: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  // Return masked keys only — never expose decrypted key
  const maskedKeys = keys.map((k) => {
    let masked = '***';
    try {
      masked = maskKey(decryptToken(k.encryptedKey));
    } catch {}
    return { ...k, encryptedKey: undefined, maskedKey: masked };
  });

  return NextResponse.json({ keys: maskedKeys });
}

// ─── POST — add key ───────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const auth = await withAuth(req);
  if (auth.error) return auth.error;

  const body = await req.json();
  const { provider, apiKey, label } = body;

  if (!provider || !apiKey) {
    return NextResponse.json({ error: 'provider and apiKey are required' }, { status: 400 });
  }

  const isCustomProvider = typeof provider === 'string' && provider.startsWith('custom_');
  const isKnownProvider = provider in AI_PROVIDERS;

  if (!isKnownProvider && !isCustomProvider) {
    return NextResponse.json(
      { error: `Unknown provider. Use a supported provider or prefix custom ones with "custom_"` },
      { status: 400 }
    );
  }

  let validationResult: { valid: boolean; error?: string } = { valid: true };
  let keyLabel: string;

  if (isCustomProvider) {
    // Custom providers: skip format validation and remote API validation
    keyLabel = label || provider.replace('custom_', '').replace(/_/g, ' ');
  } else {
    const providerInfo = AI_PROVIDERS[provider as ProviderName];

    // Basic format validation
    if (providerInfo.keyFormat && !providerInfo.keyFormat.test(apiKey)) {
      return NextResponse.json(
        { error: `Invalid key format for ${providerInfo.name}` },
        { status: 400 }
      );
    }

    // Validate the key by making a lightweight API call
    validationResult = await validateApiKey(provider as ProviderName, apiKey);
    keyLabel = label || providerInfo.name;
  }

  const encryptedKey = encryptToken(apiKey);

  // Upsert: if same provider+label exists, update it
  const record = await prisma.userApiKey.upsert({
    where: {
      userId_provider_label: {
        userId: auth.user!.userId,
        provider,
        label: keyLabel,
      },
    },
    create: {
      userId: auth.user!.userId,
      provider,
      label: keyLabel,
      encryptedKey,
      isActive: true,
      isValid: isCustomProvider ? null : validationResult.valid,
    },
    update: {
      encryptedKey,
      isActive: true,
      isValid: isCustomProvider ? null : validationResult.valid,
    },
  });

  if (!validationResult.valid) {
    return NextResponse.json(
      {
        warning: `Key saved but validation failed: ${validationResult.error}. Check that the key is correct.`,
        key: { id: record.id, provider, label: keyLabel, isValid: false },
      },
      { status: 201 }
    );
  }

  const displayName = isCustomProvider
    ? keyLabel
    : AI_PROVIDERS[provider as ProviderName].name;

  return NextResponse.json(
    {
      message: `${displayName} key added successfully`,
      key: { id: record.id, provider, label: keyLabel, isValid: true },
    },
    { status: 201 }
  );
}

// ─── Key validation ───────────────────────────────────────────────────────

async function validateApiKey(
  provider: ProviderName,
  apiKey: string
): Promise<{ valid: boolean; error?: string }> {
  try {
    switch (provider) {
      case 'anthropic': {
        const res = await fetch('https://api.anthropic.com/v1/models', {
          headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
        });
        return res.ok || res.status === 200
          ? { valid: true }
          : { valid: false, error: 'Invalid Anthropic API key' };
      }

      case 'openai': {
        const res = await fetch('https://api.openai.com/v1/models', {
          headers: { Authorization: `Bearer ${apiKey}` },
        });
        return res.ok ? { valid: true } : { valid: false, error: 'Invalid OpenAI API key' };
      }

      case 'gemini': {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
        );
        return res.ok ? { valid: true } : { valid: false, error: 'Invalid Gemini API key' };
      }

      case 'groq': {
        const res = await fetch('https://api.groq.com/openai/v1/models', {
          headers: { Authorization: `Bearer ${apiKey}` },
        });
        return res.ok ? { valid: true } : { valid: false, error: 'Invalid Groq API key' };
      }

      case 'stability': {
        const res = await fetch('https://api.stability.ai/v1/user/account', {
          headers: { Authorization: `Bearer ${apiKey}` },
        });
        return res.ok ? { valid: true } : { valid: false, error: 'Invalid Stability AI key' };
      }

      case 'replicate': {
        const res = await fetch('https://api.replicate.com/v1/account', {
          headers: { Authorization: `Bearer ${apiKey}` },
        });
        return res.ok ? { valid: true } : { valid: false, error: 'Invalid Replicate key' };
      }

      default:
        return { valid: true }; // Can't validate unknown providers
    }
  } catch (err: any) {
    return { valid: false, error: `Validation network error: ${err.message}` };
  }
}
