# Move Storage to SQLite - Technical Design

## Architecture Overview

This feature keeps the existing Nuxt server API surface but swaps the persistence implementation from full-file JSON reads and writes to a SQLite-backed repository layer. The new storage path introduces a database bootstrap step and schema migrations while leaving the frontend and shared domain behavior unchanged.

Data flows continue to start in the server routes for profiles and sessions, but instead of mutating an in-memory `DatabaseShape` and rewriting one JSON file, each route will call storage utilities that execute targeted SQL reads and transactional writes. A startup-safe bootstrap sequence will ensure the SQLite file exists and apply pending migrations before serving requests.

Key architectural decisions:
- Keep the public route contract stable so the frontend does not need a migration-aware rollout.
- Use SQLite as the default embedded database because it matches the household server deployment model.
- Replace broad `readDatabase()` and `updateDatabase()` document operations with focused repository functions and transactions.
- Track migration state inside SQLite so future schema changes remain versioned and auditable.

## Interface Design

| Interface | Input | Output | Description |
|-----------|-------|--------|-------------|
| `initializeStorage()` | `void` | `Promise<void>` | Opens SQLite, creates baseline schema, and applies pending migrations. |
| `listProfiles()` | `void` | `Promise<Profile[]>` | Returns profiles ordered for the profile picker. |
| `getProfile(profileId)` | `profileId: string` | `Promise<Profile | null>` | Returns one child profile. |
| `createProfile(input)` | `Profile` | `Promise<Profile>` | Inserts a new profile record. |
| `updateProfile(profileId, patch)` | `{ profileId: string, patch: Partial<Profile> }` | `Promise<Profile>` | Updates editable profile fields. |
| `deleteProfile(profileId)` | `profileId: string` | `Promise<void>` | Deletes a profile and dependent records in one transaction. |
| `getDashboardData(profileId)` | `profileId: string` | `Promise<DashboardView>` | Loads the profile, recent rewards, recent sessions, and difficult words. |
| `getHistoryData(profileId)` | `profileId: string` | `Promise<HistoryView>` | Loads persisted history data for the selected profile. |
| `createSession(session)` | `SessionRecord` | `Promise<SessionRecord>` | Persists a new session with its initial prompt state. |
| `getSession(sessionId)` | `sessionId: string` | `Promise<SessionRecord | null>` | Returns one session with prompt history. |
| `saveSessionProgress(input)` | `{ session: SessionRecord, profile: Profile, rewards: RewardEvent[], wordProgress: WordProgress[] }` | `Promise<void>` | Commits a logical session update atomically. |

## Data Models

### `profiles`

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | `TEXT` | PK, required | Profile identifier preserved from legacy storage. |
| `name` | `TEXT` | NOT NULL | Child display name. |
| `birthdate` | `TEXT` | NOT NULL | ISO date string. |
| `avatar_uri` | `TEXT` | nullable | Optional profile picture path or data URI. |
| `points_total` | `INTEGER` | NOT NULL | Lifetime points total. |
| `level` | `INTEGER` | NOT NULL | Current level. |
| `rank_key` | `TEXT` | NOT NULL | Current rank key. |
| `created_at` | `TEXT` | NOT NULL | ISO datetime. |
| `updated_at` | `TEXT` | NOT NULL | ISO datetime. |

### `rewards`

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | `TEXT` | PK, required | Reward identifier. |
| `profile_id` | `TEXT` | FK `profiles.id`, NOT NULL | Owning child profile. |
| `type` | `TEXT` | NOT NULL | `level-up` or `rank-up`. |
| `level_reached` | `INTEGER` | NOT NULL | Level tied to the reward. |
| `rank_key` | `TEXT` | nullable | Rank key for milestone rewards. |
| `robux_awarded` | `INTEGER` | NOT NULL | Motivational reward amount. |
| `created_at` | `TEXT` | NOT NULL | ISO datetime. |

### `word_progress`

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `profile_id` | `TEXT` | PK part, FK `profiles.id`, NOT NULL | Owning child profile. |
| `word_id` | `TEXT` | PK part, NOT NULL | Tracked word identifier. |
| `mastery_score` | `REAL` | NOT NULL | Current mastery signal. |
| `adaptive_weight` | `REAL` | NOT NULL | Current selection weight. |
| `last_seen_at` | `TEXT` | nullable | Most recent prompt timestamp. |
| `times_prompted` | `INTEGER` | NOT NULL | Total prompt count. |
| `times_correct` | `INTEGER` | NOT NULL | Total correct count. |
| `average_attempt_index` | `REAL` | NOT NULL | Running average attempt number. |
| `recent_misses` | `INTEGER` | NOT NULL | Recent miss count. |
| `recent_successes` | `INTEGER` | NOT NULL | Recent success count. |

