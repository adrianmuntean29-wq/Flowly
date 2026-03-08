'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import { useToast } from '@/lib/context/ToastContext';

// ─── Types ───────────────────────────────────────────────────────────────────

interface ApiKeyRecord {
  id: string;
  provider: string;
  label: string;
  maskedKey: string;
  isActive: boolean;
  isValid: boolean | null;
  lastUsed: string | null;
  usageCount: number;
  createdAt: string;
}

// ─── Known provider config ────────────────────────────────────────────────────

const PROVIDERS = [
  // ── Text ──
  {
    id: 'anthropic',
    name: 'Claude (Anthropic)',
    icon: '🤖',
    type: 'text',
    color: '#D97706',
    gradient: 'linear-gradient(135deg, #D97706, #B45309)',
    description: 'Best quality text generation. Used for captions, hooks, CTAs.',
    placeholder: 'sk-ant-api03-...',
    freeOption: false,
    getKeyUrl: 'https://console.anthropic.com/account/keys',
  },
  {
    id: 'openai',
    name: 'GPT-4o (OpenAI)',
    icon: '✨',
    type: 'text',
    color: '#10A37F',
    gradient: 'linear-gradient(135deg, #10A37F, #0E8A6B)',
    description: 'Excellent text generation. Also powers DALL-E 3 image generation.',
    placeholder: 'sk-proj-...',
    freeOption: false,
    getKeyUrl: 'https://platform.openai.com/api-keys',
  },
  {
    id: 'gemini',
    name: 'Gemini Flash (Google)',
    icon: '💎',
    type: 'text',
    color: '#4285F4',
    gradient: 'linear-gradient(135deg, #4285F4, #1A73E8)',
    description: 'Fast & free tier (15 req/min). Perfect for most use cases.',
    placeholder: 'AIza...',
    freeOption: true,
    getKeyUrl: 'https://aistudio.google.com/app/apikey',
  },
  {
    id: 'groq',
    name: 'Llama 3 (Groq)',
    icon: '⚡',
    type: 'text',
    color: '#F55036',
    gradient: 'linear-gradient(135deg, #F55036, #D44020)',
    description: 'Fastest inference. Free tier: 6000 tokens/min.',
    placeholder: 'gsk_...',
    freeOption: true,
    getKeyUrl: 'https://console.groq.com/keys',
  },
  // ── Images ──
  {
    id: 'pollinations',
    name: 'Pollinations AI',
    icon: '🌸',
    type: 'image',
    color: '#8B5CF6',
    gradient: 'linear-gradient(135deg, #8B5CF6, #7C3AED)',
    description: '100% FREE image generation — no key needed. Powered by FLUX.',
    placeholder: 'No key needed — always available',
    freeOption: true,
    getKeyUrl: null,
    noKey: true,
  },
  {
    id: 'stability',
    name: 'Stable Diffusion (Stability AI)',
    icon: '🎨',
    type: 'image',
    color: '#7C3AED',
    gradient: 'linear-gradient(135deg, #7C3AED, #6D28D9)',
    description: 'High-quality SDXL image generation. Requires paid credits.',
    placeholder: 'sk-...',
    freeOption: false,
    getKeyUrl: 'https://platform.stability.ai/account/keys',
  },
  {
    id: 'replicate',
    name: 'FLUX Pro (Replicate)',
    icon: '🖼️',
    type: 'image',
    color: '#EC4899',
    gradient: 'linear-gradient(135deg, #EC4899, #DB2777)',
    description: 'Premium FLUX 1.1 Pro model. Best image quality available.',
    placeholder: 'r8_...',
    freeOption: false,
    getKeyUrl: 'https://replicate.com/account/api-tokens',
  },
] as const;

// ─── Custom AI provider suggestions ──────────────────────────────────────────

