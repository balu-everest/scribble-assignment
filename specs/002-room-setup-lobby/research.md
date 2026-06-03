# Research: Room Setup & Lobby

## 1. Host Tracking Strategy

**Decision**: Add `hostId` field to the `Room` model. On room creation, the first participant's `id` is stored as `hostId`. On host disconnect or voluntary leave, the participant with the earliest `joinedAt` timestamp (after the host) is promoted.

**Rationale**: Simplest approach — single field reference, no separate host role flag per participant. Promotes determinism (earliest joiner wins).

**Alternatives considered**: Host role flag on Participant (redundant, harder to transfer), host index (fragile on participant reorder).

---

## 2. Room Code Format

**Decision**: Change from 4-char to 6-char uppercase alphanumeric codes. Exclude ambiguous chars (0/O, 1/I/L). Store in uppercase canonical form. Case-insensitive on input (`.toUpperCase()` before lookup).

**Rationale**: 6 chars increases the code space from ~900K to ~56B, making codes harder to guess. Uppercase storage eliminates case confusion. Input uppercasing matches existing pattern in `rooms.ts`.

**Alternatives considered**: Keep 4 chars (insufficient for non-guessable requirement), add hyphen separators (unnecessary complexity).

---

## 3. Input Validation Strategy

**Decision**: Extend Zod schemas to enforce:
- `playerName`: `.trim().min(1, "Name cannot be empty").max(20, "Name too long")`
- Room code in params/lookup: auto-uppercased, trimmed
- Duplicate name check: case-insensitive comparison (`name.toLowerCase()`)

**Rationale**: Zod validation is already in use — extending schemas is consistent. Trim + min catches whitespace-only; max enforces length limit. Case-insensitive dup check aligns with spec.

**Alternatives considered**: Manual validation functions (duplicates Zod's role), express middleware (over-engineered for simple checks).

---

## 4. Auto-Polling on Frontend

**Decision**: Use `setInterval` inside a `useEffect` in `LobbyPage`, calling `roomStore.fetchRoom()`. The interval fires every 2 seconds. On component unmount or room change, the interval is cleared. Poll errors are silently ignored (last known state preserved).

**Rationale**: Short-polling is the mandated sync mechanism. Using `setInterval` in the component is the simplest pattern — no changes needed to the RoomStore class for scheduling. The RoomStore already provides `fetchRoom()` and `useRoomState()` for reactive UI updates.

**Alternatives considered**: Polling in RoomStore class (ties state management to scheduling), `useSwr` or `react-query` (adds dependencies), WebSocket (constitution violation).

---

## 5. Leave Room & Host Transfer

**Decision**: Add `PATCH /rooms/:code/leave` endpoint accepting `{ participantId }`. Backend removes the participant, and if that participant was `hostId`, promotes the longest-tenured remaining participant. Return updated `RoomSnapshot`. Frontend navigates to `/` on success.

**Rationale**: RESTful — a PATCH on the room resource to remove a participant. Participant identification via ID (not name) prevents ambiguity. Return of snapshot allows immediate UI update.

**Alternatives considered**: `DELETE /rooms/:code/participants/:id` (more REST-nerdy but harder to route), POST with action body (less idempotent).

---

## 6. Testing Approach

**Decision**: Extend existing Vitest patterns:
- Backend: unit tests for `roomStore` (host tracking, leave, transfer, validation, code generation)
- Frontend: unit tests for `api.ts` (leave endpoint call)
- Manual: multi-tab browser testing per spec's "Independent Test" sections

**Rationale**: Current Vitest setup works — no need for new test framework. Multi-tab testing is manual but validates the polling UX end-to-end.

**Alternatives considered**: Integration tests with supertest (future improvement), Playwright E2E (overhead for current scope), component tests (not in existing pattern).

---

## 7. Room Cleanup Strategy

**Decision**: No background cleanup process. Rooms become orphaned when the last player leaves. A future feature can add periodic cleanup of rooms older than N minutes.

**Rationale**: Minimal implementation — no timers, no background threads. The in-memory store naturally leaks orphaned rooms, but at multiplayer scale (~dozens of rooms) this is acceptable until a cleanup feature is spec'd.

**Alternatives considered**: `setInterval` cleanup sweep (adds complexity, premature optimization), TTL on room creation (might clean active rooms in edge cases).
