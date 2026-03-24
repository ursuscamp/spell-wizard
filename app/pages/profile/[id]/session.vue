<script setup lang="ts">
import type { AttemptResponse, Profile, RewardEvent, SessionView } from '~~/shared/spelling'
import { getRankArtPath } from '~~/app/utils/rank-art'
import { hasValidEnunciation, WORD_CATALOG } from '~~/shared/word-catalog'

const route = useRoute()
const router = useRouter()
const profileId = computed(() => route.params.id as string)
const { activateSessionMusic } = useBackgroundMusic()

const { data: profile } = await useFetch<Profile>(() => `/api/profiles/${profileId.value}`)

const session = ref<SessionView | null>(null)
const answer = ref('')
const answerInput = ref<HTMLInputElement | null>(null)
const feedback = ref('')
const feedbackTone = ref<'success' | 'warning' | 'error' | 'info'>('info')
const visualResult = ref<'idle' | 'correct' | 'incorrect' | 'correction-required' | 'correction-complete'>('idle')
const animationKey = ref(0)
const animatedLetters = ref<string[]>([])
const rewards = ref<AttemptResponse['rewards']>([])
const rewardQueue = ref<RewardEvent[]>([])
const activeReward = ref<RewardEvent | null>(null)
const rewardInterstitialVisible = ref(false)
const rewardInterstitialKey = ref(0)
const rewardInterstitialPending = ref(false)
const loading = ref(false)
const sessionEnded = ref(false)
const sentenceTooltipVisible = ref(false)
const rewardInterstitialButton = ref<HTMLButtonElement | null>(null)
let clearVisualTimer: ReturnType<typeof setTimeout> | null = null
let rewardInterstitialTimer: ReturnType<typeof setTimeout> | null = null

const { celebrate, reducedMotion } = useFunEffects()
const { speakWord, voiceEnabled, speechSupported } = usePromptVoice()
const appConfig = useAppConfig()

const currentEntry = computed(() => WORD_CATALOG.find(word => word.id === session.value?.currentPrompt.wordId))
const currentWord = computed(() => currentEntry.value?.word)
const currentEnunciation = computed(() => currentEntry.value?.enunciationText)
const currentExampleSentence = computed(() => currentEntry.value?.exampleSentence)
const canEnunciate = computed(() => Boolean(currentEntry.value && hasValidEnunciation(currentEntry.value)))

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function maskWordInSentence(sentence?: string, word?: string) {
  if (!sentence || !word) {
    return undefined
  }

  return sentence.replace(new RegExp(`\\b${escapeRegExp(word)}\\b`, 'gi'), '_____')
}

