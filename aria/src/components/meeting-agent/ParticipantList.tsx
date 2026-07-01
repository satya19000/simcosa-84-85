import { Users, CheckCircle, XCircle, Clock } from 'lucide-react'
import type { MeetingParticipant } from '../../lib/meetingAgentService'

interface Props {
  participants: MeetingParticipant[]
}

const CONSENT_ICONS = {
  granted: <CheckCircle className="w-3.5 h-3.5 text-green-400" />,
  denied: <XCircle className="w-3.5 h-3.5 text-red-400" />,
  revoked: <XCircle className="w-3.5 h-3.5 text-red-400" />,
  pending: <Clock className="w-3.5 h-3.5 text-yellow-400" />,
  notRequired: <CheckCircle className="w-3.5 h-3.5 text-white/30" />,
}

export default function ParticipantList({ participants }: Props) {
  if (participants.length === 0) {
    return (
      <div className="py-6 text-center text-white/30">
        <Users className="w-6 h-6 mx-auto mb-2" />
        <p className="text-sm">No participants added yet.</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {participants.map((p) => (
        <div key={p.participantId} className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/5">
          <div className="w-8 h-8 rounded-full bg-[#7C3AED]/30 flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-semibold text-[#7C3AED]">{p.name.charAt(0).toUpperCase()}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-white/90 font-medium truncate">{p.name}</p>
            {p.email && <p className="text-xs text-white/40 truncate">{p.email}</p>}
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {CONSENT_ICONS[p.consentStatus]}
            <span className="text-xs text-white/40 capitalize">{p.consentStatus}</span>
          </div>
        </div>
      ))}
    </div>
  )
}
