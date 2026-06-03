---
description: "Task list for game start and drawer flow implementation"
---

# Tasks: Game Start & Drawer Flow

**Input**: Design documents from `specs/003-game-start-drawer-flow/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/api.md, quickstart.md

**Tests**: Test tasks are included per the research.md and quickstart.md test specifications.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

- **Backend**: `backend/src/`
- **Frontend**: `frontend/src/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: No setup tasks required — project is already initialized from previous features.

No tasks in this phase.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Data model extensions and snapshot filtering that ALL user stories depend on.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [ ] T001 Add `"active"` to `RoomStatus`, `role: ParticipantRole | null` to `Participant`, `secretWord: string` to `Room`, and `drawerId: string | null` + viewer-scoped `secretWord: string | null` to `RoomSnapshot` in `backend/src/models/game.ts`
- [ ] T002 Add optional `viewerParticipantId` parameter to `toRoomSnapshot()` and filter `secretWord` to `null` when viewer is not the drawer in `backend/src/services/roomStore.ts`

**Checkpoint**: Foundation ready — user story implementation can now begin.

---

## Phase 3: User Story 1 - Host Starts the Game (Priority: P1) 🎯 MVP

**Goal**: The host can start the game from the lobby via a backend endpoint. The room transitions from `"lobby"` to `"active"`, roles are assigned (host=drawer, others=guessers), and a secret word is deterministically selected.

**Independent Test**: Host in a lobby with ≥1 other player sends `POST /rooms/:code/start` with their `participantId`. Verify: room status is `"active"`, host role is `"drawer"`, other participant role is `"guesser"`, secret word is one of the 5 predefined words. Non-host receives 403. Already-active room receives 409.

### Tests for User Story 1 (OPTIONAL — included per research.md) ⚠️

- [ ] T003 [P] [US1] Write backend tests: startGame transitions room, assigns host as drawer, rejects non-host (403), rejects already-active (409), deterministic word selection, viewer filtering in `backend/src/services/roomStore.test.ts`
- [ ] T004 [P] [US1] Write frontend test: startGame sends POST with participantId to /rooms/:code/start in `frontend/src/services/api.test.ts`

### Implementation for User Story 1

- [ ] T005 [P] [US1] Add `startGameSchema` Zod schema with `participantId: z.string().uuid()` in `backend/src/api/schemas.ts`
- [ ] T006 [US1] Implement `startGame(code, participantId)` in `roomStore`: look up room (404), verify hostId matches (403), verify status is "lobby" (409), assign roles (host=drawer, others=guesser), select word deterministically via charCodeSum(code) % words.length, set status="active", return snapshot in `backend/src/services/roomStore.ts`
- [ ] T007 [US1] Add `POST /:code/start` route handler with Zod validation, error handling (404/403/409/400), and call to `roomStore.startGame()` in `backend/src/api/rooms.ts`
- [ ] T008 [P] [US1] Add `startGame(code: string, participantId: string)` method calling `POST /rooms/:code/start` in `frontend/src/services/api.ts`
- [ ] T009 [P] [US1] Update frontend `RoomSnapshot` with `drawerId` and `secretWord`, update `Participant` with optional `role` field in `frontend/src/services/api.ts`
- [ ] T010 [US1] Add `async startGame()` action calling `api.startGame()` and updating room state with response snapshot in `frontend/src/state/roomStore.ts`

**Checkpoint**: Backend game start works; frontend can trigger it. MVP deliverable.

---

## Phase 4: User Story 2 - Players Are Routed to the Game Screen (Priority: P1)

**Goal**: When the host starts the game, all participants automatically navigate from the lobby screen to the game screen via polling.

**Independent Test**: Participant on lobby screen polls room state; host starts game on another tab; within 3 seconds the participant's screen auto-navigates to `/game`.

### Implementation for User Story 2

- [ ] T011 [P] [US2] Add `useEffect` watching `room.status` — when `"active"`, call `navigate("/game")` in `frontend/src/pages/LobbyPage.tsx`
- [ ] T012 [US2] Wire the "Start Game" button to `roomStore.startGame()` instead of direct `navigate("/game")` in `frontend/src/pages/LobbyPage.tsx`

**Checkpoint**: All players auto-route to game screen on game start.

---

## Phase 5: User Story 3 - Players See Their Roles and Game Information (Priority: P2)

**Goal**: The drawer sees their role and the secret word; guessers see their role and the drawer's identity but NOT the secret word. All players see everyone's roles (public).

**Independent Test**: Start a game. Drawer tab shows "You are the drawer" + secret word. Guesser tab shows "You are a guesser" + drawer name. Guesser's `secretWord` is `null`.

### Implementation for User Story 3

- [ ] T013 [P] [US3] Add 2-second polling `setInterval` calling `roomStore.fetchRoom()` on GamePage mount, clear interval on unmount. On network error: silently preserve last known state. On 404: navigate back to home in `frontend/src/pages/GamePage.tsx`
- [ ] T014 [US3] Display: viewer's role ("drawer" / "guesser"), secretWord (only if drawer), drawer's name prominently; show "Waiting for the drawer to draw..." for guessers in `frontend/src/pages/GamePage.tsx`

