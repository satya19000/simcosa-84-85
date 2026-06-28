import { useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { Users } from 'lucide-react'
import { ListSkeleton } from '@/components/ui/LoadingSkeleton'
import { ContactCard } from './ContactCard'
import type { Contact } from '@/lib/types'

interface ContactListProps {
  contacts: Contact[]
  loading: boolean
  error: string | null
  onEdit: (contact: Contact) => void
  onDelete: (contactId: string) => Promise<void>
  onAddNote: (contact: Contact) => void
}

export function ContactList({ contacts, loading, error, onEdit, onDelete, onAddNote }: ContactListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  if (loading) return <ListSkeleton count={4} />

  if (error) {
    return (
      <div className="text-xs text-red-400 bg-red-500/10 rounded-xl px-3 py-2">{error}</div>
    )
  }

  if (contacts.length === 0) {
    return (
      <div className="glass border border-white/5 rounded-2xl px-4 py-10 text-center">
        <Users className="w-8 h-8 text-white/10 mx-auto mb-3" />
        <p className="text-sm text-white/30">No contacts yet</p>
        <p className="text-xs text-white/20 mt-1">Ask ARIA or tap + to add one</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <AnimatePresence initial={false}>
        {contacts.map((c) => (
          <ContactCard
            key={c.id}
            contact={c}
            onEdit={onEdit}
            onDelete={onDelete}
            onAddNote={onAddNote}
            expanded={expandedId === c.id}
            onToggle={() => setExpandedId(expandedId === c.id ? null : c.id)}
          />
        ))}
      </AnimatePresence>
    </div>
  )
}
