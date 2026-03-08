# FLOWLY 2.0 — COMPLETE QA, ARCHITECTURE & IMPROVEMENT PLAN
> Senior QA Automation Engineer + Full-Stack Architect Report
> Base: Existing Flowly 2.0 Implementation (Next.js 16.1.6, Prisma, PostgreSQL, Claude AI)
> Date: February 2026

---

## PART 1 — 100 TEST SCENARIOS

---

### AUTHENTICATION & ACCESS

**TC-001 | Login with valid credentials**
- Steps: Navigate to /auth/login → enter valid email and password → click Login
- Expected: JWT stored in localStorage, redirect to /dashboard
- Actual: Works correctly after Prisma schema fix
- Severity: CRITICAL
- Fix: Ensure `passwordHash` column exists in DB and schema comments are consistent

**TC-002 | Login with invalid password**
- Steps: Navigate to /auth/login → enter valid email, wrong password → click Login
- Expected: Toast error "Invalid credentials", no redirect
- Actual: 401 returned but no clear UI error message shown
- Severity: HIGH
- Fix: Display `toastError()` on 401 response from /api/auth/login

**TC-003 | Login with non-existent email**
- Steps: Enter non-registered email → click Login
- Expected: "Account not found" error message
- Actual: Generic "Invalid credentials" (intentional for security)
- Severity: LOW
- Fix: Current behavior is correct per security best practice

**TC-004 | Logout flow**
- Steps: Click Logout button in Sidebar → verify redirect to /auth/login
- Expected: localStorage cleared, redirect to login, no dashboard access
- Actual: logout() + router.push('/auth/login') implemented in Sidebar
- Severity: HIGH
- Fix: Verify that after logout, navigating to /dashboard redirects back to login

**TC-005 | JWT expiry behavior**
- Steps: Wait for JWT to expire (default: 7 days) → try to access /dashboard
- Expected: Redirect to /auth/login with message "Session expired"
- Actual: User sees a broken/empty dashboard or network error
- Severity: HIGH
- Fix: Add 401 response interceptor in useApiClient to call logout() and redirect

**TC-006 | Direct URL access without auth**
- Steps: Navigate to /dashboard/generate without being logged in
- Expected: Redirect to /auth/login
- Actual: DashboardLayout useEffect handles this correctly
- Severity: CRITICAL
- Fix: Already fixed, verify redirect takes less than 500ms

**TC-007 | Register new user with all fields**
- Steps: POST /api/auth/register with email, password, firstName, lastName
- Expected: 201 Created, JWT token returned
- Actual: Works, but no register UI page exists in app
- Severity: MEDIUM
- Fix: Create /auth/register page with form

**TC-008 | Register with duplicate email**
- Steps: Register with an email already in the database
- Expected: 409 Conflict error "Email already registered"
- Actual: Prisma throws unique constraint violation — may result in 500 instead of 409
- Severity: HIGH
- Fix: Catch Prisma P2002 error and return 409

**TC-009 | Password stored as plaintext**
- Steps: Check database value of passwordHash for a user
- Expected: bcrypt hash starting with $2b$
- Actual: Correctly hashed with bcryptjs
- Severity: CRITICAL
- Fix: No fix needed, already secure

**TC-010 | Token tampering**
- Steps: Modify the JWT in localStorage and try to access /api/posts
- Expected: 401 Unauthorized
- Actual: withAuth middleware returns 401 — correct
- Severity: CRITICAL
- Fix: No fix needed, JWT verification is correct

---

### NAVIGATION & ROUTING

**TC-011 | Sidebar navigation links**
- Steps: Click each sidebar item (Generate, Library, Templates, Automations, Billing)
- Expected: Navigate to correct page without 404
- Actual: All links now work after fixes
- Severity: HIGH
- Fix: All pages exist — no action needed

**TC-012 | Dashboard home quick actions**
- Steps: Click each quick action (Generate, Carousel, Templates, Library, Automations)
- Expected: Navigate to correct page
- Actual: Fixed — REEL removed, all links point to valid pages
- Severity: MEDIUM
- Fix: Already fixed

**TC-013 | Back navigation**
- Steps: Navigate from Dashboard → Generate → use browser back button
- Expected: Return to Dashboard home
- Actual: Works (standard browser behavior)
- Severity: LOW
- Fix: No fix needed

**TC-014 | Active state highlighting in sidebar**
- Steps: Navigate to /dashboard/templates → check sidebar
- Expected: Templates item is highlighted with active styles
- Actual: isActive() compares pathname === href, works for exact paths
- Severity: MEDIUM
- Fix: For nested routes (e.g. /dashboard/templates/create) use startsWith() instead of ===

**TC-015 | Mobile responsiveness of sidebar**
- Steps: Resize window to 375px width
- Expected: Sidebar collapses or becomes a drawer menu
- Actual: Sidebar takes 240px and overflows content area on mobile
- Severity: HIGH
- Fix: Add media query to hide sidebar at <768px, add hamburger button in TopBar

**TC-016 | 404 page for unknown routes**
- Steps: Navigate to /dashboard/unknown-page
- Expected: Custom 404 page or "not found" message
- Actual: Next.js default 404 page, not branded
- Severity: LOW
- Fix: Create app/not-found.tsx with Flowly-branded 404 page

**TC-017 | Breadcrumb navigation**
- Steps: Navigate to nested routes like /dashboard/generate
- Expected: Breadcrumb shows "Dashboard > Generate"
- Actual: No breadcrumbs exist in TopBar
- Severity: LOW
- Fix: Add breadcrumb component to TopBar based on pathname

**TC-018 | Deep link to billing after payment success**
- Steps: Complete Stripe checkout → redirected to /dashboard/billing?status=success
- Expected: "Subscription updated" toast message shown
- Actual: BillingPage checks for status=success param and calls success() toast — correct
- Severity: HIGH
- Fix: No fix needed

**TC-019 | Social page navigation**
- Steps: Click on social account management page
- Expected: Page loads with account connection options
- Actual: /dashboard/social exists but may not have full implementation
- Severity: MEDIUM
- Fix: Verify social page has OAuth connect buttons for Facebook, Instagram, TikTok

**TC-020 | Settings page navigation**
- Steps: Navigate to /dashboard/settings
- Expected: User settings form with profile fields
- Actual: Page exists but not linked from sidebar (removed in fix)
- Severity: MEDIUM
- Fix: Add Settings as bottom footer link in Sidebar (user icon → settings)

---

### CONTENT GENERATION

**TC-021 | Generate IMAGE caption (FREE plan)**
- Steps: Login as FREE user → Generate tab → select IMAGE → enter prompt → Generate
- Expected: Claude API called, structured caption returned (hook, body, CTA, hashtags)
- Actual: Works when API key is set and monthly limit not exceeded
- Severity: CRITICAL
- Fix: Add clear error message when ANTHROPIC_API_KEY is missing

**TC-022 | Generate CAROUSEL caption (FREE plan)**
- Steps: Login as FREE user → select CAROUSEL type → click Generate
- Expected: "Upgrade to PRO" modal shown, generation blocked
- Actual: Fixed — canGenerate() correctly blocks CAROUSEL for FREE plan
- Severity: HIGH
- Fix: Already fixed

**TC-023 | Generate CAROUSEL caption (PRO plan)**
- Steps: Login as PRO user → select CAROUSEL → enter prompt → Generate
- Expected: Carousel content generated with multiple slide descriptions
- Actual: Should work via /api/v2/generate/carousel
- Severity: CRITICAL
- Fix: Verify carousel API returns structured slide array

**TC-024 | Generation with empty prompt**
- Steps: Click Generate button without entering a prompt
- Expected: Button is disabled or validation error shown
- Actual: Button should be disabled when prompt is empty — verify this
- Severity: MEDIUM
- Fix: Add `disabled={!prompt.trim() || isGenerating}` to button

**TC-025 | Generation with very long prompt (>2000 chars)**
- Steps: Enter a prompt with 2000+ characters → Generate
- Expected: Either truncated or full prompt passed to Claude
- Actual: No client-side limit on textarea — Claude may fail
- Severity: MEDIUM
- Fix: Add maxLength={2000} and character counter to prompt textarea

**TC-026 | Monthly generation limit enforcement**
- Steps: FREE user generates 20 posts → try to generate 21st
- Expected: 429 response with "Monthly limit reached" message
- Actual: API checks postsUsed count — but postsUsed column may not be migrated
- Severity: CRITICAL
- Fix: Run DB migration to add postsUsed field, or count from Post model directly

