'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  LayoutDashboard, Sparkles, FileText, Calendar, ClipboardList,
  Image, LayoutTemplate, Lightbulb, BarChart2, Share2, Zap,
  KeyRound, CreditCard, Settings, LogOut, Search, X,
} from 'lucide-react';
import { useAuth } from '@/lib/context/AuthContext';

interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon: any;
  href?: string;
  action?: () => void;
  group: string;
  keywords?: string;
}

export function CommandPalette() {
  const router = useRouter();
  const { logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const commands: CommandItem[] = [
    // Navigate
    { id: 'nav-dashboard',    icon: LayoutDashboard, label: 'Dashboard',    description: 'Pagina principală',     href: '/dashboard',                        group: 'Navigare' },
    { id: 'nav-generate',     icon: Sparkles,        label: 'Generate',     description: 'Generează conținut AI', href: '/dashboard/generate',               group: 'Navigare', keywords: 'ai create new' },
    { id: 'nav-carousel',     icon: Sparkles,        label: 'Carousel nou', description: 'Crează carousel AI',    href: '/dashboard/generate/carousel',       group: 'Navigare', keywords: 'slides' },
    { id: 'nav-posts',        icon: FileText,        label: 'Posts',        description: 'Toate postările',       href: '/dashboard/posts',                  group: 'Navigare' },
    { id: 'nav-calendar',     icon: Calendar,        label: 'Calendar',     description: 'Calendar de publicare', href: '/dashboard/calendar',               group: 'Navigare' },
    { id: 'nav-planner',      icon: ClipboardList,   label: 'Planner',      description: 'Planificator săptămânal',href: '/dashboard/planner',               group: 'Navigare' },
    { id: 'nav-library',      icon: Image,           label: 'Library',      description: 'Fișiere și imagini',    href: '/dashboard/library',                group: 'Navigare' },
    { id: 'nav-templates',    icon: LayoutTemplate,  label: 'Templates',    description: 'Template-uri salvate',  href: '/dashboard/templates',              group: 'Navigare' },
    { id: 'nav-ideas',        icon: Lightbulb,       label: 'Ideas',        description: 'Idei de conținut',      href: '/dashboard/ideas',                  group: 'Navigare', keywords: 'inspiration' },
    { id: 'nav-analytics',    icon: BarChart2,       label: 'Analytics',    description: 'Statistici și rapoarte',href: '/dashboard/analytics',              group: 'Navigare' },
    { id: 'nav-social',       icon: Share2,          label: 'Social',       description: 'Conturi conectate',     href: '/dashboard/social',                 group: 'Navigare' },
    { id: 'nav-automations',  icon: Zap,             label: 'Automations',  description: 'Reguli automatizare',   href: '/dashboard/automations',            group: 'Navigare' },
    // Settings
    { id: 'nav-integrations', icon: KeyRound,        label: 'Integrations', description: 'API keys și OAuth',     href: '/dashboard/settings/integrations',  group: 'Setări' },
    { id: 'nav-billing',      icon: CreditCard,      label: 'Billing',      description: 'Plan și facturare',     href: '/dashboard/billing',                group: 'Setări' },
    { id: 'nav-settings',     icon: Settings,        label: 'Settings',     description: 'Setări cont',           href: '/dashboard/settings',               group: 'Setări' },
    // Actions
    { id: 'action-logout',    icon: LogOut,          label: 'Logout',       description: 'Deconectează-te',       action: () => { logout(); router.push('/auth/login'); }, group: 'Acțiuni' },
  ];

  const filtered = query.trim()
    ? commands.filter((c) => {
        const q = query.toLowerCase();
        return (
          c.label.toLowerCase().includes(q) ||
          c.description?.toLowerCase().includes(q) ||
          c.keywords?.toLowerCase().includes(q) ||
          c.group.toLowerCase().includes(q)
        );
      })
    : commands;

  // Group filtered results
  const groups = filtered.reduce<Record<string, CommandItem[]>>((acc, item) => {
    if (!acc[item.group]) acc[item.group] = [];
    acc[item.group].push(item);
    return acc;
  }, {});

  const flatList = filtered;

  const execute = useCallback((item: CommandItem) => {
    setOpen(false);
    setQuery('');
    if (item.href) {
      router.push(item.href);
    } else if (item.action) {
      item.action();
    }
  }, [router]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Open: Ctrl+K or Cmd+K
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((prev) => !prev);
        setActiveIndex(0);
        setQuery('');
      }
      if (!open) return;
      if (e.key === 'Escape') {
        setOpen(false);
        setQuery('');
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, flatList.length - 1));
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
      }
      if (e.key === 'Enter' && flatList[activeIndex]) {
        execute(flatList[activeIndex]);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, flatList, activeIndex, execute]);

  // Focus input when open
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setActiveIndex(0);
    }
  }, [open]);

  // Reset active when query changes
  useEffect(() => { setActiveIndex(0); }, [query]);

  if (!open) return null;

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.5)',
        backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        paddingTop: '15vh',
        zIndex: 9999,
      }}
      onClick={() => { setOpen(false); setQuery(''); }}
    >
      <div
        style={{
          width: '100%', maxWidth: '580px', margin: '0 16px',
          background: 'var(--background)',
          border: '1px solid var(--border)',
          borderRadius: '16px',
          boxShadow: '0 25px 80px rgba(0,0,0,0.3)',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '12px',
          padding: '16px 20px',
          borderBottom: '1px solid var(--border)',
        }}>
          <Search size={20} style={{ color: 'var(--foreground-muted)', flexShrink: 0 }} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Caută pagini sau acțiuni..."
            style={{
              flex: 1, border: 'none', outline: 'none', background: 'transparent',
              fontSize: '16px', color: 'var(--foreground)',
              fontFamily: 'inherit',
            }}
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--foreground-muted)', padding: '2px' }}
            >
              <X size={16} />
            </button>
          )}
          <kbd style={{
            padding: '2px 8px', background: 'var(--background-alt)',
            border: '1px solid var(--border)', borderRadius: '6px',
            fontSize: '12px', color: 'var(--foreground-muted)', fontFamily: 'monospace', flexShrink: 0,
          }}>
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div style={{ maxHeight: '400px', overflowY: 'auto', padding: '8px' }}>
          {flatList.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px', color: 'var(--foreground-muted)' }}>
              <p style={{ margin: 0, fontSize: '14px' }}>Niciun rezultat pentru „{query}"</p>
            </div>
          ) : (
            Object.entries(groups).map(([group, items]) => {
              return (
                <div key={group} style={{ marginBottom: '4px' }}>
                  <div style={{
                    fontSize: '10px', fontWeight: '700', letterSpacing: '0.08em',
                    color: 'var(--foreground-muted)', padding: '8px 12px 4px',
                    textTransform: 'uppercase', opacity: 0.7,
                  }}>
                    {group}
                  </div>
                  {items.map((item) => {
                    const globalIdx = flatList.indexOf(item);
                    const Icon = item.icon;
                    const isActive = globalIdx === activeIndex;
                    return (
                      <button
                        key={item.id}
                        onClick={() => execute(item)}
                        onMouseEnter={() => setActiveIndex(globalIdx)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '12px',
                          width: '100%', padding: '10px 12px', borderRadius: '10px',
                          border: 'none', cursor: 'pointer', textAlign: 'left',
                          background: isActive ? 'var(--primary-50)' : 'transparent',
                          color: isActive ? 'var(--primary-700)' : 'var(--foreground)',
                          transition: 'background 0.1s',
                        }}
                      >
                        <div style={{
                          width: '36px', height: '36px', borderRadius: '8px', flexShrink: 0,
                          background: isActive ? 'var(--primary-100)' : 'var(--background-alt)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: isActive ? 'var(--primary-600)' : 'var(--foreground-muted)',
                        }}>
                          <Icon size={18} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '14px', fontWeight: '600', color: 'inherit' }}>{item.label}</div>
                          {item.description && (
                            <div style={{ fontSize: '12px', color: 'var(--foreground-muted)', marginTop: '1px' }}>{item.description}</div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              );
            })
          )}
        </div>

        {/* Footer hint */}
        <div style={{
          padding: '10px 20px', borderTop: '1px solid var(--border)',
          display: 'flex', gap: '16px', alignItems: 'center',
        }}>
          {[
            { keys: ['↑', '↓'], label: 'navighează' },
            { keys: ['↵'], label: 'selectează' },
            { keys: ['ESC'], label: 'închide' },
          ].map(({ keys, label }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              {keys.map((k) => (
                <kbd key={k} style={{
                  padding: '1px 6px', background: 'var(--background-alt)',
                  border: '1px solid var(--border)', borderRadius: '4px',
                  fontSize: '11px', fontFamily: 'monospace', color: 'var(--foreground-muted)',
                }}>
                  {k}
                </kbd>
              ))}
              <span style={{ fontSize: '11px', color: 'var(--foreground-muted)', marginLeft: '2px' }}>{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
