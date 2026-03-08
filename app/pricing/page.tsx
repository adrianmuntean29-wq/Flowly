'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import { useRouter } from 'next/navigation';

export default function PricingPage() {
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const plans = [
    {
      name: 'Free',
      price: 0,
      period: 'forever',
      features: [
        '20 generări pe lună',
        'Text & Image AI generation',
        'Conectare 1 platformă socială',
        '5 template-uri incluse',
        'Community support',
      ],
      cta: 'Plan curent',
      highlighted: false,
      plan: 'FREE',
    },
    {
      name: 'Pro',
      price: 29,
      period: 'month',
      features: [
        '200 generări pe lună',
        'Text, Image, Carousel, Video & Reels AI',
        'Conectare 3 platforme sociale',
        'Programare postări',
        'Analytics avansat',
        'Automations (10/lună)',
        'Template-uri nelimitate',
        'Bring your own API key',
        'Priority support',
      ],
      cta: 'Upgrade la Pro',
      highlighted: true,
      plan: 'PRO',
    },
    {
      name: 'Business',
      price: 99,
      period: 'month',
      features: [
        'Generări nelimitate',
        'Platforme sociale nelimitate',
        'Automations nelimitate',
        'Video AI (Runway, Pika, Luma, Kling)',
        'Bring your own API key',
        'Analytics & rapoarte avansate',
        'Acces API Flowly',
        'Dedicated support',
        'White-label options',
      ],
      cta: 'Upgrade la Business',
      highlighted: false,
      plan: 'ENTERPRISE',
    },
  ];

  const handleUpgrade = async (plan: string) => {
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }

    if (user?.subscriptionPlan === plan) {
      router.push('/dashboard/billing');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/subscription/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify({ plan }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create checkout session');
      }

      const { url } = await response.json();
      window.location.href = url;
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb' }}>
      {/* Header */}
      <div style={{ background: 'white', padding: '40px 20px', textAlign: 'center', borderBottom: '1px solid #e5e7eb' }}>
        <h1 style={{ fontSize: '36px', fontWeight: 'bold', margin: '0 0 12px 0', color: '#111827' }}>
          Choose Your Plan
        </h1>
        <p style={{ fontSize: '18px', color: '#6b7280', margin: 0 }}>
          Start free. Upgrade when you need more power.
        </p>
      </div>

      {/* Pricing Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '24px',
          padding: '60px 20px',
          maxWidth: '1200px',
          margin: '0 auto',
        }}
      >
        {plans.map((plan) => (
          <div
            key={plan.plan}
            style={{
              background: 'white',
              borderRadius: '12px',
              padding: '32px 24px',
              boxShadow: plan.highlighted ? '0 20px 50px rgba(102, 126, 234, 0.15)' : '0 1px 3px rgba(0,0,0,0.1)',
              border: plan.highlighted ? '2px solid #667eea' : '1px solid #e5e7eb',
              position: 'relative',
              transform: plan.highlighted ? 'scale(1.05)' : 'scale(1)',
              transition: 'transform 0.3s',
            }}
          >
            {plan.highlighted && (
              <div
                style={{
                  position: 'absolute',
                  top: '-12px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: '#667eea',
                  color: 'white',
                  padding: '4px 12px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: '600',
                }}
              >
                POPULAR
              </div>
            )}

            <h3 style={{ fontSize: '24px', fontWeight: '600', margin: '0 0 12px 0', color: '#111827' }}>
              {plan.name}
            </h3>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '24px' }}>
              <span style={{ fontSize: '48px', fontWeight: 'bold', color: '#111827' }}>
                ${plan.price}
              </span>
              <span style={{ color: '#6b7280', fontSize: '14px' }}>
                /{plan.period === 'forever' ? 'forever' : 'month'}
              </span>
            </div>

            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px 0', minHeight: '200px' }}>
              {plan.features.map((feature, idx) => (
                <li
                  key={idx}
                  style={{
                    padding: '10px 0',
                    fontSize: '14px',
                    color: '#374151',
                    display: 'flex',
                    gap: '8px',
                  }}
                >
                  <span style={{ color: '#667eea', fontWeight: 'bold' }}>✓</span>
                  {feature}
                </li>
              ))}
            </ul>

            <button
              onClick={() => handleUpgrade(plan.plan)}
              disabled={isLoading || user?.subscriptionPlan === plan.plan}
              style={{
                width: '100%',
                padding: '12px',
                background:
                  user?.subscriptionPlan === plan.plan
                    ? '#e5e7eb'
                    : plan.highlighted
                    ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                    : '#f3f4f6',
                color:
                  user?.subscriptionPlan === plan.plan
                    ? '#6b7280'
                    : plan.highlighted
                    ? 'white'
                    : '#111827',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor:
                  isLoading || user?.subscriptionPlan === plan.plan ? 'not-allowed' : 'pointer',
                opacity: isLoading ? 0.7 : 1,
              }}
            >
              {isLoading ? '⏳ Processing...' : plan.cta}
            </button>

            {plan.plan === 'ENTERPRISE' && (
              <p style={{ fontSize: '12px', color: '#6b7280', textAlign: 'center', marginTop: '12px' }}>
                Prețuri personalizate disponibile pentru echipe mari
              </p>
            )}
          </div>
        ))}
      </div>

      {/* FAQ */}
      <div style={{ background: 'white', padding: '60px 20px', borderTop: '1px solid #e5e7eb' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '32px', textAlign: 'center', color: '#111827' }}>
            FAQ
          </h2>

          <div style={{ display: 'grid', gap: '20px' }}>
            {[
              {
                q: 'Can I change my plan anytime?',
                a: 'Yes! Upgrade or downgrade your plan at any time. Changes take effect immediately.',
              },
              {
                q: 'What happens if I exceed my monthly posts limit?',
                a: 'You can still draft posts, but they won\'t be published until you upgrade or next billing cycle.',
              },
              {
                q: 'Is there a contract?',
                a: 'No contracts. Cancel anytime. Your data stays with you.',
              },
              {
                q: 'Do you offer refunds?',
                a: 'We offer a 14-day money-back guarantee. No questions asked.',
              },
            ].map((faq, idx) => (
              <div key={idx}>
                <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#111827', margin: '0 0 8px 0' }}>
                  {faq.q}
                </h4>
                <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
