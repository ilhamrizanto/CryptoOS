import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Terminal, ArrowRight } from 'lucide-react';
import { useAuthStore } from '../store/auth.store';

export const LoginPage: React.FC = () => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { setToken } = useAuthStore();
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setError('Masukkan Master Password Anda');
      return;
    }

    // In development / initial setup, mock login success
    setToken('dev-session-token');
    navigate('/');
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
      }}
    >
      <div
        className="card-panel"
        style={{
          width: '100%',
          maxWidth: '420px',
          padding: 'var(--space-6)',
          backgroundColor: 'var(--color-bg-surface)',
          border: '1px solid var(--color-border-accent)',
          boxShadow: 'var(--shadow-glow-blue)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-5)',
        }}
      >
        {/* Terminal Header */}
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'rgba(59, 130, 246, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid rgba(59, 130, 246, 0.3)',
            }}
          >
            <Terminal size={24} color="var(--color-accent-primary)" />
          </div>

          <h1
            style={{
              fontSize: 'var(--text-2xl)',
              fontWeight: 800,
              letterSpacing: '-0.02em',
              background: 'linear-gradient(90deg, #60a5fa, #3b82f6)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            CryptoOS Terminal
          </h1>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', margin: 0 }}>
            Restricted Access • Authenticated Terminal Session
          </p>
        </div>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div>
            <label
              style={{
                fontSize: 'var(--text-xs)',
                color: 'var(--color-text-secondary)',
                fontWeight: 600,
                display: 'block',
                marginBottom: '6px',
              }}
            >
              MASTER ACCESS KEY
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="password"
                className="form-input mono"
                placeholder="Enter password..."
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
                autoFocus
              />
            </div>
            {error && (
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-bearish)', marginTop: '4px', display: 'block' }}>
                {error}
              </span>
            )}
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', minHeight: '42px' }}>
            <span>Buka Akses Terminal</span>
            <ArrowRight size={16} />
          </button>
        </form>

        <div
          style={{
            padding: 'var(--space-3)',
            backgroundColor: 'var(--color-bg-subtle)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <Shield size={16} color="var(--color-bullish)" />
          <span style={{ fontSize: 'var(--text-2xs)', color: 'var(--color-text-muted)' }}>
            Single-user isolated deployment. Read-only exchange keys are never exposed to browser context.
          </span>
        </div>
      </div>
    </div>
  );
};
