import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { createOrganization, type OrganizationType } from '@/lib/organizationService'

const ORG_TYPES: { value: OrganizationType; label: string }[] = [
  { value: 'personal', label: 'Personal' },
  { value: 'team', label: 'Team' },
  { value: 'department', label: 'Department' },
  { value: 'hospital', label: 'Hospital' },
  { value: 'government_office', label: 'Government Office' },
  { value: 'enterprise', label: 'Enterprise' },
]

interface Props {
  open: boolean
  onClose: () => void
  onCreated: (organizationId: string) => void
}

export function CreateOrganizationModal({ open, onClose, onCreated }: Props) {
  const [name, setName] = useState('')
  const [type, setType] = useState<OrganizationType>('team')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit() {
    if (!name.trim()) { setError('Name is required'); return }
    setLoading(true)
    setError('')
    try {
      const org = await createOrganization({ name: name.trim(), type, description: description.trim() || undefined })
      setName(''); setDescription(''); setType('team')
      onCreated(org.organizationId)
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create organization')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
            className="glass border border-white/10 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md p-5 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">New Organization</h2>
              <button onClick={onClose} className="text-white/40 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Acme Inc." />

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-white/60 uppercase tracking-wider">Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as OrganizationType)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED]"
              >
                {ORG_TYPES.map((t) => (
                  <option key={t.value} value={t.value} className="bg-[#0A0E27]">{t.label}</option>
                ))}
              </select>
            </div>

            <Input label="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What is this organization for?" />

            {error && <p className="text-xs text-red-400">{error}</p>}

            <Button onClick={handleSubmit} loading={loading} className="w-full">
              Create Organization
            </Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
