# TTS Intermittent Playback Fix - Implementation Tasks

## Overview

Brief summary of the implementation:
- Estimated total tasks: 7
- Key milestones: remove duplicate prompt playback, harden speech synthesis sequencing, verify session replay behavior
- Dependencies overview: session playback flow updates depend on the investigated root cause documented in `bug-report.md`

## Frontend

- [x] **1.** Remove duplicate auto-play triggers in the spelling session flow (test: confirm each new prompt results in a single TTS request)
  - [x] **1.1** Update `app/pages/profile/[id]/session.vue` so prompt playback is triggered from one path only after session creation (test: start a new session and verify one playback attempt)
  - [x] **1.2** Update `app/pages/profile/[id]/session.vue` so advancing after a correct answer does not trigger duplicate playback calls (depends on: 1.1) (test: answer correctly and verify the next prompt is spoken once)
  - [x] **1.3** Preserve manual replay behavior for the "Hear it again" button (depends on: 1.1) (test: tap replay repeatedly and verify the current prompt replays intentionally)

- [x] **2.** Harden speech synthesis invocation in the prompt voice composable (depends on: 1) (test: verify repeated playback requests do not silently drop speech)
  - [x] **2.1** Update `app/composables/usePromptVoice.ts` to avoid race-prone cancellation for ordinary prompt progression (test: move across multiple prompts and verify speech remains reliable)
  - [x] **2.2** Keep interruption behavior for explicit replay requests where replacing current speech is desired (depends on: 2.1) (test: click replay while speech is active and verify the prompt restarts cleanly)
  - [x] **2.3** Add any needed guards for browser speech synthesis readiness or unavailable voices without regressing current fallback behavior (depends on: 2.1) (test: verify the session still shows visible text when speech is unavailable)

## Testing

- [x] **3.** Add regression coverage for TTS trigger behavior (depends on: 1, 2) (test: automated or manual verification covering session start, prompt advance, and replay)
  - [x] **3.1** Add or update tests for single-trigger playback on prompt changes where feasible (test: assert one playback request per prompt transition)
  - [x] **3.2** Document manual verification steps for browser-gated first playback and replay behavior (depends on: 3.1) (test: validate on local app in browser)

## Manual Verification Notes

- Start a new spelling session and confirm the first prompt speaks once rather than starting and cutting out.
- Submit a correct answer and confirm the next prompt speaks once without needing a manual replay.
- Click "Hear it again" while speech is active and confirm the current word restarts cleanly.
- Toggle spoken words off and confirm the session falls back to showing the visible word on screen.

---

## Completion Summary

| Phase | Tasks | Completed | Progress |
|-------|-------|-----------|----------|
| Frontend | 5 | 5 | 100% |
| Testing | 2 | 2 | 100% |
| Total | 7 | 7 | 100% |
