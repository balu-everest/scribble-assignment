# Feature Specification: Gameplay Interaction

**Feature Branch**: `004-gameplay-interaction`

**Created**: 2026-06-03

**Status**: Draft

**Input**: User description: "Implement Scenario 3 — Gameplay Interaction. Requirements: Interactive canvas for drawer, non-synced canvas view for guesser, guess validation and log, synchronized feed via polling, case-insensitive matching and scoring."

## Clarifications

### Session 2026-06-03

- Q: When a guess submission request fails due to a transient network error or server issue, how should the frontend behave? → A: Auto-retry up to 3 times with a ~1s delay; if all fail, show inline error message near the input field and preserve the typed guess text for manual retry.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Drawer Draws on Interactive Canvas (Priority: P1)

As the designated drawer in an active game, I want to draw freehand on a canvas and clear my drawing, so that I can visually communicate the secret word to guessers.

**Why this priority**: Drawing is the core gameplay action for the drawer. Without an interactive canvas, the drawer has no way to participate meaningfully.

**Independent Test**: Can be fully tested by opening the game as a drawer, click-dragging on the canvas to produce visible lines, and clicking the Clear button to wipe the surface.

**Acceptance Scenarios**:

1. **Given** a user whose role is 'drawer' in an active game, **When** they view the game screen, **Then** they see an interactive drawing surface (canvas) with drawing enabled.
2. **Given** a drawer with an active canvas, **When** they click and drag on the canvas, **Then** a visible line trail follows the cursor movement.
3. **Given** a drawer who has drawn on the canvas, **When** they click a "Clear" button, **Then** all drawings are removed from the canvas surface.

---

### User Story 2 - Guesser Submits Guesses with Validation (Priority: P1)

As a guesser in an active game, I want to submit my guess for the secret word and receive clear feedback if my input is invalid, so that I can participate in the game correctly.

**Why this priority**: Guessing is the core interaction for guessers. Without guess submission and validation, guessers cannot participate.

**Independent Test**: Can be fully tested by viewing the game as a guesser, submitting a valid guess and observing it accepted, then submitting empty and whitespace-only guesses and observing rejection with descriptive messages.

**Acceptance Scenarios**:

1. **Given** a guesser on the game screen, **When** they type a word and submit it, **Then** the guess is trimmed and accepted into the guess log.
2. **Given** a guesser on the game screen, **When** they submit an empty or whitespace-only guess, **Then** the guess is rejected and a descriptive error message is shown nearby the input field.
3. **Given** a guesser who submitted a valid guess, **When** they see the submission result, **Then** the input field is cleared and ready for the next guess.

---

### User Story 3 - All Players See the Guess Feed Update in Real-Time (Priority: P2)

As any player in an active game, I want to see a live-updating log of all guesses submitted by guessers, so that I can follow the guessing progress and avoid duplicate guesses.

**Why this priority**: The shared guess feed is essential for situational awareness — guessers need to know what has already been guessed, and the drawer needs to see progress.

**Independent Test**: Can be fully tested by having multiple guessers submit guesses and observing all participants' screens update with the new guesses within a few seconds.

**Acceptance Scenarios**:

1. **Given** a game with multiple guessers, **When** a guesser submits a guess, **Then** within a short polling interval all participants (including the drawer) see that guess appear in a shared guess history view.
2. **Given** a game with existing guesses in the log, **When** a new player views the game screen, **Then** they see the complete guess history upon the first poll.

---

### User Story 4 - Correct Guesses Score Points and Update the Scoreboard (Priority: P2)

As a guesser, I want to be awarded points when I guess the secret word correctly, and I want all players to see the updated scores on the scoreboard.

**Why this priority**: Scoring is the reward mechanism that makes the game competitive. Players need to see scores change when a correct guess occurs.

**Independent Test**: Can be fully tested by having a guesser submit the exact secret word (case-insensitively) and observing that player's score increments by 100 points on all participants' scoreboards.

**Acceptance Scenarios**:

1. **Given** a guesser in an active game, **When** they submit a guess that matches the secret word (case-insensitively), **Then** the guesser is awarded 100 points in the backend room state.
2. **Given** a guesser who submitted a correct guess, **When** all participants poll for state updates, **Then** the scoreboard reflects the updated scores for all players.
3. **Given** a guesser who submitted a guess that does NOT match the secret word, **When** they submit it, **Then** no points are awarded to any player.
4. **Given** a guesser who submits the secret word with different casing (e.g., "Rocket" for the word "rocket"), **When** the system validates it, **Then** it is treated as a correct match and awards 100 points.

### Edge Cases

