# Tasks: Gameplay Interaction

**Input**: Design documents from `specs/004-gameplay-interaction/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Deterministic game logic tests included in Foundational phase per constitution requirement. Verification checks in final phase.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `backend/src/`, `frontend/src/`
- Paths reflect monorepo structure per plan.md

---

## Phase 1: Setup (Shared Infrastructure)

Project already initialized from prior features. No setup tasks needed.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Backend model extensions, guess endpoint, API client wiring, and deterministic game logic tests. MUST be complete before any user story can be implemented.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T004 Extend `Participant` with `score: number` and add `Guess` interface + `guesses: Guess[]` to `Room` + `RoomSnapshot` in `backend/src/models/game.ts`
- [x] T005 Add `submitGuess()` service function to `backend/src/services/roomStore.ts` with validation, trim, case-insensitive matching, +100 scoring, and guess log append
- [x] T006 [P] Add backend unit tests for `submitGuess()` in `backend/src/services/roomStore.test.ts` covering case-insensitive matching (upper, lower, mixed case), +100 points on correct guess, +0 on incorrect guess, rejection of empty/whitespace input, and chronological guess log ordering
- [x] T007 Add `POST /:code/guess` route handler in `backend/src/api/rooms.ts` and `submitGuessSchema` in `backend/src/api/schemas.ts`
- [x] T008 Update `toRoomSnapshot()` in `backend/src/services/roomStore.ts` to include `guesses` array and `score` on each participant
- [x] T009 Add `submitGuess()` method (with 3-retry wrapper) to `frontend/src/services/api.ts`
- [x] T010 Add `submitGuess()` action and `guesses`/`score` fields to `frontend/src/state/roomStore.ts`

**Checkpoint**: Backend guess endpoint functional with deterministic game logic validated by unit tests. Frontend API wired. User stories can now begin.

---

## Phase 3: User Story 1 - Drawer Draws on Interactive Canvas (Priority: P1) 🎯 MVP

**Goal**: The drawer sees an interactive HTML5 canvas and can draw freehand lines via click-and-drag, with a Clear button to wipe the surface.

**Independent Test**: Open the game as a drawer, click-drag on the canvas to produce visible lines, click Clear to wipe.

- [x] T011 [US1] Create `DrawingCanvas.tsx` component in `frontend/src/components/DrawingCanvas.tsx` with HTML5 canvas element, mousedown/mousemove/mouseup handlers for freehand drawing, and a Clear button
- [x] T012 [US1] Update `GamePage.tsx` in `frontend/src/pages/GamePage.tsx` to conditionally render `<DrawingCanvas />` for the drawer or a styled "[Drawer Name] is drawing..." placeholder for guessers

**Checkpoint**: US1 functional — drawer draws, guesser sees placeholder.

---

## Phase 4: User Story 2 - Guesser Submits Guesses with Validation (Priority: P1)

**Goal**: A guesser can type a word, submit it, and see inline error feedback on empty/whitespace guesses or success on valid submission (input clears).

**Independent Test**: View the game as a guesser, submit a valid guess and see it accepted, then submit empty/whitespace and see descriptive rejection.

- [x] T013 [US2] Wire `GuessForm.tsx` in `frontend/src/components/GuessForm.tsx` to call `roomStore.submitGuess()` on submit, add inline error message area near the input, clear input on success, preserve text on failure

**Checkpoint**: US2 functional — guess submission works end-to-end with validation feedback.

---

## Phase 5: User Story 3 - All Players See the Guess Feed Update (Priority: P2)

**Goal**: All participants see a chronological guess history that updates via the existing 2-second polling loop.

**Independent Test**: Submit a guess as a guesser, then observe all participant screens update with the new guess within a few seconds.

- [x] T014 [US3] Update `ResultPanel.tsx` in `frontend/src/components/ResultPanel.tsx` to read `guesses` from room state and render them chronologically (oldest-first) with guesser name, text, timestamp, and a "✓ Correct!" indicator for correct guesses

**Checkpoint**: US3 functional — guess log visible and updating on all screens.

---

## Phase 6: User Story 4 - Correct Guesses Score Points and Update Scoreboard (Priority: P2)

**Goal**: A correct guess awards 100 points, and the scoreboard panel reflects updated scores sorted by rank.

**Independent Test**: Submit the secret word (case-insensitively) and observe the scoreboard update with +100 points on all participant screens.

- [x] T015 [US4] Update `Scoreboard.tsx` in `frontend/src/components/Scoreboard.tsx` to read `participants` from room state and render each player's name and score, sorted descending by score

**Checkpoint**: US4 functional — scoring and scoreboard work end-to-end.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Verify everything works together and all quality gates pass.

- [x] T016 Run verification: `cd backend && npx tsc --noEmit`, `cd frontend && npx tsc -b`, `cd backend && npm test`, `cd frontend && npm test`
- [ ] T017 Multi-tab manual test: drawer draws, guesser sees placeholder, guess submit/reject works, guess log updates on all screens, correct guess awards 100 points on scoreboard, case-insensitive matching verified for all casing variations

---

## Dependencies & Execution Order

### Phase Dependencies

- **Foundational (Phase 2)**: No dependencies — BLOCKS all user stories
- **User Stories (Phase 3-6)**: All depend on Foundational phase completion
  - US1 (Phase 3) → Independently testable after Foundational
  - US2 (Phase 4) → Depends on Foundational (guess endpoint)
  - US3 (Phase 5) → Depends on Foundational (guesses in snapshot)
  - US4 (Phase 6) → Depends on Foundational (scores in snapshot)
- **Polish (Phase 7)**: Depends on all desired user stories being complete

### User Story Dependencies

- **US1 (P1)**: Can start after Foundational — independent, pure frontend
- **US2 (P1)**: Can start after Foundational — independent frontend component update
- **US3 (P2)**: Can start after Foundational — independent frontend component update
- **US4 (P2)**: Can start after Foundational — independent frontend component update

### Parallel Opportunities

- Foundational model + service (T004-T005) → sequential (model before service)
- T006 (tests) runs in parallel with T007-T010 (endpoint + frontend wiring) — tests validate the service function while wiring tasks proceed independently
- All user story phases (US1, US2, US3, US4) can proceed in parallel once Foundational is done, since each updates a different frontend component (DrawingCanvas, GuessForm, ResultPanel, Scoreboard)
- Polish tasks (T016, T017) are sequential — verification then manual test

---

## Parallel Example: User Stories (after Foundational)

```bash
# User Story 1 (DrawingCanvas):
Task: "Create DrawingCanvas component in frontend/src/components/DrawingCanvas.tsx"
Task: "Update GamePage.tsx for conditional canvas/placeholder rendering"

