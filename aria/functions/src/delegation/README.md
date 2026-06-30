# ARIA Executive Delegation & Human Approval Platform (Phase 4.11)

A generic Human Approval Platform so ARIA prepares work, presents
recommendations, waits for explicit human approval, then executes — never
autonomous for sensitive actions. The core engine is generic over
`ApprovalTriggerType`; how each trigger type's action is actually carried out
(send an email, delete a document, etc.) is implemented as a pluggable
`ApprovalExecutor`, the same provider-pattern philosophy used by
`finance/FinanceRegistry.ts` and `health/`.

## Architecture

```
delegation/
├── ApprovalEngine.ts          facade — orchestrates everything below, the
│                                 only place that may call executor.execute()
├── ApprovalQueue.ts            Firestore repository (approvalRequests),
│                                 all state transitions, never executes
├── ApprovalHistory.ts          immutable audit log repository
│                                 (approvalHistory)
├── ApprovalLogger.ts           structured wrapper around ApprovalHistory used
│                                 for every consequential engine action
├── ApprovalPolicy.ts           risk-score -> ApprovalLevel band mapping,
│                                 requiresApproval()/auto-execute eligibility
├── ApprovalRequest.ts          buildApprovalRequest()/ApprovalRequestBuilder
│                                 + computeRiskScore() from RiskFactors
├── ApprovalQueue + ApprovalRegistry  pluggable executors (execute/rollback/
│                                 verify), empty by default — see Rollback
├── ApprovalTemplates.ts        predefined title/summary/risk templates per
│                                 triggerType, extensible via registerTemplate
├── ApprovalNotifications.ts    in-app notification records only (never sends
│                                 external email/WhatsApp itself)
├── ApprovalAnalytics.ts        Firestore-query-based stats (rates, durations,
│                                 distributions)
├── ApprovalMetrics.ts          thin combined view + in-memory auto-execute
│                                 counter for the dashboard Metrics panel
├── ApprovalScheduler.ts        expiring-soon notifications + expiry
│                                 transitions, never auto-acts on the
│                                 underlying triggerType
├── ApprovalPermissions.ts      per-scope role-based access control
├── ApprovalValidator.ts        input validation for requests/delegation rules
├── ApprovalEvents.ts           event bus (approval:created/approved/...)
├── ApprovalWorkflow.ts         Workflow Engine integration point — see
│                                 "Workflow Integration" below for honest
│                                 wired-today vs. Phase 5.0 status
├── ApprovalConfig.ts           tunables (expiry windows, risk thresholds)
├── ApprovalTypes.ts            shared types for the entire module
└── index.ts                    per-user singleton sessions + re-exports
```

`functions/src/delegationApi.ts` exposes the engine to the frontend as
Firebase Cloud Functions (`onCall`), following the same pattern as Finance
and Health: every function checks `request.auth`, validates input, and
delegates to a per-user `ApprovalEngine` instance from `getApprovalEngine`.

## Approval Flow

```
Draft -> Pending -> Approved -> Executed
                 \-> Rejected
                 \-> Cancelled
                 \-> Expired
       Approved  -> Delegated   (handed to another user, still needs decision)
       Executed  -> RolledBack  (execution failed, or manual rollback test)
```

- `createApprovalRequest` builds a `Pending` request (or `Approved` if the
  computed risk is below the auto-execute threshold AND the triggerType is
  not on the always-manual list — see Risk Model).
- `approveRequest` transitions `Pending -> Approved`, then immediately calls
  `executeIfPossible`, which only proceeds if an `ApprovalExecutor` is
  registered for that triggerType. If none is registered the request simply
  stays `Approved` — nothing is silently skipped or assumed done.
- Execution failures call the executor's `rollback()` and transition the
  request straight to `RolledBack`, recording the failure reason.
