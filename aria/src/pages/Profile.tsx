import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { LogOut, Bell, Globe, Shield, CreditCard, ChevronRight, Moon, Mic, BellOff, Users, Volume2, Play } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { useAuthStore } from '@/store/authStore'
import { auth } from '@/lib/firebase'
import { signOut } from 'firebase/auth'
import {
  getNotificationPermissionStatus,
  requestPermissionAndRegister,
  sendTestNotification,
  type NotificationPermissionStatus,
} from '@/lib/notificationService'
import { voiceManager } from '@/lib/voice/VoiceManager'

const settingsSections = [
  {
    title: 'Preferences',
    items: [
      { icon: Bell, label: 'Notifications', description: 'Manage alerts' },
      { icon: Mic, label: 'Voice & Language', description: 'ARIA voice settings' },
      { icon: Moon, label: 'Appearance', description: 'Dark mode · Theme' },
      { icon: Globe, label: 'Language', description: 'English' },
    ],
  },
  {
    title: 'Account',
    items: [
      { icon: CreditCard, label: 'Subscription', description: 'Free plan · Upgrade' },
      { icon: Shield, label: 'Privacy & Security', description: 'Data · Biometrics' },
    ],
  },
]

export default function Profile() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermissionStatus>('default')
  const [notifLoading, setNotifLoading] = useState(false)
  const [notifMessage, setNotifMessage] = useState<string | null>(null)

  const [voiceEnabled, setVoiceEnabled] = useState(false)
  const [browserVoiceName, setBrowserVoiceName] = useState('')
  const [speechRate, setSpeechRate] = useState(1)
  const [speechPitch, setSpeechPitch] = useState(1)
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([])

  useEffect(() => {
    setPermissionStatus(getNotificationPermissionStatus())

    try {
      setVoiceEnabled(localStorage.getItem('aria_voice_replies') === 'true')
      setBrowserVoiceName(localStorage.getItem('aria_browser_voice') ?? '')
      setSpeechRate(parseFloat(localStorage.getItem('aria_speech_rate') ?? '1'))
      setSpeechPitch(parseFloat(localStorage.getItem('aria_speech_pitch') ?? '1'))
    } catch { /* ignore */ }

    if (voiceManager.isSupported()) {
      const load = () => setAvailableVoices(voiceManager.getVoices())
      load()
      speechSynthesis.onvoiceschanged = load
    }
  }, [])

  function saveVoiceSetting(key: string, value: string) {
    try { localStorage.setItem(key, value) } catch { /* ignore */ }
  }

  function handleTestVoice() {
    voiceManager.speak('Hello! I am ARIA, your AI executive assistant.', {
      rate: speechRate,
      pitch: speechPitch,
      voiceName: browserVoiceName,
    })
  }

  const handleSignOut = async () => {
    await signOut(auth)
  }

  async function handleEnableNotifications() {
    setNotifLoading(true)
    setNotifMessage(null)
    const result = await requestPermissionAndRegister()
    setNotifMessage(result.message)
    setPermissionStatus(getNotificationPermissionStatus())
    setNotifLoading(false)
  }

  async function handleTestNotification() {
    setNotifLoading(true)
    setNotifMessage(null)
    const result = await sendTestNotification()
    setNotifMessage(result.message)
    setNotifLoading(false)
  }

  return (
    <div className="px-4 pt-6 pb-4 space-y-5">
      <h1 className="text-2xl font-bold text-white">Profile</h1>

      {/* User card */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <Card glow="violet" className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#7C3AED] to-[#06B6D4] flex items-center justify-center text-2xl font-bold text-white flex-shrink-0">
            {user?.displayName?.[0]?.toUpperCase() ?? user?.email?.[0]?.toUpperCase() ?? 'A'}
          </div>
          <div className="min-w-0">
            <p className="text-lg font-semibold text-white truncate">
              {user?.displayName ?? 'ARIA User'}
            </p>
            <p className="text-xs text-white/40 truncate">{user?.email}</p>
            <div className="mt-1.5 inline-flex items-center gap-1.5 bg-[#7C3AED]/15 border border-[#7C3AED]/30 rounded-full px-2 py-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#7C3AED]" />
              <span className="text-[10px] text-[#7C3AED] font-medium">Free Plan</span>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Subscription upgrade */}
      <Card glow="cyan" className="flex items-center gap-3">
        <div className="flex-1">
          <p className="text-sm font-semibold text-white">Upgrade to Professional</p>
          <p className="text-xs text-white/40 mt-0.5">Unlock all 20 ARIA features</p>
        </div>
        <button className="bg-[#06B6D4] text-white text-xs font-semibold px-3 py-1.5 rounded-lg flex-shrink-0">
          ₹799/mo
        </button>
      </Card>

      {/* Settings sections */}
      {settingsSections.map((section) => (
        <div key={section.title}>
          <h2 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">{section.title}</h2>
          <Card className="divide-y divide-white/5 p-0 overflow-hidden">
            {section.items.map(({ icon: Icon, label, description }, i) => (
              <button
                key={label}
                className={`w-full flex items-center gap-3 px-4 py-3.5 hover:bg-white/5 transition-colors text-left ${i === 0 ? 'rounded-t-2xl' : ''} ${i === section.items.length - 1 ? 'rounded-b-2xl' : ''}`}
              >
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-white/50" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white">{label}</p>
                  <p className="text-xs text-white/30">{description}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-white/20 flex-shrink-0" />
              </button>
            ))}
          </Card>
        </div>
      ))}

      {/* Contacts shortcut */}
      <button
        onClick={() => navigate('/contacts')}
        className="w-full flex items-center gap-3 glass border border-white/10 rounded-2xl px-4 py-3.5 hover:bg-white/5 transition-colors text-left"
      >
        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
          <Users className="w-4 h-4 text-emerald-400" />
        </div>
        <div className="flex-1">
          <p className="text-sm text-white">Relationship Memory</p>
          <p className="text-xs text-white/30">Contacts &amp; people ARIA knows about</p>
        </div>
        <ChevronRight className="w-4 h-4 text-white/20" />
      </button>

      {/* Notifications */}
      <div>
        <h2 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">Notifications</h2>
        <Card className="p-4 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#06B6D4]/10 flex items-center justify-center flex-shrink-0">
              {permissionStatus === 'granted' ? (
                <Bell className="w-4 h-4 text-[#06B6D4]" />
              ) : (
                <BellOff className="w-4 h-4 text-white/30" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white">Push Notifications</p>
              <p className="text-xs text-white/30 capitalize">{permissionStatus}</p>
            </div>
            {permissionStatus !== 'denied' && permissionStatus !== 'unsupported' && (
              <button
                onClick={handleEnableNotifications}
                disabled={notifLoading || permissionStatus === 'granted'}
                className="text-xs text-[#06B6D4] hover:text-[#22D3EE] disabled:opacity-50 transition-colors flex-shrink-0"
              >
                {notifLoading ? '…' : permissionStatus === 'granted' ? 'Enabled' : 'Enable'}
              </button>
            )}
          </div>
          {permissionStatus === 'granted' && (
            <button
              onClick={handleTestNotification}
              disabled={notifLoading}
              className="w-full text-xs text-white/50 hover:text-white/80 py-2 rounded-lg bg-white/5 border border-white/10 transition-colors disabled:opacity-50"
            >
              {notifLoading ? 'Sending…' : 'Send Test Notification'}
            </button>
          )}
          {notifMessage && (
            <p className="text-[11px] text-white/50">{notifMessage}</p>
          )}
        </Card>
      </div>

      {/* Voice settings */}
      {voiceManager.isSupported() && (
        <div>
          <h2 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">Voice</h2>
          <Card className="p-4 space-y-4">
            {/* Enable toggle */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#7C3AED]/10 flex items-center justify-center flex-shrink-0">
                <Volume2 className="w-4 h-4 text-[#7C3AED]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white">Voice Replies</p>
                <p className="text-xs text-white/30">ARIA speaks her responses</p>
              </div>
              <button
                onClick={() => {
                  const next = !voiceEnabled
                  setVoiceEnabled(next)
                  saveVoiceSetting('aria_voice_replies', String(next))
                  if (!next) voiceManager.stop()
                }}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 ${voiceEnabled ? 'bg-[#7C3AED]' : 'bg-white/10'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${voiceEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>

            {voiceEnabled && (
              <>
                {/* Voice selector */}
                {availableVoices.length > 0 && (
                  <div>
                    <p className="text-xs text-white/40 mb-1.5">Voice</p>
                    <select
                      value={browserVoiceName}
                      onChange={(e) => {
                        setBrowserVoiceName(e.target.value)
                        saveVoiceSetting('aria_browser_voice', e.target.value)
                      }}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white/80 appearance-none"
                    >
                      <option value="">Default</option>
                      {availableVoices.map((v) => (
                        <option key={v.name} value={v.name}>{v.name} ({v.lang})</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Rate */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-xs text-white/40">Speed</p>
                    <p className="text-xs text-white/60">{speechRate.toFixed(1)}×</p>
                  </div>
                  <input
                    type="range" min="0.5" max="2" step="0.1"
                    value={speechRate}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value)
                      setSpeechRate(v)
                      saveVoiceSetting('aria_speech_rate', String(v))
                    }}
                    className="w-full accent-[#7C3AED]"
                  />
                </div>

                {/* Pitch */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-xs text-white/40">Pitch</p>
                    <p className="text-xs text-white/60">{speechPitch.toFixed(1)}</p>
                  </div>
                  <input
                    type="range" min="0.5" max="2" step="0.1"
                    value={speechPitch}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value)
                      setSpeechPitch(v)
                      saveVoiceSetting('aria_speech_pitch', String(v))
                    }}
                    className="w-full accent-[#7C3AED]"
                  />
                </div>

                {/* Test */}
                <button
                  onClick={handleTestVoice}
                  className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white/60 hover:text-white/80 transition-colors"
                >
                  <Play className="w-3.5 h-3.5" />
                  Test Voice
                </button>
              </>
            )}
          </Card>
        </div>
      )}

      {/* Sign out */}
      <button
        onClick={handleSignOut}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl glass border border-red-500/20 text-red-400 hover:bg-red-500/5 transition-all"
      >
        <LogOut className="w-4 h-4" />
        <span className="text-sm font-medium">Sign Out</span>
      </button>

      <p className="text-center text-xs text-white/20">ARIA v1.0.0 · Phase 1</p>
    </div>
  )
}
