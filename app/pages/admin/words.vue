<script setup lang="ts">
import type { AdminWordReviewEntry, WordReviewStatus } from '~~/shared/spelling'

type PlaybackMode = 'standard' | 'enunciate'
type FeedbackTone = 'info' | 'warning' | 'error'
type ReviewFilter = 'all' | WordReviewStatus

function filterAdminWords(entries: AdminWordReviewEntry[], query: string, reviewFilter: ReviewFilter) {
  const normalizedQuery = query.trim().toLowerCase()

  const reviewFilteredEntries = entries.filter((entry) => {
    if (reviewFilter === 'all') {
      return true
    }

    return entry.reviewStatus === reviewFilter
  })

  if (!normalizedQuery) {
    return reviewFilteredEntries
  }

  return reviewFilteredEntries.filter((entry) => {
    const searchableText = [
      entry.word,
      entry.enunciationText,
      entry.exampleSentence,
      entry.tags.join(' '),
      `difficulty ${entry.difficulty}`,
      `ages ${entry.ageBandMin}-${entry.ageBandMax}`,
      entry.reviewStatus.replace('-', ' ')
    ].join(' ').toLowerCase()

    return searchableText.includes(normalizedQuery)
  })
}

function getReviewStatusLabel(reviewStatus: WordReviewStatus) {
  if (reviewStatus === 'needs-review') {
    return 'Needs review'
  }

  if (reviewStatus === 'reviewed') {
    return 'Reviewed'
  }

  return 'Unreviewed'
}

const query = ref('')
const reviewFilter = ref<ReviewFilter>('all')
const activePlaybackKey = ref('')
const playbackFeedback = ref('')
const playbackTone = ref<FeedbackTone>('info')
const reviewActionKey = ref('')
const ttsInput = ref('')
const ttsMode = ref<PlaybackMode>('standard')

const { data: words, pending, error, refresh } = await useFetch<AdminWordReviewEntry[]>('/api/admin/words', {
  default: () => []
})

const { speakWord, speechSupported, voiceEnabled } = usePromptVoice()

const wordEntries = computed(() => words.value ?? [])
const filteredWords = computed(() => filterAdminWords(wordEntries.value, query.value, reviewFilter.value))
const playbackEnabled = computed(() => voiceEnabled.value && speechSupported.value)
const unreviewedCount = computed(() => wordEntries.value.filter(entry => entry.reviewStatus === 'unreviewed').length)
const needsReviewCount = computed(() => wordEntries.value.filter(entry => entry.reviewStatus === 'needs-review').length)
const reviewedCount = computed(() => wordEntries.value.filter(entry => entry.reviewStatus === 'reviewed').length)

function setPlaybackFeedback(tone: FeedbackTone, message: string) {
  playbackTone.value = tone
  playbackFeedback.value = message
}

function updateWordReviewState(wordId: string, reviewStatus: WordReviewStatus) {
  if (!words.value) {
    return
  }

  words.value = words.value.map(entry => entry.id === wordId
    ? { ...entry, reviewStatus }
    : entry)
}

function loadTtsTester(entry: AdminWordReviewEntry, mode: PlaybackMode = 'standard') {
  ttsMode.value = mode
  ttsInput.value = mode === 'enunciate' ? entry.enunciationText : entry.word
}

async function playAdminWord(entry: AdminWordReviewEntry, mode: PlaybackMode) {
  playbackFeedback.value = ''

  if (!playbackEnabled.value) {
    setPlaybackFeedback('warning', 'Browser speech is unavailable, so playback controls are disabled on this device.')
    return
  }

  const wordToSpeak = mode === 'enunciate' ? entry.enunciationText : entry.word

  activePlaybackKey.value = `${entry.id}:${mode}`

  try {
    const spoken = await speakWord(wordToSpeak, {
      interrupt: true,
      mode,
      fallbackWord: entry.word
    })

    if (!spoken) {
      setPlaybackFeedback('warning', 'Playback did not start. Check that browser speech is enabled for this device.')
    }
  }
  catch {
    setPlaybackFeedback('error', `Could not play ${entry.word}. The rest of the review list is still ready to use.`)
  }
  finally {
    activePlaybackKey.value = ''
  }
}

async function setReviewStatus(entry: AdminWordReviewEntry, reviewStatus: WordReviewStatus) {
  reviewActionKey.value = entry.id
  playbackFeedback.value = ''

  try {
    await $fetch(`/api/admin/words/${entry.id}/review`, {
      method: 'PATCH',
      body: { reviewStatus }
    })

    updateWordReviewState(entry.id, reviewStatus)
    setPlaybackFeedback('info', reviewStatus === 'needs-review'
      ? `${entry.word} is now marked for review.`
      : reviewStatus === 'reviewed'
        ? `${entry.word} is now marked reviewed.`
        : `${entry.word} is now unreviewed.`)
  }
  catch {
    setPlaybackFeedback('error', `Could not update the review state for ${entry.word}.`)
  }
  finally {
    reviewActionKey.value = ''
  }
}

