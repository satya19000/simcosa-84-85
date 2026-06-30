import { Button } from '@/components/ui/Button'
import type { SkillPermissionGrantRecord } from '@/lib/marketplaceService'

interface SkillPermissionListProps {
  grants: SkillPermissionGrantRecord[]
  busyId: string | null
  onRevoke: (permissionId: string) => void
}

export function SkillPermissionList({ grants, busyId, onRevoke }: SkillPermissionListProps) {
  if (grants.length === 0) {
    return <p className="text-xs text-white/30 text-center py-6">No permission grants recorded for this tenant.</p>
  }

  return (
    <div className="space-y-2">
      {grants.map((g) => (
        <div key={g.permissionId} className="flex items-center justify-between gap-2 glass border border-white/10 rounded-xl px-3.5 py-2.5">
          <div className="min-w-0">
            <p className="text-xs font-mono text-white/70 truncate">{g.scope}</p>
            <p className="text-[10px] text-white/30 mt-0.5">{g.itemId}</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className={`text-[10px] px-2 py-0.5 rounded-full ${g.granted ? 'bg-emerald-500/10 text-emerald-400' : 'bg-white/5 text-white/30'}`}>
              {g.granted ? 'granted' : 'revoked'}
            </span>
            {g.granted && (
              <Button size="sm" variant="danger" disabled={busyId === g.permissionId} onClick={() => onRevoke(g.permissionId)}>
                Revoke
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
