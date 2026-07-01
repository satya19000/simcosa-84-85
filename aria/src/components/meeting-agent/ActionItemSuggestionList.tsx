import { CheckCircle, Clock } from 'lucide-react'
import type { MeetingActionItem } from '../../lib/meetingAgentService'

interface Props {
  items: MeetingActionItem[]
  loading?: boolean
  onRequestApproval?: (item: MeetingActionItem) => void
}

const TYPE_LABELS: Record<string, string> = {
  task: 'Task',
  reminder: 'Reminder',
  followUp: 'Follow-up',
  callToMake: 'Call',
  emailToSend: 'Email',
  messageToSend: 'Message',
  documentToPrepare: 'Document',
  approvalNeeded: 'Approval',
  deadline: 'Deadline',
}

const PRIORITY_COLORS: Record<string, string> = {
  high: 'text-red-400 bg-red-900/20 border-red-700/30',
  medium: 'text-yellow-400 bg-yellow-900/20 border-yellow-700/30',
  low: 'text-green-400 bg-green-900/20 border-green-700/30',
}

export default function ActionItemSuggestionList({ items, loading, onRequestApproval }: Props) {
  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => <div key={i} className="h-16 rounded-lg bg-white/5 animate-pulse" />)}
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="py-8 text-center text-white/30">
        <CheckCircle className="w-7 h-7 mx-auto mb-2" />
        <p className="text-sm">No action items extracted yet.</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-white/40 mb-2">
        These are AI suggestions only. No action is taken until you explicitly approve each item.
      </p>
      {items.map((item) => (
        <div key={item.actionItemId} className="p-3 rounded-xl border border-white/10 bg-white/5">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="text-xs px-1.5 py-0.5 rounded bg-[#7C3AED]/20 text-[#7C3AED] border border-[#7C3AED]/30">
                  {TYPE_LABELS[item.type] ?? item.type}
                </span>
                {item.priority && (
                  <span className={`text-xs px-1.5 py-0.5 rounded border ${PRIORITY_COLORS[item.priority] ?? ''}`}>
                    {item.priority}
                  </span>
                )}
                {item.approvalStatus === 'approvalRequested' && (
                  <span className="text-xs px-1.5 py-0.5 rounded bg-orange-900/20 text-orange-400 border border-orange-700/30">
                    Approval Pending
                  </span>
                )}
              </div>
              <p className="text-sm text-white/80">{item.description}</p>
              {item.assignee && (
                <p className="text-xs text-white/40 mt-1">Assignee: {item.assignee}</p>
              )}
              {item.dueDate && (
                <p className="text-xs text-white/40 flex items-center gap-1 mt-0.5">
                  <Clock className="w-3 h-3" />
                  {new Date(item.dueDate).toLocaleDateString()}
                </p>
              )}
            </div>
            {item.approvalStatus === 'suggestion' && onRequestApproval && (
              <button
                onClick={() => onRequestApproval(item)}
                className="flex-shrink-0 px-2.5 py-1 text-xs rounded-lg bg-[#7C3AED]/40 border border-[#7C3AED]/40 text-[#7C3AED] hover:bg-[#7C3AED]/60 transition-colors"
              >
                Approve
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
