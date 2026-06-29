import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { getFirestore } from 'firebase-admin/firestore'
import { getPluginRuntime, initializePlugins } from './plugins'

export const getPluginStatus = onCall(
  { secrets: [] },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Must be signed in')
    const userId = request.auth.uid
    const db = getFirestore()

    await initializePlugins(db, userId)
    const runtime = getPluginRuntime(db)

    const health = await runtime.getHealth(userId)
    const metrics = runtime.getAllMetrics()

    return { health, metrics }
  }
)
