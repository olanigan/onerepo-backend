# Agent Operational Guide & Best Practices

**Current Focus**: Fullstack TypeScript (Next.js + Bun/SQLite) | **Governing Doc**: [`ONECODER.md`](./ONECODER.md)

This document is the **Standard Operating Procedure (SOP)** for agents. It summarizes *how* to work effectively, while [`ONECODER.md`](./ONECODER.md) explains the *what* and *why* of the tooling.

## 1. Quick Start Protocol

1.  **Check In**: Read `FEEDBACK.md` to see recent issues.
2.  **Check Specs**: Read `SPECIFICATIONS.md` to find relevant spec ID.
3.  **Start Work**:
    ```bash
    # Run with uvx (or alias: alias onecoder="uvx onecoder")
    onecoder sprint init "your-task-name"
    ```
4.  **Code & Verify**: Use `bun` for runtime and tests.
5.  **Commit**:
    ```bash
    git add .
    onecoder sprint commit -m "type: description" --spec-id SPEC-XXX
    ```

## 2. The "Voice of the Coder" Loop

- **Found a Bug/Blocker?** → Log it in [`FEEDBACK.md`](./FEEDBACK.md) **immediately**.
- **Found a Better Way?** → Update this file (`AGENTS.md`) with the new best practice.

## 3. Proven Patterns (Learned Best Practices)

*Agents: Add new operational discoveries below this line.*

### Testing
- Always run `bun test` before committing.
- For UI tests, ensure the dev server is running before executing Playwright.

### Architecture
- **Specs (PRDs)**: Place Product Requirements Documents in `specs/` (e.g., `PRD-XXX.md`).
- **Decisions (ADRs)**: Place Architecture Decision Records in `docs/architecture/decisions/` (e.g., `ADR-XXX.md`).
- **Backends**: Place new backend services in `backends/<lang>-<framework>/`.

### Sprint Tracking
- **Manual Tasks**: For design/planning work not captured by CLI commands, manually edit `.sprint/<sprint-name>/sprint.yaml`.
  - **Critical**: Use `status: done` for completed tasks. The CLI ignores `completed`.
  - Structure: `id`, `title`, `status` (`todo`, `in_progress`, `done`), `type`.

### Spec Management

*Always link your commits to a specification.*

**Finding specs before starting work:**
1. Check `SPECIFICATIONS.md` (root) for project overview and spec IDs
2. Look in `specs/` for component PRDs
3. Check `backends/<name>/` for backend-specific specs
4. Review `.sprint/<name>/sprint.yaml` for sprint-specific specs

**If no spec exists for your task:**
1. Propose a new spec by creating a PRD in `specs/`
2. Use format: `SPEC-<COMPONENT>-XXX` (e.g., `SPEC-FRONTEND-002`)
3. Reference the new spec in your commits
4. Update `SPECIFICATIONS.md` to include the new spec

**Example workflow:**
```bash
# 1. Find relevant spec
cat SPECIFICATIONS.md

# 2. Create implementation linked to spec
onecoder sprint commit -m "feat: add task filtering" --spec-id SPEC-FRONTEND-001
```
