# Clearer Word Enunciation

## Summary

This feature makes spoken word prompts easier for children to understand during a Spelling Session. It adds slower, clearer default voice playback, stores a separate enunciation version for each word in the Word Catalog, and introduces an `enunciate` action that plays the clearer version on demand.

## Problem Statement

Some spoken prompts are too fast or too blended for early spellers to hear each sound clearly. When a child cannot distinguish the spoken word, the session measures listening difficulty rather than spelling ability, which can lead to frustration and incorrect attempts. Without a clearer playback mode, caregivers and children have no reliable way to request more deliberate pronunciation for challenging words.

## User Stories

- As a child in a Spelling Session, I want the default spoken prompt to be slower and clearer, so that I can understand the word more easily.
- As a child in a Spelling Session, I want an `enunciate` button, so that I can hear a more deliberate pronunciation when I am unsure what was said.
- As a caregiver, I want each spelling word to have an intentionally spaced enunciation version, so that playback is consistently helpful across the Word Catalog.

## Functional Requirements

- [ ] **REQ-001**: The system must update default word playback settings to produce slower, clearer speech than the current prompt voice configuration.
- [ ] **REQ-002**: The system must preserve the existing primary word prompt flow while using the updated default playback settings for standard word playback.
- [ ] **REQ-003**: The system must store an enunciation version for each playable word in the Word Catalog.
- [ ] **REQ-004**: The enunciation version must represent the same target word as the standard prompt while including intentional pauses or spacing that make the pronunciation easier to distinguish.
- [ ] **REQ-005**: The system must provide an `enunciate` button in the spelling interface for words that can be spoken aloud.
- [ ] **REQ-006**: When the `enunciate` button is pressed, the system must play the enunciation version of the current word instead of replaying the standard prompt.
- [ ] **REQ-007**: The `enunciate` action must be available without changing the child’s current spelling attempt, score state, or progress within the Spelling Session.
- [ ] **REQ-008**: If a word is missing an enunciation version, the system must handle the request gracefully without crashing or blocking the session.

## Non-Functional Requirements

- Performance: Standard playback and `enunciate` playback must begin quickly enough that the interaction feels responsive during a live Spelling Session.
- Reliability: Playback failures must not break the current Spelling Session or erase the child’s in-progress answer.
- Compatibility: The feature must work anywhere the current spoken word playback is supported.
- Usability: The `enunciate` control must be understandable to a child and easy to activate during normal session flow.

## Acceptance Criteria

- [ ] **AC-001**: During a Spelling Session, the default spoken prompt uses updated voice settings that are noticeably slower and clearer than the previous configuration.
- [ ] **AC-002**: A word entry used in a Spelling Session includes both its standard prompt form and an enunciation version that preserves the same answer word.
- [ ] **AC-003**: The spelling interface displays an `enunciate` button while a word prompt is active.
- [ ] **AC-004**: Pressing `enunciate` plays the enunciation version of the active word and does not submit, reset, or otherwise alter the current spelling attempt.
- [ ] **AC-005**: If enunciation playback is unavailable for a word, the session remains usable and does not crash.

## Out of Scope

- Recording custom human voice audio for words
- Adding multiple pronunciation styles beyond the standard prompt and enunciation version
- Redesigning the broader spelling session layout beyond the new `enunciate` control
- Changing scoring, mastery, or adaptive word selection behavior

## Assumptions

- The existing app already has a standard spoken playback mechanism for word prompts.
- The Word Catalog can be extended to store additional per-word speech data or derived text for playback.
- The `enunciate` action will reuse the existing audio playback pipeline rather than introducing a separate media subsystem.
- Caregivers and children benefit from a single consistent enunciation behavior across all supported words.

## Dependencies

- Internal: Current Spelling Session playback flow and spelling interface components
- Internal: Word Catalog storage and loading pipeline
- External: The speech generation or text-to-speech capability currently used for spoken word playback
- Blocked by: Availability of a reliable format for representing enunciation text or speech input per word
