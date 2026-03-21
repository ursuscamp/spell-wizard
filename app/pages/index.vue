<script setup lang="ts">
import type { Profile } from '~~/shared/spelling'

const { data: profiles, refresh } = await useFetch<Profile[]>('/api/profiles')

const modalOpen = ref(false)
const editingProfile = ref<Profile | null>(null)
const pending = ref(false)
const error = ref('')

function openCreate() {
  editingProfile.value = null
  modalOpen.value = true
}

function openEdit(profile: Profile) {
  editingProfile.value = profile
  modalOpen.value = true
}

async function submitProfile(payload: { name: string; birthdate: string; avatarUri?: string }) {
  pending.value = true
  error.value = ''

  try {
    if (editingProfile.value) {
      await $fetch(`/api/profiles/${editingProfile.value.id}`, {
        method: 'PATCH',
        body: payload
      })
    }
    else {
      await $fetch('/api/profiles', {
        method: 'POST',
        body: payload
      })
    }

    modalOpen.value = false
    await refresh()
  }
  catch (caught) {
    error.value = caught instanceof Error ? caught.message : 'Could not save that profile.'
  }
  finally {
    pending.value = false
  }
}

async function deleteProfile(profile: Profile) {
  if (!window.confirm(`Delete ${profile.name}'s profile and history?`)) {
    return
  }

  await $fetch(`/api/profiles/${profile.id}`, { method: 'DELETE' })
  await refresh()
}
</script>

<template>
  <main class="page-shell grid">
    <section class="hero-card hero-layout">
      <div>
        <div class="badge"><span class="sparkles">✦ ✧ ✦</span> Spelling Wizard</div>
        <h1 class="hero-title" style="margin-top: 1rem;">A bright spelling adventure for your whole house.</h1>
        <p class="hero-subtitle" style="font-size: 1.05rem; max-width: 38rem;">
          Build a profile for each child, let the app speak each word aloud, and watch points, Robux rewards, and magical ranks grow across your home server.
        </p>
        <div class="button-row" style="margin-top: 1rem;">
          <button class="button-secondary" type="button" @click="openCreate">Create a profile</button>
          <a class="button-ghost" href="https://nuxt.com" target="_blank" rel="noreferrer">Powered by Nuxt</a>
        </div>
      </div>

      <div class="wizard-art" aria-hidden="true" />
    </section>

    <section class="panel">
      <div class="header-layout" style="margin-bottom: 1rem;">
        <div>
          <h2 style="margin: 0;">Choose a child profile</h2>
          <p class="helper-text" style="margin: 0.35rem 0 0;">Each child gets their own age-aware words, reward history, and tricky-word review.</p>
        </div>
        <button class="button" type="button" @click="openCreate">+ New child</button>
      </div>

      <p v-if="error" class="feedback error">{{ error }}</p>
      <p v-if="pending" class="feedback info">Saving to your household server...</p>

      <div class="profile-grid">
        <article v-for="profile in profiles || []" :key="profile.id" class="profile-card">
          <div class="profile-avatar">
            <img v-if="profile.avatarUri" :src="profile.avatarUri" :alt="`${profile.name} avatar`" />
            <span v-else>🪄</span>
          </div>

          <div>
            <h3 style="margin: 0;">{{ profile.name }}</h3>
            <p class="tiny muted" style="margin: 0.35rem 0 0;">Born {{ profile.birthdate }} • Rank {{ profile.rankKey }}</p>
          </div>

          <div class="stats-grid">
            <div class="stat-card">
              <span class="tiny muted">Points</span>
              <strong>{{ profile.pointsTotal }}</strong>
            </div>
            <div class="stat-card">
              <span class="tiny muted">Level</span>
              <strong>{{ profile.level }}</strong>
            </div>
          </div>

          <div class="button-row">
            <NuxtLink class="button-secondary" :to="`/profile/${profile.id}`">Open profile</NuxtLink>
            <button class="button-ghost" type="button" @click="openEdit(profile)">Edit</button>
            <button class="button-ghost" type="button" @click="deleteProfile(profile)">Delete</button>
          </div>
        </article>

        <div v-if="!(profiles || []).length" class="profile-card">
          <div class="profile-avatar">🌈</div>
          <h3 style="margin: 0;">No profiles yet</h3>
          <p class="helper-text" style="margin: 0;">Create the first wizard profile to start spelling.</p>
        </div>
      </div>
    </section>

    <ProfileFormModal
      :open="modalOpen"
      :profile="editingProfile"
      @close="modalOpen = false"
      @submit="submitProfile"
    />
  </main>
</template>
