export default defineAppConfig({
  spellingWizard: {
    levelPointThreshold: 100,
    levelRewardRobux: 100,
    rankRewardRobux: 300,
    maxAttemptsPerWord: 3,
    speech: {
      standard: {
        rate: 0.74,
        pitch: 1.05,
        volume: 1
      },
      enunciate: {
        rate: 0.58,
        pitch: 1.02,
        volume: 1,
        fallbackToStandard: true
      }
    },
    soundEnabledDefault: true,
    motionEnabledDefault: true,
    rankLadder: [
      'Spark',
      'Scroll Keeper',
      'Rune Reader',
      'Spell Scribe',
      'Charm Caster',
      'Enchanter',
      'Wizard'
    ]
  }
})
