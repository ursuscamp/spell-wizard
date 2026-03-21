# Spelling Wizard - Implementation Tasks

## Overview

Total: 40 tasks
Key milestones: Nuxt app foundation, household server and database, adaptive spelling loop, rewards and ranks, playful UI polish, and QA.
Dependencies overview: Vocabulary data and server persistence must land before the adaptive selector and history views; progression and celebratory UI depend on scoring and saved profile/session data.

## Foundation

- [x] **1.** Set up the Nuxt.js application foundation (test: app boots locally and renders starter route)
  - [x] **1.1** Initialize Nuxt 3 with TypeScript, linting, and project scripts (test: `npm run dev` starts cleanly)
  - [x] **1.2** Configure a shared design token system for the bright, cheerful visual theme (depends on: 1.1) (test: tokens are referenced in a sample page)
  - [x] **1.3** Add app-level settings for sound, motion, rank config, and reward thresholds (depends on: 1.1) (test: config values load in runtime code)

- [x] **2.** Create the application layout and route structure (depends on: 1.1) (test: navigation works across placeholder routes)
  - [x] **2.1** Add routes for profile picker, dashboard, session, and history (test: each route renders)
  - [x] **2.2** Build a responsive base layout for desktop and tablet widths (depends on: 2.1) (test: layouts remain usable at common tablet and laptop sizes)

## Server and Persistence

- [x] **3.** Implement the household server persistence layer and typed domain models (depends on: 1.1) (test: create and reload sample data through the server API)
  - [x] **3.1** Define TypeScript models for profiles, sessions, attempts, rewards, and word progress (test: typecheck passes)
  - [x] **3.2** Implement the server database schema and persistence utilities (depends on: 3.1) (test: saved records persist after refresh and reload from another device)
  - [x] **3.3** Add versioned database bootstrapping and migration support (depends on: 3.2) (test: empty state initializes without errors)
  - [x] **3.4** Create Nuxt server API endpoints for profiles, sessions, rewards, and history (depends on: 3.2) (test: API requests return and persist expected data)

- [x] **4.** Create the structured word catalog pipeline (depends on: 3.1) (test: catalog loads and validates at app startup)
  - [x] **4.1** Define the word catalog schema with age-band and difficulty metadata (test: invalid entries fail validation)
  - [x] **4.2** Seed the MVP catalog with a large starter vocabulary grouped by age suitability (depends on: 4.1) (test: catalog contains words across multiple age bands)
  - [x] **4.3** Expose catalog query helpers for age-aware eligibility lookup (depends on: 4.2) (test: lookup returns expected bands)

## Profiles

- [x] **5.** Build child profile management (depends on: 3.4) (test: create, edit, and delete profiles through the UI)
  - [x] **5.1** Implement the profile picker screen with child cards and create flow (test: at least two profiles can be created and selected)
  - [x] **5.2** Add profile form validation for required name and birthdate fields (depends on: 5.1) (test: invalid forms show inline errors)
  - [x] **5.3** Implement profile picture selection and preview (depends on: 5.1) (test: supported images can be attached and reloaded)

- [x] **6.** Build the child dashboard and history views (depends on: 5.1) (test: selected profile data appears correctly)
  - [x] **6.1** Create dashboard cards for points, level, rank, rewards, and session start (test: dashboard reflects stored profile totals)
  - [x] **6.2** Create a history view for recent sessions, rewards, and difficult words (depends on: 3.4) (test: recorded sessions and rewards render correctly)

## Session Engine

- [x] **7.** Implement session state orchestration (depends on: 3.4, 4.3, 5.1) (test: a session can start, advance, and end without losing state)
  - [x] **7.1** Create the session store/composable for active prompt state (test: prompt state updates after submission)
  - [x] **7.2** Persist completed prompt results and session summaries immediately (depends on: 7.1) (test: refresh after a completed prompt preserves progress)

- [x] **8.** Implement spelling attempt validation and scoring (depends on: 7.1) (test: scoring matches 3/2/1/0 rules)
  - [x] **8.1** Normalize typed answers for fair correctness comparison (test: expected casing/spacing rules pass)
  - [x] **8.2** Enforce the three-attempt limit and next-word transition logic (depends on: 8.1) (test: fourth attempt is blocked and session advances correctly)
  - [x] **8.3** Return child-friendly feedback states for success, retries, and reveal-after-failure (depends on: 8.2) (test: UI receives the correct feedback state per attempt)
  - [x] **8.4** Require a forced correction entry after three failed attempts before advancing (depends on: 8.3) (test: next prompt remains locked until the correct spelling is typed)

