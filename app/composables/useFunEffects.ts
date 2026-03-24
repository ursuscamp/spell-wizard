type CelebrateKind = 'correct' | 'retry' | 'level' | 'rank'

type ActiveVoice = {
  cleanupTimer: ReturnType<typeof setTimeout> | null,
  gain: GainNode,
  noiseSource?: AudioBufferSourceNode,
  oscillators: OscillatorNode[]
}

type ToneLayer = {
  attack?: number,
  delay?: number,
  detune?: number,
  duration: number,
  endFrequency?: number,
  gain?: number,
  startFrequency: number,
  type?: OscillatorType
}

let sharedAudioContext: AudioContext | null = null
let activeRewardVoice: ActiveVoice | null = null
const activeVoices = new Set<ActiveVoice>()

function getAudioContextClass() {
  if (!import.meta.client) {
    return null
  }

  return window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext || null
}

function getAudioContext() {
  const AudioContextClass = getAudioContextClass()
  if (!AudioContextClass) {
    return null
  }

  sharedAudioContext ??= new AudioContextClass()
  return sharedAudioContext
}

function trackVoice(voice: ActiveVoice, durationSeconds: number) {
  activeVoices.add(voice)
  voice.cleanupTimer = setTimeout(() => {
    stopVoice(voice, 0.04)
  }, Math.ceil((durationSeconds + 0.25) * 1000))
}

function stopVoice(voice: ActiveVoice, fadeOutSeconds = 0.08) {
  const ctx = sharedAudioContext
  if (!ctx) {
    activeVoices.delete(voice)
    return
  }

  if (voice.cleanupTimer) {
    clearTimeout(voice.cleanupTimer)
    voice.cleanupTimer = null
  }

  const now = ctx.currentTime
  const fadeEnd = now + fadeOutSeconds

  try {
    voice.gain.gain.cancelScheduledValues(now)
    voice.gain.gain.setValueAtTime(Math.max(voice.gain.gain.value, 0.0001), now)
    voice.gain.gain.exponentialRampToValueAtTime(0.0001, fadeEnd)
  }
  catch {
    // Ignore nodes that are already stopped or detached.
  }

  for (const oscillator of voice.oscillators) {
    try {
      oscillator.stop(fadeEnd + 0.02)
    }
    catch {
      // Ignore oscillators that have already ended.
    }
  }

  if (voice.noiseSource) {
    try {
      voice.noiseSource.stop(fadeEnd + 0.02)
    }
    catch {
      // Ignore sources that have already ended.
    }
  }

  setTimeout(() => {
    try {
      voice.gain.disconnect()
    }
    catch {
      // Ignore disconnected nodes.
    }

    activeVoices.delete(voice)
    if (activeRewardVoice === voice) {
      activeRewardVoice = null
    }
  }, Math.ceil((fadeOutSeconds + 0.08) * 1000))
}

function stopAllVoices(fadeOutSeconds = 0.08) {
  for (const voice of [...activeVoices]) {
    stopVoice(voice, fadeOutSeconds)
  }
}

function stopRewardTail(fadeOutSeconds = 0.16) {
  if (activeRewardVoice) {
    stopVoice(activeRewardVoice, fadeOutSeconds)
    activeRewardVoice = null
  }
}

function createVoice(ctx: AudioContext, destination: AudioNode) {
  const gain = ctx.createGain()
  gain.gain.value = 1.38
  gain.connect(destination)

  return {
    cleanupTimer: null,
    gain,
    oscillators: []
  } satisfies ActiveVoice
}

function playLayeredTone(ctx: AudioContext, destination: AudioNode, layers: ToneLayer[]) {
  const voice = createVoice(ctx, destination)
  const now = ctx.currentTime
  let maxEndTime = now

  for (const layer of layers) {
    const oscillator = ctx.createOscillator()
    const layerGain = ctx.createGain()
    const startAt = now + (layer.delay ?? 0)
    const endAt = startAt + layer.duration
    const attack = layer.attack ?? 0.012
    const peak = layer.gain ?? 0.04

    oscillator.type = layer.type ?? 'sine'
    oscillator.frequency.setValueAtTime(layer.startFrequency, startAt)

    if (typeof layer.endFrequency === 'number') {
      oscillator.frequency.exponentialRampToValueAtTime(Math.max(layer.endFrequency, 1), endAt)
    }

    if (layer.detune) {
      oscillator.detune.setValueAtTime(layer.detune, startAt)
    }

    layerGain.gain.setValueAtTime(0.0001, startAt)
    layerGain.gain.exponentialRampToValueAtTime(Math.max(peak, 0.0001), startAt + attack)
    layerGain.gain.exponentialRampToValueAtTime(0.0001, endAt)

    oscillator.connect(layerGain)
    layerGain.connect(voice.gain)

    oscillator.start(startAt)
    oscillator.stop(endAt + 0.02)

    voice.oscillators.push(oscillator)
    maxEndTime = Math.max(maxEndTime, endAt)
  }

  trackVoice(voice, maxEndTime - now)
  return voice
}

