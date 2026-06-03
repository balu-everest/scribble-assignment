# API Contract: Gameplay Interaction

## Base URL

```
http://localhost:3001
```

All requests and responses use `Content-Type: application/json`.

---

## POST /rooms/:code/guess

Submit a guess for the current round. The backend validates, trims, optionally awards points, and appends to the guess log.

### Request

```json
{
  "participantId": "uuid-string",
  "text": "rocket"
}
```

`participantId`: string, required — must belong to a participant with role `"guesser"` in the room.

`text`: string, required — will be trimmed before processing. Empty or whitespace-only values are rejected.

### Response `200 OK`

```json
{
  "room": {
    "code": "A3X9K2",
    "status": "active",
    "participants": [
      { "id": "host-uuid", "name": "Alice", "joinedAt": "...", "role": "drawer", "score": 0 },
      { "id": "guest-uuid", "name": "Bob", "joinedAt": "...", "role": "guesser", "score": 100 }
    ],
    "hostId": "host-uuid",
    "drawerId": "host-uuid",
    "secretWord": "rocket",
    "availableWords": ["rocket", "pizza", "castle", "guitar", "sunflower"],
    "roles": ["drawer", "guesser"],
    "guesses": [
      {
        "participantId": "guest-uuid",
        "participantName": "Bob",
        "text": "rocket",
        "timestamp": "2026-06-03T12:00:00.000Z",
        "isCorrect": true
      }
    ]
  }
}
```

`secretWord` visibility follows the same viewer-specific filtering rules (visible only if the requester is the drawer).

### Errors

| Status | Condition |
|--------|-----------|
| 400 | `text` is empty or whitespace-only (Zod validation) |
| 400 | `participantId` not found in room participants |
| 400 | Participant's role is not `"guesser"` (drawers cannot guess) |
| 400 | Participant has already guessed the correct word this round |
| 404 | Room code not found |
| 409 | Room status is not `"active"` (game not in progress) |

---

## GET /rooms/:code (updated)

The existing snapshot endpoint now includes `guesses` and `scores` in the response.

### Query Parameters

| Param | Type | Description |
|-------|------|-------------|
| `participantId` | string, optional | Used for viewer-specific filtering (secret word visibility) |

### Response `200 OK`

```json
{
  "room": {
    "code": "A3X9K2",
    "status": "active",
    "participants": [
      { "id": "host-uuid", "name": "Alice", "joinedAt": "...", "role": "drawer", "score": 0 },
      { "id": "guest-uuid", "name": "Bob", "joinedAt": "...", "role": "guesser", "score": 100 },
      { "id": "other-uuid", "name": "Charlie", "joinedAt": "...", "role": "guesser", "score": 0 }
    ],
    "hostId": "host-uuid",
    "drawerId": "host-uuid",
    "secretWord {drawer}": "rocket",
    "secretWord {guesser}": null,
    "availableWords": ["rocket", "pizza", "castle", "guitar", "sunflower"],
    "roles": ["drawer", "guesser"],
    "guesses": [
      {
        "participantId": "guest-uuid",
        "participantName": "Bob",
        "text": "wrong",
        "timestamp": "2026-06-03T12:00:00.000Z",
        "isCorrect": false
      },
      {
        "participantId": "other-uuid",
        "participantName": "Charlie",
        "text": "rocket",
        "timestamp": "2026-06-03T12:00:05.000Z",
        "isCorrect": true
      }
    ]
  }
}
```

The `guesses` array is visible to all participants (no role-based filtering). Scores are visible on each participant object.

### Errors

| Status | Condition |
|--------|-----------|
| 404 | Room code not found |

---

## Error Response Shape (unchanged)

```json
{
  "message": "Human-readable error description"
}
```

Errors are returned with the appropriate HTTP status code and processed by the centralized Express error handler (`router.ts`).

---

## Frontend Polling Contract (updated)

### Game Page — Polling Loop

The frontend polls `GET /rooms/:code?participantId=<id>` every ~2 seconds while on the game page.

- On success: Update room state — participants (with scores), guesses, and role-based secretWord.
- The `guesses` array is rendered in the ResultPanel (guess history).
- The `participants[].score` fields are rendered in the Scoreboard (sorted by score descending).
- On network error: Silently preserve last known state.
- On 404: Navigate back to home.
- On unmount: Clear the interval.

### Guess Submission

The `POST /rooms/:code/guess` endpoint is called on form submission:

1. Send request with `{ participantId, text }`.
2. **Auto-retry**: If the request fails with a network error (no response), retry up to 3 times with ~1s delay between attempts. Server validation errors (4xx with JSON body) must not be retried — they are final.
3. **On success**: Clear the input field. The new guess appears in the guess log on the next poll cycle.
4. **On validation failure** (4xx response): Display the server's exact error message from the JSON response body inline near the input field. Preserve the typed text.
5. **On network failure** (all retries exhausted): Display a generic fallback message "Failed to submit guess. Please try again." inline near the input field. Preserve the typed text.