### `sessions`

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | `TEXT` | PK, required | Session identifier. |
| `profile_id` | `TEXT` | FK `profiles.id`, NOT NULL | Owning child profile. |
| `started_at` | `TEXT` | NOT NULL | Session start time. |
| `ended_at` | `TEXT` | nullable | Session end time. |
| `words_completed` | `INTEGER` | NOT NULL | Completed prompt count. |
| `points_earned` | `INTEGER` | NOT NULL | Session point total. |
| `current_prompt_word_id` | `TEXT` | nullable | Active prompt word identifier, if any. |
| `current_prompt_attempts_json` | `TEXT` | nullable | JSON array of active prompt attempts. |
| `current_prompt_correction_required` | `INTEGER` | NOT NULL | Boolean flag for correction-required state. |

### `session_prompt_history`

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `session_id` | `TEXT` | PK part, FK `sessions.id`, NOT NULL | Parent session identifier. |
| `sequence` | `INTEGER` | PK part, NOT NULL | Prompt order within the session. |
| `word_id` | `TEXT` | NOT NULL | Prompted word identifier. |
| `attempts_json` | `TEXT` | NOT NULL | JSON array of submitted attempts. |
| `completed_at` | `TEXT` | nullable | Prompt completion time. |
| `was_correct` | `INTEGER` | NOT NULL | Boolean correctness flag. |
| `awarded_points` | `INTEGER` | NOT NULL | Points awarded for the prompt. |
| `correction_required` | `INTEGER` | NOT NULL | Whether forced correction was triggered. |
| `correction_completed` | `INTEGER` | NOT NULL | Whether forced correction was completed. |

### `storage_meta`

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `key` | `TEXT` | PK, required | Metadata key. |
| `value` | `TEXT` | NOT NULL | Metadata value. |

#### Schema Changes

- Replace the single JSON document persistence model with normalized SQLite tables.
- Add `storage_meta` to track schema version.

## Key Components

### `StorageBootstrap`

**Responsibilities:**
- Open the SQLite connection.
- Create baseline tables and indexes.
- Apply pending migrations.

**Public API:**
- `initializeStorage(): Promise<void>`

**Dependencies:**
- SQLite driver
- Runtime config
- Migration registry

### `ProfileRepository`

**Responsibilities:**
- Persist and query profile records.
- Provide deterministic ordering for picker and detail reads.
- Cascade profile deletion through related storage records.

**Public API:**
- `listProfiles(): Promise<Profile[]>`
- `getProfile(id: string): Promise<Profile | null>`
- `createProfile(profile: Profile): Promise<Profile>`
- `updateProfile(id: string, patch: Partial<Profile>): Promise<Profile>`
- `deleteProfile(id: string): Promise<void>`

**Dependencies:**
- SQLite connection

### `SessionRepository`

**Responsibilities:**
- Persist sessions and prompt history.
- Load session records into the existing shared domain shape.
- Save multi-entity session updates transactionally.

**Public API:**
- `createSession(session: SessionRecord): Promise<SessionRecord>`
- `getSession(id: string): Promise<SessionRecord | null>`
- `saveSessionProgress(input: SaveSessionProgressInput): Promise<void>`

**Dependencies:**
- SQLite connection
- Row mappers

### `RewardRepository`

**Responsibilities:**
- Insert reward events.
- Query recent rewards and profile reward history.

**Public API:**
- `insertMany(rewards: RewardEvent[]): Promise<void>`
- `listByProfile(profileId: string): Promise<RewardEvent[]>`
- `listRecentByProfile(profileId: string, limit: number): Promise<RewardEvent[]>`

**Dependencies:**
- SQLite connection

### `WordProgressRepository`

**Responsibilities:**
- Upsert per-profile word progress rows.
- Query difficult word and adaptive selection inputs.

**Public API:**
- `upsertMany(entries: WordProgress[]): Promise<void>`
- `listByProfile(profileId: string): Promise<WordProgress[]>`

**Dependencies:**
- SQLite connection

## User Interaction

### Invocation Patterns

- Automatic storage bootstrap when the server runtime initializes.
- Existing profile and session API routes invoking repository functions.

### Flows

#### Startup flow
1. Server starts and calls `initializeStorage()`.
2. SQLite file is created if missing.
3. Baseline schema and metadata tables are created.
4. The app starts with an empty household database if no SQLite data exists yet.

