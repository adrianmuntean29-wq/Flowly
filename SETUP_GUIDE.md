# Flowly MVP - Setup Guide

## 1. Install Dependencies

```powershell
npm install
```

## 2. Configure Environment Variables

Replace placeholders in `.env.local` with your actual values:

### **Claude API**
1. Go to https://console.anthropic.com
2. Sign up / Login
3. Create API Key → Copy to `.env.local`:
```
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxx
```

### **PostgreSQL Database**

**Option A: Using Docker (Recommended for Development)**
```powershell
docker run --name flowly-db -e POSTGRES_PASSWORD=password -e POSTGRES_DB=flowly_db -p 5432:5432 -d postgres:15
```

**Option B: Local PostgreSQL**
1. Install PostgreSQL from https://www.postgresql.org/download/
2. Create database:
```sql
CREATE DATABASE flowly_db;
```

Update `.env.local`:
```
DATABASE_URL=postgresql://postgres:password@localhost:5432/flowly_db
```

### **JWT Secret**
Generate a secure random string:
```powershell
# Generate random secret
$secret = [Convert]::ToBase64String((1..32 | % { [byte](Get-Random -Max 256) }))
Write-Output "JWT_SECRET=$secret"
```

Paste in `.env.local`:
```
JWT_SECRET=your_generated_secret_here
```

### **Stripe (Payment) - Optional for MVP**
1. Create account: https://stripe.com
2. Get test keys from Dashboard → Developers → API Keys
3. Add to `.env.local`:
```
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
```

### **AWS S3 (Image/Video Storage) - Optional for MVP**
1. Create AWS account
2. Create S3 bucket: `flowly-content`
3. Get IAM credentials
4. Add to `.env.local`:
```
AWS_ACCESS_KEY_ID=xxxxx
AWS_SECRET_ACCESS_KEY=xxxxx
AWS_S3_BUCKET_NAME=flowly-content
AWS_REGION=eu-west-1
```

### **Social Media OAuth - Optional for Phase 2**
Leave placeholders for now:
```
INSTAGRAM_APP_ID=your_instagram_app_id
INSTAGRAM_APP_SECRET=your_instagram_app_secret
TIKTOK_CLIENT_KEY=your_tiktok_client_key
TIKTOK_CLIENT_SECRET=your_tiktok_client_secret
FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_APP_SECRET=your_facebook_app_secret
LINKEDIN_CLIENT_ID=your_linkedin_client_id
LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret
```

## 3. Initialize Database

```powershell
npx prisma migrate dev --name init
```

This creates all tables based on the Prisma schema.

## 4. Start Development Server

```powershell
npm run dev
```

Visit `http://localhost:3000`

## 5. Test the Application

### Register
1. Go to `/auth/register`
2. Create an account
3. You'll be redirected to dashboard

### Generate Content
1. Click "Generate Content"
2. Enter a prompt (e.g., "Create an Instagram post about healthy coffee")
3. Select post type, tone, etc.
4. Click "Generate Content" → Claude will generate text + Midjourney prompt

### Manage Posts
1. Click "My Posts" to view all your posts
2. Filter by DRAFT, SCHEDULED, PUBLISHED
3. Edit or delete posts

### Browse Templates
1. Click "Templates"
2. Browse pre-made templates by type
3. Create your own templates

### Settings
1. Click "Settings"
2. Update profile info, language, brand kit colors
3. Save changes

## 6. Next Steps (Phase 2)

- [ ] Stripe integration for subscription payments
- [ ] OAuth for social media posting
- [ ] Content scheduler/calendar
- [ ] Analytics dashboard
- [ ] Email notifications
- [ ] Multi-language support finalization
- [ ] AWS S3 file uploads
- [ ] Content caching & rate limiting

## Troubleshooting

### Port 3000 already in use
```powershell
npm run dev -- -p 3001
```

### Database connection error
Check `.env.local` - make sure PostgreSQL is running:
```powershell
# For Docker:
docker ps  # Should show flowly-db running
```

### Prisma migration errors
Reset database:
```powershell
npx prisma migrate reset
```

## API Documentation

### Authentication
- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Login

### Posts
- `GET /api/posts` - List user posts
- `POST /api/posts` - Create post
- `GET /api/posts/{id}` - Get post
- `PUT /api/posts/{id}` - Update post
- `DELETE /api/posts/{id}` - Delete post

### Content Generation
- `POST /api/generate/content` - Generate with AI

### Templates
- `GET /api/templates` - List templates
- `POST /api/templates` - Create template

### User Profile
- `GET /api/user/profile` - Get profile
- `PUT /api/user/profile` - Update profile

---

**MVP Status: ✅ Ready for testing**

Current features working:
- ✅ User authentication (register/login)
- ✅ AI content generation (Claude)
- ✅ Post management (CRUD)
- ✅ Templates system
- ✅ Dashboard with stats
- ✅ Brand kit customization
- ✅ Multi-language support (EN, RO, DE, FR)
- ✅ Subscription plan limits (FREE/PRO/ENTERPRISE)

Coming Next:
- Stripe integration
- Social media OAuth
- Content scheduler
- Analytics
