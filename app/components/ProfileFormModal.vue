<script setup lang="ts">
import type { Profile } from '~~/shared/spelling'

const props = defineProps<{
  open: boolean
  profile?: Profile | null
}>()

const emit = defineEmits<{
  close: []
  submit: [payload: { name: string; birthdate: string }]
}>()

const name = ref('')
const birthdate = ref('')
const error = ref('')

watch(() => props.open, (value) => {
  if (value) {
    name.value = props.profile?.name ?? ''
    birthdate.value = props.profile?.birthdate ?? ''
    error.value = ''
  }
})

function submit() {
  if (!name.value.trim() || !birthdate.value) {
    error.value = 'Please add a child name and birthdate.'
    return
  }

  emit('submit', {
    name: name.value.trim(),
    birthdate: birthdate.value
  })
}
</script>

<template>
  <div v-if="open" class="modal-backdrop" @click.self="emit('close')">
    <div class="modal-card">
      <div class="header-layout" style="margin-bottom: 1rem;">
        <div>
          <div class="badge">{{ profile ? 'Edit wizard' : 'New wizard' }}</div>
          <h2 style="margin: 0.7rem 0 0;">{{ profile ? `Update ${profile.name}` : 'Create a child profile' }}</h2>
        </div>
        <button class="button-ghost" type="button" @click="emit('close')">Close</button>
      </div>

      <div class="form-grid">
        <label class="field">
          <span>Child name</span>
          <input v-model="name" type="text" maxlength="40" placeholder="Luna" />
        </label>

        <label class="field">
          <span>Birthdate</span>
          <input v-model="birthdate" type="date" />
        </label>

        <p v-if="error" class="feedback error">{{ error }}</p>

        <div class="button-row">
          <button class="button-secondary" type="button" @click="submit">{{ profile ? 'Save profile' : 'Create profile' }}</button>
          <button class="button-ghost" type="button" @click="emit('close')">Cancel</button>
        </div>
      </div>
    </div>
  </div>
</template>
