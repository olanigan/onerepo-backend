# The Backend Shootout: GTD App

A multi-language implementation of the same GTD (Getting Things Done) application to compare Developer Experience, Performance, and Coding Agent capabilities across ecosystems.

## Quick Start

```bash
# Start the gateway
cd gateways && npm run dev

# Start a backend
cd backends/bun-sqlite && bun run dev

# Start frontend
cd frontend && npm run dev
```

## Demo

- **Live Frontend**: [https://gtd.unblockd.dev/](https://gtd.unblockd.dev/)

## Architecture

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

## Specifications

This project uses a **spec-driven development** approach. All work is tracked against specifications.

| Spec ID | Component | Document | Status |
|---------|-----------|----------|--------|
| `SPEC-PROJECT-001` | Project Governance | `SPECIFICATIONS.md` | ✅ Active |
| `SPEC-FRONTEND-001` | Frontend | `specs/PRD-Frontend.md` | ✅ Implemented |
| `SPEC-GATEWAY-001` | Gateway | `specs/PRD-Gateway.md` | ✅ Implemented |
| `SPEC-BACKEND-001` | Bun + SQLite | `specs/PRD-Backend-BunSQLite.md` | ✅ Implemented |
| `SPEC-BACKEND-002` | Hono + D1 | `specs/PRD-Backend-HonoD1.md` | ✅ Implemented |
| `SPEC-BACKEND-003` | Java Spring Boot | `backends/java-springboot/` | 🔄 In Progress |
| `SPEC-BACKEND-004` | Elixir Phoenix | `backends/elixir-phoenix/` | 📋 Planned |
| `SPEC-BACKEND-005` | Ruby on Rails | `backends/ruby-rails/` | 📋 Planned |
| `SPEC-BACKEND-006` | PHP Laravel | `backends/php-laravel/` | 📋 Planned |
| `SPEC-BACKEND-007` | C# .NET | `backends/dotnet-api/` | 📋 Planned |

### Commit Workflow

All commits should be linked to a specification:

```bash
onecoder sprint commit -m "feat: add feature" --spec-id SPEC-FRONTEND-001
```

See [SPECIFICATIONS.md](SPECIFICATIONS.md) for details.

## Backend Tracker

| # | Language | Framework | Path | Spec ID | Status |
|---|----------|-----------|------|---------|--------|
| 1 | TypeScript | Bun + SQLite | `backends/bun-sqlite/` | SPEC-BACKEND-001 | ✅ Implemented |
| 2 | TypeScript | Hono + D1 | `backends/hono-d1/` | SPEC-BACKEND-002 | ✅ Implemented |
| 3 | Java | Spring Boot | `backends/java-springboot/` | SPEC-BACKEND-003 | 🔄 In Progress |
| 4 | Elixir | Phoenix | `backends/elixir-phoenix/` | SPEC-BACKEND-004 | 📋 Planned |
| 5 | Ruby | Rails | `backends/ruby-rails/` | SPEC-BACKEND-005 | 📋 Planned |
| 6 | PHP | Laravel | `backends/php-laravel/` | SPEC-BACKEND-006 | 📋 Planned |
| 7 | C# | .NET | `backends/dotnet-api/` | SPEC-BACKEND-007 | 📋 Planned |

## Version Roadmap

| Version | Focus | Components | Status |
|---------|-------|------------|--------|
| **v0.1.0** | Foundation | Bun + SQLite, Gateway, Frontend | ✅ Complete |
| **v0.2.0** | Cloud | Hono + D1, Cloudflare Deploy | ✅ Complete |
| **v0.3.0** | Multi-Backend | Java, Elixir, Ruby, PHP, C# | 🔄 In Progress |

## Project Structure

```
.
├── .sprint/              # Sprint tracking
├── backends/             # Backend implementations
│   ├── bun-sqlite/      # Bun + SQLite (v0.1.0)
│   ├── hono-d1/         # Hono + Cloudflare D1 (v0.2.0)
│   └── java-springboot/  # Java Spring Boot (v0.3.0)
├── docs/                 # Architecture decisions (ADRs)
├── frontend/             # Next.js frontend
├── gateways/            # Cloudflare Workers gateway
├── specs/                # Product requirements (PRDs)
├── benchmarks/           # Performance benchmarking
├── SPECIFICATIONS.md     # Project spec index
├── ONECODER.md          # CLI command reference
├── AGENTS.md            # Agent operational guide
└── FEEDBACK.md          # Friction log
```

## Usage

1. **Start the Gateway**:
   ```bash
   cd gateways && npm run dev
   ```

2. **Run a Backend**:
   Navigate to a backend folder and follow its specific README.

3. **Switch Contexts**:
   Use the frontend dropdown to toggle the `x-backend` header.

## Governance

This project uses OneCoder for sprint management. See:

- [ONECODER.md](ONECODER.md) - CLI commands and workflow
- [AGENTS.md](AGENTS.md) - Agent operational guide
- [FEEDBACK.md](FEEDBACK.md) - Issues and friction log
