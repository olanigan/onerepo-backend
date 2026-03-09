# Handoff: Onerepo Refactoring & Submodule Sync

## Context
- **Project**: `onerepo` (Multi-Engine Benchmarking Lab)
- **Active Sprint**: `003-java-springboot-backend-impl`
- **Objective**: Establish generic repository standards and verify Java backend performance against edge engines (Bun/Hono).

## Accomplishments
1.  **Submodule Restoration**:
    *   Fixed the broken/desynced submodule state in `labs-coding`.
    *   Corrected `.gitmodules` path from `onerepo/archive` to `onerepo/`.
    *   Successfully pulled and checked out all nested submodules (`backends`, `mcp`).
2.  **Algorithmic Alignment**:
    *   Refactored `BenchmarkService.java` to match the Bun/Hono implementations exactly (Factorization + Matrix operations).
    *   Standardized `/benchmark/*` parameters across all backends to ensure a fair shootout.
3.  **Governance Efficiency**:
    *   Synchronized `sprint.yaml` with the `TODO.md` checklist.
    *   Verified that `onerepo` and its submodules are clean of any non-generic context (interview/personal notes).
4.  **JDBC Migration**:
    *   Converted in-memory mock repositories to `Spring Data JDBC` interfaces (`ListCrudRepository`).

## Current Issues & Blockers
1.  **Java Backend Startup Failure**:
    *   **Current State**: The backend fails to boot (Port 3003) after the JDBC refactor.
    *   **Root Cause**: `Spring Data JDBC` requires a valid database connection at startup. The relative pathing to `../bun-sqlite/gtd.db` in `application.yml` is unstable or the file is missing in the current context.
    *   **Symptom**: `mvnw spring-boot:run` terminates with exit code 1.
2.  **Benchmark Suite Readiness**:
    *   `npm install` completed for the benchmark runner.
    *   Execution is pending the recovery of the local Java instance.

## Environment Notes
- **Java Port**: `3003` (Local)
- **Staging Targets**: 
    - Bun: `https://gtd-backend.salalite.workers.dev`
    - Hono: `https://hono-d1-backend.salalite.workers.dev`
- **DB Path**: Identified as `onerepo/backends/backends/bun-sqlite/gtd.db`.

---
*Created by Antigravity Agent*
