import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { inviteMember, MEMBER_ROLES, type MemberRole, type InvitationRecord } from '@/lib/organizationService'

interface Props {
  open: boolean
  organizationId: string
  workspaceId?: string
  onClose: () => void
  onInvited: (invitation: InvitationRecord) => void
}

export function InviteMemberModal({ open, organizationId, workspaceId, onClose, onInvited }: Props) {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<MemberRole>('staff')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit() {
    if (!email.trim()) { setError('Email is required'); return }
    setLoading(true)
    setError('')
    try {
      const invitation = await inviteMember(organizationId, email.trim(), role, workspaceId)
      setEmail(''); setRole('staff')
      onInvited(invitation)
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to invite member')
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
              <h2 className="text-lg font-semibold text-white">Invite Member</h2>
              <button onClick={onClose} className="text-white/40 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="person@example.com" />

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-white/60 uppercase tracking-wider">Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as MemberRole)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED]"
              >
                {MEMBER_ROLES.filter((r) => r !== 'owner').map((r) => (
                  <option key={r} value={r} className="bg-[#0A0E27] capitalize">{r}</option>
                ))}
              </select>
            </div>

            {error && <p className="text-xs text-red-400">{error}</p>}

            <Button onClick={handleSubmit} loading={loading} className="w-full">
              Send Invitation
            </Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
