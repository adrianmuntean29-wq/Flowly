import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/middleware';
import { prisma } from '@/lib/db/prisma';
import Stripe from 'stripe';

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2025-02-24.acacia',
  });
}

// GET - Get user's billing info
export async function GET(request: NextRequest) {
  const auth = await withAuth(request);
  if (auth.error) return auth.error;

  try {
    const user = await prisma.user.findUnique({
      where: { id: auth.user!.userId },
      select: {
        id: true,
        email: true,
        subscriptionPlan: true,
        subscriptionStart: true,
        subscriptionEnd: true,
        stripeSubscriptionId: true,
        payments: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
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
    console.error('Get billing error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch billing info' },
      { status: 500 }
    );
  }
}

// POST - Cancel subscription
export async function POST(request: NextRequest) {
  const auth = await withAuth(request);
  if (auth.error) return auth.error;

  try {
    const user = await prisma.user.findUnique({
      where: { id: auth.user!.userId },
    });

    if (!user?.stripeSubscriptionId) {
      return NextResponse.json(
        { error: 'No active subscription' },
        { status: 404 }
      );
    }

    // Cancel Stripe subscription
    await getStripe().subscriptions.cancel(user.stripeSubscriptionId);

    // Update user in DB
    await prisma.user.update({
      where: { id: auth.user!.userId },
      data: {
        subscriptionPlan: 'FREE',
        stripeSubscriptionId: null,
      },
    });

    return NextResponse.json({ success: true, message: 'Subscription cancelled' });
  } catch (error: any) {
    console.error('Cancel subscription error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to cancel subscription' },
      { status: 500 }
    );
  }
}
