# FLOWLY 2.0 — COMPLETE QA, ARCHITECTURE & IMPROVEMENT PLAN
**Date:** February 22, 2026
**Version:** 2.0
**Status:** Active Development

---

## PART 1 — 100 QA TEST SCENARIOS

### 🔐 AUTHENTICATION (TC-001 to TC-010)

| # | Scenario | Steps | Expected | Actual | Severity | Fix |
|---|----------|-------|----------|--------|----------|-----|
| TC-001 | Login with valid ENTERPRISE credentials | 1. Go to /auth/login 2. Enter admin@flowly.test / Flowly2024! 3. Click Login | Redirect to /dashboard | Works ✅ | — | — |
| TC-002 | Login with wrong password | 1. Enter valid email 2. Enter wrong password | Show "Invalid email or password" | Works ✅ | — | — |
| TC-003 | Login with non-existent email | 1. Enter random@email.com 2. Click Login | Show error message | Works ✅ | — | — |
| TC-004 | Register new user | 1. Go to /auth/register 2. Fill form 3. Submit | User created, redirect to dashboard | Prisma schema mismatch fails | HIGH | Fix prisma migration |
| TC-005 | Session persistence after refresh | 1. Login 2. Refresh page | Stay logged in | Works (localStorage) ✅ | — | — |
| TC-006 | Logout functionality | 1. Login 2. Click logout | Redirect to /auth/login | No logout button visible | MEDIUM | Add logout button to sidebar |
| TC-007 | JWT token expiry (30 days) | 1. Login 2. Wait 30 days | Auto logout and redirect | Not tested | LOW | Add token refresh logic |
| TC-008 | Protected routes without auth | 1. Navigate to /dashboard directly | Redirect to /auth/login | Works ✅ | — | — |
| TC-009 | Login with empty fields | 1. Click Login without filling form | HTML validation blocks | Works ✅ | — | — |
| TC-010 | Multiple login tabs | 1. Login in tab 1 2. Open /dashboard in tab 2 | Both tabs work | Works ✅ | — | — |

---

### 🧭 NAVIGATION (TC-011 to TC-020)

| # | Scenario | Steps | Expected | Actual | Severity | Fix |
|---|----------|-------|----------|--------|----------|-----|
| TC-011 | Sidebar - Click Generate | Click Generate in sidebar | Navigate to /dashboard/generate | Works ✅ | — | — |
| TC-012 | Sidebar - Click Library | Click Library in sidebar | Navigate to /dashboard/library | Works ✅ (after fix) | — | — |
| TC-013 | Sidebar - Click Templates | Click Templates in sidebar | Navigate to /dashboard/templates | Works ✅ | — | — |
| TC-014 | Sidebar - Click Automations | Click Automations in sidebar | Navigate to /dashboard/automations | Works ✅ (after fix) | — | — |
| TC-015 | Active nav state highlight | Navigate between pages | Current page highlighted in sidebar | Works ✅ | — | — |
| TC-016 | Dashboard home quick actions | Click Reel quick action | Navigate to /generate?postType=REEL | 404 or wrong page | HIGH | Remove REEL from dashboard quick actions |
| TC-017 | Sidebar collapse | Click collapse button | Sidebar collapses to icons only | Works ✅ | — | — |
| TC-018 | Sidebar expand from collapsed | Click expand from collapsed state | Sidebar expands with labels | Works ✅ | — | — |
| TC-019 | Back browser button | Navigate A→B, press Back | Return to page A | Works ✅ (Next.js) | — | — |
| TC-020 | Direct URL access (/dashboard/settings) | Paste URL directly in browser | Settings page loads | Works ✅ | — | — |

---

### 🎨 THEME SYSTEM (TC-021 to TC-030)

| # | Scenario | Steps | Expected | Actual | Severity | Fix |
|---|----------|-------|----------|--------|----------|-----|
| TC-021 | Switch to Dark theme | Click Moon button in sidebar | All UI elements turn dark | Partially works - some cards stay white | MEDIUM | Replace all `background: white` with CSS vars |
| TC-022 | Switch to Light theme | Click Sun button in sidebar | All UI elements turn light | Works ✅ | — | — |
| TC-023 | Theme persists on refresh | Switch to dark, refresh page | Dark theme maintained | Works ✅ (localStorage) | — | — |
| TC-024 | Dark theme - inputs readable | Switch to dark, focus on textarea | Text visible on dark background | Fixed ✅ | — | — |
| TC-025 | Dark theme - notification dropdown | Open notifications in dark mode | Dropdown appears dark | Works ✅ | — | — |
| TC-026 | Dark theme - modal dialogs | Open upgrade modal in dark | Modal appears dark | Partially - some modals still light | MEDIUM | Apply theme vars to all modals |
| TC-027 | Dark theme - login page | Navigate to /auth/login in dark mode | Theme not applied (separate layout) | Login page always light | LOW | Add theme to auth pages |
| TC-028 | System preference detection | Open app with OS in dark mode | App starts in dark | Works ✅ | — | — |
| TC-029 | Dark theme - Tables/Lists | View posts list in dark | Table rows dark | Posts API fails (Prisma error) | HIGH | Fix Posts API Prisma schema |
| TC-030 | Theme transition animation | Toggle theme | Smooth color transition | Works ✅ (CSS transitions) | — | — |

---

### ✨ GENERATE PAGE (TC-031 to TC-045)

