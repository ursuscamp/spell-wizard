# Clearer Word Enunciation - Technical Design

## Architecture Overview

This feature extends the existing spoken word playback path used during a Spelling Session. The design keeps one playback pipeline but adds two content modes for each prompt: standard prompt playback with tuned voice parameters and enunciation playback with intentionally spaced speech input from the Word Catalog.

The main architectural decision is to reuse the current text-to-speech or speech generation flow instead of introducing separate audio assets or a new playback subsystem. The Word Catalog becomes the source of truth for both the normal displayed word and its enunciation form, while the spelling interface adds a child-facing `enunciate` action that requests the alternate playback mode without affecting session state.

Data flow summary:

1. A Spelling Session loads the active word from the Word Catalog.
2. Standard playback uses the word's normal prompt content with updated voice parameters.
3. The spelling interface exposes an `enunciate` button for the active prompt.
4. When pressed, the client requests playback using the word's enunciation form.
5. The playback service renders the alternate speech without mutating scoring, attempts, or prompt progression.

## Interface Design

| Interface | Input | Output | Description |
|-----------|-------|--------|-------------|
| `getPlayableWord(wordId)` | `wordId: string` | `PlayableWord` | Returns the current word data needed for display and speech playback. |
| `playWordPrompt(request)` | `{ wordText: string, mode: "standard" | "enunciate", voiceConfig: VoiceConfig }` | `Promise<void>` | Plays the current word using the selected speech mode. |
| `buildVoiceConfig(mode)` | `mode: "standard" | "enunciate"` | `VoiceConfig` | Returns voice parameters for the requested playback mode. |
| `canEnunciate(word)` | `PlayableWord` | `boolean` | Determines whether the current word has enunciation data available. |
| `onEnunciatePress()` | none | `Promise<void>` | UI action handler that triggers enunciation playback for the active prompt. |

## Data Models

### PlayableWord

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | `string` | required | Unique word identifier. |
| `text` | `string` | required, non-empty | The canonical spelling answer and normal prompt text. |
| `enunciationText` | `string | null` | optional, same target word as `text` | Alternate speech input with intentional pauses or spacing for clearer playback. |
| `ageBand` | `string` | existing | Age suitability metadata from the Word Catalog. |
| `difficulty` | `string | number` | existing | Difficulty metadata already used for word selection. |

### VoiceConfig

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `rate` | `number` | supported by current playback provider | Speech rate used for synthesis. |
| `pitch` | `number` | supported by current playback provider | Pitch value for synthesis. |
| `volume` | `number` | supported by current playback provider | Playback loudness setting. |
| `voiceId` | `string | null` | optional | Selected voice identifier if the existing system supports named voices. |
| `pauseStrategy` | `"none" | "catalog-driven"` | required | Whether pauses come only from synthesis settings or from `enunciationText`. |

#### Schema Changes

- Add `enunciationText` to the Word Catalog schema or serialized word data.
- Backfill or generate `enunciationText` for all currently playable words before enabling the feature broadly.
- Keep existing `text` unchanged so spelling answers, scoring, and progress logic continue to rely on the canonical word.

## Key Components

### Word Catalog Loader

**Responsibilities:**
- Load canonical word data and enunciation data together
- Validate that `enunciationText` maps to the same answer word as `text`
- Expose a consistent word shape to the session layer

**Public API:**
- `getPlayableWord(wordId: string): PlayableWord | Promise<PlayableWord>`
- `validateWordEntry(word: PlayableWord): ValidationResult`

**Dependencies:**
- Word Catalog data source
- Existing word validation utilities

### Playback Service

**Responsibilities:**
- Build voice settings for standard and enunciation playback
- Route both playback modes through the current speech engine
- Fail safely when speech playback cannot start

**Public API:**
- `playWordPrompt(request: PlayWordPromptRequest): Promise<void>`
- `buildVoiceConfig(mode: "standard" | "enunciate"): VoiceConfig`

**Dependencies:**
- Existing text-to-speech or audio playback provider
- Session prompt state

### Spelling Session UI

**Responsibilities:**
- Render the `enunciate` button during an active prompt
- Prevent the control from changing attempt, score, or navigation state
- Surface a non-blocking fallback if enunciation is unavailable

**Public API:**
- `renderPromptControls(word: PlayableWord): UIElement`
- `onEnunciatePress(): Promise<void>`

**Dependencies:**
- Playback Service
- Current prompt UI state

## User Interaction

### Invocation Patterns

- Automatic standard playback when a prompt becomes active
- UI button press for alternate enunciation playback

### Flows

1. Child enters or continues a Spelling Session.
2. The active word prompt plays using updated standard voice settings.
3. If the child wants clearer pronunciation, they press `enunciate`.
4. The interface requests enunciation playback for the current word.
5. The playback service speaks `enunciationText` using enunciation mode settings.
6. The child continues typing without any reset to attempts, points, or session progress.

Error recovery flow:

