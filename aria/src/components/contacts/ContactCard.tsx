import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Phone, Mail, Trash2, Pencil, MessageCircle, Tag, Building2, StickyNote } from 'lucide-react'
import type { Contact } from '@/lib/types'

const METHOD_ICON: Record<string, typeof Phone> = {
  phone: Phone,
  whatsapp: MessageCircle,
  email: Mail,
  sms: MessageCircle,
}

function initials(name: string) {
  return name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
}

interface ContactCardProps {
  contact: Contact
  onEdit: (contact: Contact) => void
  onDelete: (contactId: string) => Promise<void>
  onAddNote: (contact: Contact) => void
  expanded?: boolean
  onToggle?: () => void
}

export function ContactCard({ contact, onEdit, onDelete, onAddNote, expanded, onToggle }: ContactCardProps) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const MethodIcon = METHOD_ICON[contact.preferredContactMethod] ?? Phone

  async function handleDelete() {
    setDeleting(true)
    setError(null)
    try {
      await onDelete(contact.id)
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
      className="glass border border-white/10 rounded-2xl overflow-hidden"
    >
      {/* Header row */}
      <button
        className="w-full flex items-center gap-3 px-4 py-3 text-left"
        onClick={onToggle}
      >
        {/* Avatar */}
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#7C3AED]/40 to-[#06B6D4]/40 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
          {initials(contact.name)}
        </div>

        {/* Name + meta */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white truncate">{contact.name}</p>
          <p className="text-[11px] text-white/40 truncate">
            {[contact.relationshipType, contact.role, contact.organization].filter(Boolean).join(' · ') || 'Contact'}
          </p>
        </div>

        {/* Method icon */}
        {contact.preferredContactMethod !== 'unknown' && (
          <MethodIcon className="w-3.5 h-3.5 text-[#06B6D4] flex-shrink-0" />
        )}

        {/* Actions */}
        <div className="flex items-center gap-0.5 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
          <button onClick={() => onAddNote(contact)} className="p-1 text-white/20 hover:text-[#7C3AED] transition-colors" aria-label="Add note">
            <StickyNote className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => onEdit(contact)} className="p-1 text-white/20 hover:text-[#7C3AED] transition-colors" aria-label="Edit contact">
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <AnimatePresence mode="wait">
            {confirmDelete ? (
              <motion.div key="confirm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-1 ml-1">
                <button onClick={() => setConfirmDelete(false)} className="text-[10px] text-white/40 hover:text-white/60 px-1">Cancel</button>
                <button onClick={handleDelete} disabled={deleting} className="text-[10px] text-red-400 px-2 py-0.5 rounded-lg bg-red-500/10 border border-red-500/20">
                  {deleting ? '…' : 'Del'}
                </button>
              </motion.div>
            ) : (
              <motion.button key="trash" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setConfirmDelete(true)} className="p-1 text-white/20 hover:text-red-400 transition-colors" aria-label="Delete contact">
                <Trash2 className="w-3.5 h-3.5" />
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </button>

      {/* Expanded detail */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-white/5 px-4 pb-4 pt-3 space-y-2 overflow-hidden"
          >
            {contact.phone && (
              <div className="flex items-center gap-2">
                <Phone className="w-3 h-3 text-white/30 flex-shrink-0" />
                <span className="text-xs text-white/60">{contact.phone}</span>
              </div>
            )}
            {contact.email && (
              <div className="flex items-center gap-2">
                <Mail className="w-3 h-3 text-white/30 flex-shrink-0" />
                <span className="text-xs text-white/60">{contact.email}</span>
              </div>
            )}
            {contact.organization && (
              <div className="flex items-center gap-2">
                <Building2 className="w-3 h-3 text-white/30 flex-shrink-0" />
                <span className="text-xs text-white/60">{contact.organization}</span>
              </div>
            )}
            {contact.tags.length > 0 && (
              <div className="flex items-start gap-2">
                <Tag className="w-3 h-3 text-white/30 flex-shrink-0 mt-0.5" />
                <div className="flex flex-wrap gap-1">
                  {contact.tags.map((tag) => (
                    <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-white/40">{tag}</span>
                  ))}
                </div>
              </div>
            )}
            {contact.relationshipNotes && (
              <div className="mt-2 bg-white/3 rounded-xl px-3 py-2">
                <p className="text-[11px] text-white/40 leading-relaxed line-clamp-4">{contact.relationshipNotes}</p>
              </div>
            )}
            {error && <p className="text-[10px] text-red-400">{error}</p>}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
