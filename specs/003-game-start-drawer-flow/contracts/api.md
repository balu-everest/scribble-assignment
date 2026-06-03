# API Contract: Game Start & Drawer Flow

## Base URL

```
http://localhost:3001
```

All requests and responses use `Content-Type: application/json`.

---

## POST /rooms/:code/start

Start the game. Transitions room from `"lobby"` to `"active"`, assigns roles, and selects the secret word. Only the host may call this.

### Request

```json
{
  "participantId": "uuid-string"
}
```

`participantId`: string, required — must match the room's `hostId`.

### Response `200 OK`

```json
{
  "room": {
    "code": "A3X9K2",
    "status": "active",
    "participants": [
      { "id": "host-uuid", "name": "Alice", "joinedAt": "...", "role": "drawer" },
      { "id": "guest-uuid", "name": "Bob", "joinedAt": "...", "role": "guesser" }
    ],
    "hostId": "host-uuid",
    "drawerId": "host-uuid",
    "secretWord": "rocket",
    "availableWords": ["rocket", "pizza", "castle", "guitar", "sunflower"],
    "roles": ["drawer", "guesser"]
  }
}
```

`secretWord` is always included in the start response (returned to the initiator, who is the host/drawer).

### Errors

| Status | Condition |
|--------|-----------|
| 403 | `participantId` does not match room's `hostId` |
| 404 | Room code not found |
| 400 | `participantId` not found in room participants |
| 409 | Room status is not `"lobby"` (already started) |

---

## GET /rooms/:code (updated)

Fetch the current room state. The response is now filtered based on the requesting participant's role.

### Query Parameters

| Param | Type | Description |
|-------|------|-------------|
| `participantId` | string, optional | Used for viewer-specific filtering |

### Response `200 OK` — when viewer is the drawer

```json
{
  "room": {
    "code": "A3X9K2",
    "status": "active",
    "participants": [
      { "id": "host-uuid", "name": "Alice", "joinedAt": "...", "role": "drawer" },
      { "id": "guest-uuid", "name": "Bob", "joinedAt": "...", "role": "guesser" }
    ],
    "hostId": "host-uuid",
    "drawerId": "host-uuid",
    "secretWord": "rocket",
    "availableWords": ["rocket", "pizza", "castle", "guitar", "sunflower"],
    "roles": ["drawer", "guesser"]
  }
}
```

### Response `200 OK` — when viewer is a guesser (or no participantId)

```json
{
  "room": {
    "code": "A3X9K2",
    "status": "active",
    "participants": [
      { "id": "host-uuid", "name": "Alice", "joinedAt": "...", "role": "drawer" },
      { "id": "guest-uuid", "name": "Bob", "joinedAt": "...", "role": "guesser" }
    ],
    "hostId": "host-uuid",
    "drawerId": "host-uuid",
    "secretWord": null,
    "availableWords": ["rocket", "pizza", "castle", "guitar", "sunflower"],
    "roles": ["drawer", "guesser"]
  }
}
```

Note: `secretWord` is `null` for guessers. All other fields (including roles on participants) are visible to everyone.

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

### Lobby Page

The frontend polls `GET /rooms/:code` every ~2 seconds while on the lobby page.

- On success with `status: "lobby"`: Stay on lobby, update participant list.
- On success with `status: "active"`: **Navigate to `/game`** immediately.
- On network error: Silently preserve last known state.
- On 404: Navigate back to home.

### Game Page

The frontend polls `GET /rooms/:code` every ~2 seconds while on the game page.

- On success: Update room state (participants, roles, drawer info).
- The drawer sees `secretWord` in the response; guessers see `null`.
- On network error: Silently preserve last known state.
- On 404: Navigate back to home.
- On unmount: Clear the interval.
