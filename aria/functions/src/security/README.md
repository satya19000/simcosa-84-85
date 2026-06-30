# Enterprise Identity, Security & Multi-Tenant Platform — Phase 5.2

The Security module turns ARIA into a multi-tenant platform with centralized
identity, RBAC, policy, session, and audit infrastructure. A **Tenant** is
the top-level security boundary (`personal`, `organization`, `enterprise`,
`government`, `healthcare`, `education`); an **Identity** is a
tenant-scoped actor (`personal_user`, `organization_member`, `guest`,
`service_account`, `bot_account`, `super_admin`); **Roles** carry a closed
vocabulary of **Permissions**, resolved through inheritance; **Policies**
govern specific actions with one of five results
(`allow`/`deny`/`requireApproval`/`requireElevatedRole`/`auditOnly`); and
every sensitive operation is recorded to an append-only **Security Audit**
log. It is purely additive: it never duplicates `OrganizationEngine`'s
storage or `ApprovalEngine`'s approval logic — it composes/bridges to them.

## Architecture

```
SecurityEngine (facade, per-user singleton via index.ts getSecurityEngine)
├── TenantEngine          Firestore CRUD for Tenants; owns the tenant-membership gate
│                         (requireIdentity) that every other Manager calls first
├── IdentityEngine        Firestore CRUD for Identities within a tenant
├── RoleManager           Firestore CRUD for Roles + RoleAssignments; resolves
│                         effective permissions through inheritance (cycle-safe)
├── PermissionManager     Computes an identity's effective permission set
├── RBACEngine            can() / requirePermission() / requireRole() — the ONLY
│                         place permission/role checks are interpreted
├── PolicyEngine          createPolicy/updatePolicy/evaluate(); the ONLY path from
│                         a `requireApproval` policy result to a real ApprovalRequest
│                         (via the injected ApprovalEngine — never bypassed)
├── SessionManager        Login/session tracking (device, browser, IP/location —
│                         IP and location are PLACEHOLDER fields, see below)
├── GroupManager          Firestore CRUD for Groups; member + role-to-group assignment
├── UserDirectory         Read-through composition over organization/MemberManager
│                         and organization/InvitationManager (no duplicated storage);
│                         also owns ServiceAccount creation/listing/revocation
├── SecurityAudit         Append-only audit log — no update/delete methods exist
├── SecurityAnalytics     Read-only stats rollup (identity/role/policy/session/audit counts)
├── SecurityValidator     Static input validators used by securityApi.ts
└── SecurityLogger        Structured console logger, mirrors WorkspaceLogger.ts
```

`SecurityConfig.ts` holds `DEFAULT_SYSTEM_ROLES` (seeded into every new
tenant: `tenant_owner`, `tenant_admin`, `workspace_manager`, `member`,
`viewer`) and `DEFAULT_SECURITY_CONFIG`. `SecurityTypes.ts` holds the full
closed vocabulary: `PermissionAction` (18 actions — `organization.read/manage`,
`workspace.read/manage`, `members.invite/remove`, `tasks.read/write`,
`missions.read/write`, `approvals.read/approve`, `documents.read/write`,
`plugins.install`, `security.manage`, `audit.read`, `billing.manage`),
`TenantType`, `IdentityType`, `RoleScope`, `PolicyResult`. `SecurityEvents.ts`
holds the `SecurityEventType` constants used for audit entries.

## APIs

All Cloud Functions are `onCall` exports defined in
`aria/functions/src/securityApi.ts` and re-exported from
`aria/functions/src/index.ts`:

`createTenant`, `getTenant`, `listMyTenants`, `createIdentity`,
`listIdentities`, `checkPermission`, `createRole`, `listRoles`,
`assignRole`, `revokeRoleAssignment`, `createPolicy`, `updatePolicy`,
`listPolicies`, `evaluatePolicy`, `createSession`, `refreshSession`,
`revokeSession`, `listSessions`, `createGroup`, `listGroups`,
`addGroupMember`, `removeGroupMember`, `assignRoleToGroup`,
`createServiceAccount`, `listServiceAccounts`, `getDirectoryView`,
`listAuditEvents`, `getSecurityAnalytics`.

