<script setup lang="ts">
const { activateMenuMusic, musicEnabled } = useBackgroundMusic()
const { soundEnabled } = useFunEffects()

onMounted(() => {
  activateMenuMusic()
})
</script>

<template>
  <NuxtRouteAnnouncer />
  <NuxtPage />
  <div class="session-audio-dock" aria-label="Audio controls">
    <button
      :class="['session-audio-toggle', { 'session-audio-toggle-off': !musicEnabled }]"
      type="button"
      :aria-pressed="musicEnabled"
      :title="musicEnabled ? 'Background music is on' : 'Background music is off'"
      @click="musicEnabled = !musicEnabled"
    >
      <span class="session-audio-icon" aria-hidden="true">♬</span>
      <span class="session-audio-tooltip" role="tooltip">
        {{ musicEnabled ? 'Turn background music off' : 'Turn background music on' }}
      </span>
    </button>
    <button
      :class="['session-audio-toggle', { 'session-audio-toggle-off': !soundEnabled }]"
      type="button"
      :aria-pressed="soundEnabled"
      :title="soundEnabled ? 'Sound effects are on' : 'Sound effects are off'"
      @click="soundEnabled = !soundEnabled"
    >
      <span class="session-audio-icon" aria-hidden="true">✦</span>
      <span class="session-audio-tooltip" role="tooltip">
        {{ soundEnabled ? 'Turn sparkle sounds off' : 'Turn sparkle sounds on' }}
      </span>
    </button>
  </div>
</template>
