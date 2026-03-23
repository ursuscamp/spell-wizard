export type RankArtKind = 'badge' | 'card' | 'portrait'

const rankSlugByKey: Record<string, string> = {
  Spark: 'spark',
  'Scroll Keeper': 'scroll-keeper',
  'Rune Reader': 'rune-reader',
  'Spell Scribe': 'spell-scribe',
  'Charm Caster': 'charm-caster',
  Enchanter: 'enchanter',
  Wizard: 'wizard'
}

export function getRankArtPath(rankKey: string | undefined, kind: RankArtKind) {
  if (!rankKey) {
    return undefined
  }

  const slug = rankSlugByKey[rankKey]
  if (!slug) {
    return undefined
  }

  return `/art/ranks/${slug}/${kind}.png`
}
