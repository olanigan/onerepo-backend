# Project Specifications

**Project:** Backend Shootout - GTD App  
**Spec ID:** SPEC-PROJECT-001  
**Status:** Active  
**Last Updated:** 2026-03-09  
**Owner:** Backend Shootout Team

---

## 1. Overview

A multi-language implementation of the same GTD (Getting Things Done) application to compare Developer Experience, Performance, and Coding Agent capabilities across ecosystems.

---

## 2. Component Specifications

This project is composed of multiple specifications that work together:

| Spec ID | Component | Document | Status |
|---------|-----------|----------|--------|
| `SPEC-PROJECT-001` | Project Governance | `SPECIFICATIONS.md`, `AGENTS.md`, `ONECODER.md`, `FEEDBACK.md` | Active |
| `SPEC-FRONTEND-001` | Frontend | `specs/PRD-Frontend.md` | Implemented |
| `SPEC-GATEWAY-001` | Gateway | `specs/PRD-Gateway.md` | Implemented |
| `SPEC-BACKEND-001` | Bun + SQLite Backend | `specs/PRD-Backend-BunSQLite.md` | Implemented |
| `SPEC-BACKEND-002` | Hono + D1 Backend | `specs/PRD-Backend-HonoD1.md` | Implemented |
| `SPEC-BACKEND-003` | Java Spring Boot Backend | `backends/java-springboot/` | Pending |

---

## 3. Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend                                │
│                   (SPEC-FRONTEND-001)                           │
│                      Next.js + React                            │
└─────────────────────────────────┬───────────────────────────────┘
                                  │ :8787
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                         Gateway                                 │
│                   (SPEC-GATEWAY-001)                           │
│               Cloudflare Workers Router                         │
│                   x-backend header                              │
└────────┬─────────────────────┬──────────────────┬──────────────┘
         │                     │                  │
         ▼                     ▼                  ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────────┐
│ Bun + SQLite    │ │ Hono + D1       │ │ Future Backends     │
│ SPEC-BACKEND-001│ │ SPEC-BACKEND-002│ │ (Elixir, Ruby, PHP) │
│ :3001           │ │ Cloudflare      │ │                     │
└─────────────────┘ └─────────────────┘ └─────────────────────┘
```

---

## 4. API Contract

All backends must implement the API contract defined in:

- **`specs/openapi.yaml`** - OpenAPI v3 specification

---

## 5. Version Roadmap

| Version | Focus | Components | Status |
|---------|-------|------------|--------|
| **v0.1.0** | Foundation | Bun + SQLite, Gateway, Frontend | ✅ Complete |
| **v0.2.0** | Cloud | Hono + D1, Cloudflare Deploy | ✅ Complete |
| **v0.3.0** | Multi-Backend | Java, Elixir, Ruby, PHP, C# | 🔄 Planned |

---

## 6. Directory Structure

```
.
├── .sprint/              # Sprint tracking (work mapped to SPEC-XXX)
├── backends/             # Backend implementations (SPEC-BACKEND-XXX)
│   ├── bun-sqlite/       # Bun + SQLite
│   ├── hono-d1/          # Hono + Cloudflare D1
│   └── java-springboot/  # Java Spring Boot
├── docs/                 # Architecture decisions (ADRs)
├── frontend/             # Next.js frontend (SPEC-FRONTEND-001)
├── gateways/            # Cloudflare Worker gateway (SPEC-GATEWAY-001)
├── specs/                # Product requirements (SPEC-XXX)
│   ├── PRD-Frontend.md
│   ├── PRD-Gateway.md
│   ├── PRD-Backend-BunSQLite.md
│   └── PRD-Backend-HonoD1.md
├── benchmarks/          # Performance benchmarking
├── SPECIFICATIONS.md    # Project-level spec (SPEC-PROJECT-001)
├── AGENTS.md            # Agent operational guide
├── FEEDBACK.md          # Friction log
└── ONECODER.md          # CLI command reference
```

---

## 8. Governance

### Project-Level Spec (SPEC-PROJECT-001)
The project-level specification (`SPEC-PROJECT-001`) covers:
- Project overview and architecture
- Component spec index
- Version roadmap
- Governance artifacts: `SPECIFICATIONS.md`, `AGENTS.md`, `ONECODER.md`, `FEEDBACK.md`, `HANDOFF.md`, `Makefile`

### Commit Workflow
All commits should be linked to a specification using the `--spec-id` flag:

```bash
onecoder sprint commit -m "feat: add new feature" --spec-id SPEC-FRONTEND-001
```

### Finding Specs
- **Project**: Check `SPECIFICATIONS.md` for overview and spec index
- **Component specs**: Check `specs/` directory
- **Backend specs**: Check `backends/<name>/` for backend-specific PRDs
- **Sprint tracking**: Check `.sprint/<name>/sprint.yaml`

### Proposing New Specs
If no spec exists for your work:
1. Create a new PRD in `specs/` (for new components)
2. Or add to existing spec's task list
3. Reference spec ID in all commits
4. Update this file to include the new spec

---

## 9. Related Documents

- [`specs/openapi.yaml`](specs/openapi.yaml) - API Contract
- [`docs/architecture/decisions/ADR-001-Hybrid-Architecture.md`](docs/architecture/decisions/ADR-001-Hybrid-Architecture.md) - Architecture Decision
- [`ONECODER.md`](ONECODER.md) - CLI Command Reference
- [`AGENTS.md`](AGENTS.md) - Agent Operational Guide
