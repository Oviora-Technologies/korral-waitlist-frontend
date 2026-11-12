import { Link, useNavigate } from 'react-router-dom';
import React, { useEffect, useState } from 'react';
import { apiAuth } from './authClient';
import '../../styles/WaitlistPages.css';
type Org = {
  id: string;
  name: string;
  type: 'community' | 'group';
  slug: string;
  description: string;
  location?: { country: string; stateProvince: string; address: string };
};
export default function DashboardPage() {
  const navigate = useNavigate();
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [user, setUser] = useState<{ name: string; email: string } | null>(
    null,
  );
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(true);
  useEffect(() => {
    apiAuth('/api/auth/me')
      .then(async (r) => {
        if (r.status === 401) {
          navigate('/login?next=%2Fdashboard', { replace: true });
          return;
        }
        if (!r.ok) throw new Error('Unable to load your dashboard');
        const data = await r.json();
        setOrgs(data.organizations);
        setUser(data.user);
      })
      .catch((e) => setError(e.message))
      .finally(() => setBusy(false));
  }, [navigate]);
  function invite(o: Org) {
    return (
      window.location.origin +
      '/' +
      (o.type === 'community' ? 'c' : 'g') +
      '/' +
      o.slug
    );
  }
  return (
    <main className='details-main'>
      <div className='details-heading'>
        <div>
          <span className='mini-label'>VILA · CREATOR DASHBOARD</span>
          <h1>My communities & groups</h1>
          <p>
            {user
              ? 'Welcome back, ' + user.name + '. Manage what you started.'
              : 'Manage your communities and groups.'}
          </p>
        </div>
        <Link className='dashboard-heading-link' to='/create'>
          Create community or group →
        </Link>
      </div>
      {busy ? (
        <p>Loading your communities…</p>
      ) : error ? (
        <p role='alert' className='form-error'>
          {error}
        </p>
      ) : (
        <>
          <div className='dashboard-toolbar'>
            <strong>{orgs.length} created</strong>
            <Link className='form-primary' to='/create'>
              Create another →
            </Link>
          </div>
          <div className='dashboard-org-grid'>
            {orgs.map((o) => (
              <article className='details-panel' key={o.id}>
                <span className='mini-chip'>{o.type.toUpperCase()}</span>
                <h2>{o.name}</h2>
                <p>{o.description}</p>
                <small>
                  {[o.location?.stateProvince, o.location?.country]
                    .filter(Boolean)
                    .join(', ')}
                </small>
                <Link
                  className='form-primary'
                  to={'/manage/' + o.type + '/' + o.slug}
                >
                  Open details →
                </Link>
                <a
                  className='dashboard-invite'
                  href={invite(o)}
                  target='_blank'
                  rel='noreferrer'
                >
                  Member invitation link ↗
                </a>
              </article>
            ))}
          </div>
          {!orgs.length && (
            <section className='details-panel'>
              <h2>Nothing here yet.</h2>
              <p>Create your first community or group to get started.</p>
              <Link to='/create' className='form-primary'>
                Create now →
              </Link>
            </section>
          )}
        </>
      )}
    </main>
  );
}
