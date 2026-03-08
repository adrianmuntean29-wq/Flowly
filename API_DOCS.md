# Flowly API Documentation

Complete API reference for Flowly backend.

## Base URL

```
http://localhost:3000/api
```

## Authentication

All authenticated endpoints require JWT token in header:

```
Authorization: Bearer {token}
```

Get token from `/auth/login` or `/auth/register`

## Error Responses

```json
{
  "error": "Error message",
  "status": 400
}
```

Common status codes:
- `200` - Success
- `201` - Created
- `400` - Bad request
- `401` - Unauthorized
- `404` - Not found
- `429` - Rate limited
- `500` - Server error

---

## 🔐 Authentication

### Register

```
POST /auth/register
```

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securepassword",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response:**
```json
{
  "token": "eyJhbGc...",
  "user": {
    "id": "user_123",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe"
  }
}
```

### Login

```
POST /auth/login
```

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

**Response:**
```json
{
  "token": "eyJhbGc...",
  "user": {
    "id": "user_123",
    "email": "user@example.com",
    "subscriptionPlan": "PRO"
  }
}
```

---

## 📝 Posts

### List Posts

```
GET /posts?status=DRAFT&limit=20&offset=0
```

**Query Parameters:**
- `status` (optional) - Filter by status: DRAFT, SCHEDULED, PUBLISHED
- `limit` - Results per page (default: 20)
- `offset` - Pagination offset (default: 0)

**Response:**
```json
{
  "posts": [
    {
      "id": "post_123",
      "userId": "user_123",
      "type": "POST",
      "title": "My Post",
      "content": "Post content",
      "images": ["url1", "url2"],
      "status": "DRAFT",
      "scheduledAt": "2026-02-17T10:00:00Z",
      "createdAt": "2026-02-16T10:00:00Z"
    }
  ],
  "total": 5,
  "offset": 0,
  "limit": 20
}
```

### Create Post

```
POST /posts
```

**Request:**
```json
{
  "type": "POST",
  "title": "My First Post",
  "content": "This is my post content",
  "images": ["https://..."],
  "videoUrl": "https://...",
  "platforms": ["instagram", "facebook"],
  "status": "DRAFT",
  "scheduledAt": "2026-02-17T10:00:00Z"
}
```

**Response:** Returns created post object

### Get Post

```
GET /posts/{id}
```

**Response:** Returns single post object

### Update Post

```
PUT /posts/{id}
```

**Request:** (any fields to update)
```json
{
  "title": "Updated Title",
  "content": "Updated content",
  "status": "SCHEDULED",
  "scheduledAt": "2026-02-17T10:00:00Z"
}
```

**Response:** Returns updated post

### Delete Post

```
DELETE /posts/{id}
```

**Response:**
```json
{
  "success": true
}
```

---

## ✨ Content Generation

### Generate Content

```
POST /generate/content
```

**Request:**
```json
{
  "prompt": "Create an Instagram post about healthy coffee habits",
  "postType": "POST",
  "tone": "Inspirational",
  "generateImage": true,
  "style": "Modern"
}
```

**Parameters:**
- `prompt` (required) - What to generate
- `postType` (required) - POST, CAROUSEL, REEL, VIDEO, or AD
- `tone` (optional) - Professional, Casual, Funny, Inspirational, Educational
- `generateImage` (optional) - Whether to generate Midjourney prompt
- `style` (optional) - Image style preference

**Response:**
```json
{
  "content": "Generated post content here...",
  "imagePrompt": "A detailed Midjourney prompt for image...",
  "postType": "POST",
  "message": "Content generated successfully"
}
```

**Notes:**
- Respects subscription limits
- Returns 429 if limit exceeded
- Content is not auto-saved

---

## 🎨 Templates

### List Templates

```
GET /templates?type=POST
```

**Query Parameters:**
- `type` (optional) - Filter by POST, CAROUSEL, REEL, VIDEO, AD

**Response:**
```json
[
  {
    "id": "template_123",
    "name": "Instagram Promo Post",
    "type": "POST",
    "description": "Template for promotional posts",
    "content": "🎉 {{title}}\n\n{{description}}\n\nDon't miss out!",
    "isPublic": true,
    "usageCount": 45,
    "createdAt": "2026-02-16T10:00:00Z"
  }
]
```

### Create Template

```
POST /templates
```

