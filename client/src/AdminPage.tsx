import React, { useEffect, useState, type FormEvent } from 'react';
import './WaitlistPages.css';

const API = process.env.REACT_APP_API_URL || '';
type Organization = { type: 'community'|'group'; name: string; slug: string; count: number };
type Overview = { organizations: Organization[]; total: number; direct: number };

export default function AdminPage() {
  const [token, setToken] = useState(() => sessionStorage.getItem('vila_admin_token') || '');
  const [password, setPassword] = useState('');
  const [overview, setOverview] = useState<Overview | null>(null);
  const [type, setType] = useState<'community'|'group'>('community');
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [created, setCreated] = useState<Organization | null>(null);

  async function load(auth: string) {
    const response = await fetch(API + '/api/admin/overview', { headers: { Authorization: 'Bearer ' + auth } });
    if (response.status === 401) { sessionStorage.removeItem('vila_admin_token'); setToken(''); throw new Error('Session expired. Sign in again.'); }
    if (!response.ok) throw new Error('Could not load organizations');
    setOverview(await response.json());
  }
  useEffect(() => { if (token) load(token).catch(err => setMessage(err.message)); }, [token]);
  async function login(event: FormEvent) {
    event.preventDefault();setBusy(true);setMessage('');
    try {
      const response = await fetch(API + '/api/admin/login', {
        method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({password})
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Login failed');
      sessionStorage.setItem('vila_admin_token', data.token); setToken(data.token); setPassword('');
    } catch(err) { setMessage(err instanceof Error ? err.message : 'Login failed'); }
    finally { setBusy(false); }
  }
  async function create(event: FormEvent) {
    event.preventDefault(); setBusy(true);setMessage('');setCreated(null);
    try {
      const response = await fetch(API + '/api/admin/organizations', {
        method:'POST', headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},
        body: JSON.stringify({type,name,slug})
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not create invitation');
      setCreated({ name: data.name, type: data.type, slug: data.slug, count: 0 });
      setMessage('Your ' + type + ' is created. Share its invitation link with members.');
      setName('');setSlug('');
      await load(token);
    } catch(err) { setMessage(err instanceof Error ? err.message : 'Could not create invitation'); }
    finally { setBusy(false); }
  }
  function share(org: Organization) {
    const link = urlFor(org);
    const text = 'Join ' + org.name + ' on the VILA early-access waitlist: ' + link;
    window.open('https://wa.me/?text=' + encodeURIComponent(text), '_blank', 'noopener,noreferrer');
  }
  const urlFor = (org: Organization) => window.location.origin + '/' + (org.type === 'community' ? 'c' : 'g') + '/' + org.slug;
  return <div className="admin-screen">
    <header className="waitlist-header"><a href="/" className="waitlist-logo">vila<span>.</span></a><a className="back-link" href="/">← Visit website</a></header>
    <main className="admin-main">
      {!token ? <section className="admin-login waitlist-form-card"><span className="mini-chip">PRIVATE ADMIN ACCESS</span><h1>Welcome back.</h1><p>Sign in to create a community or group and share its unique member registration link.</p><form onSubmit={login}><label htmlFor="password">ADMIN PASSWORD</label><input id="password" type="password" required autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Enter your admin password"/><button className="form-primary" disabled={busy}>{busy ? 'Signing in…' : 'Sign in →'}</button></form>{message && <p role="alert" className="form-error">{message}</p>}</section> : <>
        <div className="admin-title"><div><span className="mini-label">VILA · ADMIN</span><h1>Community onboarding</h1><p>First create a community or group you have contacted, then copy its invite link and send it to members. Individuals may still sign up separately.</p></div><button className="text-logout" onClick={()=>{sessionStorage.removeItem('vila_admin_token');setToken('');setOverview(null);}}>Sign out</button></div>
        <div className="admin-stats"><div><span>Total signups</span><strong>{overview?.total ?? '—'}</strong></div><div><span>Independent signups</span><strong>{overview?.direct ?? '—'}</strong></div><div><span>Communities & groups</span><strong>{overview?.organizations.length ?? '—'}</strong></div></div>
        <div className="admin-grid"><section className="waitlist-form-card admin-create"><span className="mini-chip">NEW INVITATION</span><h2>Create a {type}</h2><p>{type === 'community' ? 'Register a community and generate its resident signup link.' : 'Register an association, club or group and generate its member invitation link.'}</p><form onSubmit={create}><div className="org-type-buttons" role="group" aria-label="Choose what to create"><button type="button" className={type === 'community' ? 'active' : ''} onClick={()=>{setType('community');setCreated(null);}}>Create community</button><button type="button" className={type === 'group' ? 'active' : ''} onClick={()=>{setType('group');setCreated(null);}}>Create group</button></div><label htmlFor="orgname">NAME</label><input id="orgname" required minLength={2} maxLength={120} value={name} onChange={e=>{setName(e.target.value);setSlug(e.target.value.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,''));}} placeholder={type === "community" ? "e.g. Abuloma" : "e.g. Abuloma Youth Association"}/><label htmlFor="slug">LINK NAME</label><input id="slug" required pattern="[a-z0-9]+(-[a-z0-9]+)*" value={slug} onChange={e=>setSlug(e.target.value.toLowerCase())} placeholder="abuloma-youth-association"/><button className="form-primary" disabled={busy}>{busy ? 'Creating…' : 'Create invitation link →'}</button></form>{message && <p role="status" className="form-note">{message}</p>}{created && <div className="created-link"><strong>Invitation link ready</strong><a href={urlFor(created)} target="_blank" rel="noreferrer">{urlFor(created)}</a><div className="share-actions"><button type="button" onClick={()=>navigator.clipboard.writeText(urlFor(created)).then(()=>setMessage('Invite link copied!')).catch(()=>setMessage('Copy failed. Select the link above.'))}>Copy invite link</button><button type="button" onClick={()=>share(created)}>Share on WhatsApp</button></div></div>}</section>
        <section className="admin-list"><div className="admin-list-head"><h2>Invitation links</h2><span>{overview?.organizations.length || 0} total</span></div>{overview?.organizations.length ? overview.organizations.map(org=><div className="org-row" key={org.type+org.slug}><div className="org-row-top"><div><span className="org-type">{org.type}</span><strong>{org.name}</strong><small>{org.count} signups</small></div><div className="share-actions"><button onClick={()=>navigator.clipboard.writeText(urlFor(org)).then(()=>setMessage('Copied link for '+org.name)).catch(()=>setMessage('Unable to copy. Select the link below.'))}>Copy link</button><button onClick={()=>share(org)}>WhatsApp</button></div></div><a target="_blank" rel="noreferrer" href={urlFor(org)}>{urlFor(org)}</a></div>) : <div className="empty-list">No communities or groups yet. Create your first invitation link.</div>}</section></div>
      </>}
    </main><footer className="waitlist-footer">VILA · Community-first onboarding</footer>
  </div>;
}
