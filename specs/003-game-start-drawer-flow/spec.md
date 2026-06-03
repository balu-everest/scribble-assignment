# Feature Specification: Game Start & Drawer Flow

**Feature Branch**: `003-game-start-drawer-flow`

**Created**: 2026-06-03

**Status**: Draft

**Input**: User description: "Implement Scenario 2 — Game Start & Drawer Flow. Requirements: 1. Transition Out of Lobby, 2. Routing via Polling, 3. Player Name Validation Re-enforcement, 4. Role & Word Assignment, 5. Viewer-Specific Responses (Security). Out of Scope: No multi-round logic, no drawer rotation, no round timers."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Host Starts the Game (Priority: P1)

As the host of a room in the lobby, I want to start the game so that all participants can begin playing. The game transitions out of the lobby and roles are assigned.

**Why this priority**: This is the primary trigger for the entire feature — without game start, no gameplay can occur. It is the single action that unlocks all downstream behavior.

**Independent Test**: Can be fully tested by having a host in a lobby with at least one other player, clicking a start action, and observing all participants leave the lobby and see their assigned roles.

**Acceptance Scenarios**:

1. **Given** a room in 'lobby' state with a host and at least one other player, **When** the host initiates game start, **Then** the room state transitions to 'active' and all players receive updated room state reflecting the change.
2. **Given** a room in 'lobby' state, **When** a non-host player attempts to start the game, **Then** the request is rejected and the room remains in 'lobby' state.
3. **Given** a room with only the host present, **When** the host initiates game start, **Then** the game starts successfully with the host as the sole participant.
4. **Given** an already active room, **When** the host initiates game start again, **Then** the request is rejected as the game is already in progress.

---

### User Story 2 - Players Are Routed to the Game Screen (Priority: P1)

As a participant in a room, I want to automatically leave the lobby screen and see the game screen when the host starts the game, so that I can immediately begin playing without manual navigation.

**Why this priority**: Automatic routing is essential for a seamless multiplayer experience. Players should not need to refresh or manually navigate to join the game.

**Independent Test**: Can be fully tested by having a participant join a lobby, waiting for the host to start the game, and observing the participant's screen automatically transition to the game view within a few seconds.

**Acceptance Scenarios**:

1. **Given** a participant on the lobby screen waiting for game start, **When** the host starts the game, **Then** within a short polling interval the participant detects the 'active' room state and is automatically routed to the game screen.
2. **Given** a participant who joins a room after the game has already started, **When** they poll for room state, **Then** they receive the 'active' state and are routed directly to the game screen.

---

### User Story 3 - Players See Their Roles and Game Information (Priority: P2)

As a player in an active game, I want to see my assigned role (drawer or guesser) and the relevant game information, so that I understand my objective and can participate meaningfully.

**Why this priority**: Role visibility is core to gameplay. The drawer needs the secret word to draw, and guessers need to know they are guessing without seeing the word.

**Independent Test**: Can be fully tested by starting a game and verifying that the drawer sees the secret word while guessers do not, and that all players correctly see their role label.

**Acceptance Scenarios**:

1. **Given** a game that has just started, **When** the drawer requests the current room state, **Then** they see their role as 'drawer' and the secret word is visible in the response.
2. **Given** a game that has just started, **When** a guesser requests the current room state, **Then** they see their role as 'guesser' and the secret word is NOT visible in the response.
3. **Given** a game with exactly two players, **When** the game starts, **Then** the host is designated as drawer and the other player is designated as guesser.

---

### User Story 4 - Player Names Are Validated Upon Entry (Priority: P3)

As the system, I want to ensure that all player names stored during active gameplay are trimmed and non-empty, so that the game display is clean and no anonymous or whitespace-only participants exist.

**Why this priority**: Name validation is a quality-of-life safeguard that prevents display issues and confusion during gameplay.

**Independent Test**: Can be fully tested by attempting to enter a room with whitespace-only or empty names and observing rejection.

**Acceptance Scenarios**:

1. **Given** a player attempting to join a room, **When** they provide a name consisting only of whitespace characters, **Then** the system rejects the entry and returns an appropriate error.
2. **Given** a player attempting to join a room, **When** they provide a name with surrounding whitespace, **Then** the system trims the whitespace and accepts the trimmed name.
3. **Given** a player attempting to join a room, **When** they provide an empty string as a name, **Then** the system rejects the entry.

### Edge Cases

- What happens if the host disconnects immediately after starting the game? The game remains active with remaining players.
- What happens if a player joins during the transition from lobby to active? The player receives the active room state with a role assignment (guesser if they are not the host).
- How does the system handle a room where all guessers leave after game starts? The game continues (edge of scope — only initial state is covered).
- What happens if the polling detects an error (e.g., room not found)? The user should see a friendly error message rather than crashing.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST provide a mechanism (e.g., an action or endpoint) for the host to start the game from the lobby state.
- **FR-002**: The system MUST reject game start requests from non-host participants.
- **FR-003**: When the host starts the game, the room state MUST transition from 'lobby' to 'active'.
- **FR-004**: The system MUST reject game start if the room is already in an 'active' state.
- **FR-005**: The frontend MUST periodically poll (approximately every 2 seconds) for room state updates while on the lobby screen.
- **FR-006**: When the frontend detects the room state has changed to 'active', it MUST automatically navigate the user to the game screen.
- **FR-007**: Player names MUST be trimmed of leading and trailing whitespace upon room entry.
- **FR-008**: Player names that are empty or contain only whitespace after trimming MUST be rejected upon room entry.
- **FR-009**: Upon game start, the system MUST deterministically designate one player as the 'drawer' and all other participants as 'guessers'.
- **FR-010**: The host (or first player in the room) MUST be designated as the drawer upon game start.
- **FR-011**: Upon game start, the system MUST deterministically select a secret word from the predefined list: [rocket, pizza, castle, guitar, sunflower].
- **FR-012**: The secret word MUST only be visible to the drawer. Guessers MUST NOT be able to see the secret word through any means.
- **FR-013**: The system MUST return each player's assigned role (drawer or guesser) in the room state response visible to that player.

### Key Entities *(include if feature involves data)*

- **Room**: Represents a game session with a unique code. Has a state ('lobby' or 'active'), a list of participants, the host identifier, and the current round's secret word (only exposed to the drawer).
- **Player**: A participant in a room. Has a name (trimmed, non-empty), a unique identifier, and a role ('drawer' or 'guesser') assigned upon game start.
- **Secret Word**: A word selected from a predefined list at game start, known only to the drawer. Used as the subject for the drawing round.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The host can start the game with a single intentional action (e.g., one button click) from the lobby.
- **SC-002**: All players in the room detect the game start and are routed to the game screen within 3 seconds of the host starting the game.
- **SC-003**: The drawer role is assigned to exactly one player per game, and all other players are assigned as guessers.
- **SC-004**: The secret word is successfully hidden from all guessers at all times — verifiable by checking that guessers cannot see the word through any accessible means.
- **SC-005**: Player names with whitespace-only or empty values are rejected 100% of the time, with no false rejections of valid names.
- **SC-006**: Non-host attempts to start the game are rejected 100% of the time.

## Assumptions

- The host is always the first player who created the room.
- There is at least one player in the room when the game starts (the host).
- The secret word list is fixed at five words: rocket, pizza, castle, guitar, sunflower. No word rotation or expansion is needed.
- No multi-round logic, drawer rotation, or round timers are required in this feature — only the initial game start state.
- Players join the room before game start; joining during active state is not a primary concern and may be handled separately.
- Polling interval of approximately 2 seconds provides a reasonable balance between responsiveness and server load.
