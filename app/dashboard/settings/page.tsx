'use client';

import { useEffect, useState } from 'react';
import { useProfile } from '@/lib/hooks/useApi';
import { useAuth } from '@/lib/context/AuthContext';
import { useToast } from '@/lib/context/ToastContext';

const TONES = [
  { value: 'professional', label: 'Professional', emoji: '💼' },
  { value: 'casual', label: 'Casual', emoji: '😊' },
  { value: 'playful', label: 'Playful', emoji: '🎉' },
  { value: 'inspirational', label: 'Inspirational', emoji: '✨' },
  { value: 'educational', label: 'Educational', emoji: '📚' },
  { value: 'bold', label: 'Bold', emoji: '🔥' },
];

const INDUSTRIES = [
  { value: 'tech', label: 'Tech & Software', emoji: '💻' },
  { value: 'fashion', label: 'Fashion & Beauty', emoji: '👗' },
  { value: 'food', label: 'Food & Restaurant', emoji: '🍕' },
  { value: 'fitness', label: 'Fitness & Wellness', emoji: '💪' },
  { value: 'ecommerce', label: 'E-commerce', emoji: '🛍️' },
  { value: 'finance', label: 'Finance', emoji: '📈' },
  { value: 'real-estate', label: 'Real Estate', emoji: '🏠' },
  { value: 'education', label: 'Education', emoji: '🎓' },
  { value: 'travel', label: 'Travel', emoji: '✈️' },
  { value: 'health', label: 'Health', emoji: '🏥' },
  { value: 'creative', label: 'Creative', emoji: '🎨' },
  { value: 'other', label: 'Other', emoji: '🌐' },
];

