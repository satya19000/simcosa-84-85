import { ShieldCheck, Mic, MicOff } from 'lucide-react'
import type { ConsentStatus } from '../../lib/meetingAgentService'

interface Props {
  consentStatus: ConsentStatus
  isRecording: boolean
  onGrant?: () => void
  onRevoke?: () => void
}

export default function MeetingConsentBanner({ consentStatus, isRecording, onGrant, onRevoke }: Props) {
  return (
    <div className={`flex items-start gap-3 p-4 rounded-xl border ${
      consentStatus === 'granted'
        ? 'bg-green-900/20 border-green-700/40'
        : consentStatus === 'denied' || consentStatus === 'revoked'
        ? 'bg-red-900/20 border-red-700/40'
        : 'bg-yellow-900/20 border-yellow-700/40'
    }`}>
      <ShieldCheck className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
        consentStatus === 'granted' ? 'text-green-400' : consentStatus === 'denied' || consentStatus === 'revoked' ? 'text-red-400' : 'text-yellow-400'
      }`} />
      <div className="flex-1">
        <p className="text-sm font-semibold text-white/90">Recording & Transcription Consent</p>
        <p className="text-xs text-white/60 mt-1">
          {consentStatus === 'granted'
            ? 'You have enabled transcription for this session. You can pause or stop at any time.'
            : consentStatus === 'denied' || consentStatus === 'revoked'
            ? 'Consent denied or revoked. Transcription is disabled.'
            : 'Transcription requires your explicit consent. No recording happens until you start.'}
        </p>
        {isRecording && (
          <div className="flex items-center gap-1.5 mt-2">
            <span className="inline-block w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-xs text-red-400 font-medium">Transcription active</span>
          </div>
        )}
        <div className="flex gap-2 mt-3">
          {consentStatus !== 'granted' && onGrant && (
            <button
              onClick={onGrant}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-green-700/40 border border-green-600/40 text-green-300 hover:bg-green-700/60 transition-colors"
            >
              <Mic className="w-3 h-3" />
              Enable Transcription
            </button>
          )}
          {consentStatus === 'granted' && onRevoke && (
            <button
              onClick={onRevoke}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-red-700/30 border border-red-600/40 text-red-300 hover:bg-red-700/50 transition-colors"
            >
              <MicOff className="w-3 h-3" />
              Stop & Revoke
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