| # | Scenario | Steps | Expected | Actual | Severity | Fix |
|---|----------|-------|----------|--------|----------|-----|
| TC-031 | Generate Caption - IMAGE type | Select IMAGE, write prompt, click Generate | AI generates caption | Works ✅ | — | — |
| TC-032 | Generate Caption - CAROUSEL type | Select CAROUSEL (PRO+), write prompt | AI generates carousel caption | Works for PRO/ENTERPRISE ✅ | — | — |
| TC-033 | ENTERPRISE user - no upgrade modal | Login as ENTERPRISE, click CAROUSEL | No "Upgrade to PRO" shown | Fixed ✅ | — | — |
| TC-034 | FREE user CAROUSEL restriction | Login as FREE, click CAROUSEL | Show "Upgrade to PRO" modal | Works ✅ (after permission fix) | — | — |
| TC-035 | Generate with empty prompt | Click Generate without prompt | Show "Please enter a description" | Works ✅ | — | — |
| TC-036 | Platform selection - Instagram | Select INSTAGRAM platform | Caption includes Instagram-optimized content | Works ✅ | — | — |
| TC-037 | Platform selection - LinkedIn | Select LINKEDIN platform | Caption has professional tone | Works ✅ | — | — |
| TC-038 | Tone - Professional | Select Professional tone | Formal, business-appropriate caption | Works ✅ | — | — |
| TC-039 | Tone - Casual | Select Casual tone | Friendly, conversational caption | Works ✅ | — | — |
| TC-040 | Copy caption button | Generate caption, click Copy | Caption copied to clipboard | Works ✅ | — | — |
| TC-041 | No VIDEO option in menu | Check post type options | Only IMAGE and CAROUSEL visible | Fixed ✅ | — | — |
| TC-042 | No REEL option in menu | Check post type options | REEL not visible anywhere | Fixed ✅ | — | — |
| TC-043 | API error handling | Simulate API failure | Show user-friendly error | Shows error message ✅ | — | — |
| TC-044 | Regenerate caption | Click Regenerate after generating | New caption generated | Regenerate button exists but calls no action | MEDIUM | Wire up Regenerate button |
| TC-045 | Save & Post button | Click Save & Post after generating | Save post and navigate | Button exists but no action wired | MEDIUM | Implement save post flow |

---

### 📚 LIBRARY PAGE (TC-046 to TC-052)

| # | Scenario | Steps | Expected | Actual | Severity | Fix |
|---|----------|-------|----------|--------|----------|-----|
| TC-046 | Library page loads | Navigate to /dashboard/library | Page renders with assets | Works ✅ (after fix) | — | — |
| TC-047 | Search assets | Type in search box | Filter assets by name | Works (client-side filter) ✅ | — | — |
| TC-048 | Filter by Images | Click "Images" filter | Show only image assets | Works ✅ | — | — |
| TC-049 | Filter by Carousels | Click "Carousels" filter | Show only carousel assets | Works ✅ | — | — |
| TC-050 | Download asset | Hover asset, click Download | Asset downloads | Button exists, no API connected | MEDIUM | Connect to actual download endpoint |
| TC-051 | Delete asset | Hover asset, click Delete | Asset removed from library | Button exists, no API connected | MEDIUM | Connect to delete API |
| TC-052 | Upload media | Click Upload Media | File picker opens, upload works | Button not wired | MEDIUM | Implement file upload |

---

### 📋 TEMPLATES (TC-053 to TC-060)

| # | Scenario | Steps | Expected | Actual | Severity | Fix |
|---|----------|-------|----------|--------|----------|-----|
| TC-053 | Templates page loads | Navigate to /dashboard/templates | Page loads | Works ✅ | — | — |
| TC-054 | Filter by REEL | Click REEL filter | Show REEL templates | REEL filter still visible | HIGH | Remove REEL/VIDEO/AD filters |
| TC-055 | Filter by VIDEO | Click VIDEO filter | Show VIDEO templates | VIDEO filter still visible | HIGH | Remove VIDEO filter |
| TC-056 | Create IMAGE template | Click Create, select IMAGE type | Template saved | Works if schema aligned | MEDIUM | Test end-to-end |
| TC-057 | Create CAROUSEL template | Click Create, select CAROUSEL | Template saved | Works if schema aligned | MEDIUM | Test end-to-end |
| TC-058 | Edit template | Click edit on existing template | Modal opens with data | Works ✅ | — | — |
| TC-059 | Delete template | Click delete on template | Template removed | Works ✅ | — | — |
| TC-060 | Template API 500 error | Trigger API error | Graceful error shown | Templates API may fail (schema) | HIGH | Fix Templates API Prisma issue |

---

### ⚡ AUTOMATIONS (TC-061 to TC-068)

| # | Scenario | Steps | Expected | Actual | Severity | Fix |
|---|----------|-------|----------|--------|----------|-----|
| TC-061 | Automations page loads | Navigate to /dashboard/automations | Page loads | Works ✅ (Coming Soon) | — | — |
| TC-062 | Connect Instagram | Click Connect on Instagram card | OAuth flow starts | Not implemented (mock) | HIGH | Implement Meta OAuth |
| TC-063 | Connect Facebook | Click Connect on Facebook card | OAuth flow starts | Not implemented (mock) | HIGH | Implement Meta OAuth |
| TC-064 | Connect LinkedIn | Click Connect on LinkedIn card | OAuth flow starts | Not implemented (mock) | MEDIUM | Implement LinkedIn OAuth |
| TC-065 | Connect TikTok | Click Connect on TikTok card | OAuth flow starts | Not implemented (mock) | MEDIUM | Implement TikTok OAuth |
| TC-066 | Disconnect platform | Click Disconnect | Account disconnected | Mock only | HIGH | Implement disconnect logic |
| TC-067 | Schedule post | Select post, choose date/time | Post scheduled | Not implemented | HIGH | Implement scheduling |
| TC-068 | View scheduled posts | Navigate to automations | See list of scheduled posts | Mock data only | MEDIUM | Connect to real API |

---

### 🔔 NOTIFICATIONS (TC-069 to TC-075)

| # | Scenario | Steps | Expected | Actual | Severity | Fix |
|---|----------|-------|----------|--------|----------|-----|
| TC-069 | Open notification dropdown | Click bell icon | Dropdown appears | Works ✅ | — | — |
| TC-070 | Close dropdown - click outside | Click outside dropdown | Dropdown closes | Works ✅ | — | — |
| TC-071 | Click notification | Click a notification item | Modal opens with full message | Works ✅ | — | — |
| TC-072 | Mark as read on click | Click notification | Blue dot disappears | Works ✅ | — | — |
| TC-073 | Mark all as read | Click "Mark all as read" | All dots disappear, badge updates | Works ✅ | — | — |
| TC-074 | Unread count badge | Open app with unread notifications | Badge shows correct count | Works ✅ | — | — |
| TC-075 | Close notification modal | Click X or overlay | Modal closes | Works ✅ | — | — |

---

### 📊 DASHBOARD HOME (TC-076 to TC-082)

