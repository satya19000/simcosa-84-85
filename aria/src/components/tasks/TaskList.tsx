import { AnimatePresence } from 'framer-motion'
import { CheckSquare } from 'lucide-react'
import { EmptyState } from '@/components/ui/EmptyState'
import { ListSkeleton } from '@/components/ui/LoadingSkeleton'
import { TaskCard } from './TaskCard'
import type { Task } from '@/lib/types'

interface TaskListProps {
  tasks: Task[]
  loading: boolean
  error: string | null
  onComplete: (taskId: string) => Promise<void>
  onDelete: (taskId: string) => Promise<void>
  emptyTitle?: string
  emptyDescription?: string
  onEmptyAction?: () => void
  emptyActionLabel?: string
}

export function TaskList({
  tasks,
  loading,
  error,
  onComplete,
  onDelete,
  emptyTitle = 'No tasks yet',
  emptyDescription = 'Ask ARIA to create a task for you.',
  onEmptyAction,
  emptyActionLabel = 'Add task',
}: TaskListProps) {
  if (loading) return <ListSkeleton count={3} />

  if (error) {
    return (
      <div className="text-xs text-red-400 bg-red-500/10 rounded-xl px-3 py-2">
        {error}
      </div>
    )
  }

  if (tasks.length === 0) {
    return (
      <EmptyState
        icon={CheckSquare}
        title={emptyTitle}
        description={emptyDescription}
        action={onEmptyAction ? { label: emptyActionLabel, onClick: onEmptyAction } : undefined}
      />
    )
  }

  return (
    <div className="space-y-2">
      <AnimatePresence initial={false}>
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onComplete={onComplete}
            onDelete={onDelete}
          />
        ))}
      </AnimatePresence>
    </div>
  )
}
