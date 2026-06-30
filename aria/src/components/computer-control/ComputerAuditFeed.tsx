import type { ComputerAuditEvent, ComputerRiskLevel } from '../../lib/computerControlService'

const RISK_COLORS: Record<ComputerRiskLevel, string> = {
  low: 'text-green-400',
  medium: 'text-yellow-400',
  high: 'text-orange-400',
  critical: 'text-red-400',
}

const EVENT_ICONS: Record<string, string> = {
  'action.planned': '📋',
  'action.approved': '✅',
  'action.blocked': '🚫',
  'action.executed': '▶️',
  'capability.denied': '⛔',
  'safety_guard.triggered': '🛡️',
  'agent.registered': '🖥️',
  'agent.revoked': '🗑️',
  'extension.registered': '🔌',
  'extension.revoked': '🗑️',
  'session.created': '🔑',
  'session.revoked': '🔒',
  'approval.requested': '📤',
}

interface ComputerAuditFeedProps {
  events: ComputerAuditEvent[]
}

export default function ComputerAuditFeed({ events }: ComputerAuditFeedProps) {
  if (events.length === 0) {
    return (
      <div className="rounded-lg border border-white/10 bg-white/5 p-4 text-center">
        <p className="text-sm text-gray-400">No audit events yet.</p>
      </div>
    )
  }

  return (
    <div className="space-y-1.5">
      {events.map((event) => (
        <div key={event.auditId} className="flex items-start gap-3 p-3 rounded-lg bg-white/5 border border-white/10">
          <span className="text-base shrink-0 mt-0.5">{EVENT_ICONS[event.eventType] ?? '📝'}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-white">{event.eventType}</span>
              {event.capabilityId && (
                <code className="text-xs text-purple-300 bg-purple-900/20 px-1 rounded">{event.capabilityId}</code>
              )}
              {event.riskLevel && (
                <span className={`text-xs ${RISK_COLORS[event.riskLevel]}`}>{event.riskLevel}</span>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              {new Date(event.timestamp).toLocaleTimeString()} · {event.userId.slice(0, 8)}…
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}
