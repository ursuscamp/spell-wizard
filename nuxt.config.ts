// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  css: ['~/assets/css/main.css'],
  app: {
    head: {
      title: 'Spell Wizard',
      meta: [
        { name: 'application-name', content: 'Spell Wizard' },
        { name: 'apple-mobile-web-app-title', content: 'Spell Wizard' },
        { name: 'theme-color', content: '#eefafc' }
      ],
      link: [
        { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon-32x32.png' },
        { rel: 'icon', type: 'image/png', sizes: '16x16', href: '/favicon-16x16.png' },
        { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' },
        { rel: 'manifest', href: '/site.webmanifest' }
      ]
    }
  },
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
