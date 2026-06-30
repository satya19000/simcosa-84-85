import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { createWorkspace, type WorkspaceRecord } from '@/lib/organizationService'

interface Props {
  open: boolean
  organizationId: string
  onClose: () => void
  onCreated: (workspace: WorkspaceRecord) => void
}

export function CreateWorkspaceModal({ open, organizationId, onClose, onCreated }: Props) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit() {
    if (!name.trim()) { setError('Name is required'); return }
    setLoading(true)
    setError('')
    try {
      const ws = await createWorkspace(organizationId, name.trim(), description.trim() || undefined)
      setName(''); setDescription('')
      onCreated(ws)
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create workspace')
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
              <h2 className="text-lg font-semibold text-white">New Workspace</h2>
              <button onClick={onClose} className="text-white/40 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Marketing Team" />
            <Input label="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What is this workspace for?" />

            {error && <p className="text-xs text-red-400">{error}</p>}

            <Button onClick={handleSubmit} loading={loading} className="w-full">
              Create Workspace
            </Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