#### Session update flow
1. API route loads the current session and profile.
2. Session engine computes the next state, rewards, and word progress updates.
3. Repository layer saves the changed session, rewards, word progress, and profile totals inside one transaction.
4. Route returns the same response shape currently consumed by the frontend.

### Input/Output Examples

```markdown
# Clean startup
Input: no `.data/spelling-wizard.sqlite`
Output: SQLite file created, schema version recorded, APIs return empty profile list

# Session attempt persistence
Input: session progress update with profile totals, reward events, and word progress changes
Output: one committed transaction; either all rows update or none do
```

## External Dependencies

| Dependency | Purpose | Version/Notes |
|------------|---------|---------------|
| SQLite driver | Embedded relational storage access | Choose a driver compatible with Nuxt server runtime and local deployment |
| Local filesystem | Store `.sqlite` file | Existing household server requirement |
| Nuxt runtime config | Configure database file path | Must support local default and override |

## Error Handling

| Error Code | Condition | Error Data | Recovery |
|------------|-----------|------------|----------|
| `STORAGE_INIT_FAILED` | SQLite connection or bootstrap fails | `{ path, reason }` | Abort storage startup and return controlled server error |
| `STORAGE_MIGRATION_FAILED` | Schema migration fails | `{ version, reason }` | Stop startup, preserve existing data, and require operator action |
| `PROFILE_PERSIST_FAILED` | Profile create/update/delete write fails | `{ profileId? }` | Return error response and keep prior committed data |
| `SESSION_PERSIST_FAILED` | Session transaction fails | `{ sessionId }` | Roll back transaction and ask client to retry safely |
| `STORAGE_READ_FAILED` | SQLite query fails unexpectedly | `{ scope, reason }` | Return controlled error and log diagnostics |

Logging should capture storage bootstrap, migration, and transaction failures with enough operator context to debug household deployment issues without exposing raw database details in child-facing UI messages.

## Security

| Concern | Approach |
|---------|----------|
| Input sanitization | Continue validating API input before persistence and use parameterized SQL statements. |
| Data integrity | Use primary keys, foreign keys, and transactions to reduce corruption risk. |
| Local privacy | Keep the SQLite file on the household server and avoid third-party storage services. |
| Secrets | Do not log full sensitive file paths or future credentials if alternate storage config is introduced. |
| Safe queries | Use parameterized SQL statements and avoid raw string interpolation in storage access. |

## Configuration

| Key | Type | Required | Default | Description |
|-----|------|----------|---------|-------------|
| `server.databasePath` | `string` | no | `.data/spelling-wizard.sqlite` | Filesystem path for the SQLite database file. |
| `server.storageDebugLogging` | `boolean` | no | `false` | Enables extra storage diagnostics for local troubleshooting. |

## Component Interactions

```markdown
# Startup
Nuxt server runtime -> StorageBootstrap -> SQLite database

# Profile reads and writes
Profile API routes -> ProfileRepository -> SQLite database
Profile API routes -> RewardRepository / SessionRepository / WordProgressRepository -> SQLite database

# Session progression
Session API routes -> SessionEngine -> SessionRepository
Session API routes -> SessionEngine -> RewardRepository
Session API routes -> SessionEngine -> WordProgressRepository
SessionRepository / RewardRepository / WordProgressRepository -> SQLite transaction -> SQLite database
```

## Platform Considerations

| Platform | Consideration | Approach |
|----------|---------------|----------|
| macOS/Linux home server | Local writable app data path | Default to `.data` within the project/runtime workspace unless overridden |
| Future container deployment | Mounted volume persistence | Allow database path override through runtime config |
| Low-concurrency household usage | Simple embedded database is sufficient | Prefer SQLite over heavier external database setup |

## Trade-offs

**Decision:** Normalize core storage into relational tables but keep some nested prompt state as JSON text columns.

**Reasoning:**
- Core entities benefit from relational integrity and simpler targeted queries.
- Active prompt attempts and prompt attempt arrays are easier to preserve from the current domain model as small JSON payloads.

**Impact:**
- Some session fields still require serialization and mapping logic.
- The design avoids over-modeling transient session details for this migration.

## Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Route logic assumes document-style whole-database mutation | High | Medium | Introduce repositories gradually behind the existing storage utility boundary |
| SQLite file permission issues block startup | Medium | High | Return explicit bootstrap errors and document writable path expectations |
| Transaction boundaries miss a related update | Medium | High | Define logical save units up front and cover them with integration tests |
| Future schema changes drift without discipline | Medium | Medium | Add versioned migration registration and startup enforcement |
