# API Contract: Room Setup & Lobby

## Base URL

```
http://localhost:3001
```

All requests and responses use `Content-Type: application/json`.

---

## POST /rooms

Create a new game room. The creator is designated as host.

### Request

```json
{
  "playerName": "Alice"
}
```

`playerName`: string, optional — trimmed, 1–20 chars. If omitted or empty after trim, defaults to "Player". Error if whitespace-only.

### Response `201 Created`

```json
{
  "participantId": "uuid-string",
  "room": {
    "code": "A3X9K2",
    "status": "lobby",
    "participants": [
      { "id": "uuid-string", "name": "Alice", "joinedAt": "2026-06-03T12:00:00.000Z" }
    ],
    "hostId": "uuid-string",
    "availableWords": ["rocket", "pizza", "castle", "guitar", "sunflower"],
    "roles": ["drawer", "guesser"]
  }
}
```

### Errors

| Status | Condition |
|--------|-----------|
| 400 | `playerName` exceeds 20 characters, or is whitespace-only |

---

## POST /rooms/:code/join

Join an existing room by code.

### Request

```json
{
  "playerName": "Bob"
}
```

`playerName`: string, optional — trimmed, 1–20 chars. If omitted defaults to "Player". Must be unique within the room (case-insensitive).

`code` (path param): string — case-insensitive, leading/trailing whitespace trimmed.

### Response `200 OK`

Same shape as `POST /rooms`.

### Errors

| Status | Condition |
|--------|-----------|
| 400 | `playerName` exceeds 20 chars, whitespace-only, or duplicate name in room |
| 404 | Room code not found |
| 400 | Room code is empty or whitespace-only |

---

## GET /rooms/:code

Fetch the current room state (lobby snapshot).

### Query Parameters

| Param | Type | Description |
|-------|------|-------------|
| `participantId` | string, optional | Used for viewer-specific filtering (currently unused) |

### Response `200 OK`

```json
{
  "room": {
    "code": "A3X9K2",
    "status": "lobby",
    "participants": [ ... ],
    "hostId": "uuid-string",
    "availableWords": [...],
    "roles": [...]
  }
}
```

### Errors

| Status | Condition |
|--------|-----------|
| 404 | Room code not found |

---

## PATCH /rooms/:code/leave

Remove a participant from a room. If the participant is the host, promote the longest-tenured remaining participant.

### Request

```json
{
  "participantId": "uuid-string"
}
```

### Response `200 OK`

```json
{
  "room": {
    "code": "A3X9K2",
    "status": "lobby",
    "participants": [ ... ],
    "hostId": "uuid-string-or-null",
    "availableWords": [...],
    "roles": [...]
  }
}
```

### Errors

| Status | Condition |
|--------|-----------|
| 404 | Room code not found |
| 400 | `participantId` not found in room |

---

## Error Response Shape

All errors follow:

```json
{
  "message": "Human-readable error description"
}
```

Errors are returned with the appropriate HTTP status code and processed by the centralized Express error handler (`router.ts`).

---

## Frontend Polling Contract

The frontend polls `GET /rooms/:code` every ~2 seconds while the lobby page is active.

- On success: Update participant list and hostId reactively.
- On network error: Silently preserve last known state (no error toast).
- On 404 (room gone): Navigate back to home.
- On unmount: Clear the interval.
