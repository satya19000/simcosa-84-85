import { Calendar, Clock, Users, Mic } from 'lucide-react'
import type { MeetingSession } from '../../lib/meetingAgentService'

interface Props {
  session: MeetingSession
  onClick?: () => void
}

const STATUS_COLORS: Record<string, string> = {
  active: 'text-green-400 bg-green-900/20 border-green-700/40',
  paused: 'text-yellow-400 bg-yellow-900/20 border-yellow-700/40',
  ended: 'text-white/50 bg-white/5 border-white/10',
  summarized: 'text-purple-400 bg-purple-900/20 border-purple-700/40',
  draft: 'text-blue-400 bg-blue-900/20 border-blue-700/40',
  consentRequired: 'text-orange-400 bg-orange-900/20 border-orange-700/40',
  processing: 'text-cyan-400 bg-cyan-900/20 border-cyan-700/40',
  archived: 'text-white/30 bg-white/5 border-white/10',
  deleted: 'text-red-400 bg-red-900/20 border-red-700/40',
}

export default function MeetingSessionCard({ session, onClick }: Props) {
  const statusColor = STATUS_COLORS[session.status] ?? 'text-white/50 bg-white/5 border-white/10'
  const isActive = session.status === 'active'

  return (
    <button
      onClick={onClick}
      className="w-full text-left p-4 rounded-xl glass border border-white/10 hover:border-[#7C3AED]/40 transition-all group"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {isActive && <span className="inline-block w-2 h-2 rounded-full bg-red-500 animate-pulse flex-shrink-0" />}
            <p className="text-sm font-semibold text-white/90 truncate">{session.title}</p>
          </div>
          <p className="text-xs text-white/40 mt-0.5 capitalize">{session.type.replace(/([A-Z])/g, ' $1').trim()}</p>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full border flex-shrink-0 capitalize ${statusColor}`}>
          {session.status}
        </span>
      </div>

      <div className="flex items-center gap-4 mt-3 text-xs text-white/40">
        <span className="flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          {new Date(session.createdAt).toLocaleDateString()}
        </span>
        {session.startedAt && (
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {new Date(session.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
        {session.participants.length > 0 && (
          <span className="flex items-center gap-1">
            <Users className="w-3 h-3" />
            {session.participants.length}
          </span>
        )}
        {session.transcriptionEnabled && (
          <span className="flex items-center gap-1">
            <Mic className="w-3 h-3" />
            Transcript
          </span>
        )}
      </div>
    </button>
  )
}
