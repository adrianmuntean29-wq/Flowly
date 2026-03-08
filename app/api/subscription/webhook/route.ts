export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { verifyWebhookSignature, handleStripeWebhook } from '@/lib/stripe/stripe';

export async function POST(request: NextRequest) {
  const signature = request.headers.get('stripe-signature');
  const body = await request.text();

  if (!signature) {
    return NextResponse.json(
      { error: 'Missing signature' },
      { status: 400 }
    );
  }

  try {
    const event = verifyWebhookSignature(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET || ''
    );

    // Handle subscription events
    if (event.type === 'customer.subscription.updated') {
      const subscription = event.data.object as any;
      const userId = subscription.metadata?.userId;

      if (userId) {
        // Map Stripe status to our plans
        const planMapping: any = {
          active: { 'PRO': 'PRO', 'ENTERPRISE': 'ENTERPRISE' },
        };

        if (subscription.status === 'active') {
          const items = subscription.items.data;
          let planType = 'FREE';

          // Determine plan from price ID or items
          items.forEach((item: any) => {
            const priceId = item.price.id;
            // You should map price IDs from your environment
            // For now, we'll update based on metadata
            if (subscription.metadata?.plan) {
              planType = subscription.metadata.plan;
            }
          });

          await prisma.user.update({
            where: { id: userId },
            data: {
              subscriptionPlan: planType as any,
              stripeSubscriptionId: subscription.id,
              subscriptionStart: new Date(subscription.current_period_start * 1000),
              subscriptionEnd: new Date(subscription.current_period_end * 1000),
            },
          });

          // Record payment
          if (subscription.latest_invoice) {
            await prisma.payment.create({
              data: {
                userId,
                stripePaymentId: subscription.id,
                amount: subscription.items.data[0].price.unit_amount,
                status: 'COMPLETED',
                plan: planType as any,
              },
            });
          }
        }
      }
    }

    // Handle subscription cancellation
    if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object as any;
      const userId = subscription.metadata?.userId;

      if (userId) {
        await prisma.user.update({
          where: { id: userId },
          data: {
            subscriptionPlan: 'FREE',
            stripeSubscriptionId: null,
          },
        });
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    );
  }
}