1. Child presses `enunciate`.
2. The word lacks valid `enunciationText` or playback fails.
3. The app suppresses crashes and keeps the prompt interactive.
4. The child can continue spelling or use the standard replay behavior if available.

### Input/Output Examples

```ts
const word = {
  id: "word-elephant",
  text: "elephant",
  enunciationText: "el ... e ... phant"
}

await playWordPrompt({
  wordText: word.text,
  mode: "standard",
  voiceConfig: buildVoiceConfig("standard")
})

await playWordPrompt({
  wordText: word.enunciationText ?? word.text,
  mode: "enunciate",
  voiceConfig: buildVoiceConfig("enunciate")
})
```

## External Dependencies

| Dependency | Purpose | Version/Notes |
|------------|---------|---------------|
| Current speech engine | Generate spoken word prompts | Must support existing prompt playback settings |
| Current UI component layer | Render prompt controls and button state | Reuse established spelling interface patterns |
| Word Catalog storage | Persist and load `enunciationText` | Existing catalog format requires extension |

## Error Handling

| Error Code | Condition | Error Data | Recovery |
|------------|-----------|------------|----------|
| `ENUNCIATION_MISSING` | Active word has no `enunciationText` | `{ wordId }` | Keep session active; optionally fall back to standard replay or disable the button |
| `PLAYBACK_UNAVAILABLE` | Speech engine fails to start playback | `{ mode, wordId }` | Show non-blocking failure state and preserve current answer |
| `INVALID_ENUNCIATION_DATA` | Enunciation text fails validation | `{ wordId, reason }` | Reject bad catalog entry, log issue, keep session usable |
| `UNSUPPORTED_VOICE_CONFIG` | Selected voice parameters are not accepted by the platform/provider | `{ mode, config }` | Fall back to safe supported settings |

Logging should record playback failures and invalid catalog data without storing sensitive child data.

## Security

| Concern | Approach |
|---------|----------|
| Input validation | Validate `enunciationText` when loading catalog entries before use in playback |
| Access control | Reuse existing client access patterns for spelling session features |
| Safe defaults | Fall back to standard playback or disabled controls when enunciation data is unavailable |
| Data exposure | Do not log child answers or profile data as part of playback errors |

## Configuration

| Key | Type | Required | Default | Description |
|-----|------|----------|---------|-------------|
| `speech.standard.rate` | `number` | no | existing rate override | Slower speech rate for normal prompt playback |
| `speech.standard.pitch` | `number` | no | existing pitch override | Pitch tuning for clearer default prompts |
| `speech.enunciate.rate` | `number` | no | slower than standard | Speech rate for enunciation playback |
| `speech.enunciate.pitch` | `number` | no | provider default or tuned value | Pitch setting for enunciation playback |
| `speech.enunciate.fallbackToStandard` | `boolean` | no | `true` | Whether to replay standard prompt when enunciation data is missing |

## Component Interactions

```markdown
Spelling Session UI -> Playback Service -> Current speech engine
Spelling Session UI -> Word Catalog Loader -> Word Catalog storage

Prompt activation -> buildVoiceConfig("standard") -> playWordPrompt(...)
Enunciate button press -> canEnunciate(word) -> buildVoiceConfig("enunciate") -> playWordPrompt(...)
```

## Platform Considerations

| Platform | Consideration | Approach |
|----------|---------------|----------|
| Browser environments with speech synthesis | Voice parameter support may vary by device or browser | Use supported defaults and safe fallback values |
| Touch devices used by children | Control must be easy to tap without precision input | Keep the `enunciate` button prominent and large enough for touch |
| Lower-performance devices | Playback start latency may be more noticeable | Reuse the existing prompt pipeline and avoid heavy new processing on button press |

## Trade-offs

**Decision**: Store `enunciationText` in the Word Catalog instead of deriving it on every playback request.

**Reasoning:**
- Produces consistent, reviewable enunciation output per word
- Avoids fragile runtime rules for syllable or pause generation
- Makes content quality part of catalog maintenance

**Impact:**
- Requires catalog schema updates and content backfill
- Increases editorial effort when adding new words

**Decision**: Reuse the existing playback system for both standard and enunciation modes.

**Reasoning:**
- Minimizes implementation risk and duplicated audio logic
- Keeps failure handling in one place
- Preserves current cross-platform behavior patterns

**Impact:**
- Feature quality depends on the flexibility of the current speech provider
- Some voice tuning may need provider-specific fallback logic

## Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Enunciation text is inconsistent across the Word Catalog | Medium | High | Define a single enunciation formatting rule and validate entries during load or build time |
| Tuned voice settings sound worse on some devices | Medium | Medium | Test across supported playback environments and add provider-safe fallback values |
| The `enunciate` button is overused and slows session pacing | Low | Medium | Keep the action optional and ensure it does not block other session interactions |
| Missing enunciation data breaks prompt flow | Low | High | Keep fallback behavior non-blocking and validate coverage before rollout |
