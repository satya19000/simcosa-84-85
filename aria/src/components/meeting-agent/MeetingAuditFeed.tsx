import { Shield, Clock } from 'lucide-react'

interface AuditEvent {
  auditId: string
  event: string
  detail?: string
  createdAt: string
}

interface Props {
  events: AuditEvent[]
  loading?: boolean
}

const EVENT_COLORS: Record<string, string> = {
  meeting_created: 'text-blue-400',
  recording_started: 'text-green-400',
  recording_paused: 'text-yellow-400',
  recording_stopped: 'text-orange-400',
  consent_granted: 'text-green-400',
  consent_revoked: 'text-red-400',
  transcript_deleted: 'text-red-400',
  summary_generated: 'text-purple-400',
  action_items_extracted: 'text-purple-400',
  approval_requested: 'text-orange-400',
  meeting_ended: 'text-white/50',
}

export default function MeetingAuditFeed({ events, loading }: Props) {
  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => <div key={i} className="h-10 rounded bg-white/5 animate-pulse" />)}
      </div>
    )
  }

  if (events.length === 0) {
    return (
      <div className="py-6 text-center text-white/30">
        <Shield className="w-6 h-6 mx-auto mb-2" />
        <p className="text-sm">No audit events yet.</p>
      </div>
    )
  }

  return (
    <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
      {events.map((ev) => (
        <div key={ev.auditId} className="flex items-start gap-2 p-2 rounded-lg bg-white/5">
          <Shield className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${EVENT_COLORS[ev.event] ?? 'text-white/40'}`} />
          <div className="flex-1 min-w-0">
            <span className={`text-xs font-medium ${EVENT_COLORS[ev.event] ?? 'text-white/60'}`}>
              {ev.event.replace(/_/g, ' ')}
            </span>
            {ev.detail && <span className="text-xs text-white/30 ml-2">{ev.detail}</span>}
          </div>
          <span className="text-xs text-white/20 flex-shrink-0 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {new Date(ev.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      ))}
    </div>
  )
}