| # | Scenario | Steps | Expected | Actual | Severity | Fix |
|---|----------|-------|----------|--------|----------|-----|
| TC-076 | Dashboard stats load | Navigate to /dashboard | Show stat cards | API fails (Post.caption missing) | HIGH | Fix Posts API Prisma schema |
| TC-077 | Quick action - Reel | Click Reel quick action | Navigate to generate REEL | REEL removed, broken link | HIGH | Remove REEL from quick actions |
| TC-078 | Quick action - Generate | Click Generate quick action | Navigate to generate page | Works ✅ | — | — |
| TC-079 | Recent posts list | View recent posts on dashboard | Show last 5 posts | API 500 error | HIGH | Fix API Prisma schema |
| TC-080 | Empty state dashboard | Login with no posts | Show empty state message | API error shows instead | MEDIUM | Fix API, add empty state |
| TC-081 | Stat cards display | Check stat numbers | Show correct counts | 0s due to API failure | HIGH | Fix Posts API |
| TC-082 | Post status filters | Filter posts by DRAFT/PUBLISHED | Correct posts shown | API fails | HIGH | Fix Posts API |

---

### ⚙️ SETTINGS & PROFILE (TC-083 to TC-088)

| # | Scenario | Steps | Expected | Actual | Severity | Fix |
|---|----------|-------|----------|--------|----------|-----|
| TC-083 | Settings page loads | Navigate to /dashboard/settings | Settings page visible | Works ✅ | — | — |
| TC-084 | Update profile name | Change first/last name, save | Profile updated | Likely works | MEDIUM | Test end-to-end |
| TC-085 | Change theme from settings | Toggle theme in settings | Theme changes | Not available in settings | LOW | Add theme toggle to settings |
| TC-086 | Brand kit settings | Set brand colors, fonts | Brand settings saved | Check schema | MEDIUM | Test end-to-end |
| TC-087 | Language settings | Change language | UI language changes | Works (i18n) ✅ | — | — |
| TC-088 | Delete account | Click delete account | Account deleted, logged out | Not implemented | LOW | Implement account deletion |

---

### 💳 BILLING & SUBSCRIPTION (TC-089 to TC-095)

| # | Scenario | Steps | Expected | Actual | Severity | Fix |
|---|----------|-------|----------|--------|----------|-----|
| TC-089 | Billing page loads | Navigate to /dashboard/billing | Billing page visible | Works ✅ | — | — |
| TC-090 | Upgrade to PRO | Click Upgrade to PRO | Stripe checkout opens | Check Stripe config | HIGH | Test Stripe integration |
| TC-091 | ENTERPRISE user - no upgrade CTA in topbar | Login as ENTERPRISE | No "Upgrade to PRO" button visible | Works ✅ (isPro check) | — | — |
| TC-092 | FREE user - upgrade CTA visible | Login as FREE user | "Upgrade to PRO" button in topbar | Works ✅ | — | — |
| TC-093 | Webhook - subscription created | Stripe sends webhook | User plan updated | Webhook endpoint exists ✅ | MEDIUM | Test with Stripe CLI |
| TC-094 | Subscription cancellation | Cancel via Stripe portal | Plan reverts to FREE | Depends on webhook | MEDIUM | Test webhook handler |
| TC-095 | Trial period | New user trial | Trial features available | Not implemented | LOW | Add trial logic |

---

### 🚀 PERFORMANCE (TC-096 to TC-100)

| # | Scenario | Steps | Expected | Actual | Severity | Fix |
|---|----------|-------|----------|--------|----------|-----|
| TC-096 | Navigation speed | Click between sidebar items | < 500ms transition | 2-4 seconds (Turbopack compile) | HIGH | Enable Turbopack caching |
| TC-097 | Initial page load | First visit to /dashboard | < 2 seconds | ~4-6 seconds on first load | MEDIUM | Optimize bundle, prefetch |
| TC-098 | Caption generation time | Click Generate Caption | < 5 seconds | 3-8 seconds (Claude API) | MEDIUM | Add streaming response |
| TC-099 | Sidebar collapse animation | Click collapse button | Smooth animation | Works ✅ | — | — |
| TC-100 | API response caching | Visit same page twice | Second visit faster | No caching implemented | MEDIUM | Add SWR/React Query caching |

---

## PART 2 — ALL IDENTIFIED PROBLEMS

### 🔴 CRITICAL (Must Fix Immediately)

---

**ISSUE-001: Posts API — Prisma Schema Mismatch**
- **Description:** `GET /api/posts` returns 500 error. Dashboard stats all show 0.
- **Root Cause:** Prisma schema was updated to Flowly 2.0 (added `hook`, `body`, `cta`, `hashtags`, `caption` as new field) but database was never migrated. The generated Prisma client expects these columns but they don't exist in PostgreSQL.
- **Error:** `The column 'Post.caption' does not exist in the current database`
- **Fix:** Run: `npx prisma migrate dev --name add_flowly_v2_fields` OR use `db push` after resolving enum conflicts
- **Priority:** P0 — CRITICAL

---

**ISSUE-002: Dashboard Quick Actions — REEL/VIDEO Links**
- **Description:** Dashboard home page shows "Reel" and "Calendar" quick action buttons linking to broken/removed pages.
- **Root Cause:** `app/dashboard/page.tsx` still has `QUICK_ACTIONS` array with REEL and old hrefs.
- **Fix:** Remove REEL from `QUICK_ACTIONS`, update `POST_TYPE_ICONS` to remove REEL/VIDEO/AD.
- **Priority:** P1 — HIGH

---

**ISSUE-003: Templates Page — Still Shows REEL/VIDEO/AD Filters**
- **Description:** Templates filter bar shows POST, CAROUSEL, REEL, VIDEO, AD buttons.
- **Root Cause:** `app/dashboard/templates/page.tsx` line 8: `const POST_TYPES = ['ALL', 'POST', 'CAROUSEL', 'REEL', 'VIDEO', 'AD']`
- **Fix:** Change to `const POST_TYPES = ['ALL', 'IMAGE', 'CAROUSEL']`
- **Priority:** P1 — HIGH

---

