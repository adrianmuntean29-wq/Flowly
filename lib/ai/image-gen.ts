// ============================================================================
// IMAGE GENERATION
// Supports: Pollinations.ai (free), Stability AI, Replicate, DALL-E 3
// ============================================================================

export interface ImageGenerationRequest {
  prompt: string;
  negativePrompt?: string;
  width?: number;
  height?: number;
  style?: string;
  seed?: number;
}

export interface ImageGenerationResult {
  url: string;       // URL or base64 data URL
  provider: string;
  width: number;
  height: number;
}

// ─── Pollinations.ai (100% free, no API key) ──────────────────────────────

export async function generateWithPollinations(
  req: ImageGenerationRequest
): Promise<ImageGenerationResult> {
  const seed = req.seed ?? Math.floor(Math.random() * 999999);
  const width = req.width ?? 1024;
  const height = req.height ?? 1024;
  const model = 'flux'; // Best free model

  // Enhance prompt with style if provided
  let fullPrompt = req.prompt;
  if (req.style) {
    const styleMap: Record<string, string> = {
      photorealistic: 'photorealistic, high quality photography, 8k',
      illustration: 'digital illustration, vector art style',
      minimalist: 'minimalist design, clean, simple',
      cinematic: 'cinematic photography, dramatic lighting, film grain',
      watercolor: 'watercolor painting, artistic, soft colors',
      'flat-design': 'flat design, geometric, modern illustration',
    };
    fullPrompt = `${req.prompt}, ${styleMap[req.style] || req.style}`;
  }

  const encodedPrompt = encodeURIComponent(fullPrompt);
  const url = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&seed=${seed}&model=${model}&nologo=true`;

  // Pollinations generates on demand — just return the URL, the browser fetches it
  return { url, provider: 'pollinations', width, height };
}

// ─── Stability AI ──────────────────────────────────────────────────────────

export async function generateWithStability(
  req: ImageGenerationRequest,
  apiKey: string
): Promise<ImageGenerationResult> {
  const width = req.width ?? 1024;
  const height = req.height ?? 1024;

  const res = await fetch(
    'https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image',
    {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        text_prompts: [
          { text: req.prompt, weight: 1 },
          ...(req.negativePrompt ? [{ text: req.negativePrompt, weight: -1 }] : []),
        ],
        cfg_scale: 7,
        height,
        width,
        samples: 1,
        steps: 30,
        ...(req.seed ? { seed: req.seed } : {}),
      }),
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Stability AI error: ${res.status}`);
  }

  const data = await res.json();
  const base64 = data.artifacts[0].base64;
  const dataUrl = `data:image/png;base64,${base64}`;

  return { url: dataUrl, provider: 'stability', width, height };
}

// ─── OpenAI DALL-E 3 ───────────────────────────────────────────────────────

export async function generateWithDalle(
  req: ImageGenerationRequest,
  apiKey: string
): Promise<ImageGenerationResult> {
  // DALL-E 3 supports: 1024x1024, 1024x1792, 1792x1024
  const width = req.width ?? 1024;
  const height = req.height ?? 1024;
  const size =
    width === height ? '1024x1024' :
    width > height ? '1792x1024' : '1024x1792';

  const res = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'dall-e-3',
      prompt: req.prompt,
      n: 1,
      size,
      quality: 'standard',
      response_format: 'url',
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `DALL-E error: ${res.status}`);
  }

  const data = await res.json();
  const url = data.data[0].url;

  return { url, provider: 'openai', width: 1024, height: 1024 };
}

// ─── Replicate (FLUX) ──────────────────────────────────────────────────────

export async function generateWithReplicate(
  req: ImageGenerationRequest,
  apiKey: string
): Promise<ImageGenerationResult> {
  const width = req.width ?? 1024;
  const height = req.height ?? 1024;

  // Start prediction
  const startRes = await fetch('https://api.replicate.com/v1/predictions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      version: 'black-forest-labs/flux-1.1-pro',
      input: {
        prompt: req.prompt,
        width,
        height,
        output_format: 'webp',
        output_quality: 90,
        ...(req.seed ? { seed: req.seed } : {}),
      },
    }),
  });

  if (!startRes.ok) {
    const err = await startRes.json().catch(() => ({}));
    throw new Error(err.detail || `Replicate error: ${startRes.status}`);
  }

  const prediction = await startRes.json();
  const predictionUrl = prediction.urls.get;

  // Poll until done (max 60s)
  for (let i = 0; i < 30; i++) {
    await new Promise((r) => setTimeout(r, 2000));
    const pollRes = await fetch(predictionUrl, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    const result = await pollRes.json();
    if (result.status === 'succeeded') {
      return { url: result.output[0], provider: 'replicate', width, height };
    }
    if (result.status === 'failed') {
      throw new Error(result.error || 'Replicate generation failed');
    }
  }

  throw new Error('Replicate generation timed out');
}