async function markAllReviewed() {
  if (!needsReviewCount.value) {
    return
  }

  reviewActionKey.value = 'all'
  playbackFeedback.value = ''

  try {
    const response = await $fetch<{ updatedCount: number }>('/api/admin/words/reviewed', {
      method: 'POST'
    })

    words.value = wordEntries.value.map(entry => entry.reviewStatus === 'needs-review'
      ? { ...entry, reviewStatus: 'reviewed' }
      : entry)
    setPlaybackFeedback('info', response.updatedCount === 1
      ? '1 word is now marked reviewed.'
      : `${response.updatedCount} words are now marked reviewed.`)
  }
  catch {
    setPlaybackFeedback('error', 'Could not mark the review list as reviewed right now.')
  }
  finally {
    reviewActionKey.value = ''
  }
}

async function testTts() {
  playbackFeedback.value = ''

  if (!playbackEnabled.value) {
    setPlaybackFeedback('warning', 'Browser speech is unavailable, so the TTS tester cannot play audio on this device.')
    return
  }

  const textToSpeak = ttsInput.value.trim()
  if (!textToSpeak) {
    setPlaybackFeedback('warning', 'Add some text to the TTS tester before pressing play.')
    return
  }

  activePlaybackKey.value = 'tts-tester'

  try {
    const spoken = await speakWord(textToSpeak, {
      interrupt: true,
      mode: ttsMode.value,
      fallbackWord: textToSpeak
    })

    if (!spoken) {
      setPlaybackFeedback('warning', 'The TTS tester did not start playback. Check browser speech settings and try again.')
    }
  }
  catch {
    setPlaybackFeedback('error', 'The TTS tester could not play that text.')
  }
  finally {
    activePlaybackKey.value = ''
  }
}
</script>

