import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Compass, Calculator, BookOpen, PieChart } from 'lucide-react';

export const BottomNav: React.FC = () => {
  const items = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Pipeline', path: '/pipeline', icon: Compass },
    { name: 'Sizer', path: '/calculator', icon: Calculator },
    { name: 'Journal', path: '/journal', icon: BookOpen },
    { name: 'Portfolio', path: '/portfolio', icon: PieChart },
  ];

  return (
    <nav
      className="mobile-bottom-nav"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: 'var(--bottomnav-height)',
        backgroundColor: 'var(--color-bg-surface)',
        borderTop: '1px solid var(--color-border)',
        display: 'none',
        alignItems: 'center',
        justifyContent: 'space-around',
        zIndex: 50,
        paddingBottom: 'env(safe-area-inset-bottom, 0)',
      }}
    >
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            style={({ isActive }) => ({
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              color: isActive ? 'var(--color-accent-primary)' : 'var(--color-text-muted)',
              textDecoration: 'none',
              fontSize: '10px',
              fontWeight: isActive ? 600 : 500,
              width: '20%',
              height: '100%',
              userSelect: 'none',
            })}
          >
            <Icon size={20} />
            <span>{item.name}</span>
          </NavLink>
        );
      })}

      <style>{`
        @media (max-width: 768px) {
          .mobile-bottom-nav {
            display: flex !important;
          }
        }
      `}</style>
    </nav>
  );
};