**TC-027 | Platform selection affects content**
- Steps: Select Instagram platform → generate → then select LinkedIn → generate same prompt
- Expected: Different tone and content structure for each platform
- Actual: Platform is passed to Claude in prompt — depends on prompt engineering quality
- Severity: MEDIUM
- Fix: Add platform-specific system prompts in lib/ai/prompts.ts

**TC-028 | Tone selection affects content**
- Steps: Generate with "funny" tone vs "professional" tone, same prompt
- Expected: Noticeably different content style
- Actual: Tone parameter passed to Claude — dependent on prompt quality
- Severity: MEDIUM
- Fix: Add tone-specific examples in prompts to improve output quality

**TC-029 | Regenerate button functionality**
- Steps: Generate content → click Regenerate button
- Expected: New API call with same parameters, different output
- Actual: Regenerate button exists in generate page UI but may not trigger new API call
- Severity: HIGH
- Fix: Wire Regenerate button to call generate() again with same form state

**TC-030 | Copy to clipboard**
- Steps: Click copy icon on generated caption
- Expected: Full caption copied to clipboard, success toast shown
- Actual: Copy button calls navigator.clipboard.writeText — may fail on HTTP
- Severity: MEDIUM
- Fix: Add fallback copy method for non-HTTPS environments

**TC-031 | Save & Post button**
- Steps: Generate content → click "Save & Post"
- Expected: Post created in database, redirect to posts list
- Actual: Button exists but may not be wired to /api/posts POST endpoint
- Severity: HIGH
- Fix: Wire button to create post via POST /api/posts, then redirect to /dashboard/posts

**TC-032 | Character count validation by platform**
- Steps: Generate long caption for Twitter/X
- Expected: Warning when caption exceeds platform character limit (280 chars)
- Actual: Character count is shown but no platform-specific warnings
- Severity: MEDIUM
- Fix: Add platform limits and yellow/red warning when exceeded

**TC-033 | Include hashtags toggle**
- Steps: Toggle off "Include Hashtags" → Generate
- Expected: Generated caption has no hashtag section
- Actual: Toggle state passed to API in request body — depends on prompt handling
- Severity: LOW
- Fix: Verify Claude respects includeHashtags=false in system prompt

**TC-034 | Brand tone applied to generation**
- Steps: Set brandTone="playful" in settings → Generate content
- Expected: Generated content reflects playful brand voice
- Actual: Brand memory injected into Claude context — should work
- Severity: MEDIUM
- Fix: Add brand memory preview in generate page so users see what context is used

**TC-035 | Generation error handling**
- Steps: Disconnect internet → click Generate
- Expected: Error toast "Failed to generate content. Check your connection."
- Actual: fetch() throws, but error handling in component may be generic
- Severity: HIGH
- Fix: Add specific error messages for network failures vs API failures

---

### TEMPLATES

**TC-036 | Load templates list**
- Steps: Navigate to /dashboard/templates
- Expected: List of user's templates loaded from /api/templates
- Actual: useTemplates().list() called on mount — depends on API being in correct path
- Severity: HIGH
- Fix: Templates API now in correct path (app/api/templates/) — verify connection

**TC-037 | Create new template**
- Steps: Click "+ Template nou" → fill form (name, type, content) → Submit
- Expected: Template created via POST /api/templates, appears in list
- Actual: Should work with useTemplates().create()
- Severity: HIGH
- Fix: Test end-to-end, verify Template model exists in Prisma and DB

**TC-038 | Edit existing template**
- Steps: Click edit (✏️) on template card → modify fields → Save
- Expected: Template updated via PUT /api/templates/:id
- Actual: openEdit() sets editId and populates form, handleSave() calls update()
- Severity: HIGH
- Fix: Should work correctly — test end-to-end

**TC-039 | Delete template with confirmation**
- Steps: Click delete (🗑️) on template card
- Expected: Template deleted immediately (no confirmation dialog)
- Actual: handleDelete() calls deleteTemplate() directly with no confirmation
- Severity: MEDIUM
- Fix: Add confirmation: wrap in window.confirm() or a small confirm modal

**TC-040 | Use template in generate**
- Steps: Click "✨ Folosește" on template card
- Expected: Redirected to /dashboard/generate with prompt pre-filled
- Actual: useTemplate() pushes to generate with prompt= and postType= query params
- Severity: MEDIUM
- Fix: Verify generate page reads query params and pre-fills prompt field on mount

**TC-041 | Filter templates by type**
- Steps: Click IMAGE filter tab → only IMAGE templates shown
- Expected: Only IMAGE type templates visible
- Actual: API called with ?type=IMAGE filter — should work
- Severity: MEDIUM
- Fix: No fix needed — verify filter works in test

**TC-042 | Empty templates state**
- Steps: Login as new user with no templates
- Expected: Empty state with "Create first template" button
- Actual: Empty state UI implemented in templates page
- Severity: LOW
- Fix: No fix needed

**TC-043 | Template with missing content field**
- Steps: Try to create template with empty content field
- Expected: Button disabled until content filled
- Actual: `disabled={isSaving || !formData.name.trim() || !formData.content.trim()}` — correct
- Severity: MEDIUM
- Fix: No fix needed

**TC-044 | Template type default value**
- Steps: Open create template modal → check default type
- Expected: Default type is IMAGE (not POST or REEL)
- Actual: Fixed — emptyForm.type = 'IMAGE'
- Severity: MEDIUM
- Fix: Already fixed

