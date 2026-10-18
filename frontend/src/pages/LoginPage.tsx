import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, ArrowRight, Lock, KeyRound, AlertCircle } from 'lucide-react';
import { useAuthStore } from '../store/auth.store';

export const LoginPage: React.FC = () => {
  const [password, setPassword] = useState('');
  const { login, isLoading, error } = useAuthStore();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;

    const success = await login(password);
    if (success) {
      navigate('/');
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--color-bg-base)',
        padding: 'var(--space-4)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background Subtle Radial Glow */}
      <div
        style={{
          position: 'absolute',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(134, 239, 29, 0.06) 0%, rgba(0, 0, 0, 0) 70%)',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          pointerEvents: 'none',
        }}
      />

      <div
        className="card-panel"
        style={{
          width: '100%',
          maxWidth: '440px',
          padding: 'var(--space-8)',
          backgroundColor: 'var(--color-bg-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-xl)',
          boxShadow: 'var(--shadow-lg)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-6)',
          position: 'relative',
          zIndex: 10,
        }}
      >
        {/* Brand Header with Neon Accent */}
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '12px',
              backgroundColor: 'rgba(134, 239, 29, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid var(--color-accent-border)',
              boxShadow: '0 0 16px rgba(134, 239, 29, 0.25)',
            }}
          >
            <Shield size={28} color="var(--color-accent-primary)" />
          </div>

          <div>
            <h1
              style={{
                fontSize: '28px',
                fontWeight: 900,
                letterSpacing: '-0.02em',
                color: '#ffffff',
                margin: 0,
              }}
            >
              Crypto<span style={{ color: 'var(--color-accent-primary)' }}>OS</span> Terminal
            </h1>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
              Single-User Authenticated Trading & Intelligence Environment
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <label
                style={{
                  fontSize: 'var(--text-xs)',
                  color: 'var(--color-text-secondary)',
                  fontWeight: 700,
                  letterSpacing: '0.04em',
                }}
              >
                MASTER ACCESS KEY
              </label>
              <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                Default: <code style={{ color: 'var(--color-accent-primary)' }}>cryptoos2026</code>
              </span>
            </div>

            <div style={{ position: 'relative' }}>
              <input
                type="password"
                className="form-input mono"
                placeholder="Enter master password..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
                style={{
                  paddingLeft: '40px',
                  fontSize: '15px',
                  height: '46px',
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  left: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--color-text-muted)',
                }}
              >
                <Lock size={16} />
              </div>
            </div>

            {error && (
              <div
                style={{
                  marginTop: '8px',
                  padding: '8px 12px',
                  backgroundColor: 'rgba(248, 113, 113, 0.12)',
                  border: '1px solid rgba(248, 113, 113, 0.3)',
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <AlertCircle size={16} color="var(--color-bearish)" />
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-bearish)', fontWeight: 600 }}>
                  {error}
                </span>
              </div>
            )}
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={isLoading || !password}
            style={{
              width: '100%',
              minHeight: '46px',
              fontSize: '15px',
              opacity: !password ? 0.6 : 1,
            }}
          >
            <span>{isLoading ? 'Verifying Key...' : 'Unlock Trading Terminal'}</span>
            <ArrowRight size={16} />
          </button>
        </form>

        {/* Security Notice */}
        <div
          style={{
            padding: '12px 14px',
            backgroundColor: 'var(--color-bg-subtle)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <KeyRound size={18} color="var(--color-accent-primary)" style={{ flexShrink: 0 }} />
          <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)', lineHeight: 1.4 }}>
            AES-256 JWT encrypted session. Exchange read-only API keys are managed purely server-side.
          </span>
        </div>
      </div>
    </div>
  );
};
