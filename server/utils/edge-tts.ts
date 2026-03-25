import { Buffer } from 'buffer'
import { createHash } from 'crypto'
import { mkdir, readFile, stat, writeFile } from 'fs/promises'
import { resolve } from 'path'
import { Constants, EdgeTTS, type Voice } from '@andresaya/edge-tts'
import { DEFAULT_CACHE_DIRECTORY, resolveCacheDirectory } from '../../shared/runtime-paths.js'

type TtsMode = 'standard' | 'enunciate'

type VoiceOption = {
  id: string
  name: string
  lang: string
  default: boolean
}

type TtsRequest = {
  text: string
  mode: TtsMode
  voiceId?: string | null
  bypassCache?: boolean
}

type TtsResult = {
  audio: Buffer
  contentType: string
  cacheStatus: 'hit' | 'miss' | 'bypass'
  voiceId: string
}

type CacheMetadata = {
  key: string
  text: string
  mode: TtsMode
  voiceId: string
  outputFormat: string
  contentType: string
  createdAt: string
}

const MOCK_VOICES: Voice[] = [
  {
    Name: 'Microsoft Server Speech Text to Speech Voice (en-US, GuyNeural)',
    ShortName: 'en-US-GuyNeural',
    Gender: 'Male',
    Locale: 'en-US',
    FriendlyName: 'Guy Neural',
    LocalName: 'Guy'
  },
  {
    Name: 'Microsoft Server Speech Text to Speech Voice (en-US, AriaNeural)',
    ShortName: 'en-US-AriaNeural',
    Gender: 'Female',
    Locale: 'en-US',
    FriendlyName: 'Aria Neural',
    LocalName: 'Aria'
  },
  {
    Name: 'Microsoft Server Speech Text to Speech Voice (en-GB, RyanNeural)',
    ShortName: 'en-GB-RyanNeural',
    Gender: 'Male',
    Locale: 'en-GB',
    FriendlyName: 'Ryan Neural',
    LocalName: 'Ryan'
  }
]

const DEFAULT_OUTPUT_FORMAT = Constants.OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3

let cachedVoices: Voice[] | null = null
let cachedVoicesLoadedAt = 0
let pendingVoicesPromise: Promise<Voice[]> | null = null

function normalizeText(value: string) {
  return value.trim().replace(/\s+/g, ' ')
}

function isEnglishVoice(voice: Voice) {
  return voice.Locale.toLowerCase().startsWith('en')
}

function getVoiceLocalePriority(locale: string) {
  return locale.toLowerCase() === 'en-us' ? 0 : 1
}

function compareVoices(left: Voice, right: Voice) {
  const localePriorityDifference = getVoiceLocalePriority(left.Locale) - getVoiceLocalePriority(right.Locale)
  if (localePriorityDifference !== 0) {
    return localePriorityDifference
  }

  const localeComparison = left.Locale.localeCompare(right.Locale)
  if (localeComparison !== 0) {
    return localeComparison
  }

  const nameComparison = left.FriendlyName.localeCompare(right.FriendlyName)
  if (nameComparison !== 0) {
    return nameComparison
  }

  return left.ShortName.localeCompare(right.ShortName)
}

function formatVoiceOption(voice: Voice, defaultVoiceId: string): VoiceOption {
  return {
    id: voice.ShortName,
    name: voice.FriendlyName || voice.LocalName || voice.ShortName,
    lang: voice.Locale,
    default: voice.ShortName === defaultVoiceId
  }
}

function getTtsRuntimeConfig() {
  const runtimeConfig = useRuntimeConfig()
  const cacheDirectory = runtimeConfig.tts?.cacheDirectory ?? DEFAULT_CACHE_DIRECTORY

  return {
    cacheDirectory: resolveCacheDirectory(process.cwd(), cacheDirectory),
    defaultVoice: runtimeConfig.tts?.defaultVoice ?? 'en-US-AriaNeural',
    outputFormat: runtimeConfig.tts?.outputFormat ?? DEFAULT_OUTPUT_FORMAT,
    mockEnabled: Boolean(runtimeConfig.tts?.mockEnabled)
  }
}

function getContentType(outputFormat: string) {
  if (outputFormat.includes('webm')) {
    return 'audio/webm'
  }

  if (outputFormat.includes('ogg') || outputFormat.includes('opus')) {
    return 'audio/ogg'
  }

  if (outputFormat.includes('wav') || outputFormat.includes('riff') || outputFormat.includes('pcm')) {
    return 'audio/wav'
  }

  return 'audio/mpeg'
}

function formatRate(rate: number) {
  const percentage = Math.round((rate - 1) * 100)
  return `${percentage >= 0 ? '+' : ''}${percentage}%`
}

function formatPitch(pitch: number) {
  const hertz = Math.round((pitch - 1) * 20)
  if (hertz === 0) {
    return '+0Hz'
  }

  return `${hertz > 0 ? '+' : ''}${hertz}Hz`
}

function formatVolume(volume: number) {
  return `${Math.round(volume * 100)}%`
}

