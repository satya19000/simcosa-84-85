import { Star, Download, ShieldCheck } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import type { MarketplaceItemRecord } from '@/lib/marketplaceService'

interface MarketplaceCardProps {
  item: MarketplaceItemRecord
  onClick: () => void
}

export function MarketplaceCard({ item, onClick }: MarketplaceCardProps) {
  const { manifest } = item
  return (
    <button onClick={onClick} className="w-full text-left">
      <Card className="p-4 hover:border-white/20 transition-colors">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#7C3AED] to-[#06B6D4] flex items-center justify-center flex-shrink-0 text-white text-sm font-bold">
            {manifest.icon ? (
              <img src={manifest.icon} alt="" className="w-full h-full rounded-xl object-cover" />
            ) : (
              manifest.name.charAt(0).toUpperCase()
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-semibold text-white truncate">{manifest.name}</p>
              {manifest.securityLevel === 'low' && <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />}
            </div>
            <p className="text-xs text-white/40 truncate">{manifest.author}</p>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-white/50 flex-shrink-0">
            {manifest.category}
          </span>
        </div>
        <p className="text-xs text-white/60 leading-relaxed mt-3 line-clamp-2">{manifest.description}</p>
        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-white/5">
          <div className="flex items-center gap-1 text-xs text-white/40">
            <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            {item.ratingAverage.toFixed(1)} ({item.ratingCount})
          </div>
          <div className="flex items-center gap-1 text-xs text-white/40">
            <Download className="w-3.5 h-3.5" />
            {item.installCount}
          </div>
          <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-[#7C3AED]/10 text-[#7C3AED] capitalize">
            {manifest.pricingModel.replace('_', ' ')}
          </span>
        </div>
      </Card>
    </button>
  )
}
