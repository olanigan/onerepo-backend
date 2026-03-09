# Setup Multi Backend Gtd App

## Sprint Goal

Build a multi-backend GTD (Getting Things Done) task management application with:
- Next.js 16 frontend with Tailwind v4
- Pluggable backend architecture (Bun/SQLite local, cloud backends)
- Cloudflare Workers gateway for runtime backend switching

## Current Status

**Phase**: Implementation

### Completed Tasks

| ID | Task | Status |
|----|------|--------|
| 001 | Create comprehensive .gitignore | ✅ |
| 002 | Design hybrid local/cloud architecture (ADR-001) | ✅ |
| 003 | Create Frontend PRD (SPEC-FRONTEND-001) | ✅ |
| 004 | Create Gateway PRD (SPEC-GATEWAY-001) | ✅ |
| 005 | Create Bun SQLite Backend PRD (SPEC-BACKEND-001) | ✅ |
| 006 | Create Specs Index README | ✅ |
| 007 | Document architecture insights in FEEDBACK.md | ✅ |
| 008 | Move ADR and update AGENTS.md | ✅ |
| 009 | Migrate FocusFlow UI to onerepo/frontend | ✅ |
| 010 | Integrate recharts for Insights dashboard | ✅ |
| 011 | Create agent-browser skill for UI validation | ✅ |
| 012 | Visual verification of AI-free UI | ✅ |

### In Progress

| ID | Task | Status |
|----|------|--------|
| 013 | Connect frontend to backend gateway | 🔄 |

## Architecture

```
┌─────────────────┐
│   Next.js 16    │  onerepo/frontend
│   (Port 3000)   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Cloudflare     │  onerepo/gateways
│  Workers        │  (x-backend header routing)
└────────┬────────┘
         │
    ┌────┴────┐
    ▼         ▼
┌───────┐ ┌───────┐
│ Local │ │ Cloud │
│Docker │ │Workers│
└───────┘ └───────┘
```

## Key Files

- `onerepo/frontend/` - Next.js 16 + Tailwind v4 application
- `onerepo/gateways/` - Cloudflare Workers gateway
- `onerepo/backends/` - Backend implementations
- `onerepo/docs/architecture/decisions/ADR-001.md` - Architecture decision record

## Next Steps

1. Replace localStorage in frontend with API calls to gateway
2. Implement task CRUD endpoints in Bun/SQLite backend
3. Test backend switching via x-backend header
4. Add backend selection UI to frontend

## Artifacts

- Screenshots: `onerepo/assets/ui-final.png`, `onerepo/assets/ui-insights.png`
- Skill: `onerepo/.agent/skills/agent-browser/SKILL.md`
