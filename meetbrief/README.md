# MeetBrief AI

Meeting recorder and minutes assistant for individual professionals and small teams.
Record or upload a meeting in **Telugu, English, or mixed Telugu–English**, and get a timestamped
transcript, a summary, formal minutes (including Indian government and district health review
formats), decisions and trackable action items.

**New Meeting → Record or Upload → Process → Review → Export**

| Part | Tech | Where it runs |
|---|---|---|
| `web/` | React 19 + Vite + TypeScript + Tailwind v4 | Vercel |
| `server/` | Node 22 + Express + TypeScript, ffmpeg | Cloud Run: `api` service + `worker` service (same image) |
| `shared/` | Types, templates, validation (zod) | used by both |
| Data | Firebase Auth, Firestore, Firebase Storage | Firebase |
| Queue | Google Cloud Tasks (durable, retries) — in-process queue for local dev | GCP |
| Speech-to-text | Adapter: Sarvam AI (`saaras:v3`), Google Chirp 3, or mock | backend only |
| LLM | Adapter: Anthropic Claude (`claude-opus-5-5`), or mock | backend only |

Provider keys exist only on the backend. The web bundle contains only the Firebase web config
(a public project identifier, not a secret).

This folder is self-contained and does not touch the SIMCOSA alumni site at the repository root.

## Quick start (local, no cloud accounts needed)

Requires Node 20+, Java 11+ (Firebase emulators) and ffmpeg.

```bash
cd meetbrief
npm install
npm run build -w shared

# 1. Firebase emulators (Auth, Firestore, Storage)
npx firebase emulators:start --only auth,firestore,storage --project demo-meetbrief

# 2. Backend with mock speech + mock AI (new terminal)
cd server && npx tsx --env-file=.env.emulators src/index.ts

# 3. Web app (new terminal)
cd web && npx vite --mode emulators
```

Open http://localhost:5173, create an account, and press **Start Meeting**. With mock providers the
transcript and minutes are placeholder text so the whole flow can be tested offline. Set
`STT_PROVIDER` / `LLM_PROVIDER` and keys in `server/.env` for real output (see `server/.env.example`).

## Checks

```bash
npm run typecheck   # shared + server + web
npm test            # unit tests (validation, window planning, ffmpeg reconstruction)
npm run build:web
```

An end-to-end browser run against the emulators (record with fake microphone, network outage,
pause/resume, segment rollover, auto-processing, transcript, minutes, DOCX export, task update,
Ask AI, video upload with audio extraction, search, crash recovery) passed with no console errors.
The script used is in `docs/e2e.cjs`.

## Documentation

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — data model, recording pipeline, processing queue, security
- [docs/PROVIDERS.md](docs/PROVIDERS.md) — speech/LLM provider choices, what was verified, what to evaluate
- [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) — Firebase, Cloud Run, Cloud Tasks, Vercel, secrets; remaining configuration
- [docs/RECORDING.md](docs/RECORDING.md) — what browsers can and cannot record reliably; Windows and Android roadmap
- [docs/ROLLBACK.md](docs/ROLLBACK.md) — branch and rollback approach
