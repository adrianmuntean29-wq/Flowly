# Stripe Integration Setup Guide

## Overview
This guide explains how to set up Stripe for Flowly payment processing.

## Step 1: Create Stripe Account

1. Go to https://stripe.com
2. Click "Sign Up"
3. Enter email and create account
4. Verify email

## Step 2: Get API Keys

1. Log in to Stripe Dashboard
2. Go to **Developers** → **API Keys** (left sidebar)
3. You'll see 2 sections:
   - **Publishable Key** (starts with `pk_test_` or `pk_live_`)
   - **Secret Key** (starts with `sk_test_` or `sk_live_`)

**For Testing (Development):**
- Use **Test Mode** (toggle at top right)
- Copy test keys

**Example:**
```
STRIPE_PUBLISHABLE_KEY=pk_test_51234567890abcdefghijklmnop
STRIPE_SECRET_KEY=sk_test_51234567890abcdefghijklmnop
```

Add to `.env.local`:
```
STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
STRIPE_SECRET_KEY=sk_test_xxxxx
```

## Step 3: Create Products & Prices

### Pro Plan ($29.99/month)

1. Go to **Products** (left sidebar)
2. Click **+ Add Product**
3. Fill in:
   - **Name:** Flowly Pro
   - **Description:** 200 posts per month
   - **Type:** Service
4. Click **Add product**
5. Scroll to **Pricing** → Click **+ Add price**
6. Set:
   - **Price:** $29.99
   - **Billing period:** Monthly
   - **Recurring:** Yes
7. Click **Save price**
8. Copy the **Price ID** (starts with `price_`)

Save to `.env.local`:
```
STRIPE_PRICE_PRO=price_xxxxx
```

### Enterprise Plan ($99.99/month)

Repeat above steps with:
- **Name:** Flowly Enterprise
- **Description:** Unlimited posts per month
- **Price:** $99.99/month

Save to `.env.local`:
```
STRIPE_PRICE_ENTERPRISE=price_xxxxx
```

## Step 4: Set Up Webhooks

Webhooks allow Stripe to notify your app of payment events.

1. Go to **Developers** → **Webhooks** (left sidebar)
2. Click **+ Add endpoint**
3. Enter endpoint URL:
   ```
   https://yourdomain.com/api/subscription/webhook
   ```
   
   **For Local Testing:**
   - Use Stripe CLI (see below) or
   - Use ngrok: `ngrok http 3000` then use `https://your-ngrok-url.ngrok.io/api/subscription/webhook`

4. Select events:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`

5. Click **Add events**
6. Click **Add endpoint**
7. Click on the endpoint → Reveal **Signing secret** (starts with `whsec_`)

Add to `.env.local`:
```
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
```

## Step 5: Test Locally with Stripe CLI

### Install Stripe CLI

**Windows:**
```powershell
# Using Chocolatey
choco install stripe

# Or download from https://github.com/stripe/stripe-cli/releases
```

### Login to Stripe CLI
```powershell
stripe login
```

### Forward Webhooks to Local Server
```powershell
stripe listen --forward-to localhost:3000/api/subscription/webhook
```

This will output:
```
Your webhook signing secret is: whsec_xxxxx
```

Update `.env.local` with this secret.

### Test Payment Flow
In another terminal:
```powershell
# Trigger test webhook
stripe trigger payment_intent.succeeded
```

## Step 6: Configure Frontend

The pricing page is at `/pricing` and already configured.

### Test Stripe Integration

1. Start dev server:
```powershell
npm run dev
```

2. Visit `http://localhost:3000/pricing`
3. Click "Upgrade to Pro" or "Upgrade to Enterprise"
4. Use Stripe **test card**:
   - Card: `4242 4242 4242 4242`
   - Expiry: Any future date (e.g., `12/25`)
   - CVC: Any 3 digits (e.g., `123`)
   - ZIP: Any value

5. Complete payment → Check dashboard/billing

## Step 7: Production Setup

### Switch to Live Keys

1. In Stripe Dashboard, toggle **Live mode** (top right)
2. Copy live keys:
   - `pk_live_xxxxx`
   - `sk_live_xxxxx`

3. Update `.env.local` with live keys
4. Get live product prices:
   - Create products in live mode (same steps as above)
   - Copy live price IDs

5. Create live webhook endpoint (same as test)

### Update Environment Variables

```
# Production
STRIPE_PUBLISHABLE_KEY=pk_live_xxxxx
STRIPE_SECRET_KEY=sk_live_xxxxx
STRIPE_PRICE_PRO=price_xxxxx
STRIPE_PRICE_ENTERPRISE=price_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

## Testing Scenarios

### Successful Payment
- Card: `4242 4242 4242 4242`
- Result: Payment succeeds

### Declined Payment
- Card: `4000 0000 0000 0002`
- Result: Payment declined

### SCA/3D Secure
- Card: `4000 0025 0000 3155`
- Result: Requires authentication

## Troubleshooting

### Webhook Not Firing
- Make sure webhook endpoint is public (not localhost)
- Check webhook signing secret in `.env.local`
- Verify events are selected

### Payment Not Appearing in DB
- Check webhook handler in `/api/subscription/webhook/route.ts`
- Verify metadata is being passed correctly
- Check Stripe logs for errors

### Test Card Not Working
- Card must be full valid number (4242 4242 4242 4242)
- Expiry must be in future
- CVC any 3 digits

## Security Checklist

- [ ] Never commit API keys to git
- [ ] Store keys in `.env.local` (local only)
- [ ] Use environment variables in production
- [ ] Verify webhook signatures on backend
- [ ] Never expose secret key on frontend
- [ ] Use published key only in frontend

## Useful Links

- Stripe Dashboard: https://dashboard.stripe.com
- API Documentation: https://stripe.com/docs
- Testing Cards: https://stripe.com/docs/testing
- Webhook Events: https://stripe.com/docs/api/events

---

Once complete, your Flowly app will be ready to process real payments! 💰
