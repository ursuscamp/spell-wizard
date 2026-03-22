# Simplify Guessing UI

## Summary

This feature simplifies the spelling session guessing screen by removing the side sparkle session log panel. The session experience should focus on the active word prompt, answer entry, and core progress feedback without the extra sidebar content.

## Problem Statement

The current guessing UI includes a side panel labeled as a sparkle session log, but it behaves more like a mixed information sidebar with scoring guidance, adaptive practice copy, and turn-based reward feedback. This splits attention away from the main spelling task, adds visual weight to the session layout, and makes the core interaction feel busier than necessary.

## User Stories

- As a child in a spelling session, I want the guessing screen to focus on the current word and my answer so that it feels simpler and easier to use.
- As a returning player, I want the session layout to emphasize progress and attempts without an extra side panel so that I can stay focused on spelling.
- As a parent reviewing the product, I want the session screen to feel cleaner and less cluttered so that the experience appears more intentional and approachable.

## Functional Requirements

- [ ] **REQ-001**: The spelling session guessing screen must remove the side sparkle session log panel from the in-session layout.
- [ ] **REQ-002**: The main guessing flow must continue to support the current prompt, answer entry, submit actions, spoken prompt replay, attempt feedback, and progress display.
- [ ] **REQ-003**: The updated session layout must remain usable and visually balanced on both mobile and desktop screen sizes after the side panel is removed.
- [ ] **REQ-004**: Removing the side panel must not change scoring rules, attempt limits, correction behavior, reward calculation, or adaptive word selection behavior.
- [ ] **REQ-005**: If any information from the removed panel is still required for the active turn, it must be presented within the primary session experience instead of a separate side panel.

## Non-Functional Requirements

- **Usability:** The updated screen should reduce distraction and keep the main spelling interaction as the clear visual priority.
- **Compatibility:** The simplified layout must work across the supported browsers and device sizes already supported by the session page.
- **Reliability:** Existing spelling session behavior and data recording must continue to function unchanged.
- **Performance:** Removing the side panel must not introduce slower rendering or regressions in session responsiveness.

## Acceptance Criteria

- [ ] **AC-001**: When a user opens the spelling session guessing screen, the sparkle session log sidebar is no longer shown.
- [ ] **AC-002**: When a user plays through a spelling session, they can still hear the prompt, enter guesses, submit attempts, and receive normal correctness or correction feedback.
- [ ] **AC-003**: When a user views the guessing screen on desktop, the layout no longer reserves space for the removed sidebar and the main session content uses the available space cleanly.
- [ ] **AC-004**: When a user views the guessing screen on mobile, the simplified layout remains readable, usable, and free of empty sidebar-related spacing.
- [ ] **AC-005**: After the UI change, session scoring, rewards, adaptive practice behavior, and stored spelling session history continue to work as before.

## Out of Scope

- Reworking the spelling session rules, scoring system, or adaptive practice logic.
- Changing backend session storage or prompt history persistence.
- Designing a new dedicated session history or analytics view.
- Redesigning unrelated profile, dashboard, or results screens.

## Assumptions

- The requested change is to remove the current sidebar UI, not to replace it with a new live activity log in this spec.
- The main guessing screen already contains the primary controls needed to complete a spelling session.
- Any retained reward or status feedback can be incorporated into the main session area if needed.

## Dependencies

- **Internal:** Existing spelling session page layout and components used for prompt playback, answer submission, progress display, and reward feedback.
- **External:** None expected.
- **Blocked by:** No known blockers.
