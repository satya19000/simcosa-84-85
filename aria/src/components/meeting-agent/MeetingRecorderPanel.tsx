import { useState } from 'react'
import { Mic, Pause, Square } from 'lucide-react'
import type { MeetingSession } from '../../lib/meetingAgentService'

interface Props {
  session: MeetingSession
  onStart: () => Promise<void>
  onPause: () => Promise<void>
  onEnd: () => Promise<void>
}

export default function MeetingRecorderPanel({ session, onStart, onPause, onEnd }: Props) {
  const [busy, setBusy] = useState(false)

  const isActive = session.status === 'active'
  const isPaused = session.status === 'paused'

  async function handle(fn: () => Promise<void>) {
    setBusy(true)
    try { await fn() } finally { setBusy(false) }
  }

  return (
    <div className="p-4 rounded-xl glass border border-white/10">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {isActive ? (
            <>
              <span className="inline-block w-3 h-3 rounded-full bg-red-500 animate-pulse" />
              <span className="text-sm font-semibold text-red-400">Recording in Progress</span>
            </>
          ) : isPaused ? (
            <>
              <span className="inline-block w-3 h-3 rounded-full bg-yellow-400" />
              <span className="text-sm font-semibold text-yellow-400">Paused</span>
            </>
          ) : (
            <>
              <Mic className="w-4 h-4 text-white/40" />
              <span className="text-sm font-semibold text-white/60">Ready to Start</span>
            </>
          )}
        </div>
        <span className="text-xs text-white/30 capitalize">{session.status}</span>
      </div>

      <p className="text-xs text-white/40 mb-4">
        {isActive
          ? 'Transcription is active. Tap Pause to pause or Stop to end the session.'
          : isPaused
          ? 'Session is paused. Resume or end the session.'
          : 'Start the session to begin transcription. Your explicit consent is required.'}
      </p>

      <div className="flex gap-2">
        {(session.status === 'consentRequired' || session.status === 'draft') && (
          <button
            onClick={() => handle(onStart)}
            disabled={busy}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#7C3AED]/80 hover:bg-[#7C3AED] text-white text-sm font-semibold transition-colors disabled:opacity-50"
          >
            <Mic className="w-4 h-4" />
            Start Session
          </button>
        )}

        {isActive && (
          <>
            <button
              onClick={() => handle(onPause)}
              disabled={busy}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-yellow-700/40 border border-yellow-600/40 text-yellow-300 text-sm font-semibold transition-colors disabled:opacity-50"
            >
              <Pause className="w-4 h-4" />
              Pause
            </button>
            <button
              onClick={() => handle(onEnd)}
              disabled={busy}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-700/30 border border-red-600/40 text-red-300 text-sm font-semibold transition-colors disabled:opacity-50"
            >
              <Square className="w-4 h-4" />
              End Session
            </button>
          </>
        )}

        {isPaused && (
          <>
            <button
              onClick={() => handle(onStart)}
              disabled={busy}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#7C3AED]/60 hover:bg-[#7C3AED]/80 text-white text-sm font-semibold transition-colors disabled:opacity-50"
            >
              <Mic className="w-4 h-4" />
              Resume
            </button>
            <button
              onClick={() => handle(onEnd)}
              disabled={busy}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-700/30 border border-red-600/40 text-red-300 text-sm font-semibold transition-colors disabled:opacity-50"
            >
              <Square className="w-4 h-4" />
              End
            </button>
          </>
        )}
      </div>
    </div>
  )
}
