# Organization, Team Collaboration & Multi-User Workspace — Phase 5.1

The Organization module turns ARIA from a single-user assistant into a
multi-tenant collaboration platform. An **Organization** is the top-level
tenant boundary (personal, team, department, hospital, government office, or
enterprise); **Workspaces** are sub-groups within an organization; **Members**
hold one role per organization (`owner` > `admin` > `manager` > `supervisor`
> `staff` > `guest`/`viewer`, read-only at the bottom). It is purely
additive: it never duplicates Mission Control or Approval Engine business
logic — it composes them through narrow bridges and routes every risky
action through the real `ApprovalEngine`, never around it.

## Architecture

```
OrganizationEngine (facade, per-user singleton via index.ts getOrganizationEngine)
├── OrganizationManager      Firestore CRUD for Organizations
├── WorkspaceManager         Firestore CRUD for Workspaces
├── MemberManager            Firestore CRUD for Members, role/workspace assignment
├── InvitationManager        Firestore CRUD for Invitations, expiry/accept/revoke
├── ActivityFeed             Append-only activity log + announcements (organization/workspace scoped)
├── DelegationManager        The ONLY path from a SharedTask to a real ApprovalRequest,
│                            and the bridge to Mission Control for shared missions
├── OrganizationAnalytics    Stats rollups (member/workspace counts, shared mission/task counts, pending approvals)
├── WorkspacePermissions     Single source of truth for membership/role checks — see "No bypass" below
├── WorkspacePolicies        Config-driven limits (max workspaces, max members, invitation expiry)
├── WorkspaceNotifications   Best-effort push/in-app notifications (invited, joined, mission assigned, task delegated, announcement)
├── WorkspaceValidator       Static input validators used by organizationApi.ts before touching OrganizationEngine
└── WorkspaceLogger          Structured console logger, mirrors MissionLogger.ts/ApprovalLogger.ts
```

`WorkspaceConfig.ts` / `WorkspaceTypes.ts` hold shared config and types.
There is no separate `WorkspaceQueue`/`WorkspaceScheduler`/
`WorkspaceExecution` class file — Organization never executes risky actions
itself; `ApprovalEngine` (via `DelegationManager`) owns execution and
rollback, and `MissionEngine` (via the same bridge) owns mission execution.

## APIs

All Cloud Functions are `onCall` exports defined in
`aria/functions/src/organizationApi.ts` and re-exported from
`aria/functions/src/index.ts`:

`createOrganization`, `getOrganization`, `updateOrganization`,
`listMyOrganizations`, `createWorkspace`, `getWorkspace`, `listWorkspaces`,
`listMembers`, `removeMember`, `changeMemberRole`, `inviteMember`,
`listInvitations`, `acceptInvitation`, `revokeInvitation`, `listActivity`,
`postAnnouncement`, `assignMissionToWorkspace`, `listSharedMissions`,
`delegateTask`, `listSharedTasks`, `requestSharedApproval`,
`getSharedTaskApprovalStatus`, `getOrganizationAnalytics`.

The frontend client is `aria/src/lib/organizationService.ts`, consumed by
`aria/src/pages/Organization.tsx` (`/organization`,
`/organization/:organizationId`) and `aria/src/pages/Workspace.tsx`
(`/organization/:organizationId/workspace/:workspaceId`), plus the
`aria/src/components/organization/*` presentational components. A shortcut
to `/organization` is linked from `aria/src/pages/Profile.tsx`.

## Firestore schema

All collections are scoped under `organizations/{organizationId}/...` (a
deliberately different top-level root from the single-user
`users/{userId}/...` tree used by every other Phase 4.x/5.0 module, since an
Organization is shared by multiple `userId`s):

- `organizations/{organizationId}` — `OrganizationRecord` document itself
- `organizations/{organizationId}/workspaces` — `WorkspaceRecord` documents
- `organizations/{organizationId}/members` — `MemberRecord` documents (queried by `userId`)
- `organizations/{organizationId}/invitations` — `InvitationRecord` documents
- `organizations/{organizationId}/activity` — `ActivityRecord` documents (includes `announcement_posted` entries)
- `organizations/{organizationId}/sharedMissions` — `SharedMissionRecord` documents (link to a `users/{userId}/missions/{missionId}` Mission)
- `organizations/{organizationId}/sharedTasks` — `SharedTaskRecord` documents (link to an `ApprovalRequest.id` when approval is requested)

