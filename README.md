# VILA Waitlist

Community-first early-access signup platform for VILA. Built with React, Vite and TypeScript on the client; Node.js, Express, TypeScript and MongoDB on the API.

## Quick start

```bash
npm install
cp server/.env.example server/.env
npm run dev
```

Frontend: http://localhost:5173 • API: http://localhost:4000

Set `MONGODB_URI`, `ADMIN_PASSWORD`, and `JWT_SECRET` in `server/.env` before starting.

Routes: `/` for direct signup, `/c/:slug` for community links, `/g/:slug` for group links, `/admin` for management.

**Important:** Configure a real email-verification service and production security review before public launch. Signup confirmations in this MVP are not email-verified.
