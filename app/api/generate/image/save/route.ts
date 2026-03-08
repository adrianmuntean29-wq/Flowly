// ============================================================================
// API: POST /api/generate/image/save
// Downloads a generated image (e.g. from Pollinations URL) and saves it
// to the user's uploads folder so it appears in the Library.
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/middleware';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

function uploadDir(userId: string) {
  return join(process.cwd(), 'public', 'uploads', userId);
}

export async function POST(req: NextRequest) {
  const auth = await withAuth(req);
  if (auth.error) return auth.error;

  const userId = auth.user!.userId;

  try {
    const body = await req.json();
    const { url, prompt, width = 1024, height = 1024, provider = 'ai' } = body;

    if (!url) {
      return NextResponse.json({ error: 'url is required' }, { status: 400 });
    }

    // If it's already a local URL (saved before), return it as-is
    if (url.startsWith('/uploads/')) {
      return NextResponse.json({ url, saved: false, message: 'Already in library' });
    }

    // If it's a base64 data URL, decode directly
    if (url.startsWith('data:')) {
      const matches = url.match(/^data:([^;]+);base64,(.+)$/);
      if (!matches) {
        return NextResponse.json({ error: 'Invalid base64 data URL' }, { status: 400 });
      }
      const mimeType = matches[1];
      const base64Data = matches[2];
      const ext = mimeType.split('/')[1] || 'png';
      const filename = `${provider}-${Date.now()}.${ext}`;

      const dir = uploadDir(userId);
      if (!existsSync(dir)) await mkdir(dir, { recursive: true });

      await writeFile(join(dir, filename), Buffer.from(base64Data, 'base64'));
      const savedUrl = `/uploads/${userId}/${filename}`;
      return NextResponse.json({ url: savedUrl, saved: true, width, height, prompt });
    }

    // Otherwise fetch from external URL (Pollinations, Replicate, etc.)
    const response = await fetch(url, { signal: AbortSignal.timeout(30000) });
    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch image: ${response.statusText}` },
        { status: 502 }
      );
    }

    const contentType = response.headers.get('content-type') || 'image/png';
    const ext = contentType.includes('jpeg') || contentType.includes('jpg')
      ? 'jpg'
      : contentType.includes('webp')
      ? 'webp'
      : 'png';

    const buffer = Buffer.from(await response.arrayBuffer());
    const filename = `${provider}-${Date.now()}.${ext}`;

    const dir = uploadDir(userId);
    if (!existsSync(dir)) await mkdir(dir, { recursive: true });

    await writeFile(join(dir, filename), buffer);
    const savedUrl = `/uploads/${userId}/${filename}`;

    return NextResponse.json({
      url: savedUrl,
      saved: true,
      filename,
      width,
      height,
      prompt,
      provider,
    });

  } catch (err: any) {
    console.error('[generate/image/save]', err);
    return NextResponse.json(
      { error: err.message || 'Failed to save image' },
      { status: 500 }
    );
  }
}