**TC-045 | Templates dark mode**
- Steps: Switch to dark mode → navigate to templates
- Expected: Modal, cards, filter buttons all dark
- Actual: Templates page uses hardcoded white (#ffffff) colors not CSS variables
- Severity: MEDIUM
- Fix: Replace hardcoded colors with var(--background), var(--foreground), etc.

---

### LIBRARY

**TC-046 | Library page loads without 404**
- Steps: Navigate to /dashboard/library
- Expected: Page loads with media grid
- Actual: Fixed — page created in previous session
- Severity: HIGH
- Fix: Already fixed

**TC-047 | Library search filter**
- Steps: Type in search box → results filtered by title
- Expected: Only assets matching search text shown
- Actual: Search filter implemented on client side in mock data
- Severity: MEDIUM
- Fix: When connected to real API, add debounced search param

**TC-048 | Library upload button**
- Steps: Click "Upload" button in library header
- Expected: File picker opens, file uploaded to /api/upload
- Actual: Upload button exists in UI but click handler may not be implemented
- Severity: HIGH
- Fix: Add onClick to upload button that triggers file input and calls useMedia().uploadFile()

**TC-049 | Library real data connection**
- Steps: Check if library shows real uploaded assets
- Expected: Assets from database shown (Asset model records)
- Actual: Library uses mock data array — NOT connected to API
- Severity: HIGH
- Fix: Add useEffect to call useMedia().listFiles() and populate asset grid

**TC-050 | Library delete asset**
- Steps: Hover on asset → click delete overlay button
- Expected: Asset deleted via DELETE /api/upload, removed from grid
- Actual: Delete button exists in hover overlay — handler needs implementation
- Severity: HIGH
- Fix: Wire delete button to useMedia().deleteFile(filename)

**TC-051 | Library dark mode**
- Steps: Switch to dark mode → navigate to library
- Expected: All library elements in dark theme
- Actual: Library uses hardcoded white backgrounds
- Severity: MEDIUM
- Fix: Replace hardcoded colors with CSS variables

**TC-052 | Library filter by type (Images vs Carousels)**
- Steps: Click "Carousels" filter button
- Expected: Only carousel assets shown
- Actual: Filter is implemented on mock data by type field
- Severity: MEDIUM
- Fix: Real API should support ?type=carousel query param

**TC-053 | Asset hover actions visible**
- Steps: Hover over an asset card in library
- Expected: Download and Delete buttons appear
- Actual: Hover overlay with actions implemented via CSS hover state
- Severity: LOW
- Fix: Verify hover state works on touch devices (may need long-press)

---

### BILLING & SUBSCRIPTION

**TC-054 | View current plan**
- Steps: Navigate to /dashboard/billing
- Expected: Current plan displayed with badge, limit, and renewal date
- Actual: BillingPage loads plan from user.subscriptionPlan in AuthContext
- Severity: HIGH
- Fix: Ensure subscriptionPlan is included in login response and stored in context

**TC-055 | Monthly usage bar**
- Steps: Navigate to /dashboard/billing → check usage section
- Expected: Bar shows correct percentage of posts used
- Actual: Loads from /api/posts and counts posts this month — may fail if posts API fails
- Severity: MEDIUM
- Fix: Add fallback when posts API fails — show 0 instead of error

**TC-056 | Cancel subscription flow**
- Steps: Click "Anulează abonamentul" → confirm in modal → check result
- Expected: POST to /api/subscription/billing, subscription marked for cancellation
- Actual: Cancel modal implemented, API call made — verify Stripe integration works
- Severity: HIGH
- Fix: Ensure Stripe subscription cancellation is handled in billing/route.ts

**TC-057 | Upgrade CTA for FREE users**
- Steps: Login as FREE user → navigate to billing
- Expected: "Upgrade now" link shown, points to /pricing
- Actual: FREE plan shows upgrade link to /pricing page
- Severity: MEDIUM
- Fix: Verify /pricing page loads and has working Stripe checkout links

**TC-058 | Payment history display**
- Steps: Navigate to billing as a user with payment history
- Expected: Table with date, plan, amount, status
- Actual: Loads from billing.payments — only shown if payments array is non-empty
- Severity: LOW
- Fix: No fix needed — billing API needs to return Payment records from DB

**TC-059 | ENTERPRISE unlimited display**
- Steps: Login as ENTERPRISE user → navigate to billing
- Expected: "Unlimited posts" shown in usage, no limit bar
- Actual: ENTERPRISE has null planLimit → shows "∞" with green banner
- Severity: HIGH
- Fix: Verify ENTERPRISE plan shows correct unlimited messaging

**TC-060 | Stripe checkout initiation**
- Steps: Click "Upgrade now" on pricing page → select PRO plan
- Expected: Stripe checkout session created, redirected to Stripe
- Actual: /api/subscription/checkout should create session
- Severity: CRITICAL
- Fix: Ensure STRIPE_SECRET_KEY is set in .env and checkout route works

---

### NOTIFICATIONS

**TC-061 | Notification bell badge**
- Steps: View TopBar when unread notifications exist
- Expected: Red badge with count of unread notifications
- Actual: Badge shows unreadCount correctly from hardcoded notification array
- Severity: MEDIUM
- Fix: Replace hardcoded notifications with real API data from /api/notifications

**TC-062 | Notification dropdown opens**
- Steps: Click bell icon
- Expected: Dropdown panel appears with notification list
- Actual: showNotifications state toggles dropdown — works correctly
- Severity: HIGH
- Fix: No fix needed for toggle mechanism

**TC-063 | Notification click opens modal**
- Steps: Click on a notification in dropdown
- Expected: Full message modal opens with notification details
- Actual: openNotification() marks as read and shows selectedNotification modal
- Severity: HIGH
- Fix: No fix needed for this flow

**TC-064 | Mark all as read**
- Steps: Click "Mark all as read" in notification dropdown
- Expected: All notifications marked read, badge count becomes 0
- Actual: markAllRead() maps all notifications to read: true — correct
- Severity: MEDIUM
- Fix: No fix needed for local state — needs API call for persistence

**TC-065 | Notification persistence**
- Steps: Mark notification as read → refresh page
- Expected: Notification still marked as read
- Actual: Notifications are hardcoded arrays in state — reset on refresh
- Severity: MEDIUM
- Fix: Create /api/notifications endpoint, store notifications in database

**TC-066 | Click outside closes notification dropdown**
- Steps: Open notification dropdown → click anywhere on page
- Expected: Dropdown closes
- Actual: Click-outside handler implemented via useEffect event listener
- Severity: MEDIUM
- Fix: No fix needed

**TC-067 | Real notifications from system events**
- Steps: Generate a post → check notifications
- Expected: "New post generated successfully" notification appears
- Actual: No real notification events are created — hardcoded sample data
- Severity: MEDIUM
- Fix: Create notification system that adds DB records on key events

---

### THEME SYSTEM

**TC-068 | Dark mode toggle**
- Steps: Click Moon icon in sidebar → page switches to dark theme
- Expected: All elements switch to dark background/light text
- Actual: ThemeContext toggles data-theme="dark" on document.documentElement
- Severity: HIGH
- Fix: Ensure all CSS uses var(--background) not hardcoded white

**TC-069 | Theme persistence across refresh**
- Steps: Enable dark mode → refresh page
- Expected: Dark mode stays active
- Actual: ThemeContext reads from localStorage on mount — should persist
- Severity: HIGH
- Fix: Verify localStorage key 'theme' is read on initialization

**TC-070 | Theme consistency across all pages**
- Steps: Enable dark mode → navigate through all dashboard pages
- Expected: Every page fully dark — no white flash or hardcoded whites
- Actual: Some pages (templates, library, billing) use hardcoded white in inline styles
- Severity: HIGH
- Fix: Audit all dashboard pages and replace background: 'white' with var(--background)

**TC-071 | Generate page dark mode**
- Steps: Enable dark mode → navigate to /dashboard/generate
- Expected: Generate form, cards, and results fully dark
- Actual: Generate page uses some hardcoded white backgrounds
- Severity: HIGH
- Fix: Replace hardcoded colors in generate/page.tsx with CSS variables

**TC-072 | Modal dark mode**
- Steps: Enable dark mode → open any modal (e.g., template create, cancel sub)
- Expected: Modal background is dark, text is light
- Actual: Modals use hardcoded background: 'white'
- Severity: HIGH
- Fix: Replace background: 'white' in all modals with background: 'var(--background)'

**TC-073 | Input fields in dark mode**
- Steps: Enable dark mode → focus any input field
- Expected: Dark input background, light text
- Actual: globals.css overrides input background to var(--background) — may work
- Severity: MEDIUM
- Fix: Verify inputStyle object in components uses 'var(--background)' not '#fff'

**TC-074 | Toast notifications in dark mode**
- Steps: Enable dark mode → trigger a toast
- Expected: Toast matches dark theme
- Actual: ToastContext/component may use hardcoded colors
- Severity: LOW
- Fix: Check ToastContext styling and apply CSS variables

---

### AUTOMATIONS

**TC-075 | Automations page loads**
- Steps: Click Automations in sidebar
- Expected: Page loads with "Coming Soon" message
- Actual: Simple placeholder page created — loads correctly
- Severity: HIGH
- Fix: Already fixed — page exists

**TC-076 | Automations content accuracy**
- Steps: View automations page
- Expected: Informative placeholder about upcoming features
- Actual: Generic "Coming Soon" message without feature preview
- Severity: LOW
- Fix: Add feature preview section with icons showing planned automation rules

---

### SOCIAL MEDIA ACCOUNTS

**TC-077 | Social accounts page**
- Steps: Navigate to /dashboard/social
- Expected: Shows connected social accounts and connect buttons
- Actual: Page exists but OAuth integration not implemented
- Severity: HIGH
- Fix: Implement OAuth connect flow for each platform (see Part 4)

**TC-078 | Connect Instagram account**
- Steps: Click "Connect Instagram" on social page
- Expected: Redirect to Facebook OAuth, permission grant, return with token stored
- Actual: Not implemented
- Severity: HIGH
- Fix: Implement Meta OAuth flow (see Part 4)

**TC-079 | Revoke social account access**
- Steps: Click disconnect on connected account
- Expected: Account removed from DB, tokens deleted
- Actual: Not implemented
- Severity: HIGH
- Fix: Add DELETE /api/social/:id endpoint

---

### SETTINGS

**TC-080 | Profile settings update**
- Steps: Navigate to /dashboard/settings → update firstName → save
- Expected: Profile updated via PUT /api/user/profile
- Actual: Settings page exists — verify form submission wired to API
- Severity: HIGH
- Fix: Ensure useProfile().update() is called on form submit

**TC-081 | Brand memory fields**
- Steps: Fill in brandTone, brandIndustry, brandKeywords → save
- Expected: Fields saved to user record, used in content generation
- Actual: Fields exist in DB and generation API uses them
- Severity: HIGH
- Fix: Verify settings form includes all brand memory fields

**TC-082 | Password change**
- Steps: Navigate to settings → change password
- Expected: New password hashed and saved
- Actual: No password change UI found in settings
- Severity: MEDIUM
- Fix: Add password change form to settings with currentPassword + newPassword fields

**TC-083 | Language preference**
- Steps: Change language in settings from Romanian to English
- Expected: Content generated in new language
- Actual: Language field exists in DB, passed to Claude in generation
- Severity: LOW
- Fix: Verify language preference is included in brand context

---

### POSTS MANAGEMENT

**TC-084 | Posts list page**
- Steps: Navigate to /dashboard/posts
- Expected: List of all user posts with status badges
- Actual: Page exists — may need API connection verification
- Severity: HIGH
- Fix: Ensure usePosts().list() called on mount and results displayed

**TC-085 | Post status filter**
- Steps: Click DRAFT filter on posts page
- Expected: Only DRAFT posts shown
- Actual: API supports ?status=DRAFT param
- Severity: MEDIUM
- Fix: Verify filter tabs in posts page pass status to list()

**TC-086 | Delete post**
- Steps: Click delete on a post
- Expected: Post deleted via DELETE /api/posts/:id
- Actual: Depends on posts page implementation
- Severity: HIGH
- Fix: Wire delete button to usePosts().delete(id)

**TC-087 | Schedule post for future**
- Steps: Create a post → set scheduledAt date/time
- Expected: Post created with status SCHEDULED and scheduledAt set
- Actual: scheduledAt field exists in Post model
- Severity: HIGH
- Fix: Add datetime picker to post creation flow, pass scheduledAt to API

---

### PERFORMANCE

**TC-088 | Initial page load time**
- Steps: Load /dashboard for first time (cold)
- Expected: Full page interactive in under 3 seconds
- Actual: No measurement done, but Next.js SSR with Turbopack should be fast
- Severity: HIGH
- Fix: Implement performance monitoring, add loading skeletons for all data fetches

**TC-089 | API response time for generation**
- Steps: Click Generate → measure time until result shown
- Expected: Under 5 seconds for Claude API response
- Actual: Claude API typically responds in 2-8 seconds
- Severity: MEDIUM
- Fix: Add streaming response support to show content as it generates

**TC-090 | Large template list performance**
- Steps: User has 100+ templates → load templates page
- Expected: Page loads in under 2 seconds, smooth scroll
- Actual: All templates loaded at once — no pagination
- Severity: MEDIUM
- Fix: Add server-side pagination to templates API (limit/offset params)

**TC-091 | Image loading in library**
- Steps: Library has 50+ images → scroll through
- Expected: Images lazy-loaded, no janky scroll
- Actual: No lazy loading implemented in library grid
- Severity: MEDIUM
- Fix: Use Next.js <Image> component with lazy={true} in library grid

**TC-092 | Dashboard stats loading**
- Steps: Load dashboard home
- Expected: Skeleton placeholders shown while stats load
- Actual: Dashboard page shows shimmer skeleton on stat cards — correct
- Severity: LOW
- Fix: No fix needed — already implemented

---

### ANALYTICS

**TC-093 | Analytics page**
- Steps: Navigate to /dashboard/analytics
- Expected: Charts showing posts count, engagement, platform breakdown
- Actual: Page exists but implementation unclear — likely placeholder
- Severity: MEDIUM
- Fix: Implement analytics using Post engagement fields (views, likes, comments, shares)

---

### CALENDAR & PLANNER

**TC-094 | Calendar page**
- Steps: Navigate to /dashboard/calendar
- Expected: Calendar view with scheduled posts shown on correct dates
- Actual: Page exists but not linked from sidebar
- Severity: MEDIUM
- Fix: Add Calendar link to Sidebar or include in additional nav section

**TC-095 | Planner page**
- Steps: Navigate to /dashboard/planner
- Expected: Content planner interface
- Actual: Page exists, not linked from sidebar
- Severity: LOW
- Fix: Determine if planner should be part of main nav or accessible via analytics

---

### IDEAS

**TC-096 | AI ideas generation**
- Steps: Navigate to /dashboard/ideas → request content ideas
- Expected: Claude generates content ideas based on brand profile
- Actual: /api/ai/ideas endpoint exists — page needs wiring
- Severity: MEDIUM
- Fix: Verify ideas page calls /api/ai/ideas with brand context

---

### SECURITY

**TC-097 | SQL injection prevention**
- Steps: Enter SQL injection string in prompt field → Generate
- Expected: Input sanitized, no DB error
- Actual: Prisma uses parameterized queries by default — secure
- Severity: CRITICAL
- Fix: No fix needed — Prisma parameterization protects against SQL injection

**TC-098 | XSS in content display**
- Steps: Generate content with <script> in prompt
- Expected: Script tags escaped in output
- Actual: React escapes HTML by default in JSX — no dangerouslySetInnerHTML used
- Severity: CRITICAL
- Fix: Verify no dangerouslySetInnerHTML is used anywhere in the codebase

**TC-099 | Rate limiting on generation API**
- Steps: Send 100 rapid requests to /api/v2/generate/caption
- Expected: Rate limited after threshold
- Actual: No rate limiting middleware exists
- Severity: HIGH
- Fix: Add rate limiting middleware (e.g., upstash-ratelimit or vercel edge middleware)

**TC-100 | CORS configuration**
- Steps: Make API request from external domain
- Expected: 403 CORS rejection unless whitelisted
- Actual: Next.js API routes default to same-origin only
- Severity: HIGH
- Fix: Verify next.config.ts has no overly permissive CORS headers

---

## PART 2 — ALL IDENTIFIED PROBLEMS

---

### PROB-001: Templates and Library use hardcoded colors (not dark mode compatible)
- **Description:** All inline style blocks in templates page, library page, billing page, and dashboard page use `background: 'white'`, `color: '#111827'`, etc. instead of CSS variables
- **Root Cause:** Inline styles cannot reference CSS custom properties in the same way JSX elements can
- **Fix:** Replace all hardcoded color strings with CSS variable references or create a theme-aware style factory
- **Priority:** HIGH

### PROB-002: Library not connected to real API
- **Description:** `/dashboard/library` shows 3 mock asset objects instead of real user uploads
- **Root Cause:** useEffect with real API call was never implemented
- **Fix:** Add `useEffect(() => { useMedia().listFiles().then(setAssets) }, [])` and wire upload/delete buttons
- **Priority:** HIGH

### PROB-003: Save & Post button not wired in Generate page
- **Description:** "Save & Post" button appears in generated content panel but clicking it does nothing
- **Root Cause:** onClick handler missing or empty
- **Fix:** Add handler that calls `usePosts().create()` with the generated content and redirects
- **Priority:** HIGH

### PROB-004: Templates API was in wrong directory
- **Description:** Template API routes were created in `app/app/api/templates/` (double app prefix)
- **Root Cause:** Wrong working directory when creating files
- **Fix:** Fixed — moved to `app/api/templates/`
- **Priority:** CRITICAL (already fixed)

### PROB-005: Monthly post limit not enforced from DB
- **Description:** Generation limit check in API may not work because `postsUsed` field was commented out of schema
- **Root Cause:** Prisma schema mismatch with database — fields don't exist
- **Fix:** Either run migration to add postsUsed column OR count from Post model directly
- **Priority:** HIGH

### PROB-006: No rate limiting on API routes
- **Description:** Any user can make unlimited API calls to generation endpoints
- **Root Cause:** No middleware for rate limiting
- **Fix:** Add edge middleware with IP-based rate limiting (10 requests/minute)
- **Priority:** HIGH

### PROB-007: No register UI page
- **Description:** `/api/auth/register` endpoint exists but no UI register page
- **Root Cause:** Register page was never created
- **Fix:** Create `/auth/register/page.tsx` with email, password, firstName fields
- **Priority:** MEDIUM

### PROB-008: JWT expiry not handled gracefully
- **Description:** When JWT expires (7 days), user sees network errors instead of "Session expired"
- **Root Cause:** No 401 interceptor in useApiClient
- **Fix:** Add response interceptor to call logout() and redirect on 401
- **Priority:** HIGH

### PROB-009: No streaming for AI generation
- **Description:** Users wait silently for 2-8 seconds with only a spinner
- **Root Cause:** API returns full response, no streaming implemented
- **Fix:** Use ReadableStream/Server-Sent Events for streaming Claude output
- **Priority:** MEDIUM

### PROB-010: Prisma template.type uses wrong values
- **Description:** Template DB type field may have old values (POST, REEL, VIDEO, AD)
- **Root Cause:** Template type was never migrated from old PostType enum to IMAGE/CAROUSEL
- **Fix:** Run SQL migration: `UPDATE "Template" SET type='IMAGE' WHERE type IN ('POST', 'REEL', 'VIDEO', 'AD')`
- **Priority:** HIGH

### PROB-011: No confirmation on template delete
- **Description:** Clicking delete icon immediately deletes without asking user
- **Root Cause:** No confirmation dialog implemented
- **Fix:** Add small confirm modal or `window.confirm()` before calling deleteTemplate()
- **Priority:** MEDIUM

### PROB-012: Settings page not linked from sidebar
- **Description:** /dashboard/settings exists but sidebar has no link to it
- **Root Cause:** Settings was removed from sidebar items in previous fix
- **Fix:** Add settings as a clickable icon in sidebar footer (gear icon next to user avatar)
- **Priority:** MEDIUM

### PROB-013: No pagination on posts or templates
- **Description:** All posts and templates fetched at once — bad for users with many records
- **Root Cause:** API supports limit/offset but UI doesn't implement it
- **Fix:** Add pagination component and pass limit=20&offset=N to API calls
- **Priority:** MEDIUM

### PROB-014: Notifications are hardcoded
- **Description:** Notification bell shows hardcoded test data, not real system events
- **Root Cause:** No notification database model or API endpoint
- **Fix:** Create Notification model in Prisma, add /api/notifications endpoint
- **Priority:** MEDIUM

### PROB-015: Social accounts page has no OAuth implementation
- **Description:** /dashboard/social exists but no way to actually connect accounts
- **Root Cause:** Social media OAuth not implemented
- **Fix:** Implement Meta and TikTok OAuth flow (see Part 4)
- **Priority:** HIGH

### PROB-016: No mobile-responsive sidebar
- **Description:** Sidebar takes 240px and pushes content off-screen on mobile
- **Root Cause:** No responsive breakpoint for sidebar
- **Fix:** Hide sidebar on <768px, add hamburger menu in TopBar
- **Priority:** HIGH

### PROB-017: Duplicate `app/app/api` directory
- **Description:** Old template API files remain in `app/app/api/templates/` after correct files created
- **Root Cause:** Files were created in wrong directory and not cleaned up
- **Fix:** Delete `app/app/` directory entirely
- **Priority:** MEDIUM

### PROB-018: DALL-E 3 image generation not in V2 generation
- **Description:** The V2 generate page (/dashboard/generate) calls `/api/v2/generate/caption` which generates captions but no image
- **Root Cause:** V2 caption endpoint doesn't generate images
- **Fix:** After caption, optionally call image generation endpoint or integrate into V2 flow
- **Priority:** MEDIUM

### PROB-019: No error boundary in dashboard
- **Description:** Any unhandled React error causes the entire dashboard to white-screen
- **Root Cause:** No React Error Boundary implemented
- **Fix:** Create ErrorBoundary component wrapping dashboard content area
- **Priority:** HIGH

### PROB-020: Register endpoint missing email validation
- **Description:** /api/auth/register may not validate email format
- **Root Cause:** No email regex validation
- **Fix:** Add email format check and minimum password length (8+ chars) validation
- **Priority:** MEDIUM

---

## PART 3 — FIXES & IMPLEMENTATION PLAN

---

### FIX-001: Connect Library to real API

**Frontend (app/dashboard/library/page.tsx):**
```typescript
import { useMedia } from '@/lib/hooks/useApi';
import { useEffect, useState } from 'react';

const { listFiles, uploadFile, deleteFile } = useMedia();

useEffect(() => {
  listFiles().then(data => setAssets(data.files || [])).catch(() => {});
}, []);

// Upload button handler
const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;
  uploadFile(file).then(() => listFiles().then(data => setAssets(data.files || [])));
};

// Delete handler
const handleDelete = async (filename: string) => {
  await deleteFile(filename);
  setAssets(prev => prev.filter(a => a.filename !== filename));
};
```

**Backend:** /api/upload/route.ts already exists with GET (list), POST (upload), DELETE.

**Database:** Asset model already has all required fields.

---

### FIX-002: Wire Save & Post button in Generate page

**Frontend (app/dashboard/generate/page.tsx):**
```typescript
import { usePosts } from '@/lib/hooks/useApi';

const { create } = usePosts();

const handleSaveAndPost = async () => {
  if (!result) return;
  try {
    await create({
      type: postType,
      content: result.fullCaption,
      platforms: [selectedPlatform],
      status: 'DRAFT',
    });
    success('Post saved as draft!');
    router.push('/dashboard/posts');
  } catch (err) {
    toastError('Failed to save post');
  }
};
```

---

### FIX-003: Fix JWT expiry handling

**Frontend (lib/hooks/useApi.ts):**
```typescript
const response = await fetch(endpoint, { ...options, headers });

if (response.status === 401) {
  // Session expired
  logout();
  window.location.href = '/auth/login';
  throw new Error('Session expired');
}

if (!response.ok) {
  const error = await response.json().catch(() => ({}));
  throw new Error(error.error || `API error: ${response.status}`);
}
```

---

### FIX-004: Fix monthly limit enforcement

**Option A — Add postsUsed migration (recommended):**
```sql
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "postsUsed" INTEGER DEFAULT 0;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "imagesGenerated" INTEGER DEFAULT 0;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "lastResetAt" TIMESTAMP DEFAULT NOW();
```

**Option B — Count from Post model (no migration):**
```typescript
// In generate/content/route.ts
const now = new Date();
const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
const monthlyPostCount = await prisma.post.count({
  where: {
    userId: auth.user!.userId,
    createdAt: { gte: startOfMonth }
  }
});
if (monthlyPostCount >= planLimit) {
  return NextResponse.json({ error: 'Monthly limit reached' }, { status: 429 });
}
```

---

### FIX-005: Dark mode for all pages

**For every page using inline styles, create a style factory:**
```typescript
// lib/utils/styles.ts
export const cardStyle = (theme?: string) => ({
  background: 'var(--background)',
  color: 'var(--foreground)',
  border: '1px solid var(--border)',
  borderRadius: '16px',
  padding: '24px',
  boxShadow: 'var(--shadow-sm)',
});

export const inputStyle = {
  background: 'var(--background)',
  color: 'var(--foreground)',
  border: '1.5px solid var(--border)',
  borderRadius: '8px',
  padding: '10px 12px',
  fontSize: '14px',
  width: '100%',
  boxSizing: 'border-box' as const,
  outline: 'none',
};
```

---

### FIX-006: Add mobile-responsive sidebar

**Frontend (app/dashboard/components/Sidebar.tsx) — add CSS:**
```css
@media (max-width: 768px) {
  .sidebar {
    position: fixed;
    z-index: 100;
    transform: translateX(-100%);
    transition: transform 0.3s ease;
  }
  .sidebar.mobile-open {
    transform: translateX(0);
  }
}
```

**TopBar.tsx — add hamburger button for mobile:**
```typescript
const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
// Pass mobileMenuOpen + setMobileMenuOpen down from DashboardLayout
```

---

### FIX-007: Add template delete confirmation

**Frontend (app/dashboard/templates/page.tsx):**
```typescript
const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

// Replace direct delete with:
onClick={() => setDeleteConfirmId(t.id)}

// Add confirmation modal:
{deleteConfirmId && (
  <ConfirmModal
    message="Delete this template permanently?"
    onConfirm={() => { handleDelete(deleteConfirmId); setDeleteConfirmId(null); }}
    onCancel={() => setDeleteConfirmId(null)}
  />
)}
```

---

### FIX-008: Add register UI page

**Create app/auth/register/page.tsx:**
```typescript
'use client';
// Form: email, password, confirmPassword, firstName (optional)
// Call: useAuth().register(email, password, firstName)
// On success: redirect to /dashboard or /onboarding
```

---

### FIX-009: Add Settings link to sidebar

**Sidebar.tsx — add to footer section:**
```typescript
import { Settings } from 'lucide-react';

// In footer, above logout:
<Link href="/dashboard/settings" className="nav-item-sm" title="Settings">
  <Settings size={18} />
  {!collapsed && <span>Settings</span>}
</Link>
```

---

### FIX-010: Delete orphaned app/app directory

**Run in terminal:**
```bash
rm -rf app/app
```
Then verify no imports reference `app/app/api/...` paths.

---

### FIX-011: Add Error Boundary

**Create app/dashboard/components/ErrorBoundary.tsx:**
```typescript
'use client';
import { Component, ReactNode } from 'react';

export class ErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '40px', textAlign: 'center' }}>
          <h3>Something went wrong</h3>
          <button onClick={() => window.location.reload()}>Reload</button>
        </div>
      );
    }
    return this.props.children;
  }
}
```

---

### FIX-012: Fix template type data in database

```sql
-- Migrate old template types to new types
UPDATE "Template" SET type = 'IMAGE' WHERE type IN ('POST', 'REEL', 'VIDEO', 'AD');
UPDATE "Post" SET type = 'IMAGE' WHERE type IN ('POST', 'REEL', 'VIDEO', 'AD');
```

---

## PART 4 — SOCIAL MEDIA API INTEGRATIONS

---

### 4.1 INTEGRATION ARCHITECTURE OVERVIEW

```
┌─────────────────────────────────────────────────────────┐
│                    FLOWLY BACKEND                        │
│                                                          │
│  /api/social/connect/[platform]/route.ts                 │
│  /api/social/callback/[platform]/route.ts                │
│  /api/social/publish/route.ts                            │
│  /api/social/accounts/route.ts                           │
│  /api/social/accounts/[id]/route.ts                      │
│                                                          │
│  SocialAccount model in PostgreSQL                       │
│  AES-256-GCM encrypted token storage                     │
└─────────────────────────────────────────────────────────┘
         │                    │                   │
         ▼                    ▼                   ▼
   Meta Graph API       Meta Graph API        TikTok API v2
   v18.0 (Facebook)     v18.0 (Instagram)    Content Posting
```

---

### 4.2 FACEBOOK INTEGRATION

**OAuth Flow:**
1. User clicks "Connect Facebook" → redirect to:
   ```
   https://www.facebook.com/v18.0/dialog/oauth
     ?client_id={FACEBOOK_APP_ID}
     &redirect_uri={BASE_URL}/api/social/callback/facebook
     &scope=pages_manage_posts,pages_read_engagement,publish_video
     &response_type=code
     &state={encrypted_csrf_token}
   ```
2. User grants permissions on Facebook
3. Facebook redirects to `/api/social/callback/facebook?code={auth_code}`
4. Exchange code for access token:
   ```
   POST https://graph.facebook.com/v18.0/oauth/access_token
     ?client_id={APP_ID}
     &client_secret={APP_SECRET}
     &redirect_uri={REDIRECT_URI}
     &code={code}
   ```
5. Fetch list of managed Pages via `/me/accounts`
6. Store **Page access token** (not user token) in SocialAccount table

**Required Permissions:**
- `pages_manage_posts` — create/delete posts on Pages
- `pages_read_engagement` — read metrics
- `instagram_basic` — Instagram account access
- `instagram_content_publish` — publish to Instagram

**Publishing a post to Facebook Page:**
```typescript
POST https://graph.facebook.com/v18.0/{page_id}/photos
  body: { url: imageUrl, message: caption, access_token: pageToken }
```

**Token Storage:**
```typescript
// Encrypt before storing
import { createCipheriv, randomBytes } from 'crypto';

function encryptToken(token: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', ENCRYPTION_KEY, iv);
  // ... return iv + authTag + encrypted as base64
}
```

**API Route — /api/social/connect/facebook/route.ts:**
```typescript
export async function GET() {
  const state = generateCsrfToken();
  setCsrfCookie(state);
  return NextResponse.redirect(buildFacebookOAuthUrl(state));
}
```

---

### 4.3 INSTAGRAM INTEGRATION

**Note:** Instagram posting requires a **Facebook Page linked to an Instagram Business Account**.

**OAuth Flow:** Same as Facebook — use Meta's unified OAuth.

**Publishing to Instagram:**

**Step 1 — Create Media Container:**
```
POST https://graph.facebook.com/v18.0/{ig_user_id}/media
  body: {
    image_url: "https://...",    // or video_url
    caption: "Your caption...",
    access_token: token
  }
→ Returns: { id: "creation_id" }
```

**Step 2 — Publish Container:**
```
POST https://graph.facebook.com/v18.0/{ig_user_id}/media_publish
  body: {
    creation_id: "...",
    access_token: token
  }
→ Returns: { id: "post_id" }
```

**Carousel Posts (Instagram):**
```
POST /v18.0/{ig_user_id}/media
  body: {
    media_type: "CAROUSEL",
    children: ["child_id_1", "child_id_2", ...],
    caption: "...",
    access_token: token
  }
```

**Required API Keys:**
```env
FACEBOOK_APP_ID=your_app_id
FACEBOOK_APP_SECRET=your_app_secret
FACEBOOK_CALLBACK_URL=https://yourapp.com/api/social/callback/facebook
```

---

### 4.4 TIKTOK INTEGRATION

**TikTok Developer API v2:**

**OAuth Flow:**
1. Redirect user to:
   ```
   https://www.tiktok.com/v2/auth/authorize
     ?client_key={CLIENT_KEY}
     &scope=user.info.basic,video.upload,video.publish
     &response_type=code
     &redirect_uri={CALLBACK_URL}
     &state={csrf_token}
   ```
2. Exchange code for access token:
   ```
   POST https://open.tiktokapis.com/v2/oauth/token
     body: { client_key, client_secret, code, grant_type: "authorization_code", redirect_uri }
   ```
3. Store access_token + refresh_token

**Publishing a Video to TikTok:**
```typescript
// Step 1: Initialize upload
POST https://open.tiktokapis.com/v2/post/publish/video/init
  headers: { Authorization: Bearer {access_token} }
  body: {
    post_info: {
      title: caption,
      privacy_level: "SELF_ONLY", // or PUBLIC_TO_EVERYONE
      disable_duet: false,
      disable_comment: false,
      disable_stitch: false,
      video_cover_timestamp_ms: 1000
    },
    source_info: {
      source: "PULL_FROM_URL",
      video_url: "https://..."
    }
  }
```

**Required API Keys:**
```env
TIKTOK_CLIENT_KEY=your_client_key
TIKTOK_CLIENT_SECRET=your_client_secret
TIKTOK_CALLBACK_URL=https://yourapp.com/api/social/callback/tiktok
```

---

### 4.5 DATABASE SCHEMA FOR SOCIAL ACCOUNTS

```prisma
model SocialAccount {
  id             String    @id @default(cuid())
  userId         String
  platform       String    // "facebook" | "instagram" | "tiktok"
  platformUserId String    // The user ID on that platform
  platformName   String?   // Display name of the connected account
  accessToken    String    // AES-256-GCM encrypted
  refreshToken   String?   // AES-256-GCM encrypted
  tokenExpiresAt DateTime?
  pageId         String?   // Facebook Page ID (for FB/IG posting)
  pageToken      String?   // Facebook Page access token (encrypted)
  isActive       Boolean   @default(true)
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, platform, platformUserId])
  @@index([userId])
}
```

---

### 4.6 PUBLISHING FLOW

```
User clicks "Publish" on a post
→ /api/social/publish route called with { postId, platforms[] }
→ For each platform:
    → Load SocialAccount for that platform
    → Decrypt access token
    → Check if token expired (refresh if needed)
    → Upload image/video to platform CDN if required
    → Call platform publishing API
    → Update Post.status = 'PUBLISHED' or 'FAILED'
    → Store returned platform post ID
    → Create notification for user
```

---

### 4.7 SCHEDULED PUBLISHING (CRON JOB)

**Option A — Vercel Cron Jobs (recommended for Vercel deployment):**
```typescript
// app/api/cron/publish/route.ts
export async function GET(request: Request) {
  // Verify Vercel cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Find all posts scheduled for now (±5 min)
  const now = new Date();
  const posts = await prisma.post.findMany({
    where: {
      status: 'SCHEDULED',
      scheduledFor: { lte: new Date(now.getTime() + 5 * 60000) }
    },
    include: { user: { include: { socialAccounts: true } } }
  });

  for (const post of posts) {
    await publishPostToAllPlatforms(post);
  }
}
```

**vercel.json:**
```json
{
  "crons": [
    { "path": "/api/cron/publish", "schedule": "* * * * *" }
  ]
}
```

---

### 4.8 TOKEN REFRESH STRATEGY

```typescript
// lib/social/tokens.ts
export async function getValidToken(account: SocialAccount) {
  const decrypted = decryptToken(account.accessToken);

  if (account.tokenExpiresAt && account.tokenExpiresAt < new Date()) {
    // Token expired — try refresh
    if (account.refreshToken) {
      const newToken = await refreshPlatformToken(
        account.platform,
        decryptToken(account.refreshToken)
      );
      await prisma.socialAccount.update({
        where: { id: account.id },
        data: {
          accessToken: encryptToken(newToken.access_token),
          tokenExpiresAt: new Date(Date.now() + newToken.expires_in * 1000)
        }
      });
      return newToken.access_token;
    }
    throw new Error('Token expired and no refresh token available');
  }

  return decrypted;
}
```

---

### 4.9 ERROR HANDLING FOR SOCIAL PUBLISHING

```typescript
try {
  await publishToInstagram(post, account);
  await prisma.post.update({
    where: { id: post.id },
    data: { status: 'PUBLISHED', publishedAt: new Date() }
  });
} catch (error: any) {
  await prisma.post.update({
    where: { id: post.id },
    data: { status: 'FAILED' }
  });
  // Create error notification
  await prisma.notification.create({
    data: {
      userId: post.userId,
      type: 'ERROR',
      title: 'Publishing failed',
      message: `Failed to publish to Instagram: ${error.message}`,
    }
  });
}
```

---

## PART 5 — FINAL ARCHITECTURE UPDATE

---

### 5.1 COMPLETE FILE STRUCTURE (target state)

```
flowly/
├── app/                              # Next.js App Router (root)
│   ├── api/
│   │   ├── auth/
│   │   │   ├── login/route.ts
│   │   │   └── register/route.ts
│   │   ├── generate/
│   │   │   └── content/route.ts      # Legacy v1 endpoint
│   │   ├── posts/
│   │   │   ├── [id]/route.ts
│   │   │   └── route.ts
│   │   ├── templates/
│   │   │   ├── [id]/route.ts         ← FIXED (moved from app/app/)
│   │   │   └── route.ts              ← FIXED (moved from app/app/)
│   │   ├── social/
│   │   │   ├── accounts/route.ts     ← NEW
│   │   │   ├── accounts/[id]/route.ts ← NEW
│   │   │   ├── connect/[platform]/route.ts ← NEW
│   │   │   └── callback/[platform]/route.ts ← NEW
│   │   ├── publish/route.ts          ← NEW
│   │   ├── notifications/route.ts    ← NEW
│   │   ├── cron/publish/route.ts     ← NEW
│   │   ├── subscription/
│   │   │   ├── billing/route.ts
│   │   │   ├── checkout/route.ts
│   │   │   └── webhook/route.ts
│   │   ├── upload/route.ts
│   │   ├── user/profile/route.ts
│   │   ├── ai/
│   │   │   ├── ideas/route.ts
│   │   │   └── planner/route.ts
│   │   └── v2/generate/
│   │       ├── caption/route.ts
│   │       └── carousel/route.ts
│   │
│   ├── auth/
│   │   ├── login/page.tsx
│   │   └── register/page.tsx         ← NEW
│   │
│   ├── dashboard/
│   │   ├── layout.tsx
│   │   ├── page.tsx                  ← FIXED (removed REEL)
│   │   ├── components/
│   │   │   ├── Sidebar.tsx           ← FIXED (added Billing, Logout, Settings)
│   │   │   ├── TopBar.tsx
│   │   │   └── ErrorBoundary.tsx     ← NEW
│   │   ├── generate/page.tsx         ← FIXED (wired Save & Post)
│   │   ├── library/page.tsx          ← FIXED (connected to real API)
│   │   ├── templates/page.tsx        ← FIXED (removed REEL/VIDEO/AD)
│   │   ├── automations/page.tsx      ← EXISTS (coming soon)
│   │   ├── billing/page.tsx          ← EXISTS
│   │   ├── settings/page.tsx         ← EXISTS (add Settings link in sidebar)
│   │   ├── social/page.tsx           ← ENHANCED (OAuth connect UI)
│   │   ├── posts/page.tsx            ← EXISTS
│   │   ├── analytics/page.tsx        ← EXISTS
│   │   ├── calendar/page.tsx         ← EXISTS
│   │   ├── planner/page.tsx          ← EXISTS
│   │   └── ideas/page.tsx            ← EXISTS
│   │
│   ├── globals.css                   ← FIXED (CSS variables for dark mode)
│   ├── layout.tsx
│   ├── page.tsx                      # Landing page
│   ├── pricing/page.tsx
│   └── not-found.tsx                 ← NEW (branded 404)
│
├── lib/
│   ├── ai/
│   │   ├── claude.ts
│   │   ├── caption-generator.ts
│   │   ├── carousel-generator.ts
│   │   └── prompts/
│   │       ├── caption.ts
│   │       └── carousel.ts
│   ├── auth/
│   │   ├── jwt.ts
│   │   └── middleware.ts
│   ├── context/
│   │   ├── AuthContext.tsx
│   │   ├── ThemeContext.tsx
│   │   └── ToastContext.tsx
│   ├── db/prisma.ts
│   ├── features/permissions.ts
│   ├── hooks/useApi.ts               ← ENHANCED (401 interceptor)
│   ├── social/                       ← NEW
│   │   ├── tokens.ts                 # Token encryption/decryption
│   │   ├── meta.ts                   # Facebook/Instagram API calls
│   │   └── tiktok.ts                 # TikTok API calls
│   ├── utils/
│   │   └── styles.ts                 ← NEW (theme-aware style factory)
│   └── stripe/stripe.ts
│
└── prisma/
    └── schema.prisma                 ← UPDATE (add Notification model, fix migrations)
```

---

### 5.2 UPDATED NAVIGATION STRUCTURE

**Sidebar (primary navigation):**
```
┌─────────────────┐
│ ⚡ Flowly  2.0  │
├─────────────────┤
│ ✦ Generate  AI  │  /dashboard/generate
│ 🖼 Library      │  /dashboard/library
│ ◇ Templates    │  /dashboard/templates
│ ⚡ Automations  │  /dashboard/automations
│ 💳 Billing      │  /dashboard/billing
├─────────────────┤
│ 🌙 Dark Mode    │  toggle
│ [User Avatar]   │
│ ⚙ Settings     │  /dashboard/settings
│ ↗ Logout       │  logout()
└─────────────────┘
```

**TopBar (secondary actions):**
```
┌──────────────────────────────────────────────────────────┐
│  🔍 Search...  ⌘K    [⭐ Upgrade]  [+ New Post]  [🔔 3]  │
└──────────────────────────────────────────────────────────┘
```

---

### 5.3 UPDATED DATA FLOW

```
Content Generation Flow (V2):
──────────────────────────────
User Input
  → Platform, Tone, Prompt, PostType
  → /api/v2/generate/caption
    → withAuth() middleware
    → Check monthly limit (count from Post model)
    → Inject brand memory context
    → Claude AI streaming response
  → Structured caption displayed (hook, body, CTA, hashtags)
  → Optional: Generate image via /api/generate/content (DALL-E)
  → "Save & Post" → /api/posts (create draft)
  → Optional: "Publish Now" → /api/publish (social API call)
  → "Schedule" → /api/posts (create with scheduledFor date)

Publishing Flow:
─────────────────
Post created with scheduledFor
  → Cron job runs every minute (/api/cron/publish)
  → Finds posts where status=SCHEDULED AND scheduledFor <= now
  → For each post:
    → Load SocialAccount(s) for requested platforms
    → Decrypt token, check expiry, refresh if needed
    → Call platform API (Meta/TikTok)
    → Update Post.status → PUBLISHED or FAILED
    → Create Notification record
```

---

### 5.4 UPDATED PRISMA SCHEMA ADDITIONS

```prisma
// Add to schema.prisma:

model Notification {
  id        String   @id @default(cuid())
  userId    String
  type      String   // "SUCCESS" | "ERROR" | "INFO" | "WARNING"
  title     String
  message   String
  read      Boolean  @default(false)
  createdAt DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, read])
}

// Add to User model:
notifications Notification[]

// Fix User model - uncomment and migrate:
postsUsed       Int?     @default(0)
imagesGenerated Int?     @default(0)
lastResetAt     DateTime? @default(now())
```

---

### 5.5 PERFORMANCE ARCHITECTURE

**Caching Strategy:**
```
Static pages:          Next.js static generation (ISR)
API responses:         SWR with 30s stale-while-revalidate
User session:          localStorage + React Context
Image optimization:    Next.js Image component + CDN
Template list:         Client-side cache, invalidate on mutation
```

**Code Splitting:**
- Dashboard pages are already split by Next.js App Router
- Heavy components (editor, carousel builder) loaded lazily:
  ```typescript
  const CarouselBuilder = dynamic(() => import('./CarouselBuilder'), {
    loading: () => <Skeleton />,
    ssr: false
  });
  ```

**Database Optimization:**
```sql
-- Add missing indexes for common queries
CREATE INDEX IF NOT EXISTS idx_post_user_status ON "Post"("userId", "status");
CREATE INDEX IF NOT EXISTS idx_post_user_created ON "Post"("userId", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS idx_template_user ON "Template"("userId");
CREATE INDEX IF NOT EXISTS idx_social_account_user ON "SocialAccount"("userId", "platform");
CREATE INDEX IF NOT EXISTS idx_notification_user_read ON "Notification"("userId", "read");
```

---

## PART 6 — SUGGESTIONS & IMPROVEMENTS

---

### 6.1 PRODUCT EXPERIENCE

**P1 — AI Streaming Responses**
- Replace batch Claude API calls with streaming using ReadableStream
- Show text appearing word by word (like ChatGPT)
- Users feel faster response even if total time is same
- Implementation: Use `stream: true` in Anthropic SDK, pipe to SSE

**P2 — Canvas-based Post Editor**
- Add Fabric.js or Konva.js editor for visual post composition
- Drag-and-drop images, text overlays, filters
- Export as PNG/JPG for social posting
- Critical for competing with Canva/Buffer

**P3 — Carousel Builder UI**
- Multi-slide editor with slide reordering (drag-and-drop)
- Individual slide content editing (text, background, image)
- Live preview panel showing how carousel looks on Instagram
- Export all slides as individual images

**P4 — Brand Kit Visual Editor**
- Color palette picker (not just text input)
- Font selector (Google Fonts integration)
- Logo upload and preview
- Apply brand kit to generated content automatically

**P5 — Content Calendar (Full)**
- Monthly grid view with posts placed on correct days
- Drag-and-drop to reschedule posts
- Color-coding by platform
- Quick-add post from calendar click

---

### 6.2 AI & GENERATION QUALITY

**P6 — Platform-Specific AI Profiles**
```typescript
const PLATFORM_PROMPTS = {
  instagram: "Write a visually-engaging caption with strong storytelling...",
  linkedin: "Write a professional, thought-leadership post...",
  facebook: "Write a community-focused, conversational post...",
  tiktok: "Write a trending, energetic caption with Gen-Z appeal..."
};
```

**P7 — A/B Caption Variants**
- Generate 3 caption variants per request
- User selects favorite
- Winning variant fed back as preference signal

**P8 — AI Content Ideas Feed**
- Weekly trending topics in user's industry (via web search integration)
- Personalized content suggestions based on past post performance
- Seasonal content reminders (holidays, industry events)

**P9 — Caption History**
- Store all generated captions, not just saved posts
- User can go back and use an older generated caption
- "Generation history" tab in generate page

---

### 6.3 SOCIAL MEDIA FEATURES

**P10 — Direct Scheduling UI**
- DateTimePicker component in post creation
- Visual calendar showing scheduled posts
- Timezone-aware scheduling (user can set preferred timezone)

**P11 — Analytics Dashboard (real data)**
- Connect to Meta Insights API for real engagement data
- Charts: reach, impressions, engagement rate by post
- Best posting time recommendation based on historical data

**P12 — Cross-Platform Post Adaptation**
- User writes one caption → AI adapts it for each selected platform
- Instagram: add hashtags, emojis
- LinkedIn: remove hashtags, add professional framing
- TikTok: add trending sounds reference, shorter copy

**P13 — Social Inbox**
- Pull comments from all connected accounts into one view
- Reply directly from Flowly interface
- Filter by unanswered comments

---

### 6.4 TECHNICAL IMPROVEMENTS

**P14 — Database Connection Pooling**
```typescript
// lib/db/prisma.ts
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';

// Use connection pool for production
const prisma = new PrismaClient({
  datasources: {
    db: { url: process.env.DATABASE_URL + '?connection_limit=10&pool_timeout=20' }
  }
});
```

**P15 — Redis for Session & Rate Limiting**
```typescript
// Instead of localStorage tokens (vulnerable to XSS)
// Use httpOnly cookies + Redis session store
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL,
  token: process.env.UPSTASH_REDIS_TOKEN,
});
```

**P16 — Image Storage via Cloudflare R2 or AWS S3**
- Current `/api/upload` likely stores files locally
- Use object storage for production scalability
- CDN delivery for fast image loading worldwide

**P17 — Environment Variable Validation**
```typescript
// lib/env.ts — validate all required env vars on startup
const requiredEnvVars = [
  'DATABASE_URL',
  'JWT_SECRET',
  'ANTHROPIC_API_KEY',
  'STRIPE_SECRET_KEY',
  'FACEBOOK_APP_ID',
  'FACEBOOK_APP_SECRET',
  'TIKTOK_CLIENT_KEY',
  'TOKEN_ENCRYPTION_KEY',
];

for (const key of requiredEnvVars) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}
```

**P18 — Structured Logging**
```typescript
// Use a proper logger instead of console.log
import pino from 'pino';
const logger = pino({ level: 'info' });
logger.info({ userId, action: 'generate', postType }, 'Content generated');
```

**P19 — Webhook Retry Logic**
- Stripe webhooks can fail — add retry queue
- Use Vercel Queue or Bull.js for reliable job processing
- Dead letter queue for failed social posts

**P20 — TypeScript Strict Mode**
```json
// tsconfig.json — enable all strict checks
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true,
    "exactOptionalPropertyTypes": true
  }
}
```

---

### 6.5 UX & DESIGN IMPROVEMENTS

**P21 — Onboarding Flow**
- After registration, 5-step onboarding wizard:
  1. Brand name + industry
  2. Brand tone (select from examples)
  3. Brand colors (color picker)
  4. Connect first social account
  5. Generate first post (interactive demo)

**P22 — Empty States with CTAs**
- Every empty list should have an illustrated empty state with a primary CTA
- Templates empty → "Create your first template"
- Posts empty → "Generate your first post"
- Library empty → "Upload your first image"

**P23 — Keyboard Shortcuts**
- `⌘K` → open search (already in TopBar design)
- `⌘G` → go to generate
- `⌘T` → go to templates
- Show keyboard shortcut hints in tooltips

**P24 — Loading States & Skeletons**
- Every data-loading component should show skeleton placeholders
- Skeleton matches exact shape of loaded content
- No "Loading..." text spinners

**P25 — Toast Notification Improvements**
- Toasts appear in bottom-right corner
- Auto-dismiss after 3 seconds
- Click to dismiss manually
- Stack multiple toasts with max 3 visible

**P26 — Progressive Web App (PWA)**
- Add manifest.json and service worker
- "Add to home screen" on mobile
- Offline mode for drafts

**P27 — Internationalization (i18n)**
- UI currently mixes Romanian and English
- Standardize to one language (English recommended for international market)
- Or implement i18n with next-intl package for full multi-language support

---

### 6.6 BUSINESS & MONETIZATION

**P28 — Usage Analytics for Operators**
- Admin dashboard showing: total users, active users, generation volume
- Revenue metrics: MRR, churn rate, plan distribution
- Feature usage: which features are used most

**P29 — Team Workspaces**
- Multiple team members per account
- Role-based access (Admin, Editor, Viewer)
- Shared brand kit and template library

**P30 — White-Label Option**
- ENTERPRISE plan allows custom domain (flowly.yourcompany.com)
- Custom logo in sidebar
- Remove "Powered by Flowly" branding
- Higher price point for agency market

**P31 — API Access for Developers**
- ENTERPRISE plan gets API access
- Generate captions via API (for custom integrations)
- Webhooks for post status updates
- SDKs for common languages

**P32 — Affiliate Program**
- Users earn 20% revenue share for referrals
- Dashboard shows referral stats and earnings
- Automatic payout via Stripe Connect

---

### PRIORITY MATRIX

| # | Improvement | Impact | Effort | Priority |
|---|-------------|--------|--------|----------|
| Fix-001 | Connect Library to API | HIGH | LOW | P0 |
| Fix-002 | Wire Save & Post button | HIGH | LOW | P0 |
| Fix-003 | JWT expiry handling | HIGH | LOW | P0 |
| Fix-004 | Monthly limit from DB | HIGH | MEDIUM | P0 |
| Fix-005 | Dark mode all pages | HIGH | MEDIUM | P0 |
| Fix-010 | Delete app/app dir | MEDIUM | LOW | P1 |
| P1 | AI Streaming | HIGH | MEDIUM | P1 |
| P5 | Content Calendar | HIGH | HIGH | P1 |
| Part 4 | Social Media OAuth | CRITICAL | HIGH | P1 |
| P14 | DB Connection Pool | HIGH | LOW | P1 |
| P2 | Canvas Editor | HIGH | VERY HIGH | P2 |
| P21 | Onboarding Flow | HIGH | MEDIUM | P2 |
| P10 | Scheduling UI | HIGH | MEDIUM | P2 |
| P11 | Real Analytics | HIGH | HIGH | P2 |
| P29 | Team Workspaces | VERY HIGH | VERY HIGH | P3 |
| P30 | White-Label | HIGH | HIGH | P3 |

---

*Document generated: February 2026 | Flowly 2.0 Platform*
*Base implementation: Next.js 16.1.6, Prisma 5.22.0, Claude Sonnet 4.6, PostgreSQL (Neon)*
