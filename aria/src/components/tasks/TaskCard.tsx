import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, Circle, Trash2, Tag, Calendar, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Task } from '@/lib/types'

const PRIORITY_CONFIG = {
  low: { label: 'Low', className: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
  normal: { label: 'Normal', className: 'text-white/50 bg-white/5 border-white/10' },
  high: { label: 'High', className: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
  critical: { label: 'Critical', className: 'text-red-400 bg-red-500/10 border-red-500/20' },
}

function formatDueDate(isoString: string | null): { label: string; isPast: boolean } | null {
  if (!isoString) return null
  const d = new Date(isoString)
  const isPast = d < new Date()
  const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  return { label, isPast }
}

interface TaskCardProps {
  task: Task
  onComplete: (taskId: string) => Promise<void>
  onDelete: (taskId: string) => Promise<void>
}

export function TaskCard({ task, onComplete, onDelete }: TaskCardProps) {
  const [completing, setCompleting] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const dueDate = formatDueDate(task.dueAt)
  const priority = PRIORITY_CONFIG[task.priority] ?? PRIORITY_CONFIG.normal

  async function handleComplete() {
    setCompleting(true)
    setError(null)
    try {
      await onComplete(task.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed')
    } finally {
      setCompleting(false)
    }
  }

  async function handleDelete() {
    setDeleting(true)
    setError(null)
    try {
      await onDelete(task.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed')
      setDeleting(false)
      setConfirmDelete(false)
    }
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className={cn(
        'glass border border-white/10 rounded-2xl px-4 py-3 transition-opacity',
        task.completed && 'opacity-50'
      )}
    >
      <div className="flex items-start gap-3">
        {/* Complete toggle */}
        <button
          onClick={handleComplete}
          disabled={completing || task.completed}
          className="mt-0.5 flex-shrink-0 text-white/30 hover:text-emerald-400 transition-colors disabled:opacity-50"
          aria-label={task.completed ? 'Completed' : 'Mark complete'}
        >
          {completing ? (
            <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : task.completed ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          ) : (
            <Circle className="w-5 h-5" />
          )}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className={cn('text-sm font-medium text-white leading-snug', task.completed && 'line-through text-white/40')}>
            {task.title}
          </p>

          <div className="flex flex-wrap items-center gap-2 mt-1.5">
            {/* Priority badge */}
            <span className={cn('inline-flex items-center text-[10px] px-1.5 py-0.5 rounded-full border font-medium', priority.className)}>
              {priority.label}
            </span>

            {/* Category */}
            {task.category && (
              <span className="inline-flex items-center gap-0.5 text-[10px] text-white/40">
                <Tag className="w-2.5 h-2.5" />
                {task.category}
              </span>
            )}

            {/* Due date */}
            {dueDate && (
              <span className={cn(
                'inline-flex items-center gap-0.5 text-[10px]',
                dueDate.isPast && !task.completed ? 'text-red-400' : 'text-white/40'
              )}>
                {dueDate.isPast && !task.completed && <AlertTriangle className="w-2.5 h-2.5" />}
                <Calendar className="w-2.5 h-2.5" />
                {dueDate.label}
              </span>
            )}
          </div>

          {task.notes && (
            <p className="text-[11px] text-white/30 mt-1.5 leading-relaxed line-clamp-2">
              {task.notes}
            </p>
          )}

          {error && (
            <p className="text-[10px] text-red-400 mt-1">{error}</p>
          )}
        </div>

        {/* Delete */}
        <div className="flex-shrink-0 flex items-center gap-1">
          <AnimatePresence mode="wait">
            {confirmDelete ? (
              <motion.div
                key="confirm"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex items-center gap-1"
              >
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="text-[10px] text-white/40 hover:text-white/60 px-1.5 py-0.5"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="text-[10px] text-red-400 hover:text-red-300 px-2 py-0.5 rounded-lg bg-red-500/10 border border-red-500/20"
                >
                  {deleting ? '…' : 'Delete'}
                </button>
              </motion.div>
            ) : (
              <motion.button
                key="trash"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setConfirmDelete(true)}
                className="text-white/20 hover:text-red-400 transition-colors p-1"
                aria-label="Delete task"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  )
}