const maskedExampleSentence = computed(() => maskWordInSentence(currentExampleSentence.value, currentWord.value))
const revealedLetters = ref<string[]>([])
const maskedPrompt = computed(() => {
  if (!currentWord.value) {
    return undefined
  }

  const revealed = new Set(revealedLetters.value)
  return currentWord.value
    .split('')
    .map(letter => revealed.has(letter) ? letter : '_')
    .join(' ')
})
const visiblePrompt = computed(() => {
  if (session.value?.correctionRequired) {
    return session.value.currentPrompt.visibleWord
  }

  return maskedPrompt.value
})
const promptLetters = computed(() => {
  if (!currentWord.value) {
    return []
  }

  const revealed = new Set(revealedLetters.value)
  const pulsing = new Set(animatedLetters.value)
  const correctionRequired = session.value?.correctionRequired ?? false

  return currentWord.value.split('').map((letter, index) => {
    const isVisible = correctionRequired || revealed.has(letter)

    return {
      key: `${index}-${letter}`,
      letter,
      display: isVisible ? letter : '_',
      isRevealed: !correctionRequired && revealed.has(letter),
      shouldPulse: !correctionRequired && pulsing.has(letter)
    }
  })
})
const isSuccessVisual = computed(() => visualResult.value === 'correct' || visualResult.value === 'correction-complete')
const activeRewardStyle = computed(() => activeReward.value?.type === 'rank-up' ? 'rank' : 'level')
const activeRewardArtPath = computed(() => {
  if (!activeReward.value?.rankKey) {
    return undefined
  }

  return getRankArtPath(activeReward.value.rankKey, 'card') ?? getRankArtPath(activeReward.value.rankKey, 'portrait')
})
const activeRewardHeadline = computed(() => activeReward.value?.type === 'rank-up' ? 'Rank Up!' : 'Level Up!')
const activeRewardTitle = computed(() => {
  if (!activeReward.value) {
    return ''
  }

  return activeReward.value.type === 'rank-up'
    ? activeReward.value.rankKey ?? 'New rank unlocked'
    : `Level ${activeReward.value.levelReached}`
})
const activeRewardSubtitle = computed(() => {
  if (!activeReward.value) {
    return ''
  }

  return activeReward.value.type === 'rank-up'
    ? `You reached level ${activeReward.value.levelReached} and unlocked a new magical rank.`
    : 'Your spelling streak pushed your wizard training to the next level.'
})
const activeRewardButtonLabel = computed(() => rewardQueue.value.length ? 'Next reward' : 'Keep spelling')
const activeRewardDuration = computed(() => 10000)
const rewardInterstitialParticles = computed(() => {
  if (reducedMotion.value || !activeReward.value) {
    return []
  }

  if (activeReward.value.type === 'rank-up') {
    return [
      { symbol: '✦', style: { '--burst-x': '-18rem', '--burst-y': '-12rem', '--burst-delay': '0ms', '--burst-rotate': '-12deg' } },
      { symbol: '✧', style: { '--burst-x': '16rem', '--burst-y': '-11rem', '--burst-delay': '80ms', '--burst-rotate': '18deg' } },
      { symbol: '✦', style: { '--burst-x': '-20rem', '--burst-y': '2rem', '--burst-delay': '130ms', '--burst-rotate': '-20deg' } },
      { symbol: '✧', style: { '--burst-x': '18rem', '--burst-y': '3rem', '--burst-delay': '180ms', '--burst-rotate': '16deg' } },
      { symbol: '✦', style: { '--burst-x': '-9rem', '--burst-y': '13rem', '--burst-delay': '210ms', '--burst-rotate': '-8deg' } },
      { symbol: '✧', style: { '--burst-x': '8rem', '--burst-y': '14rem', '--burst-delay': '260ms', '--burst-rotate': '12deg' } }
    ]
  }

  return [
    { symbol: '✦', style: { '--burst-x': '-14rem', '--burst-y': '-10rem', '--burst-delay': '0ms', '--burst-rotate': '-12deg' } },
    { symbol: '✧', style: { '--burst-x': '12rem', '--burst-y': '-9rem', '--burst-delay': '60ms', '--burst-rotate': '14deg' } },
    { symbol: '✦', style: { '--burst-x': '-16rem', '--burst-y': '4rem', '--burst-delay': '120ms', '--burst-rotate': '-18deg' } },
    { symbol: '✧', style: { '--burst-x': '15rem', '--burst-y': '5rem', '--burst-delay': '170ms', '--burst-rotate': '18deg' } },
    { symbol: '✦', style: { '--burst-x': '0rem', '--burst-y': '14rem', '--burst-delay': '240ms', '--burst-rotate': '0deg' } }
  ]
})
const sparkleParticles = computed(() => {
  if (reducedMotion.value || !isSuccessVisual.value) {
    return []
  }

  return [
    { symbol: '✦', style: { '--spark-x': '-4.8rem', '--spark-y': '-3.2rem', '--spark-rotate': '-16deg', '--spark-delay': '0ms' } },
    { symbol: '✧', style: { '--spark-x': '4.6rem', '--spark-y': '-3.4rem', '--spark-rotate': '18deg', '--spark-delay': '40ms' } },
    { symbol: '✦', style: { '--spark-x': '-5.8rem', '--spark-y': '-0.8rem', '--spark-rotate': '-24deg', '--spark-delay': '90ms' } },
    { symbol: '✧', style: { '--spark-x': '5.4rem', '--spark-y': '-0.4rem', '--spark-rotate': '22deg', '--spark-delay': '120ms' } },
    { symbol: '✦', style: { '--spark-x': '-3.8rem', '--spark-y': '2.9rem', '--spark-rotate': '-14deg', '--spark-delay': '150ms' } },
    { symbol: '✧', style: { '--spark-x': '4.1rem', '--spark-y': '2.7rem', '--spark-rotate': '14deg', '--spark-delay': '180ms' } },
    { symbol: '✦', style: { '--spark-x': '0rem', '--spark-y': '-4.1rem', '--spark-rotate': '0deg', '--spark-delay': '70ms' } },
    { symbol: '✧', style: { '--spark-x': '0.4rem', '--spark-y': '3.5rem', '--spark-rotate': '8deg', '--spark-delay': '210ms' } }
  ]
})