- What happens when multiple guessers submit the same correct word in quick succession? Each guesser who submits it correctly (before the game state potentially transitions) receives 100 points.
- How does the system handle guesses that contain leading/trailing whitespace? The guess is trimmed before validation and storage; whitespace-only guesses are rejected.
- What happens when a guesser submits a guess while the polling is in progress? The guess is stored immediately on the backend and becomes visible on the next poll cycle.
- How does the drawer's canvas interact with the polling cycle? Canvas data is never streamed — the drawer draws locally and the guesser sees only a static placeholder.
- What happens when a guess submission fails due to a network error? The frontend auto-retries up to 3 times with ~1s delay; if all retries fail, an inline error message is shown and the typed text is preserved for manual retry.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The drawer MUST see an interactive HTML5 canvas surface on the game screen that supports freehand drawing via click-and-drag.
- **FR-002**: The canvas MUST include a visible "Clear" button that removes all drawn content from the surface.
- **FR-003**: Canvas pixel data and drawing coordinates MUST NOT be transmitted over the network under any circumstances.
- **FR-004**: A guesser viewing the game screen MUST see a styled placeholder panel indicating that the drawer is drawing (e.g., "[Drawer Name] is drawing..."), not a live canvas.
- **FR-005**: The guess input field MUST trim all leading and trailing whitespace from submitted guesses before processing.
- **FR-006**: Empty or whitespace-only guesses MUST be rejected, and the user MUST receive a descriptive error message displayed clearly near the input field.
- **FR-007**: All valid submitted guesses MUST be stored in a guess log array in the backend room state, including the guesser's identity, the guess text, and a timestamp.
- **FR-008**: The guess log array MUST be included in the room snapshot response so that it synchronizes to all participants within the existing ~2-second polling cycle.
- **FR-009**: The backend MUST compare incoming guesses against the secret word using case-insensitive matching (e.g., "Rocket" matches "rocket").
- **FR-010**: A correct guess MUST immediately award that guesser 100 points in the backend room state.
- **FR-011**: Each participant's score MUST be tracked persistently in the backend room state for the duration of the game.
- **FR-012**: The scoreboard UI panel MUST display each player's current score and update automatically as scores change, synchronized via the polling cycle.
- **FR-013**: The game page's polling loop (every 2 seconds) MUST fetch the updated room state, including the current guess log and all player scores.
- **FR-014**: The guess history view (ResultPanel/Activity panel) MUST display the chronological list of all guesses, showing who guessed what, including correct guesses with an appropriate indicator.
- **FR-015**: When a guess submission request fails due to a transient network or server error, the frontend MUST automatically retry the request up to 3 times with a ~1-second delay between attempts. If all retries fail, the system MUST display an inline error message near the input field and preserve the typed guess text for manual retry.

### Key Entities *(include if feature involves data)*

- **Guess**: A single guess submitted by a guesser. Contains the guesser's participant ID and name, the guessed text (trimmed), a timestamp, and a flag indicating whether it was correct.
- **Score**: A numeric point total associated with each participant. Tracks cumulative points earned from correct guesses.
- **Guess Log**: An ordered collection of all guesses submitted during the game. Appended to each poll response for synchronization.
- **Room** (extended): Now includes a guesses array and participant scores, in addition to existing properties.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The drawer can draw visible lines on the canvas using click-and-drag, and clear the canvas with a single button click.
- **SC-002**: Guessers never see canvas drawing data — only a styled placeholder panel indicating the drawer is sketching.
- **SC-003**: Empty and whitespace-only guesses are rejected 100% of the time with clear in-context error messages.
- **SC-004**: All valid guesses appear in every participant's guess history view within 3 seconds of submission (accounting for the 2-second polling interval).
- **SC-005**: Case-insensitive matching works correctly for all casing variations — verification covers uppercase, lowercase, and mixed case inputs.
- **SC-006**: A correct guess awards exactly 100 points to the guessing player, and the updated score is visible to all participants within 3 seconds.
- **SC-007**: The scoreboard displays the correct score for every participant at all times, with no data loss or desynchronization.

## Assumptions

- The drawing canvas is a local-only interactive surface — no drawing data is persisted, shared, or transmitted over the network.
- The polling interval of approximately 2 seconds is sufficient for a responsive guessing experience.
- Multiple guessers can submit guesses concurrently; the guess log preserves chronological order based on server receipt time.
- A guesser who correctly guesses the secret word continues to be able to see the game state and guess feed; no round-end behavior is triggered by a correct guess (out of scope).
- The secret word list remains the same five words defined in the previous feature: rocket, pizza, castle, guitar, sunflower.
- There is no limit on the number of guesses a single guesser can submit.
