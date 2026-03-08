'use client';

import { useLanguage } from '@/app/lib/i18n/useLanguage';

export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  return (
    <div style={{ display: 'flex', gap: '10px', marginTop: 'auto' }}>
      <button
        onClick={() => setLanguage('en')}
        style={{
          padding: '8px 12px',
          background: language === 'en' ? '#3B82F6' : '#374151',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontWeight: language === 'en' ? 'bold' : 'normal',
        }}
      >
        EN
      </button>
      <button
        onClick={() => setLanguage('ro')}
        style={{
          padding: '8px 12px',
          background: language === 'ro' ? '#3B82F6' : '#374151',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontWeight: language === 'ro' ? 'bold' : 'normal',
        }}
      >
        RO
      </button>
    </div>
  );
}
