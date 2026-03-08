'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';

const STEPS = [
  { id: 1, title: 'Welcome to Flowly', subtitle: "Let's set up your brand in 2 minutes" },
  { id: 2, title: 'Brand Identity', subtitle: 'Tell us about your brand' },
  { id: 3, title: 'Voice & Tone', subtitle: 'How do you communicate?' },
  { id: 4, title: 'Your Industry', subtitle: 'What space are you in?' },
  { id: 5, title: "You're all set!", subtitle: "Let's create your first post" },
];

const TONES = [
  { value: 'professional', label: 'Professional', emoji: '💼', desc: 'Formal, authoritative, trustworthy' },
  { value: 'casual', label: 'Casual', emoji: '😊', desc: 'Friendly, approachable, conversational' },
  { value: 'playful', label: 'Playful', emoji: '🎉', desc: 'Fun, energetic, creative' },
  { value: 'inspirational', label: 'Inspirational', emoji: '✨', desc: 'Motivating, uplifting, powerful' },
  { value: 'educational', label: 'Educational', emoji: '📚', desc: 'Informative, clear, helpful' },
  { value: 'bold', label: 'Bold', emoji: '🔥', desc: 'Direct, confident, edgy' },
];

const INDUSTRIES = [
  { value: 'tech', label: 'Tech & Software', emoji: '💻' },
  { value: 'fashion', label: 'Fashion & Beauty', emoji: '👗' },
  { value: 'food', label: 'Food & Restaurant', emoji: '🍕' },
  { value: 'fitness', label: 'Fitness & Wellness', emoji: '💪' },
  { value: 'ecommerce', label: 'E-commerce & Retail', emoji: '🛍️' },
  { value: 'finance', label: 'Finance & Crypto', emoji: '📈' },
  { value: 'real-estate', label: 'Real Estate', emoji: '🏠' },
  { value: 'education', label: 'Education & Coaching', emoji: '🎓' },
  { value: 'travel', label: 'Travel & Hospitality', emoji: '✈️' },
  { value: 'health', label: 'Health & Medical', emoji: '🏥' },
  { value: 'creative', label: 'Creative & Design', emoji: '🎨' },
  { value: 'other', label: 'Other', emoji: '🌐' },
];