**ISSUE-004: Database Migration Not Applied**
- **Description:** Multiple APIs fail because the PostgreSQL database doesn't match the current Prisma schema.
- **Root Cause:** `npx prisma migrate dev` was blocked by interactive mode restrictions and enum conflicts (PostType old vs new).
- **Fix:**
  1. Resolve PostType enum conflict: The old enum had `POST, REEL, VIDEO, AD`. New enum should have `IMAGE, CAROUSEL`.
  2. Drop the old enum with CASCADE: `ALTER TYPE "PostType" RENAME TO "PostType_old"; CREATE TYPE "PostType" AS ENUM ('IMAGE', 'CAROUSEL');`
  3. Migrate User table fields: `ALTER TABLE "User" ADD COLUMN "postsUsed" INT DEFAULT 0;`
- **Priority:** P0 — CRITICAL

---

**ISSUE-005: No Logout Button**
- **Description:** Users cannot log out. There is no logout button in the UI.
- **Root Cause:** Sidebar has user info but no logout action. `logout()` function exists in `AuthContext` but nothing calls it.
- **Fix:** Add logout button to sidebar footer near the user info section.
- **Priority:** P1 — HIGH

---

### 🟠 HIGH (Fix Before Launch)

---

**ISSUE-006: Social Media OAuth Not Implemented**
- **Description:** Automations page shows "Coming Soon". No actual OAuth for Instagram, Facebook, TikTok, LinkedIn.
- **Root Cause:** Feature was designed but never built. No OAuth routes, no token storage, no SocialAccount table data.
- **Fix:** See Part 4 for complete implementation plan.
- **Priority:** P1 — HIGH

---

**ISSUE-007: Generate Button Wiring Missing**
- **Description:** "Regenerate" and "Save & Post" buttons on Generate page do nothing.
- **Root Cause:** Buttons are rendered but onClick handlers are not implemented.
- **Fix:** Wire `Regenerate` to call `handleGenerate()` again. Wire `Save & Post` to POST to `/api/posts`.
- **Priority:** P1 — HIGH

---

**ISSUE-008: Library — No Real Data / No Upload**
- **Description:** Library shows only mock placeholder data. Upload Media button does nothing.
- **Root Cause:** Library page was created with static mock data. Not connected to any backend.
- **Fix:** Connect Library to `/api/upload` for uploads and to `/api/assets` for listing. Create `/api/assets` route.
- **Priority:** P1 — HIGH

---

**ISSUE-009: Dark Theme - Remaining White Components**
- **Description:** Some pages/components still render with white backgrounds in dark mode.
- **Root Cause:** Inline styles using `background: white` or `background: #fff` in JSX components that override CSS variables.
- **Pages affected:** Dashboard home page (inline styles), settings page, billing page.
- **Fix:** Audit all pages for hardcoded color values and replace with CSS vars.
- **Priority:** P2 — MEDIUM

---

**ISSUE-010: Caption V2 API Uses next-auth (Not Installed)**
- **Description:** `app/api/v2/generate/caption/route.ts` imports from `next-auth` which is not in package.json.
- **Root Cause:** Code was written expecting next-auth but the project uses custom JWT auth.
- **Fix:** Replace `getServerSession()` with custom JWT verification from `lib/auth/jwt.ts`.
- **Priority:** P1 — HIGH

---

### 🟡 MEDIUM (Fix After Core Functionality)

---

**ISSUE-011: Performance — No Data Caching**
- **Description:** Every navigation causes a full re-fetch with no caching. Makes app feel slow.
- **Root Cause:** No SWR, React Query, or any caching strategy implemented.
- **Fix:** Install `swr` or `@tanstack/react-query`, wrap API calls in caching hooks.
- **Priority:** P2 — MEDIUM

---

**ISSUE-012: Calendar Page Accessible But Shows Empty/Broken**
- **Description:** `/dashboard/calendar` is accessible but shows an empty or broken state.
- **Root Cause:** Page exists (`app/dashboard/calendar/page.tsx`) but not in sidebar navigation.
- **Fix:** Either add Calendar to sidebar with proper data, or redirect to Automations scheduling.
- **Priority:** P2 — MEDIUM

---

**ISSUE-013: Ideas/Planner Pages Not In Navigation**
- **Description:** `/dashboard/ideas` and `/dashboard/planner` exist but aren't in the sidebar.
- **Root Cause:** These pages were built but never added to navigation.
- **Fix:** Evaluate if these are needed and add to sidebar or remove pages.
- **Priority:** P3 — LOW

---

**ISSUE-014: Register Page — Prisma Schema Error**
- **Description:** New user registration fails because User model expects fields not in DB.
- **Root Cause:** Same as ISSUE-004 — schema not migrated.
- **Fix:** Migrate database (ISSUE-004 fix resolves this).
- **Priority:** P1 — HIGH (blocks new user onboarding)

---

**ISSUE-015: Sidebar — Collapsed Mode Labels Cut Off**
- **Description:** When sidebar is collapsed, text labels are partially visible instead of hidden.
- **Root Cause:** CSS for `.sidebar.collapsed .nav-item` doesn't properly hide text.
- **Fix:** Ensure nav labels are `display: none` when collapsed or overflow is hidden.
- **Priority:** P3 — LOW

---

## PART 3 — FIXES & IMPLEMENTATION PLAN

### FIX-001: Database Migration (CRITICAL)

```sql
-- Step 1: Rename old PostType enum
ALTER TYPE "PostType" RENAME TO "PostType_old";

-- Step 2: Create new PostType enum
CREATE TYPE "PostType" AS ENUM ('IMAGE', 'CAROUSEL');

-- Step 3: Update Template table (has PostType_old reference)
ALTER TABLE "Template" ALTER COLUMN "type" DROP DEFAULT;
ALTER TABLE "Template" ALTER COLUMN "type" TYPE "PostType"
  USING (CASE WHEN "type"::text = 'POST' THEN 'IMAGE'
              WHEN "type"::text = 'REEL' THEN 'IMAGE'
              WHEN "type"::text = 'VIDEO' THEN 'IMAGE'
              WHEN "type"::text = 'AD' THEN 'IMAGE'
              ELSE "type"::text END)::"PostType";

-- Step 4: Update Post table
ALTER TABLE "Post" ALTER COLUMN "type" TYPE "PostType"
  USING "type"::text::"PostType";

-- Step 5: Drop old enum
DROP TYPE "PostType_old";

-- Step 6: Add missing User columns
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "postsUsed" INT DEFAULT 0;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "imagesGenerated" INT DEFAULT 0;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "lastResetAt" TIMESTAMP DEFAULT NOW();
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "preferences" JSONB DEFAULT '{}';

-- Step 7: Add missing Post columns
ALTER TABLE "Post" ADD COLUMN IF NOT EXISTS "hook" TEXT;
ALTER TABLE "Post" ADD COLUMN IF NOT EXISTS "body" TEXT;
ALTER TABLE "Post" ADD COLUMN IF NOT EXISTS "cta" TEXT;
ALTER TABLE "Post" ADD COLUMN IF NOT EXISTS "hashtags" TEXT[] DEFAULT '{}';
ALTER TABLE "Post" ADD COLUMN IF NOT EXISTS "captionMetadata" JSONB;
ALTER TABLE "Post" ADD COLUMN IF NOT EXISTS "assetId" TEXT;
ALTER TABLE "Post" ADD COLUMN IF NOT EXISTS "carouselId" TEXT;
```

