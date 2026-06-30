"use strict";
// ── Workspace / Organization shared types ──────────────────────────────────────
Object.defineProperty(exports, "__esModule", { value: true });
exports.ROLE_ORDER = void 0;
/** Centralized ordering, lowest to highest privilege. Single source of truth — see WorkspacePermissions.ts */
exports.ROLE_ORDER = ['viewer', 'guest', 'staff', 'supervisor', 'manager', 'admin', 'owner'];
//# sourceMappingURL=WorkspaceTypes.js.map