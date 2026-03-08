'use client';

import { useState, useRef } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import { useToast } from '@/lib/context/ToastContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { RefreshCw, Save, Crown, ChevronLeft, ChevronRight, Sparkles, Image as ImageIcon, Type } from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const COLOR_SCHEMES = [
  { id: 'blue-gradient',   name: 'Ocean Blue',   gradient: 'linear-gradient(135deg,#667eea 0%,#764ba2 100%)',   textColor: '#fff' },
  { id: 'purple-gradient', name: 'Purple Dawn',  gradient: 'linear-gradient(135deg,#a18cd1 0%,#fbc2eb 100%)',   textColor: '#2d1b69' },
  { id: 'dark',            name: 'Dark Minimal', gradient: 'linear-gradient(135deg,#1a1a2e 0%,#16213e 100%)',   textColor: '#fff' },
  { id: 'warm',            name: 'Warm Sunset',  gradient: 'linear-gradient(135deg,#fa709a 0%,#fee140 100%)',   textColor: '#2d1b00' },
  { id: 'green',           name: 'Forest',       gradient: 'linear-gradient(135deg,#11998e 0%,#38ef7d 100%)',   textColor: '#013220' },
  { id: 'ocean',           name: 'Sky Blue',     gradient: 'linear-gradient(135deg,#2193b0 0%,#6dd5ed 100%)',   textColor: '#001a2e' },
  { id: 'rose',            name: 'Rose Gold',    gradient: 'linear-gradient(135deg,#f093fb 0%,#f5576c 100%)',   textColor: '#fff' },
  { id: 'mint',            name: 'Mint Fresh',   gradient: 'linear-gradient(135deg,#43e97b 0%,#38f9d7 100%)',   textColor: '#012a1a' },
];

const PLATFORMS = ['INSTAGRAM', 'LINKEDIN', 'FACEBOOK', 'TIKTOK'];
const TONES = ['professional', 'casual', 'inspirational', 'funny'];
const SLIDE_COUNTS = [3, 4, 5, 6, 7, 8];

function getPollinationsUrl(prompt: string, seed: number) {
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1080&height=1080&seed=${seed}&model=flux&nologo=true`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Slide Card Component
// ─────────────────────────────────────────────────────────────────────────────

function SlideCard({
  slide,
  scheme,
  index,
  total,
  selected,
  onClick,
}: {
  slide: any;
  scheme: typeof COLOR_SCHEMES[0];
  index: number;
  total: number;
  selected: boolean;
  onClick: () => void;
}) {
  const bgStyle = slide.backgroundType === 'IMAGE' && slide.imagePrompt
    ? { backgroundImage: `url(${getPollinationsUrl(slide.imagePrompt, index * 42 + 7)})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : { background: scheme.gradient };

  return (
    <div
      onClick={onClick}
      style={{
        aspectRatio: '1/1',
        borderRadius: '12px',
        cursor: 'pointer',
        overflow: 'hidden',
        border: selected ? '3px solid #6366f1' : '3px solid transparent',
        boxShadow: selected ? '0 0 0 2px #6366f1' : '0 2px 8px rgba(0,0,0,0.15)',
        position: 'relative',
        transition: 'all 0.15s',
        ...bgStyle,
      }}
    >
      {/* Dark overlay for image backgrounds */}
      {slide.backgroundType === 'IMAGE' && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)' }} />
      )}

      {/* Slide number */}
      <div style={{
        position: 'absolute', top: '8px', left: '8px',
        background: 'rgba(0,0,0,0.35)', borderRadius: '6px',
        padding: '2px 8px', fontSize: '10px', fontWeight: '700',
        color: '#fff',
      }}>
        {index + 1}/{total}
      </div>

      {/* Text content */}
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column',
        justifyContent: 'center', alignItems: 'center',
        padding: '12px', textAlign: 'center',
      }}>
        {slide.heading && (
          <p style={{
            fontSize: '12px', fontWeight: '800', lineHeight: 1.2,
            color: slide.backgroundType === 'IMAGE' ? '#fff' : scheme.textColor,
            margin: '0 0 4px 0',
            textShadow: slide.backgroundType === 'IMAGE' ? '0 1px 4px rgba(0,0,0,0.8)' : 'none',
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
          } as any}>
            {slide.heading}
          </p>
        )}
        {slide.subheading && (
          <p style={{
            fontSize: '9px', fontWeight: '500', lineHeight: 1.3,
            color: slide.backgroundType === 'IMAGE' ? 'rgba(255,255,255,0.85)' : scheme.textColor,
            margin: '0', opacity: 0.85,
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
          } as any}>
            {slide.subheading}
          </p>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Full-size Slide Preview
// ─────────────────────────────────────────────────────────────────────────────

function SlidePreview({ slide, scheme }: { slide: any; scheme: typeof COLOR_SCHEMES[0] }) {
  const bgStyle = slide.backgroundType === 'IMAGE' && slide.imagePrompt
    ? { backgroundImage: `url(${getPollinationsUrl(slide.imagePrompt, (slide.order ?? 0) * 42 + 7)})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : { background: scheme.gradient };

  return (
    <div style={{
      width: '100%', aspectRatio: '1/1', borderRadius: '16px',
      overflow: 'hidden', position: 'relative',
      boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
      ...bgStyle,
    }}>
      {slide.backgroundType === 'IMAGE' && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)' }} />
      )}
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column',
        justifyContent: 'center', alignItems: 'center',
        padding: '10%', textAlign: 'center',
      }}>
        {slide.heading && (
          <h2 style={{
            fontSize: 'clamp(20px, 4vw, 36px)', fontWeight: '900', lineHeight: 1.1,
            color: slide.backgroundType === 'IMAGE' ? '#fff' : scheme.textColor,
            margin: '0 0 12px 0',
            textShadow: slide.backgroundType === 'IMAGE' ? '0 2px 8px rgba(0,0,0,0.8)' : 'none',
          }}>
            {slide.heading}
          </h2>
        )}
        {slide.subheading && (
          <p style={{
            fontSize: 'clamp(13px, 2vw, 18px)', fontWeight: '600', lineHeight: 1.4,
            color: slide.backgroundType === 'IMAGE' ? 'rgba(255,255,255,0.9)' : scheme.textColor,
            margin: '0 0 10px 0', opacity: 0.9,
          }}>
            {slide.subheading}
          </p>
        )}
        {slide.bodyText && (
          <p style={{
            fontSize: 'clamp(11px, 1.5vw, 15px)', fontWeight: '400', lineHeight: 1.6,
            color: slide.backgroundType === 'IMAGE' ? 'rgba(255,255,255,0.8)' : scheme.textColor,
            margin: 0, opacity: 0.8, maxWidth: '80%',
          }}>
            {slide.bodyText}
          </p>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────────────────

export default function CarouselBuilderPage() {
  const { user, token } = useAuth();
  const { success, error: toastError, warning } = useToast();
  const router = useRouter();

  const plan = (user?.subscriptionPlan || 'FREE') as string;
  const isPro = plan === 'PRO' || plan === 'ENTERPRISE';

  // Step 1: config
  const [topic, setTopic] = useState('');
  const [slideCount, setSlideCount] = useState(5);
  const [platform, setPlatform] = useState('INSTAGRAM');
  const [tone, setTone] = useState('professional');
  const [colorScheme, setColorScheme] = useState('blue-gradient');
  const [includeImages, setIncludeImages] = useState(true);

  // Step 2: result
  const [carousel, setCarousel] = useState<any | null>(null);
  const [selectedSlideIdx, setSelectedSlideIdx] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Inline edit state
  const [editingSlide, setEditingSlide] = useState<any>(null);

  const scheme = COLOR_SCHEMES.find((s) => s.id === colorScheme) || COLOR_SCHEMES[0];
  const selectedSlide = carousel?.slides?.[selectedSlideIdx];

  // ── Step 1: Generate ──────────────────────────────────────────────────────

  const handleGenerate = async () => {
    if (!topic.trim()) { toastError('Introdu un subiect pentru carousel'); return; }
    if (!isPro) return;

    setIsGenerating(true);
    setCarousel(null);

    try {
      const res = await fetch('/api/v2/generate/carousel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ topic, slideCount, platform, tone, colorScheme, includeImages }),
      });

      if (res.status === 403) {
        warning('Carousel-urile necesită plan PRO');
        return;
      }

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Generare eșuată');
      }

      const data = await res.json();
      // Assign order index to each slide for Pollinations seed
      const slides = (data.carousel?.slides || []).map((s: any, i: number) => ({ ...s, order: i }));
      setCarousel({ ...data.carousel, slides });
      setSelectedSlideIdx(0);
      setEditingSlide({ ...slides[0] });
      success(`Carousel generat: ${slides.length} slide-uri!`);
    } catch (err: any) {
      toastError(err.message || 'Eroare la generare');
    } finally {
      setIsGenerating(false);
    }
  };

  // ── Select slide ──────────────────────────────────────────────────────────

  const selectSlide = (idx: number) => {
    setSelectedSlideIdx(idx);
    setEditingSlide({ ...carousel.slides[idx] });
  };

  // ── Save edits to a slide ─────────────────────────────────────────────────

  const saveSlideEdit = async () => {
    if (!editingSlide || !carousel) return;
    try {
      const res = await fetch(`/api/carousels/${carousel.id}/slides/${editingSlide.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          heading: editingSlide.heading,
          subheading: editingSlide.subheading,
          bodyText: editingSlide.bodyText,
          backgroundType: editingSlide.backgroundType,
          imagePrompt: editingSlide.imagePrompt,
        }),
      });
      if (!res.ok) throw new Error('Update failed');
      const updated = await res.json();
      const newSlides = carousel.slides.map((s: any, i: number) =>
        i === selectedSlideIdx ? { ...updated, order: i } : s
      );
      setCarousel({ ...carousel, slides: newSlides });
      setEditingSlide({ ...updated, order: selectedSlideIdx });
      success('Slide actualizat!');
    } catch {
      toastError('Eroare la salvare slide');
    }
  };

  // ── Regenerate individual slide ───────────────────────────────────────────

  const handleRegenerateSlide = async () => {
    if (!carousel || !selectedSlide) return;
    setIsRegenerating(true);
    try {
      const res = await fetch(`/api/carousels/${carousel.id}/slides/${selectedSlide.id}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Regenerare eșuată');
      const updated = await res.json();
      const newSlides = carousel.slides.map((s: any, i: number) =>
        i === selectedSlideIdx ? { ...updated, order: i } : s
      );
      setCarousel({ ...carousel, slides: newSlides });
      setEditingSlide({ ...updated, order: selectedSlideIdx });
      success('Slide regenerat!');
    } catch {
      toastError('Eroare la regenerare');
    } finally {
      setIsRegenerating(false);
    }
  };

  // ── Save carousel as a CAROUSEL post ─────────────────────────────────────

  const handleSaveAsPost = async () => {
    if (!carousel) return;
    setIsSaving(true);
    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          type: 'CAROUSEL',
          caption: carousel.name,
          platforms: [platform],
          status: 'DRAFT',
        }),
      });
      if (!res.ok) throw new Error('Save failed');
      success('Carousel salvat ca Draft!');
      router.push('/dashboard/posts');
    } catch {
      toastError('Eroare la salvare');
    } finally {
      setIsSaving(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div style={{ maxWidth: '1400px' }}>
      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '24px' }}>
        <Link href="/dashboard/generate" style={tabStyle(false)}>✍️ Text</Link>
        <Link href="/dashboard/generate/image" style={tabStyle(false)}>🖼️ Image</Link>
        <span style={tabStyle(true)}>🎠 Carousel</span>
        <Link href="/dashboard/generate/video" style={tabStyle(false)}>🎬 Video</Link>
        <Link href="/dashboard/generate/reel" style={tabStyle(false)}>🎯 Reel</Link>
      </div>

      {/* PRO gate */}
      {!isPro ? (
        <div style={{
          background: 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(139,92,246,0.08))',
          border: '1.5px solid rgba(99,102,241,0.25)',
          borderRadius: '20px', padding: '48px', textAlign: 'center',
        }}>
          <Crown size={52} style={{ color: '#f59e0b', marginBottom: '16px' }} />
          <h2 style={{ fontSize: '22px', fontWeight: '800', color: 'var(--foreground)', margin: '0 0 10px 0' }}>
            Carousel Builder — PRO
          </h2>
          <p style={{ color: 'var(--foreground-muted)', fontSize: '15px', margin: '0 0 24px 0', maxWidth: '500px', marginInline: 'auto' }}>
            Generează carousel-uri profesionale cu AI — fiecare slide cu text, design și imagine Pollinations.
            Disponibil pentru planurile PRO și ENTERPRISE.
          </p>
          <a
            href="/pricing"
            style={{
              display: 'inline-block', padding: '13px 32px',
              background: 'linear-gradient(135deg,#667eea,#764ba2)',
              color: '#fff', borderRadius: '12px', textDecoration: 'none',
              fontSize: '15px', fontWeight: '700',
            }}
          >
            🚀 Upgrade la PRO
          </a>
        </div>
      ) : !carousel ? (
        // ── Step 1: Configure ───────────────────────────────────────────────
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '28px' }}>
          {/* Left: form */}
          <div className="card" style={{ padding: '32px' }}>
            <h2 className="section-title" style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Sparkles size={22} style={{ color: '#6366f1' }} />
              Configurează Carousel
            </h2>

            {/* Topic */}
            <div style={{ marginBottom: '20px' }}>
              <label style={fieldLabel}>Subiect / Topic *</label>
              <textarea
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Ex: 5 sfaturi pentru productivitate în 2026, Cum să construiești un brand pe Instagram..."
                rows={3}
                style={{ ...inputStyle, resize: 'vertical', lineHeight: '1.6', fontFamily: 'inherit' }}
              />
            </div>

            {/* Slide count */}
            <div style={{ marginBottom: '20px' }}>
              <label style={fieldLabel}>Număr slide-uri</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {SLIDE_COUNTS.map((n) => (
                  <button
                    key={n}
                    onClick={() => setSlideCount(n)}
                    style={{
                      width: '44px', height: '44px',
                      borderRadius: '10px',
                      border: `2px solid ${slideCount === n ? '#6366f1' : '#e5e7eb'}`,
                      background: slideCount === n ? '#eef2ff' : 'white',
                      color: slideCount === n ? '#6366f1' : '#374151',
                      fontWeight: '700', fontSize: '14px', cursor: 'pointer',
                    }}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            {/* Platform + Tone */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '20px' }}>
              <div>
                <label style={fieldLabel}>Platformă</label>
                <select value={platform} onChange={(e) => setPlatform(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                  {PLATFORMS.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label style={fieldLabel}>Ton</label>
                <select value={tone} onChange={(e) => setTone(e.target.value)} style={{ ...inputStyle, cursor: 'pointer', textTransform: 'capitalize' }}>
                  {TONES.map((t) => <option key={t} value={t} style={{ textTransform: 'capitalize' }}>{t}</option>)}
                </select>
              </div>
            </div>

            {/* Background image toggle */}
            <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button
                onClick={() => setIncludeImages(!includeImages)}
                style={{
                  width: '44px', height: '24px', borderRadius: '12px',
                  background: includeImages ? '#6366f1' : '#d1d5db',
                  border: 'none', cursor: 'pointer', position: 'relative',
                  transition: 'background 0.2s',
                }}
              >
                <span style={{
                  position: 'absolute', top: '2px',
                  left: includeImages ? '22px' : '2px',
                  width: '20px', height: '20px', borderRadius: '50%',
                  background: 'white', transition: 'left 0.2s',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
                }} />
              </button>
              <span style={{ fontSize: '14px', color: 'var(--foreground)', fontWeight: '500' }}>
                Imagini Pollinations (gratuit)
              </span>
              <span style={{
                fontSize: '10px', fontWeight: '700', padding: '2px 7px',
                background: '#d1fae5', color: '#065f46', borderRadius: '5px',
              }}>
                FREE
              </span>
            </div>

            {/* Generate button */}
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !topic.trim()}
              className="btn btn-primary"
              style={{ width: '100%', padding: '14px', fontSize: '15px', fontWeight: '700' }}
            >
              {isGenerating ? (
                <><RefreshCw size={18} className="spin" /> Generez {slideCount} slide-uri cu AI...</>
              ) : (
                <><Sparkles size={18} /> Generează Carousel</>
              )}
            </button>
          </div>

          {/* Right: color scheme picker */}
          <div className="card" style={{ padding: '32px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--foreground)', margin: '0 0 20px 0' }}>
              🎨 Schema de culori
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {COLOR_SCHEMES.map((cs) => (
                <button
                  key={cs.id}
                  onClick={() => setColorScheme(cs.id)}
                  style={{
                    borderRadius: '12px', border: `3px solid ${colorScheme === cs.id ? '#6366f1' : 'transparent'}`,
                    padding: '0', overflow: 'hidden', cursor: 'pointer',
                    boxShadow: colorScheme === cs.id ? '0 0 0 1px #6366f1' : '0 2px 6px rgba(0,0,0,0.1)',
                  }}
                >
                  <div style={{ height: '64px', background: cs.gradient }} />
                  <div style={{ padding: '8px 10px', background: 'white', fontSize: '12px', fontWeight: '600', color: '#374151', textAlign: 'left' }}>
                    {cs.name}
                    {colorScheme === cs.id && <span style={{ float: 'right', color: '#6366f1' }}>✓</span>}
                  </div>
                </button>
              ))}
            </div>

            {/* Preview mini slide */}
            <div style={{ marginTop: '24px' }}>
              <p style={{ fontSize: '11px', fontWeight: '700', color: 'var(--foreground-muted)', margin: '0 0 10px 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Preview
              </p>
              <div style={{
                width: '100%', aspectRatio: '1/1', borderRadius: '12px',
                background: scheme.gradient, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', padding: '24px', textAlign: 'center',
              }}>
                <p style={{ fontSize: '18px', fontWeight: '900', color: scheme.textColor, margin: '0 0 8px 0' }}>
                  {topic || 'Titlul slide-ului'}
                </p>
                <p style={{ fontSize: '13px', color: scheme.textColor, opacity: 0.7, margin: 0 }}>
                  Subtitlu sau descriere
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        // ── Step 2: Preview & Edit ──────────────────────────────────────────
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '24px', alignItems: 'start' }}>

          {/* Left: Slide preview + grid */}
          <div>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--foreground)', margin: '0 0 2px 0' }}>
                  🎠 {carousel.name}
                </h2>
                <p style={{ fontSize: '13px', color: 'var(--foreground-muted)', margin: 0 }}>
                  {carousel.slides.length} slide-uri · {platform} · {tone}
                </p>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => { setCarousel(null); setSelectedSlideIdx(0); }}
                  className="btn btn-ghost"
                >
                  ← Nou Carousel
                </button>
                <button
                  onClick={handleSaveAsPost}
                  disabled={isSaving}
                  className="btn btn-primary"
                >
                  {isSaving ? <><RefreshCw size={15} className="spin" /> Salvez...</> : <><Save size={15} /> Salvează ca Draft</>}
                </button>
              </div>
            </div>

            {/* Big slide preview */}
            {selectedSlide && (
              <div style={{ marginBottom: '20px', maxWidth: '480px', marginInline: 'auto' }}>
                <SlidePreview slide={editingSlide || selectedSlide} scheme={scheme} />

                {/* Navigation arrows */}
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', marginTop: '14px' }}>
                  <button
                    onClick={() => selectSlide(Math.max(0, selectedSlideIdx - 1))}
                    disabled={selectedSlideIdx === 0}
                    style={{ ...arrowBtn, opacity: selectedSlideIdx === 0 ? 0.3 : 1 }}
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <span style={{ fontSize: '13px', color: 'var(--foreground-muted)', fontWeight: '600' }}>
                    {selectedSlideIdx + 1} / {carousel.slides.length}
                  </span>
                  <button
                    onClick={() => selectSlide(Math.min(carousel.slides.length - 1, selectedSlideIdx + 1))}
                    disabled={selectedSlideIdx === carousel.slides.length - 1}
                    style={{ ...arrowBtn, opacity: selectedSlideIdx === carousel.slides.length - 1 ? 0.3 : 1 }}
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            )}

            {/* Slide grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${Math.min(carousel.slides.length, 5)}, 1fr)`,
              gap: '10px',
            }}>
              {carousel.slides.map((slide: any, idx: number) => (
                <SlideCard
                  key={slide.id}
                  slide={slide}
                  scheme={scheme}
                  index={idx}
                  total={carousel.slides.length}
                  selected={idx === selectedSlideIdx}
                  onClick={() => selectSlide(idx)}
                />
              ))}
            </div>
          </div>

          {/* Right: Slide editor panel */}
          <div className="card" style={{ padding: '24px', position: 'sticky', top: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--foreground)', margin: 0 }}>
                <Type size={15} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                Editează Slide {selectedSlideIdx + 1}
              </h3>
              <button
                onClick={handleRegenerateSlide}
                disabled={isRegenerating}
                title="Regenerează cu AI"
                style={{
                  padding: '6px 10px', background: '#eef2ff', color: '#6366f1',
                  border: 'none', borderRadius: '8px', cursor: isRegenerating ? 'not-allowed' : 'pointer',
                  fontSize: '12px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px',
                }}
              >
                <RefreshCw size={12} className={isRegenerating ? 'spin' : ''} />
                AI
              </button>
            </div>

            {editingSlide && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={fieldLabel}>Heading</label>
                  <input
                    type="text"
                    value={editingSlide.heading || ''}
                    onChange={(e) => setEditingSlide({ ...editingSlide, heading: e.target.value })}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={fieldLabel}>Subheading</label>
                  <input
                    type="text"
                    value={editingSlide.subheading || ''}
                    onChange={(e) => setEditingSlide({ ...editingSlide, subheading: e.target.value })}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={fieldLabel}>Body text</label>
                  <textarea
                    value={editingSlide.bodyText || ''}
                    onChange={(e) => setEditingSlide({ ...editingSlide, bodyText: e.target.value })}
                    rows={3}
                    style={{ ...inputStyle, resize: 'vertical', lineHeight: '1.5', fontFamily: 'inherit' }}
                  />
                </div>

                {/* Background type toggle */}
                <div>
                  <label style={fieldLabel}>Background</label>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {(['GRADIENT', 'IMAGE'] as const).map((bt) => (
                      <button
                        key={bt}
                        onClick={() => setEditingSlide({ ...editingSlide, backgroundType: bt })}
                        style={{
                          flex: 1, padding: '8px',
                          border: `2px solid ${editingSlide.backgroundType === bt ? '#6366f1' : '#e5e7eb'}`,
                          background: editingSlide.backgroundType === bt ? '#eef2ff' : 'white',
                          color: editingSlide.backgroundType === bt ? '#6366f1' : '#6b7280',
                          borderRadius: '8px', cursor: 'pointer',
                          fontSize: '12px', fontWeight: '700',
                        }}
                      >
                        {bt === 'GRADIENT' ? '🎨 Gradient' : '🖼️ Imagine'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Image prompt (Pollinations) */}
                {editingSlide.backgroundType === 'IMAGE' && (
                  <div>
                    <label style={fieldLabel}>
                      <ImageIcon size={11} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                      Prompt imagine (Pollinations)
                    </label>
                    <input
                      type="text"
                      value={editingSlide.imagePrompt || ''}
                      onChange={(e) => setEditingSlide({ ...editingSlide, imagePrompt: e.target.value })}
                      placeholder="Ex: professional office, modern minimal..."
                      style={inputStyle}
                    />
                    <p style={{ fontSize: '10px', color: 'var(--foreground-muted)', margin: '4px 0 0 0' }}>
                      Generat gratuit de Pollinations AI
                    </p>
                  </div>
                )}

                <button
                  onClick={saveSlideEdit}
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '10px', fontSize: '13px' }}
                >
                  <Save size={14} /> Salvează modificările
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Style helpers
// ─────────────────────────────────────────────────────────────────────────────

function tabStyle(active: boolean): React.CSSProperties {
  return {
    padding: '8px 18px', borderRadius: '8px',
    background: active ? '#6366f1' : 'var(--background-alt, #f3f4f6)',
    color: active ? '#fff' : 'var(--foreground-muted, #374151)',
    textDecoration: 'none', fontSize: '14px', fontWeight: '600',
    cursor: active ? 'default' : 'pointer', border: 'none',
    display: 'inline-block',
  };
}

const fieldLabel: React.CSSProperties = {
  fontSize: '11px', fontWeight: '700', color: 'var(--foreground-muted)',
  textTransform: 'uppercase', letterSpacing: '0.05em',
  display: 'block', marginBottom: '6px',
};

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '9px 12px',
  border: '1.5px solid var(--border, #e5e7eb)', borderRadius: '8px',
  fontSize: '13px', boxSizing: 'border-box',
  outline: 'none', color: 'var(--foreground)', background: 'var(--background)',
};

const arrowBtn: React.CSSProperties = {
  width: '36px', height: '36px', borderRadius: '50%',
  background: 'var(--background-alt, #f3f4f6)', border: '1.5px solid var(--border, #e5e7eb)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  cursor: 'pointer', color: 'var(--foreground)',
};
