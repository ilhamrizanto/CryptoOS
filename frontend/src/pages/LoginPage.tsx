import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Shield, Key, ArrowRight } from 'lucide-react';
import { GoogleOAuthProvider, useGoogleLogin } from '@react-oauth/google';
import { useAuthStore } from '../store/auth.store';

// Google OAuth 2.0 Web Client ID from CryptoOS-GAService.json
const GOOGLE_CLIENT_ID =
  (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID ||
  '973014592409-t4v36qps5lh2rrc7pqjv3ebtvuek4fb3.apps.googleusercontent.com';

/**
 * Single Sleek Google Sign-In Action Component using official OAuth2 hook
 */
const GoogleSignInButton: React.FC = () => {
  const { loginWithGoogle, isLoading } = useAuthStore();
  const navigate = useNavigate();

  const handleSuccess = async (tokenResponse: any) => {
    if (!tokenResponse?.access_token) return;
    const success = await loginWithGoogle(
      undefined,
      undefined,
      undefined,
      tokenResponse.access_token
    );
    if (success) navigate('/');
  };

  const googleLogin = useGoogleLogin({
    onSuccess: handleSuccess,
    onError: (err) => console.warn('Google login failed or closed:', err),
  });

  return (
    <button
      type="button"
      onClick={() => googleLogin()}
      disabled={isLoading}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
        padding: '12px 18px',
        backgroundColor: '#131318',
        border: '1px solid #262630',
        borderRadius: 'var(--radius-md, 8px)',
        cursor: isLoading ? 'wait' : 'pointer',
        transition: 'background-color var(--transition-fast), border-color var(--transition-fast)',
      }}
      onMouseEnter={(e) => {
        if (!isLoading) {
          e.currentTarget.style.borderColor = 'var(--color-border-accent, #3a3a48)';
          e.currentTarget.style.backgroundColor = '#181820';
        }
      }}
      onMouseLeave={(e) => {
        if (!isLoading) {
          e.currentTarget.style.borderColor = '#262630';
          e.currentTarget.style.backgroundColor = '#131318';
        }
      }}
    >
      <svg width="18" height="18" viewBox="0 0 24 24">
        <path
          fill="#4285F4"
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        />
        <path
          fill="#34A853"
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        />
        <path
          fill="#FBBC05"
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
        />
        <path
          fill="#EA4335"
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
        />
      </svg>
      <span style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff' }}>
        {isLoading ? 'Authenticating...' : 'Sign in with Google'}
      </span>
    </button>
  );
};

export const LoginPage: React.FC = () => {
  const { login, error, isLoading } = useAuthStore();
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [showKeyLogin, setShowKeyLogin] = useState(false);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;
    const success = await login(password.trim());
    if (success) {
      navigate('/');
    }
  };

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'var(--color-bg-base, #08080a)',
          padding: 'var(--space-4)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: '380px',
            padding: '36px 30px',
            backgroundColor: 'var(--color-bg-surface, #0e0e13)',
            border: '1px solid var(--color-border, #1c1c22)',
            borderRadius: 'var(--radius-xl, 16px)',
            boxShadow: '0 24px 64px rgba(0, 0, 0, 0.9)',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            position: 'relative',
            zIndex: 10,
          }}
        >
          {/* Brand Header with Minimalist Glyph */}
          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '16px',
                overflow: 'hidden',
                border: '1px solid var(--color-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#000000',
              }}
            >
              <img
                src="/logo.png"
                alt="CryptoOS"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>

            <div>
              <h1
                style={{
                  fontSize: '20px',
                  fontWeight: 900,
                  letterSpacing: '-0.03em',
                  color: '#ffffff',
                  margin: 0,
                }}
              >
                Crypto<span style={{ color: 'var(--color-accent-primary)' }}>OS</span> Terminal
              </h1>
              <p style={{ fontSize: '11.5px', color: 'var(--color-text-secondary)', marginTop: '4px', margin: 0 }}>
                Quantitative Investment & Trading Gateway
              </p>
            </div>
          </div>

          {/* Error Notification */}
          {error && (
            <div
              style={{
                padding: '10px 14px',
                backgroundColor: 'rgba(244, 63, 94, 0.12)',
                border: '1px solid rgba(244, 63, 94, 0.3)',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <AlertCircle size={15} color="var(--color-bearish)" style={{ flexShrink: 0 }} />
              <span style={{ fontSize: '11.5px', color: 'var(--color-bearish)', fontWeight: 600 }}>
                {error}
              </span>
            </div>
          )}

          {/* Authentication Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <GoogleSignInButton />

            {/* Divider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '4px 0' }}>
              <div style={{ flex: 1, height: '1px', backgroundColor: 'rgba(255, 255, 255, 0.08)' }} />
              <span style={{ fontSize: '9.5px', color: 'var(--color-text-muted)', fontWeight: 700, letterSpacing: '0.05em' }}>
                OR TERMINAL ACCESS
              </span>
              <div style={{ flex: 1, height: '1px', backgroundColor: 'rgba(255, 255, 255, 0.08)' }} />
            </div>

            {/* Master Key Password Authentication */}
            {!showKeyLogin ? (
              <button
                type="button"
                onClick={() => setShowKeyLogin(true)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '10px 14px',
                  backgroundColor: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--color-text-secondary)',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                  e.currentTarget.style.color = '#ffffff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                  e.currentTarget.style.color = 'var(--color-text-secondary)';
                }}
              >
                <Key size={13} />
                <span>Enter Master Password Key</span>
              </button>
            ) : (
              <form onSubmit={handlePasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ position: 'relative', width: '100%' }}>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter Master Password Key..."
                    autoFocus
                    required
                    style={{
                      width: '100%',
                      padding: '10px 38px 10px 12px',
                      backgroundColor: '#000000',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: 'var(--radius-md)',
                      color: '#ffffff',
                      fontSize: '12px',
                      outline: 'none',
                    }}
                  />
                  <button
                    type="submit"
                    disabled={isLoading || !password.trim()}
                    style={{
                      position: 'absolute',
                      right: '6px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'var(--color-accent-primary)',
                      border: 'none',
                      borderRadius: '4px',
                      width: '26px',
                      height: '26px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      color: '#000000',
                    }}
                    title="Authenticate"
                  >
                    <ArrowRight size={13} />
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Footer Security Badge */}
          <div
            style={{
              padding: '8px 12px',
              backgroundColor: 'rgba(255, 255, 255, 0.02)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            <Shield size={12} color="var(--color-text-muted)" />
            <span style={{ fontSize: '10.5px', color: 'var(--color-text-muted)' }}>
              Protected by Google Identity & BCrypt Cryptographic Enclave
            </span>
          </div>
        </div>
      </div>
    </GoogleOAuthProvider>
  );
};
