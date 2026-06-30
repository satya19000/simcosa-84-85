export interface WorkspaceConfig {
  invitationExpiryMs: number
  maxMembersPerOrganization: number
  maxWorkspacesPerOrganization: number
}

export const DEFAULT_WORKSPACE_CONFIG: WorkspaceConfig = {
  invitationExpiryMs: 7 * 24 * 60 * 60 * 1000, // 7 days
  maxMembersPerOrganization: 500,
  maxWorkspacesPerOrganization: 100,
}
