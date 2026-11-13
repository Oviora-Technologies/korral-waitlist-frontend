import {
  Link,
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigate,
} from 'react-router-dom';
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
  const location = useLocation();
  const path = location.pathname;
  const navigate = useNavigate();
  const token = getToken();
  const [checkedToken, setCheckedToken] = useState<string | null>(null);
  const [auth, setAuth] = useState<'checking' | 'signed-in' | 'signed-out'>(
    'checking',
  );
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    let active = true;
    if (!getToken()) {
      setAuth('signed-out');
      setCheckedToken(token);
      return () => {
        active = false;
      };
    }
    apiAuth('/api/auth/me')
      .then((response) => {
        if (!active) return;
        setCheckedToken(token);
        if (response.ok) {
          setAuth('signed-in');
        } else {
          clearToken();
          setAuth('signed-out');
        }
      })
      .catch(() => {
        if (active) {
          setCheckedToken(token);
          // Do not treat a network failure as proof the session is valid.
          setAuth('signed-out');
        }
      });
    return () => {
      active = false;
    };
  }, [path, token]);

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
      navigate('/', { replace: true });
    }
  }

  useEffect(() => {
    if (path === '/' && auth === 'signed-out') setLoggingOut(false);
  }, [path, auth]);

  const checking = auth === 'checking' || checkedToken !== token;
  function protect(page: React.ReactNode) {
    if (loggingOut) return <main role='status'>Logging out…</main>;
    if (checking)
      return (
        <main className='details-main' role='status'>
          Checking your creator session…
        </main>
      );
    if (auth !== 'signed-in')
      return (
        <Navigate
          replace
          to={'/login?next=' + encodeURIComponent(path + location.search)}
        />
      );
    return page;
  }

  useEffect(() => {
    if (location.hash) {
      document.getElementById(location.hash.slice(1))?.scrollIntoView();
    } else {
      window.scrollTo(0, 0);
    }
  }, [location.pathname, location.hash]);

  return (
    <div className='korral-app-layout'>
      <Header
        key={path + location.hash}
        authenticated={auth === 'signed-in'}
        authChecking={checking}
        loggingOut={loggingOut}
        onLogout={handleLogout}
      />
      <Routes>
        <Route path='/' element={<HomePage />} />
        <Route path='/index.html' element={<Navigate to='/' replace />} />
        <Route path='/login' element={<LoginPage />} />
        <Route path='/create' element={<CreatePage />} />
        <Route path='/admin' element={<Navigate to='/create' replace />} />
        <Route path='/join' element={<JoinPage key={path} />} />
        <Route
          path='/c/:slug'
          element={<JoinPage key={path} invitationType='community' />}
        />
        <Route
          path='/g/:slug'
          element={<JoinPage key={path} invitationType='group' />}
        />
        <Route path='/dashboard' element={protect(<DashboardPage />)} />
        <Route
          path='/manage/community/:slug'
          element={protect(
            <CommunityDetailsPage key={path} type='community' />,
          )}
        />
        <Route
          path='/manage/group/:slug'
          element={protect(<CommunityDetailsPage key={path} type='group' />)}
        />
        <Route
          path='*'
          element={
            <main className='details-main'>
              <h1>Page not found</h1>
              <Link to='/'>Return home</Link>
            </main>
          }
        />
      </Routes>
      <Footer />
    </div>
  );
}
