import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Mic, MicOff, Sparkles, Square, AlertCircle } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useAuthStore } from '@/store/authStore'
import { useAriaStore } from '@/store/ariaStore'
import { sendMessageToAria, subscribeToMessages, ensureChatSession } from '@/lib/chatService'
import { useVoiceRecorder } from '@/hooks/useVoiceRecorder'
import type { ChatMessage } from '@/lib/types'
import type { Unsubscribe } from 'firebase/firestore'

const SESSION_ID = 'default' // Phase 3: multi-session support

export default function Chat() {
  const { user } = useAuthStore()
  const { voiceState, setVoiceState } = useAriaStore()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [firestoreError, setFirestoreError] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const unsubRef = useRef<Unsubscribe | null>(null)

  const { recordingState, startRecording, stopRecording, cancelRecording, error: voiceError } = useVoiceRecorder()

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, sending])

  // Initialize session + subscribe to real-time messages
  useEffect(() => {
    if (!user) return

    ensureChatSession(user.uid, SESSION_ID).catch(console.error)

    unsubRef.current = subscribeToMessages(
      user.uid,
      SESSION_ID,
      setMessages,
      (err) => setFirestoreError(err.message)
    )

    return () => { unsubRef.current?.() }
  }, [user])

  // Build history from current messages for context
  const buildHistory = useCallback((): Array<{ role: 'user' | 'assistant'; content: string }> => {
    return messages.slice(-20).map((m) => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content }))
  }, [messages])

  const send = useCallback(async (text: string) => {
    if (!text.trim() || sending || !user) return
    setSending(true)
    try {
      await sendMessageToAria(text, SESSION_ID, buildHistory())
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to send message'
      setFirestoreError(msg)
    } finally {
      setSending(false)
    }
  }, [sending, user, buildHistory])

  const handleSend = async () => {
    const text = input.trim()
    if (!text) return
    setInput('')
    await send(text)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleVoiceToggle = async () => {
    if (recordingState === 'idle') {
      setVoiceState('listening')
      await startRecording()
    } else if (recordingState === 'recording') {
      setVoiceState('processing')
      const base64 = await stopRecording()
      setVoiceState('idle')
      if (base64) {
        // Phase 3: call transcribeAudio Cloud Function with base64
        // For now, show a placeholder in the input
        setInput('[Voice message — Whisper STT connects in Phase 3]')
      }
    }
  }

  const isVoiceActive = recordingState === 'recording' || voiceState === 'listening'

  return (
    <div className="flex flex-col h-[calc(100vh-96px)] safe-top">
      {/* Header */}
      <div className="px-4 pt-6 pb-3 border-b border-white/10 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#7C3AED] to-[#06B6D4] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-[#0A0E27]" />
          </div>
          <div>
            <h1 className="text-base font-semibold text-white">ARIA</h1>
            <p className="text-xs text-emerald-400">● Online · Claude AI</p>
          </div>
        </div>
        {firestoreError && (
          <div className="mt-2 flex items-center gap-2 text-xs text-red-400 bg-red-500/10 rounded-lg px-3 py-2">
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
            {firestoreError}
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {/* Welcome message when no messages yet */}
        {messages.length === 0 && !sending && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-start"
          >
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#7C3AED] to-[#06B6D4] flex items-center justify-center mr-2 flex-shrink-0 mt-1">
              <span className="text-xs">✦</span>
            </div>
            <div className="max-w-[80%] glass border border-white/10 rounded-2xl rounded-tl-sm px-4 py-3">
              <p className="text-sm text-white/90 leading-relaxed">
                Hi! I'm ARIA, your AI Executive Assistant powered by Claude. Ask me anything — I can help with tasks, schedules, reminders, and much more.
              </p>
              <p className="text-[10px] mt-1.5 text-white/30">Just now</p>
            </div>
          </motion.div>
        )}

        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'assistant' && (
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#7C3AED] to-[#06B6D4] flex items-center justify-center mr-2 flex-shrink-0 mt-1">
                  <span className="text-xs">✦</span>
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-[#7C3AED] text-white rounded-tr-sm'
                    : 'glass border border-white/10 text-white/90 rounded-tl-sm'
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.content}</p>
                {msg.role === 'assistant' && msg.toolUsed && msg.tools && msg.tools.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {msg.tools.map((chip, i) => (
                      <span
                        key={i}
                        className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-medium border ${
                          chip.success
                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                            : 'bg-red-500/20 text-red-400 border-red-500/30'
                        }`}
                      >
                        {chip.success ? '✅' : '⚠️'}{' '}
                        {chip.name === 'createTask'
                          ? 'Task created'
                          : chip.name === 'createReminder'
                          ? 'Reminder set'
                          : chip.name}
                      </span>
                    ))}
                  </div>
                )}
                <p className="text-[10px] mt-1.5 opacity-40">
                  {msg.timestamp
                    ? msg.timestamp.toDate().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                    : 'Sending…'}
                </p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Typing indicator */}
        <AnimatePresence>
          {sending && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2"
            >
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#7C3AED] to-[#06B6D4] flex items-center justify-center flex-shrink-0">
                <span className="text-xs">✦</span>
              </div>
              <div className="glass border border-white/10 rounded-2xl rounded-tl-sm px-4 py-3">
                <div className="flex gap-1.5 items-center h-4">
                  {[0, 0.2, 0.4].map((delay, i) => (
                    <motion.div
                      key={i}
                      className="w-1.5 h-1.5 bg-[#7C3AED] rounded-full"
                      animate={{ y: [0, -5, 0] }}
                      transition={{ duration: 0.55, repeat: Infinity, delay }}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={bottomRef} className="h-1" />
      </div>

      {/* Voice recording banner */}
      <AnimatePresence>
        {isVoiceActive && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="mx-4 mb-2 flex items-center gap-3 bg-[#06B6D4]/10 border border-[#06B6D4]/30 rounded-2xl px-4 py-3"
          >
            <motion.div
              className="w-2.5 h-2.5 rounded-full bg-[#06B6D4] flex-shrink-0"
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            />
            <span className="text-sm text-[#06B6D4] flex-1">Listening… tap stop when done</span>
            <button
              onClick={cancelRecording}
              className="text-white/40 hover:text-white/60"
            >
              <Square className="w-4 h-4 fill-current" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Voice error */}
      {voiceError && (
        <div className="mx-4 mb-2 text-xs text-red-400 bg-red-500/10 rounded-xl px-3 py-2 flex items-center gap-2">
          <AlertCircle className="w-3.5 h-3.5" />
          {voiceError}
        </div>
      )}

      {/* Input bar */}
      <div className="px-4 pb-4 pt-2 border-t border-white/10 flex-shrink-0">
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <Input
              placeholder="Ask ARIA anything…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={sending}
            />
          </div>

          {/* Voice button */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleVoiceToggle}
            disabled={recordingState === 'processing'}
            className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-all border ${
              isVoiceActive
                ? 'bg-[#06B6D4]/20 border-[#06B6D4]/50'
                : 'glass border-white/10 hover:border-white/20'
            }`}
          >
            {isVoiceActive
              ? <MicOff className="w-5 h-5 text-[#06B6D4]" />
              : <Mic className="w-5 h-5 text-white/50" />
            }
          </motion.button>

          {/* Send button */}
          <Button
            onClick={handleSend}
            loading={sending}
            disabled={!input.trim() || sending}
            className="h-11 w-11 px-0 flex-shrink-0 rounded-xl"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
