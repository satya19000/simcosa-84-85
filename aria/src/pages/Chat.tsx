import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Mic, Sparkles } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

interface Message {
  id: string
  role: 'user' | 'aria'
  content: string
  timestamp: Date
}

const WELCOME: Message = {
  id: '0',
  role: 'aria',
  content: "Hello! I'm ARIA, your AI Executive Assistant. I'm here to help you manage your schedule, tasks, relationships, and more. What can I do for you today?",
  timestamp: new Date(),
}

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([WELCOME])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const send = async () => {
    const text = input.trim()
    if (!text || loading) return

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setLoading(true)

    // TODO: Replace with Claude API call via Firebase Cloud Function
    await new Promise((r) => setTimeout(r, 1200))
    const ariaMsg: Message = {
      id: (Date.now() + 1).toString(),
      role: 'aria',
      content: `I understood your request: "${text}". Claude API integration will be connected in Phase 2 via a Firebase Cloud Function. I'll be able to remember your context, manage tasks, and take actions on your behalf.`,
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, ariaMsg])
    setLoading(false)
  }

  return (
    <div className="flex flex-col h-[calc(100vh-96px)]">
      {/* Header */}
      <div className="px-4 pt-6 pb-3 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#7C3AED] to-[#06B6D4] flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-semibold text-white">ARIA</h1>
            <p className="text-xs text-emerald-400">● Online</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'aria' && (
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#7C3AED] to-[#06B6D4] flex items-center justify-center mr-2 flex-shrink-0 mt-1">
                  <span className="text-xs">✦</span>
                </div>
              )}
              <div
                className={`max-w-[78%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-[#7C3AED] text-white rounded-tr-sm'
                    : 'glass border border-white/10 text-white/90 rounded-tl-sm'
                }`}
              >
                {msg.content}
                <p className="text-[10px] mt-1.5 opacity-40">
                  {msg.timestamp.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#7C3AED] to-[#06B6D4] flex items-center justify-center flex-shrink-0">
              <span className="text-xs">✦</span>
            </div>
            <div className="glass border border-white/10 rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex gap-1.5 items-center h-4">
                {[0, 0.2, 0.4].map((delay, i) => (
                  <motion.div
                    key={i}
                    className="w-1.5 h-1.5 bg-[#7C3AED] rounded-full"
                    animate={{ y: [0, -6, 0] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay }}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 pb-4 pt-2 border-t border-white/10">
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <Input
              placeholder="Ask ARIA anything..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && send()}
            />
          </div>
          <button className="w-11 h-11 rounded-xl glass border border-white/10 flex items-center justify-center flex-shrink-0 hover:border-white/20 transition-all">
            <Mic className="w-5 h-5 text-white/50" />
          </button>
          <Button onClick={send} loading={loading} className="h-11 w-11 px-0 flex-shrink-0 rounded-xl">
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
