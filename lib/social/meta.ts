// ============================================================================
// META (Facebook + Instagram) OAuth helpers
// Uses Meta Graph API v18.0
// Docs: https://developers.facebook.com/docs/facebook-login/guides/advanced/manual-flow
// ============================================================================

const META_APP_ID = process.env.FACEBOOK_APP_ID!;
const META_APP_SECRET = process.env.FACEBOOK_APP_SECRET!;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL!;
const GRAPH_API = 'https://graph.facebook.com/v18.0';

// Scopes for each platform
const SCOPES = {
  facebook: [
    'pages_manage_posts',
    'pages_read_engagement',
    'pages_show_list',
    'publish_to_groups',
    'public_profile',
  ],
  instagram: [
    'instagram_basic',
    'instagram_content_publish',
    'pages_read_engagement',
    'pages_show_list',
    'public_profile',
  ],
};

/**
 * Returns the Meta OAuth dialog URL for Facebook or Instagram.
 * Both use Facebook Login (Meta Business Login) — Instagram business requires a FB page.
 */
export function getMetaAuthUrl(platform: 'facebook' | 'instagram', state: string): string {
  const redirectUri = `${APP_URL}/api/social/callback/${platform}`;
  const scopes = SCOPES[platform].join(',');
  const params = new URLSearchParams({
    client_id: META_APP_ID,
    redirect_uri: redirectUri,
    state,
    scope: scopes,
    response_type: 'code',
  });
  return `https://www.facebook.com/v18.0/dialog/oauth?${params}`;
}

/**
 * Exchanges a short-lived code for an access token.
 */
export async function exchangeMetaCode(
  code: string,
  platform: 'facebook' | 'instagram'
): Promise<{ access_token: string; token_type: string }> {
  const redirectUri = `${APP_URL}/api/social/callback/${platform}`;
  const url = new URL(`${GRAPH_API}/oauth/access_token`);
  url.searchParams.set('client_id', META_APP_ID);
  url.searchParams.set('client_secret', META_APP_SECRET);
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('code', code);

  const res = await fetch(url.toString());
  const data = await res.json();
  if (data.error) throw new Error(data.error.message || 'Meta auth failed');
  return data;
}

/**
 * Exchanges a short-lived token for a long-lived token (60 days).
 */
export async function getLongLivedToken(shortToken: string): Promise<{
  access_token: string;
  expires_in: number;
}> {
  const url = new URL(`${GRAPH_API}/oauth/access_token`);
  url.searchParams.set('grant_type', 'fb_exchange_token');
  url.searchParams.set('client_id', META_APP_ID);
  url.searchParams.set('client_secret', META_APP_SECRET);
  url.searchParams.set('fb_exchange_token', shortToken);

  const res = await fetch(url.toString());
  const data = await res.json();
  if (data.error) throw new Error(data.error.message || 'Long-lived token exchange failed');
  return data;
}

/**
 * Gets the Facebook user's profile (id + name).
 */
export async function getFacebookUserInfo(
  accessToken: string
): Promise<{ accountId: string; username: string }> {
  const res = await fetch(`${GRAPH_API}/me?fields=id,name&access_token=${accessToken}`);
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return { accountId: data.id, username: data.name };
}

/**
 * Gets the connected Instagram Business account info via a Facebook Page.
 * Requires pages_show_list + instagram_basic scopes.
 */
export async function getInstagramUserInfo(
  accessToken: string
): Promise<{ accountId: string; username: string; pageAccessToken: string }> {
  // Step 1: Get the user's Facebook Pages
  const pagesRes = await fetch(
    `${GRAPH_API}/me/accounts?access_token=${accessToken}`
  );
  const pagesData = await pagesRes.json();
  if (pagesData.error) throw new Error(pagesData.error.message);
  if (!pagesData.data || pagesData.data.length === 0) {
    throw new Error(
      'No Facebook Pages found. Connect a Facebook Page with an Instagram Business account.'
    );
  }

  // Step 2: Find the page with an Instagram Business account
  for (const page of pagesData.data) {
    const igRes = await fetch(
      `${GRAPH_API}/${page.id}?fields=instagram_business_account&access_token=${page.access_token}`
    );
    const igData = await igRes.json();
    if (igData.instagram_business_account?.id) {
      const igAccountId = igData.instagram_business_account.id;
      // Step 3: Get Instagram username
      const igInfoRes = await fetch(
        `${GRAPH_API}/${igAccountId}?fields=id,username&access_token=${page.access_token}`
      );
      const igInfo = await igInfoRes.json();
      if (igInfo.error) throw new Error(igInfo.error.message);
      return {
        accountId: igInfo.id,
        username: `@${igInfo.username}`,
        pageAccessToken: page.access_token,
      };
    }
  }

  throw new Error(
    'No Instagram Business account found. Make sure your Instagram is a Business or Creator account linked to a Facebook Page.'
  );
}