function playNoiseBurst(
  ctx: AudioContext,
  destination: AudioNode,
  {
    delay = 0,
    duration = 0.12,
    filterFrequency = 1200,
    gain = 0.012,
    type = 'bandpass'
  }: {
    delay?: number,
    duration?: number,
    filterFrequency?: number,
    gain?: number,
    type?: BiquadFilterType
  }
) {
  const voice = createVoice(ctx, destination)
  const frameCount = Math.max(1, Math.floor(ctx.sampleRate * duration))
  const buffer = ctx.createBuffer(1, frameCount, ctx.sampleRate)
  const data = buffer.getChannelData(0)
  const now = ctx.currentTime
  const startAt = now + delay
  const endAt = startAt + duration
  const source = ctx.createBufferSource()
  const filter = ctx.createBiquadFilter()
  const noiseGain = ctx.createGain()

  for (let index = 0; index < frameCount; index += 1) {
    data[index] = (Math.random() * 2) - 1
  }

  source.buffer = buffer
  filter.type = type
  filter.frequency.setValueAtTime(filterFrequency, startAt)
  noiseGain.gain.setValueAtTime(0.0001, startAt)
  noiseGain.gain.exponentialRampToValueAtTime(Math.max(gain, 0.0001), startAt + 0.01)
  noiseGain.gain.exponentialRampToValueAtTime(0.0001, endAt)

  source.connect(filter)
  filter.connect(noiseGain)
  noiseGain.connect(voice.gain)

  source.start(startAt)
  source.stop(endAt + 0.02)

  voice.noiseSource = source
  trackVoice(voice, duration + delay)
  return voice
}

async function ensurePlayableContext() {
  const ctx = getAudioContext()
  if (!ctx) {
    return null
  }

  if (ctx.state === 'suspended') {
    try {
      await ctx.resume()
    }
    catch {
      return null
    }
  }

  return ctx.state === 'running' ? ctx : null
}

function playCorrectEffect(ctx: AudioContext) {
  playLayeredTone(ctx, ctx.destination, [
    { startFrequency: 620, endFrequency: 740, duration: 0.16, gain: 0.065, type: 'triangle' },
    { startFrequency: 784, endFrequency: 880, duration: 0.22, delay: 0.07, gain: 0.058, type: 'sine' },
    { startFrequency: 1175, endFrequency: 1245, duration: 0.18, delay: 0.15, gain: 0.032, type: 'sine' }
  ])
}

function playRetryEffect(ctx: AudioContext) {
  playLayeredTone(ctx, ctx.destination, [
    { startFrequency: 320, endFrequency: 240, duration: 0.22, gain: 0.056, type: 'triangle' },
    { startFrequency: 190, endFrequency: 145, duration: 0.26, delay: 0.03, gain: 0.034, type: 'sine' }
  ])
  playNoiseBurst(ctx, ctx.destination, {
    duration: 0.09,
    filterFrequency: 980,
    gain: 0.018,
    type: 'lowpass'
  })
}

function playLevelEffect(ctx: AudioContext) {
  stopRewardTail()

  const voice = playLayeredTone(ctx, ctx.destination, [
    { startFrequency: 392, endFrequency: 392, duration: 0.2, gain: 0.048, type: 'triangle' },
    { startFrequency: 494, endFrequency: 494, duration: 0.22, delay: 0.11, gain: 0.055, type: 'triangle' },
    { startFrequency: 587, endFrequency: 587, duration: 0.24, delay: 0.22, gain: 0.062, type: 'sine' },
    { startFrequency: 784, endFrequency: 784, duration: 0.52, delay: 0.34, gain: 0.058, type: 'sine' },
    { startFrequency: 1175, endFrequency: 1175, duration: 0.24, delay: 0.48, gain: 0.02, type: 'sine' }
  ])

  playNoiseBurst(ctx, ctx.destination, {
    delay: 0.5,
    duration: 0.08,
    filterFrequency: 2300,
    gain: 0.005,
    type: 'bandpass'
  })

  activeRewardVoice = voice
}

function playRankEffect(ctx: AudioContext) {
  stopRewardTail()

  const voice = playLayeredTone(ctx, ctx.destination, [
    { startFrequency: 196, endFrequency: 196, duration: 1.35, gain: 0.016, type: 'triangle' },
    { startFrequency: 392, endFrequency: 392, duration: 0.28, gain: 0.042, type: 'triangle' },
    { startFrequency: 494, endFrequency: 494, duration: 0.3, delay: 0.1, gain: 0.05, type: 'triangle' },
    { startFrequency: 587, endFrequency: 587, duration: 0.34, delay: 0.22, gain: 0.058, type: 'sine' },
    { startFrequency: 784, endFrequency: 784, duration: 0.92, delay: 0.36, gain: 0.062, type: 'sine' },
    { startFrequency: 1175, endFrequency: 1175, duration: 0.62, delay: 0.52, gain: 0.026, type: 'sine' },
    { startFrequency: 784, endFrequency: 784, duration: 0.5, delay: 0.78, gain: 0.03, type: 'triangle' }
  ])

  playNoiseBurst(ctx, ctx.destination, {
    delay: 0.6,
    duration: 0.1,
    filterFrequency: 2600,
    gain: 0.006,
    type: 'bandpass'
  })

  activeRewardVoice = voice
}

export function useFunEffects() {
  const appConfig = useAppConfig()
  const soundEnabled = useState('sound-enabled', () => appConfig.spellingWizard.soundEnabledDefault ?? true)

  watch(soundEnabled, (enabled) => {
    if (!enabled) {
      stopAllVoices(0.05)
    }
  })

  async function playCelebrate(kind: CelebrateKind) {
    if (!import.meta.client || !soundEnabled.value) {
      return
    }

    const ctx = await ensurePlayableContext()
    if (!ctx) {
      return
    }

    switch (kind) {
      case 'correct':
        playCorrectEffect(ctx)
        break
      case 'retry':
        playRetryEffect(ctx)
        break
      case 'level':
        playLevelEffect(ctx)
        break
      case 'rank':
        playRankEffect(ctx)
        break
    }
  }

  function celebrate(kind: CelebrateKind) {
    void playCelebrate(kind)
  }

  return {
    soundEnabled,
    celebrate
  }
}
