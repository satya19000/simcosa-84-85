import { Star } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import type { SkillReviewRecord } from '@/lib/marketplaceService'

interface SkillReviewListProps {
  reviews: SkillReviewRecord[]
}

export function SkillReviewList({ reviews }: SkillReviewListProps) {
  if (reviews.length === 0) {
    return <p className="text-xs text-white/30 text-center py-6">No reviews yet. Be the first to review this skill.</p>
  }

  return (
    <div className="space-y-2">
      {reviews.map((r) => (
        <Card key={r.reviewId} className="p-3.5">
          <div className="flex items-center gap-1 mb-1.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className={`w-3.5 h-3.5 ${i < r.rating ? 'text-amber-400 fill-amber-400' : 'text-white/10'}`} />
            ))}
            <span className="text-[10px] text-white/30 ml-1">v{r.versionReviewed}</span>
          </div>
          <p className="text-xs text-white/70 leading-relaxed">{r.reviewText}</p>
          <p className="text-[10px] text-white/20 mt-1.5">{new Date(r.createdAt).toLocaleDateString()}</p>
        </Card>
      ))}
    </div>
  )
}
