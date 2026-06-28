import { useState, useEffect, useRef, useMemo } from 'react'
import { Search, Plus, Users } from 'lucide-react'
import { Skeleton } from '@/components/ui/LoadingSkeleton'
import { ContactList } from '@/components/contacts/ContactList'
import { ContactQuickAddModal } from '@/components/contacts/ContactQuickAddModal'
import { ContactEditModal } from '@/components/contacts/ContactEditModal'
import { AddNoteModal } from '@/components/contacts/AddNoteModal'
import { subscribeToContacts, deleteContact } from '@/lib/contactService'
import { useAuthStore } from '@/store/authStore'
import type { Contact } from '@/lib/types'
import type { Unsubscribe } from 'firebase/firestore'

export default function Contacts() {
  const { user } = useAuthStore()
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingContact, setEditingContact] = useState<Contact | null>(null)
  const [noteContact, setNoteContact] = useState<Contact | null>(null)

  const unsubRef = useRef<Unsubscribe | null>(null)

  useEffect(() => {
    if (!user) return
    setLoading(true)
    unsubRef.current = subscribeToContacts(
      user.uid,
      (c) => { setContacts(c); setLoading(false) },
      (err) => { setError(err.message); setLoading(false) }
    )
    return () => { unsubRef.current?.() }
  }, [user])

  const filtered = useMemo(() => {
    if (!search.trim()) return contacts
    const q = search.toLowerCase()
    return contacts.filter((c) =>
      c.name.toLowerCase().includes(q) ||
      (c.role ?? '').toLowerCase().includes(q) ||
      (c.organization ?? '').toLowerCase().includes(q) ||
      (c.relationshipType ?? '').toLowerCase().includes(q) ||
      c.tags.some((t) => t.toLowerCase().includes(q))
    )
  }, [contacts, search])

  return (
    <div className="flex flex-col h-[calc(100vh-96px)] safe-top overflow-y-auto">
      <div className="px-4 pt-6 pb-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">Contacts</h1>
            {!loading && (
              <p className="text-xs text-white/30 mt-0.5">{contacts.length} people in your network</p>
            )}
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="w-9 h-9 rounded-xl glass border border-white/10 flex items-center justify-center text-white/60 hover:text-white transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
          <input
            type="text"
            placeholder="Search by name, role, organization…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#7C3AED]/50"
          />
        </div>

        {/* List */}
        {loading ? (
          <div className="space-y-2">
            {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-16 rounded-2xl" />)}
          </div>
        ) : (
          <ContactList
            contacts={filtered}
            loading={false}
            error={error}
            onEdit={setEditingContact}
            onDelete={deleteContact}
            onAddNote={setNoteContact}
          />
        )}

        {/* Hint */}
        {!loading && contacts.length > 0 && !search && (
          <p className="text-[10px] text-white/20 text-center pt-2">
            Tap a contact to expand · Ask ARIA to find or update contacts
          </p>
        )}

        {/* Empty state with ARIA tip */}
        {!loading && contacts.length === 0 && (
          <div className="glass border border-white/5 rounded-2xl px-4 py-8 text-center">
            <Users className="w-10 h-10 text-white/10 mx-auto mb-3" />
            <p className="text-sm text-white/30 mb-1">No contacts yet</p>
            <p className="text-xs text-white/20">
              Try: "Remember Rahul is my college friend" in the chat
            </p>
          </div>
        )}
      </div>

      <ContactQuickAddModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} />
      <ContactEditModal contact={editingContact} onClose={() => setEditingContact(null)} />
      <AddNoteModal contact={noteContact} onClose={() => setNoteContact(null)} />
    </div>
  )
}
