import { Brain, ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'
import type { MeetingSummary } from '../../lib/meetingAgentService'

interface Props {
  summary: MeetingSummary | null
  loading?: boolean
  onGenerate?: () => void
  generatingBusy?: boolean
}

export default function MeetingSummaryPanel({ summary, loading, onGenerate, generatingBusy }: Props) {
  const [expanded, setExpanded] = useState(false)

  if (loading) {
    return <div className="h-32 rounded-xl bg-white/5 animate-pulse" />
  }

  if (!summary) {
    return (
      <div className="p-4 rounded-xl glass border border-white/10 text-center">
        <Brain className="w-8 h-8 text-white/20 mx-auto mb-2" />
        <p className="text-sm text-white/40 mb-3">No summary generated yet.</p>
        {onGenerate && (
          <button
            onClick={onGenerate}
            disabled={generatingBusy}
            className="px-4 py-2 rounded-lg bg-[#7C3AED]/70 hover:bg-[#7C3AED] text-white text-sm font-semibold transition-colors disabled:opacity-50"
          >
            {generatingBusy ? 'Generating…' : 'Generate Summary'}
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="p-4 rounded-xl glass border border-[#7C3AED]/30">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-[#7C3AED]" />
          <span className="text-sm font-semibold text-white/90">AI Summary</span>
          {summary.generatedByAI && (
            <span className="text-xs px-1.5 py-0.5 rounded bg-[#7C3AED]/20 text-[#7C3AED] border border-[#7C3AED]/30">AI</span>
          )}
        </div>
        <button onClick={() => setExpanded(!expanded)} className="text-white/40 hover:text-white/70">
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      <p className="text-sm text-white/80 leading-relaxed">{summary.shortSummary}</p>

      {expanded && (
        <div className="mt-4 space-y-4">
          <div>
            <p className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">Executive Summary</p>
            <p className="text-sm text-white/70 leading-relaxed">{summary.executiveSummary}</p>
          </div>

          {summary.decisionsMade.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">Decisions Made</p>
              <ul className="space-y-1">
                {summary.decisionsMade.map((d, i) => (
                  <li key={i} className="text-sm text-white/70 flex items-start gap-2">
                    <span className="text-[#7C3AED] mt-1">•</span>{d}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {summary.risks.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-yellow-500/70 uppercase tracking-wider mb-2">Risks</p>
              <ul className="space-y-1">
                {summary.risks.map((r, i) => (
                  <li key={i} className="text-sm text-yellow-400/80 flex items-start gap-2">
                    <span className="mt-1">⚠</span>{r}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {summary.pendingQuestions.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">Open Questions</p>
              <ul className="space-y-1">
                {summary.pendingQuestions.map((q, i) => (
                  <li key={i} className="text-sm text-white/60 flex items-start gap-2">
                    <span className="text-white/30 mt-1">?</span>{q}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
