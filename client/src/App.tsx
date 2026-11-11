import React from 'react';
import HomePage from './features/home/HomePage';
import JoinPage from './features/waitlist/JoinPage';
import CreatePage from './features/community/CreatePage';

export default function App() {
  const path = window.location.pathname.replace(/\/$/, '') || '/';

  if (path === '/create' || path === '/admin') return <CreatePage />;
  if (path === '/join' || /^\/(c|g)\/[a-z0-9-]+$/.test(path)) return <JoinPage />;
  return <HomePage />;
}
