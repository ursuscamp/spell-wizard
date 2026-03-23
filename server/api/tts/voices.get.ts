import { getTtsVoiceOptions } from '../../utils/edge-tts'

export default defineEventHandler(async () => {
  return getTtsVoiceOptions()
})
