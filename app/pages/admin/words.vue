<script setup lang="ts">
import type { AdminWordReviewEntry } from '~~/shared/spelling'

type PlaybackMode = 'standard' | 'enunciate'
type FeedbackTone = 'info' | 'warning' | 'error'

function filterAdminWords(entries: AdminWordReviewEntry[], query: string) {
  const normalizedQuery = query.trim().toLowerCase()

  if (!normalizedQuery) {
    return entries
  }

  return entries.filter(entry => {
    const searchableText = [
      entry.word,
      entry.enunciationText,
      entry.tags.join(' '),
      `difficulty ${entry.difficulty}`,
      `ages ${entry.ageBandMin}-${entry.ageBandMax}`
    ].join(' ').toLowerCase()

    return searchableText.includes(normalizedQuery)
  })
}

const query = ref('')
const activePlaybackKey = ref('')
const playbackFeedback = ref('')
const playbackTone = ref<FeedbackTone>('info')

const { data: words, pending, error, refresh } = await useFetch<AdminWordReviewEntry[]>('/api/admin/words', {
  default: () => []
})

const { speakWord, speechSupported, voiceEnabled } = usePromptVoice()

const wordEntries = computed(() => words.value ?? [])
const filteredWords = computed(() => filterAdminWords(wordEntries.value, query.value))
const playbackEnabled = computed(() => voiceEnabled.value && speechSupported.value)

async function playAdminWord(entry: AdminWordReviewEntry, mode: PlaybackMode) {
  playbackFeedback.value = ''

  if (!playbackEnabled.value) {
    playbackTone.value = 'warning'
    playbackFeedback.value = 'Browser speech is unavailable, so playback controls are disabled on this device.'
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
      playbackTone.value = 'warning'
      playbackFeedback.value = 'Playback did not start. Check that browser speech is enabled for this device.'
    }
  }
  catch {
    playbackTone.value = 'error'
    playbackFeedback.value = `Could not play ${entry.word}. The rest of the review list is still ready to use.`
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
          Review the full Word Catalog, compare normal pronunciation against enunciation, and spot entries that still need cleanup before a child hears them in a session.
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
          <span class="tiny muted">Playback modes</span>
          <strong>2</strong>
        </div>
      </div>
    </section>

    <section class="panel grid">
      <div class="header-layout" style="gap: 1rem;">
        <div>
          <h2 style="margin: 0;">Browse every word</h2>
          <p class="helper-text" style="margin: 0.35rem 0 0;">
            Search by word, tag, difficulty, or age band. Playback stays read-only and never touches progress or reward history.
          </p>
        </div>
        <button class="button-ghost" type="button" @click="refresh">Refresh catalog</button>
      </div>

      <label class="field">
        <span>Find a word quickly</span>
        <input
          v-model="query"
          class="admin-search"
          type="search"
          placeholder="Try apple, animals, difficulty 2, or ages 7-9"
        >
      </label>

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
                <span class="tiny muted">Mode</span>
                <p class="admin-preview-text">Standard and enunciate</p>
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
