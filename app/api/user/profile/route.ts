import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/middleware';
import { prisma } from '@/lib/db/prisma';

// GET - Get user profile
export async function GET(request: NextRequest) {
  const auth = await withAuth(request);
  if (auth.error) return auth.error;

  try {
    const user = await prisma.user.findUnique({
      where: { id: auth.user!.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        avatar: true,
        language: true,
        subscriptionPlan: true,
        subscriptionStart: true,
        subscriptionEnd: true,
        brandName: true,
        brandColors: true,
        brandFonts: true,
        brandLogo: true,
        onboardingCompleted: true,
        brandTone: true,
        brandIndustry: true,
        brandKeywords: true,
        brandVoiceExample: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Get profile error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}

// PUT - Update user profile
export async function PUT(request: NextRequest) {
  const auth = await withAuth(request);
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    
    // Only allow updating specific fields
    const allowedFields = [
      'firstName',
      'lastName',
      'avatar',
      'language',
      'brandName',
      'brandColors',
      'brandFonts',
      'brandLogo',
      'onboardingCompleted',
      'brandTone',
      'brandIndustry',
      'brandKeywords',
      'brandVoiceExample',
    ];

    const updateData: any = {};
    allowedFields.forEach((field) => {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    });

    const updated = await prisma.user.update({
      where: { id: auth.user!.userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        avatar: true,
        language: true,
        subscriptionPlan: true,
        brandName: true,
        brandColors: true,
        brandFonts: true,
        brandLogo: true,
        onboardingCompleted: true,
        brandTone: true,
        brandIndustry: true,
        brandKeywords: true,
        brandVoiceExample: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Update profile error:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}
