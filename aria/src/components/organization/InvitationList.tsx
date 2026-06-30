import { useState } from 'react'
import { Mail, X, Clock } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import type { InvitationRecord } from '@/lib/organizationService'

interface Props {
  invitations: InvitationRecord[]
  canManage: boolean
  onRevoke: (invitationId: string) => void | Promise<void>
}

const STATUS_COLOR: Record<string, string> = {
  pending: 'text-amber-400',
  accepted: 'text-emerald-400',
  declined: 'text-white/30',
  revoked: 'text-white/30',
  expired: 'text-red-400/70',
}

export function InvitationList({ invitations, canManage, onRevoke }: Props) {
  const [busyId, setBusyId] = useState<string | null>(null)

  async function handleRevoke(invitationId: string) {
    setBusyId(invitationId)
    try { await onRevoke(invitationId) } finally { setBusyId(null) }
  }

  if (invitations.length === 0) {
    return <p className="text-sm text-white/30 text-center py-8">No pending invitations</p>
  }

  return (
    <div className="space-y-2">
      {invitations.map((inv) => (
        <Card key={inv.invitationId} className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0">
            <Mail className="w-4 h-4 text-white/40" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-white truncate">{inv.email}</p>
            <p className={`text-xs capitalize flex items-center gap-1 ${STATUS_COLOR[inv.status] ?? 'text-white/40'}`}>
              <Clock className="w-3 h-3" />{inv.status} · {inv.role}
            </p>
          </div>
          {canManage && inv.status === 'pending' && (
            <button
              onClick={() => void handleRevoke(inv.invitationId)}
              disabled={busyId === inv.invitationId}
              className="text-white/40 hover:text-red-400 disabled:opacity-50 flex-shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </Card>
      ))}
    </div>
  )
}
