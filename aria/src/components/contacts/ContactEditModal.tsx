import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Users } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { updateContact } from '@/lib/contactService'
import type { Contact, PreferredContactMethod } from '@/lib/types'

const METHODS: { value: PreferredContactMethod; label: string }[] = [
  { value: 'unknown', label: 'Not specified' },
  { value: 'phone', label: 'Phone call' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'email', label: 'Email' },
  { value: 'sms', label: 'SMS' },
]

interface ContactEditModalProps {
  contact: Contact | null
  onClose: () => void
}

export function ContactEditModal({ contact, onClose }: ContactEditModalProps) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('')
  const [organization, setOrganization] = useState('')
  const [relationshipType, setRelationshipType] = useState('')
  const [preferredContactMethod, setPreferredContactMethod] = useState<PreferredContactMethod>('unknown')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (contact) {
      setName(contact.name)
      setPhone(contact.phone ?? '')
      setEmail(contact.email ?? '')
      setRole(contact.role ?? '')
      setOrganization(contact.organization ?? '')
      setRelationshipType(contact.relationshipType ?? '')
      setPreferredContactMethod(contact.preferredContactMethod ?? 'unknown')
      setError(null)
    }
  }, [contact])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!contact || !name.trim()) return
    setLoading(true); setError(null)
    try {
      await updateContact({
        contactId: contact.id,
        name: name.trim(),
        phone: phone.trim() || null,
        email: email.trim() || null,
        role: role.trim() || null,
        organization: organization.trim() || null,
        relationshipType: relationshipType.trim() || null,
        preferredContactMethod,
      })
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update contact')
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
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: 60, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 60, scale: 0.95 }}
            transition={{ type: 'spring', damping: 26, stiffness: 320 }}
            className="fixed inset-x-4 bottom-0 mb-6 z-50 glass border border-white/15 rounded-3xl p-6 shadow-2xl shadow-black/60 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-[#7C3AED]" />
                Edit Contact
              </h2>
              <button onClick={onClose} className="text-white/40 hover:text-white/70 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              {error && <div className="text-xs text-red-400 bg-red-500/10 rounded-xl px-3 py-2">{error}</div>}

              <Input placeholder="Name *" value={name} onChange={(e) => setName(e.target.value)} required autoFocus />
              <Input placeholder="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
              <Input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
              <Input placeholder="Role / Title" value={role} onChange={(e) => setRole(e.target.value)} />
              <Input placeholder="Organization / Office" value={organization} onChange={(e) => setOrganization(e.target.value)} />
              <Input placeholder="Relationship type" value={relationshipType} onChange={(e) => setRelationshipType(e.target.value)} />

              <select
                value={preferredContactMethod}
                onChange={(e) => setPreferredContactMethod(e.target.value as PreferredContactMethod)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white/80 focus:outline-none focus:border-[#7C3AED]/50"
              >
                {METHODS.map((m) => (
                  <option key={m.value} value={m.value} className="bg-[#0A0E27]">{m.label}</option>
                ))}
              </select>

              <Button type="submit" variant="primary" loading={loading} disabled={!name.trim() || loading} className="w-full">
                Save Changes
              </Button>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
