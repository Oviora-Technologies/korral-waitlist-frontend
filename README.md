# VILA Waitlist

Community-first early access with a simple React frontend and monolithic Node.js/Express + TypeScript + MongoDB backend.

## Registration flows

- **Individual:** `/join` registers a person without requiring any community or group.
- **Create community/group:** `/create` is public. Choose a type, enter its name and invitation slug, then enter the creator's **full name, email address, and phone number**.
- **Creator relationship:** A successful request creates an individual record in `registrations` with its own MongoDB `_id`, then creates the organization in `organizations` with `adminUserId` referencing that individual. The user's `managedOrganizationIds` also includes the created organization.
- **Invitation:** The resulting public URL `/c/:slug` or `/g/:slug` can be copied or shared via WhatsApp. Members joining through that link are attributed to the organization.
- No global VILA administrator account or password is required for creation.

Example organization document:
```js
{
  _id: ObjectId("..."),
  type: "group",
  name: "Abuloma Youth Association",
  slug: "abuloma-youth-association",
  adminUserId: ObjectId("..."), // creator's registrations._id
  createdBy: ObjectId("..."),
  adminStatus: "pending_verification"
}
```

**Important current limitation:** Creator email addresses are **not yet verified**. The creator is recorded as the organization's intended administrator, but actual authenticated management rights must wait for verification and sign-in. For now, creating another group with an email already on the waitlist returns a duplicate-email error. Add a verified returning-user flow before public launch. For standalone local MongoDB, the service uses compensating deletes on partial failures; production should use a MongoDB transaction on a replica set.

## Structure

```text
vila-waitlist/
├── client/
│   ├── package.json
│   └── src/
│       ├── App.tsx
│       ├── features/
│       │   ├── home/HomePage.tsx
│       │   ├── waitlist/JoinPage.tsx
│       │   └── community/CreatePage.tsx
│       └── styles/WaitlistPages.css
└── server/
    ├── package.json
    └── src/
        ├── index.ts
        ├── app.ts
        ├── config/
        ├── services/
        │   ├── waitlistService.ts
        │   └── organizationService.ts
        └── routes/
            ├── waitlistRoutes.ts
            └── organizationRoutes.ts
```

The `client` and `server` have separate `package.json`, `package-lock.json` and `node_modules`. There is **no root npm workspace**. The server keeps its nodemon development script.

## Run locally

Terminal one:
```bash
cd server
npm install
cp .env.example .env
npm run dev
```

Terminal two:
```bash
cd client
npm install
npm start
```

Configure local MongoDB or set `MONGODB_URI` for MongoDB Atlas. The client runs at http://localhost:3000 and proxies API calls to http://localhost:4000.

## API

- `GET /api/health`
- `POST /api/join` — individual or invitation-based registration
- `GET /api/organization/:type/:slug` — invitation details
- `POST /api/organizations` — create individual + organization with linked administrator ID

## Before launch

Implement email/phone verification, authenticated owner login, server-side consent records with policy version, anti-bot checks, proper privacy policy, data retention and HTTPS. Joining by link is not proof of residency or membership.
