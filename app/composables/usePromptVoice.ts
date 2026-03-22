type SpeakWordOptions = {
  interrupt?: boolean
}

export function usePromptVoice() {
  const voiceEnabled = useState('voice-enabled', () => true)
  const speechSupported = useState('speech-supported', () => true)

  if (import.meta.client) {
    speechSupported.value = 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window
  }

  function speakWord(word?: string, options: SpeakWordOptions = {}) {
    if (!import.meta.client || !voiceEnabled.value || !word || !speechSupported.value) {
      return false
    }

    const speech = window.speechSynthesis
    const { interrupt = false } = options

    if (interrupt && (speech.speaking || speech.pending)) {
      speech.cancel()
    }

    const utterance = new SpeechSynthesisUtterance(word)
    utterance.rate = 0.82
    utterance.pitch = 1.15
    utterance.volume = 1
    const voice = speech.getVoices().find(item => item.lang.startsWith('en'))
    if (voice) {
      utterance.voice = voice
    }

    speech.speak(utterance)
    return true
  }

  return {
    voiceEnabled,
    speechSupported,
    speakWord
  }
}
