import { create } from 'zustand'

export type VoiceState = 'idle' | 'listening' | 'processing' | 'speaking'

interface AriaState {
  voiceState: VoiceState
  isVoiceEnabled: boolean
  isChatOpen: boolean
  activeTab: 'home' | 'chat' | 'calendar' | 'vault' | 'profile'
  setVoiceState: (state: VoiceState) => void
  setVoiceEnabled: (enabled: boolean) => void
  setChatOpen: (open: boolean) => void
  setActiveTab: (tab: AriaState['activeTab']) => void
}

export const useAriaStore = create<AriaState>((set) => ({
  voiceState: 'idle',
  isVoiceEnabled: true,
  isChatOpen: false,
  activeTab: 'home',
  setVoiceState: (voiceState) => set({ voiceState }),
  setVoiceEnabled: (isVoiceEnabled) => set({ isVoiceEnabled }),
  setChatOpen: (isChatOpen) => set({ isChatOpen }),
  setActiveTab: (activeTab) => set({ activeTab }),
}))
