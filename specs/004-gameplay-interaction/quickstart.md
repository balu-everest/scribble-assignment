# Quickstart: Gameplay Interaction Implementation

## Prerequisites

- Node.js 20+
- `cd backend && npm install` (already done)
- `cd frontend && npm install` (already done)
- Game Start & Drawer Flow feature is fully implemented and passing tests
- Current branch: `004-gameplay-interaction`

## Step 1: Update Data Model

**File**: `backend/src/models/game.ts`

- Add `Guess` interface with: `participantId`, `participantName`, `text`, `timestamp`, `isCorrect`
- Add `guesses: Guess[]` to `Room` interface
- Add `score: number` to `Participant` interface (default `0`)
- Add `guesses: Guess[]` to `RoomSnapshot` interface

## Step 2: Add Guess Submission Service

**File**: `backend/src/services/roomStore.ts`

- Add `submitGuess(code: string, participantId: string, text: string)` function:
  - Look up room by code; return 404 error if not found
  - Verify `room.status === "active"`; return 409 error if not
  - Find participant by ID; return 400 error if not found
  - Verify participant's role is `"guesser"`; return 400 error if not
  - Trim the `text` value
  - Reject empty or whitespace-only text; return 400 error with descriptive message
  - Compare `text.toLowerCase()` against `room.secretWord.toLowerCase()`
  - Create `Guess` object with `isCorrect` flag set accordingly
  - If correct: increment the guesser's `score` by 100
  - Append guess to `room.guesses` array
  - Update `room.updatedAt`
  - Return updated room snapshot (viewer-filtered by participantId)

## Step 3: Add Guess Submission Endpoint

**File**: `backend/src/api/rooms.ts`

- Add `POST /:code/guess` route handler
- Accept `{ participantId, text }` from request body
- Validate with Zod schema (`participantId: z.string().uuid()`, `text: z.string().min(1)`)
- Call `roomStore.submitGuess(code, participantId, text)`
- Return `200` with the room snapshot

**File**: `backend/src/api/schemas.ts`

- Add `submitGuessSchema` with `participantId: z.string().uuid()` and `text: z.string().min(1)`

## Step 4: Create DrawingCanvas Component

**File**: `frontend/src/components/DrawingCanvas.tsx` (NEW)

- Create a React component wrapping a `<canvas>` element
- Set canvas dimensions (e.g., fill container, min-height 500px)
- Add `mousedown` handler: set drawing flag, record start position
- Add `mousemove` handler: if drawing flag is set, draw a line from last position to current position using `ctx.lineTo()` / `ctx.stroke()`
- Add `mouseup` / `mouseleave` handler: clear drawing flag
- Add a "Clear" button below the canvas that calls `ctx.clearRect()` to wipe all content
- Style to match existing game page components

## Step 5: Update Frontend API Client

**File**: `frontend/src/services/api.ts`

- Add `submitGuess(code: string, participantId: string, text: string)` method calling `POST /rooms/:code/guess`
- Add retry wrapper (up to 3 attempts, ~1s delay) for the guess submission call
- Update `RoomSnapshot` type to include `guesses` array and `score` on participants
- Update `Participant` type to include optional `score` field
- Add `Guess` type interface

## Step 6: Add Guess Submission Action to RoomStore

**File**: `frontend/src/state/roomStore.ts`

- Add `async submitGuess(text: string)` method:
  - Guard: require `room` and `participantId` to be set
  - Call `api.submitGuess(room.code, participantId, text)` with retry
  - On success, update room state with the response snapshot
  - On final failure, throw error for the UI to catch

## Step 7: Wire GuessForm

**File**: `frontend/src/components/GuessForm.tsx`

- Accept `onSubmit` callback prop (or call `roomStore.submitGuess()` internally)
- On form submit: call the submission method, handle success (clear input), handle error (show inline message, preserve input text)
- Add inline error display area near the input field

## Step 8: Update Scoreboard

**File**: `frontend/src/components/Scoreboard.tsx`

- Accept participants list as prop (or read from room state)
- Render each participant's name and score
- Sort by score descending (highest first)
- Use existing `Card` wrapper and styling patterns

## Step 9: Update ResultPanel for Guess History

**File**: `frontend/src/components/ResultPanel.tsx`

- Accept guesses array as prop (or read from room state)
- Render guesses chronologically (oldest first)
- Each entry shows: guesser name, guess text, timestamp (relative or absolute)
- Correct guesses have a distinct visual indicator (e.g., "✓ Correct!")
- Use existing `Card` wrapper and styling patterns

## Step 10: Update GamePage

**File**: `frontend/src/pages/GamePage.tsx`

- Replace the static canvas placeholder with conditional rendering:
  - If viewer is drawer: show `<DrawingCanvas />`
  - If viewer is guesser: show styled placeholder panel with "[Drawer Name] is drawing..."
- Pass guesses to `<ResultPanel />` (from room state via polling)
- Pass participants/scores to `<Scoreboard />`
- Pass `onSubmit` or wire `GuessForm` to `roomStore.submitGuess()`

## Step 11: Write Tests

**Backend tests** (`roomStore.test.ts`):
- `submitGuess` rejects empty/whitespace guesses with error
- `submitGuess` rejects non-gusser participant
- `submitGuess` rejects inactive room
- `submitGuess` with incorrect word: no points awarded, `isCorrect` is false
- `submitGuess` with correct word (exact match): awards +100 points, `isCorrect` is true
- `submitGuess` with correct word (case-insensitive): "Rocket" matches "rocket"
- `submitGuess` appends to guesses array, multiple guesses maintain order
- Multiple correct guesses from different guessers all award points
- Guesses are included in `toRoomSnapshot` response

**Frontend tests** (`api.test.ts`):
- `submitGuess` sends POST with participantId and text
- RoomSnapshot type includes `guesses` and `scores`

## Verification Checklist

- [ ] `cd backend && npm test` passes
- [ ] `cd frontend && npm test` passes
- [ ] `cd backend && npx tsc --noEmit` passes
- [ ] `cd frontend && npx tsc -b` passes
- [ ] `GET /health` returns `{ ok: true }`
- [ ] Multi-tab test: drawer draws on canvas, clear button works
- [ ] Multi-tab test: guesser sees "[Drawer Name] is drawing..." placeholder
- [ ] Multi-tab test: guesser submits valid guess → appears in all tabs' guess log
- [ ] Multi-tab test: empty/whitespace guess → rejected with inline error
- [ ] Multi-tab test: correct guess → +100 points, scoreboard updates for all
- [ ] Multi-tab test: case-insensitive match works ("Rocket" = "rocket")
