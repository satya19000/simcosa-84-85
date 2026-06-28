import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, Repeat, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Reminder } from '@/lib/types'

const RECURRENCE_LABELS: Record<string, string> = {
  none: '',
  daily: 'Daily',
  weekly: 'Weekly',
  monthly: 'Monthly',
}

function formatScheduledAt(isoString: string): string {
  const d = new Date(isoString)
  return d.toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function isPast(isoString: string): boolean {
  return new Date(isoString) < new Date()
}

interface ReminderCardProps {
  reminder: Reminder
  onDelete: (reminderId: string) => Promise<void>
}

export function ReminderCard({ reminder, onDelete }: ReminderCardProps) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const past = isPast(reminder.scheduledAt)

  async function handleDelete() {
    setDeleting(true)
    setError(null)
    try {
      await onDelete(reminder.id)
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
        'glass border border-white/10 rounded-2xl px-4 py-3',
        past && 'opacity-50'
      )}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex-shrink-0">
          <div className={cn(
            'w-8 h-8 rounded-xl flex items-center justify-center',
            past ? 'bg-white/5' : 'bg-[#06B6D4]/10'
          )}>
            <Bell className={cn('w-4 h-4', past ? 'text-white/20' : 'text-[#06B6D4]')} />
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <p className={cn('text-sm font-medium text-white leading-snug', past && 'text-white/40')}>
            {reminder.title}
          </p>

          <div className="flex flex-wrap items-center gap-2 mt-1">
            <span className={cn('text-[10px]', past ? 'text-white/30' : 'text-[#06B6D4]/80')}>
              {formatScheduledAt(reminder.scheduledAt)}
            </span>

            {reminder.recurrence !== 'none' && (
              <span className="inline-flex items-center gap-0.5 text-[10px] text-white/40">
                <Repeat className="w-2.5 h-2.5" />
                {RECURRENCE_LABELS[reminder.recurrence]}
              </span>
            )}
          </div>

          {reminder.notes && (
            <p className="text-[11px] text-white/30 mt-1 line-clamp-2 leading-relaxed">
              {reminder.notes}
            </p>
          )}

          {error && <p className="text-[10px] text-red-400 mt-1">{error}</p>}
        </div>

        {/* Delete */}
        <div className="flex-shrink-0">
          <AnimatePresence mode="wait">
            {confirmDelete ? (
              <motion.div
                key="confirm"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
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
                  className="text-[10px] text-red-400 px-2 py-0.5 rounded-lg bg-red-500/10 border border-red-500/20"
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
