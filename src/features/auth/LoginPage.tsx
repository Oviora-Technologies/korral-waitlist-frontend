import PasswordInput from '../../components/PasswordInput';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import React, { useState, type FormEvent } from 'react';
import { API, setToken } from './authClient';
import '../../styles/WaitlistPages.css';

export default function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const response = await fetch(API + '/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to sign in');
      setToken(data.token);
      const target = searchParams.get('next');
      navigate(
        target &&
          target.startsWith('/') &&
          !target.startsWith('//') &&
          !target.includes('\\')
          ? target
          : '/dashboard',
        { replace: true },
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to log in');
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className='waitlist-main'>
      <section className='waitlist-story'>
        <div className='mini-label'>korral · WELCOME BACK</div>
        <h1>
          Your people, <em>one place.</em>
        </h1>
        <p>
          Sign in to view the communities and groups you created, share
          invitations, and follow new registrations.
        </p>
        <div className='invite-marker'>✦ Your community starts with you.</div>
      </section>
      <section className='waitlist-form-card'>
        <span className='mini-chip'>CREATOR LOGIN</span>
        <h2>Welcome back.</h2>
        <p>
          Use the email and password you registered with when creating your
          community or group.
        </p>
        <form onSubmit={submit}>
          <label htmlFor='login-email'>EMAIL ADDRESS</label>
          <input
            id='login-email'
            type='email'
            autoComplete='email'
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder='you@example.com'
          />
          <label htmlFor='login-password'>PASSWORD</label>
          <PasswordInput
            id='login-password'
            autoComplete='current-password'
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder='Your password'
          />
          {error && (
            <div className='form-error' role='alert'>
              {error}
            </div>
          )}
          <button className='form-primary' type='submit' disabled={busy}>
            {busy ? 'Signing in…' : 'Sign in →'}
          </button>
        </form>
        <p className='form-note'>
          <Link to='/create'>New here? Create a community or group.</Link>
        </p>
      </section>
    </main>
  );
}
