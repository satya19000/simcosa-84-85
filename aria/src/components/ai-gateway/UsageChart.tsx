import type { AIUsageRecord } from '../../lib/aiGatewayService'

export default function UsageChart({ usage }: { usage: AIUsageRecord[] }) {
  const totalCost = usage.reduce((sum, u) => sum + u.estimatedCostUsd, 0)
  const totalTokens = usage.reduce((sum, u) => sum + u.inputTokens + u.outputTokens, 0)
  const failures = usage.filter((u) => !u.success).length
  const fallbacks = usage.filter((u) => u.fallbackUsed).length

  const byProvider = usage.reduce<Record<string, number>>((acc, u) => {
    acc[u.provider] = (acc[u.provider] ?? 0) + u.estimatedCostUsd
    return acc
  }, {})

  const maxCost = Math.max(...Object.values(byProvider), 0.0001)

  return (
    <div className="bg-white border rounded-lg p-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <Stat label="Total est. cost" value={`$${totalCost.toFixed(4)}`} />
        <Stat label="Total tokens" value={totalTokens.toLocaleString()} />
        <Stat label="Failures" value={failures} />
        <Stat label="Fallback events" value={fallbacks} />
      </div>

      <div className="space-y-2">
        {Object.entries(byProvider).map(([provider, cost]) => (
          <div key={provider} className="flex items-center gap-2">
            <span className="text-xs w-20 capitalize text-gray-600">{provider}</span>
            <div className="flex-1 bg-gray-100 rounded h-3 overflow-hidden">
              <div className="bg-blue-500 h-3" style={{ width: `${(cost / maxCost) * 100}%` }} />
            </div>
            <span className="text-xs text-gray-500 w-16 text-right">${cost.toFixed(4)}</span>
          </div>
        ))}
        {Object.keys(byProvider).length === 0 && <div className="text-xs text-gray-400">No usage recorded yet.</div>}
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div>
      <div className="text-lg font-bold text-blue-600">{value}</div>
      <div className="text-xs text-gray-500">{label}</div>
    </div>
  )
}
