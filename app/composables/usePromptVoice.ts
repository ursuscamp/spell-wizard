type SpeakWordOptions = {
  interrupt?: boolean
  mode?: 'standard' | 'enunciate'
  fallbackWord?: string
}

type VoiceOption = {
  id: string
  name: string
  lang: string
  default: boolean
}

const VOICE_LOAD_TIMEOUT_MS = 1500
const SELECTED_VOICE_STORAGE_KEY = 'spell-wizard:selected-voice'

function formatVoiceOption(voice: SpeechSynthesisVoice): VoiceOption {
  return {
    id: voice.voiceURI,
    name: voice.name,
    lang: voice.lang,
    default: voice.default
  }
}

function scoreVoiceOption(voice: SpeechSynthesisVoice) {
  const isEnglish = voice.lang.toLowerCase().startsWith('en')
  return Number(isEnglish) * 2 + Number(voice.default)
}

function isEnglishVoice(voice: SpeechSynthesisVoice) {
  return voice.lang.toLowerCase().startsWith('en')
}

function sortVoices(voices: SpeechSynthesisVoice[]) {
  return [...voices].sort((left, right) => {
    const scoreDifference = scoreVoiceOption(right) - scoreVoiceOption(left)
    if (scoreDifference !== 0) {
      return scoreDifference
    }

    const nameComparison = left.name.localeCompare(right.name)
    if (nameComparison !== 0) {
      return nameComparison
    }

    return left.lang.localeCompare(right.lang)
  })
}

export function usePromptVoice() {
  const appConfig = useAppConfig()
  const voiceEnabled = useState('voice-enabled', () => true)
  const speechSupported = useState('speech-supported', () => true)
  const speechReady = useState('speech-ready', () => false)
  const availableVoices = useState<VoiceOption[]>('available-voices', () => [])
  const selectedVoiceUri = useState<string | null>('selected-voice-uri', () => null)

  function loadSelectedVoiceUri() {
    if (!import.meta.client || selectedVoiceUri.value !== null) {
      return
    }

    selectedVoiceUri.value = window.localStorage.getItem(SELECTED_VOICE_STORAGE_KEY)
  }

  function setSelectedVoiceUri(voiceUri?: string | null) {
    const nextVoiceUri = voiceUri?.trim() || null
    selectedVoiceUri.value = nextVoiceUri

    if (!import.meta.client) {
      return
    }

    if (nextVoiceUri) {
      window.localStorage.setItem(SELECTED_VOICE_STORAGE_KEY, nextVoiceUri)
      return
    }

    window.localStorage.removeItem(SELECTED_VOICE_STORAGE_KEY)
  }

  function syncAvailableVoices(voices: SpeechSynthesisVoice[]) {
    availableVoices.value = sortVoices(voices)
      .filter(isEnglishVoice)
      .map(formatVoiceOption)

    if (selectedVoiceUri.value && !availableVoices.value.some(voice => voice.id === selectedVoiceUri.value)) {
      setSelectedVoiceUri(null)
    }
  }

  function buildVoiceConfig(mode: 'standard' | 'enunciate' = 'standard') {
    const speechConfig = appConfig.spellingWizard.speech
    return mode === 'enunciate'
      ? speechConfig.enunciate
      : speechConfig.standard
  }

  if (import.meta.client) {
    loadSelectedVoiceUri()
    speechSupported.value = 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window
    speechReady.value = speechSupported.value && window.speechSynthesis.getVoices().length > 0
    if (speechReady.value) {
      syncAvailableVoices(window.speechSynthesis.getVoices())
    }
  }

  async function waitForVoices() {
    if (!import.meta.client || !speechSupported.value) {
      return []
    }

    const speech = window.speechSynthesis
    const availableSpeechVoices = speech.getVoices()

    if (availableSpeechVoices.length > 0) {
      syncAvailableVoices(availableSpeechVoices)
      speechReady.value = true
      return availableSpeechVoices
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

    const sortedVoices = sortVoices(voices)
    syncAvailableVoices(sortedVoices)
    speechReady.value = sortedVoices.length > 0
    return sortedVoices
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
    const voice = voices.find(item => item.voiceURI === selectedVoiceUri.value)
      ?? voices.find(item => item.lang.toLowerCase().startsWith('en'))
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
    availableVoices,
    buildVoiceConfig,
    loadVoices: waitForVoices,
    speechReady,
    speechSupported,
    selectedVoiceUri,
    speakWord,
    setSelectedVoiceUri,
    voiceEnabled
  }
}
