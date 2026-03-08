'use client';

import { useState, useRef } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import { useToast } from '@/lib/context/ToastContext';
import Link from 'next/link';

// ─── Constants ────────────────────────────────────────────────────────────────

const STYLES = [
  { id: 'none',          label: 'No Style',       emoji: '✨', preview: '#6366f1' },
  { id: 'photorealistic',label: 'Photorealistic',  emoji: '📷', preview: '#374151' },
  { id: 'illustration',  label: 'Illustration',    emoji: '🎨', preview: '#7c3aed' },
  { id: 'minimalist',    label: 'Minimalist',      emoji: '⬜', preview: '#e5e7eb' },
  { id: 'cinematic',     label: 'Cinematic',       emoji: '🎬', preview: '#1f2937' },
  { id: 'watercolor',    label: 'Watercolor',      emoji: '🖌️', preview: '#bfdbfe' },
  { id: 'flat-design',   label: 'Flat Design',     emoji: '🔷', preview: '#3b82f6' },
] as const;

const ASPECT_RATIOS = [
  { id: '1:1',  label: '1 : 1',  sublabel: 'Square',   w: 40, h: 40, icon: '⬛' },
  { id: '4:5',  label: '4 : 5',  sublabel: 'Portrait',  w: 32, h: 40, icon: '📱' },
  { id: '9:16', label: '9 : 16', sublabel: 'Stories',   w: 22, h: 40, icon: '📲' },
  { id: '16:9', label: '16 : 9', sublabel: 'Landscape', w: 40, h: 22, icon: '🖥️' },
  { id: '3:2',  label: '3 : 2',  sublabel: 'Classic',   w: 40, h: 27, icon: '🖼️' },
] as const;

type StyleId = typeof STYLES[number]['id'];
type AspectRatioId = typeof ASPECT_RATIOS[number]['id'];

