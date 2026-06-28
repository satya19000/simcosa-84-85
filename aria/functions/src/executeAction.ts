import { onCall, HttpsError, type CallableRequest } from 'firebase-functions/v2/https'
import * as admin from 'firebase-admin'
import { ActionEngine } from './action-engine/ActionEngine'
import type { ActionResult } from './action-engine/ActionResult'

// Importing the index ensures all built-in actions are registered before any call arrives.
import './action-engine'

interface ExecuteActionRequest {
  toolName: string
  args: Record<string, unknown>
}

/**
 * Universal action execution endpoint.
 * Claude sends tool_name + args; this function routes through the Action Engine.
 * Claude NEVER writes to Firestore directly — all writes go through here.
 */
export const executeAction = onCall(
  { timeoutSeconds: 30, memory: '256MiB' },
  async (
    request: CallableRequest<ExecuteActionRequest>
  ): Promise<ActionResult> => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Authentication required.')
    }

    const { toolName, args } = request.data

    if (!toolName || typeof toolName !== 'string') {
      throw new HttpsError('invalid-argument', 'toolName must be a non-empty string.')
    }
    if (!args || typeof args !== 'object' || Array.isArray(args)) {
      throw new HttpsError('invalid-argument', 'args must be a plain object.')
    }

    const result = await ActionEngine.run({
      toolName,
      args,
      userId: request.auth.uid,
      userDisplayName: request.auth.token.name as string | undefined,
      db: admin.firestore(),
    })

    return result
  }
)
