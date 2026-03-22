# Simplify Guessing UI - Implementation Tasks

## Overview

Total: 7 tasks
Key milestones: remove the sparkle session log panel, update the session page layout, preserve essential active-turn feedback, verify the spelling session flow still works
Dependencies overview: frontend session page structure and styles must be updated before final validation

## Frontend

- [x] **1.** Remove the sparkle session log panel from the session page (test: session page no longer renders the sidebar content)
  - [x] **1.1** Remove the sidebar section that displays adaptive practice and scoring copy from the session page (test: sidebar headings and explanatory copy are absent)
  - [x] **1.2** Remove or relocate the turn-based reward presentation so it no longer depends on the sidebar container (depends on: 1.1) (test: reward feedback remains visible only if intentionally retained inline)
- [x] **2.** Update the session page layout for a focused single-column experience (test: main guessing UI uses available width cleanly on desktop and mobile)
  - [x] **2.1** Replace the two-column session layout dependency with a main-content-first layout (test: no empty sidebar spacing remains on desktop)
  - [x] **2.2** Adjust responsive spacing and width rules for mobile and desktop session states (depends on: 2.1) (test: session page remains readable across breakpoints)
- [x] **3.** Preserve the core spelling session interaction in the simplified UI (depends on: 1, 2) (test: active prompt, replay, input, and attempt flow still work)
  - [x] **3.1** Verify the current prompt, answer form, and submit actions remain unchanged in behavior (test: manual session playthrough)
  - [x] **3.2** Verify attempt feedback, correction flow, and progress display remain visible and understandable without the sidebar (test: manual session playthrough)

## Testing

- [x] **4.** Validate simplified guessing UI behavior across key session states (depends on: 3) (test: manual verification of start, retry, correct, and correction-required states)
  - [x] **4.1** Confirm the sparkle session log is absent in the default in-session view (test: visual verification)
  - [x] **4.2** Confirm no scoring, reward, or adaptive logic regressions were introduced by the UI-only change (test: compare session behavior before and after change)
  - [x] **4.3** Confirm the desktop and mobile layouts remain balanced after sidebar removal (test: responsive verification)

---

## Completion Summary

| Phase | Tasks | Completed | Progress |
|-------|-------|-----------|----------|
| Frontend | 6 | 6 | 100% |
| Testing | 4 | 4 | 100% |
| **Total** | **10** | **10** | **100%** |
