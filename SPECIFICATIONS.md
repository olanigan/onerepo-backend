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
| `SPEC-FRONTEND-001` | Frontend | `specs/PRD-Frontend.md` | Implemented |
| `SPEC-GATEWAY-001` | Gateway | `specs/PRD-Gateway.md` | Implemented |
| `SPEC-BACKEND-001` | Bun + SQLite Backend | `specs/PRD-Backend-BunSQLite.md` | Implemented |
| `SPEC-BACKEND-002` | Hono + D1 Backend | `backends/hono-d1/` | Implemented |
| `SPEC-BACKEND-003` | Java Spring Boot Backend | `backends/java-springboot/` | Pending |
| `SPEC-CLI-002` | Sprint 001 | `.sprint/001-setup-multi-backend-gtd-app/` | Completed |
| `SPEC-CLI-003` | Sprint 002 | `.sprint/002-deploy-hono-d1-gateway-frontend/` | In Progress |

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

## 6. Sprint History

| Sprint | Name | Spec ID | Status |
|--------|------|---------|--------|
| 001 | Setup Multi-Backend GTD App | SPEC-CLI-002 | ✅ Complete |
| 002 | Deploy Hono D1 + Gateway + Frontend | SPEC-CLI-003 | 🔄 In Progress |
| 003 | Java Spring Boot Backend | SPEC-CLI-004 | 📋 Planned |

---

## 7. Directory Structure

```
.
├── .sprint/              # Sprint tracking (SPEC-CLI-XXX)
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
│   └── PRD-Backend-BunSQLite.md
├── benchmarks/          # Performance benchmarking
├── AGENTS.md            # Agent operational guide
├── FEEDBACK.md          # Friction log
├── ONECODER.md          # CLI command reference
└── SPECIFICATIONS.md    # This file
```

---

## 8. Governance

### Commit Workflow
All commits should be linked to a specification using the `--spec-id` flag:

```bash
onecoder sprint commit -m "feat: add new feature" --spec-id SPEC-FRONTEND-001
```

### Finding Specs
- **Component specs**: Check `specs/` directory
- **Backend specs**: Check `backends/<name>/` for backend-specific PRDs
- **Sprint specs**: Check `.sprint/<name>/sprint.yaml`

### Proposing New Specs
If no spec exists for your work:
1. Create a new PRD in `specs/` (for new components)
2. Or add to existing spec's task list
3. Reference spec ID in all commits

---

## 9. Related Documents

- [`specs/openapi.yaml`](specs/openapi.yaml) - API Contract
- [`docs/architecture/decisions/ADR-001-Hybrid-Architecture.md`](docs/architecture/decisions/ADR-001-Hybrid-Architecture.md) - Architecture Decision
- [`ONECODER.md`](ONECODER.md) - CLI Command Reference
- [`AGENTS.md`](AGENTS.md) - Agent Operational Guide
