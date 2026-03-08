// ============================================================================
// LINKEDIN OAuth helpers
// Uses LinkedIn API v2 with OAuth 2.0
// Docs: https://learn.microsoft.com/en-us/linkedin/shared/authentication/authorization-code-flow
// ============================================================================

const LINKEDIN_CLIENT_ID = process.env.LINKEDIN_CLIENT_ID!;
const LINKEDIN_CLIENT_SECRET = process.env.LINKEDIN_CLIENT_SECRET!;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL!;

const LINKEDIN_AUTH_BASE = 'https://www.linkedin.com/oauth/v2/authorization';
const LINKEDIN_TOKEN_URL = 'https://www.linkedin.com/oauth/v2/accessToken';
const LINKEDIN_PROFILE_URL = 'https://api.linkedin.com/v2/userinfo';

// Scopes for LinkedIn
const LINKEDIN_SCOPES = ['openid', 'profile', 'email', 'w_member_social'].join(' ');

/**
 * Returns the LinkedIn OAuth authorization URL.
 */
export function getLinkedInAuthUrl(state: string): string {
  const redirectUri = `${APP_URL}/api/social/callback/linkedin`;
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: LINKEDIN_CLIENT_ID,
    redirect_uri: redirectUri,
    state,
    scope: LINKEDIN_SCOPES,
  });
  return `${LINKEDIN_AUTH_BASE}?${params}`;
}

/**
 * Exchanges an authorization code for a LinkedIn access token.
 */
export async function exchangeLinkedInCode(code: string): Promise<{
  access_token: string;
  expires_in: number;
  refresh_token?: string;
}> {
  const redirectUri = `${APP_URL}/api/social/callback/linkedin`;

  const res = await fetch(LINKEDIN_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      client_id: LINKEDIN_CLIENT_ID,
      client_secret: LINKEDIN_CLIENT_SECRET,
    }),
  });

  const data = await res.json();
  if (data.error) {
    throw new Error(data.error_description || data.error || 'LinkedIn token exchange failed');
  }
  return data;
}

/**
 * Gets the LinkedIn user's profile (sub = id, name, email).
 */
export async function getLinkedInUserInfo(
  accessToken: string
): Promise<{ accountId: string; username: string }> {
  const res = await fetch(LINKEDIN_PROFILE_URL, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const data = await res.json();
  if (data.error) {
    throw new Error(data.error_description || 'Failed to fetch LinkedIn profile');
  }

  return {
    accountId: data.sub,
    username: data.name || data.email || 'LinkedIn User',
  };
}
