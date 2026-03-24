type MusicVariant = 'menu' | 'session'

const MUSIC_ENABLED_STORAGE_KEY = 'spell-wizard:music-enabled'

let backgroundAudio: HTMLAudioElement | null = null
let activeVariant: MusicVariant | null = null
let unlockListenersAttached = false
let localStorageLoaded = false
let menuAssetPath = '/audio/menu-loop.mp3'
let menuVolume = 0.34

const activeOwners = new Map<symbol, MusicVariant>()

function getResolvedVariant() {
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

  backgroundAudio.volume = Math.min(Math.max(menuVolume, 0), 1)
  return backgroundAudio
}

function stopBackgroundAudio() {
  if (!backgroundAudio) {
    activeVariant = null
    return
  }

  backgroundAudio.pause()
  backgroundAudio.currentTime = 0
  activeVariant = null
}

async function playBackgroundTrack() {
  const audio = ensureBackgroundAudio()
  if (!audio) {
    return false
  }

  if (!audio.paused) {
    activeVariant = 'menu'
    return true
  }

  try {
    await audio.play()
    activeVariant = 'menu'
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

  const played = await playBackgroundTrack()
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

  if (import.meta.client && !localStorageLoaded) {
    localStorageLoaded = true
    const storedValue = window.localStorage.getItem(MUSIC_ENABLED_STORAGE_KEY)
    if (storedValue === 'true' || storedValue === 'false') {
      musicEnabled.value = storedValue === 'true'
    }
  }

  if (import.meta.client) {
    watch(musicEnabled, (enabled) => {
      window.localStorage.setItem(MUSIC_ENABLED_STORAGE_KEY, String(enabled))
      void syncMusicPlayback()
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
