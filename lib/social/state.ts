// ============================================================================
// OAUTH STATE — HMAC-signed state parameter for OAuth flows
// Prevents CSRF and encodes userId so we know who to save tokens for
// ============================================================================

import crypto from 'crypto';

const STATE_TTL_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Generate a signed OAuth state parameter containing the userId.
 * Format: base64url({ payload: JSON, hmac: hex })
 */
export function generateOAuthState(userId: string): string {
  const payload = JSON.stringify({ userId, ts: Date.now() });
  const hmac = crypto
    .createHmac('sha256', process.env.JWT_SECRET!)
    .update(payload)
    .digest('hex');
  return Buffer.from(JSON.stringify({ payload, hmac })).toString('base64url');
}

/**
 * Verify and decode an OAuth state parameter.
 * Returns userId or null if invalid/expired.
 */
export function verifyOAuthState(state: string): { userId: string } | null {
  try {
    const decoded = Buffer.from(state, 'base64url').toString('utf8');
    const { payload, hmac } = JSON.parse(decoded);

    // Verify HMAC
    const expectedHmac = crypto
      .createHmac('sha256', process.env.JWT_SECRET!)
      .update(payload)
      .digest('hex');
    if (!crypto.timingSafeEqual(Buffer.from(hmac, 'hex'), Buffer.from(expectedHmac, 'hex'))) {
      return null;
    }

    // Check TTL
    const data = JSON.parse(payload);
    if (Date.now() - data.ts > STATE_TTL_MS) return null;

    return { userId: data.userId };
  } catch {
    return null;
  }
}
