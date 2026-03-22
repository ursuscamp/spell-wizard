# Admin Words Pronunciation Review - Technical Design

## Architecture Overview

This feature adds a new caregiver-facing route at `/admin/words` that reads from the existing Word Catalog and reuses the current browser speech playback path. The page acts as a read-only inspection surface: it loads catalog entries, renders them in a reviewable list, and offers per-word playback controls for standard pronunciation and enunciation.

The key architectural decision is to avoid building a separate audio pipeline for admin review. Instead, the page uses the same speech configuration and browser speech synthesis composable already used for child-facing prompts, while keeping playback actions detached from Spelling Session state. The server exposes a lightweight word review payload so the page can render useful metadata and determine whether enunciation is available for each word.

Data flow summary:

1. A caregiver opens `/admin/words`.
2. The page requests a read-only list of reviewable Word Catalog entries from an admin words API.
3. The UI renders the list with word text, metadata, and playback availability state.
4. When the caregiver presses a pronunciation button, the client calls the existing speech composable with the selected mode.
5. Playback happens locally in the browser without creating or mutating Spelling Session data.

## Interface Design

| Interface | Input | Output | Description |
|-----------|-------|--------|-------------|
| `GET /api/admin/words` | none | `AdminWordReviewEntry[]` | Returns read-only Word Catalog data for the admin review page. |
| `buildAdminWordReviewEntry(entry)` | `WordCatalogEntry` | `AdminWordReviewEntry` | Maps a catalog entry into UI-ready review data. |
| `filterAdminWords(entries, query)` | `AdminWordReviewEntry[], query: string` | `AdminWordReviewEntry[]` | Narrows the admin list to matching words. |
| `playAdminWord(entry, mode)` | `AdminWordReviewEntry, mode: "standard" | "enunciate"` | `Promise<void>` | Plays the selected word using existing speech behavior. |
| `canEnunciateWord(entry)` | `WordCatalogEntry` | `boolean` | Determines whether enunciation playback should be enabled. |

## Data Models

### AdminWordReviewEntry

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | `string` | required | Unique word identifier. |
| `word` | `string` | required, non-empty | Canonical spelling word shown to caregivers. |
| `enunciationText` | `string` | required | Stored enunciation text used for alternate playback review. |
| `difficulty` | `number` | required | Existing catalog difficulty value. |
| `ageBandMin` | `number` | required | Minimum target age from the Word Catalog. |
| `ageBandMax` | `number` | required | Maximum target age from the Word Catalog. |
| `tags` | `string[]` | required | Existing category tags for quick identification. |
| `canEnunciate` | `boolean` | required | Whether valid enunciation playback is currently available. |

#### Schema Changes

- No persistent schema changes are required.
- Add a server response shape for admin word review that derives `canEnunciate` from existing catalog data.

## Key Components

### Admin Words API

**Responsibilities:**
- Return the full Word Catalog in a review-friendly format
- Derive `canEnunciate` using existing validation helpers
- Keep the endpoint read-only

**Public API:**
- `GET /api/admin/words -> AdminWordReviewEntry[]`

**Dependencies:**
- `WORD_CATALOG`
- `canEnunciateWord()` or equivalent validation logic

### Admin Words Page

**Responsibilities:**
- Fetch and render admin review entries
- Provide search or filter controls for locating words quickly
- Present clear standard and enunciate playback actions
- Surface playback readiness and failure states without blocking the page

**Public API:**
- Route: `/admin/words`
- `filterAdminWords(entries: AdminWordReviewEntry[], query: string): AdminWordReviewEntry[]`
- `playAdminWord(entry: AdminWordReviewEntry, mode: "standard" | "enunciate"): Promise<void>`

**Dependencies:**
- Admin Words API
- `usePromptVoice()`

### Prompt Voice Composable Reuse

**Responsibilities:**
- Play standard or enunciate speech for a provided word string
- Reuse existing speech rate, pitch, and voice selection rules
- Fail safely when browser speech is unavailable

**Public API:**
- `speakWord(word?: string, options?: SpeakWordOptions): Promise<void>`

**Dependencies:**
- Browser `speechSynthesis`
- App speech configuration

## User Interaction

### Invocation Patterns

- Direct route visit to `/admin/words`
- Text input for narrowing the displayed list
- Button click or tap for standard pronunciation playback
- Button click or tap for enunciation playback

### Flows

1. Caregiver opens `/admin/words`.
2. The page loads all reviewable words and displays identifying metadata.
3. The caregiver types a word fragment or scans the list.
4. The caregiver presses `Pronounce` to hear the standard prompt mode.
5. The caregiver presses `Enunciate` to hear the clearer alternate mode when available.
6. The caregiver moves through additional words without affecting any child progress data.

