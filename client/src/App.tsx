import React from 'react';
import HomePage from './features/home/HomePage';
import JoinPage from './features/waitlist/JoinPage';
import AdminPage from './features/admin/AdminPage';

export default function App() {
  const path = window.location.pathname.replace(/\/$/, '') || '/';

  if (path === '/admin' || path === '/create') return <AdminPage />;
  if (path === '/join' || /^\/(c|g)\/[a-z0-9-]+$/.test(path)) return <JoinPage />;
  return <HomePage />;
}
