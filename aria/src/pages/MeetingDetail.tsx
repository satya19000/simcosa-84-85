import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Download, ListChecks } from 'lucide-react'
import {
  startMeetingSession,
  pauseMeetingSession,
  endMeetingSession,
  getMeetingSummary,
  generateMeetingSummary,
  extractMeetingActionItems,
  exportMeetingNotes,
  listMeetingSessions,
  type MeetingSession,
  type MeetingSummary,
  type MeetingActionItem,
} from '../lib/meetingAgentService'
import { listMyTenants } from '../lib/securityService'
import MeetingRecorderPanel from '../components/meeting-agent/MeetingRecorderPanel'
import MeetingConsentBanner from '../components/meeting-agent/MeetingConsentBanner'
import MeetingSummaryPanel from '../components/meeting-agent/MeetingSummaryPanel'
import ActionItemSuggestionList from '../components/meeting-agent/ActionItemSuggestionList'
import ParticipantList from '../components/meeting-agent/ParticipantList'

export default function MeetingDetail() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const navigate = useNavigate()
  const [session, setSession] = useState<MeetingSession | null>(null)
  const [summary, setSummary] = useState<MeetingSummary | null>(null)
  const [actionItems, setActionItems] = useState<MeetingActionItem[]>([])
  const [tenantId, setTenantId] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [summaryBusy, setSummaryBusy] = useState(false)
  const [actionBusy, setActionBusy] = useState(false)
  const [activeTab, setActiveTab] = useState<'transcript' | 'summary' | 'actions' | 'participants'>('summary')

  useEffect(() => {
    void load()
  }, [sessionId])

  async function load() {
    setLoading(true)
    try {
      const tenants = await listMyTenants()
      if (tenants.length === 0) throw new Error('No tenants found')
      const tid = tenants[0].tenantId
      setTenantId(tid)

      const sessions = await listMeetingSessions(tid)
      const found = sessions.find((s) => s.sessionId === sessionId)
      if (found) {
        setSession(found)
        const sum = await getMeetingSummary(tid, found.sessionId)
        setSummary(sum)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }

  async function handleStart() {
    if (!session || !tenantId) return
    const updated = await startMeetingSession(tenantId, session.sessionId)
    setSession(updated)
  }

  async function handlePause() {
    if (!session || !tenantId) return
    const updated = await pauseMeetingSession(tenantId, session.sessionId)
    setSession(updated)
  }

  async function handleEnd() {
    if (!session || !tenantId) return
    const updated = await endMeetingSession(tenantId, session.sessionId)
    setSession(updated)
  }

  async function handleGenerateSummary() {
    if (!session || !tenantId) return
    setSummaryBusy(true)
    setError('')
    try {
      const sum = await generateMeetingSummary(tenantId, session.sessionId)
      setSummary(sum)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to generate summary')
    } finally {
      setSummaryBusy(false)
    }
  }

  async function handleExtractActions() {
    if (!session || !tenantId) return
    setActionBusy(true)
    setError('')
    try {
      const items = await extractMeetingActionItems(tenantId, session.sessionId)
      setActionItems(items)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to extract action items')
    } finally {
      setActionBusy(false)
    }
  }

  async function handleExport() {
    if (!session || !tenantId) return
    try {
      const result = await exportMeetingNotes(tenantId, session.sessionId, 'markdown')
      const blob = new Blob([result.content], { type: result.mimeType })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = result.fileName
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to export')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[#7C3AED]/40 border-t-[#7C3AED] animate-spin" />
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-[#0A0A0F] flex flex-col items-center justify-center gap-3 text-white/40">
        <p>Session not found.</p>
        <button onClick={() => navigate('/meetings')} className="text-[#7C3AED] text-sm">Back to Meetings</button>
      </div>
    )
  }

  const tabs = [
    { key: 'summary' as const, label: 'Summary' },
    { key: 'actions' as const, label: 'Actions' },
    { key: 'participants' as const, label: 'Participants' },
  ]

  return (
    <div className="min-h-screen bg-[#0A0A0F] pb-20">
      <div className="max-w-lg mx-auto px-4 pt-8">
        <button onClick={() => navigate('/meetings')} className="flex items-center gap-2 text-white/50 hover:text-white/80 text-sm mb-5">
          <ArrowLeft className="w-4 h-4" />
          Meetings
        </button>

        <div className="mb-4">
          <h1 className="text-lg font-bold text-white">{session.title}</h1>
          <p className="text-xs text-white/40 mt-0.5 capitalize">{session.type.replace(/([A-Z])/g, ' $1').trim()}</p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-900/20 border border-red-700/40 text-red-400 text-sm">{error}</div>
        )}

        {/* Consent banner */}
        <MeetingConsentBanner
          consentStatus={session.consentStatus}
          isRecording={session.status === 'active'}
        />

        <div className="mt-4">
          <MeetingRecorderPanel
            session={session}
            onStart={handleStart}
            onPause={handlePause}
            onEnd={handleEnd}
          />
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 mt-4">
          <button
            onClick={handleExtractActions}
            disabled={actionBusy}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl glass border border-white/10 text-xs text-white/60 hover:text-white/80 transition-colors disabled:opacity-50"
          >
            <ListChecks className="w-3.5 h-3.5" />
            {actionBusy ? 'Extracting…' : 'Extract Actions'}
          </button>
          <button
            onClick={handleExport}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl glass border border-white/10 text-xs text-white/60 hover:text-white/80 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Export
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mt-5 p-1 rounded-xl bg-white/5 border border-white/10">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${
                activeTab === tab.key
                  ? 'bg-[#7C3AED]/70 text-white'
                  : 'text-white/40 hover:text-white/70'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="mt-4">
          {activeTab === 'summary' && (
            <MeetingSummaryPanel
              summary={summary}
              onGenerate={handleGenerateSummary}
              generatingBusy={summaryBusy}
            />
          )}
          {activeTab === 'actions' && (
            <ActionItemSuggestionList items={actionItems} />
          )}
          {activeTab === 'participants' && (
            <ParticipantList participants={session.participants} />
          )}
        </div>
      </div>
    </div>
  )
}