export default function OnboardingPage() {
  const { user, token } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);

  const [form, setForm] = useState({
    brandName: user?.brandName || '',
    brandVoiceExample: '',
    brandTone: '',
    brandIndustry: '',
    brandKeywords: '',
  });

  const next = () => setStep((s) => Math.min(s + 1, 5));
  const back = () => setStep((s) => Math.max(s - 1, 1));

  const saveAndFinish = async () => {
    setIsSaving(true);
    try {
      await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          brandName: form.brandName,
          brandTone: form.brandTone,
          brandIndustry: form.brandIndustry,
          brandKeywords: form.brandKeywords
            .split(',')
            .map((k) => k.trim())
            .filter(Boolean),
          brandVoiceExample: form.brandVoiceExample,
          onboardingCompleted: true,
        }),
      });
      router.push('/dashboard');
    } catch (error) {
      console.error('Failed to save onboarding:', error);
      router.push('/dashboard');
    }
  };

  const progress = ((step - 1) / (STEPS.length - 1)) * 100;

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
    >
      <div
        style={{
          background: 'white',
          borderRadius: '20px',
          padding: '48px',
          width: '100%',
          maxWidth: '560px',
          boxShadow: '0 25px 80px rgba(0,0,0,0.3)',
        }}
      >
        {/* Progress bar */}
        <div style={{ marginBottom: '40px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', color: '#6b7280', fontWeight: '500' }}>
              Step {step} of {STEPS.length}
            </span>
            <span style={{ fontSize: '13px', color: '#667eea', fontWeight: '600' }}>
              {Math.round(progress)}%
            </span>
          </div>
          <div
            style={{
              height: '6px',
              background: '#e5e7eb',
              borderRadius: '999px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${progress}%`,
                background: 'linear-gradient(90deg, #667eea, #764ba2)',
                borderRadius: '999px',
                transition: 'width 0.4s ease',
              }}
            />
          </div>
        </div>

        {/* Step header */}
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '26px', fontWeight: '700', color: '#111827', margin: '0 0 8px 0' }}>
            {STEPS[step - 1].title}
          </h1>
          <p style={{ fontSize: '15px', color: '#6b7280', margin: 0 }}>
            {STEPS[step - 1].subtitle}
          </p>
        </div>

        {/* Step content */}
        {step === 1 && <StepWelcome name={user?.firstName} />}
        {step === 2 && <StepBrandIdentity form={form} setForm={setForm} />}
        {step === 3 && <StepTone form={form} setForm={setForm} />}
        {step === 4 && <StepIndustry form={form} setForm={setForm} />}
        {step === 5 && <StepFinish form={form} />}

        {/* Navigation */}
        <div style={{ display: 'flex', gap: '12px', marginTop: '40px' }}>
          {step > 1 && step < 5 && (
            <button
              onClick={back}
              style={{
                flex: 1,
                padding: '14px',
                background: '#f3f4f6',
                color: '#374151',
                border: 'none',
                borderRadius: '10px',
                fontSize: '15px',
                fontWeight: '600',
                cursor: 'pointer',
              }}
            >
              Back
            </button>
          )}

          {step < 4 && (
            <button
              onClick={next}
              style={{
                flex: 1,
                padding: '14px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                fontSize: '15px',
                fontWeight: '600',
                cursor: 'pointer',
              }}
            >
              Continue
            </button>
          )}

          {step === 4 && (
            <button
              onClick={next}
              disabled={!form.brandTone || !form.brandIndustry}
              style={{
                flex: 1,
                padding: '14px',
                background:
                  form.brandTone && form.brandIndustry
                    ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                    : '#e5e7eb',
                color: form.brandTone && form.brandIndustry ? 'white' : '#9ca3af',
                border: 'none',
                borderRadius: '10px',
                fontSize: '15px',
                fontWeight: '600',
                cursor: form.brandTone && form.brandIndustry ? 'pointer' : 'not-allowed',
              }}
            >
              Finish Setup
            </button>
          )}

          {step === 5 && (
            <button
              onClick={saveAndFinish}
              disabled={isSaving}
              style={{
                flex: 1,
                padding: '14px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                fontSize: '15px',
                fontWeight: '600',
                cursor: isSaving ? 'not-allowed' : 'pointer',
                opacity: isSaving ? 0.7 : 1,
              }}
            >
              {isSaving ? 'Saving...' : 'Go to Dashboard'}
            </button>
          )}
        </div>

        {step === 1 && (
          <button
            onClick={() => router.push('/dashboard')}
            style={{
              display: 'block',
              width: '100%',
              marginTop: '12px',
              padding: '10px',
              background: 'transparent',
              border: 'none',
              color: '#9ca3af',
              fontSize: '13px',
              cursor: 'pointer',
              textAlign: 'center',
            }}
          >
            Skip for now
          </button>
        )}
      </div>
    </div>
  );
}

function StepWelcome({ name }: { name?: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '20px 0' }}>
      <div style={{ fontSize: '72px', marginBottom: '20px' }}>🚀</div>
      <p style={{ fontSize: '16px', color: '#374151', lineHeight: '1.7', margin: '0 0 16px 0' }}>
        Hey {name || 'there'}! Welcome to <strong>Flowly</strong> — your AI-powered social media manager.
      </p>
      <p style={{ fontSize: '15px', color: '#6b7280', lineHeight: '1.7', margin: 0 }}>
        In the next 2 minutes, we&apos;ll learn about your brand so every piece of content feels
        100% <em>you</em>. Let&apos;s go!
      </p>
    </div>
  );
}

function StepBrandIdentity({ form, setForm }: any) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <label style={labelStyle}>Brand / Business Name</label>
        <input
          type="text"
          placeholder="e.g. Acme Corp, Sarah's Bakery..."
          value={form.brandName}
          onChange={(e) => setForm({ ...form, brandName: e.target.value })}
          style={inputStyle}
        />
      </div>
      <div>
        <label style={labelStyle}>Keywords & Hashtags</label>
        <input
          type="text"
          placeholder="e.g. #fitness, health, motivation, workout"
          value={form.brandKeywords}
          onChange={(e) => setForm({ ...form, brandKeywords: e.target.value })}
          style={inputStyle}
        />
        <p style={{ fontSize: '12px', color: '#9ca3af', margin: '6px 0 0 0' }}>
          Separate with commas. These will be suggested in every post.
        </p>
      </div>
      <div>
        <label style={labelStyle}>Brand Voice Example (optional)</label>
        <textarea
          placeholder="Paste a caption or sentence that sounds like you..."
          value={form.brandVoiceExample}
          onChange={(e) => setForm({ ...form, brandVoiceExample: e.target.value })}
          style={{ ...inputStyle, minHeight: '100px', resize: 'vertical' }}
        />
        <p style={{ fontSize: '12px', color: '#9ca3af', margin: '6px 0 0 0' }}>
          AI will match this exact writing style in future posts.
        </p>
      </div>
    </div>
  );
}

