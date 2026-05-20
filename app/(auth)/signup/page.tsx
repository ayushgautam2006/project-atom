'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Name is required.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setIsPending(true);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        name,
        action: 'signup',
        redirect: false,
      });

      if (!result?.ok) {
        setError(result?.error || 'Sign up failed. Please try again.');
        setIsPending(false);
        return;
      }

      router.replace('/dashboard');
    } catch (err: any) {
      setError(err?.message || 'An error occurred. Please try again.');
      setIsPending(false);
    }
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
            Create account
          </h1>
          <p style={{ fontSize: '0.9rem', color: '#6b7280' }}>
            Join Project Atom and start setting goals.
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
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="form-group">
            <label htmlFor="name" className="form-label text-black/30">Full Name</label>
            <input
              id="name"
              type="text"
              className="m-3 form-input text-black/20"
              placeholder=" John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoComplete="name"
              autoFocus
            />
          </div>

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
              autoComplete="new-password"
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword" className="form-label text-black/30">Confirm Password</label>
            <input
              id="confirmPassword"
              type="password"
              className="m-3 form-input text-black/20"
              placeholder=" ••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              autoComplete="new-password"
            />
          </div>

          <button
            id="signup-btn"
            type="submit"
            className="ml-25 mr-25 btn btn-primary btn-sm bg-blue-400 hover:bg-blue-500 rounded-2xl border-2 border-transparent focus:border-blue-600 outline-none transition-all hover:cursor-pointer"
            disabled={isPending}
            style={{ marginTop: 4 }}
          >
            {isPending ? (
              <>
                <span className="spinner" style={{ width: 16, height: 16 }} />
                Creating account…
              </>
            ) : (
              'Sign Up'
            )}
          </button>
        </form>

        {/* Link to login */}
        <div style={{ marginTop: 24, textAlign: 'center', fontSize: '0.9rem', color: '#6b7280' }}>
          Already have an account?{' '}
          <Link
            href="/login"
            style={{
              color: '#4f46e5',
              textDecoration: 'none',
              fontWeight: 600,
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
            onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
          >
            Sign In
          </Link>
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
            🚀
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
            Get started today.<br />Set meaningful goals.<br />Track your impact.
          </h2>

          <p
            style={{
              fontSize: '1rem',
              color: 'rgba(255,255,255,0.75)',
              lineHeight: 1.7,
              marginBottom: 36,
            }}
          >
            Join your team on Project Atom and unlock a structured approach to
            goal-setting and performance tracking.
          </p>

          {/* Feature pills */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center' }}>
            {[
              '✅ Easy Setup',
              '📊 Real-time Tracking',
              '🔗 Team Collaboration',
              '📈 Progress Insights',
              '🎯 Goal Alignment',
              '📤 Export Reports',
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
