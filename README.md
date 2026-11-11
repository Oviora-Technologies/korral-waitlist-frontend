# VILA Waitlist

A clean, modern, mobile-first website for VILA's early-access waitlist.

## Stack
- **Client:** React 19, TypeScript, Create React App (`react-scripts`), custom responsive CSS
- **Server:** Node.js, Express, TypeScript, MongoDB
- **No Next.js**

## Setup

1. Make sure Node.js and MongoDB are installed.
2. Install dependencies:

```bash
npm install
cp server/.env.example server/.env
npm run dev
```

- Frontend: http://localhost:3000
- Backend: http://localhost:4000
- The client proxies `/api` requests to port 4000 in development.

## Waitlist links

- Direct: `/`
- Community: `/c/abuloma`
- Group: `/g/example-youth`

First create the community or group in MongoDB using the provided command:

```bash
npm run add:org -w server -- community "Abuloma" abuloma
npm run add:org -w server -- group "Example Youth" example-youth
```

Then distribute the corresponding URL on your deployed domain.

## Build

```bash
npm run build
```

## Before public launch

The MVP is not production-ready yet. Add email verification, privacy policy, server-side consent recording, abuse/rate limiting, and production deployment configurations before collecting personal details. Do not treat joining through a community or group link as proof of membership.
