type MusicVariant = 'menu' | 'session'

const MUSIC_ENABLED_STORAGE_KEY = 'spell-wizard:music-enabled'
const VOLUME_FADE_DURATION_MS = 420

let backgroundAudio: HTMLAudioElement | null = null
let activeVariant: MusicVariant | null = null
let unlockListenersAttached = false
let localStorageLoaded = false
let menuAssetPath = '/audio/menu-loop.mp3'
let menuVolume = 0.34
let sessionVolume = 0.14
let fadeFrame: number | null = null

const activeOwners = new Map<symbol, MusicVariant>()

function getResolvedVariant() {
  if ([...activeOwners.values()].includes('session')) {
    return 'session' satisfies MusicVariant
  }

  if (activeOwners.size) {
    return 'menu' satisfies MusicVariant
  }

  return null
}

function detachUnlockListeners() {
  if (!import.meta.client || !unlockListenersAttached) {
    return
  }

  window.removeEventListener('pointerdown', handleUnlockInteraction)
  window.removeEventListener('keydown', handleUnlockInteraction)
  window.removeEventListener('touchstart', handleUnlockInteraction)
  unlockListenersAttached = false
}

function attachUnlockListeners() {
  if (!import.meta.client || unlockListenersAttached) {
    return
  }

  window.addEventListener('pointerdown', handleUnlockInteraction, { passive: true })
  window.addEventListener('keydown', handleUnlockInteraction)
  window.addEventListener('touchstart', handleUnlockInteraction, { passive: true })
  unlockListenersAttached = true
}

async function handleUnlockInteraction() {
  await syncMusicPlayback()
}

function cancelFade() {
  if (!import.meta.client || fadeFrame === null) {
    return
  }

  window.cancelAnimationFrame(fadeFrame)
  fadeFrame = null
}

function fadeToVolume(targetVolume: number) {
  if (!import.meta.client || !backgroundAudio) {
    return
  }

  cancelFade()

  const startVolume = backgroundAudio.volume
  const clampedTarget = Math.min(Math.max(targetVolume, 0), 1)
  const startedAt = window.performance.now()

  const step = (now: number) => {
    if (!backgroundAudio) {
      fadeFrame = null
      return
    }

    const progress = Math.min((now - startedAt) / VOLUME_FADE_DURATION_MS, 1)
    const eased = 1 - ((1 - progress) ** 3)
    backgroundAudio.volume = startVolume + ((clampedTarget - startVolume) * eased)

    if (progress < 1) {
      fadeFrame = window.requestAnimationFrame(step)
      return
    }

    backgroundAudio.volume = clampedTarget
    fadeFrame = null
  }

  fadeFrame = window.requestAnimationFrame(step)
}

function getTargetVolume(variant: MusicVariant) {
  return variant === 'session' ? sessionVolume : menuVolume
}

function ensureBackgroundAudio() {
  if (!import.meta.client) {
    return null
  }

  const resolvedSource = new URL(menuAssetPath, window.location.origin).toString()

  if (!backgroundAudio || backgroundAudio.src !== resolvedSource) {
    backgroundAudio?.pause()
    backgroundAudio = new Audio(menuAssetPath)
    backgroundAudio.loop = true
    backgroundAudio.preload = 'auto'
  }

  return backgroundAudio
}

function stopBackgroundAudio() {
  cancelFade()

  if (!backgroundAudio) {
    activeVariant = null
    return
  }

  backgroundAudio.pause()
  backgroundAudio.currentTime = 0
  activeVariant = null
}

async function playBackgroundTrack(targetVariant: MusicVariant) {
  const audio = ensureBackgroundAudio()
  if (!audio) {
    return false
  }

  const targetVolume = getTargetVolume(targetVariant)

  if (!audio.paused) {
    activeVariant = targetVariant
    fadeToVolume(targetVolume)
    return true
  }

  audio.volume = targetVolume

  try {
    await audio.play()
    activeVariant = targetVariant
    return true
  }
  catch {
    return false
  }
}

async function syncMusicPlayback() {
  const variant = getResolvedVariant()
  const enabled = useState<boolean>('music-enabled').value

  if (!variant || !enabled) {
    detachUnlockListeners()
    stopBackgroundAudio()
    return
  }

  const played = await playBackgroundTrack(variant)
  if (!played) {
    attachUnlockListeners()
    return
  }

  detachUnlockListeners()
}

export function useBackgroundMusic() {
  const appConfig = useAppConfig()
  const musicEnabled = useState('music-enabled', () => appConfig.spellingWizard.musicEnabledDefault ?? true)
  const ownerKey = Symbol('background-music-owner')
  const backgroundMusicConfig = appConfig.spellingWizard.backgroundMusic ?? {}

  menuAssetPath = backgroundMusicConfig.menuAssetPath ?? menuAssetPath
  menuVolume = backgroundMusicConfig.menuVolume ?? menuVolume
  sessionVolume = backgroundMusicConfig.sessionVolume ?? sessionVolume

  if (import.meta.client) {
    onMounted(() => {
      if (!localStorageLoaded) {
        localStorageLoaded = true
        const storedValue = window.localStorage.getItem(MUSIC_ENABLED_STORAGE_KEY)
        if (storedValue === 'true' || storedValue === 'false') {
          musicEnabled.value = storedValue === 'true'
        }
      }

      watch(musicEnabled, (enabled) => {
        window.localStorage.setItem(MUSIC_ENABLED_STORAGE_KEY, String(enabled))
        void syncMusicPlayback()
      }, { immediate: true })
    })
  }

  function activateVariant(variant: MusicVariant) {
    activeOwners.set(ownerKey, variant)
    void syncMusicPlayback()
  }

  function deactivateVariant() {
    activeOwners.delete(ownerKey)
    void syncMusicPlayback()
  }

  onBeforeUnmount(() => {
    deactivateVariant()
  })

  return {
    activateMenuMusic: () => activateVariant('menu'),
    activateSessionMusic: () => activateVariant('session'),
    deactivateBackgroundMusic: deactivateVariant,
    musicEnabled
  }
}