- `rollbackRequest` is also callable directly on an `Executed` request (the
  dashboard's "Rollback Tests" section uses this) — it calls
  `rollback()` then `verify()` and records both into history.

## Risk Model

Every `ApprovalRequest` carries a `riskScore` (0-100) computed from
`RiskFactors` by `computeRiskScore()` in `ApprovalRequest.ts`:

| Factor | Weight |
|---|---|
| `externalCommunication` | +20 |
| `financialImpact` (0-1) | up to +30 |
| `healthImpact` | +25 |
| `privacyImpact` | +15 |
| `irreversible` | +20 |
| low `aiConfidence` | up to +15 (inverse of confidence) |

## Policies

`ApprovalPolicy.determineApprovalLevel(riskScore)` maps the score onto a
band (from `ApprovalConfig`):

| Risk score | Level | Auto-execute eligible? |
|---|---|---|
| < 20 | simple | Yes, unless triggerType is always-manual |
| 20–50 | standard | No |
| 50–80 | executive | No |
| 80+ | emergency | No |

Always-manual trigger types (never auto-executed regardless of score):
`financial_payment`, `medical_decision`, `health_record_update`,
`plugin_installation`. `ApprovalPolicy.requiresApproval(riskScore,
triggerType)` is the single source of truth the engine consults — no other
code path decides eligibility.

## Rollback

`ApprovalRegistry` is the provider-pattern executor registry:

```ts
interface ApprovalExecutor {
  triggerType: ApprovalTriggerType
  execute(request: ApprovalRequest): Promise<void>
  rollback(request: ApprovalRequest): Promise<void>
  verify(request: ApprovalRequest): Promise<boolean>
}
```

The registry is **empty by default**, mirroring Finance/Health's deliberate
no-pre-registered-vendor pattern — no concrete executor for any triggerType
ships in this module. Wiring `send_email`'s real executor is the
responsibility of the Communication Hub, `delete_documents`' executor is the
responsibility of the Document Workspace, etc. Until an executor is
registered, `ApprovalEngine` will let approved requests sit in `Approved`
state forever rather than guess at how to perform the action — this is
intentional, not a bug.

## Audit

Two layers:

- `ApprovalHistory` — append-only Firestore collection
  (`users/{userId}/approvalHistory`), one document per logged event.
- `ApprovalLogger` — thin wrapper `ApprovalEngine` calls for every
  consequential action (`created`, `approved`, `rejected`, `cancelled`,
  `delegated`, `executed`, `rolled_back`) so every audit entry has a
  consistent `{actor, action, requestId, timestamp, details}` shape.

Every `ApprovalRequest` document also carries its own embedded `history`
array (written by `ApprovalQueue`'s transition methods) for fast access
without a second query; `ApprovalHistory` is the durable, queryable,
cross-request audit log.

## Workflow Integration

`aria/functions/src/workflows/WorkflowRunner.ts` does **not** currently have
a generic pause/resume primitive — `executeStep` runs each step kind
(`action`, `wait`, `delay`, `parallel`, etc.) to completion within a single
invocation. There is no "pause this run, persist state, resume on an
external event" mechanism today.

What **is** wired: `ApprovalWorkflow.createGate(userId, workflowId,
requestFactory)` creates a real `ApprovalRequest` linked to a `workflowId`
field and persists it through `ApprovalQueue`. Callers can poll
`getGateStatus` or subscribe via `onGateResolved` (backed by
`ApprovalEvents.on('approval:approved' | 'approval:rejected', ...)`).

**Phase 5.0 TODO**: add a first-class `'approval_gate'` step kind to
`WorkflowStep.ts`/`WorkflowRunner.ts` that creates the gate, persists run
state via the existing `WorkflowState.ts` cold-start-resume mechanism, and
resumes the run from an event-driven callback when the gate resolves. Until
then, gated workflows must be split into two separate invocations by the
caller.

## Developer APIs

All in `functions/src/delegationApi.ts`, auth-checked `onCall` functions:

`createApprovalRequest`, `getApprovalRequest`, `listApprovalRequests`,
`listPendingApprovals`, `listUrgentApprovals`, `listExpiredApprovals`,
`listExecutedApprovals`, `listDelegatedApprovals`, `listRejectedApprovals`,
`approveRequest`, `rejectRequest`, `cancelRequest`, `delegateRequest`,
`bulkApproveRequests`, `bulkRejectRequests`, `rollbackApprovalRequest`,
`getApprovalStats`, `getApprovalMetrics`, `listApprovalHistory`,
`runApprovalScheduledChecks`, `listApprovalTemplates`,
`getApprovalPolicyBands`.

## Manual Tests

Use `/devtools/approvals` in the frontend, or call the Cloud Functions
directly via the Firebase console/emulator.

1. **Create email approval** — call `createApprovalRequest` with
   `triggerType: 'send_email'`, `riskFactors: { externalCommunication: true,
   financialImpact: 0, healthImpact: false, privacyImpact: false,
   irreversible: true, aiConfidence: 0.8 }`. Confirm it lands as `pending`
   (risk ~32, above auto-execute threshold of 20) and appears in "Pending
   Approvals".

2. **Approve** — call `approveRequest` with the request id. Confirm status
   becomes `approved` (no executor registered for `send_email` in this
   module, so it stays `approved` rather than jumping to `executed`).

3. **Execute** — register a test `ApprovalExecutor` for `send_email` via
   `engine.executors.registerExecutor(...)`, then re-run step 2. Confirm
   `execute()` is called and status becomes `executed` with `executedAt` set.

4. **Reject** — create a second request, call `rejectRequest` with a reason.
   Confirm it appears in "Rejected Work" and an `approval_rejected`
   notification document was written.

5. **Expire** — create a request with `expiresInMs: 1` (or wait past
   `defaultExpiryMs`), then call `runApprovalScheduledChecks`. Confirm it
   transitions to `expired` and appears in the "Expired" list.

6. **Rollback** — with an `executed` request from step 3, call
   `rollbackApprovalRequest`. Confirm the executor's `rollback()` and
   `verify()` both ran and status became `rolled_back`. Also try the
   dashboard's "Rollback Tests" panel for the same flow.

7. **Bulk approval** — create 3 low-risk pending requests, call
   `bulkApproveRequests` with all 3 ids. Confirm all 3 transition to
   `approved` and each gets its own history entry.

8. **Risk scoring** — create requests with varying `RiskFactors` (e.g. all
   false/0 vs. all true/1) and confirm `riskScore`/`riskLevel` match the
   weights in the Risk Model table above, and `approvalLevel` matches the
   band in Policies.

9. **Delegation** — call `delegateRequest` with a `delegatedTo` user id on a
   pending request. Confirm status becomes `delegated`, `delegatedTo` is set,
   and it appears in "Delegated Work". Confirm `getApprovalStats().
   delegationStats.totalDelegated` increments.
