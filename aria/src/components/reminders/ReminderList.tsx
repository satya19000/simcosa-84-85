import { AnimatePresence } from 'framer-motion'
import { Bell } from 'lucide-react'
import { EmptyState } from '@/components/ui/EmptyState'
import { ListSkeleton } from '@/components/ui/LoadingSkeleton'
import { ReminderCard } from './ReminderCard'
import type { Reminder } from '@/lib/types'

interface ReminderListProps {
  reminders: Reminder[]
  loading: boolean
  error: string | null
  onDelete: (reminderId: string) => Promise<void>
  emptyTitle?: string
  emptyDescription?: string
  onEmptyAction?: () => void
  emptyActionLabel?: string
}

export function ReminderList({
  reminders,
  loading,
  error,
  onDelete,
  emptyTitle = 'No reminders',
  emptyDescription = 'Ask ARIA to set a reminder for you.',
  onEmptyAction,
  emptyActionLabel = 'Add reminder',
}: ReminderListProps) {
  if (loading) return <ListSkeleton count={3} />

  if (error) {
    return (
      <div className="text-xs text-red-400 bg-red-500/10 rounded-xl px-3 py-2">
        {error}
      </div>
    )
  }

  if (reminders.length === 0) {
    return (
      <EmptyState
        icon={Bell}
        title={emptyTitle}
        description={emptyDescription}
        action={onEmptyAction ? { label: emptyActionLabel, onClick: onEmptyAction } : undefined}
      />
    )
  }

  return (
    <div className="space-y-2">
      <AnimatePresence initial={false}>
        {reminders.map((reminder) => (
          <ReminderCard
            key={reminder.id}
            reminder={reminder}
            onDelete={onDelete}
          />
        ))}
      </AnimatePresence>
    </div>
  )
}
