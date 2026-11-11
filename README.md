# VILA Waitlist

Modern community-first early access for VILA, built with **React (Create React App) + TypeScript**, **Node.js + Express + TypeScript**, and **MongoDB**. No Next.js.

## Flow

1. VILA contacts a community, group or organization.
2. An admin signs in at `/admin`, creates the community/group, and copies its dedicated link.
3. The organization shares the link with members. The separate registration page displays the organization name and records the signup source.
4. Anyone else can join independently at `/join` without selecting a community or group.

## Pages

- `/` — marketing homepage (no form)
- `/join` — independent waitlist registration
- `/c/abuloma` — example community invitation
- `/g/abuloma-youth` — example group invitation
- `/admin` — admin login, create community/group, copy unique links, and view signup counts

**Invitation examples only work after creating that organization.** The database doesn't come pre-populated.

## Run

Install MongoDB locally or set a MongoDB Atlas connection string, then:

```bash
npm install
cp server/.env.example server/.env
# Edit server/.env and set secure ADMIN_PASSWORD and JWT_SECRET
npm run dev
```

Client: http://localhost:3000 (Create React App); API: http://localhost:4000 (nodemon + tsx).

You can also run `npm run dev -w server` and `npm start -w client` separately.

## Build

```bash
npm run build
```

## Production notes

This is an MVP. Admin sessions use short-lived bearer tokens stored in sessionStorage, and the API rate-limits signup and admin login. Before a public rollout: implement email verification, proper privacy notice and consent language, stronger anti-bot protections, operational monitoring, HTTPS and controlled admin access. Do not treat an invitation link as proof of residence or group membership. Verify the build before deployment.