Error recovery flow:

1. Caregiver presses a playback control.
2. Browser speech is unavailable or playback fails to start.
3. The page shows a non-blocking error or helper state.
4. The rest of the list remains interactive.

### Input/Output Examples

```ts
type AdminWordReviewEntry = {
  id: 'apple'
  word: 'apple'
  enunciationText: 'ap...pul'
  difficulty: 1
  ageBandMin: 5
  ageBandMax: 7
  tags: ['food']
  canEnunciate: true
}

await playAdminWord(entry, 'standard')
await playAdminWord(entry, 'enunciate')
```

## External Dependencies

| Dependency | Purpose | Version/Notes |
|------------|---------|---------------|
| Browser Speech Synthesis API | Local word playback for admin review | Same support envelope as current spoken prompts |
| Nuxt page routing | Serve the `/admin/words` route | Reuse existing app routing approach |
| Existing speech configuration | Match current standard and enunciate voice behavior | Read from current app config |

## Error Handling

| Error Code | Condition | Error Data | Recovery |
|------------|-----------|------------|----------|
| `SPEECH_UNAVAILABLE` | Browser does not support speech playback | `{ supported: false }` | Disable playback controls or show helper text |
| `PLAYBACK_FAILED` | Speech playback throws or does not start | `{ wordId, mode }` | Show non-blocking feedback and keep page usable |
| `ENUNCIATION_UNAVAILABLE` | Word lacks valid enunciation data | `{ wordId }` | Disable `Enunciate` action and show status |
| `WORDS_LOAD_FAILED` | Admin word list request fails | `{ message }` | Show page-level error with retry option |

Logging should capture page load and playback failures without storing child profile or session data.

## Security

| Concern | Approach |
|---------|----------|
| Read-only behavior | Keep `/api/admin/words` limited to catalog reads only |
| Data scope | Return only word catalog review fields; exclude profile, session, and reward data |
| Input handling | Treat filter text as local UI state and avoid using it in dynamic server queries |
| Safe failure | Disable unsupported playback actions instead of exposing broken interactions |

## Configuration

| Key | Type | Required | Default | Description |
|-----|------|----------|---------|-------------|
| `spellingWizard.speech.standard.*` | existing object | yes | existing | Standard pronunciation settings reused by `Pronounce` |
| `spellingWizard.speech.enunciate.*` | existing object | yes | existing | Enunciation settings reused by `Enunciate` |
| `spellingWizard.speech.voiceEnabled` | `boolean` | yes | existing | Global gate for browser speech playback |

No new feature-specific configuration is required for the first version.

## Component Interactions

```markdown
Admin Words Page -> GET /api/admin/words -> Word Catalog
Admin Words Page -> usePromptVoice() -> Browser speechSynthesis

Pronounce click -> playAdminWord(entry, "standard") -> speakWord(entry.word)
Enunciate click -> playAdminWord(entry, "enunciate") -> speakWord(entry.enunciationText)
```

## Platform Considerations

| Platform | Consideration | Approach |
|----------|---------------|----------|
| Desktop browsers | Large catalog browsing benefits from denser layout | Favor a scan-friendly list or table layout |
| Touch devices | Playback controls must be easy to tap repeatedly | Keep per-row controls large and clearly labeled |
| Browsers with delayed voice readiness | Voice list may load asynchronously | Reuse existing speech readiness handling from the prompt composable |

## Trade-offs

**Decision**: Load the complete current Word Catalog into the admin page rather than paginating the first version.

**Reasoning:**
- The current catalog is small enough for full review in one page load
- Reviewing all words at once makes QA and comparison faster
- Search is simpler to implement and reason about than server pagination

**Impact:**
- Future catalog growth may require pagination or virtualization
- Initial render cost grows with catalog size

**Decision**: Reuse the existing speech composable instead of a dedicated admin playback service.

**Reasoning:**
- Keeps pronunciation review aligned with the real child-facing playback path
- Reduces duplicate voice configuration logic
- Makes admin testing meaningful for the current production behavior

**Impact:**
- Admin playback inherits browser speech limitations from the main app
- Any shared playback bugs affect both child and admin flows until fixed centrally

## Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Full catalog rendering becomes cluttered | Medium | Medium | Add search and concise metadata to improve scanning |
| Caregivers cannot tell the difference between controls | Medium | Medium | Use explicit labels and status text for pronunciation versus enunciation |
| Browser speech state is not ready when page loads | Medium | Low | Reuse readiness state and disable controls until available |
| Admin page accidentally couples to session logic later | Low | High | Keep API and page models read-only and separate from session endpoints |
