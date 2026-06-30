import { useState } from 'react'
import { X, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import type { MarketplaceItemRecord } from '@/lib/marketplaceService'
import type { TenantRecord } from '@/lib/securityService'

interface SkillInstallModalProps {
  isOpen: boolean
  item: MarketplaceItemRecord | null
  tenants: TenantRecord[]
  onClose: () => void
  onInstall: (tenantId: string) => Promise<void>
}

export function SkillInstallModal({ isOpen, item, tenants, onClose, onInstall }: SkillInstallModalProps) {
  const [tenantId, setTenantId] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  if (!isOpen || !item) return null

  const hasHighRiskScope = item.manifest.securityLevel === 'high' || item.manifest.permissions.some((p) =>
    ['write.finance', 'read.finance', 'write.health', 'read.health', 'send.email', 'send.sms', 'send.whatsapp'].includes(p)
  )

  async function handleInstall() {
    if (!tenantId) return
    setBusy(true)
    setError('')
    try {
      await onInstall(tenantId)
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Install failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="glass border border-white/10 rounded-2xl w-full max-w-md p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-white">Install &ldquo;{item.manifest.name}&rdquo;</h3>
          <button onClick={onClose} className="text-white/40 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {hasHighRiskScope && (
          <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 mb-4">
            <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-200/80">
              This skill requests sensitive permissions and will require approval before it becomes active.
            </p>
          </div>
        )}

        <label className="text-xs text-white/40 block mb-1.5">Install into tenant</label>
        <select
          value={tenantId}
          onChange={(e) => setTenantId(e.target.value)}
          className="w-full glass border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white mb-4 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/40"
        >
          <option value="">Select a tenant...</option>
          {tenants.map((t) => (
            <option key={t.tenantId} value={t.tenantId}>{t.name}</option>
          ))}
        </select>

        {error && <p className="text-xs text-red-400 mb-3">{error}</p>}

        <div className="flex gap-2">
          <Button variant="ghost" className="flex-1" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button className="flex-1" onClick={() => void handleInstall()} disabled={!tenantId || busy} loading={busy}>
            Install
          </Button>
        </div>
      </div>
    </div>
  )
}
