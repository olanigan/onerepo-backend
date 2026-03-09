# OneCoder: The Operating System for Agents

This document is the authoritative guide on using the `onecoder` CLI and understanding the project's governance structure. It supersedes all previous "project-onecoder" documentation for agents working within the `onerepo`.

## 1. Core Philosophy

OneCoder is not just a tool; it is the **Governance Kernel**. It ensures that:
- **Every unit of work is tracked** (via Sprints).
- **Every code change is traceable** (via Atomic Commits).
- **Feedback is captured immediately** (via Issues).

As an agent, you are expected to interact *primarily* through the `onecoder` CLI for SDLC management, while using standard tools (bun, git, docker) for execution.

## 2. The Feedback Loop

We maintain a strict separation between "Bugs/Friction" and "Operational Improvements".

| Artifact | Purpose | When to Update |
| :--- | :--- | :--- |
| **`FEEDBACK.md`** | **The Friction Log.** Captures bugs, missing tools, confused agents, or blockers. | **Immediately** upon encountering an issue. Do not wait. |
| **`AGENTS.md`** | **The SOP (Standard Operating Procedure).** Captures *proven* best practices, workflow improvements, and "how-to" guides. | **After** resolving a friction point and finding a better way. |
| **`ONECODER.md`** | **The System Manual.** (This file). Defines the immutable rules and CLI command reference. | **Only** when the underlying system or CLI changes. |

## 3. Running OneCoder

This project uses the Python version of OneCoder via `uvx`:

```bash
# All commands should be run with:
uvx onecoder <command>

# Or alias it for convenience:
alias onecoder="uvx onecoder"
```

## 4. Sprint Management Workflow

The `onecoder sprint` command suite is your primary interface for managing work.

### A. Starting a Sprint
**Do not** just start coding. You must initialize a sprint context.

```bash
# Initialize a new sprint
onecoder sprint init <name>

# Example
onecoder sprint init backend-selection-ui
```

### B. Starting a Task
Once in a sprint, start working on specific tasks:

```bash
onecoder sprint task start <task-id>

# Example
onecoder sprint task start task-001
```

### C. Checking Status
Unsure where you are or what's tracked?

```bash
# Check current sprint status
onecoder sprint status

# Check status as JSON (for parsing)
onecoder sprint status --json
```

### D. Planning
Display the OneCoder planning guidance and workflow commands:

```bash
onecoder sprint plan
```

### E. Preflight Check
Validate sprint readiness and governance adherence before committing:

```bash
onecoder sprint preflight
```

### F. Finishing a Task
Complete the current task and commit changes with validation:

```bash
onecoder sprint finish
```

### G. Atomic Commits
**NEVER** use `git commit` directly for feature work. Use `onecoder sprint commit` to ensure governance metadata (Sprint ID, Spec ID) is attached.

```bash
# 1. Stage your changes normally
git add .

# 2. Commit with governance wrapper
onecoder sprint commit -m "feat: implement user login"

# 3. (Optional) Link to a specific specification
onecoder sprint commit -m "feat: implement user login" --spec-id SPEC-001

# 4. Frictionless commits - pass files directly
onecoder sprint commit -m 'feat: add new component' file1.ts file2.ts --spec-id SPEC-XXX
```

### H. Closing a Sprint
When the task is complete and verified:

```bash
onecoder sprint close <name>
```
This officially closes the governance loop.

### I. Traceability
Visualize specification traceability across history:

```bash
onecoder sprint trace
```

### J. Sprint Data Schema (Manual Editing)
If you must manually edit `sprint.yaml`:
- **Valid Statuses**: `todo`, `in_progress`, `done`.
- **Invalid Statuses**: `completed`, `finished`, `closed` (these will be ignored).
- **Required Fields**: `id`, `title`, `status`, `type`.

## 5. Issue Management

The `onecoder issue` command suite manages local governance issues.

### Creating an Issue
```bash
onecoder issue create
```

### Listing Issues
```bash
onecoder issue list
```

### Resolving an Issue
```bash
onecoder issue resolve <issue-id>
```

## 6. Diagnostics

The `onecoder doctor` command suite provides automated diagnostic tools.

### Database Diagnostics
Validate database schema and role readiness:
```bash
onecoder doctor db
```

