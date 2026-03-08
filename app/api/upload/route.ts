import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/middleware';
import { writeFile, mkdir, readdir, stat, unlink } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

const MAX_SIZE = 100 * 1024 * 1024; // 100 MB
const ALLOWED_TYPES: Record<string, 'image' | 'video'> = {
  'image/jpeg': 'image',
  'image/jpg': 'image',
  'image/png': 'image',
  'image/gif': 'image',
  'image/webp': 'image',
  'video/mp4': 'video',
  'video/webm': 'video',
  'video/quicktime': 'video',
};

function uploadDir(userId: string) {
  return join(process.cwd(), 'public', 'uploads', userId);
}

// POST — upload a file
export async function POST(request: NextRequest) {
  const auth = await withAuth(request);
  if (auth.error) return auth.error;

  const userId = auth.user!.userId;

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'File too large (max 100 MB)' }, { status: 400 });
    }

    const mediaType = ALLOWED_TYPES[file.type];
    if (!mediaType) {
      return NextResponse.json(
        { error: 'Tip de fișier nepermis. Acceptăm: JPEG, PNG, GIF, WEBP, MP4, WEBM, MOV' },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const ext = file.name.split('.').pop()?.toLowerCase() || 'bin';
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const filename = `${Date.now()}-${safeName}`;

    const dir = uploadDir(userId);
    if (!existsSync(dir)) {
      await mkdir(dir, { recursive: true });
    }

    await writeFile(join(dir, filename), buffer);

    return NextResponse.json({
      url: `/uploads/${userId}/${filename}`,
      filename,
      originalName: file.name,
      type: mediaType,
      size: file.size,
      mimeType: file.type,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}

// GET — list user's uploaded files
export async function GET(request: NextRequest) {
  const auth = await withAuth(request);
  if (auth.error) return auth.error;

  const userId = auth.user!.userId;

  try {
    const dir = uploadDir(userId);
    if (!existsSync(dir)) {
      return NextResponse.json({ files: [] });
    }

    const names = await readdir(dir);
    const files = await Promise.all(
      names.map(async (filename) => {
        const stats = await stat(join(dir, filename));
        const ext = filename.split('.').pop()?.toLowerCase() || '';
        const type: 'image' | 'video' = ['mp4', 'webm', 'mov', 'avi'].includes(ext) ? 'video' : 'image';
        return {
          url: `/uploads/${userId}/${filename}`,
          filename,
          type,
          size: stats.size,
          createdAt: stats.birthtime.toISOString(),
        };
      })
    );

    files.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({ files });
  } catch (error) {
    console.error('List media error:', error);
    return NextResponse.json({ error: 'Failed to list files' }, { status: 500 });
  }
}

// DELETE — remove a file
export async function DELETE(request: NextRequest) {
  const auth = await withAuth(request);
  if (auth.error) return auth.error;

  const userId = auth.user!.userId;

  try {
    const { filename } = await request.json();

    // Sanitize: no path traversal
    if (!filename || filename.includes('/') || filename.includes('\\') || filename.includes('..')) {
      return NextResponse.json({ error: 'Invalid filename' }, { status: 400 });
    }

    const filepath = join(uploadDir(userId), filename);
    if (!existsSync(filepath)) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    await unlink(filepath);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete file error:', error);
    return NextResponse.json({ error: 'Failed to delete file' }, { status: 500 });
  }
}
