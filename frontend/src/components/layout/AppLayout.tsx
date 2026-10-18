import React from 'react';
import { Outlet } from 'react-router-dom';
import { Topbar } from './Topbar';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';

export const AppLayout: React.FC = () => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        backgroundColor: 'var(--color-bg-base)',
      }}
    >
      <Topbar />

      <div style={{ display: 'flex', flex: 1, position: 'relative' }}>
        <Sidebar />

        <main
          className="app-main-content"
          style={{
            flex: 1,
            padding: 'var(--space-6)',
            maxWidth: '1600px',
            margin: '0 auto',
            width: '100%',
            overflowY: 'auto',
          }}
        >
          <Outlet />
        </main>
      </div>

      <BottomNav />

      <style>{`
        @media (max-width: 768px) {
          .app-main-content {
            padding: var(--space-4) !important;
            padding-bottom: calc(var(--bottomnav-height) + var(--space-6)) !important;
          }
        }
      `}</style>
    </div>
  );
};
