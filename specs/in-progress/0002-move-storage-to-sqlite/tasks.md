# Move Storage to SQLite - Implementation Tasks

## Overview

Total: 16 tasks
Key milestones: SQLite bootstrap, relational schema, repository migration, and verification.
Dependencies overview: Storage bootstrap and schema must land before route migration; verification depends on all repository and route updates.

## Infrastructure

- [x] **1.** Add the SQLite storage foundation (test: server can open the configured SQLite database path)
  - [x] **1.1** Choose and wire the SQLite runtime integration for the Nuxt server environment using Node's built-in `node:sqlite` module (test: a connection opens locally)
  - [x] **1.2** Add runtime configuration for the SQLite file path and storage debug logging (depends on: 1.1) (test: config values resolve in server code)
  - [x] **1.3** Create the storage bootstrap entry point that opens SQLite and exposes a shared connection utility (depends on: 1.2) (test: bootstrap runs without route errors)

- [x] **2.** Define the SQLite schema and migration system (depends on: 1.3) (test: a clean database initializes all expected tables)
  - [x] **2.1** Create baseline schema migrations for profiles, rewards, word progress, sessions, session prompt history, and storage metadata (test: tables exist after bootstrap)
  - [x] **2.2** Add indexes and relational constraints needed for profile and session queries (depends on: 2.1) (test: schema inspection shows expected PK/FK/index definitions)
  - [x] **2.3** Record and enforce schema version tracking in SQLite metadata (depends on: 2.1) (test: version is persisted and checked on startup)

## Server Persistence Layer

- [x] **3.** Replace document-style storage helpers with SQLite-backed access (depends on: 2.3) (test: storage utilities return the same domain shapes used by current routes)
  - [x] **3.1** Implement deterministic profile loading and persistence through SQLite-backed storage helpers (test: list and get operations match existing expectations)
  - [x] **3.2** Persist reward and word progress records through SQLite-backed storage helpers (depends on: 3.1) (test: reward history and progress updates persist correctly)
  - [x] **3.3** Persist session state, active prompt state, and prompt history through SQLite-backed storage helpers (depends on: 3.2) (test: stored sessions round-trip into `SessionRecord` correctly)
  - [x] **3.4** Add transaction helpers for logical multi-entity save operations (depends on: 3.2, 3.3) (test: partial write simulation rolls back cleanly)

- [x] **4.** Migrate existing server routes to SQLite-backed persistence (depends on: 3.4) (test: current profile and session API flows pass against SQLite)
  - [x] **4.1** Update profile routes to use the new SQLite-backed persistence for create, read, update, delete, dashboard, and history flows (test: profile CRUD and views still work)
  - [x] **4.2** Update session routes to use transactional persistence for start, attempt, correction, fetch, and end flows (depends on: 4.1) (test: session lifecycle persists correctly)
  - [x] **4.3** Remove or retire JSON file rewrite code paths once SQLite routes are fully wired (depends on: 4.2) (test: no active route depends on `.data/spelling-wizard-db.json` for live writes)

## Testing and Documentation

- [x] **5.** Verify the SQLite runtime reliability (depends on: 4.3) (test: targeted automated checks and manual verification pass)
  - [x] **5.1** Add automated tests for clean bootstrap and schema migration behavior (test: storage tests pass locally)
  - [x] **5.2** Add integration tests covering profile CRUD, dashboard/history reads, and session progression against SQLite (depends on: 5.1) (test: API integration suite passes)
  - [x] **5.3** Document the SQLite file location and backup guidance for household deployment (depends on: 5.1) (test: docs reference the final config keys and paths accurately)

---

## Completion Summary

| Phase | Tasks | Completed | Progress |
|-------|-------|-----------|----------|
| Infrastructure | 6 | 6 | 100% |
| Server Persistence Layer | 7 | 7 | 100% |
| Testing and Documentation | 3 | 3 | 100% |
| **Total** | **16** | **16** | **100%** |
