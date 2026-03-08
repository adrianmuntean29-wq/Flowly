/**
 * ─────────────────────────────────────────────────────────
 *  FLOWLY PROMPTING STANDARD  v1.0
 * ─────────────────────────────────────────────────────────
 *
 * This file is the single source of truth for how Flowly
 * builds prompts before they reach any AI model.
 *
 * Core principle:
 *   User-specified visual elements are NEVER rewritten,
 *   removed, translated, or reordered by an agent.
 *   Agents may ADD technical specs; they may NOT change intent.
 *
 * Two prompt modes:
 *   PASSTHROUGH — user's prompt reaches the model almost verbatim.
 *                 Only format-specific technical specs are appended.
 *   EXPAND      — Claude interprets a short topic/idea and produces
 *                 a full DALL-E 3 prompt, but must preserve every
 *                 user-specified element exactly.
 *
 * Agent rules:
 *   ✅ Agent CAN: append format specs, append quality keywords,
 *                 add style tags requested by the user,
 *                 generate slide variations for carousels.
 *   ❌ Agent CANNOT: rewrite the subject, add people/brands/logos
 *                    not mentioned, translate the prompt, compress
 *                    the prompt, or change the order of instructions.
 * ─────────────────────────────────────────────────────────
 */

export type PostType = 'POST' | 'CAROUSEL' | 'REEL' | 'VIDEO' | 'AD';
export type PromptMode = 'passthrough' | 'expand';

// ── Format-specific DALL-E 3 technical specifications ────────────────────────

export const DALLE3_FORMAT_SPECS: Record<PostType, string> = {
  POST:
    'Square composition (1:1 ratio). Balanced framing, clear focal point, ' +
    'professional social-media-ready quality. Eye-catching but not cluttered.',

  CAROUSEL:
    'Square composition (1:1 ratio). Consistent visual style with other slides in the set. ' +
    'Clean readable layout, strong focal element per slide. Leave room for text overlays.',

  REEL:
    'Vertical composition (9:16 ratio). Dynamic diagonal lines suggesting movement or energy. ' +
    'Motion-blur effects, action poses, vibrant colors. High-energy atmosphere. ' +
    'Frame subject with headroom for platform UI elements (top 15% safe zone).',

  VIDEO:
    'Vertical composition (9:16 ratio). Cinematic portrait framing with depth. ' +
    'Dramatic three-point lighting, bokeh background, shallow depth of field. ' +
    'Professional video thumbnail aesthetic with strong visual hook.',

  AD:
    'Square composition (1:1 ratio). Hero product/subject positioned in upper-left or center quadrant. ' +
    'Reserve lower-right 30% for CTA button overlay zone (keep clean). ' +
    'High contrast between subject and background. Bold, attention-grabbing colors. ' +
    'Negative space around edges for platform ad borders.',
};

// Shared quality suffix appended to all DALL-E 3 prompts
const QUALITY_SUFFIX =
  'Professional quality, sharp focus, high detail, photorealistic or polished illustration style.';

// ── Brand Visual Context Builder ─────────────────────────────────────────────
/**
 * Builds a brand visual identity string from user's brand settings.
 * Injected into DALL-E prompts to ensure visual consistency with brand.
 */
export function buildBrandVisualContext(brandData?: {
  brandColors?: any;
  brandVisualStyle?: string;
}): string {
  if (!brandData) return '';

  const parts: string[] = [];

  if (brandData.brandColors && typeof brandData.brandColors === 'object') {
    const colors = brandData.brandColors as { primary?: string; secondary?: string; accent?: string };
    const colorList = [colors.primary, colors.secondary, colors.accent].filter(Boolean);
    if (colorList.length > 0) {
      parts.push(`Brand color palette: ${colorList.join(', ')}`);
    }
  }

  if (brandData.brandVisualStyle) {
    parts.push(`Brand visual style: ${brandData.brandVisualStyle}`);
  }

  return parts.length > 0 ? parts.join('. ') + '.' : '';
}

// ── PASSTHROUGH builder ───────────────────────────────────────────────────────
/**
 * Passthrough mode: the user's prompt is preserved verbatim.
 * Only format specs and a quality suffix are appended.
 * Claude is NOT involved. No rewriting happens.
 */
