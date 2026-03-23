import { synthesizeSpeech } from '../utils/edge-tts'

type TtsMode = 'standard' | 'enunciate'

type TtsBody = {
  text?: string
  mode?: TtsMode
  voiceId?: string | null
  bypassCache?: boolean
}

export default defineEventHandler(async (event) => {
  const body = await readBody<TtsBody>(event)
  const text = body.text?.trim()
  const mode = body.mode === 'enunciate' ? 'enunciate' : 'standard'

  if (!text) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Text is required for TTS playback.'
    })
  }

  const result = await synthesizeSpeech({
    text,
    mode,
    voiceId: body.voiceId,
    bypassCache: body.bypassCache === true
  })

  setHeader(event, 'content-type', result.contentType)
  setHeader(event, 'cache-control', 'no-store')
  setHeader(event, 'x-spell-wizard-tts-cache', result.cacheStatus)
  setHeader(event, 'x-spell-wizard-tts-voice', result.voiceId)

  return result.audio
})
