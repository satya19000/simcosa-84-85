import { Star, Download, ShieldAlert, ShieldCheck, Shield } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import type { MarketplaceItemRecord, SkillPermissionScope } from '@/lib/marketplaceService'

interface SkillDetailPanelProps {
  item: MarketplaceItemRecord
}

const RISK_ICON: Record<string, typeof Shield> = {
  low: ShieldCheck,
  medium: Shield,
  high: ShieldAlert,
}

const RISK_COLOR: Record<string, string> = {
  low: 'text-emerald-400',
  medium: 'text-amber-400',
  high: 'text-red-400',
}

export function SkillDetailPanel({ item }: SkillDetailPanelProps) {
  const { manifest } = item
  const RiskIcon = RISK_ICON[manifest.securityLevel] ?? Shield

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex items-start gap-3">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#7C3AED] to-[#06B6D4] flex items-center justify-center flex-shrink-0 text-white text-xl font-bold">
            {manifest.icon ? (
              <img src={manifest.icon} alt="" className="w-full h-full rounded-2xl object-cover" />
            ) : (
              manifest.name.charAt(0).toUpperCase()
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-white">{manifest.name}</h2>
            <p className="text-xs text-white/40">by {manifest.author} &middot; v{manifest.version}</p>
            <div className="flex items-center gap-3 mt-2">
              <div className="flex items-center gap-1 text-xs text-white/60">
                <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                {item.ratingAverage.toFixed(1)} ({item.ratingCount})
              </div>
              <div className="flex items-center gap-1 text-xs text-white/60">
                <Download className="w-3.5 h-3.5" />
                {item.installCount} installs
              </div>
              <div className={`flex items-center gap-1 text-xs ${RISK_COLOR[manifest.securityLevel]}`}>
                <RiskIcon className="w-3.5 h-3.5" />
                {manifest.securityLevel} risk
              </div>
            </div>
          </div>
        </div>
        <p className="text-sm text-white/70 leading-relaxed mt-4">{manifest.description}</p>
      </Card>

      <Card className="p-4">
        <p className="text-[10px] text-white/40 uppercase tracking-widest font-medium mb-2">Requested Permissions</p>
        <div className="flex flex-wrap gap-1.5">
          {manifest.permissions.length === 0 && <span className="text-xs text-white/30">None</span>}
          {manifest.permissions.map((p: SkillPermissionScope) => (
            <span key={p} className="text-[10px] px-2 py-1 rounded-full bg-white/5 text-white/60 font-mono">
              {p}
            </span>
          ))}
        </div>
      </Card>

      {manifest.capabilities.length > 0 && (
        <Card className="p-4">
          <p className="text-[10px] text-white/40 uppercase tracking-widest font-medium mb-2">Capabilities</p>
          <div className="flex flex-wrap gap-1.5">
            {manifest.capabilities.map((c) => (
              <span key={c} className="text-[10px] px-2 py-1 rounded-full bg-[#06B6D4]/10 text-[#06B6D4]">
                {c}
              </span>
            ))}
          </div>
        </Card>
      )}

      <Card className="p-4">
        <p className="text-[10px] text-white/40 uppercase tracking-widest font-medium mb-2">Details</p>
        <dl className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <dt className="text-white/30">Category</dt>
            <dd className="text-white/70 mt-0.5">{manifest.category}</dd>
          </div>
          <div>
            <dt className="text-white/30">Type</dt>
            <dd className="text-white/70 mt-0.5 capitalize">{manifest.itemType.replace('_', ' ')}</dd>
          </div>
          <div>
            <dt className="text-white/30">Pricing</dt>
            <dd className="text-white/70 mt-0.5 capitalize">{manifest.pricingModel.replace('_', ' ')}</dd>
          </div>
          <div>
            <dt className="text-white/30">Installation Scope</dt>
            <dd className="text-white/70 mt-0.5 capitalize">{manifest.installationType}</dd>
          </div>
        </dl>
      </Card>
    </div>
  )
}