### Dependencies Check
Check for critical dependencies (tree-sitter, etc.):
```bash
onecoder doctor deps
```

### Environment Diagnostics
Scan and validate environment configuration:
```bash
onecoder doctor env
```

### Port Diagnostics
Identify and resolve port conflicts:
```bash
onecoder doctor ports
```

### Full Diagnostic
Run all diagnostic checks:
```bash
onecoder doctor
```

## 7. Spec-Driven Workflow

This project uses a **spec-driven development** approach. All work should be traceable to a specification.

### A. Finding Existing Specs

Before starting any work, check for existing specifications:

| Spec Type | Location | Naming Pattern |
|-----------|----------|----------------|
| Project | `SPECIFICATIONS.md` | `SPEC-PROJECT-XXX` |
| Frontend | `specs/PRD-*.md` | `SPEC-FRONTEND-XXX` |
| Gateway | `specs/PRD-*.md` | `SPEC-GATEWAY-XXX` |
| Backend | `specs/PRD-*.md` or `backends/*/PRD.md` | `SPEC-BACKEND-XXX` |
| CLI/Sprint | `.sprint/*/sprint.yaml` | `SPEC-CLI-XXX` |

**Quick Reference:**
```bash
# Check project-level spec
cat SPECIFICATIONS.md

# List all component specs
ls specs/

# Check specific spec
cat specs/PRD-Frontend.md
```

### B. Linking Commits to Specs

**Always** use the `--spec-id` flag when committing:

```bash
# Correct - includes spec reference
onecoder sprint commit -m "feat: add backend selector" --spec-id SPEC-FRONTEND-001

# Also correct - multiple files with spec
onecoder sprint commit -m "fix: validation error" frontend/lib/api.ts --spec-id SPEC-GATEWAY-001
```

The spec ID is embedded in the commit message as metadata, enabling traceability.

### C. When No Spec Exists

If you're starting work that has no corresponding spec:

1. **Check SPECIFICATIONS.md** - Maybe it should be part of an existing component
2. **Propose a new spec** - Create a PRD in `specs/` or add to existing one
3. **Use SPEC-PROJECT-001** - For project-level governance changes
4. **Document the gap** - Note in FEEDBACK.md that a spec is needed

Example workflow:
```bash
# 1. Create the spec first
echo "# PRD: New Feature" > specs/PRD-NewFeature.md
# ... fill in PRD content with SPEC-NEWFEATURE-001

# 2. Commit the spec
onecoder sprint commit -m "spec: define new feature requirements" specs/PRD-NewFeature.md --spec-id SPEC-PROJECT-001

# 3. Implement and link to the new spec
onecoder sprint commit -m "feat: implement new feature" --spec-id SPEC-NEWFEATURE-001
```

### D. Spec ID Reference

Current active specs for this project:

```
SPEC-PROJECT-001  - Project-level specification (this file references others)
SPEC-FRONTEND-001 - GTD Frontend Application
SPEC-GATEWAY-001  - Cloudflare Gateway
SPEC-BACKEND-001  - Bun + SQLite Backend
SPEC-BACKEND-002  - Hono + D1 Backend
SPEC-CLI-002      - Sprint 001: Setup
SPEC-CLI-003      - Sprint 002: Deploy Hono D1
```

## 8. Architecture & Design

### Architecture Decision Records (ADRs)
- Place ADRs in `docs/architecture/decisions/`.
- Use the format `ADR-XXX-title.md`.

### Product Requirements Documents (PRDs)
- Place PRDs in `specs/`.
- Use the format `PRD-XXX-title.md`.

## 9. Troubleshooting & FAQ

**Q: `onecoder` command not found?**
A: Use `uvx onecoder` directly, or alias it: `alias onecoder="uvx onecoder"`

**Q: "Missing runtimes" error?**
A: Log it in `FEEDBACK.md`. We currently prioritize TypeScript/Bun/Node.js.

**Q: I found a better way to test!**
A: Update `AGENTS.md` with the new command sequence so future agents can learn from you.

**Q: How do I check what's happening in the sprint?**
A: Run `onecoder sprint status` to see current state, or `onecoder sprint plan` for workflow guidance.

**Q: What spec ID should I use for my commit?**
A: Check SPECIFICATIONS.md for the complete list. If your work doesn't match any existing spec, propose a new one first.
