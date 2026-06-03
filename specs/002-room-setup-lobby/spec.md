# Feature Specification: Room Setup & Lobby

**Feature Branch**: `002-room-setup-lobby`

**Created**: 2026-06-03

**Status**: Draft

**Input**: User description: "Implement Scenario 1 — Room Setup & Lobby. Requirements: 1. Host Tracking, 2. Strict Validation, 3. Room Isolation, 4. Auto-Polling, 5. Host Gating."

## Clarifications

### Session 2026-06-03

- Q: Can players voluntarily leave a room? → A: Yes, all players (including host) can leave via a "Leave Room" button. Leaving updates the participant list for remaining players. If the host leaves, host transfers to the player who has been in the room the longest (same as disconnect behavior).
- Q: How should case sensitivity work for room codes and player names? → A: Room codes are case-insensitive (stored uppercase canonical form). Player names are case-insensitive for uniqueness checks but preserve the display casing as entered.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Create a Game Room (Priority: P1)

A player wants to start a new drawing game. They enter their display name, create a room, and are immediately placed in that room as the designated host. The system generates a unique room code that other players can use to join.

**Why this priority**: Room creation is the entry point for every game session. Without it, no multiplayer game can begin.

**Independent Test**: A player can navigate to the create-room screen, enter a valid display name, submit, and see a lobby screen with a unique room code displayed. The player's name appears in the participant list with a "Host" indicator.

**Acceptance Scenarios**:

1. **Given** a player is on the create-room screen, **When** they enter a valid display name and submit, **Then** a new room is created, the player is designated as host, a unique room code is generated, and they are shown the lobby.
2. **Given** a player creates a room, **When** the room is created, **Then** the system returns the room code and host status, and the player sees the lobby with themselves as the only participant.
3. **Given** any player enters only whitespace or an empty string as their display name, **When** they attempt to create a room, **Then** they receive a clear error message indicating the name cannot be empty or whitespace-only, and the room is not created.

---

### User Story 2 - Join an Existing Room (Priority: P1)

A player wants to join a friend's game. They enter the room code provided by the host along with their display name. The system validates the room exists and the name is acceptable, then adds them to the lobby where they see all current participants.

**Why this priority**: Joining is the other half of the multiplayer flow. Without it, only the host would ever be in a room.

**Independent Test**: A player can enter a valid room code and display name, submit, and see the lobby showing the host and themselves in the participant list. The room code in the lobby header matches what they entered.

**Acceptance Scenarios**:

1. **Given** an existing room with code "ABC123", **When** a player enters "ABC123" and a valid display name and submits, **Then** they are added to the room and see the lobby with the participant list including the host and themselves.
2. **Given** a player enters a room code that does not match any existing room, **When** they attempt to join, **Then** they receive a clear error message that the room was not found.
3. **Given** a player enters only whitespace as their display name or room code, **When** they attempt to join, **Then** they receive a clear error message, and they are not added to any room.
4. **Given** a player enters a display name that is already taken in the target room, **When** they attempt to join, **Then** they receive a clear error message that the name is already in use, and they are not added.
5. **Given** an existing room with code "ABC123", **When** a player enters "abc123" (lowercase) and submits, **Then** they are added to the room successfully, demonstrating case-insensitive code matching.
6. **Given** an existing room with a player named "Alice", **When** a second player enters the name "alice" (lowercase) and attempts to join, **Then** they receive an error that the name is already in use.

---

### User Story 3 - Lobby Participant Synchronization (Priority: P2)

After creating or joining a room, all players in the lobby see the participant list stay up to date. When a new player joins, the list updates for everyone without manual page refresh. Players can see who is the host.

**Why this priority**: Real-time awareness of who is in the room is essential for coordination and knowing when enough players are present to start.

**Independent Test**: Open two browser windows. In window A, create a room. In window B, join the same room. Within 3 seconds of B joining, window A's participant list updates to show B's name without any manual action.

**Acceptance Scenarios**:

1. **Given** a player is in the lobby, **When** another player joins the room, **Then** the first player's participant list updates automatically within 3 seconds to show the new player.
2. **Given** a player is in the lobby, **When** they view the participant list, **Then** the host is clearly identified (e.g., with a badge or icon) separate from non-host players.
3. **Given** a player is in the lobby, **When** the auto-poll fails due to network issues, **Then** the player sees the last known participant list without errors, and the polling retries automatically.

---

### User Story 4 - Host Starts Game (Priority: P2)

The host of the room sees a "Start Game" button in the lobby. The button is visually disabled when fewer than 2 players are present. Once at least 2 players have joined, the button becomes enabled. Non-host players never see this button.

**Why this priority**: Host gating ensures only the room creator can start the game, preventing conflicts. The 2-player minimum enforces a basic game requirement.

**Independent Test**: Host creates a room and sees a disabled "Start Game" button with 1 player. A second player joins and the button becomes enabled automatically. Non-host players never see the button at all.

