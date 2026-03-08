// ============================================================================
// API: /api/social/connect/[platform]
// Initiates the OAuth flow for a given platform.
// Client calls this with Authorization header → receives { authUrl }
// Then client does: window.location.href = authUrl
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/middleware';
import { generateOAuthState } from '@/lib/social/state';
import { getMetaAuthUrl } from '@/lib/social/meta';
import { getTikTokAuthUrl } from '@/lib/social/tiktok';
import { getLinkedInAuthUrl } from '@/lib/social/linkedin';
import { getYouTubeAuthUrl } from '@/lib/social/youtube';

const SUPPORTED_PLATFORMS = ['facebook', 'instagram', 'tiktok', 'linkedin', 'youtube'];

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ platform: string }> }
) {
  // 1. Authenticate user
  const auth = await withAuth(req);
  if (auth.error) return auth.error;

  const { platform } = await params;

  // 2. Validate platform
  if (!SUPPORTED_PLATFORMS.includes(platform)) {
    return NextResponse.json(
      { error: `Platform "${platform}" is not supported. Supported: ${SUPPORTED_PLATFORMS.join(', ')}` },
      { status: 400 }
    );
  }

  // 3. Generate signed state (contains userId for the callback)
  const state = generateOAuthState(auth.user!.userId);

  // 4. Build the OAuth URL for the requested platform
  let authUrl: string;
  try {
    switch (platform) {
      case 'facebook':
        authUrl = getMetaAuthUrl('facebook', state);
        break;
      case 'instagram':
        authUrl = getMetaAuthUrl('instagram', state);
        break;
      case 'tiktok':
        authUrl = getTikTokAuthUrl(state);
        break;
      case 'linkedin':
        authUrl = getLinkedInAuthUrl(state);
        break;
      case 'youtube':
        authUrl = getYouTubeAuthUrl(state);
        break;
      default:
        return NextResponse.json({ error: 'Unknown platform' }, { status: 400 });
    }
  } catch (err: any) {
    // If env vars are missing (e.g., FACEBOOK_APP_ID not set)
    console.error(`[social/connect/${platform}]`, err.message);
    return NextResponse.json(
      { error: `OAuth not configured for ${platform}. Add the required API keys to .env.local.` },
      { status: 503 }
    );
  }

  // 5. Return the URL — client will redirect
  return NextResponse.json({ authUrl, platform });
}
