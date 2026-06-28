import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, StickyNote } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { addRelationshipNote } from '@/lib/contactService'
import type { Contact } from '@/lib/types'

interface AddNoteModalProps {
  contact: Contact | null
  onClose: () => void
}

const IMPORTANCES = [
  { value: 'low', label: 'Low' },
  { value: 'normal', label: 'Normal' },
  { value: 'high', label: 'High' },
] as const

export function AddNoteModal({ contact, onClose }: AddNoteModalProps) {
  const [note, setNote] = useState('')
  const [importance, setImportance] = useState<'low' | 'normal' | 'high'>('normal')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleClose() {
    setNote(''); setImportance('normal'); setError(null); onClose()
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!contact || !note.trim()) return
    setLoading(true); setError(null)
    try {
      await addRelationshipNote({ contactId: contact.id, note: note.trim(), importance })
      handleClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add note')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AnimatePresence>
      {contact && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            onClick={handleClose}
          />
          <motion.div
            initial={{ opacity: 0, y: 60, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 60, scale: 0.95 }}
            transition={{ type: 'spring', damping: 26, stiffness: 320 }}
            className="fixed inset-x-4 bottom-0 mb-6 z-50 glass border border-white/15 rounded-3xl p-6 shadow-2xl shadow-black/60"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <StickyNote className="w-4 h-4 text-[#06B6D4]" />
                Add Note — {contact.name}
              </h2>
              <button onClick={handleClose} className="text-white/40 hover:text-white/70 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              {error && <div className="text-xs text-red-400 bg-red-500/10 rounded-xl px-3 py-2">{error}</div>}

              <textarea
                placeholder="Note (e.g. prefers WhatsApp, vegetarian, allergic to peanuts…)"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                required
                autoFocus
                rows={4}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#06B6D4]/50 resize-none"
              />

              <div className="flex gap-2">
                {IMPORTANCES.map((imp) => (
                  <button
                    key={imp.value}
                    type="button"
                    onClick={() => setImportance(imp.value)}
                    className={`flex-1 py-1.5 rounded-xl text-xs font-medium transition-all border ${
                      importance === imp.value
                        ? 'bg-[#06B6D4]/20 border-[#06B6D4]/40 text-[#06B6D4]'
                        : 'bg-white/5 border-white/10 text-white/40'
                    }`}
                  >
                    {imp.label}
                  </button>
                ))}
              </div>

              <Button type="submit" variant="secondary" loading={loading} disabled={!note.trim() || loading} className="w-full">
                Save Note
              </Button>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
