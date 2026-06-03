# Quickstart: Room Setup & Lobby Implementation

## Prerequisites

- Node.js 20+
- `cd backend && npm install` (already done)
- `cd frontend && npm install` (already done)

## Step 1: Update Data Model

**File**: `backend/src/models/game.ts`

- Add `hostId: string` to `Room` interface
- Add `hostId: string` to `RoomSnapshot` interface
- Add `hostId` field to frontend `RoomSnapshot` in `frontend/src/services/api.ts`

## Step 2: Update Room Code Generation

**File**: `backend/src/services/roomStore.ts`

- Change `generateCode()` loop from `index < 4` to `index < 6`

## Step 3: Add Validation Schemas

**File**: `backend/src/api/schemas.ts`

- Extend `createRoomSchema` and `joinRoomSchema`: add `.trim().min(1, "Name cannot be empty").max(20, "Name must be 20 characters or less")` to `playerName`
- Handle the case where frontend omits `playerName` (set optional + default to "Player")
- Add whitespace-only detection

## Step 4: Update Room Service

**File**: `backend/src/services/roomStore.ts`

- Modify `createRoom()` to set `hostId` on the new room
- Modify `joinRoom()` to check for duplicate names (case-insensitive) before adding
- Add `leaveRoom(code, participantId)` function:
  - Remove participant by ID
  - If participant was host, promote earliest-joined remaining participant
  - Return updated room snapshot or null if room not found
- Update `toRoomSnapshot()` to include `hostId` in the snapshot

## Step 5: Add Leave Room Endpoint

**File**: `backend/src/api/rooms.ts`

- Add `PATCH /:code/leave` route handler
- Accept `{ participantId }` from body
- Call `leaveRoom()` and return updated snapshot

## Step 6: Add API Client Method

**File**: `frontend/src/services/api.ts`

- Add `leaveRoom(code, participantId)` method calling `PATCH /rooms/:code/leave`

## Step 7: Auto-Polling on Lobby Page

**File**: `frontend/src/pages/LobbyPage.tsx`

- Add `useEffect` with `setInterval` (2000ms) calling `roomStore.fetchRoom()`
- Clear interval on unmount
- Replace manual "Refresh Room" button or keep as fallback

## Step 8: Host-Gated Start Button

**File**: `frontend/src/pages/LobbyPage.tsx`

- Add host indicator badge next to host participant
- Disable "Start Game" button when `participants.length < 2`
- Hide "Start Game" button entirely for non-host participants
- Add "Leave Room" button for all participants

## Step 9: Add Leave Room Action to RoomStore

**File**: `frontend/src/state/roomStore.ts`

- Add `async leaveRoom()` method calling `api.leaveRoom()`
- On success, clear room state and navigate to `/`

## Step 10: Write Tests

**Backend tests** (`roomStore.test.ts`):
- Code is 6 characters
- HostId is set on creation
- Duplicate name rejection (case-insensitive)
- Host transfer on leave
- Empty/whitespace name rejection

**Backend tests** (`schemas.test.ts`):
- Empty name rejected
- Whitespace-only name rejected
- Name over 20 chars rejected
- Valid name passes

**Frontend tests** (`api.test.ts`):
- `leaveRoom` sends PATCH with participantId

## Verification Checklist

- [ ] `cd backend && npm test` passes
- [ ] `cd frontend && npm test` passes
- [ ] `cd backend && npx tsc --noEmit` passes
- [ ] `cd frontend && npx tsc -b` passes
- [ ] `GET /health` returns `{ ok: true }`
- [ ] Multi-tab browser test: create room, join room, see participant list update
