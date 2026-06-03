# Reflection

## What I built
A multiplayer Scribble drawing-and-guessing game implemented across five scenarios:

**Fix API Base URL** — corrected a misconfigured `API_BASE_URL` from `"/bug"` to the root endpoint, tightening URL assertions in tests to use exact matching

**Room Setup & Lobby** — create/join rooms with 6-character codes, host tracking with automatic promotion on leave, case-insensitive duplicate name rejection, lobby auto-polling every 2 seconds, host-gated Start Game button (disabled until 2+ players)

**Game Start & Drawer Flow** — host-triggered game start transitions lobby→active, deterministic word selection via character-code hashing, viewer-scoped `secretWord` filtering (only drawer sees it), auto-routing from lobby to game page on status change

**Gameplay Interaction** — native HTML5 Canvas with freehand drawing, guess submission with client/server validation, +100 scoring on correct guesses, guess feed with correct indicators, 3-retry wrapper for network-transient guess failures

**Game Result, Restart & Final Validation** — correct guess transitions to `"result"` state, result screen with final scoreboard and winner highlight, host-only Play Again button that resets round state while preserving participants and scores, `PollingRouter` system component that centralizes status-based navigation across all screens

## Technical decisions
**Polling over WebSockets**: The constraint (no WebSockets) forced a 2-second polling loop. I built a `PollingRouter` as a system-level component that runs outside individual page components, preventing duplicate intervals and centralizing the status-watching logic. The backend stays completely stateless between requests. The tradeoff is that state transitions (game start, correct guess, restart) feel asynchronous — a guess that's correct won't show the result screen until the next poll, which can feel sluggish compared to push.

**Host gating with automatic promotion**: The `hostId` field is the backbone of access control. When the host leaves, the participant with the earliest `joinedAt` timestamp is promoted. This is simple but means anyone can become host — not necessarily the room creator or most active player. I chose this over election protocols to keep the in-memory model lean and avoid consensus logic.

**In-memory store with structuredClone**: All state lives in a `Map<string, Room>` with `structuredClone()` on every read to prevent mutation leaks. This forced a clean separation between service logic (pure-ish operations on room state) and the response layer (`toRoomSnapshot` called at route level, not in services). The downside is that race conditions exist — two simultaneous correct guesses from different players could both process before the status transitions to `"result"`. I accepted this for the scope but noted it as a known limitation.

**Viewer-scoped response filtering**: Rather than sending the full room state and filtering on the client, `toRoomSnapshot()` accepts an optional `viewerParticipantId` and strips `secretWord` for non-drawers at the API boundary. This is a security-in-depth choice: even if a client sends a modified participant ID, the server controls what data leaves. It also means each participant gets a potentially different snapshot, which required careful testing of the polling loop to ensure it doesn't re-render unnecessarily when unrelated fields change.

**Spec Kit workflow**: Writing spec → plan → analysis → implementation for each scenario surfaced ambiguities before coding — for example, what happens to guesses when a room restarts, how host transfer works when the last player leaves, and whether scores accumulate across rounds. The analysis step caught several edge cases (e.g., drawer should not be able to guess, already-correct guesses should be rejected) before they became bugs.

## What I'd do differently
**Add TTL-based room cleanup**: Orphaned rooms accumulate in memory when all players leave. A simple TTL (e.g., 30 minutes since last activity) with an interval cleanup sweep would prevent unbounded memory growth. Currently, rooms live forever once created.

**Fix the host-last-leaves edge case**: When the last participant leaves, `leaveRoom()` casts `hostId: null as unknown as string` rather than cleaning up the room entirely or representing "no host" properly in the type system. This is a code smell — I'd either delete the room or add a proper optional `hostId` field.

**Share types between frontend and backend**: Currently, both sides independently duplicate the `RoomSnapshot`, `Participant`, `Guess`, and `ParticipantRole` interfaces. A shared package (even a single `types.ts` under a monorepo `packages/shared/`) would prevent type drift. I'd also add runtime validation on the client side (Zod schemas imported from the shared package) rather than trusting the server response shape.

**Add error recovery to polling**: Guess submission has a 3-retry wrapper, but `fetchRoom()` in the polling loop has none. A transient network blip causes the lobby/game screen to show an error state (or lose its last known state). I'd add a `fetchRoomSilent` pattern that retains the last known room snapshot on failure and silently retries on the next interval tick.

**Make the canvas responsive**: The `DrawingCanvas` has a hardcoded `minHeight: 500px` and uses `Math.max(500, parent.clientHeight)` — this breaks on mobile or narrow viewports. I'd use CSS aspect-ratio or ResizeObserver to make the canvas adapt to its container.
