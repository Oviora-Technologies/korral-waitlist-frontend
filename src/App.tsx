import React, { useEffect, useState } from 'react';
import HomePage from './features/home/HomePage';
import JoinPage from './features/waitlist/JoinPage';
import CreatePage from './features/community/CreatePage';
import CommunityDetailsPage from './features/community/CommunityDetailsPage';
import LoginPage from './features/auth/LoginPage';
import DashboardPage from './features/auth/DashboardPage';
import { apiAuth, clearToken, getToken } from './features/auth/authClient';
import { Header, Footer } from './components/SiteLayout';
import './features/home/HomePage.css';

export default function App() {
  const path = window.location.pathname.replace(/\/$/, '') || '/';
  const protectedPage =
    path === '/dashboard' ||
    /^\/manage\/(community|group)\/[a-z0-9-]+$/.test(path);
  const [auth, setAuth] = useState<'checking' | 'signed-in' | 'signed-out'>(
    'checking',
  );
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    let active = true;
    if (!getToken()) {
      setAuth('signed-out');
      if (protectedPage)
        window.location.replace('/login?next=' + encodeURIComponent(path));
      return () => {
        active = false;
      };
    }
    apiAuth('/api/auth/me')
      .then((response) => {
        if (!active) return;
        if (response.ok) {
          setAuth('signed-in');
        } else {
          clearToken();
          setAuth('signed-out');
          if (protectedPage)
            window.location.replace('/login?next=' + encodeURIComponent(path));
        }
      })
      .catch(() => {
        if (active) {
          // Do not treat a network failure as proof the session is valid.
          setAuth('signed-out');
          if (protectedPage)
            window.location.replace('/login?next=' + encodeURIComponent(path));
        }
      });
    return () => {
      active = false;
    };
  }, [path, protectedPage]);

  async function handleLogout() {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await apiAuth('/api/auth/logout', { method: 'POST' });
    } catch {
      // Always clear the local session, even if the server is unreachable.
    } finally {
      clearToken();
      setAuth('signed-out');
      window.location.replace('/');
    }
  }

  let page: React.ReactNode;
  if (protectedPage && auth !== 'signed-in') {
    page = (
      <main className='details-main' role='status'>
        <p>
          {auth === 'checking'
            ? 'Checking your creator session…'
            : 'Redirecting to login…'}
        </p>
      </main>
    );
  } else if (path === '/login') {
    page =
      auth === 'signed-in' ? (
        <main className='details-main'>
          <p>
            You're already signed in.{' '}
            <a href='/dashboard'>Open my communities →</a>
          </p>
        </main>
      ) : (
        <LoginPage />
      );
  } else if (path === '/dashboard') {
    page = <DashboardPage />;
  } else if (path === '/create' || path === '/admin') {
    page = <CreatePage />;
  } else if (/^\/manage\/(community|group)\/[a-z0-9-]+$/.test(path)) {
    page = <CommunityDetailsPage />;
  } else if (path === '/join' || /^\/(c|g)\/[a-z0-9-]+$/.test(path)) {
    page = <JoinPage />;
  } else {
    page = <HomePage />;
  }

  return (
    <div className='vila-app-layout'>
      <Header
        authenticated={auth === 'signed-in'}
        authChecking={auth === 'checking'}
        loggingOut={loggingOut}
        onLogout={handleLogout}
      />
      {page}
      <Footer />
    </div>
  );
}
