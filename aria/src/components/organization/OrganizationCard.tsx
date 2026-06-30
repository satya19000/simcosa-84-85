import { Building2, ChevronRight } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import type { OrganizationRecord } from '@/lib/organizationService'

const TYPE_LABELS: Record<string, string> = {
  personal: 'Personal',
  team: 'Team',
  department: 'Department',
  hospital: 'Hospital',
  government_office: 'Government Office',
  enterprise: 'Enterprise',
}

interface Props {
  organization: OrganizationRecord
  onClick: () => void
}

export function OrganizationCard({ organization, onClick }: Props) {
  return (
    <button onClick={onClick} className="w-full text-left">
      <Card className="flex items-center gap-3 hover:bg-white/5 transition-colors">
        <div className="w-10 h-10 rounded-xl bg-[#7C3AED]/10 border border-[#7C3AED]/20 flex items-center justify-center flex-shrink-0">
          <Building2 className="w-5 h-5 text-[#7C3AED]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white truncate">{organization.name}</p>
          <p className="text-xs text-white/40">{TYPE_LABELS[organization.type] ?? organization.type}</p>
        </div>
        <ChevronRight className="w-4 h-4 text-white/20 flex-shrink-0" />
      </Card>
    </button>
  )
}
