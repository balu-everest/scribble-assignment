# Tasks: Game Result, Restart & Final Validation

**Input**: Design documents from `specs/005-game-result-restart/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/, quickstart.md

**Tests**: Backend unit tests are included for the new `restartRoom()` service logic (state transition validation, host gating, score/guess reset). The verification checklist in the final phase serves as end-to-end validation.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `backend/src/`, `frontend/src/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [ ] T001 Verify current git branch is `005-game-result-restart` and all previous feature tests pass

**Checkpoint**: Ready to begin implementation

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core type extension required before any user story

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T002 Extend RoomStatus type to include `"result"` in `backend/src/models/game.ts`

**Checkpoint**: Foundation ready — the `'result'` state exists across the system

---

## Phase 3: User Story 1 - Correct Guess Ends the Game and Shows Results (Priority: P1) 🎯 MVP

**Goal**: When a correct guess is submitted, the room transitions from `'active'` to `'result'`. All participants automatically navigate to a Result Screen.

**Independent Test**: Start a game as host, submit a correct guess as a guesser in another tab. Verify all participants' screens transition to the Result Screen within 3 seconds, and further guesses are rejected.

### Implementation for User Story 1

- [ ] T003 [US1] Update `submitGuess()` in `backend/src/services/roomStore.ts` to set `room.status = "result"` when a correct guess is processed
- [ ] T004 [US1] Update guess rejection error message for rooms in `"result"` state in `backend/src/services/roomStore.ts`
- [ ] T005 [P] [US1] Update `RoomSnapshot` type on frontend to include `"result"` in `frontend/src/services/api.ts`
- [ ] T006 [P] [US1] Add room status change observation in frontend room store at `frontend/src/state/roomStore.ts`
- [ ] T007 [US1] Create `PollingRouter` component that auto-navigates to `/result` when status becomes `"result"` in `frontend/src/components/PollingRouter.tsx`
- [ ] T008 [US1] Mount `PollingRouter` in the app layout so status changes are detected on all screens

**Checkpoint**: Submitting a correct guess triggers result state and routes all participants to `/result`

---

## Phase 4: User Story 2 - Players See the Final Scoreboard and Winner on the Result Screen (Priority: P1)

**Goal**: The Result Screen displays all players' final scores and clearly highlights the winner(s).

**Independent Test**: Force the backend into `"result"` state (or submit a correct guess), then navigate to `/result`. Verify all players' names and scores are displayed, the highest-scoring player is visually distinct, and tied winners are all highlighted. Verify the zero-score case shows "No correct guesses" message.

### Implementation for User Story 2

- [ ] T009 [P] [US2] Create `ResultScreen` page component at `frontend/src/pages/ResultScreen.tsx` that reads room state and renders all participants with scores
- [ ] T010 [US2] Add `/result` route in the app router configuration
- [ ] T011 [US2] Implement winner highlight logic on Result Screen — find max score, apply visual distinction to player(s) with that score
- [ ] T012 [US2] Implement zero-score message ("No correct guesses were made") and non-host waiting message ("Waiting for host to restart the game...") on Result Screen per FR-014 and clarification

**Checkpoint**: Result Screen shows all data correctly with winner highlighted and appropriate messages for all states

---

## Phase 5: User Story 3 - Host Restarts the Game from the Result Screen (Priority: P1)

**Goal**: The host can restart the game with a single action. The room resets to lobby, guesses cleared, scores zeroed, players preserved.

**Independent Test**: As host on the Result Screen, click the restart button. Verify the room transitions to `"lobby"`, participant list unchanged, guess log empty, all scores at 0. Verify non-host and wrong-state restart attempts are rejected.

### Backend Tests for User Story 3

- [ ] T013 [P] [US3] Write unit tests for `restartRoom()` in `backend/src/services/roomStore.test.ts`: successful restart resets all state (status, scores, guesses), preserves participant list, rejects non-host with 403, rejects wrong-state (lobby/active) with 409, returns 404 for missing room

### Implementation for User Story 3