The frontend client is `aria/src/lib/securityService.ts`, consumed by
`aria/src/pages/devtools/SecurityDashboard.tsx` (`/devtools/security`) and
the `aria/src/components/security/*` presentational components (`RoleList`,
`PermissionMatrix`, `PolicyList`, `SessionList`, `SecurityAuditFeed`).

Ten new self-registering Action Engine actions live in
`aria/functions/src/action-engine/actions/`: `CreateTenantAction`,
`CreateRoleAction`, `AssignRoleAction`, `RevokeRoleAction`,
`CreatePolicyAction`, `UpdatePolicyAction`, `RevokeSessionAction`,
`CreateGroupAction`, `AddGroupMemberAction`, `RemoveGroupMemberAction` — each
a thin wrapper around the corresponding `SecurityEngine` method, imported
once in `action-engine/index.ts`.

## Firestore schema

All collections are scoped under `tenants/{tenantId}/...`:

- `tenants/{tenantId}` — `TenantRecord` document itself
- `tenants/{tenantId}/identities` — `IdentityRecord` documents
- `tenants/{tenantId}/roles` — `RoleRecord` documents (includes seeded system roles)
- `tenants/{tenantId}/roleAssignments` — `RoleAssignmentRecord` documents
- `tenants/{tenantId}/policies` — `PolicyRecord` documents
- `tenants/{tenantId}/sessions` — `SessionRecord` documents
- `tenants/{tenantId}/groups` — `GroupRecord` documents
- `tenants/{tenantId}/serviceAccounts` — `ServiceAccountRecord` documents
- `tenants/{tenantId}/securityAudit` — `SecurityAuditRecord` documents (append-only)

## No bypass / no cross-tenant access — verified by reading the code

**No cross-tenant access** (`TenantEngine.requireIdentity`): every method on
`TenantEngine`, `IdentityEngine`, `RoleManager`, `PermissionManager`,
`RBACEngine`, `PolicyEngine`, `SessionManager`, and `GroupManager` that reads
or writes anything under `tenants/{tenantId}/**` calls
`this.tenants.requireIdentity(tenantId, actorUserId)` first — confirmed by
direct inspection of every method body in those files. `requireIdentity`
throws `Access denied: user ${userId} has no identity in tenant ${tenantId}`
if the caller has no `IdentityRecord` in that tenant, and `securityApi.ts`'s
`wrapEngineError` maps any `Access denied` substring to an HTTP
`permission-denied` error. The two methods that intentionally skip this
check are `TenantEngine.createTenant` (nothing to check membership against
yet — the caller becomes the tenant's `tenant_owner` identity as part of the
same `SecurityEngine.createTenant` call) and
`IdentityEngine.createFirstIdentity` (the bootstrap identity created
immediately after tenant creation, before any identity exists to check
against). `TenantEngine.listTenantsForOwner` is scoped by `ownerId ==
userId` at the query level, so it cannot surface another user's tenants.

**No approval bypass** (`PolicyEngine.requestApprovalForPolicy`):
`PolicyEngine`'s only path from a `requireApproval` policy result to an
actual approval workflow is `this.approvalEngine.createApprovalRequest`,
where `approvalEngine: ApprovalEngine` is injected into `SecurityEngine`'s
constructor from `../delegation` (never constructed internally) — mirroring
`DelegationManager`'s pattern in the organization module exactly.
`PolicyEngine` never invents its own approval mechanism, risk score, or
execution path.

**No duplicated permission logic**: only `RBACEngine` and `PermissionManager`
interpret roles/permissions. `PolicyEngine.evaluate` calls
`this.rbac.can(...)` rather than re-deriving permissions itself.
`SecurityEngine`'s own methods call `this.rbac.requirePermission(...)`
before mutating roles/policies/identities — they never hardcode a role or
permission check inline.