# User Story 2 (Guess Submission):
Task: "Wire GuessForm.tsx to roomStore.submitGuess() with validation feedback"

# User Story 3 (Guess Feed):
Task: "Update ResultPanel.tsx to render chronological guess history from room state"

# User Story 4 (Scoring):
Task: "Update Scoreboard.tsx to render participant scores sorted descending"
```

---

## Implementation Strategy

### MVP First (US1 + US2 Only)

1. Complete Phase 2: Foundational (backend + API wiring + tests)
2. Complete Phase 3: User Story 1 (Drawing Canvas)
3. Complete Phase 4: User Story 2 (Guess Submission)
4. **STOP and VALIDATE**: Drawer can draw, guesser can submit guesses, validation works, unit tests pass
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Foundational → Backend + API + tests ready
2. Add US1 (Drawing Canvas) → Test independently → Deploy/Demo
3. Add US2 (Guess Submission) → Test independently → Deploy/Demo
4. Add US3 (Guess Feed) → Test independently → Deploy/Demo
5. Add US4 (Scoring) → Test independently → Deploy/Demo
6. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. One developer completes Phase 2: Foundational (including unit tests)
2. Once Foundational is done (all backend + API wiring + validated logic):
   - Developer A: US1 (Drawing Canvas)
   - Developer B: US2 (Guess Submission)
   - Developer C: US3 (Guess Feed)
   - Developer D: US4 (Scoring)
3. Stories integrate independently via shared room state

---

## Notes

- Unit test task T006 validates deterministic game logic per constitution §2 before UI integration
- T006 runs in parallel with T007-T010 since tests target the pure service function while wiring targets endpoints and frontend
- Verification gates (tsc --noEmit, existing tests) enforced in Phase 7
- US1 has no backend dependency beyond room snapshot — purely frontend
- US2, US3, US4 all read from the same room state snapshot delivered by polling
- Canvas data is never streamed or transmitted (FR-003) — enforced by component isolation
