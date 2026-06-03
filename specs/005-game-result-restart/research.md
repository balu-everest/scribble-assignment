# Phase 0: Research — Game Result, Restart & Final Validation

**Branch**: `005-game-result-restart` | **Date**: 2026-06-03

## Summary

No NEEDS CLARIFICATION markers were present in the spec. All technical context is well-established from the existing project (previous 4 features). This research document confirms known patterns and decisions.

## Decisions

### Backend State Transitions
- **Decision**: Room status enum extended to `'lobby' | 'active' | 'result'`
- **Rationale**: The existing `RoomStatus` type already has `'lobby'` and `'active'`; adding `'result'` is a straightforward single-value extension.
- **Alternatives considered**: Using a separate `gamePhase` field — rejected as redundant; the single `status` field is sufficient for the three-state lifecycle.

### Correct Guess → Result Transition
- **Decision**: The guess handler checks the room status before each submission. When a submission passes case-insensitive matching, the handler atomically sets `room.status = 'result'` and returns the updated snapshot.
- **Rationale**: Matches the existing guess-handling pattern in `roomStore.ts`. No additional state machine is needed.
- **Alternatives considered**: A separate state machine or event-based trigger — unnecessary complexity for a single deterministic transition.

### Restart Endpoint
- **Decision**: New `POST /rooms/:code/restart` handler validates: (1) room exists, (2) requester is host, (3) room is in `'result'` state. On success: reset `guesses` to `[]`, set all `participants[i].score = 0`, set `status = 'lobby'`.
- **Rationale**: The host-gated, state-gated pattern mirrors the existing `PATCH /rooms/:code/start` handler.
- **Alternatives considered**: Including restart in an existing endpoint — rejected for clarity and separation of concerns.

### Frontend Routing via Polling
- **Decision**: The existing polling loop in `roomStore.ts` already fetches room state every ~2s. A `useEffect` watches `room.status` and triggers `navigate()` based on the value: `'result'` → `/result`, `'lobby'` → `/lobby`, `'active'` → `/game`.
- **Rationale**: Reuses the existing polling infrastructure. The `RoomContext` or `roomStore` state update naturally triggers re-renders that can drive navigation.
- **Alternatives considered**: Separate polling loops per page — unnecessary; a single source of truth is simpler and avoids desync.

### Result Screen Winner Highlight
- **Decision**: Client-side calculation: find max score, visually mark all players with that score.
- **Rationale**: Scores are already public in the room snapshot. No backend change needed for winner determination.
- **Alternatives considered**: Backend computing the winner — adds unnecessary server logic; the data is already present in the snapshot.

### Canvas Wipe on Return to Lobby
- **Decision**: The `LobbyScreen` component checks if the user came from a game (e.g., via a flag in roomStore or navigation state) and calls the canvas clear method on mount. Alternatively, the `DrawingCanvas` component clears itself when `room.status` transitions away from `'active'`.
- **Rationale**: Ensures no leftover drawings persist regardless of how the user arrives at the lobby.
- **Alternatives considered**: Clearing on game exit only — insufficient for the restart case where no "exit" action occurs.

### Non-Host Result Screen UX
- **Decision**: The Result Screen conditionally renders the restart button only when `participantId === room.hostId`. Non-hosts see a static message.
- **Rationale**: Matches the clarified spec (FR-014). Simple conditional rendering.
- **Alternatives considered**: Hiding all controls for non-hosts — less helpful; showing a disabled button — potentially confusing.

## Dependencies

- The `'result'` state depends on the guess-handling logic from Scenario 3 (004-gameplay-interaction) being complete.
- The frontend routing depends on the existing polling setup in `roomStore.ts`.
- The Result Screen is a new page but reuses the existing `Scoreboard` component for displaying scores.
