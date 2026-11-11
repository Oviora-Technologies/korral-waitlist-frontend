# VILA Waitlist

A clean, responsive waitlist site for VILA. **No Next.js.**

## Tech
- React + Vite + TypeScript
- Node.js + Express + TypeScript
- MongoDB (native driver)
- Custom CSS + Lucide icons

## Features
- Public signup: `/`
- Community link: `/c/abuloma`
- Group link: `/g/example-group`
- Email deduplication and source tracking
- Simple CLI for creating community and group links

## Run locally
Install Node.js and run:

```bash
npm install
cp server/.env.example server/.env
npm run dev
```

Start a local MongoDB instance (or update `MONGODB_URI` in `server/.env`). Frontend runs at http://localhost:5173 and backend at http://localhost:4000.

## Create community and group links
After installing dependencies and configuring MongoDB:

```bash
npm run add:org -w server -- community "Abuloma" abuloma
npm run add:org -w server -- group "Example Youth Association" example-youth
```

Then share `https://YOUR-DOMAIN/c/abuloma` or `https://YOUR-DOMAIN/g/example-youth`. To register without any group, users visit the homepage.

## Build

```bash
npm run build
```

## Before a public launch
This is an **MVP**, not yet production-hardened. Add consent checkbox/privacy policy, email verification, rate limiting, anti-bot protections, operational monitoring, and production CORS configuration before collecting real people's details. There is **no admin dashboard** in this intentionally simple version. The API is not deployed.
