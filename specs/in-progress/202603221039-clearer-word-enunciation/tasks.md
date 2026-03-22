# Clearer Word Enunciation - Implementation Tasks

## Overview

Total: 15 tasks
Key milestones: extend Word Catalog data, update playback behavior, add `enunciate` UI, verify fallback and regression coverage
Dependencies overview: playback updates depend on word data shape decisions; UI work depends on playback mode support; final testing depends on catalog, playback, and UI tasks landing first

## Data and Content

- [x] **1.** Extend Word Catalog data for enunciation support
  - [x] **1.1** Add `enunciationText` to the word data model and loader output (test: load a word entry and verify the new field is present)
  - [x] **1.2** Define validation rules so `enunciationText` maps to the same answer word as `text` (depends on: 1.1) (test: validate passing and failing sample entries)
  - [x] **1.3** Backfill or generate `enunciationText` for all currently playable words (depends on: 1.2) (test: verify catalog coverage for session-eligible words)

## Playback

- [x] **2.** Tune standard spoken prompt playback for slower, clearer speech
  - [x] **2.1** Identify the current prompt voice configuration path used in Spelling Sessions (test: confirm the active config source in code)
  - [x] **2.2** Update standard playback parameters to slower, clearer defaults without changing prompt flow (depends on: 2.1) (test: compare playback behavior in a local session)
- [x] **3.** Add enunciation playback mode to the existing speech pipeline
  - [x] **3.1** Add playback mode selection for `standard` and `enunciate` requests (depends on: 2.1) (test: unit test mode-to-config mapping)
  - [x] **3.2** Use `enunciationText` for `enunciate` playback and canonical word text for `standard` playback (depends on: 1.1, 3.1) (test: verify requested speech input for both modes)
  - [x] **3.3** Add safe fallback behavior when enunciation data is missing or invalid (depends on: 1.2, 3.2) (test: simulate missing data and verify the session remains usable)

## Frontend

- [x] **4.** Add an `enunciate` control to the spelling interface
  - [x] **4.1** Render an `enunciate` button during an active word prompt (depends on: 1.1) (test: component test for button visibility)
  - [x] **4.2** Wire the button to request enunciation playback for the current word (depends on: 3.2, 4.1) (test: interaction test verifies enunciate handler is called)
  - [x] **4.3** Ensure `enunciate` does not reset typed input, attempts, points, or prompt progression (depends on: 4.2) (test: integration test preserves in-progress answer and session state)
  - [x] **4.4** Provide a graceful disabled or fallback state when enunciation playback is unavailable (depends on: 3.3, 4.1) (test: UI remains usable when enunciation is missing)

## Testing

- [ ] **5.** Add regression coverage for clearer speech behavior
  - [x] **5.1** Add unit tests for word validation and playback mode selection (depends on: 1.2, 3.1) (test: automated unit test suite)
  - [x] **5.2** Add integration coverage for standard replay versus `enunciate` playback in a Spelling Session (depends on: 3.2, 4.3) (test: automated integration test suite)
  - [ ] **5.3** Verify behavior manually on supported session playback environments (depends on: 2.2, 4.4) (test: manual QA checklist for desktop and touch device flows)

---

## Completion Summary

| Phase | Tasks | Completed | Progress |
|-------|-------|-----------|----------|
| Data and Content | 3 | 3 | 100% |
| Playback | 5 | 5 | 100% |
| Frontend | 4 | 4 | 100% |
| Testing | 3 | 2 | 67% |
| **Total** | **15** | **14** | **93%** |