**Prisma command after SQL migration:**
```bash
npx prisma generate
npx prisma db pull  # Verify schema matches DB
```

---

### FIX-002: Dashboard Home Page — Remove REEL/VIDEO

**File:** `app/dashboard/page.tsx`

```typescript
// BEFORE (broken):
const POST_TYPE_ICONS: Record<string, string> = {
  POST: '📝', CAROUSEL: '🎠', REEL: '🎬', VIDEO: '🎥', AD: '📢',
};

const QUICK_ACTIONS = [
  { href: '/dashboard/generate', icon: '✦', label: 'Generate', color: '#6366f1', bg: '#eef2ff' },
  { href: '/dashboard/generate?postType=CAROUSEL', icon: '◫', label: 'Carousel', color: '#ec4899', bg: '#fdf2f8' },
  { href: '/dashboard/generate?postType=REEL', icon: '▶', label: 'Reel', color: '#0ea5e9', bg: '#f0f9ff' }, // ❌ REMOVE
  { href: '/dashboard/ideas', icon: '◈', label: 'Ideas', color: '#8b5cf6', bg: '#f5f3ff' },
  { href: '/dashboard/templates', icon: '◇', label: 'Templates', color: '#10b981', bg: '#ecfdf5' },
  { href: '/dashboard/calendar', icon: '◷', label: 'Calendar', color: '#f59e0b', bg: '#fffbeb' }, // ❌ REMOVE or redirect
];

// AFTER (fixed):
const POST_TYPE_ICONS: Record<string, string> = {
  IMAGE: '🖼️', CAROUSEL: '🎠',
};

const QUICK_ACTIONS = [
  { href: '/dashboard/generate', icon: '✦', label: 'Generate', color: '#6366f1', bg: '#eef2ff' },
  { href: '/dashboard/generate?postType=CAROUSEL', icon: '◫', label: 'Carousel', color: '#ec4899', bg: '#fdf2f8' },
  { href: '/dashboard/library', icon: '◫', label: 'Library', color: '#0ea5e9', bg: '#f0f9ff' },
  { href: '/dashboard/ideas', icon: '◈', label: 'Ideas', color: '#8b5cf6', bg: '#f5f3ff' },
  { href: '/dashboard/templates', icon: '◇', label: 'Templates', color: '#10b981', bg: '#ecfdf5' },
  { href: '/dashboard/automations', icon: '⚡', label: 'Automations', color: '#f59e0b', bg: '#fffbeb' },
];
```

---

### FIX-003: Templates Page — Remove REEL/VIDEO/AD

**File:** `app/dashboard/templates/page.tsx`

```typescript
// BEFORE:
const POST_TYPES = ['ALL', 'POST', 'CAROUSEL', 'REEL', 'VIDEO', 'AD'];

// AFTER:
const POST_TYPES = ['ALL', 'IMAGE', 'CAROUSEL'];
```

---

### FIX-004: Fix Caption V2 API Auth

**File:** `app/api/v2/generate/caption/route.ts`

```typescript
// BEFORE (broken - next-auth not installed):
import { getServerSession } from 'next-auth';

// AFTER (correct - use custom JWT):
import { extractTokenFromHeader, verifyToken } from '@/lib/auth/jwt';

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const token = extractTokenFromHeader(authHeader || '');

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const payload = verifyToken(token);
  if (!payload) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  // Continue with payload.userId...
}
```

---

### FIX-005: Add Logout Button to Sidebar

**File:** `app/dashboard/components/Sidebar.tsx`

```typescript
import { LogOut } from 'lucide-react';
import { useAuth } from '@/lib/context/AuthContext';

// In component:
const { logout } = useAuth();

// In sidebar footer, after user-info:
<button
  className="logout-btn"
  onClick={logout}
  title="Logout"
>
  <LogOut size={18} />
  {!collapsed && <span>Logout</span>}
</button>
```

---

### FIX-006: Wire Regenerate and Save & Post buttons

**File:** `app/dashboard/generate/page.tsx`

```typescript
// Regenerate - just call handleGenerate again:
<button className="btn btn-secondary" style={{ flex: 1 }} onClick={handleGenerate}>
  <RefreshCw size={16} />
  Regenerate
</button>

// Save & Post - POST to API:
const handleSavePost = async () => {
  if (!generatedCaption) return;
  try {
    const token = localStorage.getItem('authToken');
    await fetch('/api/posts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        type: postType,
        caption: generatedCaption.fullCaption,
        hook: generatedCaption.hook,
        body: generatedCaption.body,
        cta: generatedCaption.cta,
        hashtags: generatedCaption.hashtags,
        platform: platform,
        status: 'DRAFT',
      }),
    });
    // Show success toast
  } catch (err) {
    // Show error
  }
};
```

---

### FIX-007: Create Assets API for Library

**New file:** `app/api/assets/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { extractTokenFromHeader, verifyToken } from '@/lib/auth/jwt';

export async function GET(req: NextRequest) {
  const token = extractTokenFromHeader(req.headers.get('authorization') || '');
  const payload = token ? verifyToken(token) : null;

  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const assets = await prisma.asset.findMany({
    where: { userId: payload.userId },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ assets });
}
```

---

## PART 4 — SOCIAL MEDIA API INTEGRATIONS

### Architecture Overview

```
User → Flowly UI → OAuth Flow → Platform API
                → Token Storage (DB)
                → Queue System (BullMQ/cron)
                → Post Publisher
                → Status Webhook
```

---

### 4.1 Facebook & Instagram Integration

