# Architecture

```
 Browser (Vercel)                         Firebase                       Cloud Run
 ┌──────────────────────┐   Auth token    ┌──────────────┐              ┌──────────────────┐
 │ React app            │───────────────▶ │ Auth         │              │ api service      │
 │  RecorderAdapter     │                 ├──────────────┤  reads/      │  /api/* (Express)│
 │  IndexedDB buffer ───┼── chunks ─────▶ │ Storage      │◀─ writes ───▶│  verifies ID     │
 │  ChunkUploader       │                 ├──────────────┤              │  token, enqueues │
 │  Firestore listeners │◀─ live status ─ │ Firestore    │◀────────────▶├──────────────────┤
 └──────────┬───────────┘                 └──────────────┘              │ worker service   │
            │ POST /api/meetings/:id/process                            │  /tasks/run      │
            └──────────────────────────────▶ api ──▶ Cloud Tasks ──OIDC─▶│  ffmpeg, STT, LLM│
                                                                        └──────────────────┘
```

## Data model

See `shared/src/types.ts` for the full layout. Highlights:

- `meetings/{id}` — setup fields (editable after recording), status, progress, consent record,
  `memberIds` (access list; owner only today, ready for team sharing).
- `meetings/{id}/segments/{index}` — one per recording segment or uploaded file, ordered by index.
- `meetings/{id}/transcriptPages/{page}` — transcript split into pages of 300 utterances so a
  3-hour Telugu meeting stays far below Firestore's 1 MiB document limit.
- `meetings/{id}/reports/current` — structured minutes (editable).
- `tasks/{id}` — action items, top-level so the Action Items screen can list across meetings.
- `jobs/{id}` — processing state, backend only.

Original audio is never modified: recorded chunks live at
`meetings/{id}/segments/{seg}/chunk-{n}.webm`, uploads at `meetings/{id}/original/…`.
Derived audio (normalised windows, the single-timeline playback file) goes under `processed/`.

## Recording pipeline (browser)

1. **Consent first.** The Record screen requires the user to choose how participants were told
   (with an English/Telugu announcement script) and confirm before the Start button enables. The
   microphone is opened only by that click. The consent record is stored on the meeting.
2. **Adapter.** `web/src/recording/adapter.ts` defines `RecorderAdapter`; the web implementation
   wraps `MediaRecorder` + an `AnalyserNode` for the level meter. Native clients implement the same
   contract (see RECORDING.md).
3. **Segments and chunks.** `RecordingSession` starts a new `MediaRecorder` per segment (default 60
   minutes, so each segment is an independently decodable file) and asks for a chunk every
   `chunkSeconds` (default 10 s).
4. **Local buffer.** Every chunk is written to IndexedDB *before* upload. If the tab or browser
   crashes, at most one chunk is lost. Storage quota is checked up front (`navigator.storage`), the
   app requests persistent storage, and a full disk is reported while recording continues with
   direct upload.
5. **Uploads.** `ChunkUploader` uploads in order with exponential backoff, pauses while offline and
   resumes on reconnect. Chunk paths are deterministic, so a retry overwrites the same object rather
   than creating duplicates.
6. **Confirmation.** When a segment ends, its final chunk count is recorded. Once every chunk is
   uploaded the segment document is marked `uploaded` and the local copy is deleted.
7. **Recovery.** On the next visit, segments still in IndexedDB are offered for recovery: the
   segment is closed at the last saved chunk and uploaded.
8. **Silence suggestion.** After N minutes below the threshold, a dialog counts down before
   stopping. Speech resuming withdraws it, "Keep recording" cancels it, and Stop is always available.
9. **Indicators.** Pulsing REC badge, `● REC` tab title, timer, level meter, segment/chunk/upload
   counters, offline and gap warnings, a wake lock to keep the screen on, and a leave-page warning.

## Processing pipeline (worker)

Each step is a separate queue message so no task comes near Cloud Tasks' 30-minute dispatch
deadline, and every step is idempotent so redelivery is safe.

1. `prepare` — download segments in index order, decode each one (extracting audio from video) to
   16 kHz mono FLAC with gentle loudness normalisation, concatenate them into one timeline
   (re-encoded, see the regression test), write an AAC playback file, detect silences, and cut
   ~10-minute windows at natural pauses.
2. `transcribe_window` × N — fan out. Each window goes to the STT adapter with names, designations
   and agenda terms as vocabulary hints. Results are stored per window; a transaction counts each
   window exactly once and the last one enqueues `merge`.
3. `merge` — offset utterances onto the meeting timeline, write transcript pages and a JSON copy.
4. `report` — the LLM adapter writes structured minutes for the selected template and language;
   action items become tasks. Tasks a user has already changed are kept when minutes are regenerated.

Failures: provider auth/validation errors are permanent; anything else is retried up to
`MAX_STEP_ATTEMPTS` with backoff, and the meeting shows the error with a "Try again" button.

## Security

- Firebase ID token verified on every API call; meeting membership checked server-side.
- Firestore rules: members read their meetings; clients may edit setup fields, consent, speaker
  names, transcript text, minutes and tasks, but not processing state, jobs, or files.
- Storage rules: members read; clients may write only chunk and original-upload paths, audio/video
  content types, with size caps. `processed/` and `exports/` are backend only.
- Worker endpoint accepts only Cloud Tasks OIDC tokens for the configured service account (and the
  Cloud Run service should also require authentication).
- Provider keys come from Secret Manager into the backend; nothing secret is in `VITE_*` variables.
- Deleting a meeting removes its audio, documents and tasks.

## Search

`GET /api/search` scans the caller's 100 most recent meetings (titles, agendas, summaries,
transcripts). This is fine for individuals and small teams. For larger archives, index transcripts
into a search service (e.g. Typesense, Algolia, or Vertex AI Search) when a transcript is merged.
