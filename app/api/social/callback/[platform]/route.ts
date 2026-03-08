// ============================================================================
// API: /api/social/callback/[platform]
// OAuth callback handler — exchanges code for token, saves to DB, redirects.
// This is the URL you register in each platform's developer console.
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { verifyOAuthState } from '@/lib/social/state';
import { encryptToken } from '@/lib/social/tokens';
import {
  exchangeMetaCode,
  getLongLivedToken,
  getFacebookUserInfo,
  getInstagramUserInfo,
} from '@/lib/social/meta';
import { exchangeTikTokCode, getTikTokUserInfo } from '@/lib/social/tiktok';
import { exchangeLinkedInCode, getLinkedInUserInfo } from '@/lib/social/linkedin';
import { exchangeYouTubeCode, getYouTubeUserInfo } from '@/lib/social/youtube';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL!;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ platform: string }> }
) {
  const { platform } = await params;
  const searchParams = req.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  const redirectBase = `${APP_URL}/dashboard/social`;

  // 1. Handle user denial
  if (error) {
    const errorDesc = searchParams.get('error_description') || error;
    console.warn(`[social/callback/${platform}] User denied access:`, errorDesc);
    return NextResponse.redirect(`${redirectBase}?error=${encodeURIComponent('Connection cancelled')}`);
  }

  // 2. Validate state
  if (!state) {
    return NextResponse.redirect(`${redirectBase}?error=${encodeURIComponent('Invalid state parameter')}`);
  }
  const stateData = verifyOAuthState(state);
  if (!stateData) {
    return NextResponse.redirect(`${redirectBase}?error=${encodeURIComponent('OAuth state expired or invalid. Please try again.')}`);
  }
  const { userId } = stateData;

  // 3. Validate code
  if (!code) {
    return NextResponse.redirect(`${redirectBase}?error=${encodeURIComponent('No authorization code received')}`);
  }

  try {
    let accountId: string;
    let username: string;
    let accessToken: string;
    let refreshToken: string | undefined;
    let expiresAt: Date | undefined;

    // 4. Exchange code for token based on platform
    switch (platform) {
      case 'facebook': {
        const shortToken = await exchangeMetaCode(code, 'facebook');
        // Exchange for long-lived token (60 days)
        const longToken = await getLongLivedToken(shortToken.access_token);
        accessToken = longToken.access_token;
        expiresAt = new Date(Date.now() + longToken.expires_in * 1000);
        const fbUser = await getFacebookUserInfo(accessToken);
        accountId = fbUser.accountId;
        username = fbUser.username;
        break;
      }

      case 'instagram': {
        const shortToken = await exchangeMetaCode(code, 'instagram');
        const longToken = await getLongLivedToken(shortToken.access_token);
        accessToken = longToken.access_token;
        expiresAt = new Date(Date.now() + longToken.expires_in * 1000);
        const igUser = await getInstagramUserInfo(accessToken);
        accountId = igUser.accountId;
        username = igUser.username;
        // Store the page access token as refresh token for IG publishing
        refreshToken = igUser.pageAccessToken;
        break;
      }

      case 'tiktok': {
        const tokens = await exchangeTikTokCode(code);
        accessToken = tokens.access_token;
        refreshToken = tokens.refresh_token;
        expiresAt = new Date(Date.now() + tokens.expires_in * 1000);
        const ttUser = await getTikTokUserInfo(accessToken, tokens.open_id);
        accountId = ttUser.accountId;
        username = ttUser.username;
        break;
      }

      case 'linkedin': {
        const tokens = await exchangeLinkedInCode(code);
        accessToken = tokens.access_token;
        refreshToken = tokens.refresh_token;
        expiresAt = tokens.expires_in
          ? new Date(Date.now() + tokens.expires_in * 1000)
          : undefined;
        const liUser = await getLinkedInUserInfo(accessToken);
        accountId = liUser.accountId;
        username = liUser.username;
        break;
      }

      case 'youtube': {
        const tokens = await exchangeYouTubeCode(code);
        accessToken = tokens.access_token;
        refreshToken = tokens.refresh_token;
        expiresAt = new Date(Date.now() + tokens.expires_in * 1000);
        const ytUser = await getYouTubeUserInfo(accessToken);
        accountId = ytUser.accountId;
        username = ytUser.username;
        break;
      }

      default:
        return NextResponse.redirect(`${redirectBase}?error=${encodeURIComponent('Unsupported platform')}`);
    }

    // 5. Encrypt tokens before storing
    const encryptedAccessToken = encryptToken(accessToken);
    const encryptedRefreshToken = refreshToken ? encryptToken(refreshToken) : undefined;

    // 6. Upsert SocialAccount (one account per user+platform+accountId)
    await prisma.socialAccount.upsert({
      where: {
        userId_platform_accountId: {
          userId,
          platform,
          accountId,
        },
      },
      create: {
        userId,
        platform,
        accountId,
        username,
        accessToken: encryptedAccessToken,
        refreshToken: encryptedRefreshToken,
        isConnected: true,
        expiresAt,
      },
      update: {
        username,
        accessToken: encryptedAccessToken,
        refreshToken: encryptedRefreshToken,
        isConnected: true,
        expiresAt,
        connectedAt: new Date(),
      },
    });

    // 7. Redirect back to social page with success
    const platformName = platform.charAt(0).toUpperCase() + platform.slice(1);
    return NextResponse.redirect(
      `${redirectBase}?success=${encodeURIComponent(`${platformName} connected as ${username}`)}`
    );

  } catch (err: any) {
    console.error(`[social/callback/${platform}]`, err);
    return NextResponse.redirect(
      `${redirectBase}?error=${encodeURIComponent(err.message || 'Connection failed. Please try again.')}`
    );
  }
}
