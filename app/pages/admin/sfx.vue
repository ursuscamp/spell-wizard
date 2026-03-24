<script setup lang="ts">
type SfxKind = 'correct' | 'retry' | 'level' | 'rank'
type MusicKind = 'menu'

type SfxEntry = {
  kind: SfxKind,
  title: string,
  description: string
}

type MusicEntry = {
  kind: MusicKind,
  title: string,
  description: string
}

const sfxEntries: SfxEntry[] = [
  {
    kind: 'correct',
    title: 'Correct answer',
    description: 'Short bright sparkle when a spelling is right.'
  },
  {
    kind: 'retry',
    title: 'Wrong answer',
    description: 'Gentle corrective wobble with a soft poof.'
  },
  {
    kind: 'level',
    title: 'Level up',
    description: 'Warm ascending fanfare for a new level reward.'
  },
  {
    kind: 'rank',
    title: 'Rank up',
    description: 'Big celebratory flourish for a new rank reward.'
  }
]

const musicEntries: MusicEntry[] = [
  {
    kind: 'menu',
    title: 'Background song',
    description: 'The one cozy magical loop that now plays across the whole app.'
  }
]

const activeKind = ref<SfxKind | ''>('')
const activeMusicKind = ref<MusicKind | ''>('')
const testerFeedback = ref('Tap any button to hear the current sound mix.')
const testerTone = ref<'info' | 'warning'>('info')

const { celebrate, soundEnabled } = useFunEffects()
const { activateMenuMusic, musicEnabled } = useBackgroundMusic()
const { voiceEnabled, speakWord, speechSupported } = usePromptVoice()

function playSfx(kind: SfxKind) {
  if (!soundEnabled.value) {
    testerTone.value = 'warning'
    testerFeedback.value = 'Sparkle sounds are muted. Turn them back on to hear the effect tester.'
    return
  }

  activeKind.value = kind
  testerTone.value = 'info'
  testerFeedback.value = `Playing the ${kind} sound effect.`
  celebrate(kind)

  window.setTimeout(() => {
    if (activeKind.value === kind) {
      activeKind.value = ''
    }
  }, kind === 'rank' ? 2200 : kind === 'level' ? 1300 : 600)
}

async function playVoiceReference() {
  testerTone.value = 'info'

  if (!voiceEnabled.value) {
    testerTone.value = 'warning'
    testerFeedback.value = 'Spoken words are muted. Turn them back on to compare voice volume with the sound effects.'
    return
  }

  if (!speechSupported.value) {
    testerTone.value = 'warning'
    testerFeedback.value = 'Speech playback is unavailable right now, so the voice comparison cannot play.'
    return
  }

  testerFeedback.value = 'Playing a sample spoken phrase for volume comparison.'
  await speakWord('Spell Wizard sound check.', {
    interrupt: true,
    mode: 'standard',
    fallbackWord: 'Spell Wizard sound check.'
  })
}

function playMusic(kind: MusicKind) {
  if (!musicEnabled.value) {
    testerTone.value = 'warning'
    testerFeedback.value = 'Background music is muted. Turn it back on to preview the loop.'
    return
  }

  activeMusicKind.value = kind
  testerTone.value = 'info'
  testerFeedback.value = 'Playing the global background song.'
  activateMenuMusic()
}

watch(musicEnabled, (enabled) => {
  if (!enabled) {
    activeMusicKind.value = ''
  }
})
</script>

