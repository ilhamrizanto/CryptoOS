import React from 'react';
import { NavLink } from 'react-router-dom';
import { Menu, Search, Bell, Activity, User, Shield } from 'lucide-react';
import { useUiStore } from '../../store/ui.store';
import { useSettingsStore } from '../../store/settings.store';
import { formatIdr } from '../../utils/formatters';

export const Topbar: React.FC = () => {
  const { toggleSidebar, mobileMenuOpen, setMobileMenuOpen } = useUiStore();
  const { usdToIdrRate } = useSettingsStore();

  const topNavLinks = [
    { name: 'Dashboard', path: '/' },
    { name: 'Pipeline', path: '/pipeline' },
    { name: 'Sizer', path: '/calculator' },
    { name: 'Journal', path: '/journal' },
    { name: 'Portfolio', path: '/portfolio' },
    { name: 'Rebalance', path: '/rebalancing' },
  ];

  return (
    <header
      style={{
        height: 'var(--topbar-height)',
        backgroundColor: 'var(--color-bg-surface)',
        borderBottom: '1px solid var(--color-border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 var(--space-5)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}
    >
      {/* Left: Brand Logo & Hamburger */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
        <button
          className="btn btn-secondary mobile-menu-btn"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle mobile menu"
          style={{ padding: '8px', minHeight: 'unset', display: 'none' }}
        >
          <Menu size={18} />
        </button>

        <button
          className="btn btn-secondary desktop-collapse-btn"
          onClick={toggleSidebar}
          aria-label="Toggle sidebar collapse"
          style={{ padding: '8px', minHeight: 'unset' }}
        >
          <Activity size={18} color="var(--color-accent-primary)" />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '6px',
              backgroundColor: 'rgba(134, 239, 29, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid var(--color-accent-border)',
            }}
          >
            <Shield size={16} color="var(--color-accent-primary)" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ fontWeight: 900, fontSize: '18px', color: '#ffffff', letterSpacing: '-0.02em' }}>
                Crypto<span style={{ color: 'var(--color-accent-primary)' }}>OS</span>
              </span>
            </div>
            <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', display: 'block', lineHeight: 1 }}>
              Trading Terminal
            </span>
          </div>
        </div>
      </div>

      {/* Center: Top Navigation Links with Neon Green Indicator (Matches Reference Image) */}
      <nav
        className="topbar-nav-links"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-6)',
          height: '100%',
        }}
      >
        {topNavLinks.map((link) => (
          <NavLink
            key={link.path}
            to={link.path}
            end={link.path === '/'}
            style={({ isActive }) => ({
              color: isActive ? '#ffffff' : 'var(--color-text-secondary)',
              textDecoration: 'none',
              fontSize: 'var(--text-sm)',
              fontWeight: isActive ? 700 : 500,
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              position: 'relative',
              transition: 'color var(--transition-fast)',
            })}
          >
            {({ isActive }) => (
              <>
                <span>{link.name}</span>
                {isActive && (
                  <span
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      height: '3px',
                      backgroundColor: 'var(--color-accent-primary)',
                      borderRadius: '3px 3px 0 0',
                      boxShadow: '0 0 10px var(--color-accent-primary)',
                    }}
                  />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Right: Actions, Rate & User Profile Chip (Matches Reference Image) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
        {/* USD/IDR Rate Display */}
        <div
          className="topbar-rate-chip"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 10px',
            backgroundColor: 'var(--color-bg-elevated)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-full)',
            fontSize: 'var(--text-xs)',
          }}
        >
          <span style={{ color: 'var(--color-text-muted)' }}>USD/IDR</span>
          <span className="value-number" style={{ color: 'var(--color-accent-primary)', fontWeight: 700 }}>
            {formatIdr(usdToIdrRate)}
          </span>
        </div>

        {/* Search Icon */}
        <button
          className="btn btn-secondary"
          style={{ padding: '8px', minHeight: 'unset', borderRadius: 'var(--radius-full)' }}
          aria-label="Search"
        >
          <Search size={16} />
        </button>

        {/* Notification Bell with Green Badge Count (Matches "3" badge in reference image) */}
        <div style={{ position: 'relative' }}>
          <button
            className="btn btn-secondary"
            style={{ padding: '8px', minHeight: 'unset', borderRadius: 'var(--radius-full)' }}
            aria-label="Notifications"
          >
            <Bell size={16} />
          </button>
          <span
            style={{
              position: 'absolute',
              top: '-4px',
              right: '-4px',
              width: '16px',
              height: '16px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'var(--color-accent-primary)',
              color: '#000000',
              fontSize: '10px',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 8px rgba(134, 239, 29, 0.6)',
            }}
          >
            3
          </span>
        </div>

        {/* User Profile Chip (Avatar + Name + Role) */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '3px 10px 3px 4px',
            backgroundColor: 'var(--color-bg-elevated)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-full)',
          }}
        >
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: '#1b262f',
              border: '2px solid var(--color-accent-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
            }}
          >
            <User size={16} color="var(--color-accent-primary)" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: '#ffffff', lineHeight: 1.2 }}>
              Ayan Khan
            </span>
            <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', lineHeight: 1 }}>
              Pro Trader
            </span>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 992px) {
          .topbar-nav-links {
            display: none !important;
          }
          .topbar-rate-chip {
            display: none !important;
          }
        }
        @media (max-width: 768px) {
          .mobile-menu-btn {
            display: inline-flex !important;
          }
          .desktop-collapse-btn {
            display: none !important;
          }
        }
      `}</style>
    </header>
  );
};