**Acceptance Scenarios**:

1. **Given** the host is in the lobby with only themselves present, **When** they look at the lobby controls, **Then** the "Start Game" button is visible but disabled or clearly indicates more players are needed.
2. **Given** the host is in the lobby and at least 2 players are present (including the host), **When** they look at the lobby controls, **Then** the "Start Game" button is enabled and clickable.
3. **Given** a non-host player is in the lobby with any number of players, **When** they look at the lobby controls, **Then** they do not see a "Start Game" button.
4. **Given** the lobby has 2+ players and host clicks "Start Game", **When** they click the button, **Then** the system initiates the game transition (the specific game-start behavior is defined in a later scenario).

---

### Edge Cases

- What happens when a player attempts to join a room using a room code that contains leading/trailing whitespace? The system trims the input and processes it normally.
- How does the system handle a player who enters a 200-character display name? The system enforces a reasonable length limit (e.g., 20 characters) and rejects names exceeding it with a descriptive error.
- What happens when a player attempts to create a room while already in one? The system handles gracefully — either prevents creating a new room while in one, or creates the new room and leaves the old one.
- What happens to the lobby if the host closes their browser or disconnects? The room remains active. The player who has been in the room the longest (after the host) becomes the new host. If no other players are in the room, the room is eventually cleaned up.
- What happens when a player voluntarily leaves a room? Any player (including host) can click a "Leave Room" button to depart. The participant list updates for remaining players. If the host leaves, host transfers to the longest-tenured remaining player. If the last player leaves, the room is eventually cleaned up.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow a player to create a new game room by providing a display name, and MUST designate that player as the host of the room.
- **FR-002**: System MUST generate a unique, non-guessable room code for each new room (e.g., 6-character uppercase alphanumeric). Room codes MUST be treated case-insensitively for matching and stored in uppercase canonical form.
- **FR-003**: System MUST allow a player to join an existing room by providing a room code and a display name.
- **FR-004**: System MUST trim leading and trailing whitespace from all player names and room codes before processing.
- **FR-005**: System MUST reject empty or whitespace-only player names with a clear, descriptive error message.
- **FR-006**: System MUST reject empty or whitespace-only room codes with a clear, descriptive error message.
- **FR-007**: System MUST reject join attempts for non-existent room codes with a clear error message.
- **FR-008**: System MUST enforce unique display names within a room — no two players in the same room may share the same trimmed name. Name uniqueness MUST be case-insensitive (e.g., "Bob" and "bob" are considered duplicates).
- **FR-009**: System MUST completely isolate room data structures so that players, state, and operations in one room never affect another room.
- **FR-010**: System MUST expose a lobby endpoint that returns the current participant list for a given room, including which player is the host.
- **FR-011**: Frontend MUST poll the lobby endpoint every ~2 seconds while a player is in the lobby to keep the participant list synchronized.
- **FR-012**: Frontend MUST display a "Start Game" button visible only to the host of the room.
- **FR-013**: The "Start Game" button MUST be disabled or visually indicate it cannot be clicked when fewer than 2 players are present in the room.
- **FR-014**: System MUST enforce a maximum display name length (e.g., 20 characters) and reject names exceeding it with a descriptive error.

### Key Entities *(include if feature involves data)*

- **Room**: A discrete game session identified by a unique 6-character alphanumeric code (case-insensitive, stored uppercase). Contains a list of players and a reference to the host player. Each room is fully isolated in its own data structure.
- **Player**: A participant in a room, identified by their trimmed display name. Has a role designation (host or non-host). Players are unique by name within a room.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A player can create a room and see themselves listed as host within 2 seconds.
- **SC-002**: A player can join a room by code within 2 seconds and see the lobby with at least the host listed.
- **SC-003**: When a new player joins a room, all existing players in that room see the updated participant list within 3 seconds (via auto-polling).
- **SC-004**: A host can clearly identify the "Start Game" button and its enabled/disabled state reflects the player count within 3 seconds of any change.
- **SC-005**: Non-host players never see the "Start Game" button under any circumstances.
- **SC-006**: All invalid input scenarios (empty name, whitespace name, invalid room code, duplicate name) return clear error messages within 1 second of submission.

## Assumptions

- Room codes are 6-character uppercase alphanumeric strings, auto-generated by the backend. Room code matching is case-insensitive (input is uppercased before comparison).
- Maximum display name length is 20 characters.
- The frontend uses short-polling (HTTP GET) every ~2 seconds — no WebSocket or push technology.
- If the host disconnects or voluntarily leaves, the player who has been in the room the longest (after the host) is automatically promoted to host. If no other players remain, the room becomes orphaned and can be cleaned up.
- All data is stored in-memory on the backend; no persistence is required.
- No authentication or user accounts exist — players are identified solely by their display name within a room session.
