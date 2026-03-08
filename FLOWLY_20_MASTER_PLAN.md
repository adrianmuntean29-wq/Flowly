# FLOWLY 2.0 — MASTER ARCHITECTURE PLAN
**Senior Full-Stack Architect Document**
**Date**: February 2026
**Version**: 2.0
**Status**: Living Document — Updated per phase

---

## SELF-CONTINUATION SYSTEM

### How to resume work
When you send **CONTINUE_WITH_NEXT_TASK**, the system resumes from the next incomplete checkpoint.
Each phase has a status: ✅ Done | 🔄 In Progress | ⬜ Pending

### Current Position
```
PHASE: 2 — AI Hub
TASK:  2.1 — Multi-provider routing
STATUS: In Progress
```

---

## STRATEGIC DIRECTION

Flowly is a **central AI orchestration platform**.
Flowly provides the interface, workflows, editor, posting, analytics.
Users bring their own AI API keys — Flowly never pays for AI usage.

**Supported AI Providers (user-supplied):**
| Provider | Use Case | Free Tier |
|----------|----------|-----------|
| Anthropic Claude | Text (primary) | Via user key |
| OpenAI GPT-4o | Text (alternative) | Via user key |
| Google Gemini 1.5 Flash | Text (free option) | 15 req/min free |
| Groq (Llama 3) | Text (fast/free) | 6000 tokens/min free |
| Stability AI | Images | Via user key |
| OpenAI DALL-E 3 | Images | Via user key |
| **Pollinations.ai** | Images | **100% FREE, no key** |
| Replicate | Images/Video | Via user key |
| ElevenLabs | Audio/Voice | Via user key |

---

## PHASES & CHECKPOINTS

### PHASE 1 — Foundation ✅ COMPLETE
- [x] Auth system (custom JWT)
- [x] Prisma schema (Posts, Assets, Carousels, Templates, SocialAccounts)
- [x] Dashboard layout + Sidebar
- [x] Generate captions (Claude)
- [x] Library (file upload/management)
- [x] Templates CRUD
- [x] Social OAuth (Meta, TikTok, LinkedIn)
- [x] Billing (Stripe)
- [x] Error boundaries
- [x] Dark/Light theme

### PHASE 2 — AI Hub 🔄 IN PROGRESS
- [x] Social media OAuth routes
- [ ] **2.1** UserApiKey model (DB)
- [ ] **2.2** /api/user/api-keys CRUD
- [ ] **2.3** Multi-provider AI router (lib/ai/providers.ts)
- [ ] **2.4** Free image generation (Pollinations.ai)
- [ ] **2.5** Improved text generation prompts
- [ ] **2.6** Gemini + Groq text support
- [ ] **2.7** /dashboard/settings/integrations UI

### PHASE 3 — Image Generation ⬜ PENDING
- [ ] **3.1** Image generation page (/dashboard/generate/image)
- [ ] **3.2** Pollinations integration (free, no key)
- [ ] **3.3** Stability AI integration (user key)
- [ ] **3.4** DALL-E 3 integration (user key)
- [ ] **3.5** Style picker UI (photorealistic, illustration, minimalist...)
- [ ] **3.6** Aspect ratio selector (1:1, 4:5, 16:9, 9:16)
- [ ] **3.7** Variation generation
- [ ] **3.8** Save to library

### PHASE 4 — Carousel Builder ⬜ PENDING
- [ ] **4.1** AI slide structure generation
- [ ] **4.2** AI text per slide
- [ ] **4.3** AI background image per slide (Pollinations)
- [ ] **4.4** Slide editor (Fabric.js canvas)
- [ ] **4.5** Font/color/size controls
- [ ] **4.6** Drag & drop elements
- [ ] **4.7** Undo/redo (30 steps)
- [ ] **4.8** Regenerate individual slides
- [ ] **4.9** Export carousel as images

### PHASE 5 — Editor ⬜ PENDING
- [ ] **5.1** Fabric.js canvas setup
- [ ] **5.2** Text tool (font, size, color, alignment)
- [ ] **5.3** Shape tools (rectangle, circle, line)
- [ ] **5.4** Image placement + resize
- [ ] **5.5** Overlay/filter effects
- [ ] **5.6** Layer management
- [ ] **5.7** Save state to DB (editorState JSON)
- [ ] **5.8** Export to PNG/JPG
- [ ] **5.9** Undo/redo stack

### PHASE 6 — Analytics ⬜ PENDING
- [ ] **6.1** Analytics data model (PostAnalytics)
- [ ] **6.2** Webhook receivers (Meta, TikTok, LinkedIn)
- [ ] **6.3** Analytics dashboard UI
- [ ] **6.4** AI recommendations engine
- [ ] **6.5** Best posting time suggestions
- [ ] **6.6** Content improvement suggestions
- [ ] **6.7** Topic ideas based on performance

### PHASE 7 — UI/UX Polish ⬜ PENDING
- [ ] **7.1** Complete design system (CSS variables)
- [ ] **7.2** Dark theme audit + fixes
- [ ] **7.3** Dashboard redesign
- [ ] **7.4** Generate page redesign
- [ ] **7.5** Notification system (working)
- [ ] **7.6** Command palette (Cmd+K)
- [ ] **7.7** Keyboard shortcuts
- [ ] **7.8** Loading skeletons everywhere
- [ ] **7.9** Mobile responsive

---

## DATABASE SCHEMA — ADDITIONS FOR v2.0

### New Model: UserApiKey
```prisma
model UserApiKey {
  id          String    @id @default(cuid())
  userId      String
  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  provider    String    // "anthropic", "openai", "gemini", "groq", "stability", "replicate"
  label       String    // User-defined name: "My Claude Key", "Work OpenAI"
  encryptedKey String   // AES-256-GCM encrypted

  isActive    Boolean   @default(true)
  isValid     Boolean?  // null = not yet validated
  lastUsed    DateTime?
  usageCount  Int       @default(0)

  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@unique([userId, provider, label])
  @@index([userId, isActive])
}
```

### New Model: PostAnalytics (Phase 6)
```prisma
model PostAnalytics {
  id          String    @id @default(cuid())
  postId      String    @unique
  post        Post      @relation(fields: [postId], references: [id], onDelete: Cascade)

  platform    String
  impressions Int       @default(0)
  reach       Int       @default(0)
  likes       Int       @default(0)
  comments    Int       @default(0)
  shares      Int       @default(0)
  saves       Int       @default(0)

  fetchedAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}
```

---

## AI PROVIDER ARCHITECTURE

### Provider Priority (per request)
```
1. User's configured key for that provider
2. Platform fallback key (for demos/free tier)
3. Free API (Pollinations for images)
4. Error: "Please add API key in Settings → Integrations"
```

### Provider Capabilities Matrix
```
Provider       | Text | Images | Speed  | Quality | Free?
-------------- | ---- | ------ | ------ | ------- | -----
Claude Sonnet  | ✅   | ❌     | Fast   | Best    | User key
GPT-4o         | ✅   | ❌     | Fast   | Best    | User key
Gemini Flash   | ✅   | ❌     | Fastest| Good    | Free tier
Groq Llama 3   | ✅   | ❌     | Fastest| Good    | Free tier
Pollinations   | ❌   | ✅     | Medium | Good    | FREE ✅
DALL-E 3       | ❌   | ✅     | Slow   | Best    | User key
Stability SDXL | ❌   | ✅     | Medium | Great   | User key
```

---

## TEXT GENERATION — IMPROVED PROMPTS

### Problem with current prompts
- Too technical / robotic output
- No platform awareness
- No brand voice
- No hook/CTA structure

