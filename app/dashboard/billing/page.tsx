'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useToast } from '@/lib/context/ToastContext';

const PLAN_CONFIG: Record<string, { bg: string; color: string; badge: string; limit: number | null }> = {
  FREE:       { bg: '#f3f4f6', color: '#6b7280', badge: '🆓', limit: 20 },
  PRO:        { bg: '#dbeafe', color: '#1e40af', badge: '⭐', limit: 200 },
  ENTERPRISE: { bg: '#fed7aa', color: '#92400e', badge: '💎', limit: null },
};

export default function BillingPage() {
  const { user, isAuthenticated, token } = useAuth();
  const router = useRouter();
  const { success, error: toastError, warning } = useToast();

  const [billing, setBilling] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCancelling, setIsCancelling] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [thisMonthCount, setThisMonthCount] = useState(0);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('status') === 'success') {
        success('✅ Abonament actualizat! Planul tău este acum activ.');
      }
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }
    loadBilling();
    loadMonthUsage();
  }, [isAuthenticated]);

  const loadBilling = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/subscription/billing', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to load billing info');
      const data = await response.json();
      setBilling(data);
    } catch (err: any) {
      toastError('Eroare la încărcarea datelor de billing');
    } finally {
      setIsLoading(false);
    }
  };

  const loadMonthUsage = async () => {
    try {
      const response = await fetch('/api/posts', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) return;
      const data = await response.json();
      const posts = data.posts || [];
      const now = new Date();
      const count = posts.filter((p: any) => {
        const d = new Date(p.createdAt);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      }).length;
      setThisMonthCount(count);
    } catch {
      // silently fail — usage is supplemental info
    }
  };

  const handleCancelSubscription = async () => {
    setIsCancelling(true);
    setShowCancelModal(false);
    try {
      const response = await fetch('/api/subscription/billing', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to cancel subscription');
      warning('Abonament anulat. Vei avea acces până la sfârșitul perioadei de facturare.');
      loadBilling();
    } catch (err: any) {
      toastError('Eroare la anularea abonamentului');
    } finally {
      setIsCancelling(false);
    }
  };

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px', color: '#6b7280' }}>
        <div style={{ fontSize: '32px', marginBottom: '12px' }}>💳</div>
        <p>Se încarcă informațiile de billing...</p>
      </div>
    );
  }

  const plan = user?.subscriptionPlan || 'FREE';
  const planCfg = PLAN_CONFIG[plan] || PLAN_CONFIG.FREE;
  const planLimit = planCfg.limit;
  const usagePct = planLimit ? Math.min((thisMonthCount / planLimit) * 100, 100) : 0;
  const nearLimit = planLimit ? thisMonthCount > planLimit * 0.8 : false;

  return (
    <div style={{ maxWidth: '800px' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '26px', fontWeight: '700', color: '#111827', margin: '0 0 6px 0' }}>
          💳 Billing & Abonament
        </h2>
        <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>
          Gestionează planul și informațiile de plată
        </p>
      </div>

      {/* Current plan card */}
      <div style={{
        background: 'white', borderRadius: '16px', padding: '28px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)', marginBottom: '20px',
        border: `2px solid ${planCfg.bg}`,
      }}>
        <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#374151', margin: '0 0 20px 0' }}>
          Plan curent
        </h3>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
          <div style={{
            width: '56px', height: '56px', borderRadius: '14px',
            background: planCfg.bg, display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: '26px',
          }}>
            {planCfg.badge}
          </div>
          <div>
            <div style={{ fontSize: '22px', fontWeight: '800', color: '#111827' }}>
              Plan {plan}
            </div>
            <div style={{ fontSize: '13px', color: '#6b7280' }}>
              {planLimit ? `${planLimit} posturi/lună` : 'Posturi nelimitate'}
            </div>
          </div>
          {user?.subscriptionEnd && plan !== 'FREE' && (
            <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
              <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '2px' }}>Se reînnoiește</div>
              <div style={{ fontSize: '14px', fontWeight: '600', color: '#374151' }}>
                {new Date(user.subscriptionEnd).toLocaleDateString('ro-RO', { day: '2-digit', month: 'long', year: 'numeric' })}
              </div>
            </div>
          )}
        </div>

        <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: '20px' }}>
          {plan === 'FREE' ? (
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
              <p style={{ fontSize: '13px', color: '#6b7280', margin: 0 }}>
                Ești pe planul gratuit. Upgrade pentru acces la toate funcționalitățile.
              </p>
              <a
                href="/pricing"
                style={{
                  padding: '10px 22px',
                  background: 'linear-gradient(135deg, #667eea, #764ba2)',
                  color: 'white', textDecoration: 'none',
                  borderRadius: '8px', fontSize: '14px', fontWeight: '700',
                  whiteSpace: 'nowrap',
                }}
              >
                🚀 Upgrade acum
              </a>
            </div>
          ) : (
            <button
              onClick={() => setShowCancelModal(true)}
              disabled={isCancelling}
              style={{
                padding: '9px 18px',
                background: '#fee2e2', color: '#991b1b',
                border: 'none', borderRadius: '8px',
                cursor: isCancelling ? 'not-allowed' : 'pointer',
                fontSize: '13px', fontWeight: '600',
              }}
            >
              {isCancelling ? '⏳ Anulare...' : 'Anulează abonamentul'}
            </button>
          )}
        </div>
      </div>

      {/* Monthly usage card */}
      <div style={{
        background: 'white', borderRadius: '16px', padding: '28px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)', marginBottom: '20px',
      }}>
        <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#374151', margin: '0 0 20px 0' }}>
          Utilizare lunară
        </h3>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ fontSize: '14px', color: '#6b7280' }}>Posturi generate luna aceasta</span>
            <span style={{
              fontSize: '14px', fontWeight: '700',
              color: nearLimit ? '#ef4444' : '#111827',
            }}>
              {thisMonthCount} / {planLimit ?? '∞'}
            </span>
          </div>
          {planLimit && (
            <>
              <div style={{ height: '10px', background: '#f3f4f6', borderRadius: '999px', overflow: 'hidden' }}>
                <div style={{
                  height: '100%', width: `${usagePct}%`,
                  background: nearLimit
                    ? 'linear-gradient(90deg, #f59e0b, #ef4444)'
                    : 'linear-gradient(90deg, #667eea, #764ba2)',
                  borderRadius: '999px',
                  transition: 'width 0.5s ease',
                }} />
              </div>
              {nearLimit && (
                <p style={{ fontSize: '12px', color: '#ef4444', margin: '8px 0 0 0', fontWeight: '600' }}>
                  ⚠️ Aproape de limita lunară ({Math.round(usagePct)}% utilizat). Consideră un upgrade.
                </p>
              )}
            </>
          )}
          {!planLimit && (
            <div style={{
              padding: '12px 16px', background: '#d1fae5', borderRadius: '8px',
              fontSize: '13px', color: '#065f46', fontWeight: '600', marginTop: '8px',
            }}>
              ✅ Plan Business — posturi nelimitate
            </div>
          )}
        </div>

        {/* Quick stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginTop: '20px' }}>
          {[
            { label: 'Luna aceasta', value: thisMonthCount, color: '#667eea' },
            { label: 'Limita planului', value: planLimit ?? '∞', color: '#8b5cf6' },
            { label: 'Rămase', value: planLimit ? Math.max(0, planLimit - thisMonthCount) : '∞', color: '#10b981' },
          ].map(({ label, value, color }) => (
            <div key={label} style={{
              background: '#f9fafb', borderRadius: '10px', padding: '14px',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '22px', fontWeight: '800', color, marginBottom: '4px' }}>{value}</div>
              <div style={{ fontSize: '11px', color: '#9ca3af', fontWeight: '500' }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Payment history */}
      {billing?.payments && billing.payments.length > 0 && (
        <div style={{
          background: 'white', borderRadius: '16px', padding: '28px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
        }}>
          <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#374151', margin: '0 0 20px 0' }}>
            Istoric plăți
          </h3>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Data', 'Plan', 'Sumă', 'Status'].map((h) => (
                  <th key={h} style={{
                    textAlign: 'left', padding: '10px 0', fontSize: '11px',
                    fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase',
                    letterSpacing: '0.05em', borderBottom: '1px solid #f3f4f6',
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {billing.payments.map((payment: any) => (
                <tr key={payment.id} style={{ borderBottom: '1px solid #f9fafb' }}>
                  <td style={{ padding: '14px 0', fontSize: '14px', color: '#374151' }}>
                    {new Date(payment.createdAt).toLocaleDateString('ro-RO')}
                  </td>
                  <td style={{ padding: '14px 0', fontSize: '14px', color: '#374151' }}>
                    {payment.plan}
                  </td>
                  <td style={{ padding: '14px 0', fontSize: '14px', fontWeight: '700', color: '#111827' }}>
                    ${(payment.amount / 100).toFixed(2)}
                  </td>
                  <td style={{ padding: '14px 0' }}>
                    <span style={{
                      fontSize: '11px', fontWeight: '700', padding: '3px 9px',
                      background: payment.status === 'COMPLETED' ? '#dcfce7' : '#fee2e2',
                      color: payment.status === 'COMPLETED' ? '#166534' : '#991b1b',
                      borderRadius: '999px',
                    }}>
                      {payment.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Cancel confirm modal */}
      {showCancelModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: '20px',
        }}>
          <div style={{
            background: 'white', borderRadius: '20px', padding: '32px',
            width: '100%', maxWidth: '420px',
            boxShadow: '0 25px 80px rgba(0,0,0,0.3)',
          }}>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>⚠️</div>
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#111827', margin: '0 0 8px 0' }}>
                Anulezi abonamentul?
              </h3>
              <p style={{ fontSize: '14px', color: '#6b7280', margin: 0, lineHeight: '1.6' }}>
                Vei păstra accesul la planul PRO până la sfârșitul perioadei curente de facturare,
                după care contul va reveni la planul FREE.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setShowCancelModal(false)}
                style={{
                  flex: 1, padding: '11px',
                  background: '#f3f4f6', color: '#374151',
                  border: 'none', borderRadius: '10px',
                  cursor: 'pointer', fontSize: '14px', fontWeight: '600',
                }}
              >
                Renunță
              </button>
              <button
                onClick={handleCancelSubscription}
                style={{
                  flex: 1, padding: '11px',
                  background: '#fee2e2', color: '#991b1b',
                  border: 'none', borderRadius: '10px',
                  cursor: 'pointer', fontSize: '14px', fontWeight: '700',
                }}
              >
                Da, anulează
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
