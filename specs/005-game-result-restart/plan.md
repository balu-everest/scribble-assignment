# Implementation Plan: Game Result, Restart & Final Validation

**Branch**: `005-game-result-restart` | **Date**: 2026-06-03 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/005-game-result-restart/spec.md`

## Summary

Implement Scenario 4 — Result, Restart & Final Validation: When a correct guess is submitted, the room transitions from 'active' to 'result'. The frontend polling loop detects this and routes all participants to a Result Screen showing the final scoreboard with the winner highlighted. The host can restart the game via a restart endpoint, which resets the room to 'lobby', clears guesses and scores, preserves the player list, and auto-routes all participants back to the Lobby screen. The drawer's canvas is wiped clean on return.

## Technical Context

**Language/Version**: TypeScript (Node.js 20+ backend, React 18 frontend, Vite 5)

**Primary Dependencies**: Express 4, React 18, react-router-dom 6, Zod 3, Vitest 3, tsx

**Storage**: In-memory only — `Map<string, Room>` in `roomStore.ts`, room status becomes `"result"`, scores reset on restart, guesses cleared

**Testing**: Vitest (unit tests for backend services & schemas, frontend component/integration tests)

**Target Platform**: Web browser (modern Chrome/Firefox/Safari), Node.js server

**Project Type**: Web application (monorepo: `backend/` + `frontend/`)

**Performance Goals**: Room state transition to 'result' within the same request-response cycle; all participants see Result Screen within 3 seconds via 2-second polling; restart response under 500ms

**Constraints**: No WebSockets; no databases; in-memory only; no authentication; no multi-round history tracking; no drawer rotation; no round timers; restart only from 'result' state

**Scale/Scope**: Single game round with up to ~8 players; scores and guesses reset on restart; player list persists across restarts

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Gate | Status | Notes |
|------|--------|-------|
| **In-Memory State Only** | ✅ PASS | Room status, scores, guesses all in-memory — no DB needed |
| **Polling Synchronization** | ✅ PASS | FR-004 mandates ~2s HTTP polling for state transitions; no WebSockets |
| **Fail-Fast Validation** | ✅ PASS | Restart endpoint validates host identity and room state; Zod schemas extended |
| **Viewer-Specific Security** | ✅ PASS | Result screen shows public scores; secret word already filtered per role |
| **Testing Disciplines** | ✅ PASS | State transition, restart, score reset all deterministic and verifiable with hardcoded inputs |
| **Read-Before-Write** | ✅ PASS | Extends existing `roomStore`, `rooms.ts`, `game.ts`, `api.ts`, `roomStore.ts`, `GamePage.tsx` |
| **Spec-First Alignment** | ✅ PASS | Spec committed before planning begins |
| **Atomic Commits** | ✅ PASS | Each user story committed separately |
| **Zero-Regression Rule** | ✅ PASS | Existing tests must pass before new code is committed |
| **Verification Gate** | ✅ PASS | `GET /health` + `tsc --noEmit` on both packages |

No violations — all gates pass without justification needed.

## Project Structure

### Documentation (this feature)

```text
specs/005-game-result-restart/
├── spec.md              # Feature specification (with clarifications)
├── plan.md              # This file
├── research.md          # Phase 0: research decisions
├── data-model.md        # Phase 1: data model design
├── quickstart.md        # Phase 1: implementation quickstart
├── contracts/           # Phase 1: API contract documentation
│   └── api.md
└── tasks.md             # Phase 2: task breakdown (created by /speckit.tasks)
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── api/
│   │   ├── rooms.ts       # Extend: POST /rooms/:code/restart endpoint, modify guess handler for result transition
│   │   └── schemas.ts     # Extend: add restartRoomSchema
│   ├── models/
│   │   └── game.ts        # Extend: add "result" to RoomStatus type
│   ├── services/
│   │   ├── roomStore.ts   # Extend: restartRoom(), correct guess triggers result transition
│   │   └── roomStore.test.ts  # Add: restart and state transition tests
│   ├── router.ts
│   └── server.ts

frontend/
├── src/
│   ├── components/
│   │   └── PollingRouter.tsx   # NEW: watches room.status and auto-navigates
│   ├── pages/
│   │   ├── ResultScreen.tsx    # NEW: final scoreboard with winner highlight
│   │   └── LobbyScreen.tsx     # Extend: clear canvas on mount after restart
│   ├── state/
│   │   └── roomStore.ts        # Extend: restartRoom(), status-based routing logic
│   └── services/
│       └── api.ts              # Extend: restartRoom() API call, RoomSnapshot.status includes "result"
```

**Structure Decision**: Monorepo with separate `backend/` and `frontend/` directories — matches existing project layout exactly. Types are duplicated between frontend and backend per existing convention.

## Complexity Tracking

N/A — all gates pass, no constitution violations to justify.
