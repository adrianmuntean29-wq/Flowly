'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import { useToast } from '@/lib/context/ToastContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Crown, Save, Sparkles, RefreshCw, Video, ExternalLink } from 'lucide-react';

// ─── Supported video AI APIs ─────────────────────────────────────────────────

const VIDEO_APIS = [
  {
    name: 'Runway Gen-3',
    provider: 'custom_runway',
    description: 'Cel mai avansat model de generare video AI — calitate cinematografică',
    badge: 'POPULAR',
    badgeColor: '#6366f1',
    url: 'https://runwayml.com/',
    features: ['Text-to-Video', 'Image-to-Video', 'Motion Brush'],
  },
  {
    name: 'Pika Labs',
    provider: 'custom_pika',
    description: 'Generare video rapidă și creativă din text sau imagini',
    badge: 'FAST',
    badgeColor: '#10b981',
    url: 'https://pika.art/',
    features: ['Text-to-Video', 'Animate Image', 'Lipsyncing'],
  },
  {
    name: 'Luma Dream Machine',
    provider: 'custom_luma',
    description: 'Video ultra-realistic cu fizică și mișcări naturale',
    badge: 'REALISTIC',
    badgeColor: '#f59e0b',
    url: 'https://lumalabs.ai/',
    features: ['Text-to-Video', 'Image-to-Video', 'Loop'],
  },
  {
    name: 'Kling AI',
    provider: 'custom_kling',
    description: 'Video de calitate înaltă cu control avansat al mișcărilor',
    badge: 'CONTROL',
    badgeColor: '#ec4899',
    url: 'https://klingai.com/',
    features: ['Text-to-Video', 'Subject Reference', 'Camera Control'],
  },
];

const PLATFORMS = ['INSTAGRAM', 'TIKTOK', 'YOUTUBE', 'FACEBOOK', 'LINKEDIN'];
const DURATIONS = ['5s', '10s', '15s', '30s', '60s'];
const STYLES = ['cinematic', 'documentary', 'animated', 'vlog', 'product-showcase', 'ad'];
const ASPECT_RATIOS = [
  { value: '9:16', label: '9:16 — Vertical (Stories/Reels)' },
  { value: '1:1',  label: '1:1 — Pătrat (Feed)' },
  { value: '16:9', label: '16:9 — Landscape (YouTube)' },
];

// ─────────────────────────────────────────────────────────────────────────────

