'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import { useToast } from '@/lib/context/ToastContext';
import { useSearchParams } from 'next/navigation';

// ─── Types ───────────────────────────────────────────────────────────────────

interface SocialAccount {
  id: string;
  platform: string;
  username: string;
  accountId: string;
  connectedAt: string;
  expiresAt: string | null;
}

// ─── Platform config ─────────────────────────────────────────────────────────

const PLATFORMS = [
  {
    id: 'instagram',
    name: 'Instagram',
    icon: '📸',
    gradient: 'linear-gradient(45deg, #f09433 0%,#e6683c 25%,#dc2743 50%,#cc2366 75%,#bc1888 100%)',
    color: '#E1306C',
    description: 'Posts, Reels, Stories, Carousel',
    comingSoon: false,
    setupNote: 'Necesită cont Business/Creator legat de o pagină de Facebook.',
  },
  {
    id: 'facebook',
    name: 'Facebook',
    icon: '👥',
    gradient: 'linear-gradient(135deg, #1877F2, #0C5AC8)',
    color: '#1877F2',
    description: 'Posts, Stories, Reels',
    comingSoon: false,
    setupNote: null,
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    icon: '🎵',
    gradient: 'linear-gradient(135deg, #010101, #69C9D0)',
    color: '#010101',
    description: 'Videos, Short-form content',
    comingSoon: false,
    setupNote: null,
  },
  {
    id: 'youtube',
    name: 'YouTube',
    icon: '▶️',
    gradient: 'linear-gradient(135deg, #FF0000, #CC0000)',
    color: '#FF0000',
    description: 'Shorts, Videos, Upload',
    comingSoon: false,
    setupNote: 'Necesită un canal YouTube activ pe contul Google.',
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    icon: '💼',
    gradient: 'linear-gradient(135deg, #0A66C2, #0077B5)',
    color: '#0A66C2',
    description: 'Professional posts, Articles',
    comingSoon: false,
    setupNote: null,
  },
  {
    id: 'twitter',
    name: 'X (Twitter)',
    icon: '𝕏',
    gradient: 'linear-gradient(135deg, #000000, #333)',
    color: '#000000',
    description: 'Tweets, Threads',
    comingSoon: true,
    setupNote: null,
  },
  {
    id: 'pinterest',
    name: 'Pinterest',
    icon: '📌',
    gradient: 'linear-gradient(135deg, #E60023, #AD081B)',
    color: '#E60023',
    description: 'Pins, Boards',
    comingSoon: true,
    setupNote: null,
  },
];

// ─── Setup guide: what env vars each platform needs ──────────────────────────

const PLATFORM_SETUP = [
  {
    id: 'facebook',
    name: 'Facebook & Instagram',
    icon: '👥',
    color: '#1877F2',
    vars: ['FACEBOOK_APP_ID', 'FACEBOOK_APP_SECRET'],
    docsUrl: 'https://developers.facebook.com/apps/',
    docsLabel: 'Meta Developer Console',
    redirectUri: '/api/social/callback/facebook',
    steps: [
      'Creează o aplicație la Meta for Developers (developers.facebook.com)',
      'Activează produsul "Facebook Login"',
      'Adaugă Redirect URI: {APP_URL}/api/social/callback/facebook',
      'Adaugă Redirect URI: {APP_URL}/api/social/callback/instagram',
      'Copiază App ID și App Secret în .env.local',
    ],
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    icon: '🎵',
    color: '#010101',
    vars: ['TIKTOK_CLIENT_KEY', 'TIKTOK_CLIENT_SECRET'],
    docsUrl: 'https://developers.tiktok.com/',
    docsLabel: 'TikTok for Developers',
    redirectUri: '/api/social/callback/tiktok',
    steps: [
      'Creează o aplicație la developers.tiktok.com',
      'Activează "Login Kit" și "Content Posting API"',
      'Adaugă Redirect URI: {APP_URL}/api/social/callback/tiktok',
      'Copiază Client Key și Client Secret în .env.local',
    ],
  },
  {
    id: 'youtube',
    name: 'YouTube (Google)',
    icon: '▶️',
    color: '#FF0000',
    vars: ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET'],
    docsUrl: 'https://console.cloud.google.com/apis/credentials',
    docsLabel: 'Google Cloud Console',
    redirectUri: '/api/social/callback/youtube',
    steps: [
      'Deschide console.cloud.google.com și creează un proiect',
      'Activează "YouTube Data API v3" din API Library',
      'Mergi la Credentials → Create OAuth 2.0 Client ID',
      'Adaugă Authorized Redirect URI: {APP_URL}/api/social/callback/youtube',
      'Copiază Client ID și Client Secret în .env.local',
    ],
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    icon: '💼',
    color: '#0A66C2',
    vars: ['LINKEDIN_CLIENT_ID', 'LINKEDIN_CLIENT_SECRET'],
    docsUrl: 'https://www.linkedin.com/developers/apps',
    docsLabel: 'LinkedIn Developer Portal',
    redirectUri: '/api/social/callback/linkedin',
    steps: [
      'Creează o aplicație la linkedin.com/developers/apps',
      'Adaugă produsele "Share on LinkedIn" și "Sign In with LinkedIn"',
      'Adaugă Redirect URL: {APP_URL}/api/social/callback/linkedin',
      'Copiază Client ID și Client Secret în .env.local',
    ],
  },
];

