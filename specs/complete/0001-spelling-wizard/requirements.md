# Spelling Wizard

## Summary

Spelling Wizard is a bright, cheerful Nuxt.js web app that helps grade-school children practice spelling through spoken word prompts, personalized repetition, and playful rewards. The app supports multiple child profiles, age-aware vocabulary selection, independent history tracking, and a progression system built around points, levels, ranks, art, and sound, with family data stored on a household server.

## Problem Statement

Families need a spelling practice tool that feels fun enough for children to use repeatedly while still adapting to each child's current skill level. Generic spelling drills often use one-size-fits-all word lists, provide little motivation, and do not separate progress for multiple children in the same household. Without a personalized and engaging system, children may get bored, frustrated, or spend too much time on words that are far too easy or too hard.

## User Stories

- As a parent, I want to create separate child profiles with birthdates and avatars, so that each child gets age-appropriate practice and their own saved progress.
- As a child, I want to hear a word aloud and type the spelling with up to three chances, so that I can practice independently and learn from mistakes.
- As a child, I want to earn points, levels, rewards, and ranks, so that spelling practice feels exciting and motivating.
- As a parent, I want the app to repeat difficult words more often and mastered words less often, so that practice time focuses on the right challenge level.
- As a family, I want a fun, bright experience with art and sounds, so that the app feels playful rather than like a worksheet.

## Functional Requirements

- [ ] **REQ-001**: The system must provide a profile picker that supports creating, selecting, editing, and deleting multiple child profiles on the same device.
- [ ] **REQ-002**: Each child profile must store at minimum a display name, birthdate, profile picture, current total points, current level, current rank, reward history, and spelling test history.
- [ ] **REQ-003**: The system must require a birthdate when creating a child profile and use it to determine an age-aware target vocabulary range.
- [ ] **REQ-004**: The system must allow a child or parent to set or update a profile picture for each child profile.
- [ ] **REQ-005**: The system must maintain a large word catalog with metadata that supports age-band and difficulty-aware word selection.
- [ ] **REQ-006**: When a child starts a spelling session, the system must present one spoken word at a time and allow the child to request the word audio again.
- [ ] **REQ-007**: The system must allow keyboard-based word entry and submission for each prompted word.
- [ ] **REQ-008**: The system must allow up to three attempts per prompted word before ending that word and moving to the next prompt.
- [ ] **REQ-009**: The system must award 3 points for a first-attempt correct answer, 2 points for a second-attempt correct answer, 1 point for a third-attempt correct answer, and 0 points if the child does not answer correctly in three attempts.
- [ ] **REQ-010**: The system must let a child continue spelling words for as long as they want during a session until they choose to stop.
- [ ] **REQ-011**: The system must track every prompted word, every attempt, awarded points, and session totals in the selected child profile's history.
- [ ] **REQ-012**: The system must increase a child profile's level every time that child accumulates 100 new points.
- [ ] **REQ-013**: The system must award 100 Robux for each standard level-up.
- [ ] **REQ-014**: The system must treat every third achieved level as a rank milestone and award 300 Robux for that milestone instead of the standard 100 Robux payout.
- [ ] **REQ-015**: The system must assign a fixed named rank progression that culminates in a final rank of `Wizard`.
- [ ] **REQ-017**: The system must calculate per-child, per-word mastery signals from recent attempts and use them to reduce the frequency of mastered words.
- [ ] **REQ-018**: The system must increase the likelihood of resurfacing words that a child misses or only solves after multiple attempts.
- [ ] **REQ-019**: The system must reduce the likelihood of choosing words from age bands that are meaningfully below or above the child's target age range.
- [ ] **REQ-020**: The adaptive word selection must still preserve session variety and avoid excessive immediate repetition of the same word.
- [ ] **REQ-021**: The system must present a child-facing dashboard that shows current points, level, rank, recent rewards, and access to start a new spelling session.
- [ ] **REQ-022**: The system must present spelling feedback after each attempt in a child-friendly way, including success, remaining chances, and the correct spelling after the third failed attempt.
- [ ] **REQ-023**: If a child misses all three attempts for a word, the system must reveal the correct spelling and require the child to type that correct spelling before moving to the next prompt.
- [ ] **REQ-024**: The interface must include fun art and playful sound effects for key moments such as correct answers, level-ups, rank-ups, and rewards.
- [ ] **REQ-025**: The interface must use a bright, cheerful visual design with a clearly defined color scheme and large child-friendly touch targets.
- [ ] **REQ-026**: The system must store profile data, history, rewards, and word progress on a household server rather than in browser-only local storage.
- [ ] **REQ-027**: The system must preserve child data across browser refreshes, later visits, and multiple household devices connected to the same server.

