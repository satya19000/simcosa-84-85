import { Layers, ChevronRight, Archive } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import type { WorkspaceRecord } from '@/lib/organizationService'

interface Props {
  workspace: WorkspaceRecord
  onClick: () => void
}

export function WorkspaceCard({ workspace, onClick }: Props) {
  return (
    <button onClick={onClick} className="w-full text-left">
      <Card className="flex items-center gap-3 hover:bg-white/5 transition-colors" glow={workspace.archived ? 'none' : 'cyan'}>
        <div className="w-10 h-10 rounded-xl bg-[#06B6D4]/10 border border-[#06B6D4]/20 flex items-center justify-center flex-shrink-0">
          <Layers className="w-5 h-5 text-[#06B6D4]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white truncate flex items-center gap-1.5">
            {workspace.name}
            {workspace.archived && <Archive className="w-3 h-3 text-white/30" />}
          </p>
          {workspace.description && (
            <p className="text-xs text-white/40 truncate">{workspace.description}</p>
          )}
        </div>
        <ChevronRight className="w-4 h-4 text-white/20 flex-shrink-0" />
      </Card>
    </button>
  )
}