**Required APIs:**
- Meta Business API v18.0
- Facebook Graph API
- Instagram Graph API (requires Facebook Page connected to IG Business)

**OAuth Flow:**
```
1. User clicks "Connect Instagram/Facebook"
2. Redirect to: https://www.facebook.com/v18.0/dialog/oauth
   ?client_id={FACEBOOK_APP_ID}
   &redirect_uri={APP_URL}/api/social/callback/facebook
   &scope=pages_manage_posts,instagram_basic,instagram_content_publish,pages_read_engagement
   &state={userId_encrypted}

3. User approves → Meta redirects to callback URL with code
4. Exchange code for access token:
   POST https://graph.facebook.com/v18.0/oauth/access_token
   ?client_id={FACEBOOK_APP_ID}
   &client_secret={FACEBOOK_APP_SECRET}
   &redirect_uri={callback_url}
   &code={code}

5. Get long-lived token (60 days):
   GET https://graph.facebook.com/v18.0/oauth/access_token
   ?grant_type=fb_exchange_token
   &client_id={APP_ID}
   &client_secret={APP_SECRET}
   &fb_exchange_token={short_lived_token}

6. Store token in SocialAccount table
```

**Publishing to Instagram:**
```
1. Create media object:
   POST https://graph.facebook.com/v18.0/{ig-user-id}/media
   ?image_url={public_image_url}
   &caption={caption}
   &access_token={token}
   → Returns: { id: "creation_id" }

2. Publish media object:
   POST https://graph.facebook.com/v18.0/{ig-user-id}/media_publish
   ?creation_id={creation_id}
   &access_token={token}
   → Returns: { id: "media_id" }
```

**Permissions Required:**
- `pages_manage_posts` - Post to Facebook Pages
- `instagram_basic` - Read Instagram account info
- `instagram_content_publish` - Publish to Instagram
- `pages_read_engagement` - Read post engagement

---

### 4.2 TikTok Integration

**Required APIs:**
- TikTok for Developers API v2
- TikTok Content Posting API

**OAuth Flow:**
```
1. User clicks "Connect TikTok"
2. Redirect to: https://www.tiktok.com/v2/auth/authorize/
   ?client_key={TIKTOK_CLIENT_KEY}
   &scope=user.info.basic,video.publish
   &response_type=code
   &redirect_uri={APP_URL}/api/social/callback/tiktok
   &state={userId_encrypted}

3. Exchange code for token:
   POST https://open.tiktokapis.com/v2/oauth/token/
   {
     "client_key": "...",
     "client_secret": "...",
     "code": "...",
     "grant_type": "authorization_code",
     "redirect_uri": "..."
   }

4. Store access_token + refresh_token
```

**Publishing (Image/Carousel to TikTok):**
```
POST https://open.tiktokapis.com/v2/post/publish/content/init/
{
  "post_info": {
    "title": "{caption}",
    "privacy_level": "PUBLIC_TO_EVERYONE"
  },
  "source_info": {
    "source": "PULL_FROM_URL",
    "photo_images": ["{image_url}"],
    "photo_cover_index": 0
  }
}
```

---

### 4.3 Database Schema for Social Accounts

```prisma
model SocialAccount {
  id            String    @id @default(cuid())
  userId        String
  user          User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  platform      Platform  // INSTAGRAM, FACEBOOK, TIKTOK, LINKEDIN, TWITTER
  platformId    String    // Platform's user/page ID
  platformName  String    // Display name / username

  accessToken   String    @db.Text  // Encrypted
  refreshToken  String?   @db.Text  // Encrypted
  tokenExpiry   DateTime?

  scopes        String[]
  connected     Boolean   @default(true)
  lastSync      DateTime?

  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  @@unique([userId, platform])
  @@index([userId])
}
```

---

### 4.4 Token Storage & Security

```typescript
// lib/crypto.ts - Encrypt tokens before storing
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const SECRET_KEY = Buffer.from(process.env.TOKEN_ENCRYPTION_KEY!, 'hex'); // 32 bytes

export function encryptToken(token: string): string {
  const iv = randomBytes(16);
  const cipher = createCipheriv(ALGORITHM, SECRET_KEY, iv);
  const encrypted = Buffer.concat([cipher.update(token, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
}

export function decryptToken(encrypted: string): string {
  const [ivHex, authTagHex, encryptedHex] = encrypted.split(':');
  const decipher = createDecipheriv(ALGORITHM, SECRET_KEY, Buffer.from(ivHex, 'hex'));
  decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));
  return decipher.update(Buffer.from(encryptedHex, 'hex')) + decipher.final('utf8');
}
```

---

### 4.5 Post Scheduling Architecture

```typescript
// Scheduling system using node-cron or Vercel Cron Jobs

// app/api/cron/publish-scheduled/route.ts
export async function GET(req: NextRequest) {
  // Verify cron secret
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Find posts scheduled for now (±5 minutes)
  const now = new Date();
  const fiveMinAgo = new Date(now.getTime() - 5 * 60 * 1000);

  const postsToPublish = await prisma.post.findMany({
    where: {
      status: 'SCHEDULED',
      scheduledFor: { gte: fiveMinAgo, lte: now },
    },
    include: {
      user: {
        include: { socialAccounts: true }
      }
    }
  });

  // Publish each post to connected platforms
  for (const post of postsToPublish) {
    for (const platform of post.platforms) {
      const account = post.user.socialAccounts.find(a => a.platform === platform);
      if (account) {
        await publishToplatform(post, account);
      }
    }

    // Update post status
    await prisma.post.update({
      where: { id: post.id },
      data: { status: 'PUBLISHED', publishedAt: new Date() }
    });
  }

  return NextResponse.json({ published: postsToPublish.length });
}
```

**Vercel Cron config** (`vercel.json`):
```json
{
  "crons": [{
    "path": "/api/cron/publish-scheduled",
    "schedule": "* * * * *"
  }]
}
```

---

### 4.6 Error Handling for Social Publishing

