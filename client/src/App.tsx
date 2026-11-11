import React, { useEffect, useState, type FormEvent } from 'react';
import './App.css';

type Organization = { name: string; type: 'community' | 'group'; slug: string };
const API = process.env.REACT_APP_API_URL || '';

function Icon({ name, size = 20 }: { name: string; size?: number }) {
  const shared = { width: size, height: size, fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  const shapes: Record<string, React.ReactNode> = {
    arrow: <><path d="M5 12h14m-6-6 6 6-6 6"/></>,
    up: <><path d="M7 17 17 7M7 7h10v10"/></>,
    globe: <><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18"/></>,
    pin: <><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></>,
    people: <><circle cx="9" cy="8" r="3"/><path d="M3 20v-2a6 6 0 0 1 12 0v2M17 5a3 3 0 0 1 0 6m1 9v-2a6 6 0 0 0-2-4.5"/></>,
    shop: <><path d="M3 10h18l-2-6H5l-2 6Zm2 0v10h14V10M9 20v-6h6v6"/></>,
    shield: <><path d="m12 2 8 4v6c0 5-3.5 8-8 10-4.5-2-8-5-8-10V6l8-4Z"/><path d="m9 12 2 2 4-4"/></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 2v6M17 2v6M3 10h18"/></>,
    heart: <><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/></>,
    check: <><path d="m5 12 4 4L19 6"/></>,
    menu: <><path d="M4 7h16M4 12h16M4 17h16"/></>,
    close: <><path d="M5 5l14 14M19 5 5 19"/></>
  };
  return <svg viewBox="0 0 24 24" aria-hidden="true" {...shared}>{shapes[name]}</svg>;
}
const features = [
  { icon: 'people', title: 'Find your people', text: 'Stay close to the neighbors, communities, and groups that matter.' },
  { icon: 'shop', title: 'Discover local', text: 'Find the businesses, talents, and services right around the corner.' },
  { icon: 'shield', title: 'Stay in the know', text: 'Updates, announcements, and a stronger sense of local safety.' },
  { icon: 'calendar', title: 'Make things happen', text: 'Show up for events, ideas, and projects that bring us together.' }
];
function App() {
  const path = window.location.pathname;
  const match = path.match(/^\/(c|g)\/([a-z0-9-]+)\/?$/);
  const invite = match ? { type: match[1] === 'c' ? 'community' as const : 'group' as const, slug: match[2] } : null;
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [inviteError, setInviteError] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ text: string; success: boolean } | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => {
    if (!invite) return;
    let active = true;
    fetch(API + '/api/organization/' + invite.type + '/' + invite.slug)
      .then(async r => { if (!r.ok) throw new Error('Invalid invitation'); return await r.json(); })
      .then(data => { if (active) setOrganization(data); })
      .catch(() => { if (active) setInviteError(true); });
    return () => { active = false; };
  }, [path]); // eslint-disable-line react-hooks/exhaustive-deps
  async function join(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!consent || (invite && !organization)) return;
    setSubmitting(true); setMessage(null);
    try {
      const response = await fetch(API + '/api/join', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, ...(organization ? { organizationType: organization.type, organizationSlug: organization.slug } : {}) })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Something went wrong.');
      setMessage({ text: 'You’re on the list! Keep an eye on your inbox for launch news.', success: true });
      setName(''); setEmail(''); setConsent(false);
    } catch (error) {
      setMessage({ text: error instanceof Error ? error.message : 'Please try again.', success: false });
    } finally { setSubmitting(false); }
  }
  return <div className="vila-page">
    <header className="topbar page-container">
      <a className="wordmark" href="/" aria-label="VILA home"><span className="brand-symbol">v<span className="brand-dot">.</span></span><span>vila<span className="accent">.</span></span></a>
      <nav className={menuOpen ? 'toplinks open' : 'toplinks'} aria-label="Main navigation">
        <a href="#why-vila" onClick={() => setMenuOpen(false)}>Why VILA</a>
        <a href="#how-it-works" onClick={() => setMenuOpen(false)}>How it works</a>
        <a className="top-join" href="#join" onClick={() => setMenuOpen(false)}>Get early access <Icon name="up" size={16}/></a>
      </nav>
      <button className="mobile-menu" type="button" aria-label={menuOpen ? 'Close menu' : 'Open menu'} onClick={() => setMenuOpen(!menuOpen)}><Icon name={menuOpen ? 'close' : 'menu'}/></button>
    </header>
    <main>
      <section className="hero page-container">
        <div className="hero-content">
          <div className="eyebrow"><span className="live-dot"/> THE FUTURE OF NEIGHBORHOODS</div>
          <h1>A little closer.<br/><span>A lot more</span><br/><em>connected.</em></h1>
          <p className="hero-description">The best things happen when we come together. Meet VILA — a new home for everything that makes your community yours.</p>
          <div className="hero-actions"><a className="button button-blue" href="#join">Join the waitlist <Icon name="arrow"/></a><a className="text-link" href="#why-vila">Explore VILA <Icon name="up" size={17}/></a></div>
          <div className="launch-location"><Icon name="pin" size={17}/> Beginning in Abuloma, Port Harcourt, Nigeria</div>
        </div>
        <div className="hero-visual" aria-label="Illustration of a connected community">
          <div className="visual-grain"/><div className="visual-orbit orbit-outer"/><div className="visual-orbit orbit-inner"/>
          <div className="visual-sun"/><div className="visual-buildings"><span/><span/><span/><span/><span/></div>
          <div className="floating-card card-one"><span className="floating-icon"><Icon name="heart" size={20}/></span><span><strong>Good things happen</strong><small>when we’re together.</small></span></div>
          <div className="floating-card card-two"><span className="avatar-stack"><b>A</b><b>C</b><b>T</b></span><span><strong>Your people.</strong><small>Right where you are.</small></span></div>
          <div className="visual-footer">ROOTED IN COMMUNITY. BUILT FOR EVERYWHERE.</div>
        </div>
      </section>
      <div className="marquee-band" aria-label="VILA values"><div className="marquee-inner"><span>DISCOVER</span><i>✳</i><span>CONNECT</span><i>✳</i><span>BELONG</span><i>✳</i><span>GROW</span><i>✳</i><span>TOGETHER</span><i>✳</i><span>DISCOVER</span><i>✳</i><span>CONNECT</span></div></div>
      <section id="why-vila" className="features-section"><div className="page-container"><div className="section-heading"><div><div className="label"><span className="short-line"/> MADE FOR REAL LIFE</div><h2>More than a place.<br/><em>A sense of belonging.</em></h2></div><p>From the little everyday things to the moments that make a difference, VILA brings your community together.</p></div><div className="feature-grid">{features.map((item, i) => <article className="feature-card" key={item.title}><div className="feature-top"><div className="feature-icon"><Icon name={item.icon} size={25}/></div><span className="feature-number">0{i+1}</span></div><h3>{item.title}</h3><p>{item.text}</p><span className="feature-arrow"><Icon name="up" size={18}/></span></article>)}</div></div></section>
      <section id="how-it-works" className="steps-section"><div className="page-container steps-layout"><div><div className="label"><span className="short-line"/> SIMPLE BY DESIGN</div><h2>It's your community.<br/><em>Come on in.</em></h2><p>Whether you're joining with your neighborhood, an organization, or just yourself — there's a place for you here.</p></div><div className="steps"><div className="step"><b>01</b><span><strong>Find your invitation</strong><small>Join through a community or group link, or come directly.</small></span></div><div className="step"><b>02</b><span><strong>Save your spot</strong><small>A quick signup is all it takes. No group required.</small></span></div><div className="step"><b>03</b><span><strong>Be first to know</strong><small>We'll share the good news when VILA is ready.</small></span></div></div></div></section>
      <section id="join" className="signup-section"><div className="page-container signup-layout"><div className="signup-intro"><div className="label signup-label"><span className="short-line"/> YOUR INVITATION STARTS HERE</div><h2>Be part of<br/>something <em>good.</em></h2><p>Great communities don't just happen. They're made together. Join us from the very beginning.</p><div className="signup-footnote"><span className="tiny-star">✳</span> One community at a time. Everywhere in mind.</div></div><div className="signup-panel"><div className="panel-heading"><span className="pill">EARLY ACCESS</span><span className="panel-count">VILA / 001</span></div><h3>{organization ? 'Join ' + organization.name : 'Your spot is waiting.'}</h3><p className="panel-description">{organization ? 'You’re joining through your ' + organization.type + ' invitation.' : 'No community or group? No problem. Everyone is welcome.'}</p>{inviteError ? <p className="form-alert error">This invitation is unavailable. <a href="/">Join independently instead.</a></p> : <form onSubmit={join}><label htmlFor="full-name">FULL NAME</label><input id="full-name" autoComplete="name" placeholder="Your full name" minLength={2} maxLength={100} required value={name} onChange={e => setName(e.target.value)}/><label htmlFor="email">EMAIL ADDRESS</label><input id="email" type="email" autoComplete="email" placeholder="you@example.com" required value={email} onChange={e => setEmail(e.target.value)}/><label className="consent"><input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} required/><span>I agree to receive VILA waitlist and launch emails.</span></label><button className="button button-blue submit-button" disabled={submitting || Boolean(invite && !organization)} type="submit">{submitting ? 'Saving your spot…' : 'Save my spot'} <Icon name="arrow"/></button></form>}{message && <div role="status" className={'form-alert ' + (message.success ? 'success' : 'error')}>{message.success && <Icon name="check" size={18}/>} {message.text}</div>}<p className="small-print">Just relevant launch updates. No spam.</p></div></div></section>
    </main>
    <footer className="footer page-container"><a className="wordmark" href="/"><span className="brand-symbol">v<span className="brand-dot">.</span></span><span>vila<span className="accent">.</span></span></a><p>Made for the places we call home.</p><span>© {new Date().getFullYear()} VILA. All rights reserved.</span></footer>
  </div>;
}
export default App;
