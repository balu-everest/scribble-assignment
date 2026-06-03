# Data Model: Game Start & Drawer Flow

## Entities

### Room

| Field | Type | Description | Changes |
|-------|------|-------------|---------|
| `code` | `string` | Unique room identifier | Unchanged |
| `status` | `"lobby" \| "active"` | Current room phase | **Extended**: added `"active"` |
| `hostId` | `string` | Participant ID of the host | Unchanged |
| `participants` | `Participant[]` | All players in the room | **Extended**: Participant now has `role` field |
| `secretWord` | `string` | Word selected at game start | **New**: set during `startGame()`, only exposed to drawer |
| `createdAt` | `string` (ISO 8601) | Room creation timestamp | Unchanged |
| `updatedAt` | `string` (ISO 8601) | Last modification timestamp | Unchanged |

### Participant

| Field | Type | Description | Changes |
|-------|------|-------------|---------|
| `id` | `string` (UUIDv4) | Unique participant identifier | Unchanged |
| `name` | `string` | Display name | Unchanged |
| `joinedAt` | `string` (ISO 8601) | Join timestamp | Unchanged |
| `role` | `"drawer" \| "guesser" \| null` | Assigned role, null until game starts | **New**: set during `startGame()` |

### RoomSnapshot (API response shape — not stored)

| Field | Type | Description | Changes |
|-------|------|-------------|---------|
| `code` | `string` | Room code | Unchanged |
| `status` | `"lobby" \| "active"` | Room phase | **Extended** |
| `participants` | `Participant[]` | Participant list with roles | **Extended**: includes role field |
| `hostId` | `string` | Host participant ID | Unchanged |
| `drawerId` | `string \| null` | Participant ID of the drawer | **New**: set on game start |
| `secretWord` | `string \| null` | Secret word — **only if viewer is drawer** | **New**: filtered per-requester |
| `availableWords` | `string[]` | Word list (static seed) | Unchanged |
| `roles` | `string[]` | Role list (static seed) | Unchanged |

## Validation Rules (additions)

| Input | Rule | Error Message |
|-------|------|---------------|
| `participantId` (start) | Must match room.hostId | "Only the host can start the game" |
| `participantId` (start) | Must be a participant in the room | "Participant not found in room" |
| Room status (start) | Must be `"lobby"` | "Game has already started" |

## State Transitions

```
Room Created (status: "lobby", participants: [host])
  │
  ▼
Player Joins (status: "lobby", participants: [host, ...])
  │
  ▼
Host Starts Game ─────────────────────────────────────┐
  │                                                    │
  ▼                                                    │
status: "active"                                       │
roles assigned (host=drawer, others=guesser)            │
secretWord selected from starter list                   │
  │                                                    │
  ▼                                                    │
[Future] Round Progression (out of scope for this feature)
  │
  ▼
[Future] Game End (out of scope)
```

## Viewer-Specific Filtering Rules

1. `GET /rooms/:code?participantId=<id>` — the response includes `secretWord` **only if** the participant with that ID has role `"drawer"`.
2. If `participantId` is omitted or belongs to a guesser, `secretWord` is `null` or omitted from the response.
3. `participants[]` always includes all roles regardless of viewer (roles are public).

## Role Assignment Rules

1. The participant matching `room.hostId` is assigned `"drawer"`.
2. All other participants are assigned `"guesser"`.
3. Assignment happens atomically during `startGame()`.
4. `drawerId` on the snapshot equals the drawer's participant ID.
