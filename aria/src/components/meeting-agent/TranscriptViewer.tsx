import { FileText } from 'lucide-react'

interface TranscriptChunk {
  transcriptId: string
  text: string
  speakerLabel?: string
  startMs?: number
  chunkIndex: number
  createdAt: string
}

interface Props {
  chunks: TranscriptChunk[]
  loading?: boolean
}

function formatMs(ms: number): string {
  const s = Math.floor(ms / 1000)
  const m = Math.floor(s / 60)
  return `${String(m).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
}

export default function TranscriptViewer({ chunks, loading }: Props) {
  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-12 rounded-lg bg-white/5 animate-pulse" />
        ))}
      </div>
    )
  }

  if (chunks.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-10 text-white/30">
        <FileText className="w-8 h-8" />
        <p className="text-sm">No transcript yet. Start the session to begin transcription.</p>
      </div>
    )
  }

  return (
    <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
      {chunks.map((chunk) => (
        <div key={chunk.transcriptId} className="p-3 rounded-lg bg-white/5 border border-white/5">
          <div className="flex items-center gap-2 mb-1">
            {chunk.speakerLabel && (
              <span className="text-xs font-medium text-[#7C3AED]">{chunk.speakerLabel}</span>
            )}
            {chunk.startMs !== undefined && (
              <span className="text-xs text-white/30">{formatMs(chunk.startMs)}</span>
            )}
          </div>
          <p className="text-sm text-white/80 leading-relaxed">{chunk.text}</p>
        </div>
      ))}
    </div>
  )
}
