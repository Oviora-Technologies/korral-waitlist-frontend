# VILA Waitlist

Community-first early access for VILA, built with a simple React/TypeScript feature-based frontend and Node.js/Express/TypeScript + MongoDB monolith.

## What happens

1. At `/create`, anybody can create a **community** or **group**, providing its **name, description, country, state/province and address**.
2. The creator provides **full name, email, and phone number**, and consents to VILA launch emails.
3. VILA inserts the creator as an individual in `registrations`, and creates an organization in `organizations`. The organization's `adminUserId` references the creator's `_id`, and the creator's `managedOrganizationIds` includes the organization's `_id`.
4. On success, the creator is redirected to **`/manage/community/:slug`** or **`/manage/group/:slug`**.
5. The details page shows the organization's description and location, a count of registered members, a list of member names and join dates, and buttons to copy the invite link or share it via WhatsApp.
6. Invitees register through `/c/:slug` or `/g/:slug` and are attributed to that organization. Independent users can sign up at `/join`.

## Management access (pilot)

Creation returns a random, one-time **management token**, and the client stores it in **sessionStorage** scoped to the organization. The management API requires this token for both organization details and member names; simply knowing a public invitation URL **does not** reveal members. The token is stored in MongoDB only as a SHA-256 hash.

**Limitations:** This is *temporary bearer-token access*, not authenticated, verified ownership. The creator loses dashboard access when the browser session closes; no account login or token recovery exists yet. Anyone can currently claim an unverified email address when creating an organization. Before a real launch, add email/phone verification, account sign-in, role authorization, recovery, and comprehensive privacy policies. Old communities/groups created before the management-token update cannot use the new page without a migration or re-creation. Members are limited to the 100 most recent invited registrations plus the creator, while counts show all registrations. Email addresses and phone numbers are not disclosed in the member list.

## Repo structure

```text
vila-waitlist/
├── client/
│   ├── package.json
│   └── src/
│       ├── App.tsx
│       ├── features/
│       │   ├── home/HomePage.tsx
│       │   ├── waitlist/JoinPage.tsx
│       │   └── community/
│       │       ├── CreatePage.tsx
│       │       └── CommunityDetailsPage.tsx
│       └── styles/WaitlistPages.css
└── server/
    ├── package.json
    └── src/
        ├── index.ts
        ├── app.ts
        ├── config/database.ts
        ├── services/
        │   ├── waitlistService.ts
        │   └── organizationService.ts
        └── routes/
            ├── waitlistRoutes.ts
            └── organizationRoutes.ts
```

The client and server have **separate** `package.json`, lockfiles, and `node_modules`; there is no root npm workspace.

## Run locally

Terminal one (backend):

```bash
cd server
npm install
cp .env.example .env
npm run dev
```

Configure a running local MongoDB or your Atlas `MONGODB_URI`. Nodemon restarts the Express API on port 4000.

Terminal two (frontend):

```bash
cd client
npm install
npm start
```

The Create React App client runs on port 3000, proxying `/api` to port 4000.

Build each project independently with `npm run build` from its own folder.

## API

- `GET /api/health`
- `POST /api/join`
- `GET /api/organization/:type/:slug` — public invite details only (no members)
- `POST /api/organizations` — create individual and organization, issue one-time management token
- `GET /api/organizations/:type/:slug/details` — creator-only, requires `x-management-token`
- `GET /api/organizations/:type/:slug/members` — creator-only, requires `x-management-token`

Before production, also add MongoDB transactions for atomic writes, rate limiting and CAPTCHA, email verification, data retention, and privacy disclosures. The existing compensating deletes provide best-effort cleanup but aren't a substitute for a transaction.
