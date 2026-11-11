# VILA Waitlist

Simple community-first early access platform, built with **React + TypeScript** (feature-based frontend) and **Node.js + Express + TypeScript + MongoDB** (one monolithic backend). The client and server each own their package.json, package-lock.json, and node_modules. There is no root npm workspace.

## Creator registration and login

- **Create:** Go to `/create`. Enter the community/group name, description, country, state/province and address. The creator provides full name, email, phone and a **password (at least 12 characters)**.
- A creator registration is saved in `registrations` as an individual. The password is stored only as a salted **scrypt hash** (`passwordHash`), never in plaintext.
- The created organization stores `adminUserId` referencing the person's `_id`. The individual also receives the organization's ID in `managedOrganizationIds`.
- After creation, the creator receives a signed-in session and is redirected to `/manage/community/:slug` or `/manage/group/:slug`.
- **Sign in:** Visit `/login` with the creator email/password. Successful login takes the creator to `/dashboard`, listing **My communities & groups**. They can open details, see registration counts/member names, copy invitation links and share them via WhatsApp.
- **Create additional organizations:** After signing in, `/create` reuses the existing individual account instead of asking for another password or duplicating the registration.
- **Sign out:** Available from the creator dashboard.
- Independent visitors continue to register at `/join`; invitees use `/c/:slug` or `/g/:slug`.

## Protected creator pages and navigation

The shared header checks the server session using `GET /api/auth/me`. Visitors see **Creator login**, while authenticated creators see **My communities** and **Logout**. Logout calls `POST /api/auth/logout`, clears the local bearer token, and returns to the homepage.

`/dashboard` and `/manage/community/:slug` / `/manage/group/:slug` are protected at the client entry point. Visitors without a valid session are redirected to `/login?next=<requested-page>`. The Express endpoints also enforce ownership on the server; client-side route protection alone does not authorize access to private data.

## Reverse proxy and rate limiting

The React development proxy may send `X-Forwarded-For` headers. Express is configured with `app.set('trust proxy', env.trustedProxies)` so `express-rate-limit` can use the correct client IP.

By default, `TRUSTED_PROXY_IPS=loopback` trusts **only** proxies on `127.0.0.1/8` and `::1`. This is appropriate for local Create React App development. For a production host (Render, nginx, etc.), explicitly configure `TRUSTED_PROXY_IPS` to the **actual known proxy IP/subnet(s)**; if there are no trusted proxies, review whether this setting is needed. Do not set `trust proxy` to `true` or broadly trust every IP: it may let clients spoof their rate-limit identity.

## Shared layout

The homepage's header and footer now live in `client/src/components/SiteLayout.tsx`. They're rendered by `App.tsx` on **all pages**, including signup, login, creator dashboard, organization creation and group/community details.

## Backend access protection

Sessions are random 256-bit bearer tokens, SHA-256 hashed at rest in MongoDB `sessions`, with a **7-day expiration** and an automatic TTL index. API routes check the logged-in creator's user ID against `organizations.adminUserId` before returning members or management details. Invitation links do **not** authorize access to member lists. Login and creation endpoints have rate limits.

This is still an MVP: sessions are stored in browser sessionStorage and require HTTPS in production. Add email verification, password-reset/account recovery, CSRF/XSS hardening, full consent/privacy policy, login abuse monitoring, and MongoDB transactions before a public release. Existing organizations created before password support need an ownership-verification/migration workflow before their creators can sign in; **do not** let visitors claim old records by just providing an email.

## Routes

| Client | Purpose |
| --- | --- |
| `/` | Homepage |
| `/join` | Independent signup |
| `/create` | Community/group creation + creator registration |
| `/login` | Email/password creator login |
| `/dashboard` | Owned communities/groups |
| `/manage/community/:slug` | Community details and members |
| `/manage/group/:slug` | Group details and members |
| `/c/:slug`, `/g/:slug` | Shareable member invitation pages |

### API
- `POST /api/organizations` — create organization and account (or use existing creator session)
- `GET /api/organizations/:type/:slug/details` — creator-only
- `GET /api/organizations/:type/:slug/members` — creator-only
- `POST /api/auth/login` — email/password login
- `GET /api/auth/me` — logged-in creator and organizations
- `POST /api/auth/logout` — invalidate session
- `POST /api/join` — waitlist registration
- `GET /api/organization/:type/:slug` — public invite info
- `GET /api/health` — API health

## Run independently

Terminal one:
```bash
cd server
npm install
cp .env.example .env
npm run dev
```
Configure `server/.env` with `MONGODB_URI`. Nodemon + tsx runs the API on http://localhost:4000.

Terminal two:
```bash
cd client
npm install
npm start
```
React runs at http://localhost:3000 and proxies `/api` to port 4000. Build each app with `npm run build` in its own folder.

**Note:** The changed source files have been committed, but the build still needs to be run locally; this environment does not have npm/GitHub network access.
