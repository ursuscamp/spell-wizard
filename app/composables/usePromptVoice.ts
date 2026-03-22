type SpeakWordOptions = {
  interrupt?: boolean
  mode?: 'standard' | 'enunciate'
  fallbackWord?: string
}

const VOICE_LOAD_TIMEOUT_MS = 1500

export function usePromptVoice() {
  const appConfig = useAppConfig()
  const voiceEnabled = useState('voice-enabled', () => true)
  const speechSupported = useState('speech-supported', () => true)
  const speechReady = useState('speech-ready', () => false)

  function buildVoiceConfig(mode: 'standard' | 'enunciate' = 'standard') {
    const speechConfig = appConfig.spellingWizard.speech
    return mode === 'enunciate'
      ? speechConfig.enunciate
      : speechConfig.standard
  }

  if (import.meta.client) {
    speechSupported.value = 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window
    speechReady.value = speechSupported.value && window.speechSynthesis.getVoices().length > 0
  }

  async function waitForVoices() {
    if (!import.meta.client || !speechSupported.value) {
      return []
    }

    const speech = window.speechSynthesis
    const availableVoices = speech.getVoices()

    if (availableVoices.length > 0) {
      speechReady.value = true
      return availableVoices
    }

    const voices = await new Promise<SpeechSynthesisVoice[]>((resolve) => {
      const timeoutId = window.setTimeout(() => {
        cleanup()
        resolve(speech.getVoices())
      }, VOICE_LOAD_TIMEOUT_MS)

      const handleVoicesChanged = () => {
        cleanup()
        resolve(speech.getVoices())
      }

      const cleanup = () => {
        window.clearTimeout(timeoutId)
        speech.removeEventListener('voiceschanged', handleVoicesChanged)
      }

      speech.addEventListener('voiceschanged', handleVoicesChanged, { once: true })
    })

    speechReady.value = voices.length > 0
    return voices
  }

  async function speakWord(word?: string, options: SpeakWordOptions = {}) {
    if (!import.meta.client || !voiceEnabled.value || !speechSupported.value) {
      return false
    }

    const speech = window.speechSynthesis
    const { interrupt = false, mode = 'standard', fallbackWord } = options
    const voices = await waitForVoices()
    const config = buildVoiceConfig(mode)
    const textToSpeak = word?.trim() || fallbackWord?.trim()

    if (!textToSpeak) {
      return false
    }

    if (interrupt && (speech.speaking || speech.pending)) {
      speech.cancel()
    }

    speech.resume()

    const utterance = new SpeechSynthesisUtterance(textToSpeak)
    utterance.rate = config.rate
    utterance.pitch = config.pitch
    utterance.volume = config.volume
    const voice = voices.find(item => item.lang.startsWith('en'))
      ?? voices.find(item => item.default)
      ?? voices[0]
    if (voice) {
      utterance.voice = voice
    }

    const finished = new Promise<boolean>((resolve) => {
      utterance.onend = () => resolve(true)
      utterance.onerror = () => resolve(false)
    })

    speech.speak(utterance)
    return finished
  }

  return {
    buildVoiceConfig,
    voiceEnabled,
    speechReady,
    speechSupported,
    speakWord
  }
}