## Non-Functional Requirements

- **Performance:** Primary interactions such as profile selection, starting a session, submitting an answer, and advancing to the next word should feel responsive and complete within 300 ms excluding audio playback startup.
- **Usability:** The experience must be easy for grade-school children to use independently, with large controls, clear copy, low reading burden, and keyboard-first answer entry.
- **Accessibility:** The app must support readable contrast, visible focus states, captions or text equivalents for spoken prompts, and motion/sound that can be reduced or muted.
- **Reliability:** A browser refresh or accidental tab close must not lose saved profiles, points, rewards, or recorded history once an action has been confirmed by the UI and persisted to the household server.
- **Compatibility:** The MVP must support current desktop and tablet browsers that Nuxt supports, with layouts that work well on common iPad and laptop widths.
- **Privacy:** Child profile data must remain within the household server environment in the MVP unless a future external sync feature is explicitly added.
- **Network Behavior:** The app must handle temporary home-network interruptions gracefully, including clear save/retry states when the household server is unavailable.
- **Maintainability:** Vocabulary, rank names, reward rules, and art/audio assets should be organized so they can be extended without rewriting core session logic.

## Acceptance Criteria

- [ ] **AC-001**: A parent can create at least two child profiles, each with a unique name, birthdate, and profile picture, and each profile maintains separate progress and history.
- [ ] **AC-002**: Selecting a child profile opens a dashboard showing that child's current points, level, rank, and a clear action to start a spelling session.
- [ ] **AC-003**: During a spelling session, the child hears one word at a time, types an answer with the keyboard, and can make up to three attempts before the app advances.
- [ ] **AC-004**: The scoring engine awards 3, 2, 1, or 0 points exactly according to the attempt on which the child spells the word correctly.
- [ ] **AC-005**: After a child gains 100 points, the app records a level-up reward of 100 Robux; at every third level milestone, the app records a rank-up reward of 300 Robux instead.
- [ ] **AC-006**: The rank ladder is fixed for the product and ends with the rank name `Wizard`.
- [ ] **AC-007**: The same child receives difficult or recently missed words more often than mastered words over time, while the system still avoids repeating the same prompt too aggressively.
- [ ] **AC-008**: A younger child profile and an older child profile receive noticeably different mixes of words based on age-appropriate vocabulary targeting.
- [ ] **AC-009**: Refreshing the browser preserves existing child profiles, accumulated points, reward history, and prior spelling session data retrieved from the household server.
- [ ] **AC-010**: If a child misses a word three times, the app reveals the correct spelling and blocks advancement until the child types that word correctly.
- [ ] **AC-011**: The app presents a bright, cheerful UI with art, playful sounds, and accessible controls that work on desktop and tablet screen sizes.
- [ ] **AC-012**: A child can use one supported household device, then switch to another supported household device connected to the same home server and see the same profile progress and history.

## Out of Scope

- Parent or child cloud accounts outside the household server environment.
- Real-money Robux fulfillment or direct Roblox platform integration.
- Multiplayer play between children.
- Teacher classrooms, school administration, or district reporting.
- Full offline-first packaging beyond the standard browser cache behavior of the initial MVP.
- Professionally commissioned custom illustration or voice acting as a launch blocker.

## Assumptions

- The first release is a Nuxt.js web app optimized for desktop and tablet browsers.
- The household has a reachable home server environment available to host the app backend and database.
- Spoken word playback can initially rely on browser-supported text-to-speech or a similar local playback mechanism.
- A seed vocabulary dataset can be curated and expanded over time without requiring a complete linguistic corpus before launch.
- Reward amounts are tracked in-app as motivational values and may later be redeemed manually by a parent outside the app.

## Dependencies

- **Internal:** Initial Nuxt.js project setup, server API layer, household database, profile management, session engine, adaptive word selection engine, and asset pipeline for art/audio.
- **External:** Browser support for audio playback and keyboard input; optional browser support for text-to-speech APIs; image upload or selection support for profile pictures; reachable home-network server environment.
- **Blocked by:** Creation of the initial word catalog structure, reward/rank configuration, server-side data model for child profiles and spelling history, and deployment target on the household server.
