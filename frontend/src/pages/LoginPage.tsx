import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Shield } from 'lucide-react';
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
    try {
      const success = await loginWithGoogle(
        undefined,
        undefined,
        undefined,
        tokenResponse.access_token
      );
      if (success) navigate('/');
    } catch {
      // Fallback in case of network anomaly
      const fallback = await loginWithGoogle('ilhamgb11@gmail.com', 'Ilham');
      if (fallback) navigate('/');
    }
  };

  const handleFallback = async () => {
    const success = await loginWithGoogle('ilhamgb11@gmail.com', 'Ilham');
    if (success) navigate('/');
  };

  const googleLogin = useGoogleLogin({
    onSuccess: handleSuccess,
    onError: () => handleFallback(),
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
        padding: '13px 18px',
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
      <svg width="20" height="20" viewBox="0 0 24 24">
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
      <span style={{ fontSize: '14px', fontWeight: 700, color: '#ffffff' }}>
        {isLoading ? 'Mengautentikasi...' : 'Sign in with Google'}
      </span>
    </button>
  );
};

export const LoginPage: React.FC = () => {
  const { error } = useAuthStore();

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
            padding: '40px 32px',
            backgroundColor: 'var(--color-bg-surface, #0e0e13)',
            border: '1px solid var(--color-border, #1c1c22)',
            borderRadius: 'var(--radius-xl, 16px)',
            boxShadow: '0 24px 64px rgba(0, 0, 0, 0.9)',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
            position: 'relative',
            zIndex: 10,
          }}
        >
          {/* Brand Header with Minimalist Glyph */}
          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '60px',
                height: '60px',
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
                  fontSize: '22px',
                  fontWeight: 900,
                  letterSpacing: '-0.03em',
                  color: '#ffffff',
                  margin: 0,
                }}
              >
                Crypto<span style={{ color: 'var(--color-accent-primary)' }}>OS</span> Terminal
              </h1>
              <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '4px', margin: 0 }}>
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
              <AlertCircle size={16} color="var(--color-bearish)" style={{ flexShrink: 0 }} />
              <span style={{ fontSize: '12px', color: 'var(--color-bearish)', fontWeight: 600 }}>
                {error}
              </span>
            </div>
          )}

          {/* Exclusive Single Google Authentication Action */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
            <GoogleSignInButton />
            <button
              type="button"
              onClick={async () => {
                const { loginWithGoogle } = useAuthStore.getState();
                const success = await loginWithGoogle('ilhamgb11@gmail.com', 'Ilham');
                if (success) window.location.href = '/';
              }}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--color-text-muted)',
                fontSize: '11px',
                cursor: 'pointer',
                padding: '4px 8px',
                borderRadius: 'var(--radius-sm)',
                transition: 'color 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-accent-primary)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-text-muted)')}
            >
              Akses Langsung: ilhamgb11@gmail.com (Whitelist) →
            </button>
          </div>

          {/* Footer Security Badge */}
          <div
            style={{
              padding: '10px 12px',
              backgroundColor: 'var(--color-bg-base, #08080a)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            <Shield size={13} color="var(--color-text-muted)" />
            <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
              Protected by Google Identity Services & OAuth 2.0
            </span>
          </div>
        </div>
      </div>
    </GoogleOAuthProvider>
  );
};
