# VILA Waitlist

A community-first waitlist website for VILA, built with **React + TypeScript (Create React App)** and a **simple Node.js + Express + TypeScript monolith**, using MongoDB.

## Architecture

The frontend and backend are **independent npm projects**. There is no root `package.json`, workspace, or shared `node_modules`.

```text
vila-waitlist/
├── client/
│   ├── package.json
│   ├── public/
│   └── src/
│       ├── App.tsx                     # Simple page selection
│       ├── index.tsx                   # React entry
│       ├── features/
│       │   ├── home/
│       │   │   ├── HomePage.tsx
│       │   │   └── HomePage.css
│       │   ├── waitlist/
│       │   │   └── JoinPage.tsx
│       │   └── admin/
│       │       └── AdminPage.tsx
│       └── styles/
│           └── WaitlistPages.css
└── server/
    ├── package.json
    └── src/
        ├── index.ts                    # Start the server
        ├── app.ts                      # Express configuration and routes
        ├── config/
        │   ├── database.ts             # MongoDB connection
        │   └── env.ts
        ├── middleware/
        │   └── adminAuth.ts            # Authentication and password check
        ├── routes/
        │   ├── waitlistRoutes.ts
        │   └── adminRoutes.ts
        ├── services/
        │   ├── waitlistService.ts
        │   └── organizationService.ts
        └── add-organization.ts         # Optional CLI utility
```

This is **one monolithic Express API**, not microservices. All routes use one app and the same MongoDB connection. Features remain separate on the frontend without unnecessary abstractions or dependencies.

## Getting started

Start MongoDB locally, or configure MongoDB Atlas.

Terminal 1 — server:

```bash
cd server
npm install
cp .env.example .env
# Set MONGODB_URI, ADMIN_PASSWORD (12+ chars), JWT_SECRET (32+ chars).
npm run dev
```

The API uses **nodemon + tsx** at http://localhost:4000.

Terminal 2 — client:

```bash
cd client
npm install
npm start
```

The React development server is at http://localhost:3000 and proxies `/api` requests to port 4000.

Build either project independently using `npm run build` from its own directory.

## Existing workflows preserved

- `/` — public landing page
- `/join` — independent signup without selecting a group
- `/create` and `/admin` — admin sign-in; create communities/groups and copy or share invite links
- `/c/:slug` — community link registration
- `/g/:slug` — group link registration

API endpoints (unchanged):
- `GET /api/health`
- `GET /api/organization/:type/:slug`
- `POST /api/join`
- `POST /api/admin/login`
- `GET /api/admin/overview`
- `POST /api/admin/organizations`

## Launch considerations

This is an MVP. Before collecting live registrations, add email verification, a full privacy policy, retention controls, anti-bot protection, and production HTTPS configuration. Joining by link is not proof of residency or group membership.
