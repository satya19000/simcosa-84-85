import type { AIUsageRecord } from '../../lib/aiGatewayService'

/**
 * Renders fallback activity derived from recent usage records
 * (`fallbackUsed` flag). The backend also persists a dedicated
 * tenants/{tenantId}/aiFallbackEvents log (see ModelFallbackManager) for
 * deeper auditing; this view focuses on the dashboard's at-a-glance signal
 * using data already fetched for the Usage tab to avoid a second round trip.
 */
export default function FallbackChainView({ usage }: { usage: AIUsageRecord[] }) {
  const fallbackEvents = usage.filter((u) => u.fallbackUsed)

  return (
    <div className="bg-white border rounded-lg p-4">
      <h3 className="font-semibold mb-3">Recent Fallback Activity</h3>
      {fallbackEvents.length === 0 ? (
        <div className="text-xs text-gray-400">No fallback events in the recent usage window.</div>
      ) : (
        <table className="w-full text-xs">
          <thead className="text-left text-gray-500">
            <tr>
              <th className="py-1 pr-2">Time</th>
              <th className="py-1 pr-2">Provider</th>
              <th className="py-1 pr-2">Model</th>
              <th className="py-1 pr-2">Task</th>
              <th className="py-1 pr-2">Success</th>
            </tr>
          </thead>
          <tbody>
            {fallbackEvents.map((e) => (
              <tr key={e.usageId} className="border-t">
                <td className="py-1 pr-2">{new Date(e.timestamp).toLocaleString()}</td>
                <td className="py-1 pr-2 capitalize">{e.provider}</td>
                <td className="py-1 pr-2">{e.model}</td>
                <td className="py-1 pr-2">{e.taskType}</td>
                <td className="py-1 pr-2">{e.success ? 'yes' : 'no'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
