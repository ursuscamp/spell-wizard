# Robux Disbursement Tracking - Implementation Tasks

## Overview

Build a caregiver admin page that records actual Robux disbursements against earned rewards, then surface the computed reward balance on each child's profile dashboard. The work touches storage, shared types, API routes, the admin UI, and the profile summary.

## Backend

- [ ] **1.** Add persisted reward disbursement support to the storage layer and shared types.  
  - [ ] **1.1** Extend `shared/spelling.ts` with a `RewardDisbursement` model and a reward summary type for computed totals.
  - [ ] **1.2** Update `server/utils/storage.ts` to load, persist, and migrate the new disbursement ledger table.
  - [ ] **1.3** Update the schema setup in `scripts/local-test-data.mjs` so reset/seed flows create the new table without adding seed rows.

- [ ] **2.** Add server-side summary and mutation endpoints for reward disbursements.  
  - [ ] **2.1** Extend the dashboard builder in `server/utils/dashboard.ts` so it returns earned, disbursed, and remaining totals for a profile.
  - [ ] **2.2** Add an admin rewards GET endpoint that returns profiles plus their balance summaries and recent disbursements.
  - [ ] **2.3** Add an admin rewards POST endpoint that validates positive whole-number amounts and rejects over-disbursement.

- [ ] **3.** Keep existing profile reads aligned with the new summary data.  
  - [ ] **3.1** Update the dashboard API and shared `DashboardView` shape to include the reward summary needed by the profile page.
  - [ ] **3.2** Confirm profile delete/reset flows continue to remove or ignore the new ledger entries consistently.

## Frontend

- [ ] **4.** Build the admin rewards page UI.  
  - [ ] **4.1** Add a new `/admin/rewards` page with child selection, balance summary, amount entry, and submit action.
  - [ ] **4.2** Render recent disbursement history for the selected child and show inline validation or error states.
  - [ ] **4.3** Keep the page visually consistent with the existing admin areas and profile cards.

- [ ] **5.** Surface the reward balance on the profile dashboard.  
  - [ ] **5.1** Update `/profile/[id]` to show total rewarded Robux and remaining undispatched Robux.
  - [ ] **5.2** Include total disbursed Robux somewhere in the summary so the balance is easy to verify.

## Testing

- [ ] **6.** Add source-level tests for the new reward balance behavior.  
  - [ ] **6.1** Cover the summary calculation so total rewarded, total disbursed, and remaining undispatched values stay consistent.
  - [ ] **6.2** Cover the storage shape or API contracts with pure unit or structure tests only, avoiding any server spawn or local port binding.

## Completion Summary

| Area | Status | Notes |
| --- | --- | --- |
| Backend | Not started | Storage, summaries, and mutation endpoints still need implementation |
| Frontend | Not started | Admin rewards page and dashboard summary still need implementation |
| Testing | Not started | Add source-level coverage for summary math and contract shape |
