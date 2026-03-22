# Admin Words Pronunciation Review - Implementation Tasks

## Overview

Total: 15 tasks
Key milestones: expose admin word review data, build `/admin/words`, wire standard and enunciation playback, verify read-only behavior and filtering
Dependencies overview: page rendering depends on the read-only admin words API; playback controls depend on existing speech composable reuse; final testing depends on API, UI, and playback tasks landing first

## Backend

- [x] **1.** Expose read-only admin review data for the Word Catalog
  - [x] **1.1** Create a typed `AdminWordReviewEntry` response shape for admin word review data (test: typecheck usage in server and page code)
  - [x] **1.2** Add a `GET /api/admin/words` endpoint that returns the full Word Catalog with identifying metadata (depends on: 1.1) (test: request the endpoint and verify response shape)
  - [x] **1.3** Derive `canEnunciate` for each entry using existing enunciation validation helpers (depends on: 1.2) (test: verify mixed valid and invalid entries produce correct readiness values)
  - [x] **1.4** Confirm the endpoint is read-only and does not touch profile, session, reward, or progress storage (depends on: 1.2) (test: inspect behavior with an API-focused regression test)

## Frontend

- [x] **2.** Add the `/admin/words` route and review layout
  - [x] **2.1** Create the admin page and load data from `/api/admin/words` (test: page renders returned entries)
  - [x] **2.2** Render each word with canonical text and identifying metadata needed for review (depends on: 2.1) (test: component or page test verifies row content)
  - [x] **2.3** Add a filter or search control that narrows the visible word list (depends on: 2.1) (test: interaction test filters to matching words)
  - [x] **2.4** Show clear status for entries that cannot be enunciated (depends on: 2.2) (test: invalid entry renders disabled or unavailable state)

- [x] **3.** Wire admin playback controls to existing speech behavior
  - [x] **3.1** Add a `Pronounce` action that plays standard word speech for an entry (depends on: 2.2) (test: interaction test calls speech playback with canonical word text)
  - [x] **3.2** Add an `Enunciate` action that plays enunciation speech when available (depends on: 2.4) (test: interaction test calls speech playback with enunciation text)
  - [x] **3.3** Disable or guard `Enunciate` when `canEnunciate` is false (depends on: 2.4) (test: unavailable entries cannot trigger enunciation playback)
  - [x] **3.4** Surface non-blocking feedback when browser speech is unavailable or playback fails (depends on: 3.1, 3.2) (test: simulate speech failure and verify the page remains usable)

## Testing

- [ ] **4.** Add regression coverage for admin pronunciation review
  - [x] **4.1** Add server tests for `/api/admin/words` response contents and read-only behavior (depends on: 1.4) (test: automated server test suite)
  - [x] **4.2** Add page-level tests for list rendering, filtering, and playback button state (depends on: 2.4, 3.3) (test: automated frontend test suite)
  - [ ] **4.3** Manually verify `/admin/words` playback behavior on desktop and touch-friendly browser layouts (depends on: 3.4) (test: manual QA checklist for both standard and enunciate actions)

---

## Completion Summary

| Phase | Tasks | Completed | Progress |
|-------|-------|-----------|----------|
| Backend | 4 | 4 | 100% |
| Frontend | 8 | 8 | 100% |
| Testing | 3 | 2 | 67% |
| **Total** | **15** | **14** | **93%** |
