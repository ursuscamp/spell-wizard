# Spelling Wizard - Technical Design

## Architecture Overview

Spelling Wizard will be implemented as a Nuxt.js application with a household-server architecture aimed at single-household use on desktop and tablet browsers. The app is composed of five primary areas: profile management, vocabulary and adaptive selection, spelling session orchestration, progression and rewards, presentation assets including audio and art, and a server-backed persistence layer.

At a high level, the user selects a child profile, the app loads that profile from the household server, derives an age-aware target band from the stored birthdate, and the session engine requests the next word from the adaptive selector. The prompt is spoken aloud, the child submits up to three scored attempts, and completed prompt results are persisted to the server-backed profile history so progression, mastery, and rewards survive refreshes and remain shared across household devices.

Key architectural decisions:
- Use Nuxt.js with Vue 3 and TypeScript for the application shell, routing, and state composition.
- Use Nuxt server routes plus a server-side database hosted on the home server so family data is shared across devices without requiring third-party cloud services.
- Represent vocabulary as structured content with age-band metadata rather than hard-coded lists in components.
- Isolate the adaptive selection and scoring logic in pure composables/services so it can be tested independently from the UI.

## Interface Design

| Interface | Input | Output | Description |
|-----------|-------|--------|-------------|
| `createProfile(input)` | `{ name: string, birthdate: string, avatarUri?: string }` | `ChildProfile` | Creates a child profile with initialized progress and empty history on the household server. |
| `updateProfile(profileId, input)` | `{ name?: string, birthdate?: string, avatarUri?: string }` | `ChildProfile` | Updates editable child profile fields on the household server. |
| `deleteProfile(profileId)` | `profileId: string` | `{ success: boolean }` | Deletes a child profile and associated server-side history. |
| `listProfiles()` | `void` | `ChildProfile[]` | Returns available child profiles from the household server for the profile picker. |
| `startSession(profileId)` | `profileId: string` | `SpellingSessionState` | Creates a new active session for the selected child profile. |
| `getNextPrompt(sessionId)` | `sessionId: string` | `WordPrompt` | Returns the next word selected for the active session. |
| `submitAttempt(sessionId, payload)` | `{ promptId: string, answer: string }` | `AttemptResult` | Evaluates one spelling attempt, updates session state, and returns feedback. |
| `replayPrompt(promptId)` | `promptId: string` | `{ success: boolean }` | Replays spoken audio for the current word prompt. |
| `endSession(sessionId)` | `sessionId: string` | `SessionSummary` | Finalizes the active session and returns totals and rewards earned. |
| `getDashboard(profileId)` | `profileId: string` | `DashboardViewModel` | Returns child-facing summary data for the selected profile. |
| `getProfileHistory(profileId)` | `profileId: string` | `ProfileHistoryViewModel` | Returns prior sessions, rewards, and recent weak words for the profile. |
| `getRankLadder()` | `void` | `RankDefinition[]` | Returns the fixed level-to-rank ladder that ends in `Wizard`. |

## Data Models

### ChildProfile

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | `string` | PK, required | Unique profile identifier. |
| `name` | `string` | required, 1-40 chars | Child display name. |
| `birthdate` | `string` | required, ISO date | Used to derive the child's target age band. |
| `avatarUri` | `string` | optional | Selected or uploaded profile picture. |
| `pointsTotal` | `number` | required, >= 0 | Lifetime points earned. |
| `level` | `number` | required, >= 0 | Current level derived from points. |
| `rankKey` | `string` | required | Current rank identifier. |
| `createdAt` | `string` | required, ISO datetime | Profile creation time. |
| `updatedAt` | `string` | required, ISO datetime | Last profile update time. |

### WordCatalogEntry

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | `string` | PK, required | Unique word identifier. |
| `word` | `string` | required | The displayed and validated spelling target. |
| `normalizedWord` | `string` | required | Lowercased normalized comparison value. |
| `ageBandMin` | `number` | required | Minimum recommended age. |
| `ageBandMax` | `number` | required | Maximum recommended age. |
| `difficulty` | `number` | required, 1-5 | Relative difficulty within the catalog. |
| `tags` | `string[]` | optional | Theme, phonics, or pattern metadata. |

