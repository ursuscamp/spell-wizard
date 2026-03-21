import type { AppRuleSet, RankDefinition } from '../../shared/spelling'

export const appRules: AppRuleSet = {
  levelPointThreshold: 100,
  levelRewardRobux: 100,
  rankRewardRobux: 300,
  maxAttemptsPerWord: 3,
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

export function getLevelFromPoints(pointsTotal: number) {
  return Math.floor(pointsTotal / appRules.levelPointThreshold)
}

export function getRankForLevel(level: number): RankDefinition {
  const index = Math.min(Math.floor(level / 3), appRules.rankLadder.length - 1)

  return {
    index,
    key: appRules.rankLadder[index]
  }
}
