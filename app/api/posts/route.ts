import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/middleware';
import { prisma } from '@/lib/db/prisma';

// GET - List all posts for a user
export async function GET(request: NextRequest) {
  const auth = await withAuth(request);
  if (auth.error) return auth.error;

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    const where: any = { userId: auth.user!.userId };
    if (status) where.status = status;

    const posts = await prisma.post.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    const total = await prisma.post.count({ where });

    return NextResponse.json({
      posts,
      total,
      offset,
      limit,
    });
  } catch (error) {
    console.error('Get posts error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch posts' },
      { status: 500 }
    );
  }
}

// POST - Create a new post
export async function POST(request: NextRequest) {
  const auth = await withAuth(request);
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const { type, content, caption, platforms, status, scheduledAt } = body;
    const captionText = caption || content || '';

    // Validate
    if (!type || !captionText) {
      return NextResponse.json(
        { error: 'Type and content are required' },
        { status: 400 }
      );
    }

    const post = await prisma.post.create({
      data: {
        userId: auth.user!.userId,
        type,
        caption: captionText,
        platforms: platforms || [],
        status: status || 'DRAFT',
        scheduledFor: scheduledAt ? new Date(scheduledAt) : null,
      },
    });

    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    console.error('Create post error:', error);
    return NextResponse.json(
      { error: 'Failed to create post' },
      { status: 500 }
    );
  }
}