- [x] **9.** Implement prompt audio playback (depends on: 7.1) (test: prompted words can be spoken and replayed)
  - [x] **9.1** Integrate browser speech synthesis for spoken prompts (test: supported browsers speak selected words)
  - [x] **9.2** Add replay controls and fallback behavior when speech is unavailable (depends on: 9.1) (test: unsupported environments still allow the session to continue)

## Adaptive Learning and Rewards

- [x] **10.** Build the adaptive word selection engine (depends on: 4.3, 7.2, 8.2) (test: simulated histories influence future word selection)
  - [x] **10.1** Derive age targeting from child birthdate and current date (test: age band selection matches expected sample profiles)
  - [x] **10.2** Calculate mastery and adaptive weights from recent correctness, attempts, and recency (depends on: 10.1) (test: difficult words receive higher weights than mastered words)
  - [x] **10.3** Add repetition guardrails to keep sessions varied (depends on: 10.2) (test: immediate repeats stay below defined thresholds)

- [x] **11.** Implement progression, level-ups, and rank rewards (depends on: 8.2, 3.4) (test: point milestones generate correct rewards and rank changes)
  - [x] **11.1** Convert cumulative points into level progression using 100-point thresholds (test: level values update correctly at boundaries)
  - [x] **11.2** Award 100 Robux on standard level-ups and 300 Robux on every third-level rank milestone (depends on: 11.1) (test: reward history records the correct payout amounts)
  - [x] **11.3** Implement the fixed rank ladder that ends with `Wizard` (depends on: 11.1) (test: rank lookup resolves expected names by level)

## UI Polish and Accessibility

- [x] **12.** Build the playful visual system and art integration (depends on: 2.2, 6.1, 7.1) (test: core screens share a consistent themed design)
  - [x] **12.1** Apply the bright color palette, expressive typography, and large child-friendly controls across screens (test: visual review across routes)
  - [x] **12.2** Add decorative art, badges, and celebratory states for rewards and ranks (depends on: 12.1) (test: milestone events display supporting art correctly)

- [x] **13.** Add sounds, motion, and accessibility controls (depends on: 9.1, 12.1) (test: sound and motion can be enabled, reduced, or muted)
  - [x] **13.1** Add playful audio cues for correct answers, retries, level-ups, and rank-ups (test: key events trigger the intended cues)
  - [x] **13.2** Respect reduced motion and mute preferences with accessible fallbacks (depends on: 13.1) (test: reduced-motion and muted states disable non-essential effects)
  - [x] **13.3** Verify focus states, contrast, and readable text alternatives for spoken prompts (depends on: 12.1) (test: keyboard navigation and contrast checks pass)

## Testing and Release Readiness

- [ ] **14.** Write automated tests for core logic (depends on: 8.2, 10.3, 11.3) (test: test suite passes locally)
  - [ ] **14.1** Add unit tests for scoring, progression, and rank calculations (test: deterministic fixtures pass)
  - [ ] **14.2** Add unit tests for adaptive weighting and repetition guardrails (depends on: 10.3) (test: weighted selection inputs produce expected ordering tendencies)
  - [ ] **14.3** Add component/integration tests for profile creation and session flow (depends on: 5.3, 7.2) (test: major child flows pass in CI/local runs)

- [ ] **15.** Perform manual QA and launch preparation (depends on: 13.3, 14.3) (test: checklist completed on target browsers)
  - [ ] **15.1** Validate the app on tablet and desktop browsers with representative profiles and at least two household devices (test: manual QA checklist completed)
  - [ ] **15.2** Review balance of starter vocabulary, rewards, and rank naming defaults (depends on: 11.3) (test: product review sign-off)
  - [ ] **15.3** Prepare starter art/audio asset inventory and fallback placeholders (depends on: 12.2, 13.1) (test: all referenced assets resolve without broken UI states)

---

## Completion Summary

| Phase | Tasks | Completed | Progress |
|-------|-------|-----------|----------|
| Foundation | 5 | 5 | 100% |
| Server and Persistence | 7 | 7 | 100% |
| Profiles | 5 | 5 | 100% |
| Session Engine | 8 | 8 | 100% |
| Adaptive Learning and Rewards | 6 | 6 | 100% |
| UI Polish and Accessibility | 5 | 5 | 100% |
| Testing and Release Readiness | 5 | 0 | 0% |
| **Total** | **40** | **36** | **90%** |