const CUSTOM_SUGGESTIONS = [
  { name: 'Mistral AI',      icon: '🌊', placeholder: 'api key...',     url: 'https://console.mistral.ai/api-keys' },
  { name: 'Together AI',     icon: '🤝', placeholder: 'api key...',     url: 'https://api.together.xyz/settings/api-keys' },
  { name: 'Cohere',          icon: '🔷', placeholder: 'co-...',         url: 'https://dashboard.cohere.com/api-keys' },
  { name: 'Perplexity AI',   icon: '🔍', placeholder: 'pplx-...',       url: 'https://www.perplexity.ai/settings/api' },
  { name: 'DeepSeek',        icon: '🐳', placeholder: 'sk-...',         url: 'https://platform.deepseek.com/api_keys' },
  { name: 'xAI (Grok)',      icon: '🤖', placeholder: 'xai-...',        url: 'https://console.x.ai' },
  { name: 'Hugging Face',    icon: '🤗', placeholder: 'hf_...',         url: 'https://huggingface.co/settings/tokens' },
  { name: 'Azure OpenAI',    icon: '☁️', placeholder: 'azure key...',   url: 'https://portal.azure.com' },
];

// ─── Component ───────────────────────────────────────────────────────────────

export default function IntegrationsPage() {
  const { token } = useAuth();
  const { success, error: toastError, info } = useToast();

  const [keys, setKeys] = useState<ApiKeyRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [adding, setAdding] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Known provider add modal
  const [showAddModal, setShowAddModal] = useState<string | null>(null);
  const [newKey, setNewKey] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [showKey, setShowKey] = useState(false);

  // Custom provider modal
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customKey, setCustomKey] = useState('');
  const [customLabel, setCustomLabel] = useState('');
  const [showCustomKey, setShowCustomKey] = useState(false);

  // Delete confirmation
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; label: string } | null>(null);

  // ── Load keys ──────────────────────────────────────────────────────────────

  const loadKeys = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const res = await fetch('/api/user/api-keys', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) setKeys(data.keys || []);
    } catch {}
    setIsLoading(false);
  }, [token]);

  useEffect(() => { loadKeys(); }, [loadKeys]);

  // ── Add known provider key ─────────────────────────────────────────────────

  const handleAdd = async (providerId: string) => {
    if (!newKey.trim()) return;
    setAdding(providerId);
    try {
      const res = await fetch('/api/user/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ provider: providerId, apiKey: newKey.trim(), label: newLabel.trim() || undefined }),
      });
      const data = await res.json();
      if (res.ok || res.status === 201) {
        data.warning ? info(data.warning) : success(data.message || 'API key added successfully');
        setShowAddModal(null);
        setNewKey('');
        setNewLabel('');
        loadKeys();
      } else {
        toastError(data.error || 'Failed to add key');
      }
    } catch {
      toastError('Network error');
    }
    setAdding(null);
  };

  // ── Add custom provider key ────────────────────────────────────────────────

  const handleAddCustom = async () => {
    if (!customName.trim() || !customKey.trim()) return;
    const slug = customName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
    const provider = `custom_${slug}`;
    setAdding(provider);
    try {
      const res = await fetch('/api/user/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          provider,
          apiKey: customKey.trim(),
          label: customLabel.trim() || customName.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok || res.status === 201) {
        success(`${customName.trim()} key saved!`);
        setShowCustomModal(false);
        setCustomName('');
        setCustomKey('');
        setCustomLabel('');
        loadKeys();
      } else {
        toastError(data.error || 'Failed to add key');
      }
    } catch {
      toastError('Network error');
    }
    setAdding(null);
  };

  // ── Delete key (with confirm modal) ───────────────────────────────────────

  const handleDeleteConfirmed = async () => {
    if (!confirmDelete) return;
    const { id, label } = confirmDelete;
    setConfirmDelete(null);
    setDeleting(id);
    try {
      const res = await fetch(`/api/user/api-keys/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        success(data.message || 'Key deleted');
        setKeys((prev) => prev.filter((k) => k.id !== id));
      } else {
        toastError(data.error || 'Delete failed');
      }
    } catch {
      toastError('Network error');
    }
    setDeleting(null);
  };

  const getProviderKeys = (providerId: string) =>
    keys.filter((k) => k.provider === providerId);

  const customKeys = keys.filter((k) => k.provider.startsWith('custom_'));

  const textProviders = PROVIDERS.filter((p) => p.type === 'text');
  const imageProviders = PROVIDERS.filter((p) => p.type === 'image');

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div style={{ maxWidth: '860px' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '26px', fontWeight: '700', color: 'var(--foreground)', margin: '0 0 6px 0' }}>
          🔑 AI Integrations
        </h2>
        <p style={{ fontSize: '14px', color: 'var(--foreground-muted)', margin: 0 }}>
          Conectează propriile chei AI. Flowly rutează generarea prin cheile tale — tu controlezi costurile.
        </p>
      </div>

      {/* Free tier notice */}
      <div style={{
        background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)',
        border: '1px solid #86efac',
        borderRadius: '12px', padding: '14px 20px', marginBottom: '32px',
        display: 'flex', gap: '12px', alignItems: 'flex-start',
      }}>
        <span style={{ fontSize: '20px' }}>🎁</span>
        <div>
          <p style={{ fontSize: '13px', fontWeight: '700', color: '#166534', margin: '0 0 2px 0' }}>
            AI gratuit disponibil — fără cheie necesară!
          </p>
          <p style={{ fontSize: '12px', color: '#15803d', margin: 0 }}>
            <strong>Pollinations AI</strong> generează imagini gratuit (fără cheie).
            Pentru text: <strong>Gemini Flash</strong> și <strong>Groq (Llama 3)</strong> au tier gratuit generos.
          </p>
        </div>
      </div>

      {/* Text Providers */}
      <Section title="Text Generation" subtitle="Used for captions, hooks, CTAs, hashtags">
        {textProviders.map((provider) => (
          <ProviderCard
            key={provider.id}
            provider={provider}
            existingKeys={getProviderKeys(provider.id)}
            isLoading={isLoading}
            deleting={deleting}
            onAdd={() => { setShowAddModal(provider.id); setNewKey(''); setNewLabel(''); setShowKey(false); }}
            onDelete={(id, label) => setConfirmDelete({ id, label })}
          />
        ))}
      </Section>

      {/* Image Providers */}
      <Section title="Image Generation" subtitle="Used for post images, carousel backgrounds, thumbnails">
        {imageProviders.map((provider) => (
          <ProviderCard
            key={provider.id}
            provider={provider}
            existingKeys={getProviderKeys(provider.id)}
            isLoading={isLoading}
            deleting={deleting}
            onAdd={() => { setShowAddModal(provider.id); setNewKey(''); setNewLabel(''); setShowKey(false); }}
            onDelete={(id, label) => setConfirmDelete({ id, label })}
          />
        ))}
      </Section>

      {/* ── Custom AI Section ───────────────────────────────────────────────── */}
      <Section
        title="Custom AI Providers"
        subtitle="Adaugă orice alt serviciu AI — Mistral, Together, Cohere, DeepSeek și orice altul"
        action={
          <button
            onClick={() => { setShowCustomModal(true); setCustomName(''); setCustomKey(''); setCustomLabel(''); setShowCustomKey(false); }}
            style={{
              padding: '8px 18px',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              color: 'white', border: 'none', borderRadius: '8px',
              cursor: 'pointer', fontSize: '13px', fontWeight: '700',
            }}
          >
            + Add Custom AI
          </button>
        }
      >
        {/* Suggestion chips */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: customKeys.length > 0 ? '16px' : '0' }}>
          {CUSTOM_SUGGESTIONS.map((s) => (
            <button
              key={s.name}
              onClick={() => {
                setCustomName(s.name);
                setCustomKey('');
                setCustomLabel(s.name);
                setShowCustomKey(false);
                setShowCustomModal(true);
              }}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '6px 12px',
                background: 'var(--background)',
                border: '1.5px solid var(--border)',
                borderRadius: '999px',
                cursor: 'pointer', fontSize: '12px', fontWeight: '600',
                color: 'var(--foreground-muted)',
                transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = '#6366f1';
                (e.currentTarget as HTMLButtonElement).style.color = '#6366f1';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)';
                (e.currentTarget as HTMLButtonElement).style.color = 'var(--foreground-muted)';
              }}
            >
              {s.icon} {s.name}
            </button>
          ))}
        </div>

        {/* Saved custom keys */}
        {!isLoading && customKeys.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {customKeys.map((k) => {
              const displayName = k.provider.replace('custom_', '').replace(/_/g, ' ');
              return (
                <div key={k.id} style={{
                  background: 'var(--background)',
                  border: '2px solid var(--border)',
                  borderRadius: '14px', padding: '16px 20px',
                  display: 'flex', alignItems: 'center', gap: '14px',
                }}>
                  <div style={{
                    width: '40px', height: '40px', borderRadius: '10px', flexShrink: 0,
                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '18px',
                  }}>
                    🔌
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--foreground)', marginBottom: '2px' }}>
                      {k.label}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--foreground-muted)' }}>
                      {displayName} · {k.maskedKey}
                      {k.lastUsed && ` · Used ${new Date(k.lastUsed).toLocaleDateString('ro-RO')}`}
                    </div>
                  </div>
                  <span style={{
                    fontSize: '10px', fontWeight: '700',
                    background: '#ede9fe', color: '#5b21b6',
                    padding: '3px 10px', borderRadius: '999px',
                  }}>
                    CUSTOM
                  </span>
                  <button
                    onClick={() => setConfirmDelete({ id: k.id, label: k.label })}
                    disabled={deleting === k.id}
                    style={{
                      background: '#fee2e2', color: '#991b1b', border: 'none',
                      borderRadius: '8px', padding: '6px 12px',
                      cursor: 'pointer', fontSize: '12px', fontWeight: '600',
                    }}
                  >
                    {deleting === k.id ? '...' : 'Șterge'}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {!isLoading && customKeys.length === 0 && (
          <div style={{
            padding: '28px', textAlign: 'center',
            background: 'var(--background-alt)', borderRadius: '12px',
            border: '1.5px dashed var(--border)',
          }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>🔌</div>
            <p style={{ fontSize: '13px', color: 'var(--foreground-muted)', margin: '0 0 12px 0' }}>
              Nicio cheie personalizată adăugată încă.
            </p>
            <button
              onClick={() => { setShowCustomModal(true); setCustomName(''); setCustomKey(''); setCustomLabel(''); }}
              style={{
                padding: '8px 20px',
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                color: 'white', border: 'none', borderRadius: '8px',
                cursor: 'pointer', fontSize: '13px', fontWeight: '700',
              }}
            >
              + Adaugă primul provider custom
            </button>
          </div>
        )}
      </Section>

      {/* ── Known provider Add Key Modal ──────────────────────────────────── */}
      {showAddModal && (() => {
        const provider = PROVIDERS.find((p) => p.id === showAddModal)!;
        return (
          <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px',
          }}>
            <div style={{
              background: 'var(--background)', borderRadius: '20px', padding: '32px',
              width: '100%', maxWidth: '460px', boxShadow: '0 25px 80px rgba(0,0,0,0.3)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                <div style={{
                  width: '48px', height: '48px', borderRadius: '12px', background: provider.gradient,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px',
                }}>
                  {provider.icon}
                </div>
                <div>
                  <h3 style={{ fontSize: '17px', fontWeight: '700', margin: 0, color: 'var(--foreground)' }}>
                    Add {provider.name}
                  </h3>
                  <p style={{ fontSize: '12px', color: 'var(--foreground-muted)', margin: 0 }}>
                    {provider.description}
                  </p>
                </div>
              </div>

              {provider.getKeyUrl && (
                <a href={provider.getKeyUrl} target="_blank" rel="noopener noreferrer"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#6366f1', marginBottom: '16px', textDecoration: 'none', fontWeight: '600' }}>
                  🔗 Get your API key →
                </a>
              )}

              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--foreground)', display: 'block', marginBottom: '4px' }}>
                  Label (optional)
                </label>
                <input
                  type="text"
                  placeholder={`e.g. "My ${provider.name} Key"`}
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', border: '2px solid var(--border)', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box', outline: 'none', background: 'var(--background)', color: 'var(--foreground)' }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--foreground)', display: 'block', marginBottom: '4px' }}>
                  API Key
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showKey ? 'text' : 'password'}
                    placeholder={provider.placeholder}
                    value={newKey}
                    onChange={(e) => setNewKey(e.target.value)}
                    autoFocus
                    style={{ width: '100%', padding: '10px 40px 10px 12px', border: '2px solid var(--border)', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box', outline: 'none', fontFamily: 'monospace', background: 'var(--background)', color: 'var(--foreground)' }}
                  />
                  <button onClick={() => setShowKey(!showKey)}
                    style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px' }}>
                    {showKey ? '🙈' : '👁️'}
                  </button>
                </div>
                <p style={{ fontSize: '11px', color: 'var(--foreground-muted)', margin: '4px 0 0 0' }}>
                  Encrypted with AES-256 before storing. Never exposed in plain text.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => setShowAddModal(null)}
                  style={{ flex: 1, padding: '11px', background: 'var(--background-alt)', color: 'var(--foreground)', border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}>
                  Anulează
                </button>
                <button
                  onClick={() => handleAdd(showAddModal)}
                  disabled={!newKey.trim() || adding === showAddModal}
                  style={{ flex: 2, padding: '11px', background: newKey.trim() && adding !== showAddModal ? provider.gradient : '#d1d5db', color: 'white', border: 'none', borderRadius: '10px', cursor: newKey.trim() ? 'pointer' : 'not-allowed', fontSize: '14px', fontWeight: '700' }}>
                  {adding === showAddModal ? 'Se validează...' : 'Add & Validate Key'}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── Custom Provider Modal ─────────────────────────────────────────── */}
      {showCustomModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px',
        }}>
          <div style={{
            background: 'var(--background)', borderRadius: '20px', padding: '32px',
            width: '100%', maxWidth: '500px', boxShadow: '0 25px 80px rgba(0,0,0,0.3)',
          }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
              <div style={{
                width: '48px', height: '48px', borderRadius: '12px',
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px',
              }}>
                🔌
              </div>
              <div>
                <h3 style={{ fontSize: '17px', fontWeight: '700', margin: 0, color: 'var(--foreground)' }}>
                  Custom AI Provider
                </h3>
                <p style={{ fontSize: '12px', color: 'var(--foreground-muted)', margin: 0 }}>
                  Salvează cheia oricărui serviciu AI
                </p>
              </div>
            </div>

            {/* Suggestion chips */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--foreground-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '8px' }}>
                Selectează rapid
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {CUSTOM_SUGGESTIONS.map((s) => (
                  <button
                    key={s.name}
                    onClick={() => setCustomName(s.name)}
                    style={{
                      padding: '4px 10px',
                      background: customName === s.name ? '#ede9fe' : 'var(--background-alt)',
                      color: customName === s.name ? '#5b21b6' : 'var(--foreground-muted)',
                      border: customName === s.name ? '1.5px solid #8b5cf6' : '1.5px solid var(--border)',
                      borderRadius: '999px', cursor: 'pointer', fontSize: '12px', fontWeight: '600',
                    }}
                  >
                    {s.icon} {s.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Provider name */}
            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--foreground)', display: 'block', marginBottom: '4px' }}>
                Nume provider <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Mistral AI, Together AI, Cohere..."
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', border: '2px solid var(--border)', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box', outline: 'none', background: 'var(--background)', color: 'var(--foreground)' }}
              />
            </div>

            {/* Label */}
            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--foreground)', display: 'block', marginBottom: '4px' }}>
                Label (opțional)
              </label>
              <input
                type="text"
                placeholder="e.g. Mistral Production Key"
                value={customLabel}
                onChange={(e) => setCustomLabel(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', border: '2px solid var(--border)', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box', outline: 'none', background: 'var(--background)', color: 'var(--foreground)' }}
              />
            </div>

            {/* API Key */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--foreground)', display: 'block', marginBottom: '4px' }}>
                API Key <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showCustomKey ? 'text' : 'password'}
                  placeholder="Cheia API a serviciului..."
                  value={customKey}
                  onChange={(e) => setCustomKey(e.target.value)}
                  autoFocus
                  style={{ width: '100%', padding: '10px 40px 10px 12px', border: '2px solid var(--border)', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box', outline: 'none', fontFamily: 'monospace', background: 'var(--background)', color: 'var(--foreground)' }}
                />
                <button onClick={() => setShowCustomKey(!showCustomKey)}
                  style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px' }}>
                  {showCustomKey ? '🙈' : '👁️'}
                </button>
              </div>
              <p style={{ fontSize: '11px', color: 'var(--foreground-muted)', margin: '4px 0 0 0' }}>
                Criptată cu AES-256 înainte de stocare. Nu va fi expusă niciodată în text clar.
              </p>
            </div>

            {/* Note about usage */}
            <div style={{
              padding: '10px 14px', background: '#fef3c7', border: '1px solid #fcd34d',
              borderRadius: '8px', marginBottom: '20px',
              fontSize: '12px', color: '#92400e',
            }}>
              ℹ️ Cheile custom sunt stocate securizat. Integrarea lor în generarea de conținut necesită configurare suplimentară în setări avansate.
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setShowCustomModal(false)}
                style={{ flex: 1, padding: '11px', background: 'var(--background-alt)', color: 'var(--foreground)', border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}>
                Anulează
              </button>
              <button
                onClick={handleAddCustom}
                disabled={!customName.trim() || !customKey.trim() || !!adding}
                style={{
                  flex: 2, padding: '11px',
                  background: customName.trim() && customKey.trim() && !adding ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : '#d1d5db',
                  color: 'white', border: 'none', borderRadius: '10px',
                  cursor: customName.trim() && customKey.trim() ? 'pointer' : 'not-allowed',
                  fontSize: '14px', fontWeight: '700',
                }}>
                {adding ? 'Se salvează...' : '🔌 Salvează cheia'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation Modal ──────────────────────────────────────── */}
      {confirmDelete && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '20px',
        }}>
          <div style={{
            background: 'var(--background)', borderRadius: '16px', padding: '28px',
            width: '100%', maxWidth: '380px', boxShadow: '0 25px 80px rgba(0,0,0,0.25)', textAlign: 'center',
          }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>🗑️</div>
            <h3 style={{ fontSize: '17px', fontWeight: '700', color: 'var(--foreground)', margin: '0 0 8px 0' }}>
              Ștergi cheia?
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--foreground-muted)', margin: '0 0 4px 0' }}>
              <strong>{confirmDelete.label}</strong>
            </p>
            <p style={{ fontSize: '12px', color: 'var(--foreground-muted)', margin: '0 0 20px 0' }}>
              Această acțiune este permanentă și nu poate fi anulată.
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setConfirmDelete(null)}
                style={{ flex: 1, padding: '10px', background: 'var(--background-alt)', color: 'var(--foreground)', border: '1px solid var(--border)', borderRadius: '10px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}>
                Anulează
              </button>
              <button onClick={handleDeleteConfirmed}
                style={{ flex: 1, padding: '10px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '14px', fontWeight: '700' }}>
                Da, șterge
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Section({
  title, subtitle, children, action,
}: {
  title: string; subtitle: string; children: React.ReactNode; action?: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: '36px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
        <div>
          <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--foreground)', margin: '0 0 2px 0' }}>
            {title}
          </h3>
          <p style={{ fontSize: '12px', color: 'var(--foreground-muted)', margin: 0 }}>{subtitle}</p>
        </div>
        {action}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {children}
      </div>
    </div>
  );
}

function ProviderCard({
  provider, existingKeys, isLoading, deleting, onAdd, onDelete,
}: {
  provider: typeof PROVIDERS[number];
  existingKeys: ApiKeyRecord[];
  isLoading: boolean;
  deleting: string | null;
  onAdd: () => void;
  onDelete: (id: string, label: string) => void;
}) {
  const hasKeys = existingKeys.length > 0;

  return (
    <div style={{
      background: 'var(--background)',
      border: hasKeys ? `2px solid ${provider.color}33` : '2px solid var(--border)',
      borderRadius: '14px', padding: '20px',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
        {/* Left */}
        <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start', flex: 1 }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '10px', flexShrink: 0, background: provider.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
            {provider.icon}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
              <span style={{ fontSize: '15px', fontWeight: '700', color: 'var(--foreground)' }}>{provider.name}</span>
              {provider.freeOption && (
                <span style={{ fontSize: '10px', fontWeight: '700', background: '#dcfce7', color: '#166534', padding: '2px 8px', borderRadius: '999px' }}>FREE TIER</span>
              )}
              {(provider as any).noKey && (
                <span style={{ fontSize: '10px', fontWeight: '700', background: '#dbeafe', color: '#1e40af', padding: '2px 8px', borderRadius: '999px' }}>NO KEY NEEDED</span>
              )}
            </div>
            <p style={{ fontSize: '12px', color: 'var(--foreground-muted)', margin: '0 0 8px 0' }}>{provider.description}</p>

            {/* Existing keys */}
            {!isLoading && existingKeys.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {existingKeys.map((k) => (
                  <div key={k.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--background-alt)', borderRadius: '8px', padding: '6px 10px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0, background: k.isValid === false ? '#ef4444' : k.isValid ? '#10b981' : '#f59e0b' }} />
                    <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--foreground)', flex: 1 }}>{k.label}</span>
                    <span style={{ fontSize: '11px', fontFamily: 'monospace', color: 'var(--foreground-muted)' }}>{k.maskedKey}</span>
                    {k.lastUsed && (
                      <span style={{ fontSize: '10px', color: 'var(--foreground-muted)' }}>
                        Used {new Date(k.lastUsed).toLocaleDateString('ro-RO')}
                      </span>
                    )}
                    <button
                      onClick={() => onDelete(k.id, k.label)}
                      disabled={deleting === k.id}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: '12px', padding: '2px 4px' }}>
                      {deleting === k.id ? '...' : '✕'}
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* No key needed */}
            {(provider as any).noKey && (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '8px', padding: '6px 12px' }}>
                <span style={{ fontSize: '12px' }}>✅</span>
                <span style={{ fontSize: '12px', fontWeight: '600', color: '#166534' }}>Always available — generates images for free</span>
              </div>
            )}
          </div>
        </div>

        {/* Right: add button */}
        {!(provider as any).noKey && (
          <button
            onClick={onAdd}
            style={{
              padding: '8px 16px',
              background: hasKeys ? 'var(--background-alt)' : provider.gradient,
              color: hasKeys ? 'var(--foreground)' : 'white',
              border: hasKeys ? '1px solid var(--border)' : 'none',
              borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600',
              flexShrink: 0, whiteSpace: 'nowrap',
            }}>
            {hasKeys ? '+ Add Another' : '+ Add Key'}
          </button>
        )}
      </div>
    </div>
  );
}