function setVisualState(state: 'correct' | 'incorrect' | 'correction-required' | 'correction-complete', lettersToPulse: string[] = []) {
  animationKey.value += 1
  visualResult.value = state
  animatedLetters.value = lettersToPulse

  if (clearVisualTimer) {
    clearTimeout(clearVisualTimer)
  }

  clearVisualTimer = window.setTimeout(() => {
    visualResult.value = 'idle'
    animatedLetters.value = []
    clearVisualTimer = null
  }, state === 'incorrect' ? 520 : 700)
}

function clearRewardInterstitialTimer() {
  if (rewardInterstitialTimer) {
    clearTimeout(rewardInterstitialTimer)
    rewardInterstitialTimer = null
  }
}

function scheduleRewardInterstitialTimer() {
  clearRewardInterstitialTimer()
  rewardInterstitialTimer = window.setTimeout(() => {
    advanceRewardInterstitial()
  }, activeRewardDuration.value)
}

async function resumePromptAfterInterstitial() {
  rewardInterstitialPending.value = false
  await nextTick()
  await replayWord({ interrupt: false })
  await focusAnswerInput()
}

function showNextRewardInterstitial() {
  if (rewardInterstitialVisible.value || !rewardQueue.value.length) {
    return
  }

  activeReward.value = rewardQueue.value.shift() ?? null

  if (!activeReward.value) {
    rewardInterstitialPending.value = false
    return
  }

  rewardInterstitialVisible.value = true
  rewardInterstitialKey.value += 1
  celebrate(activeReward.value.type === 'rank-up' ? 'rank' : 'level')
  scheduleRewardInterstitialTimer()

  void nextTick(() => {
    rewardInterstitialButton.value?.focus()
  })
}

function enqueueRewardInterstitials(emittedRewards: RewardEvent[]) {
  if (!emittedRewards.length) {
    rewardInterstitialPending.value = false
    return
  }

  rewardInterstitialPending.value = true
  rewardQueue.value.push(...emittedRewards)
  showNextRewardInterstitial()
}

function advanceRewardInterstitial() {
  clearRewardInterstitialTimer()

  if (rewardQueue.value.length) {
    rewardInterstitialVisible.value = false
    activeReward.value = null
    showNextRewardInterstitial()
    return
  }

  rewardInterstitialVisible.value = false
  activeReward.value = null
  void resumePromptAfterInterstitial()
}

async function focusAnswerInput() {
  await nextTick()

  if (!answerInput.value) {
    return
  }

  answerInput.value.focus()

  setTimeout(() => {
    answerInput.value?.focus()
  }, 0)
}

async function startSession() {
  loading.value = true
  const created = await $fetch<SessionView>('/api/sessions', {
    method: 'POST',
    body: { profileId: profileId.value }
  })
  session.value = created
  feedback.value = 'Listen for the word, then type your best spelling.'
  feedbackTone.value = 'info'
  visualResult.value = 'idle'
  animationKey.value = 0
  animatedLetters.value = []
  rewards.value = []
  rewardQueue.value = []
  activeReward.value = null
  rewardInterstitialVisible.value = false
  rewardInterstitialKey.value = 0
  rewardInterstitialPending.value = false
  answer.value = ''
  loading.value = false
}

