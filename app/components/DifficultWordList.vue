<script setup lang="ts">
defineProps<{
  words: Array<{ word: string; misses: number; masteryScore: number }>
}>()
</script>

<template>
  <div class="list">
    <div v-for="entry in words" :key="entry.word" class="list-item">
      <strong>{{ entry.word }}</strong>
      <p class="tiny muted" style="margin: 0.35rem 0 0;">Misses: {{ entry.misses }} • Mastery: {{ entry.masteryScore.toFixed(1) }}</p>
    </div>
    <div v-if="!words.length" class="list-item tiny muted">No tricky words right now. Great work!</div>
  </div>
</template>
