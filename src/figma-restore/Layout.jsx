import i18next from 'i18next';
import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useAuth } from '../contexts/AuthContext';
import { IntegratedModuleHost } from '../modules/integrated-workbench/ModuleHost';
import { userStorageIdentity } from '../modules/integrated-workbench/bridge.mjs';

const layoutStyles = {
  display: 'flex',
  height: '100dvh',
  overflow: 'hidden',
};

const contentStyles = {
  flex: 1,
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column',
  background: 'var(--wb-page)',
  height: '100%',
};

const mainStyles = {
  flex: 1,
  position: 'relative',
  minWidth: 0,
  minHeight: 0,
  overflowY: 'auto',
  overflowX: 'auto',
};

export const Layout = () => {
  const { user } = useAuth();
  return (
    <div className="wb-app-layout" style={layoutStyles}>
      <Sidebar />
      <div style={contentStyles}>
        <Header title={i18next.t('sidebar.dashboard')} />
        <main style={mainStyles}>
          <Outlet />
          <IntegratedModuleHost key={userStorageIdentity(user)} />
        </main>
      </div>
    </div>
  );
};
