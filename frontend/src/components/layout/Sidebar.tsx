import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Compass,
  Calculator,
  BookOpen,
  PieChart,
  SlidersHorizontal,
  ArrowLeftRight,
  Settings,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  LucideIcon,
} from 'lucide-react';
import { useUiStore } from '../../store/ui.store';

interface NavItem {
  name: string;
  path: string;
  icon: LucideIcon;
  badge?: string;
}

const navItems: NavItem[] = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'Pipeline & Ideas', path: '/pipeline', icon: Compass, badge: 'P1-4' },
  { name: 'Position Sizer', path: '/calculator', icon: Calculator },
  { name: 'Trade Journal', path: '/journal', icon: BookOpen },
  { name: 'Portfolio Tracker', path: '/portfolio', icon: PieChart },
  { name: 'Rebalance Matrix', path: '/rebalancing', icon: SlidersHorizontal },
  { name: 'Cashflow Ledger', path: '/cashflow', icon: ArrowLeftRight },
  { name: 'Settings & APIs', path: '/settings', icon: Settings },
];

export const Sidebar: React.FC = () => {
  const { sidebarCollapsed, toggleSidebar, mobileMenuOpen, setMobileMenuOpen } = useUiStore();

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(3px)',
            zIndex: 40,
          }}
        />
      )}

      <aside
        className={`app-sidebar ${sidebarCollapsed ? 'collapsed' : ''} ${mobileMenuOpen ? 'mobile-open' : ''}`}
        style={{
          width: sidebarCollapsed ? 'var(--sidebar-width-collapsed)' : 'var(--sidebar-width)',
          backgroundColor: 'var(--color-bg-surface)',
          borderRight: '1px solid var(--color-border)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          transition: 'width var(--transition-normal), transform var(--transition-normal)',
          height: 'calc(100vh - var(--topbar-height))',
          position: 'sticky',
          top: 'var(--topbar-height)',
          zIndex: 45,
          userSelect: 'none',
        }}
      >
        {/* Navigation Links */}
        <div style={{ padding: 'var(--space-3) var(--space-2)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `nav-link-item ${isActive ? 'active' : ''}`
                }
                style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-3)',
                  padding: sidebarCollapsed ? '10px 0' : '9px 12px',
                  justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
                  borderRadius: 'var(--radius-md)',
                  color: isActive ? '#ffffff' : 'var(--color-text-secondary)',
                  backgroundColor: isActive ? 'var(--color-bg-overlay)' : 'transparent',
                  borderLeft: isActive ? '3px solid var(--color-accent-primary)' : '3px solid transparent',
                  textDecoration: 'none',
                  fontSize: 'var(--text-sm)',
                  fontWeight: isActive ? 600 : 500,
                  transition: 'all var(--transition-fast)',
                })}
                title={sidebarCollapsed ? item.name : undefined}
              >
                <Icon size={18} />
                {!sidebarCollapsed && (
                  <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {item.name}
                  </span>
                )}
                {!sidebarCollapsed && item.badge && (
                  <span
                    style={{
                      fontSize: 'var(--text-2xs)',
                      padding: '1px 5px',
                      borderRadius: 'var(--radius-xs)',
                      backgroundColor: 'rgba(59, 130, 246, 0.15)',
                      color: 'var(--color-accent-primary)',
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </div>

        {/* Footer: Security & Collapse Control */}
        <div
          style={{
            padding: 'var(--space-3)',
            borderTop: '1px solid var(--color-border)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-2)',
          }}
        >
          {!sidebarCollapsed && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 8px',
                background: 'rgba(16, 185, 129, 0.08)',
                border: '1px solid rgba(16, 185, 129, 0.2)',
                borderRadius: 'var(--radius-md)',
                fontSize: 'var(--text-2xs)',
                color: 'var(--color-bullish)',
              }}
            >
              <ShieldCheck size={14} />
              <span>Read-Only API Encrypted</span>
            </div>
          )}

          <button
            className="btn btn-secondary"
            onClick={toggleSidebar}
            style={{
              width: '100%',
              padding: '6px',
              minHeight: 'unset',
              justifyContent: 'center',
            }}
            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        <style>{`
          .nav-link-item:hover {
            color: var(--color-text-primary) !important;
            background-color: var(--color-bg-elevated) !important;
          }
          @media (max-width: 768px) {
            .app-sidebar {
              position: fixed !important;
              left: 0;
              top: var(--topbar-height);
              bottom: 0;
              width: 260px !important;
              transform: translateX(-100%);
              z-index: 55;
            }
            .app-sidebar.mobile-open {
              transform: translateX(0);
            }
          }
        `}</style>
      </aside>
    </>
  );
};