const PROMPT_SUGGESTIONS = [
  'A minimalist workspace with a laptop and coffee mug, morning light',
  'Vibrant social media flat lay with flowers and trending products',
  'Professional business team in a modern office, cinematic lighting',
  'Healthy food bowl on white background, top-down shot',
  'Abstract colorful gradient background for Instagram Stories',
  'Luxury fashion product on marble surface, clean aesthetic',
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function ImageGeneratePage() {
  const { token } = useAuth();
  const { success, error: toastError, info } = useToast();

  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState<StyleId>('none');
  const [aspectRatio, setAspectRatio] = useState<AspectRatioId>('1:1');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [result, setResult] = useState<{
    url: string;
    provider: string;
    width: number;
    height: number;
    prompt: string;
  } | null>(null);
  const [seed] = useState(() => Math.floor(Math.random() * 999999));
  const [currentSeed, setCurrentSeed] = useState(seed);

  // ── Generate ───────────────────────────────────────────────────────────────

  const handleGenerate = async (newSeed?: number) => {
    if (!prompt.trim()) {
      toastError('Describe the image you want to generate');
      return;
    }
    setIsGenerating(true);
    setResult(null);
    const useSeed = newSeed ?? currentSeed;

    try {
      const res = await fetch('/api/generate/image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          prompt: prompt.trim(),
          style: style === 'none' ? undefined : style,
          aspectRatio,
          seed: useSeed,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toastError(data.error || 'Generation failed');
        return;
      }

      setResult(data);
    } catch {
      toastError('Network error. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleVariation = () => {
    const newSeed = Math.floor(Math.random() * 999999);
    setCurrentSeed(newSeed);
    handleGenerate(newSeed);
  };

  // ── Save to Library ────────────────────────────────────────────────────────

  const handleSaveToLibrary = async () => {
    if (!result) return;
    setIsSaving(true);
    try {
      const res = await fetch('/api/generate/image/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          url: result.url,
          prompt: result.prompt,
          width: result.width,
          height: result.height,
          provider: result.provider,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        success('Image saved to Library!');
      } else {
        toastError(data.error || 'Failed to save');
      }
    } catch {
      toastError('Save failed');
    } finally {
      setIsSaving(false);
    }
  };

  // ── Download ───────────────────────────────────────────────────────────────

  const handleDownload = () => {
    if (!result) return;
    const a = document.createElement('a');
    a.href = result.url;
    a.download = `flowly-image-${Date.now()}.png`;
    a.target = '_blank';
    a.click();
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div style={{ maxWidth: '900px' }}>

      {/* Tab navigation */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '28px', flexWrap: 'wrap' }}>
        <Link href="/dashboard/generate" style={{ padding: '8px 18px', borderRadius: '8px', background: 'var(--background-alt,#f3f4f6)', color: 'var(--foreground-muted,#374151)', textDecoration: 'none', fontSize: '14px', fontWeight: '600' }}>
          ✍️ Text
        </Link>
        <span style={{ padding: '8px 18px', borderRadius: '8px', background: '#6366f1', color: 'white', fontSize: '14px', fontWeight: '600', cursor: 'default' }}>
          🖼️ Image
        </span>
        <Link href="/dashboard/generate/carousel" style={{ padding: '8px 18px', borderRadius: '8px', background: 'var(--background-alt,#f3f4f6)', color: 'var(--foreground-muted,#374151)', textDecoration: 'none', fontSize: '14px', fontWeight: '600' }}>
          🎠 Carousel
        </Link>
        <Link href="/dashboard/generate/video" style={{ padding: '8px 18px', borderRadius: '8px', background: 'var(--background-alt,#f3f4f6)', color: 'var(--foreground-muted,#374151)', textDecoration: 'none', fontSize: '14px', fontWeight: '600' }}>
          🎬 Video
        </Link>
        <Link href="/dashboard/generate/reel" style={{ padding: '8px 18px', borderRadius: '8px', background: 'var(--background-alt,#f3f4f6)', color: 'var(--foreground-muted,#374151)', textDecoration: 'none', fontSize: '14px', fontWeight: '600' }}>
          🎯 Reel
        </Link>
      </div>

      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <h2 style={{ fontSize: '26px', fontWeight: '700', color: '#111827', margin: '0 0 6px 0' }}>
          Generate Image
        </h2>
        <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>
          Powered by Pollinations AI (free) · or your own Stability / Replicate key
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '28px' }}>

        {/* ── Left: Controls ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Prompt */}
          <div>
            <label style={{ fontSize: '13px', fontWeight: '700', color: '#374151', display: 'block', marginBottom: '8px' }}>
              Describe your image
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. A minimalist workspace with coffee and laptop, soft morning light, warm tones..."
              rows={4}
              style={{
                width: '100%', padding: '12px 14px',
                border: '2px solid #e5e7eb', borderRadius: '10px',
                fontSize: '14px', resize: 'vertical',
                lineHeight: '1.5', boxSizing: 'border-box', outline: 'none',
                fontFamily: 'inherit',
              }}
              onFocus={(e) => { e.target.style.borderColor = '#6366f1'; }}
              onBlur={(e) => { e.target.style.borderColor = '#e5e7eb'; }}
            />
            {/* Suggestions */}
            <div style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {PROMPT_SUGGESTIONS.slice(0, 3).map((s, i) => (
                <button
                  key={i}
                  onClick={() => setPrompt(s)}
                  style={{
                    fontSize: '11px', padding: '3px 10px',
                    background: '#f3f4f6', border: '1px solid #e5e7eb',
                    borderRadius: '999px', cursor: 'pointer',
                    color: '#6b7280', whiteSpace: 'nowrap',
                  }}
                >
                  {s.slice(0, 35)}…
                </button>
              ))}
            </div>
          </div>

          {/* Style picker */}
          <div>
            <label style={{ fontSize: '13px', fontWeight: '700', color: '#374151', display: 'block', marginBottom: '8px' }}>
              Style
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
              {STYLES.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setStyle(s.id)}
                  style={{
                    padding: '8px 4px',
                    border: `2px solid ${style === s.id ? '#6366f1' : '#e5e7eb'}`,
                    borderRadius: '10px',
                    background: style === s.id ? '#eef2ff' : 'white',
                    cursor: 'pointer',
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', gap: '4px',
                  }}
                >
                  <div style={{
                    width: '24px', height: '24px', borderRadius: '6px',
                    background: s.preview, border: '1px solid rgba(0,0,0,0.1)',
                    fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {s.emoji}
                  </div>
                  <span style={{
                    fontSize: '10px', fontWeight: '600',
                    color: style === s.id ? '#4f46e5' : '#6b7280',
                    textAlign: 'center', lineHeight: '1.2',
                  }}>
                    {s.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Aspect ratio */}
          <div>
            <label style={{ fontSize: '13px', fontWeight: '700', color: '#374151', display: 'block', marginBottom: '8px' }}>
              Aspect Ratio
            </label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {ASPECT_RATIOS.map((r) => (
                <button
                  key={r.id}
                  onClick={() => setAspectRatio(r.id)}
                  style={{
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', gap: '6px',
                    padding: '10px 12px',
                    border: `2px solid ${aspectRatio === r.id ? '#6366f1' : '#e5e7eb'}`,
                    borderRadius: '10px',
                    background: aspectRatio === r.id ? '#eef2ff' : 'white',
                    cursor: 'pointer', flex: '1', minWidth: '60px',
                  }}
                >
                  {/* Visual ratio preview */}
                  <div style={{
                    width: `${r.w * 0.7}px`, height: `${r.h * 0.7}px`,
                    border: `2px solid ${aspectRatio === r.id ? '#6366f1' : '#9ca3af'}`,
                    borderRadius: '3px',
                  }} />
                  <div style={{ textAlign: 'center' }}>
                    <div style={{
                      fontSize: '11px', fontWeight: '700',
                      color: aspectRatio === r.id ? '#4f46e5' : '#374151',
                    }}>
                      {r.label}
                    </div>
                    <div style={{ fontSize: '10px', color: '#9ca3af' }}>{r.sublabel}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Generate button */}
          <button
            onClick={() => handleGenerate()}
            disabled={isGenerating || !prompt.trim()}
            style={{
              width: '100%', padding: '14px',
              background: isGenerating || !prompt.trim()
                ? '#d1d5db'
                : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              color: 'white', border: 'none', borderRadius: '12px',
              fontSize: '15px', fontWeight: '700', cursor: !prompt.trim() ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            }}
          >
            {isGenerating ? (
              <>
                <span style={{
                  width: '18px', height: '18px',
                  border: '2px solid rgba(255,255,255,0.4)', borderTopColor: 'white',
                  borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block',
                }} />
                Generating...
              </>
            ) : (
              '✨ Generate Image'
            )}
          </button>

          {/* Free badge */}
          <div style={{
            padding: '10px 14px', borderRadius: '10px',
            background: '#f0fdf4', border: '1px solid #86efac',
            display: 'flex', alignItems: 'center', gap: '8px',
          }}>
            <span style={{ fontSize: '16px' }}>🌸</span>
            <div>
              <span style={{ fontSize: '12px', fontWeight: '700', color: '#166534' }}>
                Pollinations AI — 100% Free
              </span>
              <span style={{ fontSize: '11px', color: '#15803d', display: 'block' }}>
                Add Stability AI or Replicate key for higher quality
              </span>
            </div>
          </div>
        </div>

        {/* ── Right: Result ── */}
        <div>
          {/* Loading skeleton */}
          {isGenerating && (
            <div style={{
              width: '100%',
              aspectRatio: aspectRatio.replace(':', '/'),
              background: 'linear-gradient(90deg, #f3f4f6 0%, #e5e7eb 50%, #f3f4f6 100%)',
              backgroundSize: '200% 100%',
              borderRadius: '16px',
              animation: 'shimmer 1.5s infinite',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexDirection: 'column', gap: '12px',
            }}>
              <div style={{
                width: '48px', height: '48px',
                border: '3px solid #d1d5db', borderTopColor: '#6366f1',
                borderRadius: '50%', animation: 'spin 1s linear infinite',
              }} />
              <p style={{ fontSize: '13px', color: '#6b7280', margin: 0 }}>
                Creating your image...
              </p>
            </div>
          )}

          {/* Empty state */}
          {!isGenerating && !result && (
            <div style={{
              width: '100%', aspectRatio: '1/1',
              border: '2px dashed #e5e7eb', borderRadius: '16px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexDirection: 'column', gap: '12px',
              background: '#fafafa',
            }}>
              <div style={{ fontSize: '48px' }}>🖼️</div>
              <p style={{ fontSize: '13px', color: '#9ca3af', margin: 0, textAlign: 'center' }}>
                Your generated image<br />will appear here
              </p>
            </div>
          )}

          {/* Result */}
          {!isGenerating && result && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Image */}
              <div style={{ position: 'relative', borderRadius: '16px', overflow: 'hidden' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={result.url}
                  alt={result.prompt}
                  style={{
                    width: '100%', display: 'block',
                    borderRadius: '16px',
                  }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                    toastError('Image failed to load. Try generating again.');
                  }}
                />
                {/* Provider badge */}
                <div style={{
                  position: 'absolute', top: '10px', right: '10px',
                  background: 'rgba(0,0,0,0.6)', color: 'white',
                  padding: '4px 10px', borderRadius: '999px',
                  fontSize: '11px', fontWeight: '600', backdropFilter: 'blur(4px)',
                }}>
                  {result.provider === 'pollinations' ? '🌸 Pollinations (Free)' :
                   result.provider === 'stability' ? '🎨 Stability AI' :
                   result.provider === 'replicate' ? '🔁 Replicate' :
                   result.provider === 'openai' ? '✨ DALL-E 3' : result.provider}
                </div>
              </div>

              {/* Action buttons */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                <button
                  onClick={handleVariation}
                  disabled={isGenerating}
                  style={{
                    padding: '9px 8px', borderRadius: '8px',
                    background: '#f3f4f6', border: '1px solid #e5e7eb',
                    cursor: 'pointer', fontSize: '12px', fontWeight: '600', color: '#374151',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
                  }}
                >
                  🎲 Variation
                </button>
                <button
                  onClick={handleSaveToLibrary}
                  disabled={isSaving}
                  style={{
                    padding: '9px 8px', borderRadius: '8px',
                    background: '#eef2ff', border: '1px solid #c7d2fe',
                    cursor: 'pointer', fontSize: '12px', fontWeight: '600', color: '#4f46e5',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
                  }}
                >
                  {isSaving ? '...' : '💾 Save'}
                </button>
                <button
                  onClick={handleDownload}
                  style={{
                    padding: '9px 8px', borderRadius: '8px',
                    background: '#f0fdf4', border: '1px solid #86efac',
                    cursor: 'pointer', fontSize: '12px', fontWeight: '600', color: '#166534',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
                  }}
                >
                  ⬇️ Download
                </button>
              </div>

              {/* Dimensions */}
              <div style={{
                padding: '8px 12px', background: '#f9fafb',
                borderRadius: '8px', fontSize: '11px', color: '#9ca3af',
                display: 'flex', justifyContent: 'space-between',
              }}>
                <span>{result.width} × {result.height}px</span>
                <span style={{
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  maxWidth: '60%', textAlign: 'right',
                }}>
                  {result.prompt.slice(0, 60)}{result.prompt.length > 60 ? '…' : ''}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Prompt suggestions (bottom) */}
      <div style={{ marginTop: '28px' }}>
        <p style={{ fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '10px' }}>
          💡 Prompt ideas
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {PROMPT_SUGGESTIONS.map((s, i) => (
            <button
              key={i}
              onClick={() => setPrompt(s)}
              style={{
                padding: '6px 14px', fontSize: '12px',
                background: prompt === s ? '#eef2ff' : '#f9fafb',
                border: `1px solid ${prompt === s ? '#c7d2fe' : '#e5e7eb'}`,
                borderRadius: '999px', cursor: 'pointer',
                color: prompt === s ? '#4f46e5' : '#374151',
                fontWeight: prompt === s ? '600' : '400',
              }}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
    </div>
  );
}