**Request:**
```json
{
  "name": "My Custom Template",
  "type": "POST",
  "description": "A template for...",
  "content": "Template content with {{placeholders}}",
  "imageTemplate": "https://...",
  "isPublic": false
}
```

**Response:** Returns created template

---

## 👤 User Profile

### Get Profile

```
GET /user/profile
```

**Response:**
```json
{
  "id": "user_123",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "avatar": "https://...",
  "language": "en",
  "subscriptionPlan": "PRO",
  "subscriptionStart": "2026-02-01T00:00:00Z",
  "subscriptionEnd": "2026-03-01T00:00:00Z",
  "brandName": "My Brand",
  "brandColors": {
    "primary": "#667eea",
    "secondary": "#764ba2",
    "accent": "#fbbf24"
  }
}
```

### Update Profile

```
PUT /user/profile
```

**Request:** (any fields to update)
```json
{
  "firstName": "Jane",
  "language": "ro",
  "brandName": "Updated Brand",
  "brandColors": {
    "primary": "#3b82f6",
    "secondary": "#1e40af",
    "accent": "#fbbf24"
  }
}
```

**Response:** Returns updated profile

---

## 💳 Subscription

### Get Billing Info

```
GET /subscription/billing
```

**Response:**
```json
{
  "id": "user_123",
  "email": "user@example.com",
  "subscriptionPlan": "PRO",
  "subscriptionStart": "2026-02-01T00:00:00Z",
  "subscriptionEnd": "2026-03-01T00:00:00Z",
  "stripeSubscriptionId": "sub_123abc",
  "payments": [
    {
      "id": "payment_123",
      "amount": 2999,
      "currency": "usd",
      "status": "COMPLETED",
      "plan": "PRO",
      "createdAt": "2026-02-01T00:00:00Z"
    }
  ]
}
```

### Create Checkout Session

```
POST /subscription/checkout
```

**Request:**
```json
{
  "plan": "PRO"
}
```

**Response:**
```json
{
  "sessionId": "cs_test_a1234b5678",
  "url": "https://checkout.stripe.com/..."
}
```

Redirect user to `url` to complete payment.

### Cancel Subscription

```
POST /subscription/billing
```

**Response:**
```json
{
  "success": true,
  "message": "Subscription cancelled"
}
```

Plan reverts to FREE at period end.

---

## 🪝 Webhooks

### Stripe Webhook

```
POST /subscription/webhook
```

Automatically handles:
- Subscription created/updated
- Subscription cancelled
- Payment succeeded/failed

**Headers:**
```
stripe-signature: t=timestamp,v1=signature
```

Stripe CLI forwards webhooks to this endpoint during development.

---

## Rate Limiting

Not implemented in MVP, but recommended limits:

- **Auth endpoints:** 5 req/min per IP
- **Generation:** 10 req/min per user
- **Other:** 100 req/min per user

---

## Pagination

List endpoints support pagination:

```
GET /posts?limit=20&offset=0
```

**Response:**
```json
{
  "items": [...],
  "total": 100,
  "limit": 20,
  "offset": 0
}
```

---

## Examples

### Generate and Create Post

```bash
# 1. Generate content
curl -X POST http://localhost:3000/api/generate/content \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Create Instagram content",
    "postType": "POST",
    "tone": "Casual"
  }'

# Response:
# {
#   "content": "Amazing content...",
#   "imagePrompt": "Detailed prompt..."
# }

# 2. Create post with generated content
curl -X POST http://localhost:3000/api/posts \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "POST",
    "content": "Amazing content...",
    "platforms": ["instagram"],
    "status": "DRAFT"
  }'
```

### Upgrade to Pro

```bash
# 1. Create checkout session
curl -X POST http://localhost:3000/api/subscription/checkout \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{ "plan": "PRO" }'

# Response:
# {
#   "sessionId": "cs_test_...",
#   "url": "https://checkout.stripe.com/..."
# }

# 2. Redirect user to url
# 3. After payment, user gets PRO plan
```

---

## Best Practices

1. **Always use HTTPS** in production
2. **Validate inputs** on frontend and backend
3. **Store JWT in httpOnly cookies** (currently in localStorage)
4. **Refresh tokens** periodically
5. **Monitor rate limits** to avoid 429 errors
6. **Use pagination** for large lists

---

**API Version:** 1.0.0  
**Last Updated:** February 2026
