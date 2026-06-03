# Feature Specification: Fix API Base URL Bug

**Feature Branch**: `001-fix-api-base-url`

**Created**: 2026-06-03

**Status**: Draft

**Input**: User description: "Fix Bug 1 - wrong default API base URL in frontend"

## User Scenarios & Testing

### User Story 1 - Fix default API base URL (Priority: P1)

As a developer, I want the default API base URL to be correct so that the frontend can communicate with the backend without requiring a manual `VITE_API_URL` environment variable.

**Why this priority**: This is a critical blocking bug — all API calls fail by default, making the application unusable out of the box.

**Independent Test**: The frontend API client sends requests to the correct backend URL by default. Verified by inspecting outgoing request URLs and confirming they do not contain an erroneous path segment.

**Acceptance Scenarios**:

1. **Given** the frontend is started without `VITE_API_URL` being set, **When** the API client makes a request to create a room, **Then** the request is sent to `http://localhost:3001/rooms` (not `http://localhost:3001/bug/rooms`).
2. **Given** the frontend is started without `VITE_API_URL` being set, **When** the API client makes a request to join a room, **Then** the request is sent to `http://localhost:3001/rooms/<code>/join` (not `http://localhost:3001/bug/...`).
3. **Given** the frontend is started with `VITE_API_URL` set to a custom URL, **When** the API client makes any request, **Then** the custom URL is used as the base (env var override still works correctly).

### Edge Cases

- What happens when `VITE_API_URL` is set to a URL with a trailing slash? (Should work — the `request()` function appends paths with a leading `/`)
- What happens when `VITE_API_URL` is set to an empty string? (Would break — but this is user error, not our concern)

## Requirements

### Functional Requirements

- **FR-001**: The default `API_BASE_URL` in `frontend/src/services/api.ts` MUST be `"http://localhost:3001"` instead of `"http://localhost:3001/bug"`.
- **FR-002**: The `import.meta.env.VITE_API_URL` environment variable override MUST continue to work correctly after the fix.
- **FR-003**: API tests in `frontend/src/services/api.test.ts` MUST use exact URL path assertions (not substring matching) to prevent similar regressions.

### Key Entities

- **API_BASE_URL**: The base URL constant used by the frontend API client for all backend requests.

## Success Criteria

### Measurable Outcomes

- **SC-001**: All frontend API requests default to `http://localhost:3001/<endpoint>` without requiring `VITE_API_URL` to be set.
- **SC-002**: All existing API tests pass after the fix.
- **SC-003**: API tests verify the exact URL path (not just a substring) to prevent regression.

## Assumptions

- The backend runs on `localhost:3001` by default (as configured in the backend dev server).
- The `/bug` suffix was accidentally committed and is not intentionally required by any existing middleware or proxy configuration.
- No other files in the codebase reference the erroneous `/bug` path.
