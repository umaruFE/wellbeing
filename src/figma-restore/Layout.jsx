import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

const layoutStyles = {
  display: 'flex',
  height: '100vh',
  overflow: 'hidden',
};

const contentStyles = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  background: '#f3f2ed',
  height: '100%',
};

const mainStyles = {
  flex: 1,
  overflowY: 'auto',
  overflowX: 'hidden',
};

export const Layout = () => {
  return (
    <div style={layoutStyles}>
      <Sidebar />
      <div style={contentStyles}>
        <Header title="工作看板" />
        <main style={mainStyles}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};