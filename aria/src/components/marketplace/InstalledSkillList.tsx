import { Power, PowerOff, Trash2 } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import type { SkillInstallationRecord } from '@/lib/marketplaceService'

interface InstalledSkillListProps {
  installations: SkillInstallationRecord[]
  busyId: string | null
  onEnable: (installationId: string) => void
  onDisable: (installationId: string) => void
  onUninstall: (installationId: string) => void
}

const STATUS_COLOR: Record<string, string> = {
  installed: 'text-white/50',
  enabled: 'text-emerald-400',
  disabled: 'text-white/30',
  submitted: 'text-amber-400',
  removed: 'text-red-400',
}

export function InstalledSkillList({ installations, busyId, onEnable, onDisable, onUninstall }: InstalledSkillListProps) {
  if (installations.length === 0) {
    return <p className="text-xs text-white/30 text-center py-6">No skills installed in this tenant yet.</p>
  }

  return (
    <div className="space-y-2">
      {installations.map((inst) => (
        <Card key={inst.installationId} className="p-3.5">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-sm text-white truncate">{inst.itemId}</p>
              <p className={`text-[10px] mt-0.5 capitalize ${STATUS_COLOR[inst.status] ?? 'text-white/30'}`}>
                {inst.status === 'submitted' ? 'pending approval' : inst.status}
              </p>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {inst.status === 'disabled' && (
                <Button size="sm" variant="ghost" disabled={busyId === inst.installationId} onClick={() => onEnable(inst.installationId)}>
                  <Power className="w-3.5 h-3.5" />
                </Button>
              )}
              {(inst.status === 'installed' || inst.status === 'enabled') && (
                <Button size="sm" variant="ghost" disabled={busyId === inst.installationId} onClick={() => onDisable(inst.installationId)}>
                  <PowerOff className="w-3.5 h-3.5" />
                </Button>
              )}
              {inst.status !== 'removed' && (
                <Button size="sm" variant="danger" disabled={busyId === inst.installationId} onClick={() => onUninstall(inst.installationId)}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}
