# BUG-0003: TTS intermittently fails during spelling sessions

## Summary
Text-to-speech playback does not reliably speak prompted words during a spelling session, even though the same flow worked earlier. The issue appears intermittent, which makes the spelling session feel broken and prevents children from consistently hearing the prompt they need to answer.

## Severity: High

- The spoken prompt is a core part of the spelling session experience and the feature is currently unreliable.
- Any child using spelling sessions with audio guidance may be affected.
- Workaround: retry the prompt or restart the session/app, but this is inconsistent and disruptive.

## Environment

| Field | Value |
|-------|-------|
| App Version | Current local development version |
| OS | Unknown |
| Browser / Device | Unknown |
| Backend Version | Current local development version |
| Database | Unknown |

## Reproduction Steps

1. Open the app and start a spelling session.
2. Advance to a word prompt that should be spoken aloud.
3. Listen for the TTS playback.
4. Repeat across several prompts or retry the same flow after a refresh.
5. Observe that playback sometimes works and sometimes does not.

## Expected Behavior
Each spelling prompt should reliably play the spoken word whenever the session requests TTS playback.

## Actual Behavior
The spoken prompt sometimes fails to play at all, despite the same feature having worked earlier. The failure appears intermittent rather than fully broken.

## Impact
- Children may be blocked from completing a spelling attempt when they cannot hear the prompted word.
- The intermittent nature makes the bug hard to predict and undermines trust in the session flow.
- If left unfixed, the app's core learning loop becomes unreliable.

## Root Cause

The spelling session currently triggers TTS playback more than once for the same prompt. In `app/pages/profile/[id]/session.vue`, `replayWord()` is called directly after session creation and after correct answers, while a watcher on `session.value?.currentPrompt.wordId` also calls `replayWord()` for the same prompt change.

Because `speakWord()` in `app/composables/usePromptVoice.ts` always calls `window.speechSynthesis.cancel()` before `window.speechSynthesis.speak()`, the second playback attempt can immediately cancel the first one. Browser speech synthesis is sensitive to this timing, so the replacement utterance may be dropped or fail intermittently.

A secondary contributing factor is that the first prompt is auto-played during page startup rather than from a fresh explicit user action, which may run into browser speech/audio gating on some devices.

Location: `app/pages/profile/[id]/session.vue:47`

Location: `app/pages/profile/[id]/session.vue:92`

Location: `app/pages/profile/[id]/session.vue:116`

Location: `app/composables/usePromptVoice.ts:14`

## Solution Approach

**Chosen**: Investigate and harden the full TTS playback path, starting from the spelling session trigger through the browser or service-level speech output.

**Chosen**: Remove duplicate playback triggers for the same prompt and make TTS invocation resilient to browser speech synthesis timing.

**Reasoning**:
- The current failure mode aligns with duplicate prompt playback and cancellation races in the existing code.
- Fixing the trigger flow is lower risk than replacing the TTS mechanism entirely.
- We can keep the existing browser TTS approach while making playback more deterministic.

**Rejected alternatives**:
- Replace browser TTS entirely: Rejected because the current issue is more likely caused by local playback orchestration than by the API choice itself.
- Keep duplicate triggers and only tune speech settings: Rejected because rate, pitch, or voice selection do not address the underlying cancellation race.

## Code Changes

| File | Change | Description |
|------|--------|-------------|
| `app/pages/profile/[id]/session.vue` | Modify | Remove duplicate `replayWord()` calls so each prompt is spoken once |
| `app/composables/usePromptVoice.ts` | Modify | Guard speech cancellation and playback sequencing to avoid dropped utterances |
| `tests/*` | Add or Modify | Add regression coverage for prompt playback trigger behavior if feasible |

## Edge Cases
- First playback after page load or app launch
- Replay behavior after one prompt succeeds and the next prompt fails
- Manual replay should still interrupt current speech cleanly when the child taps replay
- Browser autoplay or audio permission restrictions
- Rapid navigation between prompts or repeated playback requests
- Behavior across desktop and mobile devices