async function replayWord(options: { interrupt?: boolean } = {}) {
  if (!voiceEnabled.value || !currentWord.value) {
    return
  }

  await speakWord(currentWord.value, {
    ...options,
    mode: 'standard'
  })
}

async function enunciateWord() {
  if (!voiceEnabled.value || !currentWord.value) {
    return
  }

  const canFallbackToStandard = appConfig.spellingWizard.speech.enunciate.fallbackToStandard
  const wordToSpeak = canEnunciate.value
    ? currentEnunciation.value
    : canFallbackToStandard
      ? currentWord.value
      : undefined

  await speakWord(wordToSpeak, {
    interrupt: true,
    mode: 'enunciate',
    fallbackWord: canFallbackToStandard ? currentWord.value : undefined
  })

  await focusAnswerInput()
}

async function playExampleSentence() {
  if (!voiceEnabled.value || !currentExampleSentence.value) {
    return
  }

  sentenceTooltipVisible.value = true

  try {
    await speakWord(currentExampleSentence.value, {
      interrupt: true,
      mode: 'standard'
    })
  }
  finally {
    sentenceTooltipVisible.value = false
    await focusAnswerInput()
  }
}

function handleRewards(emittedRewards: AttemptResponse['rewards']) {
  rewards.value = emittedRewards
  enqueueRewardInterstitials(emittedRewards)
}

async function submitAnswer() {
  if (!session.value || !answer.value.trim()) {
    return
  }

  const wasCorrectionSubmission = session.value.correctionRequired
  const submittedAnswer = answer.value
  const guessedLetters = new Set(submittedAnswer.trim().toLowerCase().replace(/[^a-z]/g, '').split(''))
  const matchedLetters = currentWord.value
    ?.split('')
    .filter(letter => guessedLetters.has(letter))
    ?? []

  loading.value = true
  const endpoint = session.value.correctionRequired
    ? `/api/sessions/${session.value.sessionId}/correction`
    : `/api/sessions/${session.value.sessionId}/attempts`

  const response = await $fetch<AttemptResponse>(endpoint, {
    method: 'POST',
    body: { answer: answer.value }
  })

  session.value = response.session
  feedback.value = response.feedback
  feedbackTone.value = response.status === 'correct' || response.status === 'correction-complete'
    ? 'success'
    : response.status === 'correction-required'
      ? 'error'
      : 'warning'

  if (!wasCorrectionSubmission && matchedLetters.length) {
    revealedLetters.value = [...new Set([...revealedLetters.value, ...matchedLetters])]
  }

  if (response.status === 'correct' || response.status === 'correction-complete') {
    setVisualState(response.status)
    celebrate('correct')
    answer.value = ''
    handleRewards(response.rewards)
  }
  else if (response.status === 'incorrect' || response.status === 'correction-required') {
    setVisualState(response.status, !wasCorrectionSubmission ? matchedLetters : [])
    celebrate('retry')
    answer.value = ''
  }
  else {
    answer.value = ''
  }

  loading.value = false
}

async function endCurrentSession() {
  if (!session.value) {
    return router.push(`/profile/${profileId.value}`)
  }

  loading.value = true
  await $fetch(`/api/sessions/${session.value.sessionId}/end`, { method: 'POST' })
  loading.value = false
  sessionEnded.value = true
}

watch(() => session.value?.currentPrompt.wordId, async (wordId) => {
  if (wordId) {
    revealedLetters.value = []
    animatedLetters.value = []

    if (rewardInterstitialPending.value || rewardInterstitialVisible.value) {
      return
    }

    await nextTick()
    replayWord({ interrupt: false })
    await focusAnswerInput()
  }
})

watch(session, async (value) => {
  if (value && !sessionEnded.value && !rewardInterstitialPending.value && !rewardInterstitialVisible.value) {
    await focusAnswerInput()
  }
})

onMounted(() => {
  activateSessionMusic()

  if (!session.value || sessionEnded.value) {
    return
  }

  setTimeout(() => {
    focusAnswerInput()
  }, 50)
})

