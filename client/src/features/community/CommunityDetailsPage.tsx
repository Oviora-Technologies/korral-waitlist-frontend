import React, { useEffect, useMemo, useState } from 'react';
import '../../styles/WaitlistPages.css';
import { apiAuth, getToken } from '../auth/authClient';

const API = process.env.REACT_APP_API_URL || '';
type Details = {
  id: string;
  name: string;
  type: 'community' | 'group';
  slug: string;
  description: string;
  location: { country: string; stateProvince: string; address: string } | null;
  creator: { id: string; name: string } | null;
  memberCount: number;
  joinedMemberCount: number;
  adminStatus: string;
};
type Member = {
  id: string;
  name: string;
  role: 'admin' | 'member';
  joinedAt: string;
};

export default function CommunityDetailsPage() {
  const parts = window.location.pathname.match(
    /^\/manage\/(community|group)\/([a-z0-9-]+)\/?$/,
  );
  const type = parts?.[1] || '';
  const slug = parts?.[2] || '';
  const [details, setDetails] = useState<Details | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [message, setMessage] = useState('');

  const inviteUrl =
    window.location.origin +
    '/' +
    (type === 'community' ? 'c' : 'g') +
    '/' +
    slug;
  useEffect(() => {
    let active = true;
    const token = getToken();
    if (!token) {
      setError('Sign in to view your community or group.');
      setLoading(false);
      return;
    }
    Promise.all([
      apiAuth('/api/organizations/' + type + '/' + slug + '/details'),
      apiAuth('/api/organizations/' + type + '/' + slug + '/members'),
    ])
      .then(async ([orgResponse, membersResponse]) => {
        if (!orgResponse.ok || !membersResponse.ok)
          throw new Error(
            'Unable to access member information. Please sign in again if your session has expired.',
          );
        return Promise.all([orgResponse.json(), membersResponse.json()]);
      })
      .then(([org, records]) => {
        if (active) {
          setDetails(org);
          setMembers(records.members);
        }
      })
      .catch((e) => {
        if (active)
          setError(e instanceof Error ? e.message : 'Unable to load details');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [type, slug]);

  const filtered = useMemo(
    () =>
      members.filter((m) =>
        m.name.toLowerCase().includes(search.trim().toLowerCase()),
      ),
    [members, search],
  );
  async function copyLink() {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setMessage('Invitation link copied.');
    } catch {
      setMessage('Please select and copy the link shown below.');
    }
  }
  function shareWhatsApp() {
    window.open(
      'https://wa.me/?text=' +
        encodeURIComponent(
          'Join ' + details?.name + ' on the VILA waitlist: ' + inviteUrl,
        ),
      '_blank',
      'noopener,noreferrer',
    );
  }
  return (
    <div className='waitlist-screen'>
      <main className='details-main'>
        {loading ? (
          <div className='details-empty'>Loading your {type}…</div>
        ) : error ? (
          <section className='waitlist-form-card details-empty'>
            <span className='mini-chip'>PRIVATE MANAGEMENT</span>
            <h2>Access unavailable</h2>
            <p>{error}</p>
            <a
              className='form-primary'
              href={
                '/login?next=' + encodeURIComponent(window.location.pathname)
              }
            >
              Sign in as creator →
            </a>
          </section>
        ) : (
          details && (
            <>
              <div className='details-heading'>
                <div>
                  <span className='mini-label'>
                    VILA / {details.type.toUpperCase()} DETAILS
                  </span>
                  <h1>{details.name}</h1>
                  <p>Manage your invitation and see who has registered.</p>
                </div>
                <span className='manager-label'>Creator dashboard</span>
              </div>
              <div className='details-metrics'>
                <article>
                  <span>Registered people</span>
                  <strong>{details.memberCount}</strong>
                  <small>Includes the creator</small>
                </article>
                <article>
                  <span>Joined by invitation</span>
                  <strong>{details.joinedMemberCount}</strong>
                  <small>People registered through your link</small>
                </article>
                <article>
                  <span>Your role</span>
                  <strong className='metric-role'>Administrator</strong>
                  <small>Verification pending</small>
                </article>
              </div>
              <div className='details-layout'>
                <div className='details-main-column'>
                  <section className='details-panel'>
                    <div className='details-section-header'>
                      <h2>
                        About{' '}
                        {details.type === 'community'
                          ? 'this community'
                          : 'this group'}
                      </h2>
                      <span>OVERVIEW</span>
                    </div>
                    <p className='details-description'>
                      {details.description || 'No description has been added.'}
                    </p>
                    <div className='details-location'>
                      <div>
                        <span>COUNTRY</span>
                        <strong>
                          {details.location?.country || 'Not provided'}
                        </strong>
                      </div>
                      <div>
                        <span>STATE / PROVINCE</span>
                        <strong>
                          {details.location?.stateProvince || 'Not provided'}
                        </strong>
                      </div>
                      <div>
                        <span>ADDRESS</span>
                        <strong>
                          {details.location?.address || 'Not provided'}
                        </strong>
                      </div>
                    </div>
                  </section>
                  <section className='details-panel'>
                    <div className='details-section-header'>
                      <div>
                        <h2>Registered members</h2>
                        <p>
                          Creator and people who joined using this invitation.
                        </p>
                      </div>
                      <span>{details.memberCount} TOTAL</span>
                    </div>
                    <input
                      className='members-search'
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder='Search members by name'
                      aria-label='Search members'
                    />
                    <div className='members-list'>
                      {filtered.length ? (
                        filtered.map((member) => (
                          <div className='member-entry' key={member.id}>
                            <div className='member-avatar'>
                              {member.name.charAt(0).toUpperCase()}
                            </div>
                            <div className='member-data'>
                              <strong>{member.name}</strong>
                              <small>
                                Joined{' '}
                                {new Date(member.joinedAt).toLocaleDateString()}
                              </small>
                            </div>
                            <span
                              className={
                                'member-role ' +
                                (member.role === 'admin' ? 'role-admin' : '')
                              }
                            >
                              {member.role === 'admin'
                                ? 'Creator / Admin'
                                : 'Member'}
                            </span>
                          </div>
                        ))
                      ) : (
                        <p className='empty-members'>
                          No matching members yet. Invite people to get started.
                        </p>
                      )}
                    </div>
                    {details.joinedMemberCount >= 100 && (
                      <p className='members-note'>
                        Showing the latest 100 invited members. Total
                        registrations are shown above.
                      </p>
                    )}
                  </section>
                </div>
                <aside className='details-side-column'>
                  <section className='details-panel invite-panel'>
                    <span className='mini-chip'>SHARE INVITATION</span>
                    <h2>Bring your people in.</h2>
                    <p>
                      Share your {details.type}'s unique registration link with
                      neighbors, friends and members.
                    </p>
                    <div className='invite-url'>{inviteUrl}</div>
                    <button
                      type='button'
                      className='form-primary'
                      onClick={copyLink}
                    >
                      Copy invitation link →
                    </button>
                    <button
                      type='button'
                      className='whatsapp-action'
                      onClick={shareWhatsApp}
                    >
                      Share on WhatsApp
                    </button>
                    {message && (
                      <p role='status' className='form-note'>
                        {message}
                      </p>
                    )}
                  </section>
                  <div className='privacy-hint'>
                    Member names are shown only to your authenticated creator
                    account. The invitation link itself does not reveal your
                    member list.
                  </div>
                </aside>
              </div>
            </>
          )
        )}
      </main>
    </div>
  );
}
