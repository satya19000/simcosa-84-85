import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Users } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { createContact } from '@/lib/contactService'
import type { PreferredContactMethod } from '@/lib/types'

const METHODS: { value: PreferredContactMethod; label: string }[] = [
  { value: 'unknown', label: 'Not specified' },
  { value: 'phone', label: 'Phone call' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'email', label: 'Email' },
  { value: 'sms', label: 'SMS' },
]

interface ContactQuickAddModalProps {
  isOpen: boolean
  onClose: () => void
}

export function ContactQuickAddModal({ isOpen, onClose }: ContactQuickAddModalProps) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('')
  const [organization, setOrganization] = useState('')
  const [relationshipType, setRelationshipType] = useState('')
  const [preferredContactMethod, setPreferredContactMethod] = useState<PreferredContactMethod>('unknown')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function reset() {
    setName(''); setPhone(''); setEmail(''); setRole('')
    setOrganization(''); setRelationshipType('')
    setPreferredContactMethod('unknown'); setError(null)
  }

  function handleClose() { reset(); onClose() }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true); setError(null)
    try {
      await createContact({
        name: name.trim(),
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        role: role.trim() || undefined,
        organization: organization.trim() || undefined,
        relationshipType: relationshipType.trim() || undefined,
        preferredContactMethod,
      })
      handleClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create contact')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
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
            className="fixed inset-x-4 bottom-0 mb-6 z-50 glass border border-white/15 rounded-3xl p-6 shadow-2xl shadow-black/60 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-[#7C3AED]" />
                New Contact
              </h2>
              <button onClick={handleClose} className="text-white/40 hover:text-white/70 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              {error && <div className="text-xs text-red-400 bg-red-500/10 rounded-xl px-3 py-2">{error}</div>}

              <Input placeholder="Name *" value={name} onChange={(e) => setName(e.target.value)} autoFocus required />
              <Input placeholder="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
              <Input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
              <Input placeholder="Role / Title (e.g. Medical Officer)" value={role} onChange={(e) => setRole(e.target.value)} />
              <Input placeholder="Organization / Office" value={organization} onChange={(e) => setOrganization(e.target.value)} />
              <Input placeholder="Relationship type (e.g. college friend, cousin, doctor)" value={relationshipType} onChange={(e) => setRelationshipType(e.target.value)} />

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
                Save Contact
              </Button>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
