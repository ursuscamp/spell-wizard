export function useFunEffects() {
  const soundEnabled = useState('sound-enabled', () => true)
  const reducedMotion = useState('reduced-motion', () => false)

  function playTone(frequency: number, duration = 0.15, type: OscillatorType = 'sine') {
    if (!import.meta.client || !soundEnabled.value) {
      return
    }

    const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AudioContextClass) {
      return
    }

    const ctx = new AudioContextClass()
    const oscillator = ctx.createOscillator()
    const gain = ctx.createGain()

    oscillator.type = type
    oscillator.frequency.value = frequency
    gain.gain.value = 0.0001
    gain.gain.exponentialRampToValueAtTime(0.05, ctx.currentTime + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration)

    oscillator.connect(gain)
    gain.connect(ctx.destination)
    oscillator.start()
    oscillator.stop(ctx.currentTime + duration)
  }

  function celebrate(kind: 'correct' | 'retry' | 'level' | 'rank') {
    const map = {
      correct: [660, 880],
      retry: [350],
      level: [523, 659, 783],
      rank: [659, 783, 987]
    } as const

    map[kind].forEach((tone, index) => {
      setTimeout(() => playTone(tone, kind === 'retry' ? 0.12 : 0.16, kind === 'retry' ? 'triangle' : 'sine'), index * 90)
    })
  }

  return {
    soundEnabled,
    reducedMotion,
    celebrate
  }
}
