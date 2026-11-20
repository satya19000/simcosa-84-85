# Recording reliability, and the Windows and Android roadmap

## What the web app can and cannot do

| Situation | Web app (browser tab) |
|---|---|
| Tab open and visible, device awake | Reliable. Chunks saved locally every 10 s and uploaded continuously. |
| Desktop: switch to another tab or app | Generally keeps recording in Chrome, Edge and Firefox. A gap warning appears if chunks stop arriving. |
| Desktop: laptop sleeps / lid closed | Recording stops. Audio up to the last chunk is safe and recoverable. |
| Phone: screen locks or app goes to background | **Not reliable.** Mobile browsers may suspend the page or the microphone. The app keeps the screen awake (Wake Lock) where supported and warns about gaps, but cannot guarantee capture. |
| Browser closed or crashes | Recording stops. Everything up to the last saved chunk is recovered on the next visit. |
| Network drops | Recording continues; uploads resume automatically. |
| Microphone unplugged / permission revoked | Recording stops and is saved; the user is told. |

The app never starts the microphone automatically and never records without the visible indicator.

## Why an adapter

`RecorderAdapter` (`web/src/recording/adapter.ts`) is the only part that touches the microphone.
Everything else — segments, chunk numbering, local buffering, upload paths, segment confirmation,
processing, minutes — is shared. A native client only has to:

1. Record audio into ordered chunks per segment (Opus/WebM, Ogg or AAC/MP4 all work).
2. Upload each chunk to `meetings/{meetingId}/segments/{seg:3}/chunk-{n:5}.{ext}` with Firebase Storage.
3. Write the segment document (`status: "uploaded"`, `chunkCount`) when all chunks are uploaded.
4. Call `POST /api/meetings/:id/process`.

No backend change is needed.

## Phase 2: Windows desktop client

For dependable multi-hour recording on a laptop at the meeting table.

- Tauri (Rust + the same React UI) or .NET/WinUI; capture with WASAPI, optionally including
  system audio (loopback) for online meetings — only with the same consent workflow.
- Prevent sleep while recording (`SetThreadExecutionState`), tray icon with a visible recording
  state, chunks written to disk so a crash or power cut loses at most a few seconds.
- Upload queue survives restarts; Firebase Auth via the desktop OAuth flow.

## Phase 3: Android client

- Kotlin app with a **foreground service** of type `microphone` and a persistent notification that
  shows recording status and a Stop action, so recording continues with the screen locked.
- Permissions: `RECORD_AUDIO`, `FOREGROUND_SERVICE`, `FOREGROUND_SERVICE_MICROPHONE`,
  `POST_NOTIFICATIONS` (Android 13+). Android only lets the service start the microphone while the
  app is in the foreground, so recording always starts from an explicit tap.
- `MediaRecorder`/`AudioRecord` → Opus or AAC chunks on disk; WorkManager for uploads with network
  constraints and retries.
- Handle phone calls and audio-focus loss by pausing and marking the gap.
- iOS would need a separate native app with the background audio mode; not planned in these phases.
