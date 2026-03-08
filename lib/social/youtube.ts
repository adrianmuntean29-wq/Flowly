// ============================================================================
// YOUTUBE OAuth helpers
// Uses Google OAuth 2.0 + YouTube Data API v3
// Docs: https://developers.google.com/youtube/v3/guides/auth/server-side-web-apps
// ============================================================================

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL!;

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';

// Scopes needed for YouTube publishing
const YOUTUBE_SCOPES = [
  'openid',
  'profile',
  'email',
  'https://www.googleapis.com/auth/youtube',
  'https://www.googleapis.com/auth/youtube.upload',
].join(' ');

/**
 * Returns the Google OAuth authorization URL for YouTube.
 */
export function getYouTubeAuthUrl(state: string): string {
  const redirectUri = `${APP_URL}/api/social/callback/youtube`;
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: YOUTUBE_SCOPES,
    state,
    access_type: 'offline',   // get refresh_token
    prompt: 'consent',        // always ask so we get refresh_token
  });
  return `${GOOGLE_AUTH_URL}?${params}`;
}

/**
 * Exchanges an authorization code for Google access + refresh tokens.
 */
export async function exchangeYouTubeCode(code: string): Promise<{
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
}> {
  const redirectUri = `${APP_URL}/api/social/callback/youtube`;

  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  });

  const data = await res.json();
  if (data.error) {
    throw new Error(data.error_description || data.error || 'YouTube token exchange failed');
  }
  return data;
}

/**
 * Gets the YouTube channel info for the authenticated user.
 * Returns channel id and custom URL / display name.
 */
export async function getYouTubeUserInfo(
  accessToken: string
): Promise<{ accountId: string; username: string }> {
  const res = await fetch(
    `${YOUTUBE_API_BASE}/channels?part=snippet,id&mine=true`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
      },
    }
  );

  const data = await res.json();

  if (data.error) {
    throw new Error(data.error.message || 'Failed to fetch YouTube channel info');
  }

  if (!data.items || data.items.length === 0) {
    // Fallback: get Google profile info
    const profileRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const profile = await profileRes.json();
    if (profile.error) throw new Error('No YouTube channel found for this Google account');
    return {
      accountId: profile.id || 'unknown',
      username: profile.name || profile.email || 'YouTube User',
    };
  }

  const channel = data.items[0];
  const channelId = channel.id;
  const displayName =
    channel.snippet?.customUrl
      ? `@${channel.snippet.customUrl.replace(/^@/, '')}`
      : channel.snippet?.title || 'YouTube Channel';

  return {
    accountId: channelId,
    username: displayName,
  };
}

/**
 * Refreshes an expired YouTube access token using the refresh token.
 */
export async function refreshYouTubeToken(refreshToken: string): Promise<{
  access_token: string;
  expires_in: number;
}> {
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  const data = await res.json();
  if (data.error) {
    throw new Error(data.error_description || data.error || 'YouTube token refresh failed');
  }
  return data;
}
