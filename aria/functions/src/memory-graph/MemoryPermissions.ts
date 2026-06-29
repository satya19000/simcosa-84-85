import type { NodeType, EdgeType } from './MemoryTypes'

export type MemoryAction =
  | 'node:read'
  | 'node:create'
  | 'node:update'
  | 'node:delete'
  | 'edge:read'
  | 'edge:create'
  | 'edge:delete'
  | 'graph:rebuild'
  | 'graph:export'
  | 'analytics:read'

export interface MemoryPermissionSet {
  allowedActions: MemoryAction[]
  allowedNodeTypes?: NodeType[]    // undefined = all types
  allowedEdgeTypes?: EdgeType[]    // undefined = all types
  canPin: boolean
  canExport: boolean
}

export type MemoryRole = 'owner' | 'reader' | 'agent' | 'plugin'

const ROLE_PERMISSIONS: Record<MemoryRole, MemoryPermissionSet> = {
  owner: {
    allowedActions: [
      'node:read', 'node:create', 'node:update', 'node:delete',
      'edge:read', 'edge:create', 'edge:delete',
      'graph:rebuild', 'graph:export', 'analytics:read',
    ],
    canPin: true,
    canExport: true,
  },
  reader: {
    allowedActions: ['node:read', 'edge:read', 'analytics:read'],
    canPin: false,
    canExport: false,
  },
  agent: {
    allowedActions: ['node:read', 'node:create', 'node:update', 'edge:read', 'edge:create', 'analytics:read'],
    canPin: false,
    canExport: false,
  },
  plugin: {
    allowedActions: ['node:read', 'node:create', 'edge:read', 'edge:create'],
    canPin: false,
    canExport: false,
  },
}

export class MemoryPermissions {
  static getPermissions(role: MemoryRole): MemoryPermissionSet {
    return ROLE_PERMISSIONS[role]
  }

  static can(role: MemoryRole, action: MemoryAction): boolean {
    return ROLE_PERMISSIONS[role].allowedActions.includes(action)
  }

  static assertCan(role: MemoryRole, action: MemoryAction): void {
    if (!this.can(role, action)) {
      throw new Error(`Role "${role}" is not allowed to perform "${action}"`)
    }
  }
}