<template>
  <main class="page-shell grid admin-sfx-page">
    <section class="hero-card admin-hero">
      <div>
        <NuxtLink class="badge" to="/">← Home</NuxtLink>
        <h1 class="hero-title" style="margin-top: 1rem;">Sound effects tester</h1>
        <p class="hero-subtitle" style="max-width: 40rem;">
          Audition every gameplay sound without running a session. This page is helpful for balancing the sound effects against the spoken word volume.
        </p>
      </div>

      <div class="admin-overview">
        <div class="stat-card">
          <span class="tiny muted">Sound effects</span>
          <strong>{{ soundEnabled ? 'On' : 'Muted' }}</strong>
        </div>
        <div class="stat-card">
          <span class="tiny muted">Voice playback</span>
          <strong>{{ voiceEnabled ? 'On' : 'Muted' }}</strong>
        </div>
        <div class="stat-card">
          <span class="tiny muted">Background music</span>
          <strong>{{ musicEnabled ? 'On' : 'Muted' }}</strong>
        </div>
        <div class="stat-card">
          <span class="tiny muted">Speech service</span>
          <strong>{{ speechSupported ? 'Ready' : 'Unavailable' }}</strong>
        </div>
      </div>
    </section>

    <section class="panel grid">
      <div class="header-layout" style="gap: 1rem;">
        <div>
          <h2 style="margin: 0;">Audition the mix</h2>
          <p class="helper-text" style="margin: 0.35rem 0 0;">
            Try the spoken voice first, then trigger the celebration sounds to compare loudness and character.
          </p>
        </div>
        <div class="button-row" style="justify-content: flex-end;">
          <button class="button-ghost" type="button" @click="soundEnabled = !soundEnabled">
            {{ soundEnabled ? 'Mute sparkle sounds' : 'Enable sparkle sounds' }}
          </button>
          <button class="button-ghost" type="button" @click="musicEnabled = !musicEnabled">
            {{ musicEnabled ? 'Mute background music' : 'Enable background music' }}
          </button>
          <button class="button-ghost" type="button" @click="voiceEnabled = !voiceEnabled">
            {{ voiceEnabled ? 'Mute spoken words' : 'Enable spoken words' }}
          </button>
        </div>
      </div>

      <div :class="['feedback', testerTone]">{{ testerFeedback }}</div>

      <div class="button-row">
        <button class="button-secondary" type="button" @click="playVoiceReference">Play voice reference</button>
      </div>

      <section class="admin-sfx-section">
        <div class="admin-sfx-section-header">
          <div>
            <h3 style="margin: 0;">Background music</h3>
            <p class="helper-text" style="margin: 0.35rem 0 0;">
              Preview the one background song that now follows the app instead of restarting per page.
            </p>
          </div>
        </div>

        <section class="admin-sfx-grid">
          <article
            v-for="entry in musicEntries"
            :key="entry.kind"
            class="admin-sfx-card"
            :class="{ 'admin-sfx-card-active': activeMusicKind === entry.kind }"
          >
            <div>
              <div class="badge">{{ entry.title }}</div>
              <h3 class="admin-sfx-title">{{ entry.title }}</h3>
              <p class="helper-text" style="margin: 0;">{{ entry.description }}</p>
            </div>

            <div class="button-row">
              <button class="button-secondary" type="button" @click="playMusic(entry.kind)">Play loop</button>
            </div>
          </article>
        </section>
      </section>

      <section class="admin-sfx-section">
        <div class="admin-sfx-section-header">
          <div>
            <h3 style="margin: 0;">Sound effects</h3>
            <p class="helper-text" style="margin: 0.35rem 0 0;">
              Trigger the gameplay celebration sounds and compare them against voice playback and music.
            </p>
          </div>
        </div>

        <section class="admin-sfx-grid">
          <article
            v-for="entry in sfxEntries"
            :key="entry.kind"
            class="admin-sfx-card"
            :class="{ 'admin-sfx-card-active': activeKind === entry.kind }"
          >
            <div>
              <div class="badge">{{ entry.title }}</div>
              <h3 class="admin-sfx-title">{{ entry.title }}</h3>
              <p class="helper-text" style="margin: 0;">{{ entry.description }}</p>
            </div>

            <div class="button-row">
              <button class="button-secondary" type="button" @click="playSfx(entry.kind)">Play effect</button>
            </div>
          </article>
        </section>
      </section>
    </section>
  </main>
</template>
