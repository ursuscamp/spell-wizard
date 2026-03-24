import { execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { tmpdir } from 'node:os'

const SAMPLE_RATE = 44_100
const BPM = 88
const BAR_COUNT = 8
const BEATS_PER_BAR = 4
const LOOP_BEATS = BAR_COUNT * BEATS_PER_BAR
const OUTPUT_MP3 = resolve('public/audio/menu-loop.mp3')
const FFMPEG_PATH = process.env.FFMPEG_PATH || 'ffmpeg'

const PAD_CHORDS = [
  { beat: 0, notes: ['g3', 'b3', 'd4'] },
  { beat: 4, notes: ['d3', 'fs3', 'a3'] },
  { beat: 8, notes: ['e3', 'g3', 'b3'] },
  { beat: 12, notes: ['c3', 'e3', 'g3'] },
  { beat: 16, notes: ['g3', 'b3', 'd4'] },
  { beat: 20, notes: ['d3', 'fs3', 'a3'] },
  { beat: 24, notes: ['c3', 'e3', 'g3'] },
  { beat: 28, notes: ['d3', 'fs3', 'a3'] },
]

const BELL_NOTES = [
  { beat: 0.5, note: 'd5', duration: 0.6, pan: -0.16 },
  { beat: 1.5, note: 'g5', duration: 0.55, pan: 0.16 },
  { beat: 2.25, note: 'a5', duration: 0.45, pan: -0.16 },
  { beat: 3, note: 'g5', duration: 0.65, pan: 0.16 },
  { beat: 4.5, note: 'a5', duration: 0.55, pan: -0.16 },
  { beat: 5.5, note: 'b5', duration: 0.5, pan: 0.16 },
  { beat: 6.25, note: 'a5', duration: 0.45, pan: -0.16 },
  { beat: 7, note: 'fs5', duration: 0.7, pan: 0.16 },
  { beat: 8.5, note: 'b4', duration: 0.55, pan: -0.16 },
  { beat: 9.5, note: 'd5', duration: 0.5, pan: 0.16 },
  { beat: 10.25, note: 'g5', duration: 0.5, pan: -0.16 },
  { beat: 11, note: 'b5', duration: 0.75, pan: 0.16 },
  { beat: 12.5, note: 'g5', duration: 0.55, pan: -0.16 },
  { beat: 13.5, note: 'e5', duration: 0.5, pan: 0.16 },
  { beat: 14.25, note: 'g5', duration: 0.55, pan: -0.16 },
  { beat: 15, note: 'e5', duration: 0.65, pan: 0.16 },
  { beat: 16.5, note: 'd5', duration: 0.6, pan: -0.16 },
  { beat: 17.5, note: 'g5', duration: 0.55, pan: 0.16 },
  { beat: 18.25, note: 'a5', duration: 0.45, pan: -0.16 },
  { beat: 19, note: 'g5', duration: 0.65, pan: 0.16 },
  { beat: 20.5, note: 'a5', duration: 0.55, pan: -0.16 },
  { beat: 21.5, note: 'b5', duration: 0.5, pan: 0.16 },
  { beat: 22.25, note: 'a5', duration: 0.45, pan: -0.16 },
  { beat: 23, note: 'fs5', duration: 0.7, pan: 0.16 },
  { beat: 24.5, note: 'g5', duration: 0.55, pan: -0.16 },
  { beat: 25.5, note: 'e5', duration: 0.5, pan: 0.16 },
  { beat: 26.25, note: 'g5', duration: 0.55, pan: -0.16 },
  { beat: 27, note: 'e5', duration: 0.7, pan: 0.16 },
  { beat: 28.5, note: 'a4', duration: 0.5, pan: -0.16 },
  { beat: 29.25, note: 'd5', duration: 0.45, pan: 0.16 },
  { beat: 30, note: 'fs5', duration: 0.55, pan: -0.16 },
  { beat: 31, note: 'a5', duration: 0.75, pan: 0.16 },
]

const PLUCKS = [
  { beat: 0, note: 'g4', duration: 0.85, pan: -0.24, amplitude: 0.06 },
  { beat: 1.5, note: 'd5', duration: 0.85, pan: 0.24, amplitude: 0.06 },
  { beat: 4, note: 'd4', duration: 0.85, pan: -0.24, amplitude: 0.06 },
  { beat: 5.5, note: 'a4', duration: 0.85, pan: 0.24, amplitude: 0.06 },
  { beat: 8, note: 'e4', duration: 0.85, pan: -0.24, amplitude: 0.06 },
  { beat: 9.5, note: 'b4', duration: 0.85, pan: 0.24, amplitude: 0.06 },
  { beat: 12, note: 'c4', duration: 0.85, pan: -0.24, amplitude: 0.06 },
  { beat: 13.5, note: 'g4', duration: 0.85, pan: 0.24, amplitude: 0.06 },
  { beat: 16, note: 'g4', duration: 0.85, pan: -0.24, amplitude: 0.06 },
  { beat: 17.5, note: 'd5', duration: 0.85, pan: 0.24, amplitude: 0.06 },
  { beat: 20, note: 'd4', duration: 0.85, pan: -0.24, amplitude: 0.06 },
  { beat: 21.5, note: 'a4', duration: 0.85, pan: 0.24, amplitude: 0.06 },
  { beat: 24, note: 'c4', duration: 0.85, pan: -0.24, amplitude: 0.06 },
  { beat: 25.5, note: 'g4', duration: 0.85, pan: 0.24, amplitude: 0.06 },
  { beat: 28, note: 'd4', duration: 0.85, pan: -0.24, amplitude: 0.06 },
  { beat: 29.5, note: 'a4', duration: 0.85, pan: 0.24, amplitude: 0.06 },
  ...Array.from({ length: LOOP_BEATS }, (_, index) => ({
    beat: index,
    note: index % 4 === 0 ? 'g2' : 'd3',
    duration: 0.32,
    pan: index % 2 === 0 ? -0.05 : 0.05,
    amplitude: 0.025,
  })),
]

function noteToFrequency(note) {
  const match = /^([a-g])([sb]?)(-?\d)$/.exec(note.toLowerCase())
  if (!match) {
    throw new Error(`Invalid note: ${note}`)
  }

  const [, base, accidental, octaveRaw] = match
  const octave = Number(octaveRaw)
  const offsets = { c: -9, d: -7, e: -5, f: -4, g: -2, a: 0, b: 2 }
  let semitone = offsets[base] + ((octave - 4) * 12)

  if (accidental === 's') {
    semitone += 1
  }
  else if (accidental === 'b') {
    semitone -= 1
  }

  return 440 * (2 ** (semitone / 12))
}

const totalSamples = Math.floor(SAMPLE_RATE * ((60 / BPM) * LOOP_BEATS))
const left = new Float32Array(totalSamples)
const right = new Float32Array(totalSamples)

function beatToSample(beat) {
  return Math.floor((beat * 60 / BPM) * SAMPLE_RATE)
}

function addCircularStereo(startSample, sampleCount, writer) {
  for (let index = 0; index < sampleCount; index += 1) {
    const destinationIndex = (startSample + index) % totalSamples
    const [sampleLeft, sampleRight] = writer(index)
    left[destinationIndex] += sampleLeft
    right[destinationIndex] += sampleRight
  }
}

function addPadChord(startBeat, chordNotes) {
  const startSample = beatToSample(startBeat)
  const sampleCount = beatToSample(4)
  const frequencies = chordNotes.map(noteToFrequency)

  addCircularStereo(startSample, sampleCount, (index) => {
    const time = index / SAMPLE_RATE
    const progress = index / sampleCount
    const attack = Math.min(progress / 0.16, 1)
    const release = Math.min((1 - progress) / 0.22, 1)
    const envelope = Math.max(0, Math.min(attack, release))

    let sampleLeft = 0
    let sampleRight = 0
    frequencies.forEach((frequency, noteIndex) => {
      const detune = noteIndex === 0 ? -0.25 : noteIndex === 2 ? 0.18 : 0
      const phase = time * (frequency + detune)
      const base = Math.sin(2 * Math.PI * phase)
      const shimmer = Math.sin(2 * Math.PI * phase * 2) * 0.18
      const air = Math.sin(2 * Math.PI * phase * 0.5) * 0.14
      const amplitude = (noteIndex === 0 ? 0.05 : 0.04) * envelope
      const pan = noteIndex === 0 ? -0.35 : noteIndex === 1 ? 0 : 0.32
      const value = (base * 0.68 + shimmer + air) * amplitude
      sampleLeft += value * (1 - Math.max(0, pan))
      sampleRight += value * (1 + Math.min(0, pan))
    })

    return [sampleLeft, sampleRight]
  })
}

function addBellNote(startBeat, note, durationBeats, pan) {
  const startSample = beatToSample(startBeat)
  const sampleCount = Math.max(1, beatToSample(durationBeats))
  const frequency = noteToFrequency(note)

  addCircularStereo(startSample, sampleCount, (index) => {
    const time = index / SAMPLE_RATE
    const progress = index / sampleCount
    const envelope = Math.exp(-5.4 * progress)
    const fundamental = Math.sin(2 * Math.PI * frequency * time)
    const overtone2 = Math.sin(2 * Math.PI * frequency * 2.01 * time) * 0.38
    const overtone3 = Math.sin(2 * Math.PI * frequency * 3.98 * time) * 0.16
    const sparkle = Math.sin(2 * Math.PI * frequency * 6.05 * time) * 0.08
    const value = (fundamental + overtone2 + overtone3 + sparkle) * envelope * 0.11
    return [value * (1 - pan), value * (1 + pan)]
  })
}

function addPluck(startBeat, note, durationBeats, pan, amplitude = 0.08) {
  const startSample = beatToSample(startBeat)
  const sampleCount = Math.max(1, beatToSample(durationBeats))
  const frequency = noteToFrequency(note)

  addCircularStereo(startSample, sampleCount, (index) => {
    const time = index / SAMPLE_RATE
    const progress = index / sampleCount
    const envelope = Math.exp(-7.5 * progress)
    const body = Math.sin(2 * Math.PI * frequency * time) * 0.76
    const brightness = Math.sin(2 * Math.PI * frequency * 2 * time) * 0.22
    const knock = Math.sin(2 * Math.PI * frequency * 3.1 * time) * 0.08
    const value = (body + brightness + knock) * envelope * amplitude
    return [value * (1 - pan), value * (1 + pan)]
  })
}

PAD_CHORDS.forEach((entry) => {
  addPadChord(entry.beat, entry.notes)
})

BELL_NOTES.forEach((entry) => {
  addBellNote(entry.beat, entry.note, entry.duration, entry.pan)
})

PLUCKS.forEach((entry) => {
  addPluck(entry.beat, entry.note, entry.duration, entry.pan, entry.amplitude)
})

let peak = 0
for (let index = 0; index < totalSamples; index += 1) {
  peak = Math.max(peak, Math.abs(left[index]), Math.abs(right[index]))
}

const normalization = peak > 0 ? 0.84 / peak : 1
for (let index = 0; index < totalSamples; index += 1) {
  left[index] = Math.max(-1, Math.min(1, left[index] * normalization))
  right[index] = Math.max(-1, Math.min(1, right[index] * normalization))
}

function writeWavFile(filePath) {
  const byteRate = SAMPLE_RATE * 4
  const blockAlign = 4
  const dataSize = totalSamples * blockAlign
  const buffer = Buffer.alloc(44 + dataSize)

  buffer.write('RIFF', 0)
  buffer.writeUInt32LE(36 + dataSize, 4)
  buffer.write('WAVE', 8)
  buffer.write('fmt ', 12)
  buffer.writeUInt32LE(16, 16)
  buffer.writeUInt16LE(1, 20)
  buffer.writeUInt16LE(2, 22)
  buffer.writeUInt32LE(SAMPLE_RATE, 24)
  buffer.writeUInt32LE(byteRate, 28)
  buffer.writeUInt16LE(blockAlign, 32)
  buffer.writeUInt16LE(16, 34)
  buffer.write('data', 36)
  buffer.writeUInt32LE(dataSize, 40)

  let offset = 44
  for (let index = 0; index < totalSamples; index += 1) {
    buffer.writeInt16LE(Math.round(left[index] * 32767), offset)
    buffer.writeInt16LE(Math.round(right[index] * 32767), offset + 2)
    offset += 4
  }

  writeFileSync(filePath, buffer)
}

const temporaryDirectory = mkdtempSync(join(tmpdir(), 'spell-wizard-menu-music-'))
const wavPath = join(temporaryDirectory, 'menu-loop.wav')

try {
  writeWavFile(wavPath)
  mkdirSync(dirname(OUTPUT_MP3), { recursive: true })

  execFileSync(FFMPEG_PATH, [
    '-y',
    '-i', wavPath,
    '-codec:a', 'libmp3lame',
    '-q:a', '2',
    OUTPUT_MP3,
  ], { stdio: 'pipe' })

  process.stdout.write(`Rendered cozy menu loop to ${OUTPUT_MP3}\n`)
}
catch (error) {
  const message = error instanceof Error ? error.message : String(error)
  if (message.includes('spawn ffmpeg ENOENT')) {
    process.stderr.write('ffmpeg is required to render menu music. Install it with Homebrew: brew install ffmpeg\n')
  }
  else {
    process.stderr.write(`${message}\n`)
  }
  process.exitCode = 1
}
finally {
  rmSync(temporaryDirectory, { recursive: true, force: true })
}
