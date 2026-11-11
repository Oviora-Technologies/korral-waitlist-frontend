import React, { useState } from 'react';
import '../features/home/HomePage.css';

export function Header() {
  const [open,setOpen]=useState(false);
  return <header className="topbar page-container">
    <a className="wordmark" href="/" aria-label="VILA home"><span className="brand-symbol">v<span className="brand-dot">.</span></span><span>vila<span className="accent">.</span></span></a>
    <nav className={open?'toplinks open':'toplinks'} aria-label="Main navigation">
      <a href="/#why-vila">Why VILA</a>
      <a href="/#how-it-works">How it works</a>
      <a href="/create">Create a community or group</a>
      <a href="/dashboard">My communities</a>
      <a href="/login">Creator login</a>
      <a className="top-join" href="/join">Get early access ↗</a>
    </nav>
    <button className="mobile-menu" type="button" onClick={()=>setOpen(!open)} aria-label={open?'Close menu':'Open menu'} aria-expanded={open}>{open?'✕':'☰'}</button>
  </header>;
}
export function Footer(){
  return <footer className="footer page-container"><a className="wordmark" href="/"><span className="brand-symbol">v<span className="brand-dot">.</span></span><span>vila<span className="accent">.</span></span></a><p>Made for the places we call home.</p><span>© {new Date().getFullYear()} VILA. All rights reserved.</span></footer>;
}
