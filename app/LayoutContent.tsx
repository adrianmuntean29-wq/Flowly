'use client';

import { useLanguage } from './lib/i18n/useLanguage';
import { LanguageSwitcher } from './components/LanguageSwitcher';

export default function LayoutContent({ children }: { children: React.ReactNode }) {
  const { t } = useLanguage();

  return (
    <>
      {/* Sidebar */}
      <aside
        style={{
          width: "240px",
          background: "#111827",
          color: "white",
          padding: "20px",
          display: "flex",
          flexDirection: "column",
          gap: "20px",
        }}
      >
        <h2 style={{ fontSize: "24px", fontWeight: "bold" }}>{t('flowly')}</h2>

        <nav style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <a href="/" style={{ color: "white", textDecoration: "none" }}>{t('dashboard')}</a>
          <a href="/generate" style={{ color: "white", textDecoration: "none" }}>{t('generate')}</a>
          <a href="/calendar" style={{ color: "white", textDecoration: "none" }}>{t('calendar')}</a>
          <a href="/settings" style={{ color: "white", textDecoration: "none" }}>{t('settings')}</a>
        </nav>

        <LanguageSwitcher />
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, padding: "40px", background: "#F3F4F6" }}>
        {children}
      </main>
    </>
  );
}
