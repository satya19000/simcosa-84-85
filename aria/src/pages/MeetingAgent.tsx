import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Mic, RefreshCw } from 'lucide-react'
import { listMyTenants, type TenantRecord } from '../lib/securityService'
import {
  createMeetingSession,
  listMeetingSessions,
  type MeetingSession,
  type MeetingType,
} from '../lib/meetingAgentService'
import MeetingSessionCard from '../components/meeting-agent/MeetingSessionCard'

const MEETING_TYPES: { value: MeetingType; label: string }[] = [
  { value: 'voiceNote', label: 'Voice Note' },
  { value: 'phoneCallNote', label: 'Phone Call Note' },
  { value: 'onlineMeeting', label: 'Online Meeting' },
  { value: 'physicalMeeting', label: 'Physical Meeting' },
  { value: 'consultation', label: 'Consultation' },
  { value: 'reviewMeeting', label: 'Review Meeting' },
  { value: 'publicHealthMeeting', label: 'Public Health Meeting' },
  { value: 'custom', label: 'Custom' },
]

export default function MeetingAgent() {
  const navigate = useNavigate()
  const [tenants, setTenants] = useState<TenantRecord[]>([])
  const [selectedTenantId, setSelectedTenantId] = useState('')
  const [sessions, setSessions] = useState<MeetingSession[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [createBusy, setCreateBusy] = useState(false)

  // Create form
  const [title, setTitle] = useState('')
  const [type, setType] = useState<MeetingType>('onlineMeeting')
  const [language, setLanguage] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    void loadTenants()
  }, [])

  useEffect(() => {
    if (selectedTenantId) void loadSessions()
  }, [selectedTenantId])

  async function loadTenants() {
    try {
      const list = await listMyTenants()
      setTenants(list)
      if (list.length > 0) setSelectedTenantId(list[0].tenantId)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load tenants')
    } finally {
      setLoading(false)
    }
  }

  async function loadSessions() {
    if (!selectedTenantId) return
    setLoading(true)
    try {
      const list = await listMeetingSessions(selectedTenantId)
      setSessions(list)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load sessions')
    } finally {
      setLoading(false)
    }
  }

  async function handleCreate() {
    if (!title.trim() || !selectedTenantId) return
    setCreateBusy(true)
    setError('')
    try {
      const session = await createMeetingSession({
        tenantId: selectedTenantId,
        title: title.trim(),
        type,
        language: language.trim() || undefined,
        notes: notes.trim() || undefined,
      })
      setShowCreate(false)
      setTitle('')
      setNotes('')
      navigate(`/meetings/${session.sessionId}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create session')
    } finally {
      setCreateBusy(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0A0A0F] pb-20">
      <div className="max-w-lg mx-auto px-4 pt-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-white">Meeting Agent</h1>
            <p className="text-xs text-white/40 mt-0.5">Voice notes, calls & meeting transcription</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => void loadSessions()} className="p-2 rounded-lg glass border border-white/10 text-white/50 hover:text-white/80">
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowCreate(!showCreate)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#7C3AED]/80 hover:bg-[#7C3AED] text-white text-sm font-semibold transition-colors"
            >
              <Plus className="w-4 h-4" />
              New
            </button>
          </div>
        </div>

        {/* Tenant selector */}
        {tenants.length > 1 && (
          <select
            value={selectedTenantId}
            onChange={(e) => setSelectedTenantId(e.target.value)}
            className="w-full mb-4 px-3 py-2 rounded-xl glass border border-white/10 text-sm text-white/80 bg-transparent"
          >
            {tenants.map((t) => (
              <option key={t.tenantId} value={t.tenantId} className="bg-[#1a1a2e]">{t.name}</option>
            ))}
          </select>
        )}

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-900/20 border border-red-700/40 text-red-400 text-sm">{error}</div>
        )}

        {/* Create form */}
        {showCreate && (
          <div className="mb-6 p-4 rounded-xl glass border border-[#7C3AED]/30">
            <p className="text-sm font-semibold text-white/90 mb-4 flex items-center gap-2">
              <Mic className="w-4 h-4 text-[#7C3AED]" />
              New Meeting Session
            </p>
            <div className="space-y-3">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Session title"
                className="w-full px-3 py-2 rounded-xl glass border border-white/10 text-sm text-white/80 placeholder:text-white/20 bg-transparent"
              />
              <select
                value={type}
                onChange={(e) => setType(e.target.value as MeetingType)}
                className="w-full px-3 py-2 rounded-xl glass border border-white/10 text-sm text-white/80 bg-transparent"
              >
                {MEETING_TYPES.map((t) => (
                  <option key={t.value} value={t.value} className="bg-[#1a1a2e]">{t.label}</option>
                ))}
              </select>
              <input
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                placeholder="Language (e.g. en-US) — optional"
                className="w-full px-3 py-2 rounded-xl glass border border-white/10 text-sm text-white/80 placeholder:text-white/20 bg-transparent"
              />
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Notes / agenda — optional"
                rows={2}
                className="w-full px-3 py-2 rounded-xl glass border border-white/10 text-sm text-white/80 placeholder:text-white/20 bg-transparent resize-none"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleCreate}
                  disabled={createBusy || !title.trim()}
                  className="flex-1 py-2.5 rounded-xl bg-[#7C3AED]/80 hover:bg-[#7C3AED] text-white text-sm font-semibold transition-colors disabled:opacity-50"
                >
                  {createBusy ? 'Creating…' : 'Create Session'}
                </button>
                <button
                  onClick={() => setShowCreate(false)}
                  className="px-4 py-2.5 rounded-xl glass border border-white/10 text-white/50 text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Sessions list */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <div key={i} className="h-24 rounded-xl bg-white/5 animate-pulse" />)}
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-16 text-white/30">
            <Mic className="w-10 h-10 mx-auto mb-3" />
            <p className="text-sm">No meeting sessions yet.</p>
            <p className="text-xs mt-1">Create your first session to start transcribing.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sessions.map((s) => (
              <MeetingSessionCard
                key={s.sessionId}
                session={s}
                onClick={() => navigate(`/meetings/${s.sessionId}`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