**No raw Firestore writes outside Manager/Action classes**: every
`db.collection(...).doc(...).set/update(...)` call in the module lives
inside a Manager class (`TenantEngine`, `IdentityEngine`, `RoleManager`,
`PolicyEngine`, `SessionManager`, `GroupManager`, `SecurityAudit`,
`UserDirectory`). `SecurityEngine` and the Action Engine actions only ever
call into these Managers; they hold no `Firestore` writes of their own.

**`OrganizationEngine.ts` is unmodified**: this module's `UserDirectory`
reads through `organization/MemberManager.list(organizationId)` and
`organization/InvitationManager.list(organizationId)` (constructed locally
inside `UserDirectory`'s own constructor) rather than touching
`OrganizationEngine` at all — `OrganizationEngine.ts` has zero diff from
before Phase 5.2 (verify with `git diff` against the Phase 5.1 commit).

## Session placeholders — explicitly NOT real geolocation

`SessionRecord.ipAddress` and `SessionRecord.location` are documented in
`SecurityTypes.ts` as **PLACEHOLDER ONLY** fields. `SessionManager` accepts
whatever string the caller passes (typically nothing, or a value the client
chooses to send) and stores it verbatim — there is no IP-to-geolocation
lookup, no request-IP capture from the Cloud Function context, and no
device-fingerprinting. Treat these fields as inert until a real geolocation
/ IP-capture integration is built.

## Implemented today vs deferred (do not assume otherwise)

**Implemented today:**
- Tenant lifecycle (create/get/list-for-owner), creator auto-becomes
  `tenant_owner` identity with system roles seeded
- Identity CRUD scoped to a tenant, gated by `requireIdentity`
- Role CRUD with inheritance (`inheritsFrom`) resolved recursively and
  cycle-safely; role assignment with optional `scope`/`scopeId`,
  `expiresAt` (temporary roles), and `delegatedBy` (delegated roles)
- Centralized RBAC (`can`/`requirePermission`/`requireRole`) over the closed
  18-action permission vocabulary
- Policy CRUD + evaluation with priority resolution
  (`deny` > `requireApproval` > `requireElevatedRole` > `auditOnly` > `allow`)
  and a real bridge to `ApprovalEngine` for `requireApproval` results
- Session create/refresh/revoke/list (device/browser placeholders only — see above)
- Group CRUD, member add/remove, role-to-group assignment
- User Directory read-through to organization Members/Invitations; Service
  Account creation/listing/revocation
- Append-only Security Audit log covering every mutating `SecurityEngine` method
- Security Analytics snapshot (identity/role/policy/session/audit counts)
- 10 self-registering Action Engine actions wired into the action registry
- `/devtools/security` dashboard (tenant picker, roles, permission matrix,
  policies, sessions with revoke, audit feed, analytics stat tiles)

**Deferred (explicitly NOT implemented — do not assume otherwise):**
- Real IP-based geolocation or device fingerprinting for sessions
  (`ipAddress`/`location` are placeholder fields only, see above)
- Workspace-scoped (as opposed to tenant-scoped) fine-grained permission
  overrides beyond the existing `RoleScope` field on role assignments
- Automatic session expiry/cleanup background job (sessions are only marked
  inactive on explicit `revokeSession`, not on a TTL)
- UI for creating/editing roles, policies, or groups from the dashboard
  (the dashboard is read-focused plus tenant creation and session revoke;
  role/policy/group mutation today happens via Action Engine tools or direct
  `onCall` invocation, not dashboard forms)
- Bot account / super admin onboarding flows beyond the raw `IdentityType`
  enum values existing in the type system
- Per-tenant Firestore security rules finer than "deny all client access" —
  `firestore.rules` adds an explicit deny-by-design block for
  `tenants/{tenantId}/**` (all reads/writes go through `onCall` Cloud
  Functions using the Admin SDK, which bypasses rules); no client-side
  real-time listeners are supported against this tree today