### WordProgress

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `profileId` | `string` | PK part, required | Owning child profile. |
| `wordId` | `string` | PK part, required | Tracked word. |
| `masteryScore` | `number` | required | Current mastery signal for this child and word. |
| `lastSeenAt` | `string` | optional, ISO datetime | Most recent prompt time. |
| `timesPrompted` | `number` | required, >= 0 | Total prompt count. |
| `timesCorrect` | `number` | required, >= 0 | Total correct count. |
| `averageAttemptIndex` | `number` | required | Running average attempt needed for correctness. |
| `adaptiveWeight` | `number` | required | Derived selection weight cached for prompt generation. |

### SpellingSession

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | `string` | PK, required | Unique session identifier. |
| `profileId` | `string` | required | Child profile owning the session. |
| `startedAt` | `string` | required, ISO datetime | Session start time. |
| `endedAt` | `string` | optional, ISO datetime | Session end time. |
| `wordsCompleted` | `number` | required, >= 0 | Number of prompts completed. |
| `pointsEarned` | `number` | required, >= 0 | Session point total. |
| `rewardEvents` | `RewardEvent[]` | required | Rewards triggered during the session. |

### PromptAttempt

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | `string` | PK, required | Unique attempt identifier. |
| `sessionId` | `string` | required | Parent session reference. |
| `wordId` | `string` | required | Prompted word reference. |
| `attemptIndex` | `number` | required, 1-3 | Attempt number for the prompt. |
| `submittedAnswer` | `string` | required | Raw child input. |
| `isCorrect` | `boolean` | required | Whether the answer matches the target spelling. |
| `pointsAwarded` | `number` | required, 0-3 | Points awarded on this attempt. |
| `createdAt` | `string` | required, ISO datetime | Attempt timestamp. |

### RewardEvent

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | `string` | PK, required | Unique reward event identifier. |
| `profileId` | `string` | required | Child profile earning the reward. |
| `type` | `string` | enum: `level-up`, `rank-up` | Reward category. |
| `levelReached` | `number` | required | Level associated with the reward. |
| `rankKey` | `string` | optional | Rank awarded, if applicable. |
| `robuxAwarded` | `number` | required | Motivational payout amount. |
| `createdAt` | `string` | required, ISO datetime | Reward timestamp. |

#### Schema Changes

This is a new project, so there are no existing schema migrations to preserve in the initial design.

## Key Components

### `ProfileStore`

**Responsibilities:**
- Manage child profile CRUD operations.
- Load and persist profiles and related metadata through the household API.
- Expose derived profile summaries for the profile picker and dashboard.

**Public API:**
- `createProfile(input: CreateProfileInput): ChildProfile`
- `updateProfile(id: string, input: UpdateProfileInput): ChildProfile`
- `deleteProfile(id: string): boolean`
- `listProfiles(): ChildProfile[]`

**Dependencies:**
- `ProfileApi`

### `WordCatalogStore`

**Responsibilities:**
- Load and validate the structured vocabulary catalog.
- Expose words by age band, difficulty, and tags.

**Public API:**
- `listWords(): WordCatalogEntry[]`
- `getWordById(id: string): WordCatalogEntry | null`
- `getEligibleWords(targetAge: number): WordCatalogEntry[]`

**Dependencies:**
- Static JSON/content files bundled with the app

### `AdaptiveSelectionService`

**Responsibilities:**
- Score words for a specific child profile.
- Favor age-appropriate and not-yet-mastered words.
- Prevent monotonous prompt repetition.

**Public API:**
- `selectNextWord(input: SelectionContext): WordCatalogEntry`
- `updateWordProgress(input: WordProgressUpdate): WordProgress`

