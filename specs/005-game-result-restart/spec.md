# Feature Specification: Game Result, Restart & Final Validation

**Feature Branch**: `005-game-result-restart`

**Created**: 2026-06-03

**Status**: Draft

**Input**: User description: "Implement Scenario 4 — Result, Restart & Final Validation. Requirements to specify: 1. Game Over Trigger & State Transition: When the secret word is correctly guessed (or the core gameplay condition is met from Scenario 3), the backend room status must transition from 'active' to 'result'. 2. Result Screen UI: The ~2-second frontend polling loop must detect the 'result' status and automatically route all participants to a dedicated Result Screen. This screen must show the final scoreboard with all players' accumulated scores and clearly highlight the winner. 3. Host-Gated Restart Endpoint: Create a backend endpoint (e.g., POST /rooms/:code/restart) restricted exclusively to the host. When called, it must reset the room status back to 'lobby', clear out the old guess history log array, and reset all player scores back to 0. 4. Synchronized Return to Lobby: The frontend polling loop must detect when the room status switches back to 'lobby' and automatically route all participants back to the Lobby screen simultaneously. 5. Persistent Player List & State Cleanliness: The restart routine must preserve the existing list of joined players in the room (no one should be kicked out or forced to re-join). Additionally, ensure the local canvas surface on the drawer's end is explicitly wiped blank upon returning to the lobby so no leftover drawings persist."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Correct Guess Ends the Game and Shows Results (Priority: P1)

As a player in an active game, I want the game to end when someone correctly guesses the secret word so that all participants can see the final results. The room transitions to a result state automatically and everyone is routed to a Result Screen showing the final scoreboard.

**Why this priority**: This is the primary game-loop closure — without a game-over trigger and result display, the game has no defined end state and players cannot see who won.

**Independent Test**: Can be fully tested by starting a game as host, having a guesser submit the correct secret word, and observing all participants' screens automatically transition to a Result Screen within a few seconds, showing the final scoreboard.

**Acceptance Scenarios**:

1. **Given** an active game in progress, **When** a guesser submits a guess that matches the secret word (case-insensitively), **Then** the room state transitions from 'active' to 'result'.
2. **Given** a room in 'result' state, **When** the frontend polling loop requests room state, **Then** the response indicates 'result' status.
3. **Given** a correct guess has been submitted, **When** the frontend detects the 'result' state during a poll, **Then** the user is automatically navigated to the Result Screen.
4. **Given** a room in 'result' state, **When** a guesser attempts to submit a new guess, **Then** the guess is rejected since the game has ended.

---

### User Story 2 - Players See the Final Scoreboard and Winner on the Result Screen (Priority: P1)

As a player viewing the Result Screen, I want to see all players' final scores and clearly know who won, so that I can celebrate the winner and understand the outcome of the game.

**Why this priority**: The Result Screen is the culmination of the game — players need to see their performance, compare scores, and identify the winner.

**Independent Test**: Can be fully tested by ending a game and verifying the Result Screen displays every player's name and score from the game, with the highest-scoring player visually distinguished from others.

**Acceptance Scenarios**:

1. **Given** a Result Screen after a game ends, **When** a participant views the screen, **Then** each player's name and accumulated score is displayed.
2. **Given** a Result Screen with multiple players, **When** the screen is rendered, **Then** the player(s) with the highest score are visually distinguished (e.g., highlighted, badge, or prominent placement) as the winner(s).
3. **Given** a Result Screen where multiple players are tied for the highest score, **When** the screen is rendered, **Then** all tied players are highlighted as winners.

---

### User Story 3 - Host Restarts the Game from the Result Screen (Priority: P1)

As the host of a room on the Result Screen, I want to restart the game with a single action so that all participants can begin a new round without needing to create a new room or re-join.

**Why this priority**: Restarting is essential for continuous play. Without it, players must create a new room and all re-join, creating friction and breaking the social experience.

**Independent Test**: Can be fully tested by viewing the Result Screen as the host, clicking the restart action, and observing the room state transition back to 'lobby', all players returning to the Lobby screen, and the guess log and scores being cleared.

**Acceptance Scenarios**:

1. **Given** a room in 'result' state, **When** the host triggers a restart, **Then** the room state transitions from 'result' to 'lobby'.
2. **Given** a room in 'result' state, **When** a non-host player attempts to trigger a restart, **Then** the request is rejected.
3. **Given** a successful restart, **When** any player in the room polls for room state, **Then** they receive 'lobby' status, an empty guess log, and all player scores reset to 0.
4. **Given** a successful restart, **When** a player polls for room state, **Then** the participant list remains unchanged — no players are removed or need to re-join.
5. **Given** a room in 'lobby' or 'active' state, **When** the host attempts to trigger a restart, **Then** the request is rejected as restart is only valid from the 'result' state.

---

### User Story 4 - All Participants Automatically Return to Lobby After Restart (Priority: P2)

As a participant (not the host) on the Result Screen, I want to be automatically routed back to the Lobby screen when the host restarts the game, so that I can see the updated player list and prepare for the next round without manual intervention.

**Why this priority**: Synchronized automatic routing ensures all players arrive together in the lobby, preventing confusion and mismatched states. If players had to manually navigate, some might miss the transition or get desynchronized.

