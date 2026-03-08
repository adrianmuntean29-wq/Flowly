'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import { useToast } from '@/lib/context/ToastContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Crown, Save, Sparkles, RefreshCw, Zap } from 'lucide-react';

// ─── Reel-specific options ────────────────────────────────────────────────────

const REEL_STYLES = [
  { id: 'trending',     label: '🔥 Trending Hook', desc: 'Captivant în primele 3 secunde' },
  { id: 'educational',  label: '📚 Educational',   desc: 'Tutorial sau sfaturi rapide' },
  { id: 'storytelling', label: '🎭 Storytelling',   desc: 'Narativ emoțional' },
  { id: 'product',      label: '🛍️ Product',        desc: 'Prezentare produs / brand' },
  { id: 'ugc',          label: '🤳 UGC Style',      desc: 'User-generated content autentic' },
  { id: 'viral',        label: '⚡ Viral Format',   desc: 'Format optimizat pentru engagement' },
];

const DURATIONS = ['7s', '15s', '30s', '60s', '90s'];
const PLATFORMS = ['INSTAGRAM', 'TIKTOK', 'YOUTUBE'];
const HOOKS = [
  'Întrebare provocatoare',
  'Statistică surprinzătoare',
  'Promisiune + beneficiu',
  'Controversă / mit',
  'Behind the scenes',
];
const MUSIC_MOODS = ['Energic', 'Motivațional', 'Chill/Lo-fi', 'Emoțional', 'Funny/Playful', 'Cinematic'];

// ─────────────────────────────────────────────────────────────────────────────

