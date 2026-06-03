# Research: Game Start & Drawer Flow

## 1. Room State Transition Strategy

**Decision**: Extend `RoomStatus` from `"lobby"` to `"lobby" | "active"`. Add `POST /rooms/:code/start` endpoint that validates host identity and transitions the room. The `startGame()` service function updates status, assigns roles, and selects the secret word atomically.

**Rationale**: Simplest possible state machine — a single transition `lobby → active`. Adding `"active"` to the existing union type requires minimal changes. No state machine library needed; a simple guard (`if status !== "lobby"`) prevents double-starts.

**Alternatives considered**: Separate `status` + `phase` fields (over-engineered for a single transition), array of state transitions (future-proof but premature).

---

## 2. Host-Only Authorization on Start

**Decision**: Backend-enforce host check in `startGame()`. The endpoint accepts `{ participantId }`, compares against `room.hostId`, and returns 403 if mismatch. The frontend also hides the start button for non-hosts as a UX courtesy.

**Rationale**: The spec requires non-host requests to be rejected (FR-002). Backend enforcement is mandatory regardless of frontend gating. Using existing `hostId` field — no new permission system needed.

**Alternatives considered**: Frontend-only gating (fails FR-002), session-based auth (no auth allowed per constitution), token-based participant verification (over-engineering).

---

## 3. Role Assignment Algorithm

**Decision**: On game start, iterate participants. The participant matching `room.hostId` is assigned role `"drawer"`. All other participants get role `"guesser"`. Roles are stored as a `role` field on each `Participant` object with type `"drawer" | "guesser"`.

**Rationale**: Deterministic (host is always first player per spec), simple one-pass assignment. Storing role on `Participant` means the existing `participants[]` array naturally carries role info, and FR-013 (all roles public) is trivially satisfied by returning the array as-is.

**Alternatives considered**: Separate `roleMap: Map<participantId, role>` (fragile, needs sync with participants), computed role on read (no persistence, can't detect role changes).

---

## 4. Deterministic Word Selection

**Decision**: Select secret word using a hash of the room code: compute sum of char codes of `room.code`, then `sum % availableWords.length`. The selected `secretWord` is stored on the Room and included in snapshots only when the requester is the drawer.

**Rationale**: Room codes are unique and immutable after creation, making this purely deterministic — the same room always picks the same word. No random state needed. The modulo operation distributes evenly across 5 words.

**Alternatives considered**: `Array.sort(() => ...)` seeded pseudo-random (over-engineered), always pick first word (boring, not truly "selected"), random selection (non-deterministic).

---

## 5. Viewer-Specific Response Filtering

**Decision**: In `toRoomSnapshot()`, accept an optional `viewerParticipantId` parameter. If provided:
- Include `secretWord` in the snapshot **only if** the viewer is the drawer.
- Always include `secretWord` when no viewer is specified (for host/start response).
- `participants[]` always includes all roles (public per clarification).

The `GET /rooms/:code` endpoint passes the `participantId` query param through.

**Rationale**: Single filtering point in the snapshot builder — no scattered conditional logic. The existing `GET /rooms/:code` already accepts `participantId` as a query param, so the API contract is backward-compatible.

**Alternatives considered**: Two separate endpoints (drawer vs guesser snapshot — doubles code path), client-side filtering after full response (secret word could leak in network tab).

---

## 6. Frontend Lobby → Game Routing

**Decision**: In `LobbyPage`, the existing 2s polling `setInterval` already calls `roomStore.fetchRoom()` which updates the room state in the store. Add a `useEffect` that watches the room status: when `room.status === "active"`, call `navigate("/game")`. No changes to the polling mechanism itself — only a reactive redirect.

On `GamePage`, add a 2s polling `setInterval` to keep the room state fresh (role/word display, detect other players). Clear on unmount.

**Rationale**: Leverages existing polling infrastructure. The LobbyPage already has `setInterval` and `roomStore` — adding a watch on status is a minimal change. GamePage polling is needed because the game screen should reflect live state changes (e.g., player count).

**Alternatives considered**: Separate "game start" event in polling response (same effect, more state), Server-Sent Events (constitution violation), navigation triggered by start endpoint response (only works for host, not other players).

---

## 7. Name Validation Re-enforcement

**Decision**: The existing Zod schemas in `schemas.ts` already enforce `.trim().min(1).max(20)` on `playerName`. No changes needed — review confirms this covers whitespace-only and empty rejection per FR-007/FR-008.

**Rationale**: Already implemented in the previous feature. Double-check confirms no gaps.

**Alternatives considered**: N/A — existing implementation satisfies the requirement.

---

## 8. Testing Approach

**Decision**: Extend existing Vitest patterns:
- Backend: unit tests for `startGame()` (role assignment, word selection, host-only gate, double-start rejection, viewer filtering)
- Frontend: unit tests for `api.ts` (startGame endpoint call)
- Manual: multi-tab browser testing (Tab 1: host/drawer, Tab 2: guesser — verify both route to game, only drawer sees secret word)

**Rationale**: Same pattern as previous feature. Multi-tab testing validates the viewer-specific security requirement end-to-end.

**Alternatives considered**: E2E tests with Playwright (overhead for current scope), integration tests with supertest (future improvement).
