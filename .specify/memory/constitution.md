# Spec Kit Constitution — Project Scribble

## 1. Core Engineering Principles
- **In-Memory State Only:** Do not install or configure databases, persistent storage, or external state containers beyond what the starter kit provides. State must live strictly in the backend node memory.
- **Polling Synchronization:** All state synchronization between frontend and backend must be handled via HTTP short-polling (~2 seconds). WebSockets or real-time streaming tools are strictly unauthorized.
- **Fail-Fast Validation:** All user inputs (player names, room codes, guess submissions) must be trimmed and validated immediately on arrival. Empty or whitespace-only inputs must be strictly rejected with clean, explicit UI or API error feedback.
- **Viewer-Specific Security:** The backend must filter the room state snapshot based on the requesting player's role. Secret data (e.g., the secret word) must never bleed into the payload or network response of a guesser.

## 2. Testing Disciplines & Quality Gates
- **Deterministic State Isolation:** Because the backend relies on in-memory storage, every feature implementation must include a predictable mechanism (such as explicit test endpoints or isolated mock states) to verify round boundaries without state bleeding across rooms.
- **Client-State Simulation Verification:** Features must be validated by running multiple concurrent sessions (e.g., Tab 1 as Host/Drawer and Tab 2 as Guesser) to confirm that polling payloads dynamically trigger the correct UI transformations across different user roles.
- **Deterministic Game Logic Testing:** Core algorithmic flows—specifically the case-insensitive comparison of guesses, point calculations (+100 for correct, +0 for incorrect), and the deterministic selection of secret words from the starter array—must be strictly validated with predictable, hardcoded input values before being integrated into UI components.

## 3. Code Reuse & Anti-Duplication Policy
- **Read-Before-Write Rule:** The agent must search the existing backend store (`/backend`) and frontend components (`/frontend`) before generating new files. 
- **Extend, Don't Replace:** Do not rewrite or replace functioning parts of the starter kit. Build clean extensions, middleware, or utility functions instead. Code duplication is completely prohibited.

## 4. AI Collaboration & Tool Workflow
- **Spec-First Alignment:** No code or tasks may be generated for a scenario until the specific user stories and acceptance criteria are committed inside `/speckit.specify`.
- **Zero Specification Drift:** If technical realities during coding require changing a requirement, the specs and technical plans must be updated *before* code modifications are executed.
- **Sequential Task Execution:** Code changes must be handled atomically, executing exactly one task at a time following the explicit sequence outlined in `/speckit.tasks`.

## 5. Review & Commit Discipline
- **Atomic Commits:** Every scenario or critical fix must be tested and confirmed working (on multiple browser tabs where applicable) before committing via OpenCode.
- **Zero-Regression Rule:** Implementing new code or workflows must never compromise or break previously validated features (e.g., adding drawing state must not break the initial room setup or lobby polling infrastructure).
- **Verification Gate:** A task is not considered complete unless `GET /health` passes and typescript compiling checks throw 0 errors.