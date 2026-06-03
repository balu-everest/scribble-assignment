# Research: Gameplay Interaction

## 1. Interactive Canvas Implementation

**Decision**: Use the native HTML5 `<canvas>` element with direct 2D context API. Drawing is handled via mouse event listeners (`mousedown`, `mousemove`, `mouseup`). Lines are drawn by connecting the previous point to the current point on each `mousemove` while the mouse is held down. The Clear button calls `ctx.clearRect()` to wipe the entire canvas.

**Rationale**: The spec requires a simple freehand drawing surface with no colors, brush sizes, or undo. The native Canvas 2D API is sufficient — no library needed. No canvas data persistence or transmission is required (FR-003), so no image export or serialization logic is needed.

**Alternatives considered**: SVG (`pointer events` on paths — higher overhead for freehand), Canvas library like Fabric.js (unnecessary dependency for basic freehand), offscreen canvas (no benefit for local-only drawing).

---

## 2. Guess Submission & Validation Strategy

**Decision**: Add `POST /rooms/:code/guess` endpoint that accepts `{ participantId, text }`. The backend trims the text, rejects empty/whitespace-only (Zod validation + explicit check), appends the guess to the room's guesses array, performs case-insensitive comparison against the secret word, awards 100 points if correct, and returns the updated room snapshot. The guess object stores: participant ID, participant name, trimmed guess text, ISO timestamp, and a boolean `isCorrect` flag.

**Rationale**: Single atomic endpoint handles both submission and validation. Case-insensitive comparison is `guess.toLowerCase() === secretWord.toLowerCase()`. Points are stored on the `Participant` object as a `score` field (default 0). The guess log is included in all subsequent poll responses for synchronization.

**Alternatives considered**: Separate guess + validation endpoints (unnecessary network round-trip), client-side validation only (fails FR-009 case-insensitive requirement), server-side only validation without storing guess (guessers would never see their own submission).

---

## 3. Network Error Auto-Retry (from Clarification)

**Decision**: The frontend `submitGuess()` method in `api.ts` wraps the `POST` request in a retry loop: up to 3 attempts with a ~1-second delay between retries. Only network errors (no response) trigger retries — server validation errors (4xx) are treated as final and surfaced immediately. On final network failure, the `GuessForm` shows a generic fallback ("Failed to submit guess. Please try again."). On validation failure, the server's exact error message from the JSON response body is displayed. In both cases the typed text is preserved. This matches the clarified behavior (Option C).

**Rationale**: Transient network errors are common in web apps. Auto-retry maximizes delivery success without blocking the user. Falling back to an inline error with preserved text gives the user control without losing their input.

**Alternatives considered**: No retry (loses guesses on transient failures), indefinite retry (could block user input indefinitely), toast notification (clears input — loses typed text).

---

## 4. Scoreboard Synchronization

**Decision**: Scores are stored as a `score: number` field on each `Participant` object (defaulting to 0). The `GET /rooms/:code` response includes the full participant list with scores. The frontend `Scoreboard` component reads participants from the room state and renders a sorted list (highest score first). Since the polling loop already refreshes room state every 2 seconds, scores are automatically synchronized without any additional mechanism.

**Rationale**: Storing scores directly on the `Participant` object keeps the data model simple — no separate Score entity or lookup table needed. The existing polling infrastructure handles synchronization. Sorting by score is a pure local computation.

**Alternatives considered**: Separate scores map in Room (redundant with participant field), event-based score update (requires WebSocket — constitution violation), score-only polling endpoint (additional endpoint with no benefit).

---

## 5. Guess History / Activity Panel Display

**Decision**: The `ResultPanel` component reads the `guesses` array from the room snapshot (available via polling) and renders it as a chronological list. Newest guesses appear at the bottom. Each entry shows the guesser's name, the guessed text, and a timestamp. Correct guesses are highlighted with a distinct visual indicator (e.g., green checkmark or "✓ Correct!" label) using the `isCorrect` flag on the guess object.

**Rationale**: Chronological order (oldest → newest) lets readers follow the guessing progression naturally. The `isCorrect` flag is already stored on each guess, so no additional computation is needed. The drawer sees all guesses including the correct one, but the correct guess does not trigger any round-end behavior (per assumption).

**Alternatives considered**: Newest-first order (harder to follow narrative), separate correct/incorrect sections (over-engineered), auto-scroll to bottom (additive UX improvement for implementation).

---

## 6. Guesser Placeholder Display

**Decision**: The `GamePage` conditionally renders: if the viewer's role is `"drawer"`, show the interactive `DrawingCanvas` component inside the canvas area; if `"guesser"`, show a styled placeholder panel reading "[Drawer Name] is drawing..." The drawer's name is extracted from the participants array (the participant with role `"drawer"`). No canvas data is ever transmitted (FR-003 enforced by architecture — no serialization code exists).

**Rationale**: Simple conditional rendering in the page component. The placeholder uses existing styling patterns (same `Card` wrapper, same text styling as other panels). The drawer's name is already available from the participants list in the room snapshot.

**Alternatives considered**: Route-level role-based pages (duplicated layout code), context-based render switching (same as conditional, more indirect).

---

## 7. Testing Approach

**Decision**: Extend existing Vitest patterns:
- Backend: unit tests for `submitGuess()` (validation rejection, correct guess scoring +100, incorrect guess +0, case-insensitive matching, guess log ordering, multiple simultaneous correct guesses all scoring)
- Frontend: unit tests for `api.ts` (submitGuess sends correct payload), component tests for `DrawingCanvas` (renders, draws on mousedown+mousemove, clear button wipes)
- Manual: multi-tab browser testing (Tab 1: drawer draws, Tab 2: guesser sees placeholder and can submit guesses, verify scores update via polling)

**Rationale**: Same pattern as previous feature. Deterministic game logic (case-insensitive comparison, scoring) is well-suited to unit testing.

**Alternatives considered**: E2E tests with Playwright (overhead for current scope), snapshot tests for canvas rendering (fragile — pixel diff depends on rendering environment).
