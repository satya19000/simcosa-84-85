import { Activity as ActivityIcon } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import type { ActivityRecord } from '@/lib/organizationService'

interface Props {
  activity: ActivityRecord[]
}

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

export function ActivityFeed({ activity }: Props) {
  if (activity.length === 0) {
    return <p className="text-sm text-white/30 text-center py-8">No activity yet</p>
  }

  return (
    <div className="space-y-2">
      {activity.map((a) => (
        <Card key={a.activityId} className="flex items-start gap-3 p-3">
          <div className="w-7 h-7 rounded-lg bg-[#7C3AED]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
            <ActivityIcon className="w-3.5 h-3.5 text-[#7C3AED]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-white/90">{a.summary}</p>
            <p className="text-xs text-white/30 mt-0.5">{timeAgo(a.createdAt)}</p>
          </div>
        </Card>
      ))}
    </div>
  )
}