## No bypass / no cross-tenant access — verified by reading the code

**No cross-organization access** (`WorkspacePermissions.ts`): every method on
`OrganizationEngine` that reads or writes anything under
`organizations/{organizationId}/**` calls `this.permissions.requireMember`,
`requireRole`, or `requireWriter` first — confirmed line by line for
`getOrganization`, `updateOrganization`, `createWorkspace`, `getWorkspace`,
`listWorkspaces`, `listMembers`, `removeMember`, `changeMemberRole`,
`inviteMember`, `listInvitations`, `revokeInvitation`, `listActivity`,
`postAnnouncement`, `assignMissionToWorkspace`, `listSharedMissions`,
`delegateTask`, `listSharedTasks`, `requestApprovalForSharedTask`,
`getSharedTaskApprovalStatus`, and `getAnalytics`. The two methods that
intentionally skip a membership check are `createOrganization` (nothing to
check membership against yet — the caller becomes the first `owner` member
as part of the same call) and `acceptInvitation` (a person accepting an
invite is by definition not yet a member; instead it verifies the invitation
document itself: status `pending`, not expired, and the caller isn't already
a member). `listMyOrganizations` takes caller-supplied candidate IDs (e.g.
from a denormalized profile doc) but still calls `permissions.isMember` for
each one before including it in the result — a candidate ID never grants
access by itself.

**No approval bypass** (`DelegationManager.ts`): `OrganizationEngine`'s
shared-approval methods (`requestApprovalForSharedTask`,
`getSharedTaskApprovalStatus`) call only into `DelegationManager`, which in
turn calls the real `ApprovalEngine.createApprovalRequest` /
`ApprovalEngine.getApprovalRequest` (injected into `OrganizationEngine`'s
constructor from `../delegation`, never constructed internally) — mirroring
`MissionApprovalBridge`'s pattern exactly. `OrganizationEngine` never
invents its own risk score or executes a shared task directly; it only
records the resulting `approvalRequestId` onto the `SharedTaskRecord`.

## Mission Control integration

`OrganizationEngine.assignMissionToWorkspace` ->
`DelegationManager.assignMissionToWorkspace` reads/links an existing
`MissionEngine`-owned Mission (injected the same way as `ApprovalEngine`) to
a workspace and a set of assigned member IDs; it never creates or mutates
the underlying Mission's tasks or status itself — `MissionEngine` remains
the sole owner of Mission lifecycle.

## Implemented today vs Phase 5.2 TODO

**Implemented today:**
- Organization lifecycle (create/get/update/list), creator auto-added as `owner`
- Workspace CRUD scoped to an organization, gated by `WorkspacePolicies` limits
- Member list/remove/role-change, all role-gated through `WorkspacePermissions`
- Invitation lifecycle (invite/list/accept/revoke) with expiry handling
- Activity feed + announcements, organization- or workspace-scoped
- Shared Mission assignment (bridge to Mission Control, no duplicated logic)
- Shared Task delegation + approval request bridge (bridge to Approval Engine, no bypass)
- Organization analytics snapshot (member/workspace/mission/task/approval counts)
- Best-effort notifications and Memory Graph linking on organization creation

**Phase 5.2 TODO (explicitly NOT implemented — do not assume otherwise):**
- Real-time presence / who's-online indicators within a workspace
- Threaded comments or @mentions on shared tasks/missions (the
  `comment_posted` / `mention_created` `ActivityEventType` values exist in
  `WorkspaceTypes.ts` but no code path emits them yet)
- Per-workspace (as opposed to per-organization) granular permission
  overrides — today a member's role is organization-wide
- Firestore security rules for the `organizations/{organizationId}/**` tree:
  consistent with every other Phase 4.x/5.0 module, all reads/writes go
  through `onCall` Cloud Functions using the Admin SDK (which bypasses
  rules), and `firestore.rules`'s existing catch-all `match
  /{document=**} { allow read, write: if false }` already denies any direct
  client SDK access to this tree — no explicit organization rules block was
  added, matching the precedent set by `missions`, `approvalRequests`, etc.
