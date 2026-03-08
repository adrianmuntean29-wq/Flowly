import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, extractTokenFromHeader } from './jwt';

export async function withAuth(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const token = extractTokenFromHeader(authHeader ?? undefined);

  if (!token) {
    return {
      user: null,
      error: new NextResponse(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401 }
      ),
    };
  }

  const payload = verifyToken(token);
  if (!payload) {
    return {
      user: null,
      error: new NextResponse(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401 }
      ),
    };
  }

  return {
    user: payload,
    error: null,
  };
}
