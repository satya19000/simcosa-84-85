# Meeting Agent — Phase 5.7

Real-Time Voice Calling & Meeting Agent for ARIA.

## Architecture

The Meeting Agent is a 24-file module under `aria/functions/src/meeting-agent/` that provides:

- Meeting session lifecycle management (create, start, pause, end, delete)
- Transcription storage (finalized chunks to Firestore)
- AI-powered summary generation (via AI Gateway)
- Action item extraction (suggestions only — never auto-creates)
- Approval-gated follow-up communications
- Memory Graph integration (links meetings, participants, documents)
- Workflow bridge for multi-step meeting workflows
- Export to Markdown / plain text (DOCX/PDF interfaces defined, not implemented)

**Facade class**: `MeetingAgentEngine` composes all sub-engines. Cloud Functions in `meetingAgentApi.ts` call only `MeetingAgentEngine`.

## Consent & Privacy Model

1. **No recording without explicit user action.** Sessions start in `consentRequired` status. The user must call `startMeetingSession` to grant consent.
2. **Visible recording indicator.** When a session is `active`, the frontend shows a pulsing red dot (MeetingConsentBanner, MeetingRecorderPanel).
3. **Pause and stop at any time.** `pauseMeetingSession` and `endMeetingSession` are always available.
4. **Transcript deletion is audited.** Every transcript deletion writes to `meetingAudit/{auditId}`.
5. **No transcript sharing without approval.** All sharing flows through `MeetingApprovalBridge` → `ApprovalEngine`.

## Transcription Pipeline

```
Frontend (browser)                      Backend (Cloud Functions)
─────────────────────────────────────   ────────────────────────
SpeechRecognition API (Web Speech)  →   addTranscriptChunk CF
  (browser-side only; backend has        ↓
   no microphone access)                MeetingTranscriptionEngine.addTranscriptChunk
                                         ↓
                                        Firestore: tenants/{tenantId}/meetingTranscripts
                                         ↓
                                        MeetingSummaryEngine.generateSummary
                                         ↓
                                        AI Gateway (no direct API calls)
                                         ↓
                                        MeetingSummary stored in Firestore
```

## AI Gateway Usage

All AI processing routes through `AIGateway.complete()`. No direct Anthropic/OpenAI API calls are made from any file in this module. API keys are never stored in `aria/src/**`.

## Approval Integration

`MeetingApprovalBridge` is the **ONLY** path to `ApprovalEngine.createApprovalRequest` for all meeting-related approvals:

- Sending meeting summary email → `send_meeting_summary_email`
- Sending follow-up email → `send_followup_email`
- Sending WhatsApp → `send_whatsapp_followup`
- Sending SMS → `send_sms_reminder`
- Creating task from transcript → `create_task_from_transcript`
- Creating reminder from transcript → `create_reminder_from_transcript`
- Sharing transcript → `share_transcript`
- Deleting transcript (with org audit) → `delete_transcript_with_audit`
- Exporting meeting notes → `export_meeting_notes`

## Communication Integration

`MeetingCommunicationBridge` prepares drafts only. Every method returns a `MeetingFollowUp` with `approvalStatus='draft'`. Nothing is sent until:
1. User calls `approveMeetingFollowUp` Cloud Function.
2. `MeetingCommunicationBridge.requestSendApproval` calls `MeetingApprovalBridge.requestApproval`.
3. `MeetingApprovalBridge` calls `ApprovalEngine.createApprovalRequest`.
4. Human approves in the ApprovalEngine UI.

## Memory Graph Integration

`MeetingMemoryBridge` links:
- Meeting session → `meeting` node
- People mentioned (from summary) → `person` nodes
- Documents mentioned → `document` nodes
- Approval requests → `task` nodes

Transcript text is stored in Firestore (`meetingTranscripts`), NOT in the Memory Graph, for privacy isolation.

## Firestore Schema

All collections are under `tenants/{tenantId}/`:

| Collection | Description |
|------------|-------------|
| `meetingSessions/{sessionId}` | Session metadata, status, participants list |
| `meetingTranscripts/{transcriptId}` | Individual transcript chunks |
| `meetingSummaries/{summaryId}` | AI-generated summaries |
| `meetingActionItems/{actionItemId}` | Extracted action items (suggestions) |
| `meetingParticipants/{participantId}` | Per-participant records |
| `meetingAudit/{auditId}` | Immutable audit trail |
| `meetingFollowUps/{followUpId}` | Draft follow-up communications |

All rules: `allow read, write: if false` — Cloud Functions / Admin SDK only.

## Safety Invariants

`MeetingSafetyGuard` unconditionally blocks:

1. `STEALTH_RECORDING_BLOCKED` — `stealthMode: true`
2. `HIDDEN_MICROPHONE_BLOCKED` — `hiddenMicrophone: true`
3. `BACKGROUND_LISTENING_BLOCKED` — background listening without visible session
4. `RECORDING_WITHOUT_CONSENT` — recording before user grants consent
5. `UNAUTHORIZED_CALL_RECORDING` — recording calls without authorization
6. `PARTICIPANT_CONSENT_REQUIRED` — types requiring participant notification
7. `STEALTH_CALL_JOIN_BLOCKED` — joining calls without visible indicator
8. `AUTO_SEND_BLOCKED` — any auto-send pattern detected in intent
9. `APPROVAL_BYPASS_BLOCKED` — any attempt to bypass approval

These are named hard-blocks documented and enforced — never implemented as functioning stealth capabilities.

## Manual Tests

1. Create a meeting session → status `consentRequired`
2. Start session → status `active`, consent `granted`, audit event logged
3. Add transcript chunk → stored to Firestore (no log of content)
4. Pause session → status `paused`, audit event logged
5. End session → status `ended`, audit event logged
6. Generate summary → calls AI Gateway, returns structured summary
7. Extract action items → returns suggestions with `approvalStatus='suggestion'`
8. Request follow-up approval → calls `MeetingApprovalBridge` → `ApprovalEngine`
9. Export notes (markdown) → returns markdown content
10. Delete session → status `deleted`
11. List sessions → returns user's sessions for tenant
12. Safety guard test → pass `stealthMode: true` to `assertRecordingStartSafe` → throws `MeetingSafetyError`

## Provider Implementations

| Provider | Status |
|----------|--------|
| BrowserWebSpeechProvider | Architecture description only (browser-side) |
| WhisperBatchProvider | Real — routes text through AI Gateway |
| StreamingSTTProvider | Placeholder — `{ notImplemented: true }` |
| WebRTCProvider | Placeholder — `{ notImplemented: true }` |
| PhoneProvider | Placeholder — `{ notImplemented: true }` |
| MeetingPlatformProvider | Placeholder — `{ notImplemented: true }` |

## Future: Real-Time Streaming Plan (Phase 5.8)

1. Integrate AssemblyAI or Deepgram for real-time WebSocket streaming STT.
2. Frontend opens WebSocket to a Cloud Run container (not Functions, for persistent connections).
3. Container streams audio → STT → calls `addTranscriptChunk` CF.
4. Speaker diarization via STT provider's diarization endpoint.
5. WebRTC for voice call capture (frontend only, OS microphone permission required).
6. Meeting platform bots (Zoom, Meet, Teams) via their recording APIs — each requiring explicit user authorization and visible consent.