export function buildPassthroughImagePrompt(
  userPrompt: string,
  postType: PostType,
  style?: string,
  brandContext?: string,
): string {
  const formatSpec = DALLE3_FORMAT_SPECS[postType];
  return [
    userPrompt.trim(),
    brandContext || '',
    formatSpec,
    style ? `Visual style: ${style}.` : '',
    QUALITY_SUFFIX,
  ]
    .filter(Boolean)
    .join(' ');
}

// ── EXPAND system prompt (strict preservation rules) ─────────────────────────
/**
 * Used in EXPAND mode. Claude receives this as a system prompt
 * so it knows it must preserve all user-specified elements.
 */
export function buildExpandSystemPrompt(postType: PostType, brandContext?: string): string {
  const formatSpec = DALLE3_FORMAT_SPECS[postType];
  return `You are a DALL-E 3 prompt engineer for Flowly.

Your job is to expand the user's idea into a complete, detailed DALL-E 3 image prompt.

STRICT RULES — follow them without exception:
1. PRESERVE every specific subject, object, scene, color, person, and setting the user mentioned.
   Do NOT rename, replace, or reinterpret any user-specified element.
2. Do NOT add people, brands, logos, or specific locations unless the user mentioned them.
3. Do NOT translate the user's elements — keep them in the original language if they name things.
4. Do NOT compress, paraphrase, or summarize what the user wrote.
5. ADD only: lighting description, composition details, and technical quality tags.
6. The user's core subject MUST appear verbatim (or near-verbatim) in your output.
${brandContext ? `\nBrand visual identity to incorporate:\n${brandContext}` : ''}

Format requirement for this post type:
${formatSpec}

Quality standard:
${QUALITY_SUFFIX}

Output format: Return ONLY the final DALL-E 3 prompt. No explanations. No preamble. No quotes.`;
}

// ── Carousel visual-spine builder ────────────────────────────────────────────
/**
 * The visual spine is a short shared style declaration generated once
 * and prepended to every slide prompt. It guarantees that all slides
 * look like they belong to the same set (consistent palette, mood, style).
 *
 * Example output:
 *   "Flat vector illustration, indigo and white color palette, clean minimal
 *    layout, professional corporate mood, consistent icon-style graphics."
 */
export function buildCarouselSpinePrompt(topic: string, style?: string): string {
  return `Define a short visual identity string (max 25 words) for a social media carousel about: "${topic}".
${style ? `Style preference: ${style}` : ''}

Describe: art style, color palette, mood, and graphic treatment.
Example: "Flat vector illustration, navy and gold palette, bold geometric shapes, premium lifestyle brand mood."

Return ONLY the visual identity string. No punctuation at the start. No explanations.`;
}

/**
 * Carousel slide expansion prompt. Receives the visual spine and a
 * slide-specific description to combine into a DALL-E 3 prompt.
 */
export function buildCarouselSlideExpandPrompt(
  topic: string,
  slideDescription: string,
  visualSpine: string,
  slideIndex: number,
  totalSlides: number,
): string {
  return `Create a DALL-E 3 image prompt for slide ${slideIndex + 1} of ${totalSlides} in a carousel.

RULES:
- The slide must depict: ${slideDescription}
- It MUST visually match this shared style: ${visualSpine}
- Keep the user's original subject matter: "${topic}"
- Square composition (1:1).
- Return ONLY the prompt string. No explanations.`;
}

// ── Slide description templates ───────────────────────────────────────────────
/**
 * When the user provides only a topic (not per-slide descriptions),
 * Claude is asked to generate N slide descriptions that logically
 * progress through the topic. These are then expanded with the spine.
 */
export function buildSlideDescriptionsPrompt(
  topic: string,
  slideCount: number,
): string {
  return `You are planning a ${slideCount}-slide social media carousel about: "${topic}".

Generate exactly ${slideCount} short slide descriptions (1 sentence each) that:
- Tell a logical story or progression through the topic
- Are visually distinct from each other
- Are specific enough to produce a clear DALL-E image

Return ONLY a valid JSON array of exactly ${slideCount} strings:
["description for slide 1", "description for slide 2", ...]`;
}
