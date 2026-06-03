# API Contract: Game Result, Restart & Final Validation

## Base URL

```
http://localhost:3001
```

All requests and responses use `Content-Type: application/json`.

---

## POST /rooms/:code/guess (updated)

Existing endpoint. The `status` in the response may now be `"result"` and the error message for inactive rooms changed.

### Response `200 OK` (correct guess triggers game end)

```json
{
  "room": {
    "code": "A3X9K2",
    "status": "result",
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

### Errors (updated)

| Status | Condition |
|--------|-----------|
| 400 | `text` is empty or whitespace-only (Zod validation) |
| 400 | `participantId` not found in room participants |
| 400 | Participant's role is not `"guesser"` |
| 400 | Participant has already guessed the correct word this round |
| 404 | Room code not found |
| 409 | Room status is not `"active"` — message: "Game has ended — no more guesses accepted" when status is `"result"` |

---

## POST /rooms/:code/restart

Restart the game from the result screen. Only the host may call this.

### Request

```json
{
  "participantId": "host-uuid"
}
```

`participantId`: string, required — must match the room's `hostId`.

### Response `200 OK`

```json
{
  "room": {
    "code": "A3X9K2",
    "status": "lobby",
    "participants": [
      { "id": "host-uuid", "name": "Alice", "joinedAt": "...", "role": null, "score": 0 },
      { "id": "guest-uuid", "name": "Bob", "joinedAt": "...", "role": null, "score": 0 }
    ],
    "hostId": "host-uuid",
    "drawerId": null,
    "secretWord": null,
    "availableWords": ["rocket", "pizza", "castle", "guitar", "sunflower"],
    "roles": ["drawer", "guesser"],
    "guesses": []
  }
}
```

Note: `role` is reset to `null` for all participants (lobby state, no roles assigned yet). `drawerId` is `null`. `secretWord` is `null`. `guesses` is empty.

### Errors

| Status | Condition |
|--------|-----------|
| 400 | `participantId` not found in room participants |
| 403 | `participantId` does not match room's `hostId` — message: "Only the host can restart the game" |
| 409 | Room status is not `"result"` — message: "Game can only be restarted from the result screen" |
| 404 | Room code not found |

---

## GET /rooms/:code (updated)

The existing snapshot endpoint now may return `status: "result"` or `status: "lobby"` (after restart). The response shape is unchanged.

### Response `200 OK` (result state)

```json
{
  "room": {
    "code": "A3X9K2",
    "status": "result",
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
    "guesses": [...]
  }
}
```

### Response `200 OK` (lobby state after restart)

```json
{
  "room": {
    "code": "A3X9K2",
    "status": "lobby",
    "participants": [
      { "id": "host-uuid", "name": "Alice", "joinedAt": "...", "role": null, "score": 0 },
      { "id": "guest-uuid", "name": "Bob", "joinedAt": "...", "role": null, "score": 0 },
      { "id": "other-uuid", "name": "Charlie", "joinedAt": "...", "role": null, "score": 0 }
    ],
    "hostId": "host-uuid",
    "drawerId": null,
    "secretWord": null,
    "availableWords": ["rocket", "pizza", "castle", "guitar", "sunflower"],
    "roles": ["drawer", "guesser"],
    "guesses": []
  }
}
```

---

## Error Response Shape (unchanged)

```json
{
  "message": "Human-readable error description"
}
```

---

## Frontend Polling & Routing Contract (updated)

### Polling Loop (all screens)

The frontend polls `GET /rooms/:code?participantId=<id>` every ~2 seconds on all screens (lobby, game, result). Based on `room.status`:

| Status | Action |
|--------|--------|
| `"active"` | Navigate to `/game` (existing) |
| `"result"` | Navigate to `/result` (new) |
| `"lobby"` | Navigate to `/lobby` (new: for current page detection) |

### Restart Request

The host clicks a restart button on the Result Screen:
1. Call `POST /rooms/:code/restart` with `{ participantId }`.
2. On success: The response snapshot has `status: "lobby"`. The polling loop detects this and navigates to `/lobby`.
3. On 403 (non-host): Show error toast "Only the host can restart the game".
4. On 409 (wrong state): Show error toast "Game can only be restarted from the result screen".
5. On network error: Show generic error toast "Failed to restart. Please try again."
