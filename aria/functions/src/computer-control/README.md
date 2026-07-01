# Computer Control Foundation (Phase 5.5 + 5.6)

**Status: Foundation/Architecture Phase**

This module provides the architecture for safe, permissioned, approval-gated
computer/browser task assistance. It is explicitly NOT a working automation
system — it is the safety, permission, and approval scaffolding upon which
real computer control can be built.

## Architecture

```
ComputerControlEngine (facade)
├── ComputerCapabilityRegistry   — all 22 capabilities with metadata
├── ComputerSafetyGuard          — hard-block layer (credentialAccess ALWAYS blocked)
├── ComputerPermissions          — thin adapter over real RBACEngine
├── ComputerApprovalBridge       — ONLY path to real ApprovalEngine
├── ComputerPolicyEngine         — per-tenant capability policy
├── ComputerAudit                — append-only audit log
├── ComputerSessionManager       — session scoping
├── ComputerActionPlanner        — PROPOSED plans only, never auto-execute
├── ComputerActionExecutor       — executes via provider ONLY after full gate checks
├── ComputerAgent                — orchestrator (plan → approve → execute)
├── BrowserAgent                 — browser-context specialization
├── DesktopAgent                 — desktop-context specialization (PLACEHOLDER)
├── LocalBridge                  — local desktop agent handshake (PLACEHOLDER)
└── BrowserBridge                — browser extension handshake (PLACEHOLDER)
```

## Provider Model

Six providers are registered. Only **web-pwa** is semi-functional:

| Provider | Status | Description |
|---|---|---|
| `web-pwa` | Semi-functional | Web app operations: openUrl, copyToClipboard, uploadFileWithUserPicker, readVisiblePage, summarizeVisiblePage, searchWeb |
| `browser-extension` | **PLACEHOLDER** | Requires a browser extension that does not yet exist |
| `desktop-agent` | **PLACEHOLDER** | Requires a native agent binary that does not yet exist |
| `electron` | **PLACEHOLDER** | Not implemented |
| `tauri` | **PLACEHOLDER** | Not implemented |
| `native-os` | **PLACEHOLDER** | Not implemented |

All placeholder providers return a structured `{ success: false, notImplemented: true, error: '...' }` response and never throw unhandled errors.

## Capability Model

22 capabilities are registered. Key properties:

| Capability | Risk | Approval Required | Reversible | Notes |
|---|---|---|---|---|
| readVisiblePage | low | No | Yes | |
| summarizeVisiblePage | low | No | Yes | |
| openUrl | low | No | Yes | |
| searchWeb | low | No | Yes | |
| copyToClipboard | low | No | Yes | |
| pasteFromClipboard | medium | **Yes** | Yes | |
| readClipboard | medium | **Yes** | Yes | |
| uploadFileWithUserPicker | low | No | Yes | User controls file picker |
| downloadFileWithUserApproval | medium | **Yes** | Yes | |
| screenshotWithApproval | medium | **Yes** | Yes | Never silent |
| ocrScreenshot | medium | **Yes** | Yes | |
| listBrowserTabs | medium | **Yes** | Yes | PLACEHOLDER |
| switchTab | medium | **Yes** | Yes | PLACEHOLDER |
| openApp | medium | **Yes** | Yes | PLACEHOLDER |
| createFile | medium | **Yes** | Yes | PLACEHOLDER |
| moveFile | medium | **Yes** | Yes | PLACEHOLDER |
| renameFile | medium | **Yes** | No | PLACEHOLDER |
| deleteFile | **high** | **Yes** | **No** | Irreversible |
| sendMessage | **high** | **Yes** | **No** | Irreversible |
| submitForm | **high** | **Yes** | **No** | Irreversible |
| paymentAction | **critical** | **Yes** | **No** | Policy-blocked by default |
| credentialAccess | **critical** | N/A | **No** | **ALWAYS BLOCKED — no bypass** |

## Permission Model

Computer capabilities map to existing RBAC `PermissionAction` types:

- Sensitive capabilities (screenshot, file delete, forms, network) → `security.manage`
- File/browser/app capabilities → `documents.write`
- Low-risk capabilities (read, open URL, clipboard write) → `tasks.write`

Default deny: users must be granted these permissions via the RBAC engine before
any capability can execute.

## Approval Model

All medium/high/critical actions go through `ComputerApprovalBridge`, which calls
the **real** `ApprovalEngine.createApprovalRequest`. No parallel approval mechanism
exists. Actions may not execute until the `ApprovalRequest.status === 'approved'`
through the genuine approval flow.

Actions that always require approval:
- deleteFile, sendMessage, submitForm, paymentAction
- screenshotWithApproval, ocrScreenshot, readClipboard, pasteFromClipboard
- downloadFileWithUserApproval, listBrowserTabs, switchTab, openApp
- createFile, moveFile, renameFile

