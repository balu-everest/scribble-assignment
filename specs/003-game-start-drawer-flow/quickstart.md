# Quickstart: Game Start & Drawer Flow Implementation

## Prerequisites

- Node.js 20+
- `cd backend && npm install` (already done)
- `cd frontend && npm install` (already done)
- Room Setup & Lobby feature is fully implemented and passing tests

## Step 1: Update Data Model

**File**: `backend/src/models/game.ts`

- Add `"active"` to `RoomStatus` union type
- Add `role: "drawer" | "guesser" | null` to `Participant` interface
- Add `secretWord: string` to `Room` interface
- Add `drawerId: string | null` and `secretWord: string | null` to `RoomSnapshot` interface

## Step 2: Add Start Game Service

**File**: `backend/src/services/roomStore.ts`

- Add `startGame(code: string, participantId: string): RoomSnapshot` function:
  - Look up room by code; throw 404 if not found
  - Verify `participantId === room.hostId`; throw 403 if mismatch
  - Verify `room.status === "lobby"`; throw 409 if already active
  - Assign roles: participant matching `hostId` gets `"drawer"`, others get `"guesser"`
  - Select secret word deterministically: `charCodeSum(room.code) % availableWords.length`
  - Set `room.status = "active"` and `room.secretWord = selectedWord`
  - Update `room.updatedAt`
  - Return room snapshot (with `secretWord` — caller is the drawer)
- Update `toRoomSnapshot(room, viewerParticipantId?)`:
  - Accept optional `viewerParticipantId` parameter
  - Include `secretWord` in snapshot **only if** viewer is the drawer
  - Set `secretWord` to `null` for guessers and unauthenticated viewers
  - Populate `drawerId` from the participant with role `"drawer"`

## Step 3: Add Start Game Endpoint

**File**: `backend/src/api/rooms.ts`

- Add `POST /:code/start` route handler
- Accept `{ participantId }` from request body
- Validate with Zod schema (`participantId: z.string().uuid()`)
- Call `roomStore.startGame(code, participantId)`
- Return `200` with the room snapshot

**File**: `backend/src/api/schemas.ts`

- Add `startGameSchema` with `participantId: z.string().uuid()`

## Step 4: Update Frontend API Client

**File**: `frontend/src/services/api.ts`

- Add `startGame(code: string, participantId: string)` method calling `POST /rooms/:code/start`
- Update `RoomSnapshot` type to include `drawerId`, `secretWord`, and `role` on participants
- Update `Participant` type to include optional `role` field

## Step 5: Add Start Game Action to RoomStore

**File**: `frontend/src/state/roomStore.ts`

- Add `async startGame()` method calling `api.startGame()`
- On success, update room state with the response snapshot

## Step 6: Auto-Route Lobby → Game on Status Change

**File**: `frontend/src/pages/LobbyPage.tsx`

- Add `useEffect` watching `room.status`:
  - When status changes to `"active"`, call `navigate("/game")`
- Wire the "Start Game" button to call `roomStore.startGame()` (instead of direct navigate)
- For the host: after `startGame()` succeeds, the polling will detect `"active"` and navigate (or navigate immediately on success)

## Step 7: Update Game Page with Polling & Role Display

**File**: `frontend/src/pages/GamePage.tsx`

- Add 2-second polling `setInterval` calling `roomStore.fetchRoom()`
- Display the viewer's role (`drawer` or `guesser`)
- If viewer is the drawer: display the `secretWord`
- If viewer is a guesser: show "Waiting for the drawer to draw..."
- Show the drawer's name prominently (for guessers to know who's drawing)
- Clear interval on unmount

## Step 8: Write Tests

**Backend tests** (`roomStore.test.ts`):
- `startGame` transitions room from lobby to active
- `startGame` assigns host as drawer, others as guessers
- `startGame` rejects non-host participant (403)
- `startGame` rejects already-active room (409)
- `startGame` rejects unknown participantId (400)
- Secret word is deterministic (same room code → same word)
- Viewer filtering: drawer sees secretWord, guesser sees null
- `toRoomSnapshot` without viewer returns secretWord (backward compat for start response)

**Frontend tests** (`api.test.ts`):
- `startGame` sends POST with participantId

## Verification Checklist

- [ ] `cd backend && npm test` passes
- [ ] `cd frontend && npm test` passes
- [ ] `cd backend && npx tsc --noEmit` passes
- [ ] `cd frontend && npx tsc -b` passes
- [ ] `GET /health` returns `{ ok: true }`
- [ ] Multi-tab browser test: host starts game → all tabs navigate to /game
- [ ] Multi-tab browser test: drawer sees secret word, guesser does not
