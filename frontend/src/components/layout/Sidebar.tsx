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
    title: 'EXECUTION & IDEAS',
    items: [
      { name: 'Dashboard', path: '/', icon: LayoutDashboard },
      { name: 'Pipeline Incubator', path: '/pipeline', icon: Compass, badge: '4-Pillars' },
      { name: 'Position Sizer', path: '/calculator', icon: Calculator },
      { name: 'Trade Journal', path: '/journal', icon: BookOpen },
    ],
  },
  {
    title: 'PORTFOLIO & WEALTH',
    items: [
      { name: 'Portfolio Tracker', path: '/portfolio', icon: PieChart },
      { name: 'Rebalance Matrix', path: '/rebalancing', icon: SlidersHorizontal },
      { name: 'Cashflow Ledger', path: '/cashflow', icon: ArrowLeftRight },
    ],
  },
  {
    title: 'SYSTEM',
    items: [
      { name: 'Settings & APIs', path: '/settings', icon: Settings },
    ],
  },
];

export const Sidebar: React.FC = () => {
  const { mobileMenuOpen, setMobileMenuOpen } = useUiStore();

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(4px)',
            zIndex: 40,
          }}
        />
      )}

      <aside
        className={`app-sidebar ${mobileMenuOpen ? 'mobile-open' : ''}`}
        style={{
          width: '58px',
          backgroundColor: 'var(--color-bg-base)',
          borderRight: '1px solid var(--color-border)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          transition: 'transform var(--transition-normal)',
          height: 'calc(100vh - var(--topbar-height))',
          position: 'sticky',
          top: 'var(--topbar-height)',
          zIndex: 45,
          userSelect: 'none',
          overflowY: 'visible',
          overflowX: 'visible',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', padding: '12px 6px' }}>
          {/* Grouped Nav Items */}
          {navSections.map((section) => (
            <div key={section.title} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span
                className="sidebar-section-title"
                style={{
                  fontSize: '9px',
                  fontWeight: 800,
                  letterSpacing: '0.08em',
                  color: 'var(--color-text-muted)',
                  padding: '6px 8px 2px',
                  display: 'none', // Hidden on desktop mini mode, visible on mobile
                }}
              >
                {section.title}
              </span>

              {section.items.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.path} className="sidebar-item-wrapper" style={{ position: 'relative' }}>
                    <NavLink
                      to={item.path}
                      end={item.path === '/'}
                      onClick={() => setMobileMenuOpen(false)}
                      className={({ isActive }) => `nav-link-item ${isActive ? 'active' : ''}`}
                      style={({ isActive }) => ({
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '10px 0',
                        justifyContent: 'center',
                        borderRadius: 'var(--radius-md)',
                        color: isActive ? 'var(--color-accent-primary)' : 'var(--color-text-secondary)',
                        backgroundColor: isActive ? 'var(--color-accent-dim)' : 'transparent',
                        borderLeft: isActive ? '3px solid var(--color-accent-primary)' : '3px solid transparent',
                        textDecoration: 'none',
                        fontSize: '13px',
                        fontWeight: isActive ? 700 : 500,
                        transition: 'color var(--transition-fast), background-color var(--transition-fast), border-color var(--transition-fast)',
                      })}
                    >
                      <Icon size={17} />
                      <span className="sidebar-item-label" style={{ display: 'none', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.name}
                      </span>
                      {item.badge && (
                        <span
                          className="sidebar-item-badge"
                          style={{
                            display: 'none',
                            fontSize: '9px',
                            padding: '1px 5px',
                            borderRadius: 'var(--radius-xs)',
                            backgroundColor: 'var(--color-accent-dim)',
                            color: 'var(--color-accent-primary)',
                            fontFamily: 'var(--font-mono)',
                            fontWeight: 700,
                          }}
                        >
                          {item.badge}
                        </span>
                      )}
                    </NavLink>

                    {/* Tooltip on Hover in Desktop Mini Mode */}
                    <div className="sidebar-tooltip">
                      <span>{item.name}</span>
                      {item.badge && (
                        <span
                          style={{
                            marginLeft: '6px',
                            fontSize: '8px',
                            padding: '1px 4px',
                            borderRadius: '2px',
                            backgroundColor: 'var(--color-accent-dim)',
                            color: 'var(--color-accent-primary)',
                          }}
                        >
                          {item.badge}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        <style>{`
          .nav-link-item:hover {
            color: #ffffff !important;
            background-color: var(--color-bg-elevated) !important;
          }
          .nav-link-item:active {
            transform: scale(0.96);
          }
          .sidebar-tooltip {
            position: absolute;
            left: 100%;
            top: 50%;
            transform: translateY(-50%) translateX(6px) scale(0.96);
            background-color: #111114;
            color: #ffffff;
            border: 1px solid #27272a;
            border-radius: 6px;
            padding: 5px 9px;
            font-size: 11px;
            font-weight: 700;
            white-space: nowrap;
            pointer-events: none;
            opacity: 0;
            visibility: hidden;
            transition: opacity 140ms var(--ease-out), transform 140ms var(--ease-out);
            z-index: 1000;
            box-shadow: 0 6px 20px rgba(0, 0, 0, 0.9);
            display: flex;
            align-items: center;
          }
          .sidebar-item-wrapper:hover .sidebar-tooltip {
            opacity: 1;
            visibility: visible;
            transform: translateY(-50%) translateX(10px) scale(1);
          }
          @media (max-width: 768px) {
            .app-sidebar {
              position: fixed !important;
              left: 0;
              top: var(--topbar-height);
              bottom: 0;
              width: 240px !important;
              transform: translateX(-100%);
              z-index: 55;
            }
            .app-sidebar.mobile-open {
              transform: translateX(0);
            }
            .app-sidebar .sidebar-section-title {
              display: block !important;
            }
            .app-sidebar .sidebar-item-label {
              display: inline-block !important;
            }
            .app-sidebar .sidebar-item-badge {
              display: inline-block !important;
            }
            .app-sidebar .nav-link-item {
              justifyContent: flex-start !important;
              padding: 9px 12px !important;
            }
            .sidebar-tooltip {
              display: none !important;
            }
          }
        `}</style>
      </aside>
    </>
  );
};