**Checkpoint**: Game screen shows role-appropriate information with viewer-scoped secret word.

---

## Phase 6: User Story 4 - Player Names Are Validated Upon Entry (Priority: P3)

**Goal**: Empty and whitespace-only player names are rejected; valid names are trimmed. (Note: per research.md section 7, this was already implemented in the previous feature via Zod schemas.)

**Independent Test**: Attempt to join a room with whitespace-only name → rejection with clear error. Attempt with leading/trailing spaces → name is trimmed and accepted.

### Implementation for User Story 4

- [ ] T015 [US4] Verify existing Zod `joinRoomSchema` enforces `.trim().min(1)` on `playerName` — confirm existing backend tests pass; add test case for whitespace-only rejection if missing in `backend/src/api/schemas.ts` and `backend/src/services/roomStore.test.ts`

**Checkpoint**: Name validation enforced end-to-end.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Final verification and quality assurance.

- [ ] T016 Run type check: `cd backend && npx tsc --noEmit`
- [ ] T017 Run type check: `cd frontend && npx tsc -b`
- [ ] T018 Run backend tests: `cd backend && npm test`
- [ ] T019 Run frontend tests: `cd frontend && npm test`
- [ ] T020 Verify `GET /health` returns `{ ok: true }`
- [ ] T021 Multi-tab browser test: host starts game, all tabs navigate to `/game`, drawer sees secret word, guesser does not
- [ ] T022 Run quickstart.md verification checklist

---

## Dependencies & Execution Order

### Phase Dependencies

- **Foundational (Phase 2)**: Depends on existing project — BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Phase 2 completion
  - US2 (Phase 4) depends on US1 completion (needs `startGame()` and store action)
  - US3 (Phase 5) depends on US2 completion (needs GamePage access after routing)
  - US4 (Phase 6) is independent — can be verified at any time
- **Polish (Phase 7)**: Depends on all user stories being complete

### User Story Dependencies

- **US1 (P1)**: Can start after Phase 2 — no dependencies on other stories
- **US2 (P1)**: Depends on US1 (needs startGame store action and API)
- **US3 (P2)**: Depends on US2 (needs routing to GamePage working)
- **US4 (P3)**: Independent — verification only (already implemented)

### Within Each User Story

- Tests (if included) MUST be written and FAIL before implementation
- Models before services
- Services before endpoints
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

- T001–T002: Sequential (T002 depends on new types from T001)
- T003–T004: Parallel (backend tests, frontend tests — independent files)
- T005: Independent (Zod schema, no deps)
- T006: Depends on T001–T002 types (same phase, sequential)
- T007: Depends on T005–T006
- T008–T009: Parallel (API client, types — independent files)
- T010: Depends on T008–T009
- T011–T012: Sequential within US2
- T013–T014: Sequential within US3
- T015: Independent verification
- T016–T022: All parallel (verification tasks)

---

## Parallel Example: User Story 1

```bash
# Launch tests in parallel:
Task: "Write backend tests for startGame in backend/src/services/roomStore.test.ts"
Task: "Write frontend test for startGame API in frontend/src/services/api.test.ts"

# Launch schema + service sequentially, then endpoint:
Task: "Add startGameSchema in backend/src/api/schemas.ts"
Task: "Implement startGame() in backend/src/services/roomStore.ts"
Task: "Add POST /:code/start endpoint in backend/src/api/rooms.ts"

# Launch frontend tasks in parallel:
Task: "Add startGame() API call in frontend/src/services/api.ts"
Task: "Update frontend types with drawerId/secretWord/role in frontend/src/services/api.ts"
# Then sequentially:
Task: "Add startGame() action in frontend/src/state/roomStore.ts"
```

---

## Implementation Strategy

### MVP First (US1 Only)

1. Complete Phase 2: Foundational
2. Complete Phase 3: User Story 1 (backend game start + frontend trigger)
3. **STOP and VALIDATE**: Test US1 independently via curl or browser
4. Deploy/demo if ready

### Incremental Delivery

1. Complete Foundational → Foundation ready
2. Add US1 (Host Starts Game) → Test independently → **MVP!**
3. Add US2 (Auto-Routing) → Test independently → Deploy/Demo
4. Add US3 (Role Display) → Test independently → Deploy/Demo
5. Add US4 (Name Validation) → Verify → Deploy/Demo

### Parallel Team Strategy

With multiple developers:

1. Developer A: Phase 2 (Foundational — blocks everyone)
2. After Phase 2:
   - Developer A: US1 Implementation (T005–T010)
   - Developer B: US1 Tests (T003–T004) + US4 (T015)
3. After US1:
   - Developer A: US2 (T011–T012)
   - Developer B: US3 (T013–T014)
4. Both: Phase 7 Polish together

---

## Notes

- [P] tasks = different files, no dependencies on incomplete siblings
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Write tests first, verify they fail, then implement
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same-file conflicts, cross-story dependencies that break independence
