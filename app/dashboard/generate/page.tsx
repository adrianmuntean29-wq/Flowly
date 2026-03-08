'use client';

import { useState, Suspense } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import { useToast } from '@/lib/context/ToastContext';
import { usePosts } from '@/lib/hooks/useApi';
import { useRouter, useSearchParams } from 'next/navigation';
import type { SubscriptionPlan } from '@/lib/features/permissions';
import { Sparkles, Image as ImageIcon, Grid3x3, Crown, Copy, RefreshCw, Save, ExternalLink } from 'lucide-react';
import Link from 'next/link';

type PostType = 'IMAGE' | 'CAROUSEL';
type Platform = 'INSTAGRAM' | 'FACEBOOK' | 'LINKEDIN' | 'TIKTOK';
type Tone = 'casual' | 'professional' | 'funny' | 'inspirational';

function canGenerate(plan: SubscriptionPlan, type: PostType): boolean {
  if (type === 'IMAGE') return true;
  if (type === 'CAROUSEL') return plan === 'PRO' || plan === 'ENTERPRISE';
  return false;
}

function GeneratePageContent() {
  const { user, token } = useAuth();
  const { success: toastSuccess, error: toastError, info: toastInfo } = useToast();
  const { create } = usePosts();
  const router = useRouter();
  const searchParams = useSearchParams();
  const userPlan = (user?.subscriptionPlan || 'FREE') as SubscriptionPlan;

  // Pre-fill from URL query params (used by Templates "Use" button)
  const [postType, setPostType] = useState<PostType>(() => {
    const pt = searchParams.get('postType');
    return pt === 'CAROUSEL' ? 'CAROUSEL' : 'IMAGE';
  });
  const [prompt, setPrompt] = useState(searchParams.get('prompt') || '');
  const [platform, setPlatform] = useState<Platform>('INSTAGRAM');
  const [tone, setTone] = useState<Tone>('professional');

  // Generated content
  const [generatedCaption, setGeneratedCaption] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  // Upgrade modal
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Please enter a description');
      return;
    }
    setIsGenerating(true);
    setError('');

    try {
      const response = await fetch('/api/v2/generate/caption', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          context: {
            imageDescription: prompt,
            targetPlatform: platform,
            tone,
            includeHashtags: true,
            includeHook: true,
            includeCTA: true,
          },
        }),
      });

      if (response.status === 401) {
        toastError('Session expired. Please log in again.');
        router.push('/auth/login');
        return;
      }
      if (response.status === 429) {
        toastError('Monthly generation limit reached. Upgrade your plan for more.');
        return;
      }

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to generate caption');

      setGeneratedCaption(data.caption);
      toastSuccess('Caption generated!');
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRegenerate = () => {
    setGeneratedCaption(null);
    handleGenerate();
  };

  const copyCaption = async () => {
    if (!generatedCaption?.fullCaption) return;
    try {
      await navigator.clipboard.writeText(generatedCaption.fullCaption);
      toastSuccess('Caption copied to clipboard!');
    } catch {
      const el = document.createElement('textarea');
      el.value = generatedCaption.fullCaption;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      toastInfo('Caption copied!');
    }
  };

  const handleSaveAsDraft = async () => {
    if (!generatedCaption) return;
    setIsSaving(true);
    try {
      await create({
        type: postType,
        caption: generatedCaption.fullCaption || generatedCaption.body,
        platforms: [platform],
        status: 'DRAFT',
      });
      toastSuccess('Post saved as draft!');
      router.push('/dashboard/posts');
    } catch (err: any) {
      toastError(err.message || 'Failed to save post');
    } finally {
      setIsSaving(false);
    }
  };

  const postTypes: { type: PostType; icon: any; label: string; desc: string }[] = [
    { type: 'IMAGE',    icon: ImageIcon, label: 'Single Image', desc: 'Free' },
    { type: 'CAROUSEL', icon: Grid3x3,   label: 'Carousel',     desc: 'PRO' },
  ];

  return (
    <div className="generate-page">
      {/* Generate type tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <span style={{ padding: '8px 18px', borderRadius: '8px', background: '#6366f1', color: 'white', fontSize: '14px', fontWeight: '600', cursor: 'default' }}>
          ✍️ Text
        </span>
        <Link href="/dashboard/generate/image" style={{ padding: '8px 18px', borderRadius: '8px', background: 'var(--background-alt,#f3f4f6)', color: 'var(--foreground-muted,#374151)', textDecoration: 'none', fontSize: '14px', fontWeight: '600' }}>
          🖼️ Image
        </Link>
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
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <Sparkles size={28} className="gradient-text" />
            Generate Caption
          </h1>
          <p className="page-description">
            Create marketing-focused captions, hooks and CTAs with AI
          </p>
        </div>
      </div>

      <div className="generate-grid">
        {/* Left Panel — Input */}
        <div className="generate-panel">
          <div className="card">
            <h2 className="section-title">What do you want to create?</h2>

            {/* Post Type Selection */}
            <div className="post-type-grid">
              {postTypes.map(({ type, icon: Icon, label, desc }) => {
                const isLocked = !canGenerate(userPlan, type);
                const isActive = postType === type;
                return (
                  <button
                    key={type}
                    className={`post-type-card ${isActive ? 'active' : ''} ${isLocked ? 'locked' : ''}`}
                    onClick={() => {
                      if (isLocked) setShowUpgradeModal(true);
                      else setPostType(type);
                    }}
                  >
                    <Icon size={24} />
                    <span>{label}</span>
                    <span className="post-type-desc">{desc}</span>
                    {isLocked && <Crown size={14} className="lock-icon" />}
                  </button>
                );
              })}
            </div>

            {/* Prompt */}
            <div className="form-group">
              <label>
                Describe your content
                <span className="char-count">{prompt.length}/1000</span>
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value.slice(0, 1000))}
                placeholder="E.g., Modern minimalist workspace with laptop and coffee, natural lighting..."
                rows={4}
              />
            </div>

            {/* Platform */}
            <div className="form-group">
              <label>Platform</label>
              <div className="platform-grid">
                {(['INSTAGRAM', 'FACEBOOK', 'LINKEDIN', 'TIKTOK'] as Platform[]).map((p) => (
                  <button
                    key={p}
                    className={`platform-btn ${platform === p ? 'active' : ''}`}
                    onClick={() => setPlatform(p)}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Tone */}
            <div className="form-group">
              <label>Tone</label>
              <div className="tone-grid">
                {(['casual', 'professional', 'funny', 'inspirational'] as Tone[]).map((t) => (
                  <button
                    key={t}
                    className={`tone-btn ${tone === t ? 'active' : ''}`}
                    onClick={() => setTone(t)}
                  >
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Generate Button */}
            <button
              className="btn btn-primary btn-lg"
              onClick={handleGenerate}
              disabled={isGenerating || !prompt.trim()}
              style={{ width: '100%', marginTop: '1rem' }}
            >
              {isGenerating ? (
                <><RefreshCw size={20} className="spin" /> Generating...</>
              ) : (
                <><Sparkles size={20} /> Generate Caption</>
              )}
            </button>

            {error && (
              <div className="error-message" style={{ marginTop: '1rem' }}>{error}</div>
            )}
          </div>
        </div>

        {/* Right Panel — Preview */}
        <div className="generate-panel">
          {generatedCaption ? (
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h2 className="section-title" style={{ margin: 0 }}>Generated Caption</h2>
                <button className="btn btn-ghost btn-sm" onClick={copyCaption}>
                  <Copy size={16} /> Copy
                </button>
              </div>

              <div className="caption-preview">
                {generatedCaption.hook && (
                  <div className="caption-section">
                    <div className="caption-label">Hook</div>
                    <div className="caption-text hook">{generatedCaption.hook}</div>
                  </div>
                )}
                <div className="caption-section">
                  <div className="caption-label">Body</div>
                  <div className="caption-text">{generatedCaption.body}</div>
                </div>
                {generatedCaption.cta && (
                  <div className="caption-section">
                    <div className="caption-label">Call-to-Action</div>
                    <div className="caption-text cta">{generatedCaption.cta}</div>
                  </div>
                )}
                {generatedCaption.hashtags?.length > 0 && (
                  <div className="caption-section">
                    <div className="caption-label">Hashtags</div>
                    <div className="hashtags">
                      {generatedCaption.hashtags.map((tag: string, i: number) => (
                        <span key={i} className="hashtag">#{tag}</span>
                      ))}
                    </div>
                  </div>
                )}
                <div className="caption-stats">
                  <span>{generatedCaption.fullCaption?.length ?? 0} chars</span>
                  <span>{platform}</span>
                  <span>{tone}</span>
                </div>
              </div>

              <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.75rem' }}>
                <button
                  className="btn btn-secondary"
                  style={{ flex: 1 }}
                  onClick={handleRegenerate}
                  disabled={isGenerating}
                >
                  <RefreshCw size={16} className={isGenerating ? 'spin' : ''} />
                  Regenerate
                </button>
                <button
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                  onClick={handleSaveAsDraft}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <><RefreshCw size={16} className="spin" /> Saving...</>
                  ) : (
                    <><Save size={16} /> Save as Draft</>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="card empty-state">
              <Sparkles size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
              <h3>No content yet</h3>
              <p>Fill in the form and click "Generate Caption" to create your content</p>
            </div>
          )}
        </div>
      </div>

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <div className="modal-overlay" onClick={() => setShowUpgradeModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <Crown size={48} style={{ color: '#f59e0b', marginBottom: '0.75rem' }} />
              <h2 style={{ margin: '0 0 0.5rem', fontSize: '1.4rem', fontWeight: 700, color: 'var(--foreground)' }}>
                Upgrade to PRO
              </h2>
              <p style={{ color: 'var(--foreground-muted)', margin: 0 }}>
                Carousel posts require a PRO or ENTERPRISE subscription.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button className="btn btn-ghost" onClick={() => setShowUpgradeModal(false)} style={{ flex: 1 }}>
                Cancel
              </button>
              <button
                className="btn btn-primary"
                style={{ flex: 1 }}
                onClick={() => { setShowUpgradeModal(false); router.push('/dashboard/billing'); }}
              >
                <ExternalLink size={16} /> View Plans
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .generate-page { max-width: 1400px; margin: 0 auto; }
        .page-header { margin-bottom: var(--space-8); }
        .page-title {
          font-size: var(--text-4xl); font-weight: var(--font-bold);
          color: var(--foreground); margin-bottom: var(--space-2);
          display: flex; align-items: center; gap: var(--space-3);
        }
        .page-description { font-size: var(--text-lg); color: var(--foreground-muted); margin: 0; }

        .generate-grid { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-6); }
        @media (max-width: 1024px) { .generate-grid { grid-template-columns: 1fr; } }

        .generate-panel { min-height: 600px; }
        .section-title {
          font-size: var(--text-xl); font-weight: var(--font-semibold);
          color: var(--foreground); margin-bottom: var(--space-4);
        }

        .post-type-grid {
          display: grid; grid-template-columns: repeat(2, 1fr);
          gap: var(--space-3); margin-bottom: var(--space-6);
        }
        .post-type-card {
          padding: var(--space-4); background: var(--background-alt);
          border: 2px solid var(--border); border-radius: var(--radius-lg);
          display: flex; flex-direction: column; align-items: center;
          gap: var(--space-1); cursor: pointer; transition: all var(--transition-fast);
          position: relative; color: var(--foreground);
        }
        .post-type-card:hover:not(.locked) { border-color: var(--primary-500); background: var(--background); }
        .post-type-card.active { border-color: var(--primary-600); background: var(--primary-50); }
        [data-theme="dark"] .post-type-card.active { background: rgba(99,102,241,0.12); }
        .post-type-card.locked { opacity: 0.6; cursor: not-allowed; }
        .post-type-desc { font-size: 10px; font-weight: 700; color: var(--foreground-muted); text-transform: uppercase; }
        .lock-icon { position: absolute; top: 8px; right: 8px; color: #f59e0b; }

        .form-group { margin-bottom: var(--space-6); }
        .form-group label {
          display: flex; justify-content: space-between; align-items: center;
          font-size: var(--text-sm); font-weight: var(--font-medium);
          color: var(--foreground); margin-bottom: var(--space-2);
        }
        .char-count { font-size: 11px; color: var(--foreground-muted); font-weight: 400; }

        .platform-grid, .tone-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: var(--space-2); }
        .platform-btn, .tone-btn {
          padding: var(--space-2) var(--space-3); background: var(--background-alt);
          border: 1px solid var(--border); border-radius: var(--radius-md);
          font-size: var(--text-sm); font-weight: var(--font-medium);
          color: var(--foreground-muted); cursor: pointer; transition: all var(--transition-fast);
        }
        .platform-btn:hover, .tone-btn:hover { border-color: var(--primary-500); color: var(--foreground); }
        .platform-btn.active, .tone-btn.active { background: var(--primary-600); border-color: var(--primary-600); color: white; }

        .caption-preview { background: var(--background-alt); border-radius: var(--radius-lg); padding: var(--space-6); }
        .caption-section { margin-bottom: var(--space-4); }
        .caption-section:last-child { margin-bottom: 0; }
        .caption-label {
          font-size: var(--text-xs); font-weight: var(--font-semibold);
          color: var(--foreground-muted); text-transform: uppercase;
          letter-spacing: 0.05em; margin-bottom: var(--space-2);
        }
        .caption-text { font-size: var(--text-base); color: var(--foreground); line-height: var(--leading-relaxed); }
        .caption-text.hook { font-weight: var(--font-semibold); font-size: var(--text-lg); }
        .caption-text.cta { font-style: italic; }

        .hashtags { display: flex; flex-wrap: wrap; gap: var(--space-2); }
        .hashtag {
          padding: 4px 10px; background: var(--primary-100);
          color: var(--primary-700); border-radius: var(--radius-sm);
          font-size: var(--text-sm); font-weight: var(--font-medium);
        }
        [data-theme="dark"] .hashtag { background: rgba(99,102,241,0.2); color: var(--primary-300); }

        .caption-stats {
          margin-top: var(--space-4); padding-top: var(--space-4);
          border-top: 1px solid var(--border); display: flex; gap: var(--space-4);
          font-size: var(--text-xs); color: var(--foreground-muted);
        }

        .empty-state {
          display: flex; flex-direction: column; align-items: center;
          justify-content: center; text-align: center; min-height: 500px;
        }
        .empty-state h3 { margin: 0 0 var(--space-2) 0; color: var(--foreground); }
        .empty-state p { margin: 0; color: var(--foreground-muted); max-width: 400px; }

        .error-message {
          padding: var(--space-3) var(--space-4); background: #fee2e2;
          border: 1px solid #ef4444; border-radius: var(--radius-md);
          color: #dc2626; font-size: var(--text-sm);
        }

        .modal-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.5);
          display: flex; align-items: center; justify-content: center;
          z-index: 1000; padding: 20px; backdrop-filter: blur(4px);
        }
        .modal-content {
          background: var(--background); border-radius: 20px; padding: 32px;
          width: 100%; max-width: 420px; box-shadow: 0 25px 80px rgba(0,0,0,0.25);
        }
      `}</style>
    </div>
  );
}

export default function GeneratePageV2() {
  return (
    <Suspense fallback={null}>
      <GeneratePageContent />
    </Suspense>
  );
}
