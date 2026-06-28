# ARIA — Adaptive Reasoning Intelligence Assistant

> AI Executive Assistant PWA · React + TypeScript + Firebase + Claude API

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + TypeScript + Vite |
| Styling | Tailwind CSS v4 + Framer Motion |
| State | Zustand |
| Auth | Firebase Auth (Email + Google OAuth) |
| Database | Cloud Firestore (real-time) |
| Storage | Firebase Cloud Storage |
| Backend | Firebase Cloud Functions (Node 20) |
| AI Brain | Anthropic Claude API (`claude-opus-4-8`) via Cloud Functions |
| STT | OpenAI Whisper (Phase 3) |
| TTS | ElevenLabs (Phase 3) |
| PWA | Web App Manifest + safe-area support |

---

## Project Structure

```
aria/
├── src/
│   ├── components/
│   │   ├── aria/        # AriaOrb animated voice button
│   │   ├── auth/        # AuthGuard
│   │   ├── layout/      # AppShell, BottomNav
│   │   └── ui/          # Button, Card, Input, skeletons
│   ├── hooks/
│   │   └── useVoiceRecorder.ts   # MediaRecorder hook
│   ├── lib/
│   │   ├── firebase.ts           # Firebase SDK init
│   │   ├── chatService.ts        # Firestore + Cloud Function calls
│   │   ├── types.ts              # Shared TypeScript types
│   │   └── utils.ts
│   ├── pages/
│   │   ├── Home.tsx              # Dashboard + briefing
│   │   ├── Chat.tsx              # Live ARIA chat (Firestore real-time)
│   │   ├── Calendar.tsx          # Calendar view
│   │   ├── Vault.tsx             # Encrypted document vault
│   │   ├── Profile.tsx           # Settings + subscription
│   │   └── auth/                 # Login, Signup
│   └── store/
│       ├── authStore.ts          # Firebase user state
│       └── ariaStore.ts          # Voice state machine
├── functions/
│   └── src/
│       ├── index.ts              # Entry — exports all functions
│       ├── chat.ts               # chatWithAria callable (Claude API)
│       ├── voice.ts              # transcribeAudio + synthesizeSpeech
│       ├── types.ts              # Shared Cloud Function types
│       └── prompts/
│           └── ariaSystem.ts     # ARIA system prompt
├── firestore.rules               # Security rules
├── firestore.indexes.json        # Composite indexes
└── firebase.json                 # Firebase project config
```

---

## Quick Start

### 1. Clone and install

```bash
# Frontend
npm install

# Cloud Functions
cd functions && npm install
```

### 2. Firebase project setup

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login and init (select existing project or create new)
firebase login
firebase use --add
```

### 3. Set secret keys (server-side only — never in .env)

```bash
firebase functions:secrets:set ANTHROPIC_API_KEY
firebase functions:secrets:set OPENAI_API_KEY       # Phase 3
firebase functions:secrets:set ELEVENLABS_API_KEY   # Phase 3
```

### 4. Configure frontend environment

```bash
cp .env.example .env.local
# Fill in your Firebase config values from Firebase Console → Project Settings
```

### 5. Enable Firebase services

In Firebase Console:
- **Authentication** → Enable Email/Password and Google providers
- **Firestore** → Create database in production mode
- **Cloud Functions** → Upgrade to Blaze (pay-as-you-go) plan
- **Storage** → Enable

### 6. Deploy Firestore rules

```bash
firebase deploy --only firestore:rules,firestore:indexes
```

### 7. Deploy Cloud Functions

```bash
firebase deploy --only functions
```

### 8. Run frontend dev server

```bash
npm run dev
```

### Local emulators (optional)

```bash
firebase emulators:start
```

The emulator UI will be at http://localhost:4000

---

## Environment Variables

Frontend variables (prefix `VITE_`) go in `.env.local`:

```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_FIREBASE_MEASUREMENT_ID=...
```

**Never put `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, or `ELEVENLABS_API_KEY` in `.env`.** These live in Firebase Secret Manager only.

---

## Firestore Data Schema

```
users/{userId}/
  chatSessions/{sessionId}/
    messages/{messageId}       role, content, timestamp, sessionId, userId
  tasks/{taskId}               title, priority, dueAt, completed
  reminders/{reminderId}       title, scheduledAt, recurring
  contacts/{contactId}         name, relationship, lastContact, notes
  vaultItems/{itemId}          name, category, storagePath, expiresAt
  financials/{doc}             type, amount, dueDate, name
  health/{doc}                 type, value, recordedAt
```

---

## Development Phases

| Phase | Status | Scope |
|---|---|---|
| Phase 1 | ✅ Done | Foundation, UI shell, Firebase Auth, all screens |
| Phase 2 | ✅ Done | Claude API via Cloud Functions, Firestore real-time chat, voice UI |
| Phase 3 | 🔜 Next | Whisper STT, ElevenLabs TTS, Google Calendar sync, contacts |
| Phase 4 | 🔜 | Tasks/reminders Firestore CRUD, health & financial tracking |
| Phase 5 | 🔜 | Email/WhatsApp/SMS via Twilio, document vault, Stripe subscriptions |
