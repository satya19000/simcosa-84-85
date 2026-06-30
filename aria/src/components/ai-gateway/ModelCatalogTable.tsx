import type { ModelDescriptor } from '../../lib/aiGatewayService'

export default function ModelCatalogTable({ models }: { models: ModelDescriptor[] }) {
  return (
    <div className="bg-white border rounded-lg overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-left text-gray-500">
          <tr>
            <th className="px-3 py-2">Model</th>
            <th className="px-3 py-2">Provider</th>
            <th className="px-3 py-2">Task Types</th>
            <th className="px-3 py-2">Quality</th>
            <th className="px-3 py-2">$/K in</th>
            <th className="px-3 py-2">$/K out</th>
            <th className="px-3 py-2">Latency</th>
            <th className="px-3 py-2">Context</th>
            <th className="px-3 py-2">Privacy</th>
          </tr>
        </thead>
        <tbody>
          {models.map((m) => (
            <tr key={m.modelId} className="border-t">
              <td className="px-3 py-2 font-medium">
                {m.displayName}
                {m.isPlaceholder && (
                  <span className="ml-2 text-xs text-amber-600 bg-amber-50 rounded px-1.5 py-0.5">placeholder</span>
                )}
              </td>
              <td className="px-3 py-2 capitalize">{m.provider}</td>
              <td className="px-3 py-2 text-xs text-gray-500">{m.taskTypes.join(', ')}</td>
              <td className="px-3 py-2">{m.qualityScore}</td>
              <td className="px-3 py-2">${m.costPerKInputTokens.toFixed(4)}</td>
              <td className="px-3 py-2">${m.costPerKOutputTokens.toFixed(4)}</td>
              <td className="px-3 py-2">{m.typicalLatencyMs} ms</td>
              <td className="px-3 py-2">{m.contextWindow.toLocaleString()}</td>
              <td className="px-3 py-2 capitalize">{m.privacyLevel}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
