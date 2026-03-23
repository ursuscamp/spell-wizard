// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  css: ['~/assets/css/main.css'],
  runtimeConfig: {
    storage: {
      databasePath: '.data/spelling-wizard.sqlite',
      debugLogging: false
    },
    tts: {
      cacheDirectory: '.data/tts-cache',
      defaultVoice: 'en-US-AvaNeural',
      outputFormat: 'audio-24khz-96kbitrate-mono-mp3',
      mockEnabled: false
    }
  }
})
