'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import { usePosts } from '@/lib/hooks/useApi';
import { useRouter } from 'next/navigation';

const POST_TYPE_ICONS: Record<string, string> = {
  IMAGE: '🖼️', CAROUSEL: '🎠',
};

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  DRAFT:     { bg: '#fef3c7', text: '#92400e' },
  SCHEDULED: { bg: '#dbeafe', text: '#1e40af' },
  PUBLISHED: { bg: '#d1fae5', text: '#065f46' },
  FAILED:    { bg: '#fee2e2', text: '#991b1b' },
};

const STAT_CARDS = [
  { key: 'totalPosts',      icon: '◻', label: 'Total Posts',  gradient: 'linear-gradient(135deg,#6366f1,#8b5cf6)' },
  { key: 'scheduledPosts',  icon: '◷', label: 'Scheduled',    gradient: 'linear-gradient(135deg,#3b82f6,#06b6d4)' },
  { key: 'publishedPosts',  icon: '✦', label: 'Published',    gradient: 'linear-gradient(135deg,#10b981,#34d399)' },
  { key: 'drafts',          icon: '◈', label: 'Drafts',       gradient: 'linear-gradient(135deg,#f59e0b,#fbbf24)' },
];

const QUICK_ACTIONS = [
  { href: '/dashboard/generate',                   icon: '✦', label: 'Generate',   color: '#6366f1', bg: '#eef2ff' },
  { href: '/dashboard/generate?postType=CAROUSEL', icon: '◫', label: 'Carousel',   color: '#ec4899', bg: '#fdf2f8' },
  { href: '/dashboard/templates',                  icon: '◇', label: 'Templates',  color: '#10b981', bg: '#ecfdf5' },
  { href: '/dashboard/library',                    icon: '◻', label: 'Library',    color: '#8b5cf6', bg: '#f5f3ff' },
  { href: '/dashboard/automations',                icon: '⚡', label: 'Automations', color: '#f59e0b', bg: '#fffbeb' },
];

