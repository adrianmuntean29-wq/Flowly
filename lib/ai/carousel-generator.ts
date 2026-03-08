// ============================================================================
// FLOWLY 2.0 CAROUSEL GENERATOR
// AI-powered carousel slide generation
// ============================================================================

import Anthropic from '@anthropic-ai/sdk';
import { CAROUSEL_TEXT_GENERATION_PROMPT } from './prompts/caption';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export interface CarouselSlideStructure {
  slideNumber: number;
  heading: string;
  subheading?: string;
  bodyText?: string;
  imagePrompt?: string;
  designNotes?: string;
}

export interface CarouselGenerationParams {
  topic: string;
  slideCount: number;
  platform?: string;
  tone?: string;
  slideContext?: any;
}

/**
 * Generate carousel slide structure using AI
 *
 * @example
 * const carousel = await generateCarouselContent({
 *   topic: "5 Productivity Hacks for Remote Workers",
 *   slideCount: 6,
 *   platform: "INSTAGRAM",
 *   tone: "professional"
 * });
 *
 * // Returns:
 * // {
 * //   slides: [
 * //     { slideNumber: 1, heading: "5 Productivity Hacks", ... },
 * //     { slideNumber: 2, heading: "1. Time Blocking", ... },
 * //     ...
 * //   ]
 * // }
 */
export async function generateCarouselContent(
  params: CarouselGenerationParams
): Promise<{ slides: CarouselSlideStructure[] }> {

  // Build the prompt
  const prompt = CAROUSEL_TEXT_GENERATION_PROMPT
    .replace('{topic}', params.topic)
    .replace('{slideCount}', params.slideCount.toString())
    .replace('{platform}', params.platform || 'INSTAGRAM')
    .replace('{tone}', params.tone || 'professional');

  try {
    // Call Claude
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 2048,
      temperature: 0.7,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    // Extract text content
    const textContent = message.content[0].type === 'text'
      ? message.content[0].text
      : '';

    // Parse JSON response
    const slides = JSON.parse(textContent.trim()) as CarouselSlideStructure[];

    // Enhance each slide with image prompt if missing
    for (const slide of slides) {
      if (!slide.imagePrompt && slide.heading) {
        slide.imagePrompt = `Professional ${params.tone || 'modern'} background for: ${slide.heading}`;
      }
    }

    return { slides };

  } catch (error) {
    console.error('Carousel generation error:', error);

    // Fallback: create basic slides
    const fallbackSlides: CarouselSlideStructure[] = [];

    for (let i = 0; i < params.slideCount; i++) {
      fallbackSlides.push({
        slideNumber: i + 1,
        heading: i === 0 ? params.topic : `Point ${i}`,
        bodyText: 'Content goes here',
      });
    }

    return { slides: fallbackSlides };
  }
}

/**
 * Regenerate a single slide
 */
export async function regenerateCarouselSlide(
  topic: string,
  slideNumber: number,
  totalSlides: number,
  previousContent?: string
): Promise<CarouselSlideStructure> {

  const prompt = `You are creating one slide for a ${totalSlides}-slide carousel about: "${topic}"

This is slide #${slideNumber} of ${totalSlides}.
${previousContent ? `Previous content was: ${previousContent}` : ''}

Generate a NEW version of this slide with fresh content.

${slideNumber === 1 ? 'This is the INTRO slide - make it a strong hook.' : ''}
${slideNumber === totalSlides ? 'This is the FINAL slide - include a call-to-action.' : ''}

Output ONLY a JSON object:
{
  "slideNumber": ${slideNumber},
  "heading": "Eye-catching title (3-5 words)",
  "subheading": "Optional clarifying text (5-8 words)",
  "bodyText": "Main content (1-2 short sentences)",
  "designNotes": "Visual treatment suggestions",
  "imagePrompt": "Description for background image"
}`;

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 512,
    temperature: 0.8,
    messages: [{ role: 'user', content: prompt }],
  });

  const textContent = message.content[0].type === 'text'
    ? message.content[0].text
    : '';

  try {
    const slide = JSON.parse(textContent.trim()) as CarouselSlideStructure;
    return slide;
  } catch {
    return {
      slideNumber,
      heading: `Slide ${slideNumber}`,
      bodyText: 'Content',
    };
  }
}
