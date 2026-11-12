import { Link } from 'react-router-dom';
import React, { useState } from 'react';
import '../features/home/HomePage.css';

type HeaderProps = {
  authenticated: boolean;
  authChecking: boolean;
  loggingOut: boolean;
  onLogout: () => void;
};

export function Header({ authenticated, authChecking, loggingOut, onLogout }: HeaderProps) {
  const [open, setOpen] = useState(false);
  return <header className="topbar page-container">
    <Link className="wordmark" to="/" aria-label="VILA home"><img className="brand-image" src="/vila-logo.png" alt="" /><span>vila<span className="accent">.</span></span></Link>
    <nav className={open ? 'toplinks open' : 'toplinks'} aria-label="Main navigation">
      <Link to="/#why-vila">Why VILA</Link>
      <Link to="/#how-it-works">How it works</Link>
      <Link to="/create">Create a community or group</Link>
      {authenticated && <Link to="/dashboard">My communities</Link>}
      {!authChecking && (authenticated
        ? <button type="button" className="header-logout" onClick={onLogout} disabled={loggingOut}>{loggingOut ? 'Logging out…' : 'Logout'}</button>
        : <Link to="/login">Creator login</Link>)}
      <Link className="top-join" to="/join">Get early access ↗</Link>
    </nav>
    <button className="mobile-menu" type="button" onClick={() => setOpen(!open)} aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open}>{open ? '✕' : '☰'}</button>
  </header>;
}

export function Footer() {
  return <footer className="footer page-container">
    <Link className="wordmark" to="/"><img className="brand-image" src="/vila-logo.png" alt="" /><span>vila<span className="accent">.</span></span></Link>
    <p>Made for the places we call home.</p>
    <span>© {new Date().getFullYear()} VILA. All rights reserved.</span>
  </footer>;
}