- [ ] T014 [US3] Add `restartRoom` Zod schema in `backend/src/api/schemas.ts`
- [ ] T015 [P] [US3] Implement `restartRoom()` service method in `backend/src/services/roomStore.ts` with host validation, state validation, score/guess reset, and player preservation
- [ ] T016 [US3] Add `POST /rooms/:code/restart` route handler in `backend/src/api/rooms.ts`
- [ ] T017 [P] [US3] Add `restartRoom()` API call method in `frontend/src/services/api.ts`
- [ ] T018 [US3] Add `restartRoom()` action to frontend room store at `frontend/src/state/roomStore.ts`
- [ ] T019 [US3] Wire restart button on Result Screen — visible only for host, calls `roomStore.restartRoom()` on click

**Checkpoint**: Host can restart the game, all backend state resets correctly. Non-host and wrong-state attempts fail.

---

## Phase 6: User Story 4 - All Participants Automatically Return to Lobby After Restart (Priority: P2)

**Goal**: When the host restarts, the frontend detects `"lobby"` state and routes all participants back to the Lobby screen. The drawer's canvas is wiped blank.

**Independent Test**: After a host restart, verify all participants navigate to the Lobby screen within 3 seconds. Verify the drawer's canvas is blank with no leftover drawings.

### Implementation for User Story 4

- [ ] T020 [US4] Extend `PollingRouter` to auto-navigate to `/lobby` when room status becomes `"lobby"` in `frontend/src/components/PollingRouter.tsx`
- [ ] T021 [US4] Clear drawing canvas on return to Lobby screen in `frontend/src/pages/LobbyScreen.tsx` (or via the `DrawingCanvas` component clearing itself when status leaves `"active"`)

**Checkpoint**: After restart, all participants return to Lobby and canvas is clean

---

## Phase 7: Polish & Verification

**Purpose**: Run the full verification checklist to confirm all scenarios work end-to-end

- [ ] T022 Run backend type check: `cd backend && npx tsc --noEmit`
- [ ] T023 Run frontend type check: `cd frontend && npx tsc -b`
- [ ] T024 Run existing backend tests: `cd backend && npm test`
- [ ] T025 Run existing frontend tests: `cd frontend && npm test`
- [ ] T026 Verify `GET /health` returns `{ ok: true }`
- [ ] T027 Execute multi-tab verification flow: start → guess → result → restart → lobby → canvas blank

**Checkpoint**: All validation checks pass, complete feature verified end-to-end

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS all user stories
- **User Stories (Phase 3-6)**: All depend on Foundational phase completion
  - US1 (Phase 3) → US2 (Phase 4) → US3 (Phase 5) → US4 (Phase 6)
  - Sequential in priority order (P1 → P2)
- **Polish (Phase 7)**: Depends on all user stories being complete

### User Story Dependencies

- **US1 (P1)**: No story dependencies — can start after Foundational
- **US2 (P1)**: No story dependencies — Result Screen can be built/tested with mock room state
- **US3 (P1)**: No story dependencies — restart endpoint can be built/tested independently via curl/API calls
- **US4 (P2)**: Depends on US3 (restart triggers lobby transition) and US1 (routing infrastructure)

### Within Each User Story

- Pick tasks marked [P] first (no internal dependencies)
- Core implementation before integration
- Story complete before moving to next

### Parallel Opportunities

- All [P] tasks within each phase can run in parallel
- Backend tasks and frontend tasks for the same story are often [P] (different directories)

---

## Parallel Example: User Story 1

```bash
# Run in parallel (different files):
Task: "Update submitGuess() to set room.status = result"
Task: "Update RoomSnapshot type for 'result' status"
Task: "Add room status change detection in roomStore"
```

## Parallel Example: User Story 3

```bash
# Run in parallel (different files):
Task: "Implement restartRoom service method"
Task: "Add restartRoom API call"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001)
2. Complete Phase 2: Foundational (T002)
3. Complete Phase 3: User Story 1 (T003-T008)
4. **STOP and VALIDATE**: Correct guess → state transition → all see Result Screen
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → type ready
2. Add US1 (correct guess → result transition & routing) → Test → Deploy
3. Add US2 (Result Screen scoreboard with winner) → Test → Deploy
4. Add US3 (host restart endpoint & button) → Test → Deploy
5. Add US4 (lobby auto-return & canvas wipe) → Test → Deploy
6. Each story adds value without breaking previous stories