export default function DashboardPage() {
  const { user } = useAuth();
  const { list } = usePosts();
  const router = useRouter();
  const [posts, setPosts] = useState<any[]>([]);
  const [allPosts, setAllPosts] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalPosts: 0, scheduledPosts: 0, publishedPosts: 0, drafts: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await list();
        const ap: any[] = data.posts || [];
        setAllPosts(ap);
        setPosts(ap.slice(0, 5));
        setStats({
          totalPosts:     data.total || ap.length,
          scheduledPosts: ap.filter((p) => p.status === 'SCHEDULED').length,
          publishedPosts: ap.filter((p) => p.status === 'PUBLISHED').length,
          drafts:         ap.filter((p) => p.status === 'DRAFT').length,
        });
      } catch { /* silent */ }
      finally { setIsLoading(false); }
    };
    loadData();
  }, []);

  const planLimit = user?.subscriptionPlan === 'FREE' ? 20 : user?.subscriptionPlan === 'PRO' ? 200 : null;
  const usagePct  = planLimit ? Math.min((stats.totalPosts / planLimit) * 100, 100) : 0;

  const todayStr  = new Date().toDateString();
  const todayPosts = allPosts.filter((p) => {
    const d = p.scheduledFor || p.createdAt;
    return d && new Date(d).toDateString() === todayStr;
  });

  const statsValues: Record<string, string | number> = {
    totalPosts:    isLoading ? '—' : stats.totalPosts,
    scheduledPosts:isLoading ? '—' : stats.scheduledPosts,
    publishedPosts:isLoading ? '—' : stats.publishedPosts,
    drafts:        isLoading ? '—' : stats.drafts,
  };

  return (
    <div style={{ maxWidth: '1100px' }}>

      {/* ── Welcome ── */}
      <div style={{ marginBottom: '28px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#0f172a', margin: '0 0 4px 0', letterSpacing: '-0.4px' }}>
          Welcome back{user?.firstName ? `, ${user.firstName}` : ''}!
        </h2>
        <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>
          {user?.brandName ? `Managing content for ${user.brandName}` : 'Your AI-powered social media command center'}
        </p>
      </div>

      {/* ── Brand Memory Banner ── */}
      {user?.brandTone && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(99,102,241,0.06) 0%, rgba(139,92,246,0.06) 100%)',
          border: '1px solid rgba(99,102,241,0.18)',
          borderRadius: '14px',
          padding: '14px 18px',
          marginBottom: '24px',
          display: 'flex', alignItems: 'center', gap: '12px',
        }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '10px',
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '18px', flexShrink: 0,
          }}>🧠</div>
          <div>
            <span style={{ fontSize: '12px', fontWeight: '700', color: '#6366f1', display: 'block', marginBottom: '1px' }}>Brand Memory Active</span>
            <span style={{ fontSize: '13px', color: '#475569' }}>
              Tone: <strong>{user.brandTone}</strong>
              {user.brandIndustry && <> · Industry: <strong>{user.brandIndustry}</strong></>}
            </span>
          </div>
          <a href="/dashboard/settings" style={{ marginLeft: 'auto', fontSize: '12px', color: '#6366f1', textDecoration: 'none', fontWeight: '600', whiteSpace: 'nowrap' }}>
            Edit →
          </a>
        </div>
      )}

      {/* ── Stat cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '14px', marginBottom: '28px' }}>
        {STAT_CARDS.map((card) => (
          <div key={card.key} style={{
            background: 'white',
            borderRadius: '16px',
            padding: '20px',
            boxShadow: '0 1px 4px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.03)',
            display: 'flex', alignItems: 'flex-start', gap: '14px',
            border: '1px solid rgba(0,0,0,0.04)',
          }}>
            <div style={{
              width: '42px', height: '42px', borderRadius: '12px',
              background: card.gradient,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '18px', color: 'white', flexShrink: 0,
              boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
            }}>
              {card.icon}
            </div>
            <div>
              <p style={{ fontSize: '11px', fontWeight: '600', color: '#94a3b8', margin: '0 0 4px 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {card.label}
              </p>
              <p style={{ fontSize: '28px', fontWeight: '800', margin: 0, color: '#0f172a', lineHeight: 1, letterSpacing: '-0.5px' }}>
                {isLoading ? (
                  <span style={{ display: 'inline-block', width: '40px', height: '28px', borderRadius: '6px', background: 'linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite' }} />
                ) : statsValues[card.key]}
              </p>
              {card.key === 'totalPosts' && planLimit && (
                <div style={{ marginTop: '8px' }}>
                  <div style={{ fontSize: '10px', color: '#94a3b8', marginBottom: '4px' }}>{stats.totalPosts} / {planLimit}</div>
                  <div style={{ height: '3px', background: '#f1f5f9', borderRadius: '999px', width: '80px' }}>
                    <div style={{
                      height: '100%', borderRadius: '999px',
                      width: `${usagePct}%`,
                      background: usagePct > 80 ? '#ef4444' : 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                      transition: 'width 0.6s ease',
                    }} />
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ── Quick Actions ── */}
      <div style={{
        background: 'white', borderRadius: '16px', padding: '20px 22px',
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)', marginBottom: '28px',
        border: '1px solid rgba(0,0,0,0.04)',
      }}>
        <p style={{ fontSize: '12px', fontWeight: '700', color: '#94a3b8', margin: '0 0 14px 0', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Quick Actions
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '10px' }}>
          {QUICK_ACTIONS.map((action) => (
            <a
              key={action.href}
              href={action.href}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                gap: '8px', padding: '16px 10px',
                background: action.bg, borderRadius: '12px',
                textDecoration: 'none', color: action.color,
                fontSize: '12.5px', fontWeight: '600',
                border: `1px solid ${action.color}18`,
                transition: 'transform 0.15s, box-shadow 0.15s',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(-2px)';
                (e.currentTarget as HTMLAnchorElement).style.boxShadow = `0 6px 16px ${action.color}22`;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(0)';
                (e.currentTarget as HTMLAnchorElement).style.boxShadow = 'none';
              }}
            >
              <span style={{ fontSize: '22px' }}>{action.icon}</span>
              {action.label}
            </a>
          ))}
        </div>
      </div>

      {/* ── Today's Agenda ── */}
      {todayPosts.length > 0 && (
        <div style={{
          background: 'white', borderRadius: '16px', padding: '20px 22px',
          boxShadow: '0 1px 4px rgba(0,0,0,0.06)', marginBottom: '28px',
          border: '1px solid rgba(0,0,0,0.04)',
          borderLeft: '3px solid #6366f1',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <p style={{ fontSize: '12px', fontWeight: '700', color: '#94a3b8', margin: 0, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Today's Agenda
            </p>
            <span style={{ fontSize: '11px', fontWeight: '700', padding: '3px 10px', background: '#eef2ff', color: '#6366f1', borderRadius: '999px' }}>
              {new Date().toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' })}
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {todayPosts.map((post) => {
              const sc = STATUS_COLORS[post.status] || { bg: '#f1f5f9', text: '#475569' };
              return (
                <div key={post.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', background: '#f8fafc', borderRadius: '10px' }}>
                  <span style={{ fontSize: '16px' }}>{POST_TYPE_ICONS[post.type] || '📝'}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '13px', fontWeight: '600', color: '#0f172a', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {post.caption?.slice(0, 70) || 'Untitled'}
                    </p>
                    {post.scheduledFor && (
                      <p style={{ fontSize: '11px', color: '#94a3b8', margin: '2px 0 0 0' }}>
                        {new Date(post.scheduledFor).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    )}
                  </div>
                  <span style={{ fontSize: '10px', fontWeight: '700', padding: '3px 8px', borderRadius: '6px', background: sc.bg, color: sc.text, whiteSpace: 'nowrap' }}>
                    {post.status}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Recent Posts ── */}
      <div style={{
        background: 'white', borderRadius: '16px', padding: '20px 22px',
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.04)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <p style={{ fontSize: '12px', fontWeight: '700', color: '#94a3b8', margin: 0, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Recent Posts
          </p>
          <a href="/dashboard/posts" style={{ fontSize: '12px', color: '#6366f1', textDecoration: 'none', fontWeight: '600' }}>
            View all →
          </a>
        </div>

        {isLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton" style={{ height: '60px' }} />
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8' }}>
            <div style={{ fontSize: '40px', marginBottom: '10px' }}>✦</div>
            <p style={{ fontSize: '14px', margin: '0 0 16px 0', fontWeight: '500', color: '#64748b' }}>No posts yet</p>
            <button
              onClick={() => router.push('/dashboard/generate')}
              style={{
                padding: '9px 22px',
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                color: 'white', border: 'none', borderRadius: '10px',
                fontSize: '13px', fontWeight: '600', cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(99,102,241,0.35)',
              }}
            >
              Generate your first post
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {posts.map((post) => {
              const sc = STATUS_COLORS[post.status] || { bg: '#f1f5f9', text: '#475569' };
              return (
                <div
                  key={post.id}
                  onClick={() => router.push('/dashboard/posts')}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    padding: '12px 14px', background: '#f8fafc', borderRadius: '10px',
                    cursor: 'pointer', transition: 'background 0.15s',
                  }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = '#f0f4ff')}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = '#f8fafc')}
                >
                  <div style={{
                    width: '36px', height: '36px', borderRadius: '10px',
                    background: '#eef2ff', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontSize: '17px', flexShrink: 0,
                  }}>
                    {POST_TYPE_ICONS[post.type] || '📝'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '13px', fontWeight: '600', color: '#0f172a', margin: '0 0 2px 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {post.caption?.slice(0, 80) || 'Untitled post'}
                    </p>
                    <p style={{ fontSize: '11px', color: '#94a3b8', margin: 0 }}>
                      {post.type} · {new Date(post.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span style={{ fontSize: '10px', fontWeight: '700', padding: '3px 8px', borderRadius: '6px', background: sc.bg, color: sc.text, whiteSpace: 'nowrap' }}>
                    {post.status}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
