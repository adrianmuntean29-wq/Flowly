'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTemplates } from '@/lib/hooks/useApi';
import { useToast } from '@/lib/context/ToastContext';

const POST_TYPES = ['ALL', 'IMAGE', 'CAROUSEL'];

const TYPE_COLORS: Record<string, string> = {
  IMAGE: '#667eea', CAROUSEL: '#f093fb',
};

const emptyForm = { name: '', type: 'IMAGE', description: '', editorState: '' };

export default function TemplatesPage() {
  const { list, create, update, delete: deleteTemplate } = useTemplates();
  const router = useRouter();
  const { success, error: toastError, info } = useToast();

  const [templates, setTemplates] = useState<any[]>([]);
  const [filter, setFilter] = useState('ALL');
  const [isLoading, setIsLoading] = useState(true);

  // Create / Edit modal
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [formData, setFormData] = useState(emptyForm);
  const [isSaving, setIsSaving] = useState(false);

  // Delete confirmation
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  useEffect(() => {
    loadTemplates();
  }, [filter]);

  const loadTemplates = async () => {
    try {
      setIsLoading(true);
      const data = await list(filter === 'ALL' ? undefined : filter);
      setTemplates(data || []);
    } catch (err) {
      toastError('Eroare la încărcarea template-urilor');
    } finally {
      setIsLoading(false);
    }
  };

  const openCreate = () => {
    setEditId(null);
    setFormData(emptyForm);
    setShowModal(true);
  };

  const openEdit = (t: any) => {
    setEditId(t.id);
    const es = t.editorState;
    setFormData({ name: t.name, type: t.type, description: t.description || '', editorState: typeof es === 'string' ? es : (es ? JSON.stringify(es) : '') });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditId(null);
    setFormData(emptyForm);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.editorState.trim()) return;
    setIsSaving(true);

    try {
      if (editId) {
        const updated = await update(editId, formData);
        setTemplates(templates.map((t) => t.id === editId ? updated : t));
        success('Template actualizat!');
      } else {
        const created = await create(formData);
        setTemplates([created, ...templates]);
        success('Template creat cu succes!');
      }
      closeModal();
    } catch (err) {
      toastError(editId ? 'Eroare la actualizare' : 'Eroare la creare');
    } finally {
      setIsSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteConfirmId) return;
    try {
      await deleteTemplate(deleteConfirmId);
      setTemplates(templates.filter((t) => t.id !== deleteConfirmId));
      info('Template șters');
    } catch (err) {
      toastError('Eroare la ștergere');
    } finally {
      setDeleteConfirmId(null);
    }
  };

  const useTemplate = (t: any) => {
    const promptText = typeof t.editorState === 'string' ? t.editorState : '';
    const params = new URLSearchParams({ prompt: promptText, postType: t.type });
    router.push(`/dashboard/generate?${params.toString()}`);
  };

  const filtered = filter === 'ALL' ? templates : templates.filter((t) => t.type === filter);

  return (
    <div style={{ maxWidth: '1000px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
        <div>
          <h2 style={{ fontSize: '26px', fontWeight: '700', color: '#111827', margin: '0 0 6px 0' }}>
            🎨 Templates
          </h2>
          <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>
            Prompt-uri salvate pentru generare rapidă de conținut
          </p>
        </div>
        <button
          onClick={openCreate}
          style={{
            padding: '10px 20px',
            background: 'linear-gradient(135deg, #667eea, #764ba2)',
            color: 'white', border: 'none', borderRadius: '10px',
            cursor: 'pointer', fontSize: '14px', fontWeight: '700',
          }}
        >
          + Template nou
        </button>
      </div>

      {/* Filter tabs */}
      <div style={{
        display: 'flex', gap: '6px', marginBottom: '24px',
        background: 'white', borderRadius: '12px', padding: '6px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)', flexWrap: 'wrap',
      }}>
        {POST_TYPES.map((type) => (
          <button
            key={type}
            onClick={() => setFilter(type)}
            style={{
              padding: '8px 16px',
              background: filter === type ? (TYPE_COLORS[type] || '#667eea') : 'transparent',
              color: filter === type ? 'white' : '#6b7280',
              border: 'none', borderRadius: '8px', cursor: 'pointer',
              fontSize: '13px', fontWeight: '700', transition: 'all 0.15s',
            }}
          >
            {type}
          </button>
        ))}
      </div>

      {/* Content */}
      {isLoading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
          {[1, 2, 3].map((i) => (
            <div key={i} style={{ height: '200px', background: '#f3f4f6', borderRadius: '14px' }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{
          background: 'white', borderRadius: '16px', padding: '60px',
          textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
        }}>
          <div style={{ fontSize: '52px', marginBottom: '16px' }}>🎨</div>
          <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#111827', margin: '0 0 8px 0' }}>
            {filter === 'ALL' ? 'Niciun template salvat' : `Niciun template de tip ${filter}`}
          </h3>
          <p style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 24px 0' }}>
            Salvează prompt-uri frecvente ca template-uri pentru generare rapidă.
          </p>
          <button
            onClick={openCreate}
            style={{
              padding: '12px 28px',
              background: 'linear-gradient(135deg, #667eea, #764ba2)',
              color: 'white', border: 'none', borderRadius: '10px',
              cursor: 'pointer', fontSize: '15px', fontWeight: '700',
            }}
          >
            + Creează primul template
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
          {filtered.map((t) => {
            const color = TYPE_COLORS[t.type] || '#667eea';
            return (
              <div
                key={t.id}
                style={{
                  background: 'white', borderRadius: '14px', padding: '20px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                  border: `1px solid ${color}22`,
                  display: 'flex', flexDirection: 'column', gap: '10px',
                }}
              >
                {/* Type badge */}
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <span style={{
                    fontSize: '10px', fontWeight: '800', padding: '3px 9px',
                    background: color, color: 'white', borderRadius: '5px',
                  }}>
                    {t.type}
                  </span>
                  {t.isSystem && (
                    <span style={{
                      fontSize: '10px', fontWeight: '700', padding: '3px 8px',
                      background: '#d1fae5', color: '#065f46', borderRadius: '5px',
                    }}>
                      SYSTEM
                    </span>
                  )}
                </div>

                {/* Name */}
                <h4 style={{ fontSize: '15px', fontWeight: '700', color: '#111827', margin: 0, lineHeight: '1.3' }}>
                  {t.name}
                </h4>

                {/* Description */}
                {t.description && (
                  <p style={{ fontSize: '12px', color: '#6b7280', margin: 0, lineHeight: '1.5' }}>
                    {t.description}
                  </p>
                )}

                {/* Content preview */}
                <p style={{
                  fontSize: '12px', color: '#374151', margin: 0, lineHeight: '1.6',
                  background: `${color}0a`, borderLeft: `3px solid ${color}44`,
                  padding: '8px 10px', borderRadius: '0 6px 6px 0',
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                } as any}>
                  {typeof t.editorState === 'string' ? t.editorState : JSON.stringify(t.editorState)}
                </p>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '6px', marginTop: 'auto' }}>
                  <button
                    onClick={() => useTemplate(t)}
                    style={{
                      flex: 2, padding: '9px',
                      background: `linear-gradient(135deg, ${color}, ${color}bb)`,
                      color: 'white', border: 'none', borderRadius: '8px',
                      cursor: 'pointer', fontSize: '13px', fontWeight: '700',
                    }}
                  >
                    ✨ Folosește
                  </button>
                  <button
                    onClick={() => openEdit(t)}
                    style={{
                      flex: 1, padding: '9px',
                      background: '#fef3c7', color: '#92400e',
                      border: 'none', borderRadius: '8px',
                      cursor: 'pointer', fontSize: '13px', fontWeight: '700',
                    }}
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => setDeleteConfirmId(t.id)}
                    style={{
                      flex: 1, padding: '9px',
                      background: '#fee2e2', color: '#991b1b',
                      border: 'none', borderRadius: '8px',
                      cursor: 'pointer', fontSize: '13px',
                    }}
                  >
                    🗑️
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Modal */}
      {showModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: '20px',
        }}>
          <div style={{
            background: 'white', borderRadius: '20px', padding: '32px',
            width: '100%', maxWidth: '520px',
            boxShadow: '0 25px 80px rgba(0,0,0,0.3)',
            maxHeight: '90vh', overflowY: 'auto',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#111827', margin: 0 }}>
                {editId ? '✏️ Editează template' : '🎨 Template nou'}
              </h3>
              <button
                onClick={closeModal}
                style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#6b7280' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={labelStyle}>Nume template</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Post motivational LinkedIn"
                  required
                  style={inputStyle}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Tip</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    style={{ ...inputStyle, cursor: 'pointer' }}
                  >
                    {['IMAGE', 'CAROUSEL'].map((tp) => (
                      <option key={tp} value={tp}>{tp}</option>
                    ))}
                  </select>
                </div>
                <div style={{ flex: 2 }}>
                  <label style={labelStyle}>Descriere (opțional)</label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Scurtă descriere..."
                    style={inputStyle}
                  />
                </div>
              </div>

              <div>
                <label style={labelStyle}>Conținut / Prompt</label>
                <textarea
                  value={formData.editorState}
                  onChange={(e) => setFormData({ ...formData, editorState: e.target.value })}
                  placeholder="Scrie prompt-ul sau conținutul template-ului..."
                  required
                  rows={5}
                  style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit', lineHeight: '1.6' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={closeModal}
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
                  type="submit"
                  disabled={isSaving || !formData.name.trim() || !formData.editorState.trim()}
                  style={{
                    flex: 2, padding: '11px',
                    background: isSaving || !formData.name.trim() || !formData.editorState.trim()
                      ? '#ccc'
                      : 'linear-gradient(135deg, #667eea, #764ba2)',
                    color: 'white', border: 'none', borderRadius: '10px',
                    cursor: isSaving ? 'not-allowed' : 'pointer',
                    fontSize: '14px', fontWeight: '700',
                  }}
                >
                  {isSaving ? '⏳ Salvez...' : editId ? '💾 Actualizează' : '✅ Creează template'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1100, padding: '20px',
        }}>
          <div style={{
            background: 'var(--background, white)', borderRadius: '16px', padding: '28px',
            width: '100%', maxWidth: '380px',
            boxShadow: '0 25px 80px rgba(0,0,0,0.25)',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>🗑️</div>
            <h3 style={{ fontSize: '17px', fontWeight: '700', color: 'var(--foreground, #111827)', margin: '0 0 8px 0' }}>
              Ștergi template-ul?
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--foreground-muted, #6b7280)', margin: '0 0 20px 0' }}>
              Această acțiune este permanentă și nu poate fi anulată.
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setDeleteConfirmId(null)}
                style={{
                  flex: 1, padding: '10px',
                  background: 'var(--background-alt, #f3f4f6)', color: 'var(--foreground, #374151)',
                  border: '1px solid var(--border, #e5e7eb)', borderRadius: '10px',
                  cursor: 'pointer', fontSize: '14px', fontWeight: '600',
                }}
              >
                Anulează
              </button>
              <button
                onClick={confirmDelete}
                style={{
                  flex: 1, padding: '10px',
                  background: '#ef4444', color: 'white',
                  border: 'none', borderRadius: '10px',
                  cursor: 'pointer', fontSize: '14px', fontWeight: '700',
                }}
              >
                Da, șterge
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const labelStyle: React.CSSProperties = {
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
