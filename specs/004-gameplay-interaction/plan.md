# Implementation Plan: Gameplay Interaction

**Branch**: `004-gameplay-interaction` | **Date**: 2026-06-03 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/004-gameplay-interaction/spec.md`

## Summary

Implement Scenario 3 — Gameplay Interaction: interactive HTML5 canvas for the drawer (click-and-draw + clear button), non-synced placeholder panel for guessers, guess submission with whitespace validation on backend, case-insensitive matching awarding 100 points to correct guessers, synchronized guess log and scoreboard via existing 2-second HTTP polling, and auto-retry on network failure during guess submission.

## Technical Context

**Language/Version**: TypeScript (Node.js 20+ backend, React 18 frontend, Vite 5)

**Primary Dependencies**: Express 4, React 18, react-router-dom 6, Zod 3, Vitest 3, tsx

**Storage**: In-memory only — `Map<string, Room>` in `roomStore.ts`, guesses array appended to Room, scores on Participant

**Testing**: Vitest (unit tests for backend services & schemas, frontend component/integration tests)

**Target Platform**: Web browser (modern Chrome/Firefox/Safari), Node.js server

**Project Type**: Web application (monorepo: `backend/` + `frontend/`)

**Performance Goals**: Guess submission response under 500ms; all players see new guesses and scores within 3 seconds via 2-second polling

**Constraints**: No WebSockets; no databases; in-memory only; no authentication; no multi-round logic; no drawer rotation; no round timers; canvas data never streamed over network

**Scale/Scope**: Single game round with up to ~8 players; guesses and scores reset on new game

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Gate | Status | Notes |
|------|--------|-------|
| **In-Memory State Only** | ✅ PASS | Guesses and scores stored as arrays/maps on the in-memory Room object — no DB needed |
| **Polling Synchronization** | ✅ PASS | FR-008/FR-013 mandate ~2s HTTP polling for guess log and scoreboard sync; no WebSockets |
| **Fail-Fast Validation** | ✅ PASS | FR-005/FR-006 enforce trim + reject empty/whitespace guesses; Zod schemas extended |
| **Viewer-Specific Security** | ✅ PASS | FR-003 (canvas data never transmitted) + FR-004 (placeholder for guessers); secret word already hidden |
| **Testing Disciplines** | ✅ PASS | Case-insensitive matching and +100 point scoring are deterministic and verifiable with hardcoded inputs |
| **Read-Before-Write** | ✅ PASS | Extends existing `roomStore`, `rooms.ts`, `game.ts`, `GamePage.tsx`, `GuessForm.tsx`, `Scoreboard.tsx`, `ResultPanel.tsx`, `roomStore.ts`, `api.ts` |
| **Spec-First Alignment** | ✅ PASS | Spec committed before planning begins |
| **Atomic Commits** | ✅ PASS | Each user story committed separately |
| **Zero-Regression Rule** | ✅ PASS | Existing tests must pass before new code is committed |
| **Verification Gate** | ✅ PASS | `GET /health` + `tsc --noEmit` on both packages |

No violations — all gates pass without justification needed.

## Project Structure

### Documentation (this feature)

```text
specs/004-gameplay-interaction/
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
│   │   └── rooms.ts       # Extend: POST /rooms/:code/guess endpoint
│   ├── models/
│   │   └── game.ts        # Extend: add Guess type, score to Participant, guesses to Room
│   ├── services/
│   │   ├── roomStore.ts   # Extend: submitGuess(), scoring logic, guesses in snapshot
│   │   └── roomStore.test.ts  # Add: guess validation, submission, scoring tests
│   └── server.ts

frontend/
├── src/
│   ├── components/
│   │   ├── DrawingCanvas.tsx   # NEW: interactive canvas with clear button
│   │   ├── GuessForm.tsx       # Extend: wire to API, validation feedback, retry
│   │   ├── Scoreboard.tsx      # Extend: display real scores from room state
│   │   └── ResultPanel.tsx     # Extend: display chronological guess history
│   ├── pages/
│   │   └── GamePage.tsx        # Extend: conditionally render Canvas or placeholder
│   ├── state/
│   │   └── roomStore.ts        # Extend: submitGuess(), guesses/scores in snapshot
│   └── services/
│       └── api.ts              # Extend: submitGuess() API call
```

**Structure Decision**: Monorepo with separate `backend/` and `frontend/` directories — matches existing project layout exactly. Types are duplicated between frontend and backend per existing convention.

## Complexity Tracking

N/A — all gates pass, no constitution violations to justify.