function StepTone({ form, setForm }: any) {
  return (
    <div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '12px',
        }}
      >
        {TONES.map((tone) => (
          <button
            key={tone.value}
            onClick={() => setForm({ ...form, brandTone: tone.value })}
            style={{
              padding: '16px',
              border: `2px solid ${form.brandTone === tone.value ? '#667eea' : '#e5e7eb'}`,
              borderRadius: '12px',
              background: form.brandTone === tone.value ? '#eef2ff' : 'white',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.15s',
            }}
          >
            <div style={{ fontSize: '24px', marginBottom: '6px' }}>{tone.emoji}</div>
            <div style={{ fontSize: '14px', fontWeight: '600', color: '#111827', marginBottom: '4px' }}>
              {tone.label}
            </div>
            <div style={{ fontSize: '12px', color: '#6b7280' }}>{tone.desc}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

function StepIndustry({ form, setForm }: any) {
  return (
    <div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: '10px',
        }}
      >
        {INDUSTRIES.map((ind) => (
          <button
            key={ind.value}
            onClick={() => setForm({ ...form, brandIndustry: ind.value })}
            style={{
              padding: '14px 10px',
              border: `2px solid ${form.brandIndustry === ind.value ? '#667eea' : '#e5e7eb'}`,
              borderRadius: '12px',
              background: form.brandIndustry === ind.value ? '#eef2ff' : 'white',
              cursor: 'pointer',
              textAlign: 'center',
              transition: 'all 0.15s',
            }}
          >
            <div style={{ fontSize: '22px', marginBottom: '6px' }}>{ind.emoji}</div>
            <div style={{ fontSize: '12px', fontWeight: '600', color: '#111827', lineHeight: '1.3' }}>
              {ind.label}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function StepFinish({ form }: any) {
  return (
    <div style={{ textAlign: 'center', padding: '20px 0' }}>
      <div style={{ fontSize: '72px', marginBottom: '20px' }}>🎉</div>
      <p style={{ fontSize: '16px', color: '#374151', lineHeight: '1.7', margin: '0 0 24px 0' }}>
        Your brand memory is ready! Here&apos;s what Flowly now knows about you:
      </p>
      <div
        style={{
          background: '#f9fafb',
          borderRadius: '12px',
          padding: '20px',
          textAlign: 'left',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        {form.brandName && (
          <Row icon="🏷️" label="Brand" value={form.brandName} />
        )}
        {form.brandIndustry && (
          <Row
            icon="🏢"
            label="Industry"
            value={INDUSTRIES.find((i) => i.value === form.brandIndustry)?.label || form.brandIndustry}
          />
        )}
        {form.brandTone && (
          <Row
            icon="🎙️"
            label="Tone"
            value={TONES.find((t) => t.value === form.brandTone)?.label || form.brandTone}
          />
        )}
        {form.brandKeywords && (
          <Row icon="🏷️" label="Keywords" value={form.brandKeywords} />
        )}
      </div>
      <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '20px' }}>
        Every AI post will now be generated with your brand DNA. You can update these anytime in Settings.
      </p>
    </div>
  );
}

function Row({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
      <span style={{ fontSize: '16px' }}>{icon}</span>
      <div>
        <span style={{ fontSize: '12px', color: '#9ca3af', fontWeight: '500' }}>{label}</span>
        <p style={{ fontSize: '14px', color: '#111827', fontWeight: '600', margin: '2px 0 0 0' }}>{value}</p>
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  marginBottom: '8px',
  fontSize: '14px',
  fontWeight: '600',
  color: '#374151',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 14px',
  border: '1.5px solid #d1d5db',
  borderRadius: '8px',
  fontSize: '14px',
  boxSizing: 'border-box',
  outline: 'none',
  transition: 'border-color 0.15s',
};
