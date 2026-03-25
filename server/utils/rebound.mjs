export const REBOUND_WINDOW = 5

export function getReboundQueue(promptHistory) {
  const queue = []

  for (const [index, prompt] of promptHistory.entries()) {
    const satisfiedIndex = queue.findIndex(entry => entry.wordId === prompt.wordId)
    if (satisfiedIndex >= 0) {
      queue.splice(satisfiedIndex, 1)
    }

    if (prompt.correctionRequired) {
      queue.push({
        wordId: prompt.wordId,
        dueCompletedCount: index + REBOUND_WINDOW
      })
    }
  }

  return queue
}

export function getForcedReboundWordId(promptHistory) {
  const completedCount = promptHistory.length
  const queue = getReboundQueue(promptHistory)
  const forcedEntry = queue.find(entry => completedCount >= entry.dueCompletedCount)

  return forcedEntry?.wordId ?? null
}
