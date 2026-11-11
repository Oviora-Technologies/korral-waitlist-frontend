# VILA Waitlist

Modern community-first early access for VILA, built with **React (Create React App) + TypeScript**, **Node.js + Express + TypeScript**, and **MongoDB**. No Next.js.

## Flow

1. VILA contacts a community, group or organization.
2. An admin opens `/create` and signs in, chooses **Create community** or **Create group**, and enters its name. The dedicated invitation link is generated automatically.
3. The admin copies the invitation link or taps **Share on WhatsApp** to send it to the organization's members. The separate registration page displays the organization name and records the signup source.
4. Anyone else can join independently at `/join` without selecting a community or group.

## Pages

- `/` — marketing homepage (no form)
- `/join` — independent waitlist registration
- `/c/abuloma` — example community invitation
- `/g/abuloma-youth` — example group invitation
- `/create` — clearly labeled community/group creation page (admin password required), instant copy and WhatsApp sharing
- `/admin` — same private administrator dashboard, including signup counts

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