function buildSynthesisOptions(mode: TtsMode) {
  const appConfig = useAppConfig()
  const speechConfig = mode === 'enunciate'
    ? appConfig.spellingWizard.speech.enunciate
    : appConfig.spellingWizard.speech.standard
  const outputFormat = getTtsRuntimeConfig().outputFormat

  return {
    pitch: formatPitch(speechConfig.pitch),
    rate: formatRate(speechConfig.rate),
    volume: formatVolume(speechConfig.volume),
    outputFormat
  }
}

async function listEnglishVoicesFromProvider() {
  const { mockEnabled } = getTtsRuntimeConfig()

  if (mockEnabled) {
    return [...MOCK_VOICES]
  }

  const tts = new EdgeTTS()
  const voices = await tts.getVoicesByLanguage('en')
  return voices.filter(isEnglishVoice).sort(compareVoices)
}

async function getEnglishVoices() {
  const maxVoiceCacheAgeMs = 60 * 60 * 1000
  const cacheIsFresh = cachedVoices && Date.now() - cachedVoicesLoadedAt < maxVoiceCacheAgeMs

  if (cacheIsFresh) {
    return cachedVoices ?? []
  }

  if (!pendingVoicesPromise) {
    pendingVoicesPromise = listEnglishVoicesFromProvider()
      .then((voices) => {
        cachedVoices = voices
        cachedVoicesLoadedAt = Date.now()
        return voices
      })
      .finally(() => {
        pendingVoicesPromise = null
      })
  }

  return pendingVoicesPromise
}

async function resolveVoiceId(preferredVoiceId?: string | null) {
  const { defaultVoice } = getTtsRuntimeConfig()
  const voices = await getEnglishVoices()
  const selectedVoice = voices.find(voice => voice.ShortName === preferredVoiceId)
    ?? voices.find(voice => voice.ShortName === defaultVoice)
    ?? voices[0]

  if (!selectedVoice) {
    throw createError({
      statusCode: 503,
      statusMessage: 'No English Edge voices are available.'
    })
  }

  return selectedVoice.ShortName
}

function createCacheKey(text: string, mode: TtsMode, voiceId: string, outputFormat: string) {
  const synthesisOptions = buildSynthesisOptions(mode)

  return createHash('sha256')
    .update(JSON.stringify({
      text: normalizeText(text),
      mode,
      voiceId,
      outputFormat,
      synthesisOptions
    }))
    .digest('hex')
}

function getAudioExtension(outputFormat: string) {
  if (outputFormat.includes('webm')) {
    return 'webm'
  }

  if (outputFormat.includes('ogg') || outputFormat.includes('opus')) {
    return 'ogg'
  }

  if (outputFormat.includes('wav') || outputFormat.includes('riff') || outputFormat.includes('pcm')) {
    return 'wav'
  }

  return 'mp3'
}

async function readCachedAudio(audioPath: string) {
  try {
    await stat(audioPath)
    return await readFile(audioPath)
  }
  catch {
    return null
  }
}

async function writeCachedAudio(audioPath: string, metadataPath: string, metadata: CacheMetadata, audio: Buffer) {
  await mkdir(getTtsRuntimeConfig().cacheDirectory, { recursive: true })
  await writeFile(audioPath, audio)
  await writeFile(metadataPath, JSON.stringify(metadata, null, 2))
}

function createMockAudio(text: string, mode: TtsMode, voiceId: string) {
  return Buffer.from(`mock-tts:${mode}:${voiceId}:${normalizeText(text)}`)
}

export async function getTtsVoiceOptions() {
  const { defaultVoice } = getTtsRuntimeConfig()
  const voices = await getEnglishVoices()
  return voices.map(voice => formatVoiceOption(voice, defaultVoice))
}

export async function synthesizeSpeech(request: TtsRequest): Promise<TtsResult> {
  const { outputFormat, cacheDirectory, mockEnabled } = getTtsRuntimeConfig()
  const text = normalizeText(request.text)

  if (!text) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Text is required for TTS playback.'
    })
  }

  const voiceId = await resolveVoiceId(request.voiceId)
  const contentType = getContentType(outputFormat)
  const cacheKey = createCacheKey(text, request.mode, voiceId, outputFormat)
  const extension = getAudioExtension(outputFormat)
  const audioPath = resolve(cacheDirectory, `${cacheKey}.${extension}`)
  const metadataPath = resolve(cacheDirectory, `${cacheKey}.json`)

  if (!request.bypassCache) {
    const cachedAudio = await readCachedAudio(audioPath)
    if (cachedAudio) {
      return {
        audio: cachedAudio,
        contentType,
        cacheStatus: 'hit',
        voiceId
      }
    }
  }

  const audio = mockEnabled
    ? createMockAudio(text, request.mode, voiceId)
    : await generateEdgeAudio(text, request.mode, voiceId)

  if (!request.bypassCache) {
    await writeCachedAudio(audioPath, metadataPath, {
      key: cacheKey,
      text,
      mode: request.mode,
      voiceId,
      outputFormat,
      contentType,
      createdAt: new Date().toISOString()
    }, audio)
  }

  return {
    audio,
    contentType,
    cacheStatus: request.bypassCache ? 'bypass' : 'miss',
    voiceId
  }
}

async function generateEdgeAudio(text: string, mode: TtsMode, voiceId: string) {
  const tts = new EdgeTTS()
  await tts.synthesize(text, voiceId, buildSynthesisOptions(mode))
  return tts.toBuffer()
}
