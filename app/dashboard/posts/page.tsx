'use client';

import { useEffect, useState } from 'react';
import { usePosts } from '@/lib/hooks/useApi';
import { useRouter } from 'next/navigation';
import { useToast } from '@/lib/context/ToastContext';

const STATUS_CONFIG: Record<string, { bg: string; color: string; label: string }> = {
  DRAFT:     { bg: '#f3f4f6', color: '#6b7280', label: 'Draft' },
  SCHEDULED: { bg: '#fef3c7', color: '#92400e', label: 'Programat' },
  PUBLISHED: { bg: '#dcfce7', color: '#166534', label: 'Publicat' },
  FAILED:    { bg: '#fee2e2', color: '#991b1b', label: 'Eșuat' },
};

const PLATFORMS_LIST = ['instagram', 'tiktok', 'linkedin', 'facebook'];
const POST_TYPES = ['POST', 'CAROUSEL', 'REEL', 'VIDEO', 'AD'];

const TYPE_ICONS: Record<string, string> = {
  POST: '📝', CAROUSEL: '🎠', REEL: '🎬', VIDEO: '🎥', AD: '📢',
};

const FILTERS = ['ALL', 'DRAFT', 'SCHEDULED', 'PUBLISHED'];

export default function PostsPage() {
  const { list, delete: deletePost, update } = usePosts();
  const router = useRouter();
  const { success, error: toastError, info } = useToast();
  const [posts, setPosts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [editPost, setEditPost] = useState<any | null>(null);
  const [editForm, setEditForm] = useState({ caption: '', platforms: [] as string[], status: '', scheduledFor: '' });
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  useEffect(() => {
    loadPosts();
  }, [filter]);

  const loadPosts = async () => {
    try {
      setIsLoading(true);
      const data = await list(filter === 'ALL' ? undefined : filter);
      setPosts(data.posts || []);
      setTotal(data.total || 0);
    } catch (error) {
      console.error('Failed to load posts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deletePost(id);
      setPosts(posts.filter((p) => p.id !== id));
      setTotal((t) => t - 1);
      info('Post șters');
    } catch (err) {
      toastError('Eroare la ștergere');
    }
  };

  const handlePublish = async (id: string) => {
    try {
      await update(id, { status: 'PUBLISHED', publishedAt: new Date().toISOString() });
      setPosts(posts.map((p) => p.id === id ? { ...p, status: 'PUBLISHED' } : p));
      success('Post marcat ca publicat!');
    } catch (err) {
      toastError('Eroare la publicare');
    }
  };

  const copyContent = (id: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const openEdit = (post: any) => {
    setEditPost(post);
    setEditForm({
      caption: post.caption || '',
      platforms: post.platforms || [],
      status: post.status || 'DRAFT',
      scheduledFor: post.scheduledFor ? new Date(post.scheduledFor).toISOString().slice(0, 16) : '',
    });
  };

  const handleSaveEdit = async () => {
    if (!editPost) return;
    setIsSavingEdit(true);
    try {
      await update(editPost.id, {
        caption: editForm.caption,
        platforms: editForm.platforms,
        status: editForm.status,
        scheduledFor: editForm.scheduledFor ? new Date(editForm.scheduledFor).toISOString() : null,
      });
      setPosts(posts.map((p) =>
        p.id === editPost.id
          ? { ...p, ...editForm, scheduledFor: editForm.scheduledFor ? new Date(editForm.scheduledFor).toISOString() : null }
          : p
      ));
      setEditPost(null);
      success('Post actualizat cu succes!');
    } catch (err) {
      toastError('Eroare la salvare');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const toggleEditPlatform = (p: string) => {
    setEditForm((prev) => ({
      ...prev,
      platforms: prev.platforms.includes(p)
        ? prev.platforms.filter((x) => x !== p)
        : [...prev.platforms, p],
    }));
  };

  const [search, setSearch] = useState('');

  const counts = posts.reduce((acc: Record<string, number>, p) => {
    acc[p.status] = (acc[p.status] || 0) + 1;
    return acc;
  }, {});

  const filteredPosts = search
    ? posts.filter((p) =>
        p.caption?.toLowerCase().includes(search.toLowerCase())
      )
    : posts;

  return (
    <div style={{ maxWidth: '900px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
        <div>
          <h2 style={{ fontSize: '26px', fontWeight: '700', color: '#111827', margin: '0 0 4px 0' }}>
            Postările mele
          </h2>
          <p style={{ fontSize: '13px', color: '#6b7280', margin: 0 }}>
            {total} posturi în total
          </p>
        </div>
        <button
          onClick={() => router.push('/dashboard/generate')}
          style={{
            padding: '10px 20px',
            background: 'linear-gradient(135deg, #667eea, #764ba2)',
            color: 'white', border: 'none', borderRadius: '8px',
            cursor: 'pointer', fontSize: '14px', fontWeight: '700',
          }}
        >
          ✨ Post nou
        </button>
      </div>

      {/* Search bar */}
      <div style={{ marginBottom: '16px' }}>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="🔍 Caută în posturi..."
          style={{
            width: '100%', padding: '10px 14px',
            border: '1.5px solid #e5e7eb', borderRadius: '10px',
            fontSize: '14px', boxSizing: 'border-box', outline: 'none',
            background: 'white', color: '#111827',
          }}
        />
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', borderBottom: '1px solid #e5e7eb', paddingBottom: '0' }}>
        {FILTERS.map((f) => {
          const count = f === 'ALL' ? posts.length : (counts[f] || 0);
          const active = filter === f;
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: '8px 16px',
                background: 'none',
                border: 'none',
                borderBottom: `2px solid ${active ? '#667eea' : 'transparent'}`,
                color: active ? '#667eea' : '#6b7280',
                fontWeight: active ? '700' : '500',
                fontSize: '14px',
                cursor: 'pointer',
                marginBottom: '-1px',
                display: 'flex', gap: '6px', alignItems: 'center',
              }}
            >
              {f === 'ALL' ? 'Toate' : STATUS_CONFIG[f]?.label || f}
              {filter !== 'ALL' || f === 'ALL' ? (
                <span style={{
                  background: active ? '#eef2ff' : '#f3f4f6',
                  color: active ? '#667eea' : '#9ca3af',
                  fontSize: '11px', fontWeight: '700',
                  padding: '1px 7px', borderRadius: '999px',
                }}>
                  {count}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {/* Posts list */}
      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {[1, 2, 3].map((i) => (
            <div key={i} style={{ height: '100px', background: '#f3f4f6', borderRadius: '12px' }} />
          ))}
        </div>
      ) : filteredPosts.length === 0 ? (
        <div style={{ background: 'white', borderRadius: '16px', padding: '60px', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>📭</div>
          <p style={{ fontSize: '16px', fontWeight: '600', color: '#111827', margin: '0 0 6px 0' }}>
            Niciun post găsit
          </p>
          <p style={{ fontSize: '13px', color: '#9ca3af', margin: '0 0 20px 0' }}>
            {search ? `Niciun rezultat pentru "${search}"` : filter !== 'ALL' ? `Nu ai posturi cu statusul "${STATUS_CONFIG[filter]?.label}"` : 'Generează primul tău post acum!'}
          </p>
          {!search && (
            <button
              onClick={() => router.push('/dashboard/generate')}
              style={{
                padding: '10px 24px',
                background: 'linear-gradient(135deg, #667eea, #764ba2)',
                color: 'white', border: 'none', borderRadius: '8px',
                cursor: 'pointer', fontSize: '14px', fontWeight: '600',
              }}
            >
              ✨ Generează un post
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filteredPosts.map((post) => {
            const statusCfg = STATUS_CONFIG[post.status] || STATUS_CONFIG.DRAFT;
            const isExpanded = expandedId === post.id;
            const hasImages = post.images?.length > 0;

            return (
              <div
                key={post.id}
                style={{
                  background: 'white',
                  borderRadius: '14px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                  overflow: 'hidden',
                  border: '1px solid #f3f4f6',
                }}
              >
                <div style={{ display: 'flex', gap: '0' }}>
                  {/* Thumbnail */}
                  {hasImages && (
                    <div style={{ width: '100px', flexShrink: 0 }}>
                      <img
                        src={post.images[0]}
                        alt="Post thumbnail"
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                      />
                    </div>
                  )}

                  {/* Content */}
                  <div style={{ flex: 1, padding: '16px', minWidth: 0 }}>
                    {/* Top row: type + status + date */}
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '18px' }}>{TYPE_ICONS[post.type] || '📝'}</span>
                      <span style={{
                        fontSize: '11px', fontWeight: '700', padding: '3px 8px',
                        background: '#dbeafe', color: '#1e40af', borderRadius: '4px',
                      }}>
                        {post.type}
                      </span>
                      <span style={{
                        fontSize: '11px', fontWeight: '700', padding: '3px 8px',
                        background: statusCfg.bg, color: statusCfg.color, borderRadius: '4px',
                      }}>
                        {statusCfg.label}
                      </span>
                      {post.scheduledFor && (
                        <span style={{ fontSize: '11px', color: '#6b7280' }}>
                          📅 {new Date(post.scheduledFor).toLocaleDateString('ro-RO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                      <span style={{ fontSize: '11px', color: '#9ca3af', marginLeft: 'auto' }}>
                        {new Date(post.createdAt).toLocaleDateString('ro-RO')}
                      </span>
                    </div>

                    {/* Content preview */}
                    <p
                      style={{
                        fontSize: '14px', color: '#374151', lineHeight: '1.6',
                        margin: '0 0 12px 0',
                        display: '-webkit-box',
                        WebkitLineClamp: isExpanded ? undefined : 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: isExpanded ? 'visible' : 'hidden',
                        whiteSpace: 'pre-wrap',
                      } as any}
                    >
                      {post.caption}
                    </p>

                    {/* Platforms */}
                    {post.platforms?.length > 0 && (
                      <div style={{ display: 'flex', gap: '6px', marginBottom: '12px', flexWrap: 'wrap' }}>
                        {post.platforms.map((p: string) => (
                          <span key={p} style={{
                            fontSize: '11px', padding: '2px 8px',
                            background: '#f3f4f6', color: '#6b7280',
                            borderRadius: '999px', fontWeight: '500',
                            textTransform: 'capitalize',
                          }}>
                            {p}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Multiple images carousel preview */}
                    {post.images?.length > 1 && (
                      <div style={{ display: 'flex', gap: '6px', marginBottom: '12px', overflowX: 'auto' }}>
                        {post.images.slice(0, 5).map((img: string, i: number) => (
                          <img key={i} src={img} alt={`slide ${i + 1}`}
                            style={{ width: '56px', height: '56px', objectFit: 'cover', borderRadius: '6px', flexShrink: 0 }} />
                        ))}
                      </div>
                    )}

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : post.id)}
                        style={actionBtn('#f3f4f6', '#374151')}
                      >
                        {isExpanded ? '▲ Restrânge' : '▼ Extinde'}
                      </button>
                      <button
                        onClick={() => copyContent(post.id, post.caption)}
                        style={actionBtn('#f0fdf4', '#166534')}
                      >
                        {copiedId === post.id ? '✅ Copiat!' : '📋 Copiază'}
                      </button>
                      <button
                        onClick={() => openEdit(post)}
                        style={actionBtn('#fef3c7', '#92400e')}
                      >
                        ✏️ Editează
                      </button>
                      {post.status === 'DRAFT' && (
                        <>
                          <button
                            onClick={() => router.push(`/dashboard/generate?prompt=${encodeURIComponent(post.caption || '')}&postType=${post.type}`)}
                            style={actionBtn('#eef2ff', '#4338ca')}
                          >
                            ✨ Regenerează
                          </button>
                          <button
                            onClick={() => handlePublish(post.id)}
                            style={actionBtn('#dcfce7', '#166534')}
                          >
                            ✅ Marchează publicat
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => handleDelete(post.id)}
                        style={actionBtn('#fee2e2', '#991b1b')}
                      >
                        🗑️ Șterge
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {/* Edit Modal */}
      {editPost && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: '20px',
        }}>
          <div style={{
            background: 'white', borderRadius: '20px', padding: '32px',
            width: '100%', maxWidth: '560px',
            boxShadow: '0 25px 80px rgba(0,0,0,0.3)',
            maxHeight: '90vh', overflowY: 'auto',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#111827', margin: 0 }}>
                ✏️ Editează postul
              </h3>
              <button
                onClick={() => setEditPost(null)}
                style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#6b7280' }}
              >
                ✕
              </button>
            </div>

            {/* Caption */}
            <div style={{ marginBottom: '16px' }}>
              <label style={fieldLabel}>Caption</label>
              <textarea
                value={editForm.caption}
                onChange={(e) => setEditForm({ ...editForm, caption: e.target.value })}
                rows={6}
                style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit', lineHeight: '1.6' }}
              />
            </div>

            {/* Status */}
            <div style={{ marginBottom: '16px' }}>
              <label style={fieldLabel}>Status</label>
              <select
                value={editForm.status}
                onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                style={{ ...inputStyle, cursor: 'pointer' }}
              >
                <option value="DRAFT">Draft</option>
                <option value="SCHEDULED">Programat</option>
                <option value="PUBLISHED">Publicat</option>
              </select>
            </div>

            {/* Scheduled date */}
            {editForm.status === 'SCHEDULED' && (
              <div style={{ marginBottom: '16px' }}>
                <label style={fieldLabel}>Data programată</label>
                <input
                  type="datetime-local"
                  value={editForm.scheduledFor}
                  onChange={(e) => setEditForm({ ...editForm, scheduledFor: e.target.value })}
                  style={inputStyle}
                />
              </div>
            )}

            {/* Platforms */}
            <div style={{ marginBottom: '24px' }}>
              <label style={fieldLabel}>Platforme</label>
              <div style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
                {PLATFORMS_LIST.map((p) => (
                  <button
                    key={p}
                    onClick={() => toggleEditPlatform(p)}
                    style={{
                      padding: '6px 14px',
                      border: `2px solid ${editForm.platforms.includes(p) ? '#667eea' : '#e5e7eb'}`,
                      background: editForm.platforms.includes(p) ? '#eef2ff' : 'white',
                      color: editForm.platforms.includes(p) ? '#667eea' : '#6b7280',
                      borderRadius: '8px', cursor: 'pointer',
                      fontSize: '13px', fontWeight: '600',
                      textTransform: 'capitalize',
                    }}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setEditPost(null)}
                style={{
                  flex: 1, padding: '11px',
                  background: '#f3f4f6', color: '#374151',
                  border: 'none', borderRadius: '10px',
                  cursor: 'pointer', fontSize: '14px', fontWeight: '600',
                }}
              >
                Anulează
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={isSavingEdit || !editForm.caption.trim()}
                style={{
                  flex: 2, padding: '11px',
                  background: isSavingEdit || !editForm.caption.trim()
                    ? '#ccc'
                    : 'linear-gradient(135deg, #667eea, #764ba2)',
                  color: 'white', border: 'none', borderRadius: '10px',
                  cursor: isSavingEdit || !editForm.caption.trim() ? 'not-allowed' : 'pointer',
                  fontSize: '14px', fontWeight: '700',
                }}
              >
                {isSavingEdit ? '⏳ Salvez...' : '💾 Salvează modificările'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const fieldLabel: React.CSSProperties = {
  fontSize: '11px', fontWeight: '700', color: '#374151',
  textTransform: 'uppercase', letterSpacing: '0.05em',
  display: 'block', marginBottom: '6px',
};

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 12px',
  border: '1.5px solid #e5e7eb', borderRadius: '8px',
  fontSize: '14px', boxSizing: 'border-box',
  outline: 'none', color: '#111827',
};

function actionBtn(bg: string, color: string): React.CSSProperties {
  return {
    padding: '6px 12px',
    background: bg,
    color,
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: '600',
  };
}
