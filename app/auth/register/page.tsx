'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setIsLoading(true);
    try {
      await register(email, password, firstName || undefined);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    }}>
      <div style={{
        background: 'white', borderRadius: '16px', padding: '40px',
        width: '100%', maxWidth: '420px',
        boxShadow: '0 25px 60px rgba(0,0,0,0.3)',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: '48px', height: '48px', borderRadius: '14px',
            background: 'linear-gradient(135deg, #667eea, #764ba2)',
            fontSize: '22px', marginBottom: '12px',
          }}>⚡</div>
          <h1 style={{ fontSize: '26px', fontWeight: '800', color: '#111827', margin: 0 }}>
            Flowly
          </h1>
          <p style={{ fontSize: '13px', color: '#6b7280', margin: '4px 0 0 0' }}>
            AI Social Media Manager
          </p>
        </div>

        <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#111827', margin: '0 0 20px 0' }}>
          Create your account
        </h2>

        {error && (
          <div style={{
            background: '#fee2e2', color: '#991b1b', padding: '12px',
            borderRadius: '8px', marginBottom: '20px', fontSize: '14px',
            border: '1px solid #fca5a5',
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={labelStyle}>First name (optional)</label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Your name"
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Email *</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Password *</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min. 8 characters"
              required
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Confirm password *</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repeat password"
              required
              style={inputStyle}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || !email || !password || !confirmPassword}
            style={{
              padding: '13px',
              background: isLoading || !email || !password || !confirmPassword
                ? '#c4b5fd'
                : 'linear-gradient(135deg, #667eea, #764ba2)',
              color: 'white', border: 'none', borderRadius: '10px',
              fontSize: '15px', fontWeight: '700',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              marginTop: '4px',
            }}
          >
            {isLoading ? 'Creating account...' : 'Create account — FREE'}
          </button>
        </form>

        <div style={{
          marginTop: '20px', padding: '14px', background: '#f0fdf4',
          borderRadius: '10px', border: '1px solid #bbf7d0',
        }}>
          <p style={{ fontSize: '12px', color: '#166534', margin: 0, textAlign: 'center' }}>
            ✅ Free plan includes 20 AI posts/month — no credit card required
          </p>
        </div>

        <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px', color: '#6b7280' }}>
          Already have an account?{' '}
          <Link href="/auth/login" style={{ color: '#667eea', textDecoration: 'none', fontWeight: '700' }}>
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: 'block', marginBottom: '6px',
  fontSize: '13px', fontWeight: '600', color: '#374151',
};

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 12px',
  border: '1.5px solid #d1d5db', borderRadius: '8px',
  fontSize: '14px', boxSizing: 'border-box',
  outline: 'none', color: '#111827',
};
