# Move Storage to SQLite

## Summary

This feature replaces the current JSON file-based household server persistence with SQLite while preserving the existing profile, session, reward, and adaptive learning behavior for new data written after the change. The goal is to improve data integrity, safer concurrent access, and operational simplicity for a single-home deployment without changing the child-facing product experience.

## Problem Statement

The app currently stores all household data in one JSON file under `.data`, which is simple but fragile as the product grows. A single file rewrite model increases the risk of corruption, makes schema evolution clumsy, and does not provide strong guarantees when multiple requests update shared data close together. If the app continues to scale on this foundation, progress history, rewards, and session state become harder to protect and maintain.

## User Stories

- As a parent, I want my children's progress to stay intact even if the app handles many saves in a short period, so that I can trust the household server.
- As a developer, I want structured SQLite tables and migrations, so that storage changes are easier to evolve and debug.
- As a family, I want the app to keep behaving the same after the storage upgrade, so that no one has to relearn the product.
- As an operator of the household server, I want the default database setup to stay lightweight and local, so that deployment remains simple.

## Functional Requirements

- [ ] **REQ-001**: The system must replace the JSON file database at `.data/spelling-wizard-db.json` with a SQLite-backed persistence layer for profiles, rewards, word progress, and sessions.
- [ ] **REQ-002**: The system must preserve the current API contract and child-facing behavior for profile management, dashboard data, history views, session progression, scoring, and rewards.
- [ ] **REQ-003**: The system must define explicit SQLite tables and relationships for profiles, rewards, word progress, sessions, and session prompt history.
- [ ] **REQ-004**: The system must initialize an empty SQLite database automatically when the app starts in an environment with no existing database file.
- [ ] **REQ-005**: The system must support versioned database schema migrations for future storage changes.
- [ ] **REQ-006**: The system must perform multi-record writes that belong to one logical action atomically, so that partial updates are not persisted.
- [ ] **REQ-007**: The system must return clear server-side errors when the SQLite database cannot be opened, migrated, read, or written.
- [ ] **REQ-008**: The system must keep the default storage location local to the household server and configurable through server runtime configuration.
- [ ] **REQ-009**: The system must continue to return deterministic ordering for profile lists and session history that matches the current product expectations.
- [ ] **REQ-010**: The system must support reading and writing current session prompt history, including correction-required states, without data loss.
- [ ] **REQ-011**: The system must document the expected SQLite file location and bootstrap behavior for local deployment.

## Non-Functional Requirements

- **Performance:** Common reads and writes for profile selection, dashboard loading, session attempt submission, and session completion should remain within current app expectations and should not feel slower than the JSON implementation during normal single-household usage.
- **Reliability:** Logical write operations must be atomic, and restart behavior must not leave the database in a partially updated state.
- **Maintainability:** The storage layer should isolate SQL-specific concerns behind reusable utilities so future schema updates do not require rewriting every API route.
- **Compatibility:** Existing app routes and shared TypeScript models must remain supported during the transition.
- **Operability:** The default deployment should require only a local SQLite file and no external database service.
- **Data Integrity:** Constraints, primary keys, and indexing should protect against malformed or duplicate persistence records where applicable.

## Acceptance Criteria

- [ ] **AC-001**: On a clean environment with no prior data, the app creates a new SQLite database automatically and profile/session APIs work without manual database setup.
- [ ] **AC-002**: Creating, editing, and deleting a child profile through the existing API persists correctly in SQLite and remains available after restart.
- [ ] **AC-003**: Starting a session, submitting attempts, completing correction-required prompts, and ending the session all persist correctly in SQLite and survive refreshes and server restarts.
- [ ] **AC-004**: Reward history, level progression, and rank progression match the current behavior with SQLite-backed storage.
- [ ] **AC-005**: If a write fails in the middle of a logical multi-step save, the database does not persist a partial update.
- [ ] **AC-006**: If the SQLite database is unavailable or invalid, the server returns a controlled error instead of silently resetting household data.
- [ ] **AC-007**: Local deployment documentation explains where the SQLite file lives and what data files should be backed up.

## Out of Scope

- Changing the child-facing UI, reward rules, rank ladder, or adaptive learning algorithm.
- Introducing a remote hosted database service or multi-household cloud sync.
- Redesigning API shapes consumed by the frontend.
- Reworking the vocabulary catalog format.
- Adding parent authentication, authorization, or encryption-at-rest beyond current project scope.
- Migrating existing JSON household data into SQLite.

## Assumptions

- The app remains a single-household Nuxt deployment running on a local or home-hosted server.
- SQLite is acceptable for the expected household workload and deployment model.
- The current server routes remain the integration boundary for the frontend during this change.

## Dependencies

- **Internal:** Current shared domain types in `shared/spelling.ts`, existing server API routes, session engine logic, dashboard/history builders, and storage utilities in `server/utils/storage.ts`.
- **External:** A SQLite driver compatible with the current Nuxt server runtime; filesystem access for the database file; local deployment docs for household server setup.
- **Blocked by:** Selection of the SQLite access approach, schema definition for nested session prompt history, and agreement on the runtime config path for the database file.
