# Implementation Plan: Game Start & Drawer Flow

**Branch**: `003-game-start-drawer-flow` | **Date**: 2026-06-03 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/003-game-start-drawer-flow/spec.md`

## Summary

Implement Game Start & Drawer Flow (Scenario 2) — HTTP endpoint for host to transition room from lobby to active, deterministic role assignment (host=drawer, others=guessers), deterministic word selection from starter list, viewer-scoped response filtering (secret word only visible to drawer), and frontend polling to auto-route all participants from lobby to game screen.

## Technical Context

**Language/Version**: TypeScript (Node.js 20+ backend, React 18 frontend, Vite 5)

**Primary Dependencies**: Express 4, React 18, react-router-dom 6, Zod 3, Vitest 3, tsx

**Storage**: In-memory only — `Map<string, Room>` in `roomStore.ts`, no database

**Testing**: Vitest (unit tests for backend services & schemas, frontend API client)

**Target Platform**: Web browser (modern Chrome/Firefox/Safari), Node.js server

**Project Type**: Web application (monorepo: `backend/` + `frontend/`)

**Performance Goals**: Game start response under 1 second; all players routed to game screen within 3 seconds via 2-second polling

**Constraints**: No WebSockets; no databases; in-memory only; no authentication; no multi-round logic; no drawer rotation; no round timers

**Scale/Scope**: Single initial game start only — no round progression, no drawer rotation, no timers

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Gate | Status | Notes |
|------|--------|-------|
| **In-Memory State Only** | ✅ PASS | Room state stays in `Map<string, Room>` — no DB needed for game start transition |
| **Polling Synchronization** | ✅ PASS | FR-005/FR-006 mandate 2s HTTP polling for lobby→game routing; no WebSockets |
| **Fail-Fast Validation** | ✅ PASS | FR-007/FR-008 enforce trim + reject empty/whitespace names; Zod schemas already in place |
| **Viewer-Specific Security** | ✅ PASS | FR-011 (secret word hidden from guessers) enforced per-request filtering |
| **Testing Disciplines** | ✅ PASS | Deterministic word selection and role assignment verifiable with hardcoded inputs |
| **Read-Before-Write** | ✅ PASS | Extends existing `roomStore`, `rooms.ts`, `game.ts`, `LobbyPage`, `GamePage`, `roomStore.ts` |
| **Spec-First Alignment** | ✅ PASS | Spec committed before planning begins |
| **Atomic Commits** | ✅ PASS | Each user story committed separately |
| **Zero-Regression Rule** | ✅ PASS | Existing tests must pass before new code is committed |
| **Verification Gate** | ✅ PASS | `GET /health` + `tsc --noEmit` on both packages |

No violations — all gates pass without justification needed.

## Project Structure

### Documentation (this feature)

```text
specs/003-game-start-drawer-flow/
├── spec.md              # Feature specification
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
│   │   └── rooms.ts       # Extend: POST /rooms/:code/start endpoint
│   ├── models/
│   │   └── game.ts        # Extend: add "active" to RoomStatus, participant role, secretWord
│   ├── services/
│   │   ├── roomStore.ts   # Extend: startGame(), role assignment, word selection, filtered snapshot
│   │   └── roomStore.test.ts# Add: startGame, role/word assignment, viewer filtering tests
│   └── server.ts

frontend/
├── src/
│   ├── state/
│   │   └── roomStore.ts   # Extend: startGame() action, game screen polling
│   ├── services/
│   │   └── api.ts         # Extend: startGame() API call
│   └── pages/
│       ├── LobbyPage.tsx  # Extend: detect "active" status → auto-navigate to /game
│       └── GamePage.tsx   # Extend: add polling, show role/word info
```

**Structure Decision**: Monorepo with separate `backend/` and `frontend/` directories — matches existing project layout exactly. No shared package creation needed; types are duplicated between frontend and backend per existing convention.

## Complexity Tracking

N/A — all gates pass, no constitution violations to justify.
