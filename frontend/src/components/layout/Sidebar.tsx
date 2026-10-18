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
  Zap,
  LucideIcon,
} from 'lucide-react';
import { useUiStore } from '../../store/ui.store';

interface NavItem {
  name: string;
  path: string;
  icon: LucideIcon;
  badge?: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    title: 'MAIN',
    items: [
      { name: 'Dashboard', path: '/', icon: LayoutDashboard },
      { name: 'Pipeline & Ideas', path: '/pipeline', icon: Compass, badge: '4-Pilar' },
      { name: 'Position Sizer', path: '/calculator', icon: Calculator },
      { name: 'Trade Journal', path: '/journal', icon: BookOpen },
    ],
  },
  {
    title: 'PORTFOLIO & ASSETS',
    items: [
      { name: 'Portfolio Tracker', path: '/portfolio', icon: PieChart },
      { name: 'Rebalance Matrix', path: '/rebalancing', icon: SlidersHorizontal },
      { name: 'Cashflow Ledger', path: '/cashflow', icon: ArrowLeftRight },
    ],
  },
  {
    title: 'ACCOUNT & SYSTEM',
    items: [
      { name: 'Settings & APIs', path: '/settings', icon: Settings },
    ],
  },
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
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(4px)',
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
          overflowY: 'auto',
          overflowX: 'hidden',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', padding: 'var(--space-3)' }}>
          {/* Top Discipline / Trader Rank Widget (Matches the Level 10 / XP widget in reference image) */}
          {!sidebarCollapsed ? (
            <div
              style={{
                padding: '12px 14px',
                background: 'linear-gradient(180deg, #13191f 0%, #0d1216 100%)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-lg)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span
                  style={{
                    color: 'var(--color-accent-primary)',
                    fontWeight: 800,
                    fontSize: 'var(--text-sm)',
                    letterSpacing: '-0.01em',
                  }}
                >
                  Trader Discipline: Lv. 10
                </span>
                <span
                  className="value-number"
                  style={{ fontSize: 'var(--text-2xs)', color: 'var(--color-text-secondary)' }}
                >
                  850 / 1200 XP
                </span>
              </div>
              <div className="progress-track" style={{ height: '5px' }}>
                <div className="progress-fill" style={{ width: '71%' }} />
              </div>
            </div>
          ) : (
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                padding: '8px 0',
                color: 'var(--color-accent-primary)',
                fontWeight: 800,
                fontSize: 'var(--text-xs)',
              }}
              title="Trader Discipline Level 10"
            >
              L10
            </div>
          )}

          {/* Grouped Nav Items */}
          {navSections.map((section) => (
            <div key={section.title} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {!sidebarCollapsed && (
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    color: 'var(--color-text-muted)',
                    padding: '4px 8px',
                  }}
                >
                  {section.title}
                </span>
              )}

              {section.items.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.path === '/'}
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) => `nav-link-item ${isActive ? 'active' : ''}`}
                    style={({ isActive }) => ({
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--space-3)',
                      padding: sidebarCollapsed ? '10px 0' : '9px 12px',
                      justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
                      borderRadius: 'var(--radius-md)',
                      color: isActive ? 'var(--color-accent-primary)' : 'var(--color-text-secondary)',
                      backgroundColor: isActive ? 'rgba(134, 239, 29, 0.08)' : 'transparent',
                      borderLeft: isActive ? '3px solid var(--color-accent-primary)' : '3px solid transparent',
                      textDecoration: 'none',
                      fontSize: 'var(--text-sm)',
                      fontWeight: isActive ? 700 : 500,
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
                          fontSize: '10px',
                          padding: '1px 6px',
                          borderRadius: 'var(--radius-xs)',
                          backgroundColor: 'rgba(134, 239, 29, 0.15)',
                          color: 'var(--color-accent-primary)',
                          fontFamily: 'var(--font-mono)',
                          fontWeight: 700,
                        }}
                      >
                        {item.badge}
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </div>
          ))}

          {/* Bottom Upgrade/Security Card (Matches "Upgrade to paKIXto Pro" card in reference image) */}
          {!sidebarCollapsed && (
            <div
              style={{
                marginTop: 'var(--space-2)',
                padding: 'var(--space-4)',
                background: 'linear-gradient(180deg, #12181d 0%, #0a0e11 100%)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-lg)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Zap size={18} color="var(--color-accent-primary)" />
                <span style={{ fontWeight: 700, fontSize: 'var(--text-xs)', color: '#ffffff' }}>
                  CryptoOS Terminal Pro
                </span>
              </div>
              <p style={{ fontSize: '11px', color: 'var(--color-text-secondary)', margin: 0, lineHeight: 1.4 }}>
                Private VPS engine with encrypted read-only exchange keys.
              </p>
              <button
                className="btn btn-primary"
                style={{
                  width: '100%',
                  minHeight: '34px',
                  padding: '4px 10px',
                  fontSize: '12px',
                  marginTop: '4px',
                }}
              >
                <span>Terminal Status &rarr;</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer Toggle */}
        <div
          style={{
            padding: 'var(--space-3)',
            borderTop: '1px solid var(--color-border)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-2)',
          }}
        >
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
            color: #ffffff !important;
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
