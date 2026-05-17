'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    startTransition(async () => {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const json = await res.json();
      if (!json.ok) {
        setError(json.error ?? 'Login failed. Please try again.');
        return;
      }
      router.replace('/dashboard');
    });
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: '#f8f9fc' }}>
      {/* ── Left panel ── */}
      <div
        style={{
          flex: '0 0 480px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '48px 56px',
          background: '#fff',
          borderRight: '1px solid #e5e7eb',
        }}
      >
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 40 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: 'linear-gradient(135deg, #4f46e5, #818cf8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.2rem',
              fontWeight: 900,
              color: '#fff',
              flexShrink: 0,
            }}
          >
            ⚛
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#111827', letterSpacing: '-0.01em' }}>
              Project Atom
            </div>
            <div style={{ fontSize: '0.7rem', color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Goal & Performance Portal
            </div>
          </div>
        </div>

        {/* Heading */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#111827', marginBottom: 6, letterSpacing: '-0.02em' }}>
            Welcome back
          </h1>
          <p style={{ fontSize: '0.9rem', color: '#6b7280' }}>
            Sign in with your work email to continue.
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="alert alert-error animate-fade-in" style={{ marginBottom: 20 }}>
            <span>⚠</span>
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }} >
          <div className="form-group">
            <label htmlFor="email" className="form-label text-black/30">Email</label>
            <input
              id="email"
              type="email"
              className="m-3 form-input text-black/20"
              placeholder=" you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label text-black/30">Password</label>
            <input
              id="password"
              type="password"
              className="m-3 form-input text-black/20"
              placeholder=" ••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

            <button
              id="login-btn"
              type="submit"
              className="ml-25 mr-25 btn btn-primary btn-sm bg-blue-400 hover:bg-blue-500 rounded-2xl border-2 border-transparent focus:border-blue-600 outline-none transition-all hover:cursor-pointer"
              disabled={isPending}
              style={{ marginTop: 4 }}
            >
            {isPending ? (
              <>
                <span className="spinner" style={{ width: 16, height: 16 }} />
                Signing in…
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        {/* Demo credentials */}
        <div
          style={{
            marginTop: 36,
            padding: 16,
            background: '#f8f9fc',
            borderRadius: 10,
            border: '1px solid #e5e7eb',
          }}
        >
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>
            Demo Credentials
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[
              { role: 'Employee', email: 'priya@company.com', color: '#eff6ff', text: '#1d4ed8' },
              { role: 'Employee', email: 'rahul@company.com', color: '#eff6ff', text: '#1d4ed8' },
              { role: 'Manager', email: 'arjun@company.com', color: '#f0fdf4', text: '#15803d' },
              { role: 'Admin/HR', email: 'neha@company.com', color: '#faf5ff', text: '#7e22ce' },
            ].map((d) => (
              <button
                key={d.email}
                type="button"
                onClick={() => { setEmail(d.email); setPassword('demo123'); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '6px 10px',
                  borderRadius: 6,
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background 0.1s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#f3f4f6')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <span
                  style={{
                    fontSize: '0.66rem',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: 999,
                    background: d.color,
                    color: d.text,
                    minWidth: 60,
                    textAlign: 'center',
                    flexShrink: 0,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  {d.role}
                </span>
                <span style={{ fontSize: '0.8rem', color: '#374151', fontFamily: 'monospace' }}>
                  {d.email}
                </span>
                <span style={{ fontSize: '0.75rem', color: '#9ca3af', marginLeft: 'auto' }}>
                  demo123
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right hero panel ── */}
      <div
        style={{
          flex: 1,
          background: 'linear-gradient(135deg, #312e81 0%, #4f46e5 50%, #7c3aed 100%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 48,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Background circles */}
        <div
          style={{
            position: 'absolute',
            width: 400,
            height: 400,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.05)',
            top: -100,
            right: -100,
          }}
        />
        <div
          style={{
            position: 'absolute',
            width: 300,
            height: 300,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.05)',
            bottom: -80,
            left: -80,
          }}
        />

        {/* Content */}
        <div style={{ position: 'relative', maxWidth: 420, textAlign: 'center' }}>
          {/* Animated icon */}
          <div
            style={{
              fontSize: '4rem',
              marginBottom: 24,
              filter: 'drop-shadow(0 4px 16px rgba(0,0,0,0.3))',
            }}
          >
            🎯
          </div>

          <h2
            style={{
              fontSize: '2rem',
              fontWeight: 800,
              color: '#fff',
              lineHeight: 1.2,
              marginBottom: 16,
              letterSpacing: '-0.02em',
            }}
          >
            Set goals.<br />Track progress.<br />Drive results.
          </h2>

          <p
            style={{
              fontSize: '1rem',
              color: 'rgba(255,255,255,0.75)',
              lineHeight: 1.7,
              marginBottom: 36,
            }}
          >
            Project Atom brings structure and visibility to your organisation's
            goal-setting cycle — from creation to approval, quarterly check-ins
            to final appraisal.
          </p>

          {/* Feature pills */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center' }}>
            {[
              '✅ Manager Approval Workflow',
              '📊 Quarterly Check-ins',
              '🔗 Shared Team Goals',
              '📈 Progress Scoring',
              '📋 Audit Trail',
              '📤 CSV Reports',
            ].map((f) => (
              <span
                key={f}
                style={{
                  padding: '6px 14px',
                  borderRadius: 999,
                  background: 'rgba(255,255,255,0.12)',
                  color: 'rgba(255,255,255,0.9)',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255,255,255,0.15)',
                }}
              >
                {f}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