## Safety Guardrails

`ComputerSafetyGuard` implements unconditional hard-blocks:

**ALWAYS BLOCKED (no code path can allow these):**
- `credentialAccess` — passwords, cookies, tokens, private keys
- Password extraction
- Cookie/session token extraction  
- Private key extraction
- Login bypass
- CAPTCHA bypass
- Stealth browsing
- Hidden execution
- Unauthorized monitoring
- Silent screenshots (screenshots require explicit approval)
- Silent clipboard reading
- Malware-like persistence
- Privilege escalation
- Keylogging

**Policy-blocked by default:**
- `paymentAction` — blocked unless explicitly overridden in tenant policy

## Execution Gate (5 checks before any provider call)

1. `ComputerSafetyGuard.assertSafe(capabilityId)` — hard-block
2. `ComputerPermissions.requireCapabilityPermission(...)` — RBAC check
3. For medium/high/critical: `ComputerApprovalBridge.getApprovalStatus(...)` — must be `approved`
4. `ComputerSafetyGuard.assertApprovalState(...)` — secondary approval guard
5. `provider.execute(...)` — only if all above pass

## Local Agent Design (Placeholder)

Fields: `deviceId, userId, tenantId, publicKey, sessionId, capabilityGrant, expiresAt, revokedAt, healthStatus`

Future implementation plan:
1. Build a native desktop app (Electron/Tauri) with a local HTTP/WebSocket server
2. Mutual authentication using the registered public key
3. Capability grants controlled by ARIA server
4. All actions still routed through approval bridge
5. No agent can execute capabilities not in its `capabilityGrant`

Firestore path: `tenants/{tenantId}/computerAgents/{agentId}`

## Browser Extension Design (Placeholder)

Fields: `extensionId, browserName, version, grantedCapabilities, activeTabAccess, permissionStatus, lastSeenAt`

Future implementation plan:
1. Publish a Chrome/Firefox/Safari extension
2. Extension registers with ARIA server using OAuth token
3. Tab access and screenshot capture only with explicit user approval
4. All DOM interaction proposals surfaced as action plans for user review
5. Extension cannot execute capabilities not in `grantedCapabilities`

Firestore path: `tenants/{tenantId}/browserExtensions/{extensionId}`

## Firestore Collections

All collections are under `tenants/{tenantId}/...` and Cloud-Functions-write-only:

- `computerAgents/{agentId}` — local agent registrations
- `computerSessions/{sessionId}` — computer control sessions
- `computerActions/{actionId}` — planned/executed actions
- `computerApprovals/{approvalId}` — approval records
- `computerAudit/{auditId}` — append-only audit log
- `browserExtensions/{extensionId}` — browser extension registrations
- `computerPolicies/{policyId}` — per-tenant capability policies

## Cloud Functions

All functions verify `request.auth` and tenant membership before operating:

- `listComputerCapabilities` — list all capabilities with metadata
- `planComputerAction` — create a proposed plan (never auto-executes)
- `requestComputerApproval` — request approval via real ApprovalEngine
- `registerLocalAgent` — register a local agent (placeholder)
- `revokeLocalAgent` — revoke a local agent
- `listLocalAgents` — list registered agents
- `registerBrowserExtension` — register a browser extension (placeholder)
- `revokeBrowserExtension` — revoke a browser extension
- `listBrowserExtensions` — list registered extensions
- `logComputerActionResult` — write an audit event for an executed action

## Manual Tests

1. **List capabilities** — `listComputerCapabilities()` should return 22 capabilities including `credentialAccess` with `alwaysBlocked: true`
2. **Plan safe action** — `planComputerAction(tenantId, "search for ARIA documentation")` should return a proposed plan with `searchWeb` step, status `proposed`
3. **Plan medium-risk action** — `planComputerAction(tenantId, "take a screenshot")` should return a plan with `screenshotWithApproval`, `requiresApproval: true`
4. **Plan blocked action** — `planComputerAction(tenantId, "extract saved passwords")` should throw a `ComputerSafetyError` with code `PASSWORD_EXTRACTION_BLOCKED`
5. **Confirm blocked refused** — `requestComputerApproval` for `credentialAccess` should throw `permission-denied` (blocked by `ComputerSafetyGuard` before ApprovalBridge)
6. **Register local agent** — `registerLocalAgent(tenantId, uid, { deviceId: "test", publicKey: "pk", capabilityGrant: [] })` should return a record with `_placeholder: true`
7. **Register browser extension** — `registerBrowserExtension(tenantId, uid, { browserName: "Chrome", version: "1.0", grantedCapabilities: [] })` should return a record with `_placeholder: true`
8. **Request approval** — `requestComputerApproval({ tenantId, planId, stepIndex: 0, capabilityId: "screenshotWithApproval", ... })` should create a real `ApprovalRequest` via `ApprovalEngine.createApprovalRequest`
9. **Verify Approval Engine used** — Check Firestore `users/{userId}/approvalRequests/{id}` for the created request
10. **Verify audit event** — Check Firestore `tenants/{tenantId}/computerAudit/{auditId}` for `approval.requested` event
11. **Verify no direct execution bypass** — `ComputerActionExecutor.executeStep` without a valid `approvalRequestId` in `approved` status should return `{ success: false, error: "..." }` without calling any provider