export default function GenerateReelPage() {
  const { user, token } = useAuth();
  const { success, error: toastError } = useToast();
  const router = useRouter();

  const plan = (user?.subscriptionPlan || 'FREE') as string;
  const isPro = plan === 'PRO' || plan === 'ENTERPRISE';

  const [topic, setTopic] = useState('');
  const [reelStyle, setReelStyle] = useState('trending');
  const [duration, setDuration] = useState('15s');
  const [platform, setPlatform] = useState('INSTAGRAM');
  const [hook, setHook] = useState('');
  const [musicMood, setMusicMood] = useState('Energic');
  const [cta, setCta] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const selectedStyle = REEL_STYLES.find((s) => s.id === reelStyle);

  const handleSaveBrief = async () => {
    if (!topic.trim()) { toastError('Introdu subiectul Reel-ului'); return; }
    setIsSaving(true);
    try {
      const brief = [
        `🎯 REEL BRIEF`,
        `Subiect: ${topic}`,
        `Stil: ${selectedStyle?.label || reelStyle}`,
        `Durată: ${duration}`,
        `Platformă: ${platform}`,
        hook ? `Hook: ${hook}` : '',
        `Muzică: ${musicMood}`,
        cta ? `CTA: ${cta}` : '',
      ].filter(Boolean).join('\n');

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
      success('Brief Reel salvat ca Draft!');
      router.push('/dashboard/posts');
    } catch {
      toastError('Eroare la salvare');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: '900px' }}>
      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <Link href="/dashboard/generate" style={tabStyle(false)}>✍️ Text</Link>
        <Link href="/dashboard/generate/image" style={tabStyle(false)}>🖼️ Image</Link>
        <Link href="/dashboard/generate/carousel" style={tabStyle(false)}>🎠 Carousel</Link>
        <Link href="/dashboard/generate/video" style={tabStyle(false)}>🎬 Video</Link>
        <span style={tabStyle(true)}>🎯 Reel</span>
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
            Reel Generator — PRO
          </h2>
          <p style={{ color: 'var(--foreground-muted)', fontSize: '15px', margin: '0 0 10px 0', maxWidth: '540px', marginInline: 'auto' }}>
            Creează brief-uri de Reels optimizate cu AI pentru Instagram și TikTok — cu hook, muzică și CTA.
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
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '28px', alignItems: 'start' }}>

          {/* Left: Main form */}
          <div className="card" style={{ padding: '32px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--foreground)', margin: '0 0 24px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Zap size={20} style={{ color: '#6366f1' }} />
              Reel Brief
            </h2>

            {/* Topic */}
            <div style={{ marginBottom: '20px' }}>
              <label style={fieldLabel}>Subiect / Concept Reel *</label>
              <textarea
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Ex: 3 exerciții de dimineață care îți schimbă ziua, Cum să faci cold brew acasă în 5 pași..."
                rows={3}
                style={{ ...inputStyle, resize: 'vertical', lineHeight: '1.6', fontFamily: 'inherit' }}
              />
            </div>

            {/* Reel Style */}
            <div style={{ marginBottom: '20px' }}>
              <label style={fieldLabel}>Stil Reel</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {REEL_STYLES.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setReelStyle(s.id)}
                    style={{
                      padding: '10px 12px', borderRadius: '10px', textAlign: 'left',
                      border: `2px solid ${reelStyle === s.id ? '#6366f1' : 'var(--border, #e5e7eb)'}`,
                      background: reelStyle === s.id ? '#eef2ff' : 'var(--background)',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ fontSize: '13px', fontWeight: '700', color: reelStyle === s.id ? '#6366f1' : 'var(--foreground)', marginBottom: '2px' }}>
                      {s.label}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--foreground-muted)' }}>{s.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Duration + Platform */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
              <div>
                <label style={fieldLabel}>Durată</label>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {DURATIONS.map((d) => (
                    <button
                      key={d}
                      onClick={() => setDuration(d)}
                      style={{
                        padding: '7px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: '700',
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
              <div>
                <label style={fieldLabel}>Platformă</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {PLATFORMS.map((p) => (
                    <button
                      key={p}
                      onClick={() => setPlatform(p)}
                      style={{
                        padding: '8px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: '700',
                        border: `2px solid ${platform === p ? '#6366f1' : 'var(--border, #e5e7eb)'}`,
                        background: platform === p ? '#eef2ff' : 'var(--background)',
                        color: platform === p ? '#6366f1' : 'var(--foreground-muted)',
                        cursor: 'pointer', textAlign: 'left',
                      }}
                    >
                      {platform === p ? '● ' : '○ '}{p}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* CTA */}
            <div style={{ marginBottom: '20px' }}>
              <label style={fieldLabel}>Call to Action (opțional)</label>
              <input
                type="text"
                value={cta}
                onChange={(e) => setCta(e.target.value)}
                placeholder="Ex: Urmărește pentru mai multe tips! Link în bio..."
                style={inputStyle}
              />
            </div>

            <button
              onClick={handleSaveBrief}
              disabled={isSaving || !topic.trim()}
              className="btn btn-primary"
              style={{ width: '100%', padding: '14px', fontSize: '15px', fontWeight: '700' }}
            >
              {isSaving
                ? <><RefreshCw size={18} className="spin" /> Salvez brief-ul...</>
                : <><Save size={18} /> Salvează Brief Reel ca Draft</>
              }
            </button>
          </div>

          {/* Right: Hook + Music */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* Hook picker */}
            <div className="card" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--foreground)', margin: '0 0 14px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={15} style={{ color: '#6366f1' }} />
                Tipul de Hook
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--foreground-muted)', margin: '0 0 12px 0' }}>
                Primele 3 secunde sunt decisive — alege hook-ul potrivit
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {HOOKS.map((h) => (
                  <button
                    key={h}
                    onClick={() => setHook(hook === h ? '' : h)}
                    style={{
                      padding: '9px 12px', borderRadius: '8px', fontSize: '13px', fontWeight: '600',
                      border: `2px solid ${hook === h ? '#6366f1' : 'var(--border, #e5e7eb)'}`,
                      background: hook === h ? '#eef2ff' : 'var(--background)',
                      color: hook === h ? '#6366f1' : 'var(--foreground)',
                      cursor: 'pointer', textAlign: 'left',
                    }}
                  >
                    {hook === h ? '✓ ' : ''}{h}
                  </button>
                ))}
              </div>
            </div>

            {/* Music mood */}
            <div className="card" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--foreground)', margin: '0 0 14px 0' }}>
                🎵 Mood Muzică
              </h3>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {MUSIC_MOODS.map((m) => (
                  <button
                    key={m}
                    onClick={() => setMusicMood(m)}
                    style={{
                      padding: '7px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: '600',
                      border: `2px solid ${musicMood === m ? '#6366f1' : 'var(--border, #e5e7eb)'}`,
                      background: musicMood === m ? '#eef2ff' : 'var(--background)',
                      color: musicMood === m ? '#6366f1' : 'var(--foreground-muted)',
                      cursor: 'pointer',
                    }}
                  >
                    {musicMood === m ? '♪ ' : ''}{m}
                  </button>
                ))}
              </div>
            </div>

            {/* Tips */}
            <div style={{
              padding: '16px 20px', borderRadius: '12px',
              background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.2)',
            }}>
              <p style={{ fontSize: '13px', fontWeight: '700', color: '#059669', margin: '0 0 8px 0' }}>
                📈 Tips pentru Reels virale
              </p>
              <ul style={{ margin: 0, paddingLeft: '14px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <li style={{ fontSize: '11px', color: 'var(--foreground-muted)', lineHeight: '1.5' }}>
                  Folosește hook puternic în prima secundă
                </li>
                <li style={{ fontSize: '11px', color: 'var(--foreground-muted)', lineHeight: '1.5' }}>
                  Optimizează pentru 9:16 (full-screen)
                </li>
                <li style={{ fontSize: '11px', color: 'var(--foreground-muted)', lineHeight: '1.5' }}>
                  Adaugă text overlay pentru vizionare fără sunet
                </li>
                <li style={{ fontSize: '11px', color: 'var(--foreground-muted)', lineHeight: '1.5' }}>
                  Postează în primele 30 min după trending audio
                </li>
              </ul>
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
