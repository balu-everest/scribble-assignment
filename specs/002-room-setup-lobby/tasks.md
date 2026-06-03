---

description: "Task list for Room Setup & Lobby feature implementation"
---

# Tasks: Room Setup & Lobby

**Input**: Design documents from `specs/002-room-setup-lobby/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/api.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `backend/src/`, `frontend/src/`
- All paths relative to repository root

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

No setup tasks required — the project is fully scaffolded (Express + React + Vite + TypeScript + Vitest).

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core model and validation changes that MUST be complete before ANY user story

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T001 Add `hostId` field to `Room` and `RoomSnapshot` interfaces in `backend/src/models/game.ts`
- [X] T002 [P] Add `hostId` field to frontend `RoomSnapshot` type in `frontend/src/services/api.ts`
- [X] T003 [P] Change room code generation from 4 to 6 characters in `backend/src/services/roomStore.ts`
- [X] T004 Add Zod validation (`.trim().min(1).max(20)`) for `playerName` in `backend/src/api/schemas.ts`
- [X] T005 [P] Add room code validation (`.trim().min(1)`) to `roomCodeParamsSchema` in `backend/src/api/schemas.ts`
- [X] T006 Add case-insensitive duplicate name check to `joinRoom` in `backend/src/services/roomStore.ts`
- [X] T007 [P] Extend unit tests for schemas (empty name, whitespace name, name >20 chars, empty room code) in `backend/src/api/schemas.test.ts`
- [X] T008 [P] Extend unit tests for roomStore (6-character code format, hostId field presence in snapshot) in `backend/src/services/roomStore.test.ts`

**Checkpoint**: Foundation ready — all models, validation, and base tests in place

---

## Phase 3: User Story 1 - Create a Game Room (Priority: P1) 🎯 MVP

**Goal**: A player can enter a display name, create a room, be designated host, see a unique room code, and view the lobby with themselves listed as host.

**Independent Test**: Navigate to `/create-room`, enter a valid name, submit. The lobby appears showing the room code and the player's name with a "Host" badge. `GET /health` returns `{ ok: true }`.

### Tests for User Story 1

- [X] T009 [US1] Extend roomStore tests for host assignment on room creation in `backend/src/services/roomStore.test.ts`

### Implementation for User Story 1

- [X] T010 [US1] Set `hostId` on room creation and include `hostId` in snapshot in `backend/src/services/roomStore.ts`
- [X] T011 [P] [US1] Return updated error messages for invalid names (empty, whitespace, too long) from `POST /rooms` in `backend/src/api/rooms.ts`
- [X] T012 [P] [US1] Add "Host" indicator/badge next to host participant's name in lobby participant list at `frontend/src/pages/LobbyPage.tsx`

**Checkpoint**: US1 complete — creating a room works end-to-end with host tracking

---

## Phase 4: User Story 2 - Join an Existing Room (Priority: P1)

**Goal**: A player can enter a room code and display name to join an existing room. Invalid inputs (empty, whitespace, duplicate name, non-existent code) show clear errors.

**Independent Test**: Open two browser tabs. Tab A creates a room and sees the code. Tab B enters that code + a name, joins, and sees both players in the lobby. Tab A's list also shows Tab B.

### Tests for User Story 2

- [X] T013 [US2] Extend roomStore tests for duplicate name rejection (case-insensitive) in `backend/src/services/roomStore.test.ts`

### Implementation for User Story 2

- [X] T014 [US2] Validate input and return descriptive errors (empty name, whitespace, too long, duplicate name, room not found) from `POST /rooms/:code/join` in `backend/src/api/rooms.ts`
- [X] T015 [P] [US2] Show server validation error messages in JoinRoomPage form at `frontend/src/pages/JoinRoomPage.tsx`
- [X] T016 [US2] Update participant list with host badge after successful join in lobby at `frontend/src/pages/LobbyPage.tsx`

**Checkpoint**: US2 complete — joining rooms works with full validation and lobby visibility

---

## Phase 5: User Story 3 - Lobby Participant Synchronization (Priority: P2)

**Goal**: The participant list auto-updates every ~2 seconds without manual refresh. Players can leave the room, and host transfers on departure.

**Independent Test**: Open two tabs in the same room. Tab B joins. Within 3 seconds, Tab A's participant list shows Tab B. Click "Leave Room" in Tab B — Tab A's list updates within 3 seconds.

### Tests for User Story 3

- [X] T017 [US3] Extend roomStore tests for leave endpoint and host promotion in `backend/src/services/roomStore.test.ts`
- [X] T018 [P] [US3] Extend API client tests for leaveRoom method in `frontend/src/services/api.test.ts`

### Implementation for User Story 3

- [X] T019 [US3] Implement `PATCH /rooms/:code/leave` endpoint with host transfer logic in `backend/src/services/roomStore.ts`
- [X] T020 [US3] Register leave route handler in `backend/src/api/rooms.ts`
- [X] T021 [P] [US3] Add `leaveRoom` API client method (`PATCH /rooms/:code/leave`) in `frontend/src/services/api.ts`
- [X] T022 [US3] Add `leaveRoom` method to RoomStore (clear state, navigate to `/`) in `frontend/src/state/roomStore.ts`
- [X] T023 [US3] Add auto-polling with `setInterval` (2000ms) calling `roomStore.fetchRoom()` in LobbyPage at `frontend/src/pages/LobbyPage.tsx`
- [X] T024 [US3] Handle poll network errors silently (preserve last known state, no error toast) in `frontend/src/pages/LobbyPage.tsx`
- [X] T025 [P] [US3] Add "Leave Room" button to LobbyPage at `frontend/src/pages/LobbyPage.tsx` (visible to all players)

**Checkpoint**: US3 complete — real-time sync and leave/host-transfer work end-to-end

---

## Phase 6: User Story 4 - Host Starts Game (Priority: P2)

**Goal**: Only the host sees a "Start Game" button. It is disabled when fewer than 2 players are present. Non-host players never see it.

**Independent Test**: Host creates a room — sees disabled "Start Game" button. A second player joins — button becomes enabled. Non-host tab never shows the button.

### Implementation for User Story 4

- [X] T026 [US4] Add host-gated "Start Game" button (visible and enabled only when `participantId === room.hostId && room.participants.length >= 2`) in `frontend/src/pages/LobbyPage.tsx`
- [X] T027 [US4] Disable "Start Game" button when `room.participants.length < 2` in `frontend/src/pages/LobbyPage.tsx`

**Checkpoint**: US4 complete — host gating and minimum-player enforcement work

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Verification, cleanup, and edge-case hardening

- [X] T028 Run `cd backend && npm test` and fix any failures
- [X] T029 Run `cd frontend && npm test` and fix any failures
- [X] T030 Run `cd backend && npx tsc --noEmit` and fix type errors
- [X] T031 Run `cd frontend && npx tsc -b` and fix type errors
- [ ] T032 Manual multi-tab verification per spec's Independent Test criteria

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — project already scaffolded
- **Foundational (Phase 2)**: Blocks ALL user stories
- **User Stories (Phase 3–6)**: All depend on Foundational phase completion
  - US1 (P1) and US2 (P1) have no dependency on each other
  - US3 (P2) depends on US1 + US2 having lobby pages to poll
  - US4 (P2) depends on US3 (host tracking from polling) and US2 (multi-player to test disabled state)
- **Polish (Phase 7)**: Depends on all desired user stories

### User Story Dependencies

- **US1 (P1)**: No dependency on other stories — can start after Foundational
- **US2 (P1)**: No dependency on US1 — can start after Foundational
- **US3 (P2)**: Depends on US1 (needs lobby with room code to poll) and US2 (needs multi-player)
- **US4 (P2)**: Depends on US3 (needs hostId from polling snapshot) and US2 (needs multi-player for enabled state)

### Within Each User Story

- Tests first (write and verify failure) before implementation
- Backend services before endpoints
- Backend endpoints before frontend API client
- Frontend API client before state/store integration
- Story complete before moving to next priority

### Parallel Opportunities

- All tasks within the same phase marked [P] can run in parallel
- US1 and US2 can be worked on in parallel by different developers
- US3 must wait for US1 + US2 lobby infrastructure
- US4 must wait for US3 host tracking

---

## Parallel Example: Foundational Phase

```bash
# All foundational tasks can launch in parallel:
Task: "T001 Add hostId to Room and RoomSnapshot in backend/src/models/game.ts"
Task: "T002 Add hostId to frontend RoomSnapshot type in frontend/src/services/api.ts"
Task: "T003 Change room code generation from 4 to 6 chars in backend/src/services/roomStore.ts"
Task: "T004 Add Zod validation for playerName in backend/src/api/schemas.ts"
Task: "T005 Add room code validation to roomCodeParamsSchema in backend/src/api/schemas.ts"
Task: "T006 Add duplicate name check to joinRoom in backend/src/services/roomStore.ts"
Task: "T007 Extend schemas test in backend/src/api/schemas.test.ts"
Task: "T008 Extend roomStore test in backend/src/services/roomStore.test.ts"
```

## Parallel Example: User Story 3

```bash
# Tests first, then backend, then frontend:
Task: "T017 Extend roomStore tests for leave in backend/src/services/roomStore.test.ts"
Task: "T018 Extend API tests for leaveRoom in frontend/src/services/api.test.ts"
# After tests confirmed failing:
Task: "T019 Implement leave endpoint with host transfer in backend/src/services/roomStore.ts"
Task: "T020 Register leave route handler in backend/src/api/rooms.ts"
# After backend complete:
Task: "T021 Add leaveRoom API client method in frontend/src/services/api.ts"
Task: "T022 Add leaveRoom method to RoomStore in frontend/src/state/roomStore.ts"
Task: "T023 Add auto-polling in frontend/src/pages/LobbyPage.tsx"
Task: "T024 Handle poll network errors in frontend/src/pages/LobbyPage.tsx"
Task: "T025 Add Leave Room button in frontend/src/pages/LobbyPage.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 2: Foundational (including tests)
2. Complete Phase 3: User Story 1 (test + implement)
3. **STOP and VALIDATE**: Create a room, confirm host badge appears, tests pass
4. Deploy/demo if ready

### Incremental Delivery

1. **Foundational** → Models, validation, base tests ready
2. **US1 (P1)** → Create room MVP with tests → Deploy/Demo
3. **US2 (P1)** → Join room with tests → Deploy/Demo
4. **US3 (P2)** → Auto-polling + leave with tests → Deploy/Demo
5. **US4 (P2)** → Host Start Game → Deploy/Demo
6. **Polish** → Type-check, test, verify

### Parallel Team Strategy

With multiple developers:

1. Team completes Foundational together (code + tests)
2. Once Foundational is done:
   - Developer A: US1 Create Room (test + implement)
   - Developer B: US2 Join Room (test + implement)
3. Both US1 and US2 must be done before US3
4. Developer A or B: US3 Auto-Polling + Leave (test + implement)
5. Developer A or B: US4 Host Start Game

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story is independently completable and testable
- Tests should be written and verified failing before implementation
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