**Algorithm Example (pseudo-code):**
```text
for each eligible word:
  agePenalty = distance from target age band
  masteryPenalty = masteryScore * masteredWeight
  struggleBoost = recentMisses * missWeight + delayedSuccesses * retryWeight
  recencyPenalty = repeatedRecently ? repeatPenalty : 0
  finalWeight = baseWeight - agePenalty - masteryPenalty + struggleBoost - recencyPenalty

pick word using weighted random selection with a minimum floor weight
```

**Dependencies:**
- `WordCatalogStore`
- `ProgressStore`

### `SessionEngine`

**Responsibilities:**
- Start and end spelling sessions.
- Track active prompt state and up to three scored attempts per word.
- Require a correction entry after three failed attempts before advancing.
- Apply scoring, progression, and reward triggers.

**Public API:**
- `startSession(profileId: string): SpellingSessionState`
- `submitAttempt(input: SubmitAttemptInput): AttemptResult`
- `submitCorrection(input: SubmitCorrectionInput): AttemptResult`
- `advancePrompt(sessionId: string): WordPrompt`
- `endSession(sessionId: string): SessionSummary`

**Dependencies:**
- `AdaptiveSelectionService`
- `ScoringService`
- `RewardService`
- `SessionApi`

### `Server Persistence Layer`

**Responsibilities:**
- Store child profiles, word progress, sessions, attempts, and rewards in a server database.
- Provide Nuxt server API endpoints for profile management, session updates, and history retrieval.
- Ensure multiple household devices read and write the same family data safely.

**Public API:**
- `GET /api/profiles`
- `POST /api/profiles`
- `PATCH /api/profiles/:id`
- `DELETE /api/profiles/:id`
- `GET /api/profiles/:id/dashboard`
- `GET /api/profiles/:id/history`
- `POST /api/sessions`
- `POST /api/sessions/:id/attempts`
- `POST /api/sessions/:id/correction`
- `POST /api/sessions/:id/end`

**Dependencies:**
- Server database
- Nuxt server routes

### `PromptAudioService`

**Responsibilities:**
- Speak prompted words aloud.
- Replay prompt audio on demand.
- Coordinate with audio settings for mute or reduced sound.

**Public API:**
- `speakWord(word: string): Promise<void>`
- `replayCurrent(): Promise<void>`
- `setSoundEnabled(enabled: boolean): void`

**Dependencies:**
- Browser speech synthesis or equivalent local playback provider

### `RewardService`

**Responsibilities:**
- Translate point milestones into level and rank progression.
- Emit reward events for standard and milestone payouts.
- Resolve rank names from a fixed built-in ladder.

**Public API:**
- `applyProgression(profile: ChildProfile, priorPoints: number, nextPoints: number): RewardEvent[]`
- `getRankForLevel(level: number): RankDefinition`
- `getRankLadder(): RankDefinition[]`

**Dependencies:**
- Rank configuration data

## User Interaction

### Invocation Patterns

- Direct UI interaction in a browser.
- Keyboard entry for spelling answers.
- Pointer or touch interaction for profile management, replay, and navigation.
- Local audio playback for spoken prompts and celebratory sounds.

### Flows

#### Profile creation flow
1. Parent opens the profile picker.
2. Parent creates a child profile with name, birthdate, and optional profile picture.
3. The app validates required fields and persists the new profile to the household server.
4. The profile appears on the picker with derived age targeting ready for use.

#### Spelling session flow
1. Child selects their profile from the picker.
2. Dashboard loads with points, level, rank, and a start action.
3. Child starts a session; the session engine requests the first adaptive prompt.
4. Prompt audio speaks the word and the child types a spelling attempt.
5. The engine evaluates correctness, awards points if applicable, and either advances, retries, or reveals the correct spelling after the third failed attempt.
6. If the child misses all three scored attempts, the session enters a correction state that requires the child to type the correct spelling before the app advances.
7. Progress, mastery, rewards, and session history persist immediately to the household server after each completed prompt.
8. The child continues for as many words as desired and can end the session manually.

