# Admin Words Pronunciation Review

## Summary

This feature adds an `/admin/words` page where a caregiver can review the full Word Catalog and test how each word sounds in both standard pronunciation and enunciation modes. It gives the household a fast way to spot unclear speech output, missing enunciation data, or word entries that need cleanup before a child encounters them in a Spelling Session.

## Problem Statement

The app can already speak words during a Spelling Session, but there is no dedicated place to inspect the whole Word Catalog outside active gameplay. That makes it slow to verify pronunciation quality, compare standard playback against enunciation playback, or find words with bad or missing speech data. Without an admin review surface, caregivers must wait until a child encounters a problem during a session before they can detect it.

## User Stories

- As a caregiver, I want an `/admin/words` page, so that I can inspect the full Word Catalog from one place.
- As a caregiver, I want to play the standard pronunciation for any word, so that I can hear what a child will hear during normal prompts.
- As a caregiver, I want to play the enunciation version for any word, so that I can compare the clearer speech form against the normal prompt.
- As a caregiver, I want to see when a word cannot be enunciated, so that I can identify catalog entries that need attention.

## Functional Requirements

- [ ] **REQ-001**: The system must provide an `/admin/words` page that lists Word Catalog entries outside the normal Spelling Session flow.
- [ ] **REQ-002**: The `/admin/words` page must display, for each listed word, the canonical word text and enough metadata to identify the entry during review.
- [ ] **REQ-003**: The `/admin/words` page must allow a caregiver to trigger standard pronunciation playback for an individual word using the same spoken prompt behavior used for standard word playback.
- [ ] **REQ-004**: The `/admin/words` page must allow a caregiver to trigger enunciation playback for an individual word when valid enunciation data exists.
- [ ] **REQ-005**: The system must clearly indicate when a word lacks valid enunciation data and prevent that state from crashing or blocking the page.
- [ ] **REQ-006**: The page must support reviewing the complete Word Catalog without requiring a caregiver to start or modify a Spelling Session.
- [ ] **REQ-007**: The page must make it practical to locate a specific word within the full catalog during review.
- [ ] **REQ-008**: Triggering pronunciation or enunciation playback from `/admin/words` must not mutate child progress, scoring, rewards, or session history data.

## Non-Functional Requirements

- Performance: The `/admin/words` page must load quickly enough to feel usable with the full current Word Catalog, and playback actions must begin responsively.
- Reliability: Invalid or missing enunciation data for one word must not break the rest of the page.
- Usability: A caregiver must be able to understand which control plays standard pronunciation versus enunciation without guesswork.
- Compatibility: The page must work anywhere the current browser-based prompt speech playback is supported.

## Acceptance Criteria

- [ ] **AC-001**: Visiting `/admin/words` shows a browsable list of Word Catalog entries without starting a Spelling Session.
- [ ] **AC-002**: A caregiver can trigger standard pronunciation playback for an individual listed word and hear the standard prompt voice behavior.
- [ ] **AC-003**: A caregiver can trigger enunciation playback for a word with valid enunciation data and hear the alternate clearer speech form.
- [ ] **AC-004**: A word without valid enunciation data is clearly marked and does not cause the page to fail.
- [ ] **AC-005**: Using the `/admin/words` page does not create or modify session, attempt, reward, or word progress records.
- [ ] **AC-006**: A caregiver can narrow the list enough to quickly find a specific word in the catalog.

## Out of Scope

- Editing, creating, or deleting Word Catalog entries from the admin page
- Uploading custom audio recordings for words
- Bulk content management workflows beyond browsing and playback testing
- Changes to child-facing Spelling Session controls or layout

## Assumptions

- The current app can already speak a word in both standard and enunciation modes in the browser.
- The full Word Catalog is available to the app without needing an external content service.
- The household app does not currently require a separate authentication system for local caregiver-only routes.
- A simple filter or search interaction is sufficient for locating words in the current catalog size.

## Dependencies

- Internal: Word Catalog data model and existing enunciation validation helpers
- Internal: Current browser speech playback composable and app speech configuration
- Internal: App routing and page rendering for a new `/admin/words` route
- Blocked by: Availability of word-level data needed to display playback readiness and identifying metadata
