# Robux Disbursement Tracking

## Summary

This feature adds a caregiver-facing admin page for recording how many Robux were actually given to a child after a reward was earned. It also adds a reward balance summary to each child's profile so the household can see total rewarded Robux, total disbursed Robux, and the remaining undispatched balance at a glance.

## Problem Statement

The app currently records when a child earns Robux through spelling progress, but it does not track how much of that earned amount has actually been handed to the child. That makes it difficult for a caregiver to answer simple bookkeeping questions like "the app says 100 were earned, but how many have I already given out?" Without a separate disbursement record, the profile page cannot show a reliable remaining balance.

## User Stories

- As a caregiver, I want an admin page where I can record Robux that I have actually given to a child, so that I can keep my own household bookkeeping straight.
- As a caregiver, I want to record partial disbursements multiple times for the same child, so that I can hand out earned Robux in more than one step.
- As a caregiver, I want the child's profile to show total rewarded Robux and the remaining undispatched balance, so that I can see what is still left to give.
- As a caregiver, I want the admin page to show the existing disbursement history for a child, so that I can verify what I have already recorded.

## Functional Requirements

- [ ] **REQ-001**: The system must provide an admin page for recording Robux disbursements for a child without starting or modifying a spelling session.
- [ ] **REQ-002**: The admin page must allow a caregiver to select a child profile and record a positive whole-number Robux amount as actually given to that child.
- [ ] **REQ-003**: The admin page must store each disbursement as a separate entry with the child profile, amount, and timestamp.
- [ ] **REQ-004**: The admin page must display the current earned Robux total, already disbursed Robux total, and remaining undispatched balance for the selected child.
- [ ] **REQ-005**: The admin page must display the recorded disbursement history for the selected child.
- [ ] **REQ-006**: The system must reject negative amounts, zero, non-integer amounts, and attempts to disburse more Robux than the current undispatched balance.
- [ ] **REQ-007**: The child's profile page must display the total rewarded Robux, total disbursed Robux, and remaining undispatched balance.
- [ ] **REQ-008**: The reward balance shown on the profile must be derived from persisted reward and disbursement records rather than manually edited totals.
- [ ] **REQ-009**: Recording a disbursement must not change the child's points, level, rank, spelling history, or existing reward events.

## Non-Functional Requirements

- Usability: The admin page must make it obvious which child is selected and how much balance remains before the caregiver submits a new disbursement.
- Reliability: A bad or missing disbursement entry for one child must not break other profiles or the profile dashboard.
- Compatibility: The new profile summary and admin page must work within the current browser-based Nuxt app.
- Security: The mutation route must validate all submitted amounts on the server and should not trust client-side calculations.

## Acceptance Criteria

- [ ] **AC-001**: Visiting the admin reward page shows a selectable list of child profiles and the selected child's reward balance summary.
- [ ] **AC-002**: Recording `80` Robux for a child who has `100` Robux undispatched results in a remaining undispatched balance of `20`.
- [ ] **AC-003**: The admin page shows prior disbursement entries for the selected child after they are recorded.
- [ ] **AC-004**: The system rejects invalid disbursement amounts, including negative numbers, `0`, decimals, and amounts larger than the current remaining balance.
- [ ] **AC-005**: The profile dashboard shows total rewarded Robux and remaining undispatched Robux for the child.
- [ ] **AC-006**: Recording or viewing disbursements does not alter spelling session progress, points totals, levels, rank history, or reward events.

## Out of Scope

- Editing or deleting previously recorded disbursement entries
- Linking a disbursement to a specific earned reward event
- Automatic payouts to external accounts or Roblox integrations
- Changing how reward events are earned by spelling sessions
- Authentication or authorization changes beyond the current local caregiver workflow

## Assumptions

- The existing reward events table remains the source of truth for Robux that the app has earned.
- Manual disbursements can be modeled as a separate append-only ledger of Robux actually handed to a child.
- The profile dashboard already has the right place to surface a small reward summary card or stat block.
- No additional seed rows are required for disbursement history, but the local schema setup and seed/reset scripts must be updated to create the new storage shape.

## Dependencies

- Internal: SQLite storage layer and database migration path
- Internal: Existing profile dashboard API and dashboard view model
- Internal: Existing profile page UI and admin routing patterns
- Internal: Local reset/seed scripts that initialize the development database