#### History review flow
1. Parent or child opens the profile history area.
2. The app lists recent sessions, points earned, rewards unlocked, and words needing more practice.
3. The app highlights recently difficult words using stored attempt outcomes.

### Input/Output Examples

```markdown
# Profile creation
Input: name = "Luna", birthdate = "2017-04-12", avatar = dragon.png
Output: profile card with Luna's avatar, level 0, rank Spark

# Session attempt
Prompt audio: "Spell 'because'"
Attempt 1 input: "becuse" -> incorrect, 2 chances remaining
Attempt 2 input: "because" -> correct, 2 points awarded

# Forced correction after three misses
Prompt audio: "Spell 'friend'"
Attempt 1 input: "freind" -> incorrect
Attempt 2 input: "frend" -> incorrect
Attempt 3 input: "fiend" -> incorrect, correct spelling revealed as "friend"
Correction input: "friend" -> accepted, 0 points, next prompt begins

# Rank milestone
Previous total: 298 points
Prompt result: +2 points
Output: level 3 reached, rank advanced, 300 Robux reward event recorded
```

## External Dependencies

| Dependency | Purpose | Version/Notes |
|------------|---------|---------------|
| `nuxt` | Application framework | Current Nuxt 3 stable release |
| `vue` | UI runtime | Bundled with Nuxt |
| `typescript` | Type-safe domain logic | Current stable release |
| Server database | Shared household persistence | SQLite or PostgreSQL, depending on home server setup |
| Browser Speech Synthesis API | Spoken word playback | Fallback UX required if unavailable |
| Browser file/image APIs | Profile picture selection | Constrain to safe client-side image handling |

## Error Handling

| Error Code | Condition | Error Data | Recovery |
|------------|-----------|------------|----------|
| `PROFILE_VALIDATION_ERROR` | Missing or invalid profile fields | `{ field, message }` | Keep form open and show friendly inline validation |
| `PROFILE_NOT_FOUND` | Selected profile no longer exists | `{ profileId }` | Return to profile picker and refresh state |
| `WORD_CATALOG_UNAVAILABLE` | Catalog failed to load or validate | `{ reason }` | Block session start and show retry/help state |
| `PROMPT_AUDIO_UNAVAILABLE` | Speech playback fails or is unsupported | `{ reason }` | Show readable prompt text and allow continued spelling |
| `SESSION_NOT_FOUND` | Attempt submitted for inactive session | `{ sessionId }` | Return to dashboard and prompt session restart |
| `PERSISTENCE_WRITE_FAILED` | Server-side save failed | `{ scope }` | Surface non-destructive error and prompt retry |
| `SERVER_UNAVAILABLE` | Household server cannot be reached | `{ endpoint }` | Show offline/retry state and prevent unsafe session continuation |
| `IMAGE_UPLOAD_INVALID` | Unsupported or unreadable avatar file | `{ mimeType, size }` | Reject image and request a supported file |

Logging requirements for MVP are limited to local console diagnostics in development; production UI should avoid exposing raw technical errors to children.

## Security

| Concern | Approach |
|---------|----------|
| Data scope | Keep child data on the household server and avoid third-party cloud storage by default. |
| Input sanitization | Validate profile names, image metadata, and spelling inputs before persistence or rendering. |
| File safety | Restrict profile pictures to supported image types and size limits; avoid executing uploaded content. |
| Privacy | Do not collect unnecessary personal data beyond child name, birthdate, and optional profile picture. |
| Safe rendering | Escape user-provided text and avoid injecting raw HTML into the UI. |

## Configuration

