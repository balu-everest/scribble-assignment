# Data Model: Gameplay Interaction

## Entities

### Room (extended)

| Field | Type | Description | Changes |
|-------|------|-------------|---------|
| `code` | `string` | Unique room identifier | Unchanged |
| `status` | `"lobby" \| "active"` | Current room phase | Unchanged |
| `hostId` | `string` | Participant ID of the host | Unchanged |
| `participants` | `Participant[]` | All players in the room | **Extended**: Participant now has `score` field |
| `secretWord` | `string` | Word selected at game start | Unchanged |
| `guesses` | `Guess[]` | All guesses submitted in this round | **New**: populated by `submitGuess()` |
| `createdAt` | `string` (ISO 8601) | Room creation timestamp | Unchanged |
| `updatedAt` | `string` (ISO 8601) | Last modification timestamp | Unchanged |

### Participant (extended)

| Field | Type | Description | Changes |
|-------|------|-------------|---------|
| `id` | `string` (UUIDv4) | Unique participant identifier | Unchanged |
| `name` | `string` | Display name | Unchanged |
| `joinedAt` | `string` (ISO 8601) | Join timestamp | Unchanged |
| `role` | `"drawer" \| "guesser" \| null` | Assigned role | Unchanged |
| `score` | `number` | Cumulative points from correct guesses | **New**: default `0`, incremented by +100 on correct guess |

### Guess (new)

| Field | Type | Description |
|-------|------|-------------|
| `participantId` | `string` (UUIDv4) | ID of the guesser who submitted this |
| `participantName` | `string` | Display name of the guesser (denormalized for display) |
| `text` | `string` | The trimmed guess text |
| `timestamp` | `string` (ISO 8601) | Server receipt time |
| `isCorrect` | `boolean` | Whether the guess matches the secret word (case-insensitive) |

### RoomSnapshot (API response shape — not stored, extended)

| Field | Type | Description | Changes |
|-------|------|-------------|---------|
| `code` | `string` | Room code | Unchanged |
| `status` | `"lobby" \| "active"` | Room phase | Unchanged |
| `participants` | `Participant[]` | Participant list with roles and scores | **Extended**: includes `score` field |
| `hostId` | `string` | Host participant ID | Unchanged |
| `drawerId` | `string \| null` | Participant ID of the drawer | Unchanged |
| `secretWord` | `string \| null` | Secret word — only if viewer is drawer | Unchanged |
| `availableWords` | `string[]` | Word list (static seed) | Unchanged |
| `roles` | `string[]` | Role list (static seed) | Unchanged |
| `guesses` | `Guess[]` | All guesses in chronological order | **New**: appended to each poll response |

## Validation Rules (additions)

| Input | Rule | Error Message |
|-------|------|---------------|
| `participantId` (guess) | Must be a participant in the room | "Participant not found in room" |
| `text` (guess) | Must be non-empty after trimming | "Guess cannot be empty" |
| `text` (guess) | Must contain non-whitespace characters | "Guess cannot be empty" |
| Room status (guess) | Must be `"active"` | "Game is not in progress" |
| `participantId` (guess) | Must have role `"guesser"` | "Only guessers can submit guesses" |

## Scoring Rules

1. A guess is "correct" if `guess.text.toLowerCase() === secretWord.toLowerCase()`.
2. On a correct guess, the guesser's `score` is incremented by exactly 100.
3. Incorrect guesses award 0 points.
4. All guessers who submit the correct word receive 100 points (no deduplication — each correct submission awards points).
5. The drawer does not receive points when a guesser guesses correctly.
6. Scores are tracked for the duration of the game and reset when a new room is created.

## State Transitions

```
Room Created (status: "lobby")
  │
  ▼
Game Started (status: "active", roles assigned, secretWord set)
  │
  ├── Guesser submits guess ──────────────────────────────────────┐
  │   │                                                            │
  │   ├── text.trim() === "" → reject (400 error, descriptive msg) │
  │   │                                                            │
  │   ├── text !== secretWord (case-insensitive)                    │
  │   │   → Append Guess{isCorrect: false} to guesses[]            │
  │   │   → score unchanged                                        │
  │   │                                                             │
  │   └── text === secretWord (case-insensitive)                    │
  │       → Append Guess{isCorrect: true} to guesses[]              │
  │       → guesser.score += 100                                   │
  │                                                                 │
  └── All participants poll GET /rooms/:code                        │
      → Response includes updated guesses[] and participants[].score │
                                                                     │
  [Future] Round End (out of scope for this feature)
```

## Viewer-Specific Filtering Rules (unchanged from previous feature)

1. `GET /rooms/:code?participantId=<id>` — the response includes `secretWord` only if the participant has role `"drawer"`.
2. Guesses array is visible to all participants (both drawer and guessers — no filtering on guesses).
3. Scores are visible to all participants.
