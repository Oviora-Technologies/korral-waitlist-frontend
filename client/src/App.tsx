import { useEffect, useState, type FormEvent } from 'react';
import { useParams, useLocation, Routes, Route, Link } from 'react-router-dom';
import { ArrowUpRight, ArrowRight, Users, ShieldCheck, Store, CalendarDays, HeartHandshake, MapPin } from 'lucide-react';

type Org = { name: string; type: 'community'|'group'; slug: string };
function Landing() {
  const { slug } = useParams();
  const path = useLocation().pathname;
  const type = path.startsWith('/c/') ? 'c' : path.startsWith('/g/') ? 'g' : undefined;
  const [org, setOrg] = useState<Org|null>(null);
  const [invalid, setInvalid] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    setInvalid(false);setOrg(null);
    if (!type || !slug) return;
    fetch('/api/organization/'+(type==='c'?'community':'group')+'/'+encodeURIComponent(slug))
      .then(r => { if (!r.ok) throw Error();return r.json(); }).then(setOrg).catch(()=>setInvalid(true));
  }, [type,slug]);
  async function submit(e: FormEvent) {
    e.preventDefault(); if (invalid || (type && !org)) return;
    setLoading(true);setStatus('');
    try {
      const response = await fetch('/api/join',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name,email,...(org?{organizationType:org.type,organizationSlug:org.slug}:{})})});
      const data = await response.json();
      setStatus(response.ok?data.message:(data.error||'Try again'));
      if(response.ok){setName('');setEmail('');}
    } catch {setStatus('Connection problem. Please try again.'); }
    finally {setLoading(false);}
  }
  return <div className="site">
    <header className="nav"><Link className="brand" to="/"><span className="mark">v</span><span>vila<span className="period">.</span></span></Link><div className="nav-right"><span className="launch"><span className="dot"/> Launching soon</span><a href="#join" className="nav-cta">Get early access <ArrowUpRight size={16}/></a></div></header>
    <main>
      <section className="hero"><div className="hero-left"><div className="eyebrow"><span className="eyebrow-line"/> A NEW WAY TO BELONG</div>
      <h1>Better communities.<br/><em>Stronger connections.</em></h1>
      <p className="intro">Your neighborhood has so much to offer. VILA brings the people, places, and possibilities together — all in one place.</p>
      <div className="hero-actions"><a className="primary" href="#join">Join the waitlist <ArrowRight size={19}/></a><a className="secondary" href="#discover">Discover VILA <ArrowUpRight size={17}/></a></div>
      <div className="pilot"><MapPin size={16}/> Starting in Abuloma, Port Harcourt. Growing everywhere.</div></div>
      <div className="hero-art"><div className="sun"/><div className="glass-card card-a"><span className="card-icon">✦</span><span>Good things happen<br/><b>together.</b></span></div><div className="glass-card card-b"><span className="avatars"><i>A</i><i>J</i><i>M</i></span><span>Find your people.</span></div><div className="circle circle-one"/><div className="circle circle-two"/><div className="art-caption">MADE FOR WHERE YOU CALL HOME / 001</div></div></section>
      <section id="discover" className="features"><div className="section-label">WHAT'S POSSIBLE</div><div className="features-head"><h2>Everything local.<br/><em>All together.</em></h2><p>One home for the things that make a community feel like a community.</p></div><div className="feature-grid">
        {[{icon:<Users/>,title:'Your people',desc:'Stay connected to neighbors, communities and groups.'},{icon:<Store/>,title:'Local discoveries',desc:'Find trusted businesses, artisans and services nearby.'},{icon:<ShieldCheck/>,title:'Stay in the know',desc:'Important updates and information that matter locally.'},{icon:<CalendarDays/>,title:'Things happening',desc:'Discover events, get involved and make memories.'},{icon:<HeartHandshake/>,title:'Make a difference',desc:'Support ideas and projects that move your community forward.'}].map((item,i)=><div className="feature" key={i}><div className="feature-icon">{item.icon}</div><div className="feature-index">0{i+1}</div><h3>{item.title}</h3><p>{item.desc}</p></div>)}
      </div></section>
      <section className="join-section" id="join"><div className="join-copy"><div className="section-label light-label">YOU'RE INVITED</div><h2>Be part of<br/>the <em>beginning.</em></h2><p>We're building something special, one community at a time. Save your spot and be among the first to experience VILA.</p><span className="join-detail">No spam. Just good things coming your way.</span></div><div className="join-form"><div className="form-top"><span className="mini-pill">EARLY ACCESS</span><span>01 / 01</span></div><h3>{org?'Join '+org.name:'Your place is here.'}</h3><p>{org?'Register through your '+org.type+' invitation.':'Join independently — no community or group required.'}</p>{invalid?<p className="error">This invitation link is unavailable. <Link to="/">Join directly instead.</Link></p>:<form onSubmit={submit}><label htmlFor="name">YOUR NAME</label><input id="name" required minLength={2} maxLength={100} placeholder="Full name" value={name} onChange={e=>setName(e.target.value)}/><label htmlFor="email">EMAIL ADDRESS</label><input id="email" type="email" required placeholder="you@example.com" value={email} onChange={e=>setEmail(e.target.value)}/><button disabled={loading||Boolean(type&&!org)}>{loading?'Joining...':'Get on the list'} <ArrowRight size={18}/></button></form>}{status&&<p className="feedback" role="status">{status}</p>}<small>By joining, you agree to receive VILA launch updates.</small></div></section>
    </main><footer><Link className="brand footer-brand" to="/"><span className="mark">v</span>vila<span className="period">.</span></Link><span>Building belonging, everywhere.</span><span>© {new Date().getFullYear()} VILA</span></footer>
  </div>;
}
export default function App(){return <Routes><Route path="/" element={<Landing/>}/><Route path="/c/:slug" element={<Landing/>}/><Route path="/g/:slug" element={<Landing typePlaceholder/> as any}/></Routes>}
