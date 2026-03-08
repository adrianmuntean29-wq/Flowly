# Flowly - AI Social Media Manager 🚀

Generate stunning social media content with AI. Post to Instagram, TikTok, Facebook, and LinkedIn.

## ✨ Features

### MVP (v1.0 - Current)
- ✅ **AI Content Generation** - Generate posts, carousels, reels, videos, ads with Claude
- ✅ **Template System** - Browse and create reusable templates  
- ✅ **User Authentication** - Email/password login with JWT tokens
- ✅ **Dashboard** - Stats, content management, scheduling
- ✅ **Post Management** - Create, edit, delete posts (DRAFT, SCHEDULED, PUBLISHED)
- ✅ **Brand Kit** - Customize colors and branding
- ✅ **Multi-language** - EN, RO, DE, FR
- ✅ **Subscription Plans** - FREE (20/mo), PRO (200/mo), ENTERPRISE (unlimited)
- ✅ **Stripe Integration** - Payment processing & billing

### Coming Phase 2
- 📅 Content scheduler
- 📊 Analytics 
- 🔗 Social media OAuth
- 📧 Notifications
- 💾 AWS S3

## 🛠️ Tech Stack

- **Frontend:** Next.js 16 + React 19 + TypeScript
- **Backend:** API Routes + Node.js
- **Database:** PostgreSQL + Prisma
- **AI:** Claude (Anthropic)
- **Payments:** Stripe
- **Auth:** JWT

## 🚀 Quick Start

### 1. Install

```bash
npm install
```

### 2. Environment Setup

```bash
# Copy and fill in your keys
cp .env.local.example .env.local
```

Required:
```
ANTHROPIC_API_KEY=sk-ant-xxxxx
DATABASE_URL=postgresql://...
JWT_SECRET=your-secret
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Database

```bash
# Start PostgreSQL
docker run --name flowly-db -e POSTGRES_PASSWORD=password -e POSTGRES_DB=flowly_db -p 5432:5432 -d postgres:15

# Initialize
npx prisma migrate dev --name init
```

### 4. Run

```bash

```

Visit http://localhost:3000

## 📚 Guides

- **[SETUP_GUIDE.md](./SETUP_GUIDE.md)** - Detailed environment & database setup
- **[STRIPE_SETUP.md](./STRIPE_SETUP.md)** - Payment processing guide
- **[API_DOCS.md](./API_DOCS.md)** - API endpoints reference

## 📁 Structure

```
app/
├── auth/              # Login/Register
├── dashboard/         # Main app
│  ├── generate/      # AI content
│  ├── posts/         # Post CRUD
│  ├── templates/     # Templates
│  ├── billing/       # Subscriptions
│  └── settings/      # Profile
├── pricing/          # Pricing page
└── api/              # Backend routes

lib/
├── ai/              # Claude integration
├── auth/            # JWT & auth
├── db/              # Prisma
├── hooks/           # React hooks
└── stripe/          # Stripe utils
```

## 💰 Plans

| Feature | Free | Pro | Enterprise |
|---------|------|-----|-----------|
| Posts/Month | 20 | 200 | Unlimited |
| Price | $0 | $29.99 | $99.99 |
| Templates | 5 | ∞ | ∞ |
| Support | Community | Priority | Dedicated |

## 🔐 Auth

- Register: `POST /api/auth/register`
- Login: `POST /api/auth/login`
- JWT tokens stored in localStorage

## 🤖 AI Generation

```javascript
POST /api/generate/content
{
  prompt: "Create an Instagram post...",
  postType: "POST|CAROUSEL|REEL|VIDEO|AD",
  tone: "Professional|Casual|Funny|etc",
  generateImage: true,
  style: "Modern|Minimalist|etc"
}
```

## 💳 Stripe Testing

Test card: `4242 4242 4242 4242`
- Expiry: Any future date
- CVC: Any 3 digits

Full guide: [STRIPE_SETUP.md](./STRIPE_SETUP.md)

## 📊 Dashboard Pages

- **Dashboard** - Overview & stats
- **Generate** - AI content creation
- **Posts** - Manage all posts
- **Templates** - Browse/create templates
- **Billing** - Subscription & payments
- **Settings** - Profile & brand kit

## 🔗 API Endpoints

### Auth
- `POST /api/auth/register` - Sign up
- `POST /api/auth/login` - Sign in

### Posts  
- `GET /api/posts` - List posts
- `POST /api/posts` - Create post
- `GET /api/posts/:id` - Get post
- `PUT /api/posts/:id` - Update post
- `DELETE /api/posts/:id` - Delete post

### Generation
- `POST /api/generate/content` - Generate AI content

### Templates
- `GET /api/templates` - List templates
- `POST /api/templates` - Create template

### Billing
- `GET /api/subscription/billing` - Get billing info
- `POST /api/subscription/checkout` - Create checkout
- `POST /api/subscription/billing` - Cancel subscription
- `POST /api/subscription/webhook` - Stripe webhooks

## 📝 Requirements

- Node.js 18+
- PostgreSQL 12+
- Anthropic API key
- Stripe account (for payments)

## 🚦 Getting Help

1. Check [SETUP_GUIDE.md](./SETUP_GUIDE.md) for setup issues
2. Check [STRIPE_SETUP.md](./STRIPE_SETUP.md) for payment issues
3. GitHub Issues for bugs

## 📄 License

MIT - Use freely!

## 🎉 Status

**MVP v1.0.0** - February 2026
Ready for testing and feedback!

---

Made with ❤️ by Flowly Team
