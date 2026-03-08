import Anthropic from '@anthropic-ai/sdk';
import {
  PostType,
  PromptMode,
  DALLE3_FORMAT_SPECS,
  buildPassthroughImagePrompt,
  buildExpandSystemPrompt,
  buildCarouselSpinePrompt,
  buildSlideDescriptionsPrompt,
  buildBrandVisualContext,
} from './prompts';

// Lazy getter — client is created at runtime, not at module evaluation time.
// This prevents build-time errors when ANTHROPIC_API_KEY is not available.
function getClient() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

// ─────────────────────────────────────────────────────────────────────────────
// VALIDATION LAYER
// Checks if user-specified elements are preserved in the expanded prompt
// ─────────────────────────────────────────────────────────────────────────────

function validatePromptPreservation(userPrompt: string, expandedPrompt: string): boolean {
  // Extract key nouns/subjects from user's prompt (simple heuristic)
  const userWords = userPrompt
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 3); // Filter short words

  if (userWords.length === 0) return true; // Nothing to validate

  // Check if at least 60% of user's key words appear in the expanded prompt
  const expandedLower = expandedPrompt.toLowerCase();
  const preservedCount = userWords.filter((word) => expandedLower.includes(word)).length;
  const preservationRate = preservedCount / userWords.length;

  return preservationRate >= 0.6;
}

// ─────────────────────────────────────────────────────────────────────────────
// TEXT CONTENT GENERATION
// Agent role: FORMATTER + BRAND INJECTOR
// Rule: user's prompt is passed as-is to the model; only system context added.
// ─────────────────────────────────────────────────────────────────────────────

export interface ContentGenerationRequest {
  prompt: string;
  postType: PostType;
  tone?: string;
  language?: string;
  brandContext?: string;
  brandTone?: string;
  brandIndustry?: string;
  brandKeywords?: string[];
  brandVoiceExample?: string;
  maxTokens?: number;
}

export async function generateContent(request: ContentGenerationRequest): Promise<string> {
  const toneInstruction = request.brandTone || request.tone
    ? `Tone: ${request.brandTone || request.tone}`
    : '';

  const brandMemorySection = [
    request.brandContext   ? `Brand: ${request.brandContext}`                                          : '',
    request.brandIndustry  ? `Industry: ${request.brandIndustry}`                                     : '',
    request.brandKeywords?.length ? `Key topics/hashtags: ${request.brandKeywords.join(', ')}`        : '',
    request.brandVoiceExample
      ? `Match this exact writing style (voice example): "${request.brandVoiceExample}"`              : '',
  ].filter(Boolean).join('\n');

  const systemPrompt = `You are a professional social media content creator.
Generate engaging, high-quality content for ${request.postType} posts.
${toneInstruction}
${request.language ? `Language: ${request.language}` : 'Language: English'}
${brandMemorySection ? `\n--- BRAND MEMORY ---\n${brandMemorySection}\n--- END BRAND MEMORY ---` : ''}

Keep the content concise, engaging, and suitable for social media.
Use relevant hashtags and emojis when appropriate.
If a voice example was provided, strictly match that writing style.`;

  const message = await getClient().messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: request.maxTokens || 1000,
    system: systemPrompt,
    messages: [{ role: 'user', content: request.prompt }],
  });

  const content = message.content[0];
  if (content.type === 'text') return content.text;
  throw new Error('Unexpected response format from Claude');
}

// ─────────────────────────────────────────────────────────────────────────────
// SINGLE IMAGE PROMPT GENERATION  (POST / REEL / VIDEO / AD)
// Agent role: PASSTHROUGH or EXPAND (never rewrites without permission)
// ─────────────────────────────────────────────────────────────────────────────

export interface ImageGenerationRequest {
  prompt: string;
  postType: PostType;
  style?: string;
  language?: string;
  mode?: PromptMode;  // default: 'expand'
  brandColors?: any;
  brandVisualStyle?: string;
}

