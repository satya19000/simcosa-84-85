---
name: Firebase auth with server-side token verification (no admin SDK)
description: How this app bridges client Firebase Auth to its Postgres session-cookie backend
---

This app uses client-side Firebase Auth (email/password + Google) but keeps a server-side
Postgres session-cookie backend and server-fn authz (requireAuth/requireAdmin reading the `sid` cookie).

**Bridge pattern:** client `onIdTokenChanged` → POST Firebase ID token to `/api/session`; server
verifies the token and issues the opaque `sid` session cookie. On Firebase signout (null user) the
client POSTs `/api/logout` to clear `sid`. This keeps ALL existing server functions unchanged.

**Server-side token verification without firebase-admin:** use `jose` `createRemoteJWKSet` against
`https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com` and
`jwtVerify` with `issuer: https://securetoken.google.com/<projectId>` and `audience: <projectId>`.
The project id is read server-side from `process.env.VITE_FIREBASE_PROJECT_ID` (VITE_ secrets are
also plain env vars on the Bun server). No service-account JSON needed — only the public project id.

**Why:** the user only provisioned the client `VITE_FIREBASE_*` config; JWKS verification needs
nothing more. **How to apply:** if asked to add server checks (e.g. email_verified, custom claims),
extend the verified payload handling in `firebase.ts`, not the client.

Note: the `sid` cookie is a 256-bit random opaque token stored in Postgres, so it needs no HMAC
signing — that's why SESSION_SECRET / the old signed oidc_tx cookie were removed during this migration.
