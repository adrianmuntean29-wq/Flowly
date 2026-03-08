'use client';

import { useAuth } from '@/lib/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ThemeProvider } from '@/lib/context/ThemeContext';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { ErrorBoundary } from './components/ErrorBoundary';
import { CommandPalette } from './components/CommandPalette';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [isAuthenticated, isLoading, router]);

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileSidebarOpen(false);
  }, []);

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: 'var(--background)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spin" style={{
            width: '48px',
            height: '48px',
            border: '3px solid var(--border)',
            borderTopColor: 'var(--primary-600)',
            borderRadius: '50%',
            margin: '0 auto 16px'
          }} />
          <p style={{
            color: 'var(--foreground-muted)',
            fontSize: 'var(--text-sm)',
            margin: 0
          }}>
            Loading Flowly...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <ThemeProvider>
      <div style={{
        display: 'flex',
        height: '100vh',
        overflow: 'hidden',
        background: 'var(--background-alt)'
      }}>
        <CommandPalette />

        {/* Mobile sidebar overlay */}
        {mobileSidebarOpen && (
          <div
            style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
              zIndex: 998, display: 'none',
            }}
            className="mobile-overlay"
            onClick={() => setMobileSidebarOpen(false)}
          />
        )}

        {/* Sidebar — hidden on mobile unless open */}
        <div className={`sidebar-wrapper ${mobileSidebarOpen ? 'mobile-open' : ''}`}>
          <Sidebar
            collapsed={sidebarCollapsed}
            onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
            onClose={() => setMobileSidebarOpen(false)}
          />
        </div>

        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          minWidth: 0,
        }}>
          <TopBar onMobileMenuToggle={() => setMobileSidebarOpen(!mobileSidebarOpen)} />

          <main style={{
            flex: 1,
            overflowY: 'auto',
            padding: 'var(--space-8)'
          }}>
            <ErrorBoundary>
              {children}
            </ErrorBoundary>
          </main>
        </div>
      </div>

      <style jsx global>{`
        @media (max-width: 768px) {
          .sidebar-wrapper {
            position: fixed;
            left: -260px;
            top: 0;
            bottom: 0;
            z-index: 999;
            transition: left 0.3s ease;
          }
          .sidebar-wrapper.mobile-open {
            left: 0;
          }
          .mobile-overlay {
            display: block !important;
          }
        }
      `}</style>
    </ThemeProvider>
  );
}