### New Prompt Architecture
```
SYSTEM: You are a professional social media copywriter for {brand}.
        Brand voice: {tone}. Industry: {industry}.
        Platform: {platform}. Target audience: {audience}.

USER:   Create a {postType} post about: {topic}

OUTPUT JSON:
{
  "hook": "Opening line that stops the scroll",
  "body": "Main content (2-3 paragraphs max)",
  "cta": "Clear call-to-action",
  "hashtags": ["#relevant", "#hashtags", "#max10"],
  "caption": "Full assembled caption",
  "alternativeHooks": ["Hook 2", "Hook 3"]
}
```

### Platform-Specific Rules
- **Instagram**: Casual, emoji-rich, 5-10 hashtags, CTA to bio link
- **LinkedIn**: Professional, no emoji, thought leadership, 3-5 hashtags
- **Facebook**: Conversational, question-based CTA, 2-3 hashtags
- **TikTok**: Very casual, trending language, 5-8 hashtags

---

## FREE AI IMPLEMENTATION

### Pollinations.ai (Images — No Key Needed)
```
URL: https://image.pollinations.ai/prompt/{encoded_prompt}
     ?width=1024&height=1024&seed={random}&model=flux
Method: GET → returns image directly
Cost: FREE, unlimited
Quality: Good (Flux model)
```

### Google Gemini Free Tier (Text)
```
Model: gemini-1.5-flash-latest
Free: 15 requests/minute, 1,000,000 tokens/day
Key: User gets free key from https://aistudio.google.com/app/apikey
```

### Groq Free Tier (Text)
```
Model: llama-3.1-70b-versatile
Free: 6,000 tokens/minute, no credit card needed
Key: User gets free key from https://console.groq.com
```

---

## 100 QA SCENARIOS

### Category: Authentication (TC-001 to TC-010)
| ID | Scenario | Expected | Severity |
|----|----------|----------|----------|
| TC-001 | Register with valid email/password | Account created, redirect to dashboard | Critical |
| TC-002 | Register with duplicate email | Error: "Email already in use" | High |
| TC-003 | Login with correct credentials | JWT issued, redirect to dashboard | Critical |
| TC-004 | Login with wrong password | Error: "Invalid credentials" | High |
| TC-005 | Access dashboard without auth | Redirect to /auth/login | Critical |
| TC-006 | JWT expires after timeout | Auto-logout, redirect to login | High |
| TC-007 | Refresh page after login | Session persists (localStorage JWT) | Medium |
| TC-008 | Logout clears session | JWT removed, redirect to login | High |
| TC-009 | Password with < 8 chars | Error: "Min 8 characters" | Medium |
| TC-010 | Email without @ symbol | Error: "Invalid email" | Medium |

### Category: Text Generation (TC-011 to TC-025)
| ID | Scenario | Expected | Severity |
|----|----------|----------|----------|
| TC-011 | Generate caption with no provider key | Error: "Add API key in Settings" | High |
| TC-012 | Generate with Claude key | Caption returned in JSON schema | Critical |
| TC-013 | Generate with Gemini key | Caption returned, correct format | Critical |
| TC-014 | Generate with Groq | Caption returned quickly | High |
| TC-015 | Generate Instagram caption | Contains hashtags, emoji | High |
| TC-016 | Generate LinkedIn post | Professional tone, no emoji | High |
| TC-017 | Invalid API key used | Error: "Invalid API key for provider" | High |
| TC-018 | Rate limit exceeded | Error: "Rate limit exceeded, try again in Xs" | Medium |
| TC-019 | Copy caption to clipboard | Toast: "Copied!" | Low |
| TC-020 | Save as Draft | Post created, redirect to /posts | High |
| TC-021 | Regenerate caption | New caption returned | Medium |
| TC-022 | Character counter shows correctly | Updates in real-time | Low |
| TC-023 | Platform selector changes prompt | Caption style adapts | High |
| TC-024 | Brand tone applied to generation | Tone matches user's brand settings | Medium |
| TC-025 | Empty prompt shows error | Validation: "Describe your post" | Medium |

