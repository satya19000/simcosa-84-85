// Public API of the Action Engine
export { ActionEngine } from './ActionEngine'
export { registry } from './ActionRegistry'
export type { ActionResult, ActionError, ActionErrorCode } from './ActionResult'
export type { ActionContext } from './ActionContext'
export type { BaseAction, AuditRecord } from './BaseAction'
export {
  ActionEngineError,
  ValidationError,
  ToolNotFoundError,
  ExecutionError,
  PermissionError,
  RollbackError,
} from './Errors'

// Register all built-in actions by importing their modules.
// Each module self-registers via registry.register() at load time.
// To add a new action: create the file and import it here — nothing else changes.
import './actions/CreateTaskAction'
import './actions/CreateReminderAction'
import './actions/CompleteTaskAction'
import './actions/DeleteTaskAction'
import './actions/DeleteReminderAction'
import './actions/UpdateTaskAction'
import './actions/UpdateReminderAction'
import './actions/CreateContactAction'
import './actions/UpdateContactAction'
import './actions/DeleteContactAction'
import './actions/AddRelationshipNoteAction'
import './actions/SearchContactsAction'
import './actions/CreateOrganizationAction'
import './actions/UpdateOrganizationAction'
import './actions/CreateWorkspaceAction'
import './actions/InviteMemberAction'
import './actions/AcceptInvitationAction'
import './actions/RemoveMemberAction'
import './actions/AssignMissionAction'
import './actions/DelegateTaskAction'
import './actions/PostAnnouncementAction'
import './actions/CreateTenantAction'
import './actions/CreateRoleAction'
import './actions/AssignRoleAction'
import './actions/RevokeRoleAction'
import './actions/CreatePolicyAction'
import './actions/UpdatePolicyAction'
import './actions/RevokeSessionAction'
import './actions/CreateGroupAction'
import './actions/AddGroupMemberAction'
import './actions/RemoveGroupMemberAction'
