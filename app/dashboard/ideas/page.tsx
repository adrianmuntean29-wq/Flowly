'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import { useRouter } from 'next/navigation';

const TYPE_COLORS: Record<string, string> = {
  POST: '#667eea', CAROUSEL: '#f093fb', REEL: '#4facfe', VIDEO: '#43e97b', AD: '#fa709a',
};

const POST_TYPES = ['ALL', 'POST', 'CAROUSEL', 'REEL', 'VIDEO', 'AD'];

interface Idea {
  title: string;
  prompt: string;
  type: string;
  hook: string;
  why: string;
}

export default function IdeasPage() {
  const { user, token } = useAuth();
  const router = useRouter();
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [postType, setPostType] = useState('ALL');
  const [count, setCount] = useState(10);
  const [error, setError] = useState('');
  const [savedIds, setSavedIds] = useState<Set<number>>(new Set());

  const generateIdeas = async () => {
    setIsLoading(true);
    setError('');
    setIdeas([]);
    setSavedIds(new Set());

    try {
      const res = await fetch('/api/ai/ideas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          count,
          postType: postType === 'ALL' ? undefined : postType,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setIdeas(data.ideas || []);
    } catch (err: any) {
      setError(err.message || 'Eroare la generare idei');
    } finally {
      setIsLoading(false);
    }
  };

  const useIdea = (idea: Idea, idx: number) => {
    const params = new URLSearchParams({
      prompt: idea.prompt,
      postType: idea.type,
    });
    setSavedIds((prev) => new Set([...prev, idx]));
    router.push(`/dashboard/generate?${params.toString()}`);
  };

  return (
    <div style={{ maxWidth: '1000px' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '26px', fontWeight: '700', color: '#111827', margin: '0 0 6px 0' }}>
          AI Topic Ideas
        </h2>
        <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>
          {user?.brandName
            ? `Idei de conținut personalizate pentru ${user.brandName}`
            : 'Generează idei de conținut viral bazate pe Brand Memory-ul tău'}
        </p>
      </div>

      {/* Controls */}
      <div style={{
        background: 'white', borderRadius: '16px', padding: '24px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)', marginBottom: '24px',
      }}>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          {/* Post type filter */}
          <div style={{ flex: '1', minWidth: '200px' }}>
            <label style={labelStyle}>Tip de conținut</label>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '8px' }}>
              {POST_TYPES.map((t) => (
                <button
                  key={t}
                  onClick={() => setPostType(t)}
                  style={{
                    padding: '6px 14px', fontSize: '12px', fontWeight: '700',
                    border: `2px solid ${postType === t ? (TYPE_COLORS[t] || '#667eea') : '#e5e7eb'}`,
                    background: postType === t ? `${TYPE_COLORS[t] || '#667eea'}15` : 'white',
                    color: postType === t ? (TYPE_COLORS[t] || '#667eea') : '#6b7280',
                    borderRadius: '8px', cursor: 'pointer',
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Count selector */}
          <div>
            <label style={labelStyle}>Număr idei</label>
            <select
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
              style={{
                marginTop: '8px', padding: '8px 12px',
                border: '1.5px solid #e5e7eb', borderRadius: '8px',
                fontSize: '14px', cursor: 'pointer', background: 'white',
              }}
            >
              {[5, 10, 15, 20].map((n) => (
                <option key={n} value={n}>{n} idei</option>
              ))}
            </select>
          </div>

          {/* Generate button */}
          <button
            onClick={generateIdeas}
            disabled={isLoading}
            style={{
              padding: '10px 28px',
              background: isLoading ? '#ccc' : 'linear-gradient(135deg, #667eea, #764ba2)',
              color: 'white', border: 'none', borderRadius: '10px',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              fontSize: '15px', fontWeight: '700',
              whiteSpace: 'nowrap',
            }}
          >
            {isLoading ? '⏳ Generez...' : '🧠 Generează Idei'}
          </button>
        </div>

        {/* Brand Memory notice */}
        {(user?.brandTone || user?.brandIndustry) && (
          <div style={{
            marginTop: '16px', padding: '10px 14px',
            background: '#eef2ff', borderRadius: '8px',
            fontSize: '12px', color: '#4338ca',
          }}>
            🧠 <strong>Brand Memory activ</strong> — ideile sunt personalizate pentru{' '}
            {[user.brandTone && `ton ${user.brandTone}`, user.brandIndustry && `industria ${user.brandIndustry}`]
              .filter(Boolean).join(' și ')}
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div style={{
          padding: '12px 16px', background: '#fee2e2', color: '#991b1b',
          borderRadius: '10px', marginBottom: '20px', fontSize: '14px',
        }}>
          ❌ {error}
        </div>
      )}

      {/* Loading skeleton */}
      {isLoading && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          {Array.from({ length: count > 6 ? 6 : count }).map((_, i) => (
            <div key={i} style={{
              height: '160px', background: '#f3f4f6', borderRadius: '14px',
              animation: 'pulse 1.5s ease-in-out infinite',
            }} />
          ))}
        </div>
      )}

      {/* Ideas grid */}
      {!isLoading && ideas.length > 0 && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <p style={{ fontSize: '14px', fontWeight: '600', color: '#374151', margin: 0 }}>
              {ideas.length} idei generate
            </p>
            <button
              onClick={generateIdeas}
              style={{
                padding: '6px 14px', background: '#f3f4f6', color: '#374151',
                border: 'none', borderRadius: '8px', cursor: 'pointer',
                fontSize: '12px', fontWeight: '600',
              }}
            >
              🔄 Regenerează
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {ideas.map((idea, idx) => {
              const color = TYPE_COLORS[idea.type] || '#667eea';
              const used = savedIds.has(idx);

              return (
                <div
                  key={idx}
                  style={{
                    background: 'white',
                    borderRadius: '14px',
                    padding: '20px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                    border: `1px solid ${color}22`,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    opacity: used ? 0.6 : 1,
                    transition: 'opacity 0.2s',
                  }}
                >
                  {/* Type badge */}
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span style={{
                      fontSize: '10px', fontWeight: '800', padding: '3px 9px',
                      background: color, color: 'white', borderRadius: '6px',
                    }}>
                      {idea.type}
                    </span>
                    {used && (
                      <span style={{ fontSize: '11px', color: '#10b981', fontWeight: '600' }}>✅ Folosit</span>
                    )}
                  </div>

                  {/* Title */}
                  <h4 style={{ fontSize: '15px', fontWeight: '700', color: '#111827', margin: 0, lineHeight: '1.4' }}>
                    {idea.title}
                  </h4>

                  {/* Hook */}
                  <div style={{
                    padding: '8px 12px',
                    background: `${color}0f`,
                    borderLeft: `3px solid ${color}`,
                    borderRadius: '0 6px 6px 0',
                  }}>
                    <p style={{ fontSize: '12px', color: '#374151', margin: 0, fontStyle: 'italic', lineHeight: '1.5' }}>
                      "{idea.hook}"
                    </p>
                  </div>

                  {/* Prompt preview */}
                  <p style={{ fontSize: '12px', color: '#6b7280', margin: 0, lineHeight: '1.6' }}>
                    {idea.prompt}
                  </p>

                  {/* Why */}
                  <p style={{ fontSize: '11px', color: '#9ca3af', margin: 0, fontStyle: 'italic' }}>
                    💡 {idea.why}
                  </p>

                  {/* CTA */}
                  <button
                    onClick={() => useIdea(idea, idx)}
                    style={{
                      marginTop: 'auto', padding: '9px',
                      background: used ? '#f3f4f6' : `linear-gradient(135deg, ${color}, ${color}bb)`,
                      color: used ? '#6b7280' : 'white',
                      border: 'none', borderRadius: '8px',
                      cursor: 'pointer', fontSize: '13px', fontWeight: '700',
                    }}
                  >
                    {used ? 'Deja folosit' : '✨ Folosește această idee'}
                  </button>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Empty state */}
      {!isLoading && ideas.length === 0 && !error && (
        <div style={{
          background: 'white', borderRadius: '16px', padding: '60px',
          textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
        }}>
          <div style={{ fontSize: '56px', marginBottom: '16px' }}>💡</div>
          <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#111827', margin: '0 0 8px 0' }}>
            Gata să generăm idei?
          </h3>
          <p style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 24px 0', lineHeight: '1.6' }}>
            Flowly va genera idei de conținut viral adaptate brandului tău.
            {!(user?.brandTone || user?.brandIndustry) && (
              <><br /><a href="/dashboard/settings" style={{ color: '#667eea', fontWeight: '600' }}>
                Completează Brand Memory
              </a> pentru idei mai personalizate.</>
            )}
          </p>
          <button
            onClick={generateIdeas}
            style={{
              padding: '12px 32px',
              background: 'linear-gradient(135deg, #667eea, #764ba2)',
              color: 'white', border: 'none', borderRadius: '10px',
              cursor: 'pointer', fontSize: '15px', fontWeight: '700',
            }}
          >
            🧠 Generează {count} Idei
          </button>
        </div>
      )}
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  fontSize: '11px',
  fontWeight: '700',
  color: '#374151',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
};
