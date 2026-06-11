---
name: TanStack Start import-protection & server dir naming
description: Why server-only code and createServerFn files must avoid the `server/` path segment in this repo
---

TanStack Start's `tanstack-start-core:import-protection` build plugin denies any client-reachable
import whose resolved path matches `**/server/**`. This fires during `bun run build` (vite build),
not in dev.

**Rule:** `createServerFn(...)` definition files are imported by client route components (for the RPC
stub), so those files — AND any server-only modules they import at module top-level (e.g. via
`.middleware([requireAuth])`, a pg pool) — must NOT live under a directory named `server/`.

**Why:** the `.middleware([...])` reference is evaluated at module load (not inside the stripped
`.handler` closure), so the import can't be tree-shaken out of the client stub; the path-based guard
then rejects the whole build.

**How to apply in this repo:** server-fn files live in `src/api/*.ts`; their server-only deps (pg pool,
OIDC/session/auth) live in `src/backend/**` (deliberately NOT `src/server/`). `src/server.ts` (the SSR
entry file, not a dir) may freely import `src/backend/**` since it's the server entry, not client-reachable.
Renaming away from `server/` removes the framework's accidental-client-import guardrail, so keep
server-only code confined to `src/backend/**` by convention.