export default function SettingsPage() {
  const { user } = useAuth();
  const { get, update } = useProfile();
  const { success, error: toastError } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingBrand, setIsSavingBrand] = useState(false);
  const [isSavingMemory, setIsSavingMemory] = useState(false);

  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    language: 'en',
  });

  const [brandData, setBrandData] = useState({
    brandName: '',
    brandColors: { primary: '#667eea', secondary: '#764ba2', accent: '#fbbf24' },
  });

  const [memoryData, setMemoryData] = useState({
    brandTone: '',
    brandIndustry: '',
    brandKeywords: '',
    brandVoiceExample: '',
  });

  useEffect(() => {
    const load = async () => {
      try {
        const data = await get();
        setProfileData({
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          language: data.language || 'en',
        });
        setBrandData({
          brandName: data.brandName || '',
          brandColors: data.brandColors || { primary: '#667eea', secondary: '#764ba2', accent: '#fbbf24' },
        });
        setMemoryData({
          brandTone: data.brandTone || '',
          brandIndustry: data.brandIndustry || '',
          brandKeywords: (data.brandKeywords || []).join(', '),
          brandVoiceExample: data.brandVoiceExample || '',
        });
      } catch (err) {
        console.error('Failed to load profile:', err);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await update(profileData);
      success('Profil actualizat!');
    } catch {
      toastError('Eroare la salvare');
    } finally {
      setIsSaving(false);
    }
  };

  const saveBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingBrand(true);
    try {
      await update(brandData);
      success('Brand Kit salvat!');
    } catch {
      toastError('Eroare la salvare');
    } finally {
      setIsSavingBrand(false);
    }
  };

  const saveMemory = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingMemory(true);
    try {
      await update({
        brandTone: memoryData.brandTone,
        brandIndustry: memoryData.brandIndustry,
        brandKeywords: memoryData.brandKeywords
          .split(',')
          .map((k) => k.trim())
          .filter(Boolean),
        brandVoiceExample: memoryData.brandVoiceExample,
      });
      success('Brand Memory actualizat! AI va folosi noile setări.');
    } catch {
      toastError('Eroare la salvare');
    } finally {
      setIsSavingMemory(false);
    }
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
        <p style={{ color: '#6b7280' }}>Se încarcă setările...</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1100px' }}>
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '26px', fontWeight: '700', color: '#111827', margin: '0 0 6px 0' }}>
          Setări
        </h2>
        <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>
          Gestionează-ți profilul, brandul și memoria AI
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>

        {/* ── Profile ── */}
        <Card title="Profil" icon="👤">
          <form onSubmit={saveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <Field label="Prenume">
              <input
                type="text"
                value={profileData.firstName}
                onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })}
                style={inputStyle}
              />
            </Field>
            <Field label="Nume">
              <input
                type="text"
                value={profileData.lastName}
                onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })}
                style={inputStyle}
              />
            </Field>
            <Field label="Email">
              <input type="email" value={user?.email || ''} disabled style={{ ...inputStyle, background: '#f3f4f6', color: '#9ca3af' }} />
            </Field>
            <Field label="Limbă">
              <select
                value={profileData.language}
                onChange={(e) => setProfileData({ ...profileData, language: e.target.value })}
                style={inputStyle}
              >
                <option value="en">English</option>
                <option value="ro">Română</option>
                <option value="de">Deutsch</option>
                <option value="fr">Français</option>
                <option value="es">Español</option>
                <option value="it">Italiano</option>
              </select>
            </Field>
            <SaveBtn loading={isSaving} label="Salvează profil" />
          </form>
        </Card>

        {/* ── Brand Kit ── */}
        <Card title="Brand Kit" icon="🎨">
          <form onSubmit={saveBrand} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <Field label="Nume brand">
              <input
                type="text"
                value={brandData.brandName}
                onChange={(e) => setBrandData({ ...brandData, brandName: e.target.value })}
                placeholder="e.g. Acme Corp"
                style={inputStyle}
              />
            </Field>
            {(['primary', 'secondary', 'accent'] as const).map((key) => (
              <Field key={key} label={`${key.charAt(0).toUpperCase() + key.slice(1)} Color`}>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <input
                    type="color"
                    value={(brandData.brandColors as any)[key]}
                    onChange={(e) =>
                      setBrandData({ ...brandData, brandColors: { ...brandData.brandColors, [key]: e.target.value } })
                    }
                    style={{ width: '44px', height: '38px', border: 'none', borderRadius: '6px', cursor: 'pointer', padding: '2px' }}
                  />
                  <input
                    type="text"
                    value={(brandData.brandColors as any)[key]}
                    onChange={(e) =>
                      setBrandData({ ...brandData, brandColors: { ...brandData.brandColors, [key]: e.target.value } })
                    }
                    style={{ ...inputStyle, flex: 1 }}
                  />
                </div>
              </Field>
            ))}
            {/* Color preview */}
            <div style={{ display: 'flex', gap: '8px', height: '48px', borderRadius: '8px', overflow: 'hidden', marginTop: '4px' }}>
              <div style={{ flex: 1, background: brandData.brandColors.primary }} />
              <div style={{ flex: 1, background: brandData.brandColors.secondary }} />
              <div style={{ flex: 1, background: brandData.brandColors.accent }} />
            </div>
            <SaveBtn loading={isSavingBrand} label="Salvează Brand Kit" />
          </form>
        </Card>

        {/* ── Brand Memory (AI) ── */}
        <div style={{ gridColumn: '1 / -1' }}>
          <Card title="Brand Memory AI" icon="🧠">
            <p style={{ fontSize: '13px', color: '#6b7280', margin: '0 0 20px 0' }}>
              Aceste setări sunt injectate automat în fiecare generare AI, astfel încât conținutul să reflecte exact vocea brandului tău.
            </p>
            <form onSubmit={saveMemory}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                {/* Tone */}
                <div>
                  <label style={labelStyle}>Tonul brandului</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                    {TONES.map((t) => (
                      <button
                        key={t.value}
                        type="button"
                        onClick={() => setMemoryData({ ...memoryData, brandTone: t.value })}
                        style={{
                          padding: '10px 8px',
                          border: `2px solid ${memoryData.brandTone === t.value ? '#667eea' : '#e5e7eb'}`,
                          borderRadius: '10px',
                          background: memoryData.brandTone === t.value ? '#eef2ff' : 'white',
                          cursor: 'pointer',
                          textAlign: 'center',
                        }}
                      >
                        <div style={{ fontSize: '18px' }}>{t.emoji}</div>
                        <div style={{ fontSize: '11px', fontWeight: '600', color: '#374151', marginTop: '4px' }}>{t.label}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Industry */}
                <div>
                  <label style={labelStyle}>Industrie</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                    {INDUSTRIES.map((ind) => (
                      <button
                        key={ind.value}
                        type="button"
                        onClick={() => setMemoryData({ ...memoryData, brandIndustry: ind.value })}
                        style={{
                          padding: '10px 8px',
                          border: `2px solid ${memoryData.brandIndustry === ind.value ? '#667eea' : '#e5e7eb'}`,
                          borderRadius: '10px',
                          background: memoryData.brandIndustry === ind.value ? '#eef2ff' : 'white',
                          cursor: 'pointer',
                          textAlign: 'center',
                        }}
                      >
                        <div style={{ fontSize: '16px' }}>{ind.emoji}</div>
                        <div style={{ fontSize: '10px', fontWeight: '600', color: '#374151', marginTop: '4px', lineHeight: '1.2' }}>{ind.label}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Keywords */}
                <div>
                  <label style={labelStyle}>Keywords & Hashtags</label>
                  <input
                    type="text"
                    value={memoryData.brandKeywords}
                    onChange={(e) => setMemoryData({ ...memoryData, brandKeywords: e.target.value })}
                    placeholder="#fitness, health, motivation, workout"
                    style={inputStyle}
                  />
                  <p style={{ fontSize: '11px', color: '#9ca3af', margin: '4px 0 0 0' }}>
                    Separate cu virgulă — AI le va include în fiecare post
                  </p>
                </div>

                {/* Voice Example */}
                <div>
                  <label style={labelStyle}>Exemplu de voce (stil de scriere)</label>
                  <textarea
                    value={memoryData.brandVoiceExample}
                    onChange={(e) => setMemoryData({ ...memoryData, brandVoiceExample: e.target.value })}
                    placeholder="Lipește o frază sau un caption care sună ca tine..."
                    style={{ ...inputStyle, minHeight: '90px', resize: 'vertical' }}
                  />
                  <p style={{ fontSize: '11px', color: '#9ca3af', margin: '4px 0 0 0' }}>
                    AI va imita exact stilul acesta
                  </p>
                </div>
              </div>

              <div style={{ marginTop: '20px' }}>
                <SaveBtn loading={isSavingMemory} label="Actualizează Brand Memory" />
              </div>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Card({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div style={{ background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
      <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#111827', margin: '0 0 20px 0', display: 'flex', gap: '8px', alignItems: 'center' }}>
        <span>{icon}</span> {title}
      </h3>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      {children}
    </div>
  );
}

function SaveBtn({ loading, label }: { loading: boolean; label: string }) {
  return (
    <button
      type="submit"
      disabled={loading}
      style={{
        padding: '11px 20px', background: loading ? '#ccc' : 'linear-gradient(135deg, #667eea, #764ba2)',
        color: 'white', border: 'none', borderRadius: '8px',
        cursor: loading ? 'not-allowed' : 'pointer', fontSize: '14px', fontWeight: '600',
      }}
    >
      {loading ? 'Se salvează...' : label}
    </button>
  );
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  marginBottom: '8px',
  fontSize: '12px',
  fontWeight: '700',
  color: '#374151',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  border: '1.5px solid #e5e7eb',
  borderRadius: '8px',
  fontSize: '14px',
  boxSizing: 'border-box',
  outline: 'none',
};
