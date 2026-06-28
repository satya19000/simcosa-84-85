import { motion, AnimatePresence } from 'framer-motion'
import { Mic, Loader2 } from 'lucide-react'
import { useAriaStore, type VoiceState } from '@/store/ariaStore'
import { cn } from '@/lib/utils'

const orbColors: Record<VoiceState, string> = {
  idle: '#7C3AED',
  listening: '#06B6D4',
  processing: '#F59E0B',
  speaking: '#10B981',
}

const orbGlow: Record<VoiceState, string> = {
  idle: 'shadow-violet-500/40',
  listening: 'shadow-cyan-400/60',
  processing: 'shadow-amber-500/40',
  speaking: 'shadow-emerald-500/40',
}

export function AriaOrb() {
  const { voiceState, setVoiceState, isVoiceEnabled } = useAriaStore()

  const handlePress = () => {
    if (!isVoiceEnabled) return
    if (voiceState === 'idle') {
      setVoiceState('listening')
      // TODO: integrate Whisper STT
    } else {
      setVoiceState('idle')
    }
  }

  const color = orbColors[voiceState]

  return (
    <div className="fixed bottom-24 right-5 z-50 safe-bottom">
      <motion.button
        onClick={handlePress}
        whileTap={{ scale: 0.92 }}
        className={cn(
          'relative w-14 h-14 rounded-full flex items-center justify-center',
          'shadow-xl',
          orbGlow[voiceState]
        )}
        style={{ backgroundColor: color }}
        aria-label="Talk to ARIA"
      >
        {/* Breathing ring */}
        <AnimatePresence>
          {voiceState === 'idle' && (
            <motion.span
              key="idle-ring"
              className="absolute inset-0 rounded-full"
              style={{ backgroundColor: color }}
              animate={{ scale: [1, 1.35, 1], opacity: [0.4, 0, 0.4] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
            />
          )}
          {voiceState === 'listening' && (
            <>
              <motion.span
                key="listen-ring-1"
                className="absolute inset-0 rounded-full bg-cyan-400"
                animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
                transition={{ duration: 1, repeat: Infinity }}
              />
              <motion.span
                key="listen-ring-2"
                className="absolute inset-0 rounded-full bg-cyan-400"
                animate={{ scale: [1, 1.8], opacity: [0.3, 0] }}
                transition={{ duration: 1, repeat: Infinity, delay: 0.3 }}
              />
            </>
          )}
        </AnimatePresence>

        {/* Icon */}
        {voiceState === 'processing' ? (
          <Loader2 className="w-6 h-6 text-white animate-spin" />
        ) : voiceState === 'listening' ? (
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 0.5, repeat: Infinity }}
          >
            <Mic className="w-6 h-6 text-white" />
          </motion.div>
        ) : (
          <Mic className={cn('w-6 h-6 text-white', !isVoiceEnabled && 'opacity-50')} />
        )}
      </motion.button>
    </div>
  )
}
