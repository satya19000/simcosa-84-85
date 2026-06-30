# Mission Control — Phase 5.0

Mission Control is the cross-domain executive planning layer. A **Mission**
is a goal-level container (e.g. "Reduce Q3 spend", "Get Dad's checkup
scheduled"); **MissionTasks** are its concrete ordered steps. It is purely
additive: it never duplicates Finance/Health/Delegation business logic, it
reads their existing read-only surfaces (`listPendingSuggestions`,
`listUrgent`) to generate recommendations, and it routes every risky action
through the real `ApprovalEngine` (`../delegation`) — never around it.

## Architecture

```
MissionEngine (facade, per-user singleton via index.ts getMissionEngine)
├── MissionManager          Firestore CRUD for Missions
├── MissionTaskManager       Firestore CRUD for MissionTasks, dependency gating
├── MissionPlanner            Deterministic per-domain starter checklists (NOT an LLM planner)
├── MissionAnalytics          Stats rollups (byStatus, byDomain, overdue, etc.)
├── RecommendationManager     Firestore CRUD for MissionRecommendations
├── RecommendationEngine      Reads Finance/Health suggestions + urgent Approvals -> recommendations
├── LearningEngine            Counts accept/dismiss outcomes -> per-domain confidence multiplier
├── PredictionManager         Firestore CRUD for MissionPredictions (append-only log)
├── PredictionEngine          Heuristic ETA + slippage-risk formulas (NOT machine learning)
├── ContinuousPlanningEngine  One-shot "refresh everything" cycle (refresh recs, expire stale, regenerate predictions)
├── MissionScheduler          Thin entry-point wrapper around ContinuousPlanningEngine, naming-matches ApprovalScheduler
├── MissionApprovalBridge     The ONLY path from a MissionTask to a real ApprovalRequest
├── MissionPermissions        Per-scope role grants (reader/planner/mission_admin/admin)
├── MissionHistory            Append-only audit log (mirrors ApprovalHistory.ts)
├── MissionLogger             Structured wrapper over MissionHistory.append (mirrors ApprovalLogger.ts)
├── MissionValidator          Static input validators used by missionControlApi.ts before touching MissionEngine
└── MissionEvents             In-process pub/sub event bus (mirrors ApprovalEvents.ts)
```

`MissionConfig.ts` / `MissionTypes.ts` hold shared config and types; there is
no separate `MissionQueue`/`MissionTimeline`/`MissionPriority`/
`MissionPredictor`/`MissionRecommendation`/`MissionCoordinator`/
`MissionExecution`/`MissionRecovery`/`MissionLearning`/`MissionPolicies`/
`MissionMetrics`/`MissionRegistry` class file — those concerns are covered by
the classes above (e.g. "MissionRecommendation" is a *type*, produced by
`RecommendationEngine`/`RecommendationManager`; "MissionLearning" is
`LearningEngine`; "MissionPredictor" is `PredictionEngine`; there is no
separate execution/recovery layer because Mission Control never executes
risky actions itself — `ApprovalEngine` owns execution and rollback).

## APIs

All Cloud Functions are `onCall` exports defined in
`aria/functions/src/missionControlApi.ts` and re-exported from
`aria/functions/src/index.ts`:

`createMission`, `getMission`, `listMissions`, `updateMission`,
`activateMission`, `pauseMission`, `abandonMission`, `listMissionTasks`,
`addMissionTask`, `completeMissionTask`, `setMissionTaskStatus`,
`requestMissionTaskApproval`, `getMissionTaskApprovalStatus`,
`listMissionRecommendations`, `acceptMissionRecommendation`,
`dismissMissionRecommendation`, `getMissionPredictions`,
`getMissionLearningSnapshots`, `runMissionPlanningCycle`, `getMissionStats`,
`listMissionHistory`.

The frontend client is `aria/src/lib/missionControlService.ts`, consumed by
`aria/src/pages/devtools/MissionControlDashboard.tsx` at
`/devtools/mission-control`.

## Firestore schema

All collections are scoped under `users/{userId}/...`:

- `missions` — `Mission` documents
- `missionTasks` — `MissionTask` documents (queried by `missionId`)
- `missionRecommendations` — `MissionRecommendation` documents
- `missionRecommendationOutcomes` — `RecommendationOutcome` documents (accept/dismiss log feeding `LearningEngine`)
- `missionPredictions` — `MissionPrediction` documents (append-only)
- `missionPermissions` — `MissionPermissionRecord` documents, keyed by `scopeId`
- `missionHistory` — `MissionHistoryEntry` documents (append-only audit log)

## Approval Bridge — no bypass

`MissionEngine.requestTaskApproval` -> `MissionApprovalBridge.requestApprovalForTask`
-> `ApprovalEngine.createApprovalRequest` (the real engine from
`../delegation`, injected into `MissionEngine`'s constructor, never
constructed internally). The bridge:

1. Never invents its own risk score — `ApprovalEngine`/`ApprovalPolicy` own
   that calculation entirely.
2. Links the resulting `ApprovalRequest.id` onto the `MissionTask` via
   `MissionTaskManager.linkApprovalRequest`.
3. Marks the task `blocked` if the request is `pending` (i.e. not
   auto-execute-eligible).
4. Never marks a task `completed` itself — callers still have to call
   `MissionEngine.completeTask` once they've observed (via
   `getTaskApprovalStatus` or `ApprovalEvents`) that the linked request
   reached a terminal/approved state.

