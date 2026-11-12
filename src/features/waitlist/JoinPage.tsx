import { Link, useParams } from 'react-router-dom';
import React, { useEffect, useState, type FormEvent } from 'react';
import '../../styles/WaitlistPages.css';

const API = process.env.REACT_APP_API_URL || '';
type Organization = { name: string; type: 'community' | 'group'; slug: string };

export default function JoinPage({ invitationType }: { invitationType?: 'community' | 'group' }) {
  const { slug } = useParams();
  const invitation = invitationType && slug ? { type: invitationType, slug } : null;
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [error, setError] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  useEffect(() => {
    if (!invitation) return;
    let current = true;
    fetch(API + '/api/organization/' + invitation.type + '/' + invitation.slug)
      .then(async (res) => {
        if (!res.ok) throw new Error('This invitation link is unavailable.');
        return await res.json();
      })
      .then((org) => {
        if (current) setOrganization(org);
      })
      .catch((err) => {
        if (current) setError(err.message);
      });
    return () => {
      current = false;
    };
    // App keys this page by pathname, resetting form state for each invitation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function register(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!consent || (invitation && !organization)) return;
    setBusy(true);
    setError('');
    try {
      const response = await fetch(API + '/api/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          consent,
          ...(organization
            ? {
                organizationType: organization.type,
                organizationSlug: organization.slug,
              }
            : {}),
        }),
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.error || 'Could not join the waitlist');
      setEmailSent(result.emailSent === true);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className='waitlist-screen'>
      <main className='waitlist-main'>
        <div className='waitlist-story'>
          <div className='mini-label'>VILA · EARLY ACCESS</div>
          <h1>
            Something good starts <em>here.</em>
          </h1>
          <p>
            Get first access to the place for neighbors, local discoveries,
            community news and meaningful connections.
          </p>
          <div className='invite-marker'>
            {organization
              ? '✦ You were invited by ' + organization.name
              : '✦ Everyone has a place here.'}
          </div>
          <div className='ambient-orbit' />
        </div>
        <div className='waitlist-form-card'>
          {success ? (
            <div className='joined-state'>
              <div className='success-mark'>✓</div>
              <h2>You're on the list!</h2>
              <p>
                Thanks for being part of VILA's beginning. We'll share updates
                as launch approaches.
              </p>
              <p role='status'>{emailSent ? 'A confirmation email has been submitted for delivery to your inbox.' : 'Your registration was saved, but a confirmation email could not be sent right now.'}</p>
              <Link to='/' className='form-primary'>
                Back to VILA →
              </Link>
            </div>
          ) : (
            <>
              <span className='mini-chip'>
                {organization
                  ? organization.type.toUpperCase() + ' INVITATION'
                  : 'JOIN THE WAITLIST'}
              </span>
              <h2>
                {organization
                  ? 'Welcome, ' + organization.name
                  : 'Your place is waiting.'}
              </h2>
              <p>
                {organization
                  ? 'Your invitation is linked to ' + organization.name + '.'
                  : 'You can register without choosing a community or group.'}
              </p>
              {invitation && !organization && !error && (
                <p role='status' className='form-note'>
                  Checking invitation…
                </p>
              )}
              {error && (
                <div role='alert' className='form-error'>
                  {error} {invitation && <Link to='/join'>Join independently</Link>}
                </div>
              )}
              {!Boolean(invitation && error) && (
                <form onSubmit={register}>
                  <label htmlFor='full-name'>FULL NAME</label>
                  <input
                    id='full-name'
                    required
                    minLength={2}
                    maxLength={100}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder='Enter your full name'
                    autoComplete='name'
                  />
                  <label htmlFor='email'>EMAIL ADDRESS</label>
                  <input
                    id='email'
                    type='email'
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder='you@example.com'
                    autoComplete='email'
                  />
                  <label className='consent-box'>
                    <input
                      type='checkbox'
                      required
                      checked={consent}
                      onChange={(e) => setConsent(e.target.checked)}
                    />{' '}
                    <span>
                      I agree to receive VILA waitlist and launch updates via
                      email.
                    </span>
                  </label>
                  <button
                    type='submit'
                    disabled={busy || Boolean(invitation && !organization)}
                    className='form-primary'
                  >
                    {busy ? 'Registering…' : 'Join the waitlist →'}
                  </button>
                </form>
              )}
              <small>
                Registering via a link doesn't automatically verify community or
                group membership.
              </small>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