onBeforeUnmount(() => {
  if (clearVisualTimer) {
    clearTimeout(clearVisualTimer)
  }

  clearRewardInterstitialTimer()
})

await startSession()
</script>

<template>
  <main class="page-shell grid">
    <div
      v-if="activeReward && rewardInterstitialVisible"
      :key="rewardInterstitialKey"
      :class="[
        'reward-interstitial',
        `reward-interstitial-${activeRewardStyle}`,
        { 'reward-interstitial-reduced-motion': reducedMotion }
      ]"
      role="dialog"
      aria-modal="true"
      aria-live="polite"
    >
      <span
        v-for="particle in rewardInterstitialParticles"
        :key="`${rewardInterstitialKey}-${particle.symbol}-${particle.style['--burst-x']}`"
        class="reward-interstitial-burst"
        :style="particle.style"
        aria-hidden="true"
      >
        {{ particle.symbol }}
      </span>

      <div class="reward-interstitial-shell">
        <div class="reward-interstitial-copy">
          <div class="badge reward-interstitial-badge" :class="{ 'badge-rank-up': activeReward.type === 'rank-up' }">
            {{ activeRewardHeadline }}
          </div>
          <p class="reward-interstitial-kicker">{{ profile?.name }} just unlocked a magical milestone.</p>
          <h2 class="reward-interstitial-title">{{ activeRewardTitle }}</h2>
          <p class="reward-interstitial-subtitle">{{ activeRewardSubtitle }}</p>

          <div class="reward-interstitial-stats">
            <div class="reward-interstitial-stat">
              <span class="tiny muted">Reward</span>
              <strong>{{ activeReward.robuxAwarded }} Robux</strong>
            </div>
            <div class="reward-interstitial-stat">
              <span class="tiny muted">Level</span>
              <strong>{{ activeReward.levelReached }}</strong>
            </div>
            <div v-if="activeReward.rankKey" class="reward-interstitial-stat">
              <span class="tiny muted">Rank</span>
              <strong>{{ activeReward.rankKey }}</strong>
            </div>
          </div>

          <div class="button-row reward-interstitial-actions">
            <button
              ref="rewardInterstitialButton"
              class="button"
              type="button"
              @click="advanceRewardInterstitial"
            >
              {{ activeRewardButtonLabel }}
            </button>
          </div>
        </div>

        <div class="reward-interstitial-hero" :class="{ 'reward-interstitial-hero-rank': activeReward.type === 'rank-up' }">
          <img
            v-if="activeRewardArtPath"
            class="reward-interstitial-art"
            :src="activeRewardArtPath"
            :alt="`${activeReward.rankKey} rank art`"
          />
          <div v-else class="reward-interstitial-level-emblem" aria-hidden="true">
            <span>Level</span>
            <strong>{{ activeReward.levelReached }}</strong>
          </div>
        </div>
      </div>
    </div>

    <section class="hero-card header-layout" v-if="profile">
      <div>
        <NuxtLink class="badge" :to="`/profile/${profile.id}`">← Dashboard</NuxtLink>
        <h1 class="hero-title" style="margin-top: 1rem;">{{ profile.name }}'s spelling session</h1>
        <p class="hero-subtitle">Hear the word, type your answer, and keep going for as many words as you want.</p>
      </div>
      <div class="button-row">
        <button class="button-ghost" type="button" @click="endCurrentSession">Finish session</button>
      </div>
    </section>

    <div v-if="sessionEnded" class="panel">
      <p class="feedback success">Session saved.</p>
      <NuxtLink class="button-secondary" :to="`/profile/${profileId}`">Return to dashboard</NuxtLink>
    </div>

    <section v-else-if="session" class="session-flow">
      <article
        :class="[
          'session-card',
          'session-card-animated',
          `session-card-${visualResult}`,
          { 'session-card-reduced-motion': reducedMotion }
        ]"
      >
        <div class="badge">{{ session.currentPrompt.hint }}</div>
        <h2
          :class="[
            'prompt-word',
            `prompt-word-${visualResult}`,
            { 'prompt-word-reduced-motion': reducedMotion }
          ]"
          :data-animation-key="animationKey"
          style="margin-top: 1rem;"
        >
          <span
            v-for="item in sparkleParticles"
            :key="`${animationKey}-${item.symbol}-${item.style['--spark-x']}`"
            class="prompt-word-sparkle"
            :style="item.style"
            aria-hidden="true"
          >
            {{ item.symbol }}
          </span>
          <template v-if="promptLetters.length">
            <span
              v-for="entry in promptLetters"
              :key="entry.key"
              :class="[
                'prompt-letter',
                {
                  'prompt-letter-revealed': entry.isRevealed,
                  'prompt-letter-pulse': entry.shouldPulse && animationKey > 0
                }
              ]"
            >
              {{ entry.display }}
            </span>
          </template>
          <template v-else>
            {{ visiblePrompt || '_ _ _' }}
          </template>
        </h2>
        <p class="helper-text">{{ session.correctionRequired ? 'Type the correct spelling before moving on.' : canEnunciate ? 'Each guess reveals any matching letters in the word, even if they are not in the right place yet. You can also tap enunciate for extra-clear speech.' : 'Each guess reveals any matching letters in the word, even if they are not in the right place yet.' }}</p>

        <div class="stats-grid" style="margin: 1rem 0;">
          <div class="stat-card">
            <span class="tiny muted">Attempts used</span>
            <strong>{{ session.attemptsUsed }} / {{ session.maxAttempts }}</strong>
          </div>
          <div class="stat-card">
            <span class="tiny muted">Session points</span>
            <strong>{{ session.pointsEarned }}</strong>
          </div>
          <div class="stat-card">
            <span class="tiny muted">Words completed</span>
            <strong>{{ session.wordsCompleted }}</strong>
          </div>
        </div>

        <form class="form-grid" @submit.prevent="submitAnswer">
          <label class="field">
            <span>{{ session.correctionRequired ? 'Type the revealed word' : 'Type your spelling' }}</span>
            <input
              ref="answerInput"
              v-model="answer"
              :class="[
                'session-input',
                `session-input-${visualResult}`,
                { 'session-input-reduced-motion': reducedMotion }
              ]"
              type="text"
              autocomplete="off"
              autocapitalize="off"
              spellcheck="false"
              autofocus
            />
          </label>

          <div class="button-row">
            <button class="button-secondary" :disabled="loading" type="submit">{{ session.correctionRequired ? 'Lock in correction' : 'Submit spelling' }}</button>
            <button class="button-ghost" :disabled="loading" type="button" @click="replayWord({ interrupt: true }).then(() => focusAnswerInput())">Hear it again</button>
            <button class="button-ghost" :disabled="loading || !voiceEnabled || !speechSupported" type="button" @click="enunciateWord">Enunciate</button>
            <div
              v-if="maskedExampleSentence"
              :class="['sentence-tooltip-anchor', { 'sentence-tooltip-visible': sentenceTooltipVisible }]"
            >
              <div class="sentence-tooltip-panel tiny" role="status" aria-live="polite">
                {{ maskedExampleSentence }}
              </div>
              <button class="button-ghost" :disabled="loading || !voiceEnabled || !speechSupported || !currentExampleSentence" type="button" @click="playExampleSentence">Read sentence</button>
            </div>
            <button v-else class="button-ghost" :disabled="loading || !voiceEnabled || !speechSupported || !currentExampleSentence" type="button" @click="playExampleSentence">Read sentence</button>
          </div>
        </form>

        <div :key="animationKey" :class="['feedback', feedbackTone, 'feedback-animated', `feedback-${visualResult}`]" style="margin-top: 1rem;">{{ feedback }}</div>
        <section v-if="rewards.length" class="session-rewards">
          <h3 style="margin-bottom: 0.75rem;">Rewards earned this turn</h3>
          <RewardList :rewards="rewards" />
        </section>
      </article>
    </section>

    <section v-else class="panel">
      <p class="feedback info">Starting session...</p>
    </section>
  </main>
</template>