## Memory Graph integration

`MissionEngine.linkMissionToMemory` calls the real `getMemoryGraph(userId,
db, apiKey)` helper from `../memory-graph` and upserts a `'project'`
node — a valid `NodeType` already defined in `memory-graph/MemoryTypes.ts`.
This mirrors `ApprovalEngine.linkApprovalToMemory`'s pattern exactly
(best-effort, swallows errors, never blocks the primary operation).

## Implemented Today vs Phase 5.1 TODO

**Implemented today:**
- Mission/MissionTask CRUD, dependency-gated task completion, progress rollup
- Deterministic per-domain starter checklists (`MissionPlanner`)
- Recommendation generation by reading Finance/Health suggestions and urgent
  Approval requests (read-only; no duplicated business logic)
- Simple counting-statistics learning loop (accept/dismiss -> confidence
  multiplier), explicitly not a trained model
- Heuristic, explainable predictions (linear ETA extrapolation, slippage risk
  from task completion ratio vs. time remaining) — every `basis` string says
  exactly what was computed
- One-shot continuous planning cycle (`ContinuousPlanningEngine.runCycle`)
  that refreshes recommendations, expires stale ones, and regenerates
  predictions for active missions
- Full Approval Bridge gating through the real `ApprovalEngine` — verified no
  bypass path exists
- Append-only audit history, per-scope permissions, dev dashboard at
  `/devtools/mission-control`

**Phase 5.1 TODO (explicitly NOT implemented — do not assume otherwise):**
- An actual LLM-driven mission planner (today's `MissionPlanner` is a
  hardcoded per-domain checklist, not an AI call)
- A trained/ML-based recommendation confidence model (today's
  `LearningEngine` is acceptance-rate counting, clamped to a fixed
  multiplier range)
- A first-class `'approval_gate'` `WorkflowStep` kind that can pause and
  resume a `WorkflowRunner` run across invocations — see
  `delegation/ApprovalWorkflow.ts`'s own "PHASE 5.0 TODO" note, which this
  module's approval bridge is also blocked on for any *workflow-integrated*
  (as opposed to dashboard/manual) mission step
- Push notifications when a Mission's linked ApprovalRequest resolves
  (`MissionApprovalBridge` only supports polling via `getTaskApprovalStatus`
  today; `ApprovalNotifications` is not wired into Mission Control)
- A scheduled Cloud Function trigger for `runMissionPlanningCycle` — today it
  is caller-invoked only (manual dashboard button or direct `onCall`),
  consistent with `schedulerCheckIntervalMs` being documented as
  "informational only (caller-driven)" in `MissionConfig.ts`
