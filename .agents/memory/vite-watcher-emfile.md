---
name: Vite dev EMFILE from watcher walking .cache
description: Why dev startup can crash with EMFILE after adding a large dependency, and the fix
---

Symptom: `bun run dev` (vite dev) crashes at startup with many `EMFILE: too many open
files, scandir '.../.cache/.bun/install/cache/...'` lines, then `script "dev" exited with code 1`.

**Cause:** Vite's chokidar watcher recursively walks the project root. The bun install cache
lives at `./.cache/.bun` *inside the workspace* (hundreds of MB, huge file count). Adding a big
dependency (e.g. firebase = ~79 packages) pushes the simultaneous open-FD count past the limit
even though the soft ulimit is already high (~83886). It is NOT a code error and a plain restart
does not fix it.

**Fix:** in `vite.config.ts`, set `vite.server.watch.ignored` to exclude non-source heavy dirs:
`["**/.cache/**", "**/.local/**", "**/dist/**", "**/.git/**"]`. These contain no app source.

**How to apply:** if dev startup EMFILEs (especially right after installing a large package),
check/extend the watcher ignore list before assuming a code bug.