### Category: Image Generation (TC-026 to TC-040)
| ID | Scenario | Expected | Severity |
|----|----------|----------|----------|
| TC-026 | Generate with Pollinations (free) | Image returned, saved to library | Critical |
| TC-027 | Generate with Stability AI key | Image returned, correct quality | Critical |
| TC-028 | Generate with DALL-E key | Image returned | High |
| TC-029 | Style selector: photorealistic | Image has photorealistic style | High |
| TC-030 | Style selector: illustration | Image has illustration style | High |
| TC-031 | Aspect ratio 1:1 | Square image generated | Medium |
| TC-032 | Aspect ratio 9:16 | Vertical image (Stories) | Medium |
| TC-033 | Aspect ratio 16:9 | Landscape image (LinkedIn) | Medium |
| TC-034 | Generate variations (x4) | 4 images generated | High |
| TC-035 | Save image to library | Image appears in Library page | Critical |
| TC-036 | Image generation loading state | Spinner shown, button disabled | Medium |
| TC-037 | Generation fails (network) | Error toast, retry button | High |
| TC-038 | Prompt with special characters | Encoded correctly | Low |
| TC-039 | Generated image displayed | No broken image URL | Critical |
| TC-040 | Download generated image | File downloads correctly | Medium |

### Category: Carousel Builder (TC-041 to TC-055)
| ID | Scenario | Expected | Severity |
|----|----------|----------|----------|
| TC-041 | Create carousel (3 slides) | 3 slides created in DB | Critical |
| TC-042 | Create carousel (10 slides max) | Limited to 10 slides | Medium |
| TC-043 | AI generates slide text | Each slide has heading/body | Critical |
| TC-044 | AI generates slide image | Background image per slide | High |
| TC-045 | Edit slide heading | Updates in real-time | High |
| TC-046 | Reorder slides drag-drop | Order updates correctly | High |
| TC-047 | Regenerate single slide | Only that slide regenerated | High |
| TC-048 | Add new slide | Slide added at end | Medium |
| TC-049 | Delete slide | Slide removed, order updated | Medium |
| TC-050 | Change slide background color | Color picker works | Low |
| TC-051 | Export carousel as images | ZIP/PNG download | High |
| TC-052 | Save carousel | Persists after refresh | Critical |
| TC-053 | Preview carousel (swipe view) | Slides show in sequence | High |
| TC-054 | Carousel respects brand colors | Uses user's brand palette | Medium |
| TC-055 | Empty topic shows error | Validation before generation | Medium |

### Category: Social Media (TC-056 to TC-065)
| ID | Scenario | Expected | Severity |
|----|----------|----------|----------|
| TC-056 | Connect Facebook (OAuth) | Account saved, shows username | Critical |
| TC-057 | Connect Instagram | Requires FB Page + IG Business | High |
| TC-058 | Connect TikTok | Account saved | High |
| TC-059 | Connect LinkedIn | Account saved | High |
| TC-060 | Disconnect account | Account removed from list | High |
| TC-061 | Token expires warning | Orange badge 7 days before | Medium |
| TC-062 | Invalid App ID in .env | Error: "OAuth not configured" (503) | High |
| TC-063 | OAuth state expired (>10min) | Error: "State expired, try again" | Medium |
| TC-064 | Multiple accounts same platform | Each shows as separate card | Medium |
| TC-065 | Reconnect refreshes token | New token stored, expiry updated | High |

### Category: Library (TC-066 to TC-073)
| ID | Scenario | Expected | Severity |
|----|----------|----------|----------|
| TC-066 | Upload image (JPG/PNG/WebP) | File saved, appears in library | Critical |
| TC-067 | Upload invalid file type | Error: "Only images allowed" | High |
| TC-068 | Upload file > 10MB | Error: "File too large" | Medium |
| TC-069 | Delete asset | Removed from library + storage | High |
| TC-070 | Download asset | File downloads | Medium |
| TC-071 | Library empty state | Shows "Upload first asset" CTA | Low |
| TC-072 | Library loading skeleton | Shown while fetching | Low |
| TC-073 | Search assets by name | Filtered results shown | Medium |

