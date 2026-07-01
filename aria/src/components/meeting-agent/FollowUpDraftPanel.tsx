import { Mail, MessageSquare, Phone, CheckCircle, Clock } from 'lucide-react'

interface FollowUp {
  followUpId: string
  type: 'emailSummary' | 'whatsappFollowUp' | 'smsReminder' | 'participantNote'
  recipientName?: string
  draftContent: string
  approvalStatus: 'draft' | 'approvalRequested' | 'approved' | 'sent' | 'rejected'
}

interface Props {
  followUps: FollowUp[]
  onRequestApproval?: (followUpId: string) => void
  loading?: boolean
}

const TYPE_ICONS = {
  emailSummary: <Mail className="w-4 h-4" />,
  whatsappFollowUp: <MessageSquare className="w-4 h-4" />,
  smsReminder: <Phone className="w-4 h-4" />,
  participantNote: <Mail className="w-4 h-4" />,
}

const TYPE_LABELS = {
  emailSummary: 'Email Summary',
  whatsappFollowUp: 'WhatsApp',
  smsReminder: 'SMS Reminder',
  participantNote: 'Participant Note',
}

const STATUS_COLORS: Record<string, string> = {
  draft: 'text-white/50 border-white/20',
  approvalRequested: 'text-orange-400 border-orange-700/40',
  approved: 'text-green-400 border-green-700/40',
  sent: 'text-blue-400 border-blue-700/40',
  rejected: 'text-red-400 border-red-700/40',
}

export default function FollowUpDraftPanel({ followUps, onRequestApproval, loading }: Props) {
  if (loading) return <div className="h-24 rounded-xl bg-white/5 animate-pulse" />

  if (followUps.length === 0) {
    return (
      <div className="py-6 text-center text-white/30">
        <Mail className="w-6 h-6 mx-auto mb-2" />
        <p className="text-sm">No follow-up drafts yet.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-white/40">
        All drafts require explicit approval before sending. Nothing is sent automatically.
      </p>
      {followUps.map((fu) => (
        <div key={fu.followUpId} className={`p-3 rounded-xl border bg-white/5 ${STATUS_COLORS[fu.approvalStatus] ?? 'border-white/10'}`}>
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2 text-white/70">
              {TYPE_ICONS[fu.type]}
              <span className="text-xs font-medium">{TYPE_LABELS[fu.type]}</span>
              {fu.recipientName && <span className="text-xs text-white/40">→ {fu.recipientName}</span>}
            </div>
            <div className="flex items-center gap-1.5">
              <span className={`text-xs capitalize ${STATUS_COLORS[fu.approvalStatus]?.split(' ')[0] ?? 'text-white/40'}`}>
                {fu.approvalStatus}
              </span>
              {fu.approvalStatus === 'approvalRequested' && <Clock className="w-3 h-3 text-orange-400" />}
              {fu.approvalStatus === 'approved' && <CheckCircle className="w-3 h-3 text-green-400" />}
            </div>
          </div>
          <p className="text-xs text-white/50 line-clamp-2">{fu.draftContent}</p>
          {fu.approvalStatus === 'draft' && onRequestApproval && (
            <button
              onClick={() => onRequestApproval(fu.followUpId)}
              className="mt-2 px-3 py-1 text-xs rounded-lg bg-[#7C3AED]/40 border border-[#7C3AED]/40 text-[#7C3AED] hover:bg-[#7C3AED]/60 transition-colors"
            >
              Request Approval to Send
            </button>
          )}
        </div>
      ))}
    </div>
  )
}