export default function GenerateVideoPage() {
  const { user, token } = useAuth();
  const { success, error: toastError } = useToast();
  const router = useRouter();

  const plan = (user?.subscriptionPlan || 'FREE') as string;
  const isPro = plan === 'PRO' || plan === 'ENTERPRISE';

  const [concept, setConcept] = useState('');
  const [style, setStyle] = useState('cinematic');
  const [duration, setDuration] = useState('15s');
  const [platform, setPlatform] = useState('INSTAGRAM');
  const [aspectRatio, setAspectRatio] = useState('9:16');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveBrief = async () => {
    if (!concept.trim()) { toastError('Introdu conceptul video'); return; }
    setIsSaving(true);
    try {
      const brief = `📹 VIDEO BRIEF\nConcepte: ${concept}\nStil: ${style}\nDurată: ${duration}\nPlatformă: ${platform}\nAspect: ${aspectRatio}\n${additionalNotes ? `Note: ${additionalNotes}` : ''}`;
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          type: 'VIDEO',
          caption: brief,
          platforms: [platform],
          status: 'DRAFT',
        }),
      });
      if (!res.ok) throw new Error('Save failed');
      success('Brief video salvat ca Draft!');
      router.push('/dashboard/posts');
    } catch {
      toastError('Eroare la salvare');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: '1100px' }}>
      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <Link href="/dashboard/generate" style={tabStyle(false)}>✍️ Text</Link>
        <Link href="/dashboard/generate/image" style={tabStyle(false)}>🖼️ Image</Link>
        <Link href="/dashboard/generate/carousel" style={tabStyle(false)}>🎠 Carousel</Link>
        <span style={tabStyle(true)}>🎬 Video</span>
        <Link href="/dashboard/generate/reel" style={tabStyle(false)}>🎯 Reel</Link>
      </div>

      {/* PRO gate */}
      {!isPro ? (
        <div style={{
          background: 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(139,92,246,0.08))',
          border: '1.5px solid rgba(99,102,241,0.25)',
          borderRadius: '20px', padding: '52px 48px', textAlign: 'center',
        }}>
          <Crown size={56} style={{ color: '#f59e0b', marginBottom: '20px' }} />
          <h2 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--foreground)', margin: '0 0 12px 0' }}>
            Generare Video — PRO
          </h2>
          <p style={{ color: 'var(--foreground-muted)', fontSize: '15px', margin: '0 0 10px 0', maxWidth: '540px', marginInline: 'auto' }}>
            Conectează-ți API-ul de la Runway, Pika, Luma sau Kling și generează video-uri profesionale direct din Flowly.
          </p>
          <p style={{ color: 'var(--foreground-muted)', fontSize: '14px', margin: '0 0 28px 0' }}>
            Disponibil pentru planurile <strong>PRO</strong> și <strong>Business</strong>.
          </p>
          <a
            href="/pricing"
            style={{
              display: 'inline-block', padding: '14px 36px',
              background: 'linear-gradient(135deg,#667eea,#764ba2)',
              color: '#fff', borderRadius: '12px', textDecoration: 'none',
              fontSize: '15px', fontWeight: '700',
            }}
          >
            🚀 Upgrade la PRO
          </a>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '28px' }}>

          {/* Left: Brief form */}
          <div className="card" style={{ padding: '32px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--foreground)', margin: '0 0 24px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Video size={20} style={{ color: '#6366f1' }} />
              Brief Video
            </h2>

            {/* Concept */}
            <div style={{ marginBottom: '18px' }}>
              <label style={fieldLabel}>Concept / Idee video *</label>
              <textarea
                value={concept}
                onChange={(e) => setConcept(e.target.value)}
                placeholder="Ex: Un produs de beauty prezentat în slow-motion cu petale de trandafir, muzică ambient..."
                rows={4}
                style={{ ...inputStyle, resize: 'vertical', lineHeight: '1.6', fontFamily: 'inherit' }}
              />
            </div>

            {/* Style + Duration */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '18px' }}>
              <div>
                <label style={fieldLabel}>Stil vizual</label>
                <select value={style} onChange={(e) => setStyle(e.target.value)} style={{ ...inputStyle, cursor: 'pointer', textTransform: 'capitalize' }}>
                  {STYLES.map((s) => <option key={s} value={s} style={{ textTransform: 'capitalize' }}>{s.replace('-', ' ')}</option>)}
                </select>
              </div>
              <div>
                <label style={fieldLabel}>Durată</label>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {DURATIONS.map((d) => (
                    <button
                      key={d}
                      onClick={() => setDuration(d)}
                      style={{
                        padding: '8px 12px', borderRadius: '8px', fontSize: '13px', fontWeight: '600',
                        border: `2px solid ${duration === d ? '#6366f1' : 'var(--border, #e5e7eb)'}`,
                        background: duration === d ? '#eef2ff' : 'var(--background)',
                        color: duration === d ? '#6366f1' : 'var(--foreground-muted)',
                        cursor: 'pointer',
                      }}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Platform */}
            <div style={{ marginBottom: '18px' }}>
              <label style={fieldLabel}>Platformă destinație</label>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {PLATFORMS.map((p) => (
                  <button
                    key={p}
                    onClick={() => setPlatform(p)}
                    style={{
                      padding: '7px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: '700',
                      border: `2px solid ${platform === p ? '#6366f1' : 'var(--border, #e5e7eb)'}`,
                      background: platform === p ? '#eef2ff' : 'var(--background)',
                      color: platform === p ? '#6366f1' : 'var(--foreground-muted)',
                      cursor: 'pointer',
                    }}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Aspect ratio */}
            <div style={{ marginBottom: '18px' }}>
              <label style={fieldLabel}>Format / Aspect Ratio</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {ASPECT_RATIOS.map((ar) => (
                  <button
                    key={ar.value}
                    onClick={() => setAspectRatio(ar.value)}
                    style={{
                      padding: '10px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: '600',
                      border: `2px solid ${aspectRatio === ar.value ? '#6366f1' : 'var(--border, #e5e7eb)'}`,
                      background: aspectRatio === ar.value ? '#eef2ff' : 'var(--background)',
                      color: aspectRatio === ar.value ? '#6366f1' : 'var(--foreground)',
                      cursor: 'pointer', textAlign: 'left',
                    }}
                  >
                    {aspectRatio === ar.value ? '● ' : '○ '}{ar.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div style={{ marginBottom: '24px' }}>
              <label style={fieldLabel}>Note adiționale (opțional)</label>
              <textarea
                value={additionalNotes}
                onChange={(e) => setAdditionalNotes(e.target.value)}
                placeholder="Culori specifice, referințe, mood board, text overlay..."
                rows={2}
                style={{ ...inputStyle, resize: 'vertical', lineHeight: '1.6', fontFamily: 'inherit' }}
              />
            </div>

            <button
              onClick={handleSaveBrief}
              disabled={isSaving || !concept.trim()}
              className="btn btn-primary"
              style={{ width: '100%', padding: '14px', fontSize: '15px', fontWeight: '700' }}
            >
              {isSaving
                ? <><RefreshCw size={18} className="spin" /> Salvez brief-ul...</>
                : <><Save size={18} /> Salvează Brief ca Draft</>
              }
            </button>
          </div>

          {/* Right: Supported video APIs */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--foreground)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Sparkles size={16} style={{ color: '#6366f1' }} />
                  API-uri Video Suportate
                </h3>
                <Link
                  href="/dashboard/settings/integrations"
                  style={{
                    fontSize: '12px', fontWeight: '600', color: '#6366f1',
                    textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px',
                  }}
                >
                  Adaugă cheie API →
                </Link>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {VIDEO_APIS.map((api) => (
                  <div
                    key={api.provider}
                    style={{
                      padding: '14px 16px', borderRadius: '12px',
                      border: '1.5px solid var(--border, #e5e7eb)',
                      background: 'var(--background-alt, #f9fafb)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--foreground)' }}>
                        {api.name}
                      </span>
                      <span style={{
                        fontSize: '10px', fontWeight: '700', padding: '2px 7px',
                        background: api.badgeColor + '18', color: api.badgeColor,
                        borderRadius: '5px',
                      }}>
                        {api.badge}
                      </span>
                      <a
                        href={api.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ marginLeft: 'auto', color: 'var(--foreground-muted)' }}
                      >
                        <ExternalLink size={14} />
                      </a>
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--foreground-muted)', margin: '0 0 8px 0', lineHeight: '1.5' }}>
                      {api.description}
                    </p>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {api.features.map((f) => (
                        <span key={f} style={{
                          fontSize: '10px', fontWeight: '600', padding: '2px 8px',
                          background: 'var(--background)', border: '1px solid var(--border)',
                          borderRadius: '4px', color: 'var(--foreground-muted)',
                        }}>
                          {f}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* How it works */}
            <div style={{
              padding: '16px 20px', borderRadius: '12px',
              background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.15)',
            }}>
              <p style={{ fontSize: '13px', fontWeight: '700', color: '#6366f1', margin: '0 0 8px 0' }}>
                💡 Cum funcționează?
              </p>
              <ol style={{ margin: 0, paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <li style={{ fontSize: '12px', color: 'var(--foreground-muted)', lineHeight: '1.5' }}>
                  Adaugă cheia API de la Runway, Pika, Luma sau Kling în <Link href="/dashboard/settings/integrations" style={{ color: '#6366f1' }}>Integrations</Link>
                </li>
                <li style={{ fontSize: '12px', color: 'var(--foreground-muted)', lineHeight: '1.5' }}>
                  Completează brief-ul video de mai jos
                </li>
                <li style={{ fontSize: '12px', color: 'var(--foreground-muted)', lineHeight: '1.5' }}>
                  Salvează draft-ul și generează video-ul direct din platforma aleasă
                </li>
              </ol>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Style helpers ────────────────────────────────────────────────────────────

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