## Future Desktop Implementation Plan

Phase 5.6 or later:
1. Build ARIA Desktop Agent (Electron or Tauri)
2. Implement mutual auth with public key challenge/response
3. Implement OS-level capabilities: file system, app launching, screen capture
4. Full approval-gated execution pipeline
5. Heartbeat and health monitoring
6. Revocation and session management

Phase 5.7+:
1. Browser extension for Chrome/Firefox/Safari
2. Tab management, DOM reading, form assistance
3. Screenshot and OCR with approval
4. Cross-browser compatibility

## Observability Events

Events logged to `computerAudit`: `action.planned`, `action.approved`, `action.blocked`, `action.executed`, `capability.denied`, `safety_guard.triggered`, `agent.registered`, `agent.revoked`, `extension.registered`, `extension.revoked`, `session.created`, `session.revoked`, `approval.requested`.

**Sensitive content is NEVER logged** — only metadata (capability IDs, risk levels, user IDs, tenant IDs, plan IDs).

---

## Phase 5.6 Additions

### Execution Pipeline (`ComputerExecutionPipeline`)
Orchestrates the full flow: intent → planner → safety guard → approval bridge (if required) → provider execution → document bridge (if file involved) → AI Gateway (if summary/analysis needed) → audit → result. No stage may be skipped.

### Document Bridge (`ComputerDocumentBridge`)
Bridges file selection (user-initiated browser picker only) to Document Intelligence and AI Gateway:
- `fileSelectedByUser` — accepts user-provided file content, never silently reads files
- `requestDocumentSummary` — routes through AI Gateway (`chatWithAriaGateway` or `analyzeSelectedDocument`)
- `extractActionItems` — structured extraction of action items from documents
- `suggestDocumentToTask` / `suggestDocumentToReminder` — returns suggestions ONLY; auto-creation is never performed

### Download Manager (`ComputerDownloadManager`)
`downloadFileWithUserApproval`: shows file name/type/source before any download, requires an approved `ComputerApprovalBridge` record, audits the event to `computerGeneratedFiles`.

### File Picker Plan (`ComputerFilePickerPlan`)
Generates a safe step-by-step plan: choose file (browser `<input type="file">`) → analyze with ARIA → summarize → extract action items → suggest task (approval required). Never silently accesses local files.

### Audit Stream (`ComputerAuditStream`)
Real-time paginated read of `tenants/{tenantId}/computerAudit` ordered by timestamp desc. Frontend `LiveComputerAuditFeed` component polls this and color-codes events by type (blocked/safety_guard = red; approval_requested = yellow; executed = green; planned = blue).

### Execution Validator (`ComputerExecutionValidator`)
Additional pre-execution gate: validates plan exists, approval record is `approved` and matches the action, and capability has not been revoked since approval was granted.

### ElectronDesktopProvider (Placeholder)
All methods return `{ success: false, notImplemented: true }`. No real OS-level control is implemented. See future implementation plan above.

### Web PWA Provider Enhancements
Functional: `openUrl`, `copyToClipboard` (user-visible confirmation), `uploadFileWithUserPicker`, `downloadFileWithUserApproval` (via DownloadManager).
Structured placeholder (not functional): `summarizeVisiblePage`, `screenshotWithApproval`.
All Phase 5.5 hard-blocks remain unchanged.

### New Cloud Functions
`executeApprovedComputerAction`, `analyzeSelectedDocument`, `generateComputerActionSummary`, `getComputerAuditFeed`, `downloadGeneratedFileWithApproval` — all require auth and tenant identity check.

### New Firestore Collections
`tenants/{tenantId}/computerDocuments/{documentId}`, `tenants/{tenantId}/computerGeneratedFiles/{fileId}` — both deny-by-default client access (CF/Admin SDK only).

### Safety Invariants (unchanged from Phase 5.5)
- `credentialAccess`: unconditionally blocked in `ComputerSafetyGuard` at line 32 — no code path bypasses this
- No silent screenshot, clipboard read, file access, background monitoring, auto-submit, or payment automation
- `ComputerApprovalBridge` remains the ONLY path to `ApprovalEngine.createApprovalRequest`
