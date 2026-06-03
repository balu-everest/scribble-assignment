# Implementation Plan: Room Setup & Lobby

**Branch**: `002-room-setup-lobby` | **Date**: 2026-06-03 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/002-room-setup-lobby/spec.md`

## Summary

Implement Room Setup & Lobby (Scenario 1) — HTTP REST API for room creation/joining/lobby polling, host tracking with promotion, strict input validation, room isolation, and frontend auto-polling with host-gated "Start Game" button. Backend uses in-memory Map store; frontend uses React Context + `useSyncExternalStore` with `setInterval` polling.

## Technical Context

**Language/Version**: TypeScript (Node.js 20+ backend, React 18 frontend, Vite 5)

**Primary Dependencies**: Express 4, React 18, react-router-dom 6, Zod 3, Vitest 3, tsx

**Storage**: In-memory only — `Map<string, Room>` in `roomStore.ts`, no database

**Testing**: Vitest (unit tests for backend services & schemas, frontend API client)

**Target Platform**: Web browser (modern Chrome/Firefox/Safari), Node.js server

**Project Type**: Web application (monorepo: `backend/` + `frontend/`)

**Performance Goals**: Lobby sync within 3 seconds via 2-second HTTP polling; validation errors returned within 1 second

**Constraints**: No WebSockets; no databases; in-memory only; no authentication; <200ms p95 response time

**Scale/Scope**: Multiple concurrent rooms, ~10 players per room, room cleanup after last player leaves

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Gate | Status | Notes |
|------|--------|-------|
| **In-Memory State Only** | ✅ PASS | Room/player data lives in `Map<string, Room>` — no DB |
| **Polling Synchronization** | ✅ PASS | FR-011 mandates HTTP polling every ~2s; no WebSockets |
| **Fail-Fast Validation** | ✅ PASS | FR-004–FR-008, FR-014 enforce trim, empty reject, length limit, duplicate detection |
| **Viewer-Specific Security** | ✅ PASS | FR-012/FB-013 restrict "Start Game" to host only; snapshot filtering by role |
| **Testing Disciplines** | ✅ PASS | Existing Vitest tests extended; multi-tab scenario testing in spec |
| **Read-Before-Write** | ✅ PASS | Extends existing `roomStore`, `rooms.ts`, `schemas.ts`, `LobbyPage`, `roomStore.ts` |
| **Spec-First Alignment** | ✅ PASS | Spec committed before planning begins |
| **Atomic Commits** | ✅ PASS | Each user story committed separately |
| **Zero-Regression Rule** | ✅ PASS | Existing tests must pass before new code is committed |
| **Verification Gate** | ✅ PASS | `GET /health` + `tsc --noEmit` on both packages |

No violations — all gates pass without justification needed.

## Project Structure

### Documentation (this feature)

```text
specs/002-room-setup-lobby/
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
│   │   ├── rooms.ts       # Extend: host tracking, leave, host transfer
│   │   ├── schemas.ts     # Extend: stricter validation
│   │   └── schemas.test.ts# Extend: new validation tests
│   ├── models/
│   │   └── game.ts        # Extend: hostId, timestamps
│   ├── services/
│   │   ├── roomStore.ts   # Extend: host tracking, leave, transfer
│   │   └── roomStore.test.ts# Extend: new behavior tests
│   └── server.ts

frontend/
├── src/
│   ├── components/
│   │   └── LobbyPage.tsx  # Extend: auto-poll, host-gated Start Game
│   ├── state/
│   │   └── roomStore.ts   # Extend: auto-polling with setInterval
│   ├── services/
│   │   └── api.ts         # Extend: leaveRoom endpoint
│   └── pages/
│       └── LobbyPage.tsx  # Extend: leave button, auto-poll
```

**Structure Decision**: Monorepo with separate `backend/` and `frontend/` directories — matches existing project layout exactly. No shared package creation needed; types are duplicated between frontend and backend per existing convention.

## Complexity Tracking

N/A — all gates pass, no constitution violations to justify.