<template>
  <main class="page-shell grid admin-words-page">
    <section class="hero-card admin-hero">
      <div>
        <NuxtLink class="badge" to="/">← Home</NuxtLink>
        <h1 class="hero-title" style="margin-top: 1rem;">Word pronunciation review</h1>
        <p class="hero-subtitle" style="max-width: 40rem;">
          Review the full Word Catalog, compare normal pronunciation against enunciation, and track which entries still need cleanup before a child hears them in a session.
        </p>
      </div>

      <div class="admin-overview">
        <div class="stat-card">
          <span class="tiny muted">Catalog words</span>
          <strong>{{ wordEntries.length }}</strong>
        </div>
        <div class="stat-card">
          <span class="tiny muted">Search results</span>
          <strong>{{ filteredWords.length }}</strong>
        </div>
        <div class="stat-card">
          <span class="tiny muted">Unreviewed</span>
          <strong>{{ unreviewedCount }}</strong>
        </div>
        <div class="stat-card">
          <span class="tiny muted">Needs review</span>
          <strong>{{ needsReviewCount }}</strong>
        </div>
        <div class="stat-card">
          <span class="tiny muted">Reviewed</span>
          <strong>{{ reviewedCount }}</strong>
        </div>
      </div>
    </section>

    <section class="panel grid">
      <div class="header-layout" style="gap: 1rem;">
        <div>
          <h2 style="margin: 0;">Browse every word</h2>
          <p class="helper-text" style="margin: 0.35rem 0 0;">
            Search by word, tag, difficulty, or age band. New words start unreviewed until you either flag them or mark them reviewed.
          </p>
        </div>
        <div class="button-row" style="justify-content: flex-end;">
          <button class="button-ghost" type="button" :disabled="reviewActionKey === 'all' || !needsReviewCount" @click="markAllReviewed">Mark all as reviewed</button>
          <button class="button-ghost" type="button" @click="refresh">Refresh catalog</button>
        </div>
      </div>

      <div class="admin-toolbar">
        <label class="field">
          <span>Find a word quickly</span>
          <input
            v-model="query"
            class="admin-search"
            type="search"
            placeholder="Try apple, animals, difficulty 2, or ages 7-9"
          >
        </label>

        <label class="field">
          <span>Review filter</span>
          <select v-model="reviewFilter" class="admin-select">
            <option value="all">All words</option>
            <option value="unreviewed">Unreviewed</option>
            <option value="needs-review">Needs review</option>
            <option value="reviewed">Reviewed</option>
          </select>
        </label>
      </div>

      <section class="admin-tts-tester">
        <div>
          <h3 style="margin: 0;">TTS tester</h3>
          <p class="helper-text" style="margin: 0.35rem 0 0;">
            Try raw text on this page before changing the backend word data. Use a card shortcut to load the word or enunciation into the tester.
          </p>
        </div>

        <label class="field">
          <span>Text to speak</span>
          <textarea
            v-model="ttsInput"
            class="admin-tts-input"
            rows="3"
            placeholder="Type the word, an alternate pronunciation, or a whole sentence"
          ></textarea>
        </label>

        <div class="admin-tts-actions">
          <label class="field" style="margin: 0;">
            <span>Playback mode</span>
            <select v-model="ttsMode" class="admin-select">
              <option value="standard">Standard</option>
              <option value="enunciate">Enunciate</option>
            </select>
          </label>

          <button class="button-secondary" type="button" :disabled="!playbackEnabled || activePlaybackKey === 'tts-tester'" @click="testTts">
            Test TTS
          </button>
        </div>
      </section>

      <p v-if="!playbackEnabled" class="feedback warning">
        Browser speech is not available here, so you can still browse the catalog but not play pronunciation.
      </p>
      <p v-else-if="playbackFeedback" :class="['feedback', playbackTone]">
        {{ playbackFeedback }}
      </p>
      <p v-if="pending" class="feedback info">Loading the Word Catalog...</p>
      <div v-else-if="error" class="feedback error admin-error-card">
        <span>Could not load the admin word list.</span>
        <button class="button-secondary" type="button" @click="refresh">Try again</button>
      </div>
      <template v-else>
        <div class="admin-list-summary tiny muted">
          Showing {{ filteredWords.length }} of {{ wordEntries.length }} words
        </div>

        <div v-if="filteredWords.length" class="admin-word-list">
          <article v-for="entry in filteredWords" :key="entry.id" class="admin-word-card">
            <div class="admin-word-main">
              <div>
                <h3 class="admin-word-title">{{ entry.word }}</h3>
                <p class="tiny muted" style="margin: 0.25rem 0 0;">
                  Difficulty {{ entry.difficulty }} • Ages {{ entry.ageBandMin }}-{{ entry.ageBandMax }}
                </p>
              </div>

              <div class="admin-meta-row">
                <span
                  :class="[
                    'admin-chip',
                    entry.reviewStatus === 'needs-review'
                      ? 'admin-chip-review'
                      : entry.reviewStatus === 'reviewed'
                        ? 'admin-chip-normal'
                        : 'admin-chip-unreviewed'
                  ]"
                >
                  {{ getReviewStatusLabel(entry.reviewStatus) }}
                </span>
                <span v-for="tag in entry.tags" :key="tag" class="admin-chip">{{ tag }}</span>
              </div>
            </div>

            <div class="admin-word-details">
              <div>
                <span class="tiny muted">Standard</span>
                <p class="admin-preview-text">{{ entry.word }}</p>
              </div>
              <div>
                <span class="tiny muted">Enunciation</span>
                <p class="admin-preview-text">{{ entry.enunciationText }}</p>
              </div>
              <div>
                <span class="tiny muted">Example sentence</span>
                <p class="admin-preview-text">{{ entry.exampleSentence }}</p>
              </div>
              <div>
                <span class="tiny muted">Review status</span>
                <p class="admin-preview-text">{{ getReviewStatusLabel(entry.reviewStatus) }}</p>
              </div>
            </div>

            <div class="button-row">
              <button
                class="button-secondary"
                type="button"
                :disabled="!playbackEnabled || activePlaybackKey === `${entry.id}:standard`"
                @click="playAdminWord(entry, 'standard')"
              >
                Pronounce
              </button>
              <button
                class="button-ghost"
                type="button"
                :disabled="!playbackEnabled || activePlaybackKey === `${entry.id}:enunciate`"
                @click="playAdminWord(entry, 'enunciate')"
              >
                Enunciate
              </button>
              <button class="button-ghost" type="button" @click="loadTtsTester(entry, 'standard')">Load word into TTS</button>
              <button class="button-ghost" type="button" @click="loadTtsTester(entry, 'enunciate')">Load enunciation</button>
              <button
                class="button-ghost"
                type="button"
                :disabled="reviewActionKey === entry.id"
                @click="setReviewStatus(entry, 'needs-review')"
              >
                Mark for review
              </button>
              <button
                class="button-ghost"
                type="button"
                :disabled="reviewActionKey === entry.id || entry.reviewStatus === 'reviewed'"
                @click="setReviewStatus(entry, 'reviewed')"
              >
                Mark reviewed
              </button>
            </div>
          </article>
        </div>

        <div v-else class="feedback info">
          No words match that filter yet. Try a simpler search.
        </div>
      </template>
    </section>
  </main>
</template>
