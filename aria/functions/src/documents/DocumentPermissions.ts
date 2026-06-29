export type DocumentAction =
  | 'document:read'
  | 'document:upload'
  | 'document:update'
  | 'document:delete'
  | 'document:share'
  | 'document:export'
  | 'document:ocr'
  | 'document:summarize'
  | 'document:search'
  | 'document:index'
  | 'analytics:read'

export type DocumentRole = 'owner' | 'viewer' | 'agent' | 'plugin'

const ROLE_PERMISSIONS: Record<DocumentRole, DocumentAction[]> = {
  owner: [
    'document:read', 'document:upload', 'document:update', 'document:delete',
    'document:share', 'document:export', 'document:ocr', 'document:summarize',
    'document:search', 'document:index', 'analytics:read',
  ],
  viewer: ['document:read', 'document:search'],
  agent: ['document:read', 'document:search', 'document:summarize', 'analytics:read'],
  plugin: ['document:read', 'document:upload', 'document:search'],
}

export class DocumentPermissions {
  static can(role: DocumentRole, action: DocumentAction): boolean {
    return ROLE_PERMISSIONS[role].includes(action)
  }

  static assertCan(role: DocumentRole, action: DocumentAction): void {
    if (!this.can(role, action)) {
      throw new Error(`Role "${role}" cannot perform "${action}"`)
    }
  }

  static getActions(role: DocumentRole): DocumentAction[] {
    return [...ROLE_PERMISSIONS[role]]
  }
}
