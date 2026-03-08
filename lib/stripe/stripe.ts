import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-02-24.acacia',
});

export const SUBSCRIPTION_PRICES = {
  FREE: {
    name: 'Free',
    price: 0,
    posts_per_month: 20,
    priceId: '', // No price for free tier
  },
  PRO: {
    name: 'Pro',
    price: 2999, // $29.99 in cents
    posts_per_month: 200,
    priceId: process.env.STRIPE_PRICE_PRO || '', // Set after creating in Stripe dashboard
  },
  ENTERPRISE: {
    name: 'Enterprise',
    price: 9999, // $99.99 in cents
    posts_per_month: -1, // unlimited
    priceId: process.env.STRIPE_PRICE_ENTERPRISE || '', // Set after creating in Stripe dashboard
  },
};

export async function createOrGetStripeCustomer(email: string, userId: string) {
  // In production, check if customer exists
  const customers = await stripe.customers.list({
    email,
    limit: 1,
  });

  if (customers.data.length > 0) {
    return customers.data[0].id;
  }

  // Create new customer
  const customer = await stripe.customers.create({
    email,
    metadata: {
      userId,
    },
  });

  return customer.id;
}

export async function createCheckoutSession(
  email: string,
  plan: 'PRO' | 'ENTERPRISE',
  userId: string,
  appUrl: string
) {
  const priceId = SUBSCRIPTION_PRICES[plan].priceId;

  if (!priceId) {
    throw new Error(`Price ID for ${plan} not configured`);
  }

  const customerId = await createOrGetStripeCustomer(email, userId);

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: `${appUrl}/dashboard/billing?status=success`,
    cancel_url: `${appUrl}/dashboard/billing?status=cancelled`,
    metadata: {
      userId,
      plan,
    },
  });

  return session;
}

export async function cancelSubscription(subscriptionId: string) {
  const subscription = await stripe.subscriptions.cancel(subscriptionId);
  return subscription;
}

export async function getSubscriptionStatus(subscriptionId: string) {
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  return subscription;
}

export async function handleStripeWebhook(event: any) {
  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
      return handleSubscriptionChange(event.data.object, 'updated');

    case 'customer.subscription.deleted':
      return handleSubscriptionChange(event.data.object, 'cancelled');

    case 'invoice.payment_succeeded':
      return handlePaymentSucceeded(event.data.object);

    case 'invoice.payment_failed':
      return handlePaymentFailed(event.data.object);

    default:
      return null;
  }
}

async function handleSubscriptionChange(
  subscription: any,
  action: 'updated' | 'cancelled'
) {
  const userId = subscription.metadata?.userId;
  if (!userId) return;

  // This will be handled in the webhook endpoint
  // We'll update user subscription status in DB
  return { userId, action, subscription };
}

async function handlePaymentSucceeded(invoice: any) {
  const userId = invoice.metadata?.userId;
  if (!userId) return;

  return { userId, status: 'success', invoice };
}

async function handlePaymentFailed(invoice: any) {
  const userId = invoice.metadata?.userId;
  if (!userId) return;

  return { userId, status: 'failed', invoice };
}

export function verifyWebhookSignature(
  body: string,
  signature: string,
  secret: string
) {
  try {
    return stripe.webhooks.constructEvent(body, signature, secret);
  } catch (error) {
    throw error;
  }
}