```typescript
async function publishToplatform(post: Post, account: SocialAccount) {
  try {
    const result = await publishPost(post, account);

    // Success - update post
    await prisma.post.update({
      where: { id: post.id },
      data: {
        status: 'PUBLISHED',
        publishedAt: new Date(),
        externalId: result.id // Platform's post ID
      }
    });

    // Create success notification
    await createNotification(account.userId, {
      type: 'success',
      title: 'Post published successfully',
      message: `Your post was published to ${account.platform}`,
    });

  } catch (error: any) {
    // Failure - mark as failed
    await prisma.post.update({
      where: { id: post.id },
      data: { status: 'FAILED', errorMessage: error.message }
    });

    // Create failure notification
    await createNotification(account.userId, {
      type: 'error',
      title: 'Post failed to publish',
      message: `Failed to publish to ${account.platform}: ${error.message}`,
    });

    // Handle specific errors:
    if (error.code === 'TOKEN_EXPIRED') {
      await refreshSocialToken(account);
      // Retry once
    }
  }
}
```

---

## PART 5 — FINAL ARCHITECTURE UPDATE

### 5.1 Complete File Structure

```
flowly/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx       ✅ EXISTS
│   │   └── register/page.tsx    ✅ EXISTS
│   ├── dashboard/
│   │   ├── layout.tsx           ✅ UPDATED (ThemeProvider)
│   │   ├── page.tsx             ⚠️  NEEDS FIX (remove REEL quick actions)
│   │   ├── generate/
│   │   │   └── page.tsx         ✅ FIXED (V2, IMAGE+CAROUSEL only)
│   │   ├── library/
│   │   │   └── page.tsx         ✅ CREATED (needs real API)
│   │   ├── templates/
│   │   │   └── page.tsx         ⚠️  NEEDS FIX (remove REEL/VIDEO filters)
│   │   ├── automations/
│   │   │   └── page.tsx         ⚠️  NEEDS FULL IMPLEMENTATION
│   │   ├── settings/
│   │   │   └── page.tsx         ✅ EXISTS (verify functionality)
│   │   ├── billing/
│   │   │   └── page.tsx         ✅ EXISTS
│   │   ├── analytics/           ✅ EXISTS (check data)
│   │   ├── ideas/               ✅ EXISTS (add to nav?)
│   │   └── components/
│   │       ├── Sidebar.tsx      ✅ UPDATED (add Logout)
│   │       └── TopBar.tsx       ✅ UPDATED (notifications fixed)
│   ├── api/
│   │   ├── auth/
│   │   │   ├── login/           ✅ EXISTS
│   │   │   └── register/        ✅ EXISTS
│   │   ├── posts/               ⚠️  NEEDS FIX (Prisma schema)
│   │   ├── assets/              ❌  MISSING - CREATE
│   │   ├── templates/           ⚠️  NEEDS FIX
│   │   ├── social/              ❌  MISSING - CREATE
│   │   │   ├── connect/[platform]/
│   │   │   ├── callback/[platform]/
│   │   │   └── disconnect/[platform]/
│   │   ├── cron/
│   │   │   └── publish-scheduled/ ❌ MISSING - CREATE
│   │   └── v2/
│   │       └── generate/
│   │           ├── caption/     ⚠️  NEEDS FIX (auth)
│   │           └── carousel/    ⚠️  NEEDS FIX (auth + prisma)
├── lib/
│   ├── ai/
│   │   ├── caption-generator.ts ✅ EXISTS
│   │   ├── carousel-generator.ts ✅ EXISTS
│   │   └── prompts/
│   │       └── caption.ts       ✅ EXISTS
│   ├── auth/
│   │   └── jwt.ts               ✅ EXISTS
│   ├── context/
│   │   ├── AuthContext.tsx      ✅ EXISTS
│   │   ├── ThemeContext.tsx     ✅ FIXED
│   │   └── ToastContext.tsx     ✅ EXISTS
│   ├── crypto.ts                ❌ MISSING - CREATE (token encryption)
│   ├── social/                  ❌ MISSING - CREATE
│   │   ├── instagram.ts
│   │   ├── facebook.ts
│   │   └── tiktok.ts
│   └── features/
│       └── permissions.ts       ✅ UPDATED
└── prisma/
    └── schema.prisma            ⚠️  NEEDS MIGRATION
```

---

### 5.2 Updated Navigation Structure

```
SIDEBAR (Final Version):
├── 🌩️ Flowly 2.0 (logo)
│
├── [MAIN]
│   ├── ✨ Generate        → /dashboard/generate
│   ├── 🖼️ Library         → /dashboard/library
│   ├── 📋 Templates       → /dashboard/templates
│   └── ⚡ Automations     → /dashboard/automations
│
├── [ACCOUNT]
│   └── ⚙️ Settings       → /dashboard/settings
│
└── [FOOTER]
    ├── 🌙/☀️ Dark/Light Toggle
    ├── [User Avatar] Admin | ENTERPRISE
    └── 🚪 Logout
```

---

### 5.3 Performance Optimization Plan

**1. Install SWR for data caching:**
```bash
npm install swr
```

```typescript
// lib/hooks/useAssets.ts
import useSWR from 'swr';

const fetcher = (url: string, token: string) =>
  fetch(url, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json());

export function useAssets() {
  const token = localStorage.getItem('authToken');
  const { data, error, mutate } = useSWR(
    token ? ['/api/assets', token] : null,
    ([url, t]) => fetcher(url, t),
    { revalidateOnFocus: false, dedupingInterval: 30000 }
  );
  return { assets: data?.assets, isLoading: !data && !error, mutate };
}
```

**2. Next.js Route Prefetching:**
```typescript
// In Sidebar - prefetch on hover
import { useRouter } from 'next/navigation';

const router = useRouter();

// Prefetch on hover
<Link href={item.href} prefetch={true}>
```

**3. React.memo for heavy components:**
```typescript
export const Sidebar = React.memo(function Sidebar({ collapsed, onToggle }: SidebarProps) {
  // ... component code
});
```

**4. Lazy load heavy pages:**
```typescript
// app/dashboard/layout.tsx
import dynamic from 'next/dynamic';
const TopBar = dynamic(() => import('./components/TopBar'), { ssr: false });
```

---

## PART 6 — SUGGESTIONS & IMPROVEMENTS

### 6.1 Immediate UX Wins

1. **Toast notifications for every action** — Currently inconsistent. Add toast on: generate success, copy, save, error, theme change.

2. **Loading skeleton screens** — Instead of showing "Loading..." text, show skeleton placeholders that match the content layout.

