'use client';

import { createContext, useContext, useState, useCallback, useEffect } from 'react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
  warning: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const TOAST_DURATION = 4000;

const TOAST_CONFIG: Record<ToastType, { accent: string; icon: string; label: string }> = {
  success: { accent: '#10b981', icon: '✓', label: 'Success'  },
  error:   { accent: '#ef4444', icon: '✕', label: 'Error'    },
  info:    { accent: '#6366f1', icon: 'i', label: 'Info'     },
  warning: { accent: '#f59e0b', icon: '!', label: 'Warning'  },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => removeToast(id), TOAST_DURATION + 300);
  }, [removeToast]);

  const value: ToastContextValue = {
    toast: addToast,
    success: (msg) => addToast(msg, 'success'),
    error:   (msg) => addToast(msg, 'error'),
    info:    (msg) => addToast(msg, 'info'),
    warning: (msg) => addToast(msg, 'warning'),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}

      {/* Progress bar keyframe injected once */}
      <style>{`
        @keyframes toastSlideIn {
          from { transform: translateX(110%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
        @keyframes toastProgress {
          from { transform: scaleX(1); }
          to   { transform: scaleX(0); }
        }
      `}</style>

      <div style={{
        position: 'fixed', bottom: '24px', right: '24px',
        display: 'flex', flexDirection: 'column-reverse', gap: '10px',
        zIndex: 9999,
      }}>
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onClose={() => removeToast(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  const [mounted, setMounted] = useState(false);
  const cfg = TOAST_CONFIG[toast.type];

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 10);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      style={{
        position: 'relative', overflow: 'hidden',
        display: 'flex', alignItems: 'center', gap: '12px',
        padding: '13px 16px',
        background: 'rgba(15,23,42,0.96)',
        backdropFilter: 'blur(16px)',
        borderRadius: '14px',
        border: '1px solid rgba(255,255,255,0.08)',
        borderLeft: `3px solid ${cfg.accent}`,
        boxShadow: '0 8px 32px rgba(0,0,0,0.24), 0 2px 8px rgba(0,0,0,0.12)',
        minWidth: '300px', maxWidth: '380px',
        animation: 'toastSlideIn 0.3s cubic-bezier(.4,0,.2,1) both',
      }}
    >
      {/* Icon badge */}
      <div style={{
        width: '26px', height: '26px', borderRadius: '8px',
        background: `${cfg.accent}22`,
        border: `1px solid ${cfg.accent}44`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '12px', fontWeight: '800', color: cfg.accent,
        flexShrink: 0,
      }}>
        {cfg.icon}
      </div>

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: '12px', fontWeight: '700', color: cfg.accent, margin: '0 0 1px 0', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          {cfg.label}
        </p>
        <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.85)', margin: 0, lineHeight: 1.5 }}>
          {toast.message}
        </p>
      </div>

      {/* Close */}
      <button
        onClick={onClose}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'rgba(255,255,255,0.3)', fontSize: '14px',
          padding: '2px', flexShrink: 0, lineHeight: 1,
          transition: 'color 0.15s',
        }}
        onMouseEnter={(e) => (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.7)'}
        onMouseLeave={(e) => (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.3)'}
      >
        ✕
      </button>

      {/* Progress bar */}
      {mounted && (
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: '2px',
          background: `${cfg.accent}33`,
        }}>
          <div style={{
            height: '100%',
            background: cfg.accent,
            transformOrigin: 'left',
            animation: `toastProgress ${TOAST_DURATION}ms linear both`,
          }} />
        </div>
      )}
    </div>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
}