export async function generateImagePrompt(request: ImageGenerationRequest): Promise<string> {
  const mode = request.mode ?? 'expand';
  const brandContext = buildBrandVisualContext({
    brandColors: request.brandColors,
    brandVisualStyle: request.brandVisualStyle,
  });

  // ── PASSTHROUGH mode: Claude is NOT involved ──────────────────────────────
  if (mode === 'passthrough') {
    return buildPassthroughImagePrompt(request.prompt, request.postType, request.style, brandContext);
  }

  // ── EXPAND mode: Claude creates a DALL-E 3 prompt with strict rules ───────
  const message = await getClient().messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 400,
    system: buildExpandSystemPrompt(request.postType, brandContext),
    messages: [
      {
        role: 'user',
        content: `User idea: ${request.prompt}${request.style ? `\nRequested style: ${request.style}` : ''}`,
      },
    ],
  });

  const content = message.content[0];
  if (content.type === 'text') {
    const expandedPrompt = content.text.trim();
    // ── VALIDATION: Check if user's core subject is preserved ───────────────
    if (!validatePromptPreservation(request.prompt, expandedPrompt)) {
      console.warn('[Flowly] Validation warning: User subject may not be preserved in expanded prompt.');
    }
    return expandedPrompt;
  }

  // Fallback: passthrough if Claude fails
  return buildPassthroughImagePrompt(request.prompt, request.postType, request.style, brandContext);
}

// ─────────────────────────────────────────────────────────────────────────────
// CAROUSEL SLIDE PROMPT GENERATION
// Agent role: VISUAL-SPINE GENERATOR + SLIDE PLANNER
// Protocol:
//   Step 1 — Generate a visual spine (shared palette/style) → 1 Claude call
//   Step 2 — Generate N slide descriptions (logical progression) → 1 Claude call
//   Step 3 — Combine spine + description into a final DALL-E 3 prompt per slide
//             In PASSTHROUGH mode, steps 1 & 2 are skipped; user prompt is
//             tiled into N variations with format specs appended.
// ─────────────────────────────────────────────────────────────────────────────

export async function generateCarouselSlidePrompts(
  request: ImageGenerationRequest,
  slideCount: number = 5,
): Promise<string[]> {
  const n = Math.max(2, slideCount);
  const mode = request.mode ?? 'expand';

  // ── PASSTHROUGH mode ──────────────────────────────────────────────────────
  if (mode === 'passthrough') {
    const formatSpec = DALLE3_FORMAT_SPECS.CAROUSEL;
    const styleStr = request.style ? ` Visual style: ${request.style}.` : '';
    return Array.from({ length: n }, (_, i) =>
      `${request.prompt.trim()} — slide ${i + 1} of ${n}.${styleStr} ${formatSpec} Professional quality.`
    );
  }

  // ── EXPAND mode ───────────────────────────────────────────────────────────

  // Step 1: Generate visual spine (shared aesthetic for all slides)
  let visualSpine = '';
  try {
    const spineMsg = await getClient().messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 80,
      messages: [{
        role: 'user',
        content: buildCarouselSpinePrompt(request.prompt, request.style),
      }],
    });
    const spineContent = spineMsg.content[0];
    if (spineContent.type === 'text') visualSpine = spineContent.text.trim();
  } catch {
    visualSpine = request.style || 'professional social media style, consistent visual identity';
  }

  // Step 2: Generate N slide descriptions (logical story progression)
  let slideDescriptions: string[] = [];
  try {
    const descMsg = await getClient().messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 60 * n,
      messages: [{
        role: 'user',
        content: buildSlideDescriptionsPrompt(request.prompt, n),
      }],
    });
    const descContent = descMsg.content[0];
    if (descContent.type === 'text') {
      const match = descContent.text.match(/\[[\s\S]*\]/);
      if (match) {
        const parsed: string[] = JSON.parse(match[0]);
        if (Array.isArray(parsed) && parsed.length === n) {
          slideDescriptions = parsed;
        }
      }
    }
  } catch {
    // Fallback descriptions
  }

  // Fallback descriptions if parsing failed
  if (slideDescriptions.length !== n) {
    slideDescriptions = Array.from({ length: n }, (_, i) =>
      `${request.prompt} — angle ${i + 1}: ${['introduction', 'key insight', 'example', 'benefit', 'call to action', 'summary', 'detail view', 'comparison', 'process step', 'result'][i] || `variation ${i + 1}`}`
    );
  }

  // Step 3: Build final DALL-E 3 prompt per slide.
  // Pure string assembly — Claude is NOT called again here.
  // Structure: [slide description] + [shared visual spine] + [brand context] + [format spec] + [quality]
  const brandContext = buildBrandVisualContext({
    brandColors: request.brandColors,
    brandVisualStyle: request.brandVisualStyle,
  });
  const formatSpec = DALLE3_FORMAT_SPECS.CAROUSEL;
  return slideDescriptions.map((desc) =>
    [desc, visualSpine, brandContext, formatSpec, 'Professional quality, sharp focus.']
      .filter(Boolean)
      .join('. ')
  );
}

export function getGenerationCost(_model: string): number {
  return 1;
}
