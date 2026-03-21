export function usePromptVoice() {
  const voiceEnabled = useState('voice-enabled', () => true)
  const speechSupported = useState('speech-supported', () => true)

  if (import.meta.client) {
    speechSupported.value = 'speechSynthesis' in window
  }

  function speakWord(word?: string) {
    if (!import.meta.client || !voiceEnabled.value || !word || !speechSupported.value) {
      return false
    }

    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(word)
    utterance.rate = 0.82
    utterance.pitch = 1.15
    utterance.volume = 1
    const voice = window.speechSynthesis.getVoices().find(item => item.lang.startsWith('en'))
    if (voice) {
      utterance.voice = voice
    }
    window.speechSynthesis.speak(utterance)
    return true
  }

  return {
    voiceEnabled,
    speechSupported,
    speakWord
  }
}
