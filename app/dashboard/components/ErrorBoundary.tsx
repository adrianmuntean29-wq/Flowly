'use client';

import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: '' };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message || 'Unknown error' };
  }

  componentDidCatch(error: Error) {
    console.error('[Flowly ErrorBoundary]', error);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', padding: '60px 20px', textAlign: 'center',
          minHeight: '400px',
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
          <h3 style={{
            fontSize: '18px', fontWeight: '700',
            color: 'var(--foreground, #111827)', margin: '0 0 8px 0',
          }}>
            Something went wrong
          </h3>
          <p style={{
            fontSize: '14px', color: 'var(--foreground-muted, #6b7280)',
            margin: '0 0 24px 0', maxWidth: '400px',
          }}>
            {this.state.message}
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false, message: '' });
              window.location.reload();
            }}
            style={{
              padding: '10px 24px',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              color: 'white', border: 'none', borderRadius: '10px',
              fontSize: '14px', fontWeight: '600', cursor: 'pointer',
            }}
          >
            Reload page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
