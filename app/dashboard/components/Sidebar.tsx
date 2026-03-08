'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Sparkles,
  Image,
  LayoutTemplate,
  Zap,
  ChevronLeft,
  Sun,
  Moon,
  CreditCard,
  LogOut,
  Settings,
  Share2,
  KeyRound,
  LayoutDashboard,
  FileText,
  Calendar,
  BarChart2,
  Lightbulb,
  ClipboardList,
} from 'lucide-react';
import { useTheme } from '@/lib/context/ThemeContext';
import { useAuth } from '@/lib/context/AuthContext';
import { PLAN_DISPLAY_NAME, type SubscriptionPlan } from '@/lib/features/permissions';

interface SidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
  onClose?: () => void;
}

export function Sidebar({ collapsed = false, onToggle, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    router.push('/auth/login');
  };

  const navSections = [
    {
      label: 'PRINCIPAL',
      items: [
        { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
        { icon: Sparkles,        label: 'Generate',  href: '/dashboard/generate', badge: 'AI' },
        { icon: FileText,        label: 'Posts',     href: '/dashboard/posts' },
        { icon: Calendar,        label: 'Calendar',  href: '/dashboard/calendar' },
        { icon: ClipboardList,   label: 'Planner',   href: '/dashboard/planner' },
      ],
    },
    {
      label: 'CONȚINUT',
      items: [
        { icon: Image,          label: 'Library',   href: '/dashboard/library' },
        { icon: LayoutTemplate, label: 'Templates', href: '/dashboard/templates' },
        { icon: Lightbulb,      label: 'Ideas',     href: '/dashboard/ideas' },
      ],
    },
    {
      label: 'ANALITICS',
      items: [
        { icon: BarChart2, label: 'Analytics', href: '/dashboard/analytics' },
        { icon: Share2,    label: 'Social',    href: '/dashboard/social' },
        { icon: Zap,       label: 'Automations', href: '/dashboard/automations' },
      ],
    },
    {
      label: 'SETĂRI',
      items: [
        { icon: KeyRound,  label: 'Integrations', href: '/dashboard/settings/integrations' },
        { icon: CreditCard, label: 'Billing',     href: '/dashboard/billing' },
      ],
    },
  ];

  const isActive = (href: string) => pathname === href;

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      {/* Logo */}
      <div className="sidebar-header">
        <div className="logo">
          <div className="logo-icon">
            <Zap size={24} />
          </div>
          {!collapsed && (
            <div className="logo-text">
              <span className="gradient-text">Flowly</span>
              <span className="version-badge">2.0</span>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {navSections.map((section) => (
          <div key={section.label} className="nav-section">
            {!collapsed && (
              <span className="nav-section-label">{section.label}</span>
            )}
            {section.items.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`nav-item ${active ? 'active' : ''}`}
                  title={collapsed ? item.label : undefined}
                  onClick={onClose}
                >
                  <Icon size={20} />
                  {!collapsed && (
                    <>
                      <span className="nav-label">{item.label}</span>
                      {(item as any).badge && (
                        <span className="nav-badge">{(item as any).badge}</span>
                      )}
                    </>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* User & Theme */}
      <div className="sidebar-footer">
        {/* Theme Toggle */}
        <button
          className="theme-toggle"
          onClick={toggleTheme}
          title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
          {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          {!collapsed && <span>{theme === 'light' ? 'Dark' : 'Light'}</span>}
        </button>

        {/* User Info */}
        {!collapsed && user && (
          <div className="user-info">
            <div className="user-avatar">
              {user.firstName?.[0] || user.email[0].toUpperCase()}
            </div>
            <div className="user-details">
              <div className="user-name">
                {user.firstName || user.email.split('@')[0]}
              </div>
              <div className="user-plan">
                {PLAN_DISPLAY_NAME[(user.subscriptionPlan as SubscriptionPlan) || 'FREE'] || user.subscriptionPlan || 'Free'}
              </div>
            </div>
          </div>
        )}

        {/* Settings */}
        <Link
          href="/dashboard/settings"
          className={`settings-link ${pathname === '/dashboard/settings' ? 'active' : ''}`}
          title="Settings"
        >
          <Settings size={18} />
          {!collapsed && <span>Settings</span>}
        </Link>

        {/* Logout */}
        <button
          className="logout-btn"
          onClick={handleLogout}
          title="Logout"
        >
          <LogOut size={18} />
          {!collapsed && <span>Logout</span>}
        </button>

        {/* Collapse Toggle */}
        {onToggle && (
          <button
            className="collapse-toggle"
            onClick={onToggle}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <ChevronLeft
              size={18}
              style={{
                transform: collapsed ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.3s ease'
              }}
            />
          </button>
        )}
      </div>

      <style jsx>{`
        .sidebar {
          width: 240px;
          height: 100vh;
          background: var(--background);
          border-right: 1px solid var(--border);
          display: flex;
          flex-direction: column;
          transition: width var(--transition-base);
          position: relative;
        }

        .sidebar.collapsed {
          width: 72px;
        }

        /* Header */
        .sidebar-header {
          padding: var(--space-6);
          border-bottom: 1px solid var(--border-subtle);
        }

        .logo {
          display: flex;
          align-items: center;
          gap: var(--space-3);
        }

        .logo-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          background: var(--gradient-primary);
          border-radius: var(--radius-md);
          color: white;
          flex-shrink: 0;
        }

        .logo-text {
          display: flex;
          align-items: center;
          gap: var(--space-2);
        }

        .logo-text span:first-child {
          font-size: var(--text-xl);
          font-weight: var(--font-bold);
        }

        .version-badge {
          padding: 2px 6px;
          background: var(--primary-100);
          color: var(--primary-700);
          border-radius: var(--radius-sm);
          font-size: 10px;
          font-weight: var(--font-semibold);
        }

        [data-theme="dark"] .version-badge {
          background: var(--primary-900);
          color: var(--primary-300);
        }

        /* Navigation */
        .sidebar-nav {
          flex: 1;
          padding: var(--space-3) var(--space-4);
          display: flex;
          flex-direction: column;
          gap: var(--space-3);
          overflow-y: auto;
        }

        .nav-section {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .nav-section-label {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.08em;
          color: var(--foreground-muted);
          padding: 4px var(--space-4) 4px var(--space-2);
          margin-top: 4px;
          opacity: 0.7;
        }

        .nav-item {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          padding: var(--space-3) var(--space-4);
          border-radius: var(--radius-md);
          color: var(--foreground-muted);
          text-decoration: none;
          transition: all var(--transition-fast);
          position: relative;
          font-size: var(--text-sm);
          font-weight: var(--font-medium);
        }

        .sidebar.collapsed .nav-item {
          justify-content: center;
          padding: var(--space-3);
        }

        .nav-item:hover {
          background: var(--background-alt);
          color: var(--foreground);
        }

        .nav-item.active {
          background: var(--primary-50);
          color: var(--primary-600);
          font-weight: var(--font-semibold);
        }

        [data-theme="dark"] .nav-item.active {
          background: rgba(99, 102, 241, 0.1);
          color: var(--primary-400);
        }

        .nav-item.active::before {
          content: '';
          position: absolute;
          left: 0;
          top: 50%;
          transform: translateY(-50%);
          width: 3px;
          height: 60%;
          background: var(--primary-600);
          border-radius: 0 2px 2px 0;
        }

        [data-theme="dark"] .nav-item.active::before {
          background: var(--primary-400);
        }

        .nav-label {
          flex: 1;
        }

        .nav-badge {
          padding: 2px 6px;
          background: var(--gradient-primary);
          color: white;
          border-radius: var(--radius-sm);
          font-size: 10px;
          font-weight: var(--font-bold);
          text-transform: uppercase;
        }

        /* Footer */
        .sidebar-footer {
          padding: var(--space-4);
          border-top: 1px solid var(--border-subtle);
          display: flex;
          flex-direction: column;
          gap: var(--space-3);
        }

        .theme-toggle {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          padding: var(--space-2) var(--space-3);
          background: var(--background-alt);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          color: var(--foreground-muted);
          cursor: pointer;
          transition: all var(--transition-fast);
          font-size: var(--text-sm);
        }

        .sidebar.collapsed .theme-toggle {
          justify-content: center;
          padding: var(--space-2);
        }

        .theme-toggle:hover {
          background: var(--background);
          color: var(--foreground);
          border-color: var(--primary-500);
        }

        .user-info {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          padding: var(--space-3);
          background: var(--background-alt);
          border-radius: var(--radius-md);
        }

        .user-avatar {
          width: 32px;
          height: 32px;
          background: var(--gradient-primary);
          color: white;
          border-radius: var(--radius-full);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: var(--font-semibold);
          font-size: var(--text-sm);
          flex-shrink: 0;
        }

        .user-details {
          flex: 1;
          min-width: 0;
        }

        .user-name {
          font-size: var(--text-sm);
          font-weight: var(--font-medium);
          color: var(--foreground);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .user-plan {
          font-size: var(--text-xs);
          color: var(--foreground-muted);
          text-transform: uppercase;
          font-weight: var(--font-semibold);
        }

        .collapse-toggle {
          padding: var(--space-2);
          background: transparent;
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          color: var(--foreground-muted);
          cursor: pointer;
          transition: all var(--transition-fast);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .collapse-toggle:hover {
          background: var(--background-alt);
          border-color: var(--primary-500);
          color: var(--foreground);
        }

        .settings-link {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          padding: var(--space-2) var(--space-3);
          background: transparent;
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          color: var(--foreground-muted);
          text-decoration: none;
          transition: all var(--transition-fast);
          font-size: var(--text-sm);
        }

        .sidebar.collapsed .settings-link {
          justify-content: center;
          padding: var(--space-2);
        }

        .settings-link:hover, .settings-link.active {
          background: var(--background-alt);
          color: var(--foreground);
          border-color: var(--primary-500);
        }

        .logout-btn {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          padding: var(--space-2) var(--space-3);
          background: transparent;
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          color: var(--foreground-muted);
          cursor: pointer;
          transition: all var(--transition-fast);
          font-size: var(--text-sm);
          width: 100%;
        }

        .sidebar.collapsed .logout-btn {
          justify-content: center;
          padding: var(--space-2);
        }

        .logout-btn:hover {
          background: #fee2e2;
          border-color: #fca5a5;
          color: #991b1b;
        }
      `}</style>
    </aside>
  );
}
