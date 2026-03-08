// ============================================================================
// TIKTOK OAuth helpers
// Uses TikTok for Developers API v2
// Docs: https://developers.tiktok.com/doc/oauth-user-access-token-management
// ============================================================================

const TIKTOK_CLIENT_KEY = process.env.TIKTOK_CLIENT_KEY!;
const TIKTOK_CLIENT_SECRET = process.env.TIKTOK_CLIENT_SECRET!;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL!;

const TIKTOK_AUTH_BASE = 'https://www.tiktok.com/v2/auth/authorize';
const TIKTOK_TOKEN_URL = 'https://open.tiktokapis.com/v2/oauth/token/';
const TIKTOK_USER_URL = 'https://open.tiktokapis.com/v2/user/info/';

// Scopes needed for TikTok
const TIKTOK_SCOPES = [
  'user.info.basic',
  'user.info.profile',
  'video.list',
  'video.upload',
].join(',');

/**
 * Returns the TikTok OAuth authorization URL.
 */
export function getTikTokAuthUrl(state: string): string {
  const redirectUri = `${APP_URL}/api/social/callback/tiktok`;
  const params = new URLSearchParams({
    client_key: TIKTOK_CLIENT_KEY,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: TIKTOK_SCOPES,
    state,
  });
  return `${TIKTOK_AUTH_BASE}?${params}`;
}

/**
 * Exchanges an authorization code for TikTok access + refresh tokens.
 */
export async function exchangeTikTokCode(code: string): Promise<{
  access_token: string;
  open_id: string;
  refresh_token: string;
  expires_in: number;
  refresh_expires_in: number;
}> {
  const redirectUri = `${APP_URL}/api/social/callback/tiktok`;

  const res = await fetch(TIKTOK_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Cache-Control': 'no-cache',
    },
    body: new URLSearchParams({
      client_key: TIKTOK_CLIENT_KEY,
      client_secret: TIKTOK_CLIENT_SECRET,
      code,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
    }),
  });

  const data = await res.json();
  if (data.error) {
    throw new Error(data.error_description || data.error || 'TikTok token exchange failed');
  }
  return data;
}

/**
 * Gets the TikTok user's profile (open_id + display_name/username).
 */
export async function getTikTokUserInfo(
  accessToken: string,
  openId: string
): Promise<{ accountId: string; username: string }> {
  const res = await fetch(
    `${TIKTOK_USER_URL}?fields=open_id,display_name,username,avatar_url`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  const data = await res.json();
  if (data.error?.code && data.error.code !== 'ok') {
    throw new Error(data.error.message || 'Failed to fetch TikTok user info');
  }

  const user = data.data?.user;
  const displayName = user?.username || user?.display_name || openId;

  return {
    accountId: openId,
    username: `@${displayName}`,
  };
}