// ─── Component ───────────────────────────────────────────────────────────────

function SocialAccountsContent() {
  const { token } = useAuth();
  const { success, error: toastError, info } = useToast();
  const searchParams = useSearchParams();

  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [disconnecting, setDisconnecting] = useState<string | null>(null);
  const [confirmDisconnect, setConfirmDisconnect] = useState<SocialAccount | null>(null);
  const [showSetup, setShowSetup] = useState(false);
  const [activeSetup, setActiveSetup] = useState<string | null>(null);

  // ── Load connected accounts ──────────────────────────────────────────────

  const loadAccounts = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const res = await fetch('/api/social/accounts', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) setAccounts(data.accounts || []);
    } catch {
      // silently fail on load
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  // ── Handle URL params (after OAuth redirect back) ────────────────────────

  useEffect(() => {
    const successMsg = searchParams.get('success');
    const errorMsg = searchParams.get('error');
    if (successMsg) {
      success(successMsg);
      loadAccounts();
      window.history.replaceState({}, '', '/dashboard/social');
    }
    if (errorMsg) {
      toastError(errorMsg);
      window.history.replaceState({}, '', '/dashboard/social');
    }
  }, [searchParams]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Connect ─────────────────────────────────────────────────────────────

  const handleConnect = async (platformId: string) => {
    if (!token) return;
    setConnecting(platformId);
    try {
      const res = await fetch(`/api/social/connect/${platformId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 503) {
          // OAuth not configured — show setup guide for this platform
          const setupGroup = PLATFORM_SETUP.find((s) =>
            s.id === platformId || (platformId === 'instagram' && s.id === 'facebook')
          );
          setActiveSetup(setupGroup?.id || null);
          setShowSetup(true);
        } else {
          toastError(data.error || 'Connection failed');
        }
        setConnecting(null);
        return;
      }
      window.location.href = data.authUrl;
    } catch {
      toastError('Could not initiate connection. Check your internet connection.');
      setConnecting(null);
    }
  };

  // ── Disconnect ───────────────────────────────────────────────────────────

  const handleDisconnect = async (account: SocialAccount) => {
    setDisconnecting(account.id);
    setConfirmDisconnect(null);
    try {
      const res = await fetch(`/api/social/accounts/${account.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setAccounts((prev) => prev.filter((a) => a.id !== account.id));
        info(`${account.platform} deconectat`);
      } else {
        const data = await res.json();
        toastError(data.error || 'Disconnect failed');
      }
    } catch {
      toastError('Failed to disconnect account');
    } finally {
      setDisconnecting(null);
    }
  };

  // ── Helpers ──────────────────────────────────────────────────────────────

  const getConnectedAccount = (platformId: string): SocialAccount | undefined =>
    accounts.find((a) => a.platform === platformId);

  const connectedCount = accounts.length;
  const appUrl = typeof window !== 'undefined' ? window.location.origin : '{APP_URL}';

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div style={{ maxWidth: '960px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '26px', fontWeight: '700', color: 'var(--foreground)', margin: '0 0 6px 0' }}>
            Conturi Sociale
          </h2>
          <p style={{ fontSize: '14px', color: 'var(--foreground-muted)', margin: 0 }}>
            Conectează-ți conturile pentru a publica direct din Flowly
          </p>
        </div>
        <button
          onClick={() => { setShowSetup(!showSetup); setActiveSetup(null); }}
          style={{
            padding: '9px 18px', borderRadius: '10px', fontSize: '13px', fontWeight: '600',
            background: showSetup ? '#6366f1' : 'var(--background-alt, #f3f4f6)',
            color: showSetup ? '#fff' : 'var(--foreground)',
            border: 'none', cursor: 'pointer',
          }}
        >
          {showSetup ? '✕ Închide ghid' : '🔧 Ghid configurare OAuth'}
        </button>
      </div>

      {/* Connected banner */}
      {connectedCount > 0 && (
        <div style={{
          background: 'linear-gradient(135deg, #dcfce7, #bbf7d0)',
          border: '1px solid #86efac', borderRadius: '12px',
          padding: '14px 20px', marginBottom: '24px',
          display: 'flex', alignItems: 'center', gap: '12px',
        }}>
          <span style={{ fontSize: '20px' }}>✅</span>
          <div>
            <span style={{ fontSize: '14px', fontWeight: '700', color: '#166534' }}>
              {connectedCount} {connectedCount === 1 ? 'cont conectat' : 'conturi conectate'}
            </span>
            <span style={{ fontSize: '13px', color: '#15803d', marginLeft: '8px' }}>
              {accounts.map((a) => {
                const p = PLATFORMS.find((pl) => pl.id === a.platform);
                return p?.name || a.platform;
              }).join(', ')}
            </span>
          </div>
        </div>
      )}

      {/* ── OAuth Setup Guide ─────────────────────────────────────────────── */}
      {showSetup && (
        <div style={{
          background: 'var(--background-alt, #f9fafb)',
          border: '1.5px solid var(--border, #e5e7eb)',
          borderRadius: '16px', padding: '24px', marginBottom: '28px',
        }}>
          <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--foreground)', margin: '0 0 6px 0' }}>
            🔧 Ghid configurare OAuth
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--foreground-muted)', margin: '0 0 20px 0' }}>
            Pentru fiecare platformă trebuie să creezi o aplicație OAuth și să adaugi cheile în <code style={{ background: '#f3f4f6', padding: '1px 5px', borderRadius: '4px' }}>C:/Users/Andreea/flowly/.env.local</code>
          </p>

          {/* Platform tabs */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '20px' }}>
            {PLATFORM_SETUP.map((setup) => (
              <button
                key={setup.id}
                onClick={() => setActiveSetup(activeSetup === setup.id ? null : setup.id)}
                style={{
                  padding: '7px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: '600',
                  background: activeSetup === setup.id ? setup.color : 'var(--background)',
                  color: activeSetup === setup.id ? '#fff' : 'var(--foreground)',
                  border: `1.5px solid ${activeSetup === setup.id ? setup.color : 'var(--border, #e5e7eb)'}`,
                  cursor: 'pointer',
                }}
              >
                {setup.icon} {setup.name}
              </button>
            ))}
          </div>

          {/* Active platform setup details */}
          {activeSetup && (() => {
            const setup = PLATFORM_SETUP.find((s) => s.id === activeSetup)!;
            return (
              <div style={{
                background: 'var(--background)', borderRadius: '12px',
                border: '1.5px solid var(--border, #e5e7eb)', padding: '20px',
              }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  {/* Steps */}
                  <div>
                    <p style={{ fontSize: '13px', fontWeight: '700', color: 'var(--foreground)', margin: '0 0 12px 0' }}>
                      Pași de configurare:
                    </p>
                    <ol style={{ margin: 0, paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {setup.steps.map((step, i) => (
                        <li key={i} style={{ fontSize: '12px', color: 'var(--foreground-muted)', lineHeight: '1.6' }}>
                          {step.replace('{APP_URL}', appUrl)}
                        </li>
                      ))}
                    </ol>
                    <a
                      href={setup.docsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: '4px',
                        marginTop: '12px', fontSize: '12px', fontWeight: '600',
                        color: setup.color, textDecoration: 'none',
                        padding: '6px 12px', background: setup.color + '12',
                        borderRadius: '8px',
                      }}
                    >
                      🔗 Deschide {setup.docsLabel} →
                    </a>
                  </div>

                  {/* Env vars */}
                  <div>
                    <p style={{ fontSize: '13px', fontWeight: '700', color: 'var(--foreground)', margin: '0 0 12px 0' }}>
                      Adaugă în <code style={{ fontSize: '11px', background: '#f3f4f6', padding: '1px 5px', borderRadius: '4px' }}>.env.local</code>:
                    </p>
                    <div style={{
                      background: '#1e1e2e', borderRadius: '10px', padding: '14px 16px',
                      fontFamily: 'monospace', fontSize: '12px', lineHeight: '2',
                    }}>
                      {setup.vars.map((v) => (
                        <div key={v}>
                          <span style={{ color: '#a6e3a1' }}>{v}</span>
                          <span style={{ color: '#cdd6f4' }}>=</span>
                          <span style={{ color: '#fab387' }}>your_{v.toLowerCase()}_here</span>
                        </div>
                      ))}
                      <div style={{ marginTop: '6px', color: '#6c7086', fontSize: '11px' }}>
                        # Redirect URI to register:
                      </div>
                      <div style={{ color: '#89b4fa', wordBreak: 'break-all' }}>
                        {appUrl}{setup.redirectUri}
                      </div>
                    </div>
                    <p style={{ fontSize: '11px', color: 'var(--foreground-muted)', margin: '10px 0 0 0', lineHeight: '1.5' }}>
                      ⚠️ Restartează serverul după ce modifici .env.local
                    </p>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* ── Platform cards ─────────────────────────────────────────────────── */}
      {isLoading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} style={{
              background: 'var(--background-alt, #f3f4f6)', borderRadius: '16px',
              height: '160px', animation: 'pulse 1.5s ease-in-out infinite',
            }} />
          ))}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
          {PLATFORMS.map((platform) => {
            const account = getConnectedAccount(platform.id);
            const isConnected = !!account;
            const isConnecting = connecting === platform.id;
            const isDisconnecting = disconnecting === account?.id;

            return (
              <div
                key={platform.id}
                style={{
                  background: 'var(--background)',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                  border: isConnected
                    ? `2px solid ${platform.color}55`
                    : '2px solid var(--border, #e5e7eb)',
                  opacity: platform.comingSoon ? 0.55 : 1,
                  transition: 'all 0.2s',
                }}
              >
                {/* Platform header */}
                <div style={{
                  background: platform.gradient,
                  padding: '20px',
                  display: 'flex', alignItems: 'center', gap: '12px',
                }}>
                  <span style={{ fontSize: '26px' }}>{platform.icon}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '16px', fontWeight: '700', color: 'white' }}>
                      {platform.name}
                    </div>
                    <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.8)' }}>
                      {platform.description}
                    </div>
                  </div>
                  {isConnected && (
                    <div style={{
                      width: '10px', height: '10px', borderRadius: '50%',
                      background: '#4ade80', flexShrink: 0,
                      boxShadow: '0 0 0 3px rgba(74,222,128,0.35)',
                    }} />
                  )}
                </div>

                {/* Card body */}
                <div style={{ padding: '16px' }}>
                  {platform.comingSoon ? (
                    <div style={{ textAlign: 'center', padding: '8px 0' }}>
                      <span style={{
                        fontSize: '12px', fontWeight: '700',
                        background: '#fef3c7', color: '#92400e',
                        padding: '4px 14px', borderRadius: '999px',
                      }}>
                        🚧 În curând
                      </span>
                    </div>
                  ) : isConnected ? (
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                        <div style={{
                          width: '30px', height: '30px', borderRadius: '50%',
                          background: platform.gradient,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '13px', color: 'white', fontWeight: '700', flexShrink: 0,
                        }}>
                          {(account.username[0] === '@'
                            ? account.username[1]
                            : account.username[0]
                          )?.toUpperCase() || '?'}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{
                            fontSize: '13px', fontWeight: '600', color: 'var(--foreground)',
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          }}>
                            {account.username}
                          </div>
                          <div style={{ fontSize: '11px', color: '#10b981', fontWeight: '600' }}>
                            ● Conectat
                          </div>
                        </div>
                      </div>

                      {account.expiresAt && new Date(account.expiresAt) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) && (
                        <div style={{
                          fontSize: '11px', color: '#92400e',
                          background: '#fef3c7', padding: '4px 8px',
                          borderRadius: '6px', marginBottom: '10px',
                        }}>
                          ⚠️ Token expiră {new Date(account.expiresAt).toLocaleDateString('ro-RO')}
                        </div>
                      )}

                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => handleConnect(platform.id)}
                          disabled={isConnecting}
                          style={{
                            flex: 1, padding: '8px',
                            background: 'var(--background-alt, #f3f4f6)', color: 'var(--foreground)',
                            border: 'none', borderRadius: '8px',
                            cursor: 'pointer', fontSize: '12px', fontWeight: '600',
                          }}
                        >
                          Reînnoire
                        </button>
                        <button
                          onClick={() => setConfirmDisconnect(account)}
                          disabled={isDisconnecting}
                          style={{
                            flex: 1, padding: '8px',
                            background: '#fee2e2', color: '#991b1b',
                            border: 'none', borderRadius: '8px',
                            cursor: isDisconnecting ? 'not-allowed' : 'pointer',
                            fontSize: '12px', fontWeight: '600',
                          }}
                        >
                          {isDisconnecting ? '...' : 'Deconectează'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      {platform.setupNote && (
                        <p style={{
                          fontSize: '11px', color: 'var(--foreground-muted)', lineHeight: '1.5',
                          margin: '0 0 10px 0', padding: '6px 8px',
                          background: 'var(--background-alt, #f9fafb)',
                          borderRadius: '6px', borderLeft: `3px solid ${platform.color}`,
                        }}>
                          ℹ️ {platform.setupNote}
                        </p>
                      )}
                      <button
                        onClick={() => handleConnect(platform.id)}
                        disabled={isConnecting}
                        style={{
                          width: '100%', padding: '10px',
                          background: isConnecting ? 'var(--background-alt, #d1d5db)' : platform.gradient,
                          color: 'white', border: 'none', borderRadius: '8px',
                          cursor: isConnecting ? 'not-allowed' : 'pointer',
                          fontSize: '13px', fontWeight: '700',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                        }}
                      >
                        {isConnecting ? (
                          <>
                            <span style={{
                              width: '14px', height: '14px',
                              border: '2px solid rgba(255,255,255,0.4)',
                              borderTopColor: 'white', borderRadius: '50%',
                              animation: 'spin 0.8s linear infinite',
                              display: 'inline-block',
                            }} />
                            Se conectează...
                          </>
                        ) : (
                          `Conectează ${platform.name}`
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Info notice */}
      <div style={{
        marginTop: '28px', padding: '16px 20px',
        background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.15)',
        borderRadius: '12px', display: 'flex', gap: '12px',
      }}>
        <span style={{ fontSize: '18px' }}>🔒</span>
        <div>
          <p style={{ fontSize: '13px', fontWeight: '600', color: 'var(--foreground)', margin: '0 0 4px 0' }}>
            Securitate OAuth oficial
          </p>
          <p style={{ fontSize: '12px', color: 'var(--foreground-muted)', margin: 0, lineHeight: '1.6' }}>
            Flowly folosește OAuth 2.0 oficial (Meta Graph API v18, TikTok API v2, YouTube Data API v3, LinkedIn API v2).
            Parolele tale nu sunt niciodată stocate — doar token-uri de acces criptate AES-256. Tokenurile expirate sunt marcate și te poți reconecta oricând.
          </p>
        </div>
      </div>

      {/* Disconnect confirmation modal */}
      {confirmDisconnect && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
        }}>
          <div style={{
            background: 'var(--background)', borderRadius: '20px', padding: '32px',
            width: '100%', maxWidth: '380px', boxShadow: '0 25px 80px rgba(0,0,0,0.3)',
            textAlign: 'center',
          }}>
            {(() => {
              const p = PLATFORMS.find((pl) => pl.id === confirmDisconnect.platform);
              return (
                <>
                  <div style={{
                    width: '56px', height: '56px', borderRadius: '50%',
                    background: p?.gradient || '#ccc',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '26px', margin: '0 auto 16px',
                  }}>
                    {p?.icon || '?'}
                  </div>
                  <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--foreground)', margin: '0 0 8px 0' }}>
                    Deconectezi {p?.name}?
                  </h3>
                  <p style={{ fontSize: '13px', color: 'var(--foreground-muted)', margin: '0 0 24px 0' }}>
                    Nu vei mai putea publica pe <strong>{confirmDisconnect.username}</strong> din Flowly.
                    Poți reconecta oricând.
                  </p>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      onClick={() => setConfirmDisconnect(null)}
                      style={{
                        flex: 1, padding: '11px',
                        background: 'var(--background-alt, #f3f4f6)', color: 'var(--foreground)',
                        border: 'none', borderRadius: '10px',
                        cursor: 'pointer', fontSize: '14px', fontWeight: '600',
                      }}
                    >
                      Anulează
                    </button>
                    <button
                      onClick={() => handleDisconnect(confirmDisconnect)}
                      style={{
                        flex: 1, padding: '11px',
                        background: '#dc2626', color: 'white',
                        border: 'none', borderRadius: '10px',
                        cursor: 'pointer', fontSize: '14px', fontWeight: '700',
                      }}
                    >
                      Deconectează
                    </button>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default function SocialAccountsPage() {
  return (
    <Suspense fallback={null}>
      <SocialAccountsContent />
    </Suspense>
  );
}