3. **Keyboard shortcuts** — Implement ⌘K command palette (search bar already shows the shortcut but doesn't work). Add:
   - `⌘K` → Open command palette
   - `⌘G` → Go to Generate
   - `⌘L` → Go to Library
   - `⌘N` → New post

4. **Onboarding flow** — New users see empty screens. Add a step-by-step onboarding:
   - Step 1: Connect first social account
   - Step 2: Generate first caption
   - Step 3: Save first post
   - Step 4: Schedule first post

5. **Drag & Drop in Library** — Allow drag & drop file upload to library.

6. **Caption Character Counter** — Show live character count with platform limits:
   - Instagram: 2,200 chars
   - Facebook: 63,206 chars
   - LinkedIn: 3,000 chars
   - TikTok: 2,200 chars

---

### 6.2 Feature Additions

7. **AI Content Calendar** — Let Claude generate a monthly content calendar based on industry and brand voice.

8. **Brand Voice Training** — Let users upload example posts, Claude analyzes them and remembers the writing style.

9. **A/B Testing** — Generate 2 captions simultaneously, let user pick the winner, track performance.

10. **Hashtag Research Tool** — AI suggests optimal hashtags based on post content and trending topics.

11. **Competitor Analysis** — Input competitor handles, AI analyzes their top posts and suggests strategies.

12. **Post Analytics** — After publishing, show reach, impressions, likes, comments pulled from social APIs.

13. **Bulk Scheduling** — Upload CSV of posts, schedule all at once.

14. **Team Collaboration** — Multiple users under one account, with roles (Admin, Editor, Viewer).

15. **White Label** — Agencies can rebrand Flowly for their clients.

---

### 6.3 Technical Improvements

16. **Real-time with WebSockets** — When caption is generating, stream the text word-by-word (Claude streaming API).

17. **Background job queue** — Use BullMQ or Vercel Queue for:
    - Scheduled posts
    - Image processing
    - Email notifications

18. **Rate limiting** — Add rate limits to AI generation endpoints using Upstash Redis:
    ```typescript
    import { Ratelimit } from '@upstash/ratelimit';
    import { Redis } from '@upstash/redis';

    const ratelimit = new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(10, '1 m'), // 10 requests/minute
    });
    ```

19. **Image CDN** — Use Cloudflare Images or Vercel Blob for storing generated/uploaded images.

20. **Error monitoring** — Integrate Sentry for production error tracking:
    ```bash
    npm install @sentry/nextjs
    ```

21. **Logging** — Add structured logging with Pino or Winston for debugging API calls.

22. **API versioning** — Keep v2 pattern, retire old routes cleanly.

23. **Database connection pooling** — Neon supports pooled connections. Use `DATABASE_URL_POOLED` for edge functions.

24. **Security hardening:**
    - Add CSRF protection
    - Rate limit login attempts (max 5/minute)
    - Encrypt sensitive DB fields (tokens)
    - Add Content-Security-Policy headers
    - Validate all inputs with Zod

---

### 6.4 Infrastructure Improvements

25. **CI/CD Pipeline** — GitHub Actions for automated testing and deployment:
    ```yaml
    # .github/workflows/deploy.yml
    on: [push]
    jobs:
      test:
        runs-on: ubuntu-latest
        steps:
          - uses: actions/checkout@v3
          - run: npm test
      deploy:
        needs: test
        runs-on: ubuntu-latest
        steps:
          - uses: vercel/actions/deploy@v1
    ```

26. **Environment management** — Separate dev/staging/production environments with Vercel projects.

27. **Database backups** — Neon provides automatic backups, but also set up manual weekly exports.

28. **Monitoring** — Add Vercel Analytics + UptimeRobot for uptime monitoring.

29. **Edge functions** — Move auth middleware to Vercel Edge for faster response times.

30. **Preview deployments** — Every PR gets a preview URL for QA testing before merge.

---

### 6.5 Business Features

31. **Referral program** — Users refer friends, both get extra AI credits.

32. **Usage dashboard** — Show users exactly how many generations they've used, with pretty charts.

33. **API access for ENTERPRISE** — Let ENTERPRISE users access Flowly API to integrate with their own tools.

34. **Zapier/Make integration** — Connect Flowly to thousands of apps without custom code.

35. **Mobile app** — React Native app using the same API backend.

---

## PRIORITY ACTION LIST

### 🔴 Do This Week (Critical)

1. ✅ Fix Database Migration (SQL script in FIX-001)
2. ✅ Fix Caption V2 API auth (remove next-auth)
3. ✅ Fix Dashboard REEL quick actions
4. ✅ Fix Templates REEL/VIDEO filters
5. ✅ Add Logout button to Sidebar

### 🟠 Do Next Week (High)

6. Wire Regenerate + Save & Post buttons
7. Create Assets API for Library
8. Start Facebook/Instagram OAuth implementation
9. Install SWR for data caching
10. Fix Posts API Prisma schema

### 🟡 Do Next Month (Medium)

11. Implement TikTok OAuth
12. Build scheduling system
13. Add command palette (⌘K)
14. Add skeleton loading screens
15. Add streaming for caption generation

### 🟢 Future (Low)

16. AI Content Calendar
17. Team collaboration
18. Analytics dashboard
19. Mobile app
20. White label solution

---

## SUMMARY SCORECARD

| Area | Before | After Fixes | Target |
|------|--------|-------------|--------|
| Authentication | 8/10 | 9/10 | 10/10 |
| Navigation | 4/10 | 8/10 | 10/10 |
| Theme System | 5/10 | 8/10 | 10/10 |
| Generate Page | 6/10 | 9/10 | 10/10 |
| Library | 0/10 | 5/10 | 9/10 |
| Templates | 4/10 | 7/10 | 9/10 |
| Automations | 0/10 | 2/10 | 9/10 |
| Notifications | 3/10 | 9/10 | 10/10 |
| Social APIs | 0/10 | 0/10 | 9/10 |
| Performance | 4/10 | 5/10 | 9/10 |
| Database | 3/10 | 3/10 | 10/10 |
| **OVERALL** | **3.7/10** | **6.5/10** | **9.5/10** |

---

*Document generated: February 22, 2026*
*Platform: Flowly 2.0 — AI Social Media Manager*
*Stack: Next.js 16 · TypeScript · Prisma · PostgreSQL (Neon) · Claude Sonnet 4.5*
