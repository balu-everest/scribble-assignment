# Quickstart: Game Result, Restart & Final Validation Implementation

## Prerequisites

- Node.js 20+
- `cd backend && npm install` (already done)
- `cd frontend && npm install` (already done)
- Gameplay Interaction feature (Scenario 3) is fully implemented and passing tests
- Current branch: `005-game-result-restart`

## Step 1: Extend RoomStatus Type

**File**: `backend/src/models/game.ts`

- Add `"result"` to the `RoomStatus` union type: `"lobby" | "active" | "result"`
- Export the updated type

## Step 2: Update Guess Handler for Result Transition

**File**: `backend/src/services/roomStore.ts`

- In `submitGuess()`, after processing a correct guess, set `room.status = "result"`
- Update the guessing-rejected error message for `"result"` state to: "Game has ended — no more guesses accepted"

## Step 3: Add Restart Service Method

**File**: `backend/src/services/roomStore.ts`

- Add `restartRoom(code: string, participantId: string)` function:
  - Look up room by code; return 404 if not found
  - Verify `room.status === "result"`; return 409 error if not
  - Verify `participantId === room.hostId`; return 403 error if not
  - Set `room.status = "lobby"`
  - Set `room.guesses = []`
  - For each participant: `participant.score = 0`, `participant.role = null`
  - Set `room.drawerId = null`, `room.secretWord = null`
  - Update `room.updatedAt`
  - Return room snapshot (viewer-filtered by participantId)

**File**: `backend/src/services/roomStore.test.ts`

- Add tests for `restartRoom`:
  - Successful restart resets all state, preserves participants
  - Non-host restart rejected with 403
  - Restart from non-`"result"` state rejected with 409
  - `guesses` is empty after restart
  - Scores are all 0 after restart
  - Participant count unchanged after restart
- Update existing `submitGuess` test for correct guess triggering result state

## Step 4: Add Restart Endpoint

**File**: `backend/src/api/rooms.ts`

- Add `POST /:code/restart` route handler
- Accept `{ participantId }` from request body
- Validate with Zod schema: `participantId: z.string().uuid()`
- Call `roomStore.restartRoom(code, participantId)`
- Return `200` with the room snapshot

**File**: `backend/src/api/schemas.ts`

- Add `restartRoomSchema` with `participantId: z.string().uuid()`

## Step 5: Update Frontend API Client

**File**: `frontend/src/services/api.ts`

- Add `restartRoom(code: string, participantId: string)` method calling `POST /rooms/:code/restart`
- Update `RoomSnapshot.status` type to include `"result"` in the union

## Step 6: Update RoomStore for Status-Based Routing

**File**: `frontend/src/state/roomStore.ts`

- Add `async restartRoom()` method:
  - Guard: require `room` and `participantId` to be set
  - Call `api.restartRoom(room.code, participantId)`
  - On success, update room state with the response snapshot
  - On failure, throw error for the UI to catch
- The existing polling mechanism already updates room state. The `room.status` field will naturally become `"result"` or `"lobby"`.

## Step 7: Create ResultScreen Page

**File**: `frontend/src/pages/ResultScreen.tsx` (NEW)

- Read room state from roomStore (participants, guesses)
- Display final scoreboard using existing Scoreboard component or inline rendering
- Sort participants by score descending
- Highlight the player(s) with the highest score (visual distinction: badge, color, or prominent placement)
- If all scores are 0, display a message: "No correct guesses were made this round"
- Conditionally render:
  - If viewer is host: show a "Restart Game" button
  - If viewer is not host: show a non-interactive message "Waiting for host to restart the game..."
- On restart button click: call `roomStore.restartRoom()`
- The polling loop (in a layout component or App-level) handles navigation away when status changes

## Step 8: Add /result Route

**File**: `frontend/src/App.tsx` (or `frontend/src/main.tsx`)

- Add `<Route path="/result" element={<ResultScreen />} />`
- Ensure the route renders within the same layout wrapper as other game pages

## Step 9: Implement Status-Based Auto-Routing

**File**: `frontend/src/components/PollingRouter.tsx` (NEW) or integrate into existing layout

- Create a component that runs the polling loop and watches `room.status`:
  - Already polls every ~2s via existing logic in roomStore or App
  - Add a `useEffect` listening to `room.status` changes:
    - `"result"` → `navigate("/result")`
    - `"lobby"` → `navigate("/lobby")`
    - `"active"` → `navigate("/game")`
- Place this component high in the component tree (e.g., in the App layout or a wrapper around all routes)
- Ensure navigation only triggers when status actually changes (avoid infinite redirect loops)

## Step 10: Clear Canvas on Return to Lobby

**File**: `frontend/src/pages/LobbyScreen.tsx`

- On mount (or when room status transitions to `"lobby"` after being elsewhere), check if a canvas drawing context exists in local state and clear it
- If the DrawingCanvas component stores its canvas ref in a shared context or module-level variable, call `ctx.clearRect()` to wipe it
- Alternatively, the DrawingCanvas component can listen to room status and clear itself when `status` changes away from `"active"`

## Step 11: Write Tests

**Backend tests** (`roomStore.test.ts`):
- `submitGuess` with correct guess transitions room to `"result"` state
- `submitGuess` on `"result"` room returns 409 with updated message
- `restartRoom` successful: status is `"lobby"`, guesses empty, scores zero, participants preserved
- `restartRoom` non-host: returns 403
- `restartRoom` on non-`"result"` room: returns 409
- `restartRoom` on non-existent room: returns 404

**Frontend tests** (`ResultScreen.test.tsx`):
- ResultScreen renders all participants with scores
- ResultScreen highlights the winner(s)
- ResultScreen shows "Waiting for host" message for non-host
- ResultScreen shows restart button for host
- All-zero scores show "No correct guesses" message

## Verification Checklist

- [ ] `cd backend && npm test` passes
- [ ] `cd frontend && npm test` passes
- [ ] `cd backend && npx tsc --noEmit` passes
- [ ] `cd frontend && npx tsc -b` passes
- [ ] `GET /health` returns `{ ok: true }`
- [ ] Multi-tab test: correct guess → all tabs navigate to Result Screen within 3 seconds
- [ ] Multi-tab test: Result Screen shows correct scores and winner highlight
- [ ] Multi-tab test: host sees "Restart Game" button; non-hosts see "Waiting for host" message
- [ ] Multi-tab test: non-host restart attempt fails
- [ ] Multi-tab test: host restarts → all tabs navigate to Lobby within 3 seconds
- [ ] Multi-tab test: after restart, player list unchanged, scores at 0, guesses empty
- [ ] Multi-tab test: drawer's canvas is blank after returning to lobby
- [ ] Multi-tab test: restart attempt from lobby or active state is rejected
- [ ] Single-tab test: no console errors during full flow (start → guess → result → restart)
