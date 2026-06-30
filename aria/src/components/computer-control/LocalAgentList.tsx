import type { LocalAgentRegistration } from '../../lib/computerControlService'

interface LocalAgentListProps {
  agents: LocalAgentRegistration[]
  onRevoke?: (agentId: string) => void
  busy?: string | null
}

const HEALTH_COLORS = {
  unknown: 'text-gray-400',
  healthy: 'text-green-400',
  degraded: 'text-yellow-400',
  unreachable: 'text-red-400',
}

export default function LocalAgentList({ agents, onRevoke, busy }: LocalAgentListProps) {
  if (agents.length === 0) {
    return (
      <div className="rounded-lg border border-white/10 bg-white/5 p-4 text-center">
        <p className="text-sm text-gray-400">No local agents registered.</p>
        <p className="text-xs text-gray-600 mt-1">Local Desktop Agent is a PLACEHOLDER — no binary exists yet.</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {agents.map((agent) => (
        <div key={agent.agentId} className="rounded-lg border border-white/10 bg-white/5 p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm text-white font-medium truncate">{agent.deviceId}</span>
                <span className={`text-xs ${HEALTH_COLORS[agent.healthStatus]}`}>{agent.healthStatus}</span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">Agent ID: {agent.agentId.slice(0, 8)}…</p>
              <p className="text-xs text-gray-500">Expires: {new Date(agent.expiresAt).toLocaleDateString()}</p>
              {agent.revokedAt && (
                <p className="text-xs text-red-400 mt-0.5">Revoked: {new Date(agent.revokedAt).toLocaleString()}</p>
              )}
              <p className="text-xs text-yellow-600 mt-1">PLACEHOLDER — no native agent binary</p>
            </div>
            {!agent.revokedAt && onRevoke && (
              <button
                onClick={() => onRevoke(agent.agentId)}
                disabled={busy === agent.agentId}
                className="shrink-0 text-xs px-2 py-1 rounded bg-red-700/50 hover:bg-red-700 text-red-200 border border-red-700/50 disabled:opacity-50"
              >
                {busy === agent.agentId ? '…' : 'Revoke'}
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
