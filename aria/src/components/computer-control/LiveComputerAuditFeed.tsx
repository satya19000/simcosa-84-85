import { useState, useEffect, useCallback } from 'react'
import { getComputerAuditFeed, type ComputerAuditEvent } from '../../lib/computerControlService'

interface AuditStreamEvent {
  streamEventId: string
  streamEventType: string
  sourceAuditEvent: ComputerAuditEvent
  colorCode: string
  riskLevel: string
  displayLabel: string
  timestamp: string
}

interface AuditFeedPage {
  events: AuditStreamEvent[]
  nextPageToken?: string
  totalFetched: number
}

interface Props {
  tenantId: string
  /** Poll interval in ms (default 10000). Set to 0 to disable polling. */
  pollIntervalMs?: number
  /** Max events to show per page. */
  limit?: number
}

const COLOR_CLASSES: Record<string, string> = {
  green:  'bg-green-500/20 border-green-500/40 text-green-300',
  yellow: 'bg-yellow-500/20 border-yellow-500/40 text-yellow-300',
  orange: 'bg-orange-500/20 border-orange-500/40 text-orange-300',
  red:    'bg-red-500/20 border-red-500/40 text-red-300',
  blue:   'bg-blue-500/20 border-blue-500/40 text-blue-300',
  gray:   'bg-white/5 border-white/10 text-gray-400',
}

const RISK_BADGE: Record<string, string> = {
  low:      'bg-green-900/40 text-green-300 border border-green-700/40',
  medium:   'bg-yellow-900/40 text-yellow-300 border border-yellow-700/40',
  high:     'bg-orange-900/40 text-orange-300 border border-orange-700/40',
  critical: 'bg-red-900/40 text-red-300 border border-red-700/40',
}

const EVENT_ICON: Record<string, string> = {
  planned:              '📋',
  blocked:              '🚫',
  approval_requested:   '⏳',
  approval_granted:     '✅',
  executed:             '⚡',
  failed:               '❌',
  safety_guard_triggered: '🛡️',
}

export default function LiveComputerAuditFeed({ tenantId, pollIntervalMs = 10000, limit = 20 }: Props) {
  const [page, setPage] = useState<AuditFeedPage | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)

  const loadFeed = useCallback(async () => {
    if (!tenantId) return
    try {
      const data = await getComputerAuditFeed(tenantId, limit)
      setPage(data as AuditFeedPage)
      setError('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load audit feed')
    } finally {
      setLoading(false)
    }
  }, [tenantId, limit])

  useEffect(() => {
    void loadFeed()
  }, [loadFeed])

  useEffect(() => {
    if (!pollIntervalMs || pollIntervalMs <= 0) return
    const id = setInterval(() => { void loadFeed() }, pollIntervalMs)
    return () => clearInterval(id)
  }, [loadFeed, pollIntervalMs])

  function formatTimestamp(ts: string) {
    try {
      return new Date(ts).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    } catch {
      return ts
    }
  }

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-white">Live Audit Feed</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Real-time computer control events — all actions, approvals, and safety blocks.
            {pollIntervalMs > 0 && <span className="ml-1 text-blue-400">Auto-refreshes every {pollIntervalMs / 1000}s.</span>}
          </p>
        </div>
        <button
          onClick={() => { setLoading(true); void loadFeed() }}
          className="text-xs px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-gray-300 border border-white/10"
        >
          Refresh
        </button>
      </div>

      {error && (
        <div className="mb-3 p-2 rounded bg-red-900/30 border border-red-700/40 text-red-300 text-xs">{error}</div>
      )}

      {loading && !page ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 rounded-lg bg-white/5 animate-pulse" />
          ))}
        </div>
      ) : !page || page.events.length === 0 ? (
        <div className="text-center py-6 text-gray-500 text-sm">
          No audit events yet. Actions will appear here as they are planned, approved, and executed.
        </div>
      ) : (
        <div className="space-y-2">
          {page.events.map((event) => {
            const colorClass = COLOR_CLASSES[event.colorCode] ?? COLOR_CLASSES.gray
            const riskBadge = RISK_BADGE[event.riskLevel] ?? RISK_BADGE.low
            const icon = EVENT_ICON[event.streamEventType] ?? '•'
            const isExpanded = expanded === event.streamEventId

            return (
              <div
                key={event.streamEventId}
                className={`rounded-lg border p-3 cursor-pointer transition-all ${colorClass}`}
                onClick={() => setExpanded(isExpanded ? null : event.streamEventId)}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-base flex-shrink-0">{icon}</span>
                    <span className="text-sm font-medium truncate">{event.displayLabel}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded font-mono flex-shrink-0 ${riskBadge}`}>
                      {event.riskLevel}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500 flex-shrink-0">{formatTimestamp(event.timestamp)}</span>
                </div>

                {isExpanded && (
                  <div className="mt-2 pt-2 border-t border-white/10 text-xs text-gray-400 space-y-1">
                    <div><span className="text-gray-500">Event type:</span> <span className="font-mono">{event.sourceAuditEvent.eventType}</span></div>
                    {event.sourceAuditEvent.capabilityId && (
                      <div><span className="text-gray-500">Capability:</span> <span className="font-mono">{event.sourceAuditEvent.capabilityId}</span></div>
                    )}
                    {event.sourceAuditEvent.planId && (
                      <div><span className="text-gray-500">Plan:</span> <span className="font-mono text-purple-300">{event.sourceAuditEvent.planId.slice(0, 12)}…</span></div>
                    )}
                    {event.sourceAuditEvent.approvalRequestId && (
                      <div><span className="text-gray-500">Approval:</span> <span className="font-mono text-blue-300">{event.sourceAuditEvent.approvalRequestId.slice(0, 12)}…</span></div>
                    )}
                    {Object.keys(event.sourceAuditEvent.metadata ?? {}).length > 0 && (
                      <div>
                        <span className="text-gray-500">Metadata:</span>{' '}
                        <span className="font-mono text-gray-300">
                          {Object.entries(event.sourceAuditEvent.metadata)
                            .filter(([k]) => !['reason', 'success', 'notImplemented'].includes(k) || true)
                            .map(([k, v]) => `${k}=${String(v)}`)
                            .join(', ')}
                        </span>
                      </div>
                    )}
                    <div><span className="text-gray-500">Full timestamp:</span> {event.timestamp}</div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {page && page.events.length > 0 && (
        <div className="mt-3 text-xs text-gray-600 text-center">
          Showing {page.events.length} most recent events — sensitive content is never logged.
        </div>
      )}
    </div>
  )
}
