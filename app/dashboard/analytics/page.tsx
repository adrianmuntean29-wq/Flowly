'use client';

import { useEffect, useState } from 'react';
import { usePosts } from '@/lib/hooks/useApi';
import { useAuth } from '@/lib/context/AuthContext';

const TYPE_COLORS: Record<string, string> = {
  POST: '#667eea', CAROUSEL: '#f093fb', REEL: '#4facfe', VIDEO: '#43e97b', AD: '#fa709a',
};

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  DRAFT:     { bg: '#f3f4f6', color: '#374151' },
  SCHEDULED: { bg: '#fef3c7', color: '#92400e' },
  PUBLISHED: { bg: '#d1fae5', color: '#065f46' },
};

const MONTH_NAMES = ['Ian', 'Feb', 'Mar', 'Apr', 'Mai', 'Iun', 'Iul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function AnalyticsPage() {
  const { user, token } = useAuth();
  const { list } = usePosts();
  const [posts, setPosts] = useState<any[]>([]);
  const [carouselCount, setCarouselCount] = useState(0);
  const [templateCount, setTemplateCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [postsData, carouselsData, templatesData] = await Promise.all([
          list(undefined),
          fetch('/api/carousels', { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()).catch(() => ({ carousels: [] })),
          fetch('/api/templates', { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()).catch(() => ([])),
        ]);
        setPosts(postsData.posts || []);
        setCarouselCount((carouselsData.carousels || []).length);
        setTemplateCount(Array.isArray(templatesData) ? templatesData.length : 0);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  // ── Computed stats ──
  const total = posts.length;
  const published = posts.filter((p) => p.status === 'PUBLISHED').length;
  const scheduled = posts.filter((p) => p.status === 'SCHEDULED').length;
  const drafts = posts.filter((p) => p.status === 'DRAFT').length;

  // Posts by type
  const byType: Record<string, number> = {};
  posts.forEach((p) => { byType[p.type] = (byType[p.type] || 0) + 1; });
  const maxType = Math.max(...Object.values(byType), 1);

  // Posts by month (last 6 months)
  const now = new Date();
  const monthData: { label: string; count: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const count = posts.filter((p) => {
      const pd = new Date(p.createdAt);
      return pd.getMonth() === d.getMonth() && pd.getFullYear() === d.getFullYear();
    }).length;
    monthData.push({ label: MONTH_NAMES[d.getMonth()], count });
  }
  const maxMonth = Math.max(...monthData.map((m) => m.count), 1);

  // Posts by platform
  const byPlatform: Record<string, number> = {};
  posts.forEach((p) => {
    (p.platforms || []).forEach((pl: string) => {
      byPlatform[pl] = (byPlatform[pl] || 0) + 1;
    });
  });

  // This month count
  const thisMonth = posts.filter((p) => {
    const d = new Date(p.createdAt);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  // Active days (unique days with at least one post)
  const activeDays = new Set(posts.map((p) => new Date(p.createdAt).toDateString())).size;

  // Publish rate
  const publishRate = total > 0 ? Math.round((published / total) * 100) : 0;

  const planLimit = user?.subscriptionPlan === 'FREE' ? 20 : user?.subscriptionPlan === 'PRO' ? 200 : null;

  // Recent posts (last 5)
  const recentPosts = [...posts]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  return (
    <div style={{ maxWidth: '1100px' }}>
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '26px', fontWeight: '700', color: 'var(--foreground)', margin: '0 0 6px 0' }}>
          📊 Analytics
        </h2>
        <p style={{ fontSize: '14px', color: 'var(--foreground-muted)', margin: 0 }}>
          Statisticile activității tale de conținut
        </p>
      </div>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--foreground-muted)' }}>
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>📊</div>
          <p>Se calculează statisticile...</p>
        </div>
      ) : (
        <>
          {/* KPI Cards — responsive grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
            gap: '16px',
            marginBottom: '32px',
          }}>
            {[
              { label: 'Total Posturi', value: total, icon: '📝', color: '#667eea', sub: 'toate timpurile' },
              { label: 'Publicate', value: published, icon: '✅', color: '#10b981', sub: 'live acum' },
              { label: 'Programate', value: scheduled, icon: '📅', color: '#f59e0b', sub: 'în așteptare' },
              { label: 'Drafturi', value: drafts, icon: '✏️', color: '#6b7280', sub: 'nesalvate' },
              { label: 'Carusele', value: carouselCount, icon: '🎠', color: '#f093fb', sub: 'generate' },
              { label: 'Template-uri', value: templateCount, icon: '🎨', color: '#8b5cf6', sub: 'salvate' },
              { label: 'Luna aceasta', value: thisMonth, icon: '📈', color: '#ef4444', sub: planLimit ? `din ${planLimit} permise` : 'nelimitat' },
              { label: 'Zile active', value: activeDays, icon: '🗓️', color: '#0ea5e9', sub: 'cu activitate' },
            ].map(({ label, value, icon, color, sub }) => (
              <div key={label} style={{
                background: 'var(--background)',
                borderRadius: '16px', padding: '20px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.08)', borderTop: `3px solid ${color}`,
              }}>
                <p style={{ fontSize: '11px', color: 'var(--foreground-muted)', margin: '0 0 8px 0', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {icon} {label}
                </p>
                <p style={{ fontSize: '36px', fontWeight: '900', margin: '0 0 4px 0', color: 'var(--foreground)', lineHeight: 1 }}>{value}</p>
                <p style={{ fontSize: '11px', color: 'var(--foreground-muted)', margin: 0 }}>{sub}</p>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))', gap: '24px', marginBottom: '24px' }}>
            {/* Monthly bar chart */}
            <div style={{ background: 'var(--background)', borderRadius: '16px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
              <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--foreground)', margin: '0 0 24px 0' }}>
                Posturi per lună
              </h3>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', height: '160px' }}>
                {monthData.map(({ label, count }) => (
                  <div key={label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', height: '100%', justifyContent: 'flex-end' }}>
                    <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--foreground)' }}>{count || ''}</span>
                    <div
                      title={`${count} posturi`}
                      style={{
                        width: '100%',
                        height: `${Math.max((count / maxMonth) * 130, count > 0 ? 4 : 0)}px`,
                        background: 'linear-gradient(180deg, #667eea, #764ba2)',
                        borderRadius: '6px 6px 0 0',
                        transition: 'height 0.5s ease',
                        minHeight: count > 0 ? '4px' : '0',
                      }}
                    />
                    <span style={{ fontSize: '11px', color: 'var(--foreground-muted)', fontWeight: '500' }}>{label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* By type */}
            <div style={{ background: 'var(--background)', borderRadius: '16px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
              <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--foreground)', margin: '0 0 24px 0' }}>
                Tip de conținut
              </h3>
              {Object.keys(byType).length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--foreground-muted)' }}>
                  <p style={{ margin: 0 }}>Niciun post generat încă</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {Object.entries(byType)
                    .sort(([, a], [, b]) => b - a)
                    .map(([type, count]) => (
                      <div key={type}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--foreground)' }}>{type}</span>
                          <span style={{ fontSize: '13px', fontWeight: '700', color: TYPE_COLORS[type] || '#667eea' }}>
                            {count} ({Math.round((count / total) * 100)}%)
                          </span>
                        </div>
                        <div style={{ height: '8px', background: 'var(--background-alt)', borderRadius: '999px', overflow: 'hidden' }}>
                          <div style={{
                            height: '100%',
                            width: `${(count / maxType) * 100}%`,
                            background: TYPE_COLORS[type] || '#667eea',
                            borderRadius: '999px',
                            transition: 'width 0.5s ease',
                          }} />
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))', gap: '24px', marginBottom: '24px' }}>
            {/* Platforms */}
            <div style={{ background: 'var(--background)', borderRadius: '16px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
              <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--foreground)', margin: '0 0 20px 0' }}>
                Platforme utilizate
              </h3>
              {Object.keys(byPlatform).length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px', color: 'var(--foreground-muted)' }}>
                  <p style={{ margin: '0 0 8px 0' }}>Niciun post asociat cu platforme</p>
                  <p style={{ fontSize: '12px', margin: 0 }}>Adaugă platforme când salvezi un post</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {Object.entries(byPlatform)
                    .sort(([, a], [, b]) => b - a)
                    .map(([platform, count]) => {
                      const maxPlat = Math.max(...Object.values(byPlatform));
                      return (
                        <div key={platform} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--foreground)', width: '90px', textTransform: 'capitalize' }}>{platform.toLowerCase()}</span>
                          <div style={{ flex: 1, height: '10px', background: 'var(--background-alt)', borderRadius: '999px', overflow: 'hidden' }}>
                            <div style={{
                              height: '100%', width: `${(count / maxPlat) * 100}%`,
                              background: 'linear-gradient(90deg, #667eea, #764ba2)',
                              borderRadius: '999px',
                            }} />
                          </div>
                          <span style={{ fontSize: '13px', fontWeight: '700', color: '#667eea', minWidth: '24px', textAlign: 'right' }}>{count}</span>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>

            {/* Plan usage + quick stats */}
            <div style={{ background: 'var(--background)', borderRadius: '16px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
              <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--foreground)', margin: '0 0 20px 0' }}>
                Utilizare Plan
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Plan badge */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '14px 16px',
                  background: user?.subscriptionPlan === 'PRO' ? '#fef3c7' : user?.subscriptionPlan === 'ENTERPRISE' ? '#ede9fe' : 'var(--background-alt)',
                  borderRadius: '10px',
                }}>
                  <span style={{ fontSize: '24px' }}>
                    {user?.subscriptionPlan === 'PRO' ? '⭐' : user?.subscriptionPlan === 'ENTERPRISE' ? '💎' : '🆓'}
                  </span>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--foreground)' }}>
                      Plan {user?.subscriptionPlan || 'FREE'}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--foreground-muted)' }}>
                      {planLimit ? `${planLimit} posturi/lună` : 'Posturi nelimitate'}
                    </div>
                  </div>
                  {user?.subscriptionPlan === 'FREE' && (
                    <a
                      href="/dashboard/billing"
                      style={{
                        marginLeft: 'auto', padding: '6px 14px',
                        background: 'linear-gradient(135deg, #667eea, #764ba2)',
                        color: 'white', textDecoration: 'none',
                        borderRadius: '8px', fontSize: '12px', fontWeight: '700',
                      }}
                    >
                      Upgrade
                    </a>
                  )}
                </div>

                {planLimit && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontSize: '13px', color: 'var(--foreground-muted)' }}>Posturi luna aceasta</span>
                      <span style={{ fontSize: '13px', fontWeight: '700', color: thisMonth > planLimit * 0.8 ? '#ef4444' : '#667eea' }}>
                        {thisMonth} / {planLimit}
                      </span>
                    </div>
                    <div style={{ height: '10px', background: 'var(--background-alt)', borderRadius: '999px', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%',
                        width: `${Math.min((thisMonth / planLimit) * 100, 100)}%`,
                        background: thisMonth > planLimit * 0.8
                          ? 'linear-gradient(90deg, #f59e0b, #ef4444)'
                          : 'linear-gradient(90deg, #667eea, #764ba2)',
                        borderRadius: '999px',
                        transition: 'width 0.5s ease',
                      }} />
                    </div>
                    {thisMonth > planLimit * 0.8 && (
                      <p style={{ fontSize: '11px', color: '#ef4444', margin: '6px 0 0 0', fontWeight: '600' }}>
                        ⚠️ Aproape de limita lunară — consideră un upgrade
                      </p>
                    )}
                  </div>
                )}

                {/* Quick stats */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  {[
                    { label: 'Rata publicare', value: `${publishRate}%`, color: '#10b981' },
                    { label: 'Drafturi', value: `${drafts}`, color: '#6b7280' },
                    { label: 'Zile active', value: `${activeDays}`, color: '#667eea' },
                    { label: 'Rămase luna', value: planLimit ? `${Math.max(0, planLimit - thisMonth)}` : '∞', color: '#f093fb' },
                  ].map(({ label, value, color }) => (
                    <div key={label} style={{ padding: '12px', background: 'var(--background-alt)', borderRadius: '10px' }}>
                      <p style={{ fontSize: '20px', fontWeight: '800', color, margin: '0 0 2px 0' }}>{value}</p>
                      <p style={{ fontSize: '11px', color: 'var(--foreground-muted)', margin: 0 }}>{label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Recent posts table */}
          {recentPosts.length > 0 && (
            <div style={{ background: 'var(--background)', borderRadius: '16px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
              <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--foreground)', margin: '0 0 20px 0' }}>
                Activitate recentă
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                {recentPosts.map((post, i) => (
                  <div key={post.id} style={{
                    display: 'flex', alignItems: 'center', gap: '14px',
                    padding: '12px 0',
                    borderBottom: i < recentPosts.length - 1 ? '1px solid var(--border)' : 'none',
                  }}>
                    {/* Type color dot */}
                    <div style={{
                      width: '10px', height: '10px', borderRadius: '50%', flexShrink: 0,
                      background: TYPE_COLORS[post.type] || '#667eea',
                    }} />

                    {/* Caption */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{
                        fontSize: '13px', fontWeight: '500', color: 'var(--foreground)',
                        margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {post.caption || '(fără text)'}
                      </p>
                      <p style={{ fontSize: '11px', color: 'var(--foreground-muted)', margin: '2px 0 0 0' }}>
                        {new Date(post.createdAt).toLocaleDateString('ro-RO', { day: '2-digit', month: 'short', year: 'numeric' })}
                        {post.platforms?.length > 0 && ` · ${post.platforms.join(', ')}`}
                      </p>
                    </div>

                    {/* Status badge */}
                    <span style={{
                      fontSize: '10px', fontWeight: '700', padding: '3px 9px', borderRadius: '5px',
                      background: STATUS_COLORS[post.status]?.bg || '#f3f4f6',
                      color: STATUS_COLORS[post.status]?.color || '#374151',
                      flexShrink: 0,
                    }}>
                      {post.status}
                    </span>
                  </div>
                ))}
              </div>
              <a
                href="/dashboard/posts"
                style={{
                  display: 'inline-block', marginTop: '16px',
                  fontSize: '13px', fontWeight: '600', color: '#667eea', textDecoration: 'none',
                }}
              >
                Vezi toate postările →
              </a>
            </div>
          )}
        </>
      )}
    </div>
  );
}
