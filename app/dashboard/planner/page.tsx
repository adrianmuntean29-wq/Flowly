'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/context/AuthContext';

const TYPE_COLORS: Record<string, string> = {
  POST: '#667eea', CAROUSEL: '#f093fb', REEL: '#4facfe', VIDEO: '#43e97b', AD: '#fa709a',
};

const DAY_NAMES = ['Lun', 'Mar', 'Mie', 'Joi', 'Vin', 'Sâm', 'Dum'];
const FULL_DAY_NAMES = ['Luni', 'Marți', 'Miercuri', 'Joi', 'Vineri', 'Sâmbătă', 'Duminică'];
const PLATFORM_ICONS: Record<string, string> = {
  instagram: '📸', tiktok: '🎵', linkedin: '💼', facebook: '👥',
};

interface PlanItem {
  date: string;
  title: string;
  content: string;
  type: string;
  hook: string;
  platforms: string[];
  dayTheme: string;
}

export default function PlannerPage() {
  const { token, user } = useAuth();
  const [plan, setPlan] = useState<PlanItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [postsPerDay, setPostsPerDay] = useState(1);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['instagram']);
  const [error, setError] = useState('');
  const [savedIds, setSavedIds] = useState<Set<number>>(new Set());
  const [successMsg, setSuccessMsg] = useState('');

  const togglePlatform = (p: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
    );
  };

  const generatePlan = async () => {
    setIsLoading(true);
    setError('');
    setPlan([]);
    setSavedIds(new Set());
    setSuccessMsg('');

    const startDate = new Date();
    // Start from next Monday
    const day = startDate.getDay();
    const diff = day === 0 ? 1 : 8 - day;
    startDate.setDate(startDate.getDate() + (day === 1 ? 0 : diff));

    try {
      const res = await fetch('/api/ai/planner', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          postsPerDay,
          startDate: startDate.toISOString(),
          platforms: selectedPlatforms,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setPlan(data.plan || []);
    } catch (err: any) {
      setError(err.message || 'Eroare la generare plan');
    } finally {
      setIsLoading(false);
    }
  };

  const savePost = async (item: PlanItem, idx: number) => {
    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: item.type,
          caption: item.content,
          platforms: item.platforms,
          status: 'SCHEDULED',
          scheduledFor: `${item.date}T09:00:00.000Z`,
        }),
      });

      if (!res.ok) throw new Error('Failed to save');
      setSavedIds((prev) => new Set([...prev, idx]));
    } catch (err: any) {
      setError('Eroare la salvare: ' + err.message);
    }
  };

  const saveAll = async () => {
    setIsSaving(true);
    setError('');
    setSuccessMsg('');

    const unsaved = plan.filter((_, idx) => !savedIds.has(idx));
    let savedCount = 0;

    for (let i = 0; i < unsaved.length; i++) {
      const item = unsaved[i];
      const originalIdx = plan.indexOf(item);
      try {
        await savePost(item, originalIdx);
        savedCount++;
      } catch {
        // continue with others
      }
    }

    setIsSaving(false);
    setSuccessMsg(`✅ ${savedCount} posturi salvate în Calendar!`);
  };

  // Group plan by date
  const grouped: Record<string, PlanItem[]> = {};
  plan.forEach((item) => {
    if (!grouped[item.date]) grouped[item.date] = [];
    grouped[item.date].push(item);
  });
  const dates = Object.keys(grouped).sort();

  return (
    <div style={{ maxWidth: '1100px' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '26px', fontWeight: '700', color: '#111827', margin: '0 0 6px 0' }}>
          🗓️ AI Weekly Planner
        </h2>
        <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>
          Generează un plan de conținut complet pentru 7 zile cu un singur click
        </p>
      </div>

      {/* Config panel */}
      <div style={{
        background: 'white', borderRadius: '16px', padding: '24px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)', marginBottom: '24px',
      }}>
        <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          {/* Posts per day */}
          <div>
            <label style={labelStyle}>Posturi pe zi</label>
            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
              {[1, 2, 3].map((n) => (
                <button
                  key={n}
                  onClick={() => setPostsPerDay(n)}
                  style={{
                    width: '40px', height: '40px',
                    border: `2px solid ${postsPerDay === n ? '#667eea' : '#e5e7eb'}`,
                    background: postsPerDay === n ? '#eef2ff' : 'white',
                    color: postsPerDay === n ? '#667eea' : '#6b7280',
                    borderRadius: '8px', cursor: 'pointer',
                    fontSize: '15px', fontWeight: '700',
                  }}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* Platforms */}
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Platforme</label>
            <div style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
              {Object.entries(PLATFORM_ICONS).map(([id, icon]) => (
                <button
                  key={id}
                  onClick={() => togglePlatform(id)}
                  style={{
                    padding: '8px 14px',
                    border: `2px solid ${selectedPlatforms.includes(id) ? '#667eea' : '#e5e7eb'}`,
                    background: selectedPlatforms.includes(id) ? '#eef2ff' : 'white',
                    color: selectedPlatforms.includes(id) ? '#667eea' : '#6b7280',
                    borderRadius: '8px', cursor: 'pointer',
                    fontSize: '13px', fontWeight: '600',
                    display: 'flex', alignItems: 'center', gap: '6px',
                  }}
                >
                  {icon} {id.charAt(0).toUpperCase() + id.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Generate button */}
          <button
            onClick={generatePlan}
            disabled={isLoading}
            style={{
              padding: '12px 32px',
              background: isLoading ? '#ccc' : 'linear-gradient(135deg, #667eea, #764ba2)',
              color: 'white', border: 'none', borderRadius: '10px',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              fontSize: '15px', fontWeight: '700', whiteSpace: 'nowrap',
            }}
          >
            {isLoading ? '⏳ Generez planul...' : '🧠 Generează Plan 7 Zile'}
          </button>
        </div>

        {/* Brand memory badge */}
        {(user?.brandTone || (user as any)?.brandIndustry) && (
          <div style={{
            marginTop: '16px', padding: '10px 14px',
            background: '#eef2ff', borderRadius: '8px',
            fontSize: '12px', color: '#4338ca',
          }}>
            🧠 <strong>Brand Memory activ</strong> — planul va fi personalizat pentru brandul tău
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

      {/* Success */}
      {successMsg && (
        <div style={{
          padding: '12px 16px', background: '#d1fae5', color: '#065f46',
          borderRadius: '10px', marginBottom: '20px', fontSize: '14px', fontWeight: '600',
        }}>
          {successMsg}
        </div>
      )}

      {/* Loading skeleton */}
      {isLoading && (
        <div>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '60px', background: 'white', borderRadius: '16px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
            flexDirection: 'column', gap: '16px',
          }}>
            <div style={{ fontSize: '48px' }}>🧠</div>
            <p style={{ fontSize: '16px', color: '#6b7280', margin: 0, fontWeight: '600' }}>
              Claude generează planul tău de 7 zile...
            </p>
            <p style={{ fontSize: '13px', color: '#9ca3af', margin: 0 }}>
              Creez {7 * postsPerDay} posturi personalizate pentru brandul tău
            </p>
          </div>
        </div>
      )}

      {/* Plan grid */}
      {!isLoading && plan.length > 0 && (
        <>
          {/* Actions bar */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            marginBottom: '20px',
          }}>
            <p style={{ fontSize: '14px', fontWeight: '600', color: '#374151', margin: 0 }}>
              📋 {plan.length} posturi generate pentru 7 zile
              {savedIds.size > 0 && (
                <span style={{ marginLeft: '8px', color: '#10b981' }}>
                  ({savedIds.size} salvate)
                </span>
              )}
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={generatePlan}
                style={{
                  padding: '8px 16px', background: '#f3f4f6', color: '#374151',
                  border: 'none', borderRadius: '8px', cursor: 'pointer',
                  fontSize: '13px', fontWeight: '600',
                }}
              >
                🔄 Regenerează
              </button>
              <button
                onClick={saveAll}
                disabled={isSaving || savedIds.size === plan.length}
                style={{
                  padding: '8px 20px',
                  background: savedIds.size === plan.length ? '#d1fae5' :
                    isSaving ? '#ccc' : 'linear-gradient(135deg, #10b981, #059669)',
                  color: savedIds.size === plan.length ? '#065f46' : 'white',
                  border: 'none', borderRadius: '8px', cursor: 'pointer',
                  fontSize: '13px', fontWeight: '700',
                }}
              >
                {isSaving ? '⏳ Salvez...' :
                  savedIds.size === plan.length ? '✅ Toate salvate' : '💾 Salvează tot în Calendar'}
              </button>
            </div>
          </div>

          {/* Days grid */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {dates.map((date, dayIdx) => {
              const items = grouped[date];
              const d = new Date(date + 'T12:00:00');
              const dayName = FULL_DAY_NAMES[d.getDay() === 0 ? 6 : d.getDay() - 1];
              const shortDate = `${d.getDate()} ${['Ian', 'Feb', 'Mar', 'Apr', 'Mai', 'Iun', 'Iul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][d.getMonth()]}`;
              const theme = items[0]?.dayTheme || '';

              return (
                <div key={date} style={{
                  background: 'white', borderRadius: '16px',
                  overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                }}>
                  {/* Day header */}
                  <div style={{
                    background: 'linear-gradient(135deg, #667eea15, #764ba215)',
                    borderBottom: '1px solid #e5e7eb',
                    padding: '12px 20px',
                    display: 'flex', alignItems: 'center', gap: '12px',
                  }}>
                    <div style={{
                      width: '42px', height: '42px', borderRadius: '10px',
                      background: 'linear-gradient(135deg, #667eea, #764ba2)',
                      display: 'flex', flexDirection: 'column',
                      alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                      <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.8)', fontWeight: '700', lineHeight: 1 }}>
                        {DAY_NAMES[d.getDay() === 0 ? 6 : d.getDay() - 1]}
                      </span>
                      <span style={{ fontSize: '16px', color: 'white', fontWeight: '800', lineHeight: 1 }}>
                        {d.getDate()}
                      </span>
                    </div>
                    <div>
                      <div style={{ fontSize: '15px', fontWeight: '700', color: '#111827' }}>
                        {dayName}, {shortDate}
                      </div>
                      {theme && (
                        <div style={{ fontSize: '12px', color: '#667eea', fontWeight: '600' }}>
                          🎯 Tema zilei: {theme}
                        </div>
                      )}
                    </div>
                    <div style={{ marginLeft: 'auto', fontSize: '12px', color: '#9ca3af' }}>
                      {items.length} {items.length === 1 ? 'post' : 'posturi'}
                    </div>
                  </div>

                  {/* Posts for this day */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: items.length > 1 ? `repeat(${items.length}, 1fr)` : '1fr',
                    gap: '0',
                  }}>
                    {items.map((item, itemIdx) => {
                      const globalIdx = plan.indexOf(item);
                      const isSaved = savedIds.has(globalIdx);
                      const color = TYPE_COLORS[item.type] || '#667eea';

                      return (
                        <div
                          key={itemIdx}
                          style={{
                            padding: '16px 20px',
                            borderLeft: `3px solid ${color}`,
                            borderRight: itemIdx > 0 ? '1px solid #f3f4f6' : 'none',
                            opacity: isSaved ? 0.7 : 1,
                          }}
                        >
                          {/* Type + platforms */}
                          <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap' }}>
                            <span style={{
                              fontSize: '10px', fontWeight: '800', padding: '2px 8px',
                              background: color, color: 'white', borderRadius: '4px',
                            }}>
                              {item.type}
                            </span>
                            {(item.platforms || []).map((pl) => (
                              <span key={pl} style={{ fontSize: '13px' }} title={pl}>
                                {PLATFORM_ICONS[pl] || pl}
                              </span>
                            ))}
                            {isSaved && (
                              <span style={{ fontSize: '11px', color: '#10b981', fontWeight: '600', marginLeft: 'auto' }}>
                                ✅ Salvat
                              </span>
                            )}
                          </div>

                          {/* Title */}
                          <h4 style={{ fontSize: '14px', fontWeight: '700', color: '#111827', margin: '0 0 6px 0', lineHeight: '1.4' }}>
                            {item.title}
                          </h4>

                          {/* Hook */}
                          <p style={{
                            fontSize: '12px', color: '#667eea', margin: '0 0 8px 0',
                            fontStyle: 'italic', fontWeight: '600',
                          }}>
                            "{item.hook}"
                          </p>

                          {/* Content preview */}
                          <p style={{
                            fontSize: '12px', color: '#6b7280', margin: '0 0 12px 0',
                            lineHeight: '1.6',
                            display: '-webkit-box',
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                          } as any}>
                            {item.content}
                          </p>

                          {/* Save button */}
                          <button
                            onClick={() => savePost(item, globalIdx)}
                            disabled={isSaved}
                            style={{
                              padding: '7px 14px',
                              background: isSaved ? '#f3f4f6' : `${color}15`,
                              color: isSaved ? '#9ca3af' : color,
                              border: `1px solid ${isSaved ? '#e5e7eb' : color + '44'}`,
                              borderRadius: '6px', cursor: isSaved ? 'default' : 'pointer',
                              fontSize: '12px', fontWeight: '700',
                            }}
                          >
                            {isSaved ? '✅ Salvat' : '💾 Salvează'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom save all */}
          {savedIds.size < plan.length && (
            <div style={{ marginTop: '24px', textAlign: 'center' }}>
              <button
                onClick={saveAll}
                disabled={isSaving}
                style={{
                  padding: '14px 40px',
                  background: isSaving ? '#ccc' : 'linear-gradient(135deg, #10b981, #059669)',
                  color: 'white', border: 'none', borderRadius: '12px',
                  cursor: isSaving ? 'not-allowed' : 'pointer',
                  fontSize: '16px', fontWeight: '700',
                  boxShadow: '0 4px 12px rgba(16,185,129,0.3)',
                }}
              >
                {isSaving ? '⏳ Salvez toate posturile...' : `💾 Salvează toate ${plan.length - savedIds.size} posturi în Calendar`}
              </button>
            </div>
          )}
        </>
      )}

      {/* Empty state */}
      {!isLoading && plan.length === 0 && !error && (
        <div style={{
          background: 'white', borderRadius: '16px', padding: '60px',
          textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
        }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>🗓️</div>
          <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#111827', margin: '0 0 8px 0' }}>
            Planifică o săptămână întreagă
          </h3>
          <p style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 8px 0', lineHeight: '1.6' }}>
            Claude va genera un plan complet de 7 zile cu posturi variate,<br />
            adaptate brandului tău și gata să fie programate.
          </p>
          <p style={{ fontSize: '13px', color: '#9ca3af', margin: '0 0 28px 0' }}>
            Setează numărul de posturi pe zi și platformele dorite, apoi apasă butonul.
          </p>
          <button
            onClick={generatePlan}
            style={{
              padding: '14px 36px',
              background: 'linear-gradient(135deg, #667eea, #764ba2)',
              color: 'white', border: 'none', borderRadius: '12px',
              cursor: 'pointer', fontSize: '16px', fontWeight: '700',
              boxShadow: '0 4px 12px rgba(102,126,234,0.4)',
            }}
          >
            🧠 Generează Plan 7 Zile
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