**Independent Test**: Can be fully tested by having the host restart a game while observing a non-host participant's screen — the participant's Result Screen should automatically transition to the Lobby screen within a few seconds.

**Acceptance Scenarios**:

1. **Given** a participant viewing the Result Screen, **When** the host triggers a restart and the room becomes 'lobby', **Then** within a polling cycle the participant's frontend detects the 'lobby' state and automatically navigates to the Lobby screen.
2. **Given** a participant who returns to the Lobby after a restart, **When** the Lobby screen loads, **Then** the canvas drawing surface (for the drawer) is wiped completely blank with no leftover drawings visible.

### Edge Cases

- What happens if a correct guess triggers the 'result' transition while another correct guess from a different guesser arrives simultaneously? The first correct guess processed by the backend triggers the state change; subsequent guesses (even if correct) are rejected since the game is no longer 'active'.
- What happens if the host disconnects from the Result Screen before restarting? The room remains in 'result' state indefinitely; no other player can restart. A new room must be created.
- What happens if a player tries to join a room that is in 'result' state? The player should receive the room state normally, seeing the result information — they should not be blocked from viewing results.
- What happens if all players have zero score (no correct guesses were made)? The Result Screen still displays all players with scores of 0. Since no winner exists by score, the system should display a message indicating no correct guesses were made.
- What happens if the polling fails after the game transitions to 'result'? The user remains on their current screen (game or result) and should see the correct state on the next successful poll.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: When a correct guess is submitted while the room is in 'active' state, the backend MUST immediately transition the room status from 'active' to 'result'.
- **FR-002**: Once the room enters 'result' state, the backend MUST reject any subsequent guess submission requests for that room.
- **FR-003**: The room state response MUST include a status field that can be 'lobby', 'active', or 'result'.
- **FR-004**: The frontend polling loop (every ~2 seconds) on both the game screen and result screen MUST detect the room status and automatically route the user to the appropriate screen: 'result' → Result Screen, 'lobby' → Lobby Screen.
- **FR-005**: The Result Screen MUST display a complete scoreboard showing every player's name and their final accumulated score from the game.
- **FR-006**: The Result Screen MUST visually distinguish the player(s) with the highest score from all other players using a clear visual indicator (e.g., highlighting, badge, or prominent positioning).
- **FR-007**: The system MUST provide a restart mechanism (accessible via a designated action/endpoint) that is restricted to the host of the room and transitions the room from 'result' back to 'lobby'.
- **FR-008**: The restart mechanism MUST reject requests from non-host participants with a clear error.
- **FR-009**: The restart mechanism MUST reject requests when the room is in 'lobby' or 'active' state — restart is only valid from 'result' state.
- **FR-010**: Upon successful restart, the system MUST clear the guess history log array so that it is empty for the new round.
- **FR-011**: Upon successful restart, the system MUST reset all player scores to 0.
- **FR-012**: Upon successful restart, the system MUST preserve the existing player/participant list — no participants are removed, and their names and identifiers remain unchanged.
- **FR-013**: Upon returning to the Lobby screen after a restart, the canvas drawing surface (on the drawer's client) MUST be wiped completely blank, removing any drawings from the previous round.

### Key Entities *(include if feature involves data)*

- **Room** (extended): State is now one of 'lobby', 'active', or 'result'. In 'result' state the game is over and awaits host action to restart.
- **Player Score**: A numeric value associated with each participant, reset to 0 on restart.
- **Guess Log** (extended): An ordered array of all guesses submitted during a game round, cleared entirely upon restart.
- **Winner**: The player(s) with the highest accumulated score at game end. Multiple players can be winners in the event of a tie.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A correct guess triggers an automatic room state transition to 'result' within the same request-response cycle.
- **SC-002**: All participants are automatically routed to the Result Screen within 3 seconds of a correct guess being submitted.
- **SC-003**: The Result Screen displays the correct final score for every participant without discrepancy, verified by comparing against the backend state.
- **SC-004**: The highest-scoring player is clearly identifiable on the Result Screen — verification can be done by visual inspection.
- **SC-005**: The host can restart the game with a single intentional action from the Result Screen.
- **SC-006**: Non-host restart attempts are rejected 100% of the time with error feedback to the user.
- **SC-007**: Restart attempts from 'lobby' or 'active' state are rejected 100% of the time.
- **SC-008**: All participants return to the Lobby screen within 3 seconds of a successful restart.
- **SC-009**: The participant count and player names are identical before and after a restart — no players are lost or duplicated.
- **SC-010**: The guess log is empty after a restart, verified by inspecting the room state response.
- **SC-011**: All player scores are 0 after a restart, verified by inspecting the room state response.
- **SC-012**: The drawer's local canvas is blank upon returning to the Lobby screen after a restart, with no visible residual drawings.

## Assumptions

- The first correct guess processed by the backend triggers the 'result' state transition; any subsequent guesses (even if correct) arriving after the transition are rejected since the room is no longer active.
- If all players have zero score at game end (no correct guesses), the Result Screen displays the scoreboard with zeros and an appropriate message instead of highlighting a non-existent winner.
- If the host disconnects before restarting, the room remains in 'result' state permanently since only the host can initiate a restart.
- The polled room state response contains all necessary information (status, player scores, guess log, participant list) for both the Result Screen and the automated routing logic.
- No multi-round history is tracked; each restart creates a clean slate for a new game round.
