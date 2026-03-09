# Project Feedback & Friction Log

This document serves as a repository for capturing friction points, bug reports, and suggested improvements for both the `onecoder` CLI and the project architecture.

## Protocol

**For Agents:**
When you encounter an error, a confusing workflow, or an opportunity for optimization:
1.  **Document it here immediately.**
2.  Use the format below.
3.  If critical for the current task, try to resolve it, but always log it for future refinement.

---

## Log

### [2026-02-07] CLI & Setup Frictions
- **Issue**: `onecoder sprint init` command was deprecated/unknown in the installed version vs. documentation expectations.
- **Resolution**: Used `onecoder sprint start --name ...` instead.
- **Suggestion**: Update global docs or ensure CLI version parity.

### [2026-02-07] Environment Gaps
- **Issue**: Missing runtimes for Java, PHP, .NET, Elixir in the current environment.
- **Impact**: Deferred multi-language backend setup.
- **Action**: Focusing on TypeScript/Bun stack for Sprint 1.

### [2026-02-07] Architecture Design Session - Insights & Friction

**Completed Work:**
- Created comprehensive `.gitignore` covering all project directories
- Designed hybrid local/cloud architecture (ADR-001)
- Created 4 PRDs: Frontend, Gateway, Bun SQLite Backend, and Architecture Summary
- Updated Gateway PRD to support runtime backend switching

**Insights:**
1. **Registry Pattern Value**: The BackendRegistry interface provides clean separation between local Docker (env vars) and cloud (KV) configurations. This will make testing much easier.

2. **Security by Design**: Network isolation in Docker Compose prevents accidental exposure of local backends. Only gateway exposed on host.

3. **Header-Based Routing**: Using `x-backend` + `x-backend-location` headers enables powerful comparison capabilities—users can test local vs cloud from same UI.

**Friction Points:**
1. **No Existing Specs Directory Structure**: Had to create specs/ from scratch. Unclear if there's a preferred format for ADRs vs PRDs.

2. **Sprint Task Tracking**: Unclear how to manually add tasks to sprint.yaml. The CLI expects tasks to be created via commands, but I was doing design work that doesn't fit typical task patterns.

3. **Documentation Overlap**: FEEDBACK.md captures friction, but AGENTS.md section 2 says to update AGENTS.md for operational best practices. Need clarity on when to use which.

**Suggestions:**
1. Create a `onecoder task add` command for manual task addition during design/architecture phases
2. Add templates for ADRs and PRDs to `.agent/templates/`
3. Clarify in AGENTS.md: FEEDBACK.md for bugs/friction, AGENTS.md for discovered best practices
4. Consider a `onecoder docs generate` command to scaffold architecture docs

**Technical Debt Identified:**
- None yet—architecture is clean with clear interfaces
- Future concern: Cloudflare D1 backend schema migrations will need different approach than SQLite

### [2026-02-21] FocusFlow UI Migration

**Completed Work:**
- Migrated FocusFlow UI from personal/ to onerepo/frontend
- Removed all AI features (Goal Architect, AI Coach)
- Implemented GTD segmented layout (Morning/Afternoon/Evening)
- Added multi-view navigation (Today/Backlog/Archive/Insights)
- Integrated recharts for Insights dashboard
- Created agent-browser skill for UI validation
- Verified UI via headless browser automation

**Insights:**
1. **agent-browser Workflow**: Using `npx agent-browser snapshot -i` provides clean accessibility tree for AI agents without parsing HTML
2. **Port Conflicts**: Dev servers can leave zombie processes - always check `lsof -i :3000` before debugging
3. **Tailwind v4**: Uses `@import "tailwindcss"` syntax, glassmorphism works via custom `.glass-panel` class

**Friction Points:**
1. **Missing Skill**: Handoff referenced `onerepo/.agent/skills/agent-browser.md` but skills require `skills/<name>/SKILL.md` path - created proper structure
2. **Default Next.js Title**: Page title still shows "Create Next App" from default layout - needs metadata update

**Next Steps:**
- Connect frontend localStorage to backend gateway API
- Update Next.js metadata for proper title
- Test full CRUD flow with Bun/SQLite backend
