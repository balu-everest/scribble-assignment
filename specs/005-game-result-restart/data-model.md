# Data Model: Game Result, Restart & Final Validation

## Entities

### Room (extended)

| Field | Type | Description | Changes |
|-------|------|-------------|---------|
| `code` | `string` | Unique room identifier | Unchanged |
| `status` | `"lobby" \| "active" \| "result"` | Current room phase | **Extended**: added `"result"` state |
| `hostId` | `string` | Participant ID of the host | Unchanged |
| `participants` | `Participant[]` | All players in the room | Unchanged |
| `secretWord` | `string` | Word selected at game start | Unchanged |
| `guesses` | `Guess[]` | All guesses submitted this round | Cleared on restart |
| `createdAt` | `string` (ISO 8601) | Room creation timestamp | Unchanged |
| `updatedAt` | `string` (ISO 8601) | Last modification timestamp | Unchanged |

### Participant (extended)

| Field | Type | Description | Changes |
|-------|------|-------------|---------|
| `id` | `string` (UUIDv4) | Unique participant identifier | Unchanged |
| `name` | `string` | Display name | Unchanged |
| `joinedAt` | `string` (ISO 8601) | Join timestamp | Unchanged |
| `role` | `"drawer" \| "guesser" \| null` | Assigned role | Unchanged |
| `score` | `number` | Cumulative points | Reset to `0` on restart |

### Guess (unchanged, cleared on restart)

| Field | Type | Description |
|-------|------|-------------|
| `participantId` | `string` (UUIDv4) | ID of the guesser |
| `participantName` | `string` | Display name of the guesser |
| `text` | `string` | The trimmed guess text |
| `timestamp` | `string` (ISO 8601) | Server receipt time |
| `isCorrect` | `boolean` | Whether the guess matched the secret word |

### RoomSnapshot (API response shape — extended)

| Field | Type | Description | Changes |
|-------|------|-------------|---------|
| `code` | `string` | Room code | Unchanged |
| `status` | `"lobby" \| "active" \| "result"` | Room phase | **Extended**: may now be `"result"` |
| `participants` | `Participant[]` | Participant list with roles and scores | Unchanged |
| `hostId` | `string` | Host participant ID | Unchanged |
| `drawerId` | `string \| null` | Participant ID of the drawer | Unchanged |
| `secretWord` | `string \| null` | Secret word — only if viewer is drawer | Unchanged |
| `availableWords` | `string[]` | Word list | Unchanged |
| `roles` | `string[]` | Role list | Unchanged |
| `guesses` | `Guess[]` | All guesses in chronological order | Empty after restart |

## State Transitions

```
lobby ──[host starts game]──► active ──[correct guess]──► result
  ▲                                                          │
  └────────────[host restarts]───────────────────────────────┘
```

1. **lobby → active**: Host calls start. Roles assigned, secret word selected. (Existing)
2. **active → result**: A correct guess is submitted. The guess handler sets `room.status = "result"`.
3. **result → lobby**: Host calls restart. Guesses cleared, scores reset to 0, player list preserved.
4. **result (terminal)**: No further guesses accepted. Only host restart is valid action.
5. **lobby or active → result via restart**: Explicitly rejected — restart only valid from `"result"` state.

## Validation Rules (additions)

| Input | Rule | Error Message |
|-------|------|---------------|
| `participantId` (restart) | Must match `room.hostId` | "Only the host can restart the game" |
| Room status (restart) | Must be `"result"` | "Game can only be restarted from the result screen" |
| Room status (guess) | Must be `"active"` | **Extended**: changed from "Game is not in progress" to "Game has ended — no more guesses accepted" when status is `"result"` |

## Scoring Rules (extended)

1–6. Unchanged from Scenario 3.
7. On restart (`result → lobby`), all participant scores are reset to `0`.
8. The winner(s) at game end are the participant(s) with the highest `score`. Ties are permitted.