| Key | Type | Required | Default | Description |
|-----|------|----------|---------|-------------|
| `app.rankLadder` | `RankDefinition[]` | yes | bundled data | Fixed ordered rank ladder ending with `Wizard`. |
| `app.levelPointThreshold` | `number` | yes | `100` | Points needed per level. |
| `app.levelRewardRobux` | `number` | yes | `100` | Standard level-up reward amount. |
| `app.rankRewardRobux` | `number` | yes | `300` | Reward amount for every third-level rank milestone. |
| `app.maxAttemptsPerWord` | `number` | yes | `3` | Attempt limit per prompt. |
| `app.soundEnabledDefault` | `boolean` | no | `true` | Default state for playful sound effects. |
| `app.motionEnabledDefault` | `boolean` | no | `true` | Default state for celebratory motion. |
| `app.wordCatalogPath` | `string` | yes | bundled asset path | Location of the structured vocabulary dataset. |
| `server.databaseUrl` | `string` | yes | environment-specific | Connection string for the household server database. |
| `server.mediaPath` | `string` | yes | environment-specific | Storage location for uploaded profile pictures on the household server. |

## Component Interactions

```markdown
# Profile lifecycle
Profile Picker Page -> ProfileStore -> ProfileApi -> Server Persistence Layer

# Session lifecycle
Dashboard Page -> SessionEngine -> AdaptiveSelectionService -> WordCatalogStore
Dashboard Page -> SessionEngine -> RewardService
SessionEngine -> SessionApi -> Server Persistence Layer
Session Page -> PromptAudioService -> Browser Speech Synthesis API

# Progress review
History Page -> ProfileStore / ProgressStore -> ProfileApi -> Server Persistence Layer
```

State ownership:
- Persistent profile, history, and progress data live in the server database and are surfaced through composables/stores.
- Active session state lives in memory during play and is checkpointed after each completed prompt.

## Platform Considerations

| Platform | Consideration | Approach |
|----------|---------------|----------|
| Desktop browsers | Keyboard-first input and wider layouts | Optimize session entry around physical keyboard use |
| Tablet browsers | Touch targets and viewport sizing | Use large controls and responsive layouts tuned for iPad-class widths |
| Browsers without speech synthesis | Prompt audio may be unavailable | Provide visible word prompt fallback or alternative playback messaging |
| Home server deployments | Device-to-server connectivity may vary by room/network | Provide clear unavailable/retry states and simple LAN-friendly configuration |
| Browsers with reduced motion/audio preferences | Sensory comfort | Respect mute and reduced motion settings in UI presentation |

## Trade-offs

**Decision:** Use a fixed built-in rank ladder instead of user-configurable rank names.

**Reasoning:**
- Rank naming is a product choice rather than a customization need for the MVP.
- A fixed ladder simplifies implementation, QA, copy, and art badge design.

**Impact:**
- Renaming ranks later requires a product update rather than a config edit.

**Decision:** Use a household server for shared persistence instead of browser-only local storage.

**Reasoning:**
- Keeps family data private to the home environment without relying on third-party cloud services.
- Allows multiple household devices to share the same progress and history.
- Better matches the expected family setup for a home-hosted app.

**Impact:**
- The app depends on home-network availability and a running server.
- Setup is slightly more involved than pure browser-only storage.

**Decision:** Use browser speech synthesis before any premium voice provider.

**Reasoning:**
- Fastest path to a working spoken-prompt feature.
- No backend service or voice subscription required.

**Impact:**
- Voice quality and consistency will vary by browser and device.
- A fallback path must exist when speech APIs are unavailable.

## Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Vocabulary quality is too narrow or poorly calibrated | Medium | High | Start with structured age bands and expand catalog iteratively with reviewable data files |
| Adaptive selection feels unfair or repetitive | Medium | High | Keep weighting logic configurable and validate with simulated profile histories and playtesting |
| Browser speech support is inconsistent | Medium | Medium | Provide replay controls, graceful fallback, and device-level QA on target browsers |
| Household server is offline or unreachable | Medium | High | Add clear retry UX, connection health checks, and resilient API error handling |
| Database setup is too complex for home deployment | Medium | Medium | Prefer a simple default database option and document deployment clearly |
| Reward system expectations become confusing for parents | Medium | Medium | Show explicit reward history and milestone rules in the dashboard or parent-facing help copy |
