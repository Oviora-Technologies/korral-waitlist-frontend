import React, { useEffect, useState, type FormEvent } from 'react';
import '../../styles/WaitlistPages.css';
import { setToken, getToken, apiAuth } from '../auth/authClient';

const API = process.env.REACT_APP_API_URL || '';
type Created = {
  organizationId: string;
  userId: string;
  type: 'community' | 'group';
  name: string;
  slug: string;
  adminStatus: string;
  sessionToken: string;
};
const slugify = (name: string) =>
  name
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

export default function CreatePage() {
  const [type, setType] = useState<'community' | 'group'>('community');
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [country, setCountry] = useState('');
  const [stateProvince, setStateProvince] = useState('');
  const [address, setAddress] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [consent, setConsent] = useState(false);
  const [created, setCreated] = useState<Created | null>(null);
  const [error, setError] = useState('');
  const [copyMessage, setCopyMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [returning, setReturning] = useState(false);
  const [accountName, setAccountName] = useState('');
  useEffect(() => {
    if (getToken())
      apiAuth('/api/auth/me')
        .then(async (r) => {
          if (r.ok) {
            const data = await r.json();
            setReturning(true);
            setAccountName(data.user.name);
          }
        })
        .catch(() => {});
  }, []);

  const invitationUrl = created
    ? window.location.origin +
      '/' +
      (created.type === 'community' ? 'c' : 'g') +
      '/' +
      created.slug
    : '';
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!returning && password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setError('');
    setBusy(true);
    try {
      const response = await fetch(API + '/api/organizations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(returning ? { Authorization: 'Bearer ' + getToken() } : {}),
        },
        body: JSON.stringify({
          type,
          name,
          slug,
          description,
          location: { country, stateProvince, address },
          ...(!returning
            ? { creator: { fullName, email, phone, password } }
            : {}),
          consent,
        }),
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(
          result.error || 'Could not create your community or group',
        );
      setToken(result.sessionToken);
      setCreated(result);
      window.location.assign('/manage/' + result.type + '/' + result.slug);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setBusy(false);
    }
  }
  async function copy() {
    try {
      await navigator.clipboard.writeText(invitationUrl);
      setCopyMessage('Link copied!');
    } catch {
      setCopyMessage('Please select and copy the invitation link.');
    }
  }
  function share() {
    const message =
      'Join ' + created?.name + ' on the VILA waitlist: ' + invitationUrl;
    window.open(
      'https://wa.me/?text=' + encodeURIComponent(message),
      '_blank',
      'noopener,noreferrer',
    );
  }
  return (
    <div className='waitlist-screen'>
      <main className='waitlist-main'>
        <div className='waitlist-story'>
          <div className='mini-label'>VILA · COMMUNITY FIRST</div>
          <h1>
            Bring your people <em>together.</em>
          </h1>
          <p>
            Create a place for your community or group on the VILA waitlist.
            You'll be registered as an individual and linked as its creator.
          </p>
          <div className='invite-marker'>
            ✦ Create a link. Invite your people. Grow together.
          </div>
          <div className='ambient-orbit' />
        </div>
        <section className='waitlist-form-card'>
          {created ? (
            <div className='created-success'>
              <div className='success-mark'>✓</div>
              <span className='mini-chip'>
                YOUR {created.type.toUpperCase()} IS CREATED
              </span>
              <h2>{created.name}</h2>
              <p>
                You're registered on VILA as an individual. Your user ID is
                linked to this {created.type} as its administrator, pending
                identity verification.
              </p>
              <div className='created-link'>
                <strong>Member invitation link</strong>
                <a href={invitationUrl} target='_blank' rel='noreferrer'>
                  {invitationUrl}
                </a>
              </div>
              <div className='share-actions created-actions'>
                <button type='button' onClick={copy}>
                  Copy invitation
                </button>
                <button type='button' onClick={share}>
                  Share on WhatsApp
                </button>
              </div>
              {copyMessage && (
                <p role='status' className='form-note'>
                  {copyMessage}
                </p>
              )}
              <a
                className='form-primary'
                href={'/manage/' + created.type + '/' + created.slug}
              >
                Open {created.type} details →
              </a>
              <a href='/' className='back-link'>
                ← Return home
              </a>
            </div>
          ) : (
            <>
              <span className='mini-chip'>CREATE YOUR COMMUNITY OR GROUP</span>
              <h2>Start something together.</h2>
              <p>
                Anyone can create a community or group. Create your personal
                login to manage this community or group later.
              </p>
              <form onSubmit={submit}>
                <label>WHAT WOULD YOU LIKE TO CREATE?</label>
                <div
                  className='org-type-buttons'
                  role='group'
                  aria-label='Organization type'
                >
                  <button
                    type='button'
                    className={type === 'community' ? 'active' : ''}
                    onClick={() => setType('community')}
                  >
                    Community
                  </button>
                  <button
                    type='button'
                    className={type === 'group' ? 'active' : ''}
                    onClick={() => setType('group')}
                  >
                    Group / Association
                  </button>
                </div>
                <label htmlFor='org-name'>
                  {type === 'community' ? 'COMMUNITY NAME' : 'GROUP NAME'}
                </label>
                <input
                  id='org-name'
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setSlug(slugify(e.target.value));
                  }}
                  minLength={2}
                  maxLength={120}
                  required
                  placeholder={
                    type === 'community'
                      ? 'e.g. Rose Valley Community'
                      : 'e.g. Bright Study Group'
                  }
                />
                <label htmlFor='org-slug'>INVITATION LINK NAME</label>
                <input
                  id='org-slug'
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase())}
                  required
                  pattern='[a-z0-9]+(-[a-z0-9]+)*'
                  minLength={2}
                  maxLength={80}
                  placeholder={
                    type === 'community'
                      ? 'e.g. rose-valley-community'
                      : 'e.g. bright-study-group'
                  }
                />
                <label htmlFor='description'>DESCRIPTION</label>
                <textarea
                  id='description'
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  minLength={10}
                  maxLength={1500}
                  required
                  rows={4}
                  placeholder={
                    type === 'community'
                      ? 'Tell people about your community and what makes it special'
                      : 'Describe your group, its purpose, and the people it brings together'
                  }
                />
                <div className='location-form-grid'>
                  <div>
                    <label htmlFor='country'>COUNTRY</label>
                    <input
                      id='country'
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      maxLength={100}
                      minLength={2}
                      required
                      placeholder='USA'
                    />
                  </div>
                  <div>
                    <label htmlFor='state'>STATE / PROVINCE</label>
                    <input
                      id='state'
                      value={stateProvince}
                      onChange={(e) => setStateProvince(e.target.value)}
                      maxLength={100}
                      minLength={2}
                      required
                      placeholder='New York'
                    />
                  </div>
                </div>
                <label htmlFor='address'>ADDRESS</label>
                <input
                  id='address'
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  minLength={5}
                  maxLength={250}
                  required
                  placeholder='123 Main Street'
                />
                <div className='form-divider' />
                <div className='mini-label'>
                  {returning ? 'YOUR CREATOR ACCOUNT' : 'YOUR DETAILS'}
                </div>
                <p className='creator-note'>
                  {returning
                    ? 'Signed in as ' +
                      accountName +
                      '. This ' +
                      type +
                      ' will belong to your existing creator account.'
                    : 'We will register you as an individual and associate your user ID with this ' +
                      type +
                      ' as its creator.'}
                </p>
                {!returning && (
                  <>
                    <label htmlFor='full-name'>FULL NAME</label>
                    <input
                      id='full-name'
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      autoComplete='name'
                      minLength={2}
                      maxLength={100}
                      required
                      placeholder='Your full name'
                    />
                    <label htmlFor='email'>EMAIL ADDRESS</label>
                    <input
                      id='email'
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete='email'
                      required
                      type='email'
                      placeholder='you@example.com'
                    />
                    <label htmlFor='phone'>PHONE NUMBER</label>
                    <input
                      id='phone'
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      autoComplete='tel'
                      type='tel'
                      required
                      minLength={7}
                      maxLength={22}
                      placeholder='+1 234 567 8901'
                    />
                    <label htmlFor='password'>CREATE PASSWORD</label>
                    <input
                      id='password'
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      type='password'
                      autoComplete='new-password'
                      minLength={12}
                      maxLength={128}
                      required
                      placeholder='At least 12 characters'
                    />
                    <label htmlFor='confirm-password'>CONFIRM PASSWORD</label>
                    <input
                      id='confirm-password'
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      type='password'
                      autoComplete='new-password'
                      minLength={12}
                      maxLength={128}
                      required
                      placeholder='Re-enter your password'
                    />
                  </>
                )}
                <label className='consent-box'>
                  <input
                    type='checkbox'
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                    required
                  />
                  <span>
                    I agree to receive VILA waitlist and launch updates.
                  </span>
                </label>
                {error && (
                  <p role='alert' className='form-error'>
                    {error}
                  </p>
                )}
                <button type='submit' className='form-primary' disabled={busy}>
                  {busy ? 'Creating…' : 'Create and get invitation link →'}
                </button>
              </form>
              <small>
                {returning ? (
                  <a href='/dashboard'>Back to my communities</a>
                ) : (
                  <span>
                    Already created a community or group?{' '}
                    <a href='/login'>Sign in to your creator dashboard</a>.
                  </span>
                )}
              </small>
            </>
          )}
        </section>
      </main>
    </div>
  );
}
