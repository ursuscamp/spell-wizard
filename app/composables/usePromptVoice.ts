type SpeakWordOptions = {
  interrupt?: boolean
  mode?: 'standard' | 'enunciate'
  fallbackWord?: string
  bypassCache?: boolean
  voiceId?: string | null
}

type VoiceOption = {
  id: string
  name: string
  lang: string
  default: boolean
}

const VOICE_LOAD_TIMEOUT_MS = 1500
const SELECTED_VOICE_STORAGE_KEY = 'spell-wizard:selected-voice'

let activeAudio: HTMLAudioElement | null = null
let activeAudioUrl: string | null = null

function releaseActiveAudio() {
  if (activeAudio) {
    activeAudio.pause()
    activeAudio.currentTime = 0
    activeAudio = null
  }

  if (activeAudioUrl) {
    URL.revokeObjectURL(activeAudioUrl)
    activeAudioUrl = null
  }
}

function isEnglishVoice(voice: VoiceOption) {
  return voice.lang.toLowerCase().startsWith('en')
}

function getVoiceLocalePriority(locale: string) {
  return locale.toLowerCase() === 'en-us' ? 0 : 1
}

function sortVoices(voices: VoiceOption[]) {
  return [...voices].sort((left, right) => {
    const localePriorityDifference = getVoiceLocalePriority(left.lang) - getVoiceLocalePriority(right.lang)
    if (localePriorityDifference !== 0) {
      return localePriorityDifference
    }

    const localeComparison = left.lang.localeCompare(right.lang)
    if (localeComparison !== 0) {
      return localeComparison
    }

    const nameComparison = left.name.localeCompare(right.name)
    if (nameComparison !== 0) {
      return nameComparison
    }

    return left.id.localeCompare(right.id)
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

  function syncAvailableVoices(voices: VoiceOption[]) {
    availableVoices.value = sortVoices(voices)
      .filter(isEnglishVoice)

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
    speechSupported.value = typeof Audio !== 'undefined'
    speechReady.value = speechSupported.value
  }

  async function waitForVoices() {
    if (!import.meta.client) {
      return []
    }

    if (availableVoices.value.length > 0) {
      speechReady.value = true
      return availableVoices.value
    }

    const timeoutId = window.setTimeout(() => {
      speechReady.value = false
    }, VOICE_LOAD_TIMEOUT_MS)

    try {
      const voices = await $fetch<VoiceOption[]>('/api/tts/voices')
      const sortedVoices = sortVoices(voices)
      syncAvailableVoices(sortedVoices)
      speechReady.value = true
      return sortedVoices
    }
    catch {
      speechReady.value = false
      availableVoices.value = []
      return []
    }
    finally {
      window.clearTimeout(timeoutId)
    }
  }

  async function speakWord(word?: string, options: SpeakWordOptions = {}) {
    if (!import.meta.client || !voiceEnabled.value || !speechSupported.value) {
      return false
    }

    const { interrupt = false, mode = 'standard', fallbackWord, bypassCache = false, voiceId } = options
    const textToSpeak = word?.trim() || fallbackWord?.trim()

    if (!textToSpeak) {
      return false
    }

    if (interrupt) {
      releaseActiveAudio()
    }

    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: {
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          text: textToSpeak,
          mode,
          voiceId: voiceId ?? selectedVoiceUri.value,
          bypassCache
        })
      })

      if (!response.ok) {
        return false
      }

      const audioBlob = await response.blob()
      releaseActiveAudio()
      activeAudioUrl = URL.createObjectURL(audioBlob)
      activeAudio = new Audio(activeAudioUrl)
      activeAudio.volume = Math.min(Math.max(buildVoiceConfig(mode).volume ?? 1, 0), 1)

      const finished = new Promise<boolean>((resolve) => {
        if (!activeAudio) {
          resolve(false)
          return
        }

        activeAudio.onended = () => {
          releaseActiveAudio()
          resolve(true)
        }
        activeAudio.onerror = () => {
          releaseActiveAudio()
          resolve(false)
        }
      })

      await activeAudio.play()
      return finished
    }
    catch {
      releaseActiveAudio()
      return false
    }
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
