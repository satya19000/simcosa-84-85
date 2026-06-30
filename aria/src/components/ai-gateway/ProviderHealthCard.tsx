import type { ProviderHealthRecord, AIProviderId } from '../../lib/aiGatewayService'

const STATUS_COLOR: Record<string, string> = {
  closed: 'bg-green-100 text-green-700',
  half_open: 'bg-yellow-100 text-yellow-700',
  open: 'bg-red-100 text-red-700',
}

interface Props {
  providerId: AIProviderId
  record: ProviderHealthRecord | null
  busy: boolean
  onTest: (providerId: AIProviderId) => void
}

export default function ProviderHealthCard({ providerId, record, busy, onTest }: Props) {
  const isLocalPlaceholder = providerId === 'local'

  return (
    <div className="bg-white border rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="font-semibold capitalize">{providerId}</span>
        <span
          className={`text-xs px-2 py-0.5 rounded-full ${
            record ? STATUS_COLOR[record.circuitBreakerStatus] ?? 'bg-gray-100 text-gray-600' : 'bg-gray-100 text-gray-500'
          }`}
        >
          {record?.circuitBreakerStatus ?? 'unknown'}
        </span>
      </div>

      {isLocalPlaceholder && (
        <div className="text-xs text-amber-600 bg-amber-50 rounded px-2 py-1 mb-2">
          Placeholder provider — not functional yet.
        </div>
      )}

      <div className="text-xs text-gray-500 space-y-1">
        <div>Available: {record?.available ? 'yes' : 'no'}</div>
        <div>Avg latency: {record?.avgLatencyMs ?? '—'} ms</div>
        <div>Failure rate: {record ? `${Math.round(record.failureRate * 100)}%` : '—'}</div>
        <div>Last error: {record?.lastErrorType ?? 'none'}</div>
      </div>

      <button
        onClick={() => onTest(providerId)}
        disabled={busy}
        className="mt-3 w-full bg-blue-600 text-white text-xs px-3 py-1.5 rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {busy ? 'Testing...' : 'Test Health'}
      </button>
    </div>
  )
}