### Category: Templates (TC-074 to TC-080)
| ID | Scenario | Expected | Severity |
|----|----------|----------|----------|
| TC-074 | Create template | Saved to DB, appears in list | Critical |
| TC-075 | Edit template | Updates persisted | High |
| TC-076 | Delete template with confirmation | Template removed after confirm | High |
| TC-077 | Use template in generate | Pre-fills generate form | High |
| TC-078 | Filter by IMAGE type | Only IMAGE templates shown | Medium |
| TC-079 | Filter by CAROUSEL type | Only CAROUSEL templates shown | Medium |
| TC-080 | System templates visible to all | isSystem=true templates shown | Medium |

### Category: AI API Keys (TC-081 to TC-090)
| ID | Scenario | Expected | Severity |
|----|----------|----------|----------|
| TC-081 | Add valid Gemini key | Key saved, validated | Critical |
| TC-082 | Add invalid key | Error: "Key validation failed" | High |
| TC-083 | Add duplicate provider key | Replaces or adds as new label | Medium |
| TC-084 | Delete API key | Key removed, no longer used | High |
| TC-085 | Key shown masked (sk-...xxxx) | Never shows full key | Critical |
| TC-086 | Key used in generation | Correct provider used | Critical |
| TC-087 | Key rotation | Old key deactivated, new used | High |
| TC-088 | Key encryption at rest | Raw key never in DB | Critical |
| TC-089 | Test key button | Makes test API call | High |
| TC-090 | Key last-used timestamp | Updates after each use | Low |

### Category: UI/UX + Performance (TC-091 to TC-100)
| ID | Scenario | Expected | Severity |
|----|----------|----------|----------|
| TC-091 | Dark mode toggle | All pages switch to dark | High |
| TC-092 | Light mode toggle | All pages switch to light | High |
| TC-093 | Theme persists after refresh | localStorage theme applied | Medium |
| TC-094 | Sidebar collapse | Width reduces to 72px, icons only | Medium |
| TC-095 | Navigation speed | Page switches < 200ms (SPA) | High |
| TC-096 | Mobile responsive (< 768px) | Layout adapts, sidebar hidden | Medium |
| TC-097 | Error boundary catches crash | Error UI shown, not blank | High |
| TC-098 | 401 auto-logout | Session expires, redirects to login | High |
| TC-099 | Toast notifications | Appear and auto-dismiss | Medium |
| TC-100 | Keyboard: Cmd+K opens search | Command palette opens | Low |

---

## KNOWN ISSUES & FIXES

### Critical
1. **Carousel API uses next-auth** → Fixed: replaced with withAuth ✅
2. **Posts API uses wrong field names** → Fixed: title→caption, scheduledAt→scheduledFor ✅
3. **Templates API uses isPublic/content** → Fixed: isSystem/editorState ✅
4. **Social page useSearchParams without Suspense** → Fixed ✅

### High Priority
5. **No image generation UI** → Implement Phase 3
6. **Notifications button non-functional** → Wire to notification system (Phase 7)
7. **Automations page is placeholder** → Design automation rules engine

### Medium Priority
8. **No API key management** → Implement Phase 2 (current)
9. **Analytics all zeros** → Wire to social media webhooks (Phase 6)
10. **Editor not functional** → Implement Phase 5

---

## TECH STACK DECISIONS

### Image Editor: Fabric.js
- Battle-tested canvas library
- JSON serialization for save/restore
- Built-in undo/redo
- Text, shapes, images, filters
- `npm install fabric`

### State Management: React Context (existing)
- No Redux needed at current scale
- Keep AuthContext, ThemeContext, ToastContext

### File Storage: Keep existing approach
- Current: local filesystem or S3 compatible
- Prefer Cloudflare R2 (free egress)

### Deployment: Vercel
- Automatic Next.js optimization
- Edge functions for fast routing
- Environment variables management

---

**WAITING_FOR_CONTINUE_COMMAND** if context limit reached
**CONTINUE_WITH_NEXT_TASK** to resume from Phase 2, Task 2.1
