<script setup lang="ts">
const { activateMenuMusic } = useBackgroundMusic()

onMounted(() => {
  activateMenuMusic()
})
</script>

<template>
  <NuxtRouteAnnouncer />
  <NuxtPage />
</template>
