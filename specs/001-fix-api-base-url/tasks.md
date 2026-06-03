---

description: "Task list for fixing the default API base URL bug"
---

# Tasks: Fix API Base URL Bug

**Input**: Design documents from `specs/001-fix-api-base-url/`

**Prerequisites**: plan.md, spec.md

**Organization**: Single user story — fix the broken default API base URL.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel
- **[Story]**: Which user story this task belongs to
- Include exact file paths in descriptions

## Path Conventions

- **Frontend**: `frontend/src/`
- **Tests**: `frontend/src/`

---

## Phase 1: Core Fix

**Purpose**: Fix the default API base URL and tighten tests

- [X] T001 [US1] Change default `API_BASE_URL` in `frontend/src/services/api.ts:22` from `"http://localhost:3001/bug"` to `"http://localhost:3001"`
- [X] T002 [US1] Update test URL assertions in `frontend/src/services/api.test.ts` to use exact URL matching instead of `expect.stringContaining()`
- [X] T003 [P] [US1] Run TypeScript compiler and frontend tests to verify no regressions

---

## Dependencies & Execution Order

### Phase Dependencies

- **T001** → **T002** (T002 can start after T001 since tests reference the URL behavior)
- **T003**: Depends on T001 and T002

### Parallel Opportunities

- T003 is marked [P] — it's the verification step

---

## Implementation Strategy

### MVP

1. T001: Fix the URL (one-character change)
2. T002: Tighten tests
3. T003: Verify

All three tasks must complete for the fix to be done.
