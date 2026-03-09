# Architecture Summary: Backend Shootout v0.1.0

**Date:** 2026-02-07  
**Status:** Architecture defined, ready for implementation

---

## Quick Overview

We've designed a **hybrid local/cloud architecture** that supports:
- **Local Development**: Docker Compose with Bun/SQLite backends
- **Cloud Production**: Cloudflare Workers + D1
- **Runtime Switching**: Gateway can route to local OR cloud at runtime

---

## Created Documents

### Architecture
1. **`docs/architecture/decisions/ADR-001-Hybrid-Architecture.md`** - Complete architecture decision record
   - Backend Registry Pattern
   - Environment-aware routing
   - Docker Compose setup
   - Security model

### Product Requirements
2. **`specs/PRD-Frontend.md`** - Next.js GTD application
3. **`specs/PRD-Gateway.md`** - Cloudflare Worker router (updated for hybrid)
4. **`specs/PRD-Backend-BunSQLite.md`** - Bun + SQLite reference implementation

---

## Key Architectural Decisions

### 1. Backend Registry Pattern
Instead of hardcoded routing, we use an interface:
```typescript
interface BackendRegistry {
  getBackend(id: string): Promise<Backend | null>;
  listBackends(): Promise<Backend[]>;
}
```

**Why:** Clean separation between local (env vars) and cloud (KV) configuration.

### 2. Network Isolation (Security)
```
Docker Network Layout:
┌─────────────────────────────────────────┐
│  Host Machine                           │
│  ┌──────────┐      ┌──────────────┐    │
│  │Frontend  │──────│Gateway       │    │
│  │:3000     │      │:8787         │    │
│  └──────────┘      └──────┬───────┘    │
│                           │            │
│              ┌────────────┴────────┐   │
│              │  Docker Network     │   │
│              │  (isolated)         │   │
│              │  ┌──────┐ ┌──────┐  │   │
│              │  │Bun   │ │CF D1 │  │   │
│              │  │SQLite│ │(dev) │  │   │
│              │  └──────┘ └──────┘  │   │
│              └─────────────────────┘   │
└─────────────────────────────────────────┘
```

**Why:** Local backends can't be accessed directly—only through gateway.

### 3. Hybrid Headers
Frontend can force routing:
- `x-backend: bun-sqlite` → Uses default location
- `x-backend: bun-sqlite` + `x-backend-location: local` → Forces local
- `x-backend: bun-sqlite` + `x-backend-location: cloud` → Forces cloud

**Why:** Enables comparing local vs cloud performance from same frontend.

---

## Project Structure (v0.1.0)

```
onerepo/
├── frontend/              # Next.js app
│   ├── src/
│   └── Dockerfile
├── gateways/              # Cloudflare Worker
│   ├── src/
│   │   ├── index.ts
│   │   ├── registry/
│   │   │   ├── types.ts
│   │   │   ├── local.ts
│   │   │   └── cloud.ts
│   │   └── middleware/
│   ├── wrangler.toml
│   └── Dockerfile
├── backends/
│   ├── bun-sqlite/        # Local-first default
│   │   ├── src/
│   │   ├── migrations/
│   │   └── Dockerfile
│   └── cf-d1/            # Cloud Worker (future v0.2.0)
├── docker-compose.yml     # Local orchestration
└── specs/
    ├── openapi.yaml       # API contract
    └── PRD-Frontend.md
    ├── PRD-Gateway.md
    └── PRD-Backend-BunSQLite.md
```

---

## Implementation Roadmap

### Phase 1: Foundation (v0.1.0)
- [ ] Bun SQLite backend with full CRUD
- [ ] Gateway with local registry
- [ ] Frontend with task/project management
- [ ] Docker Compose setup
- [ ] Tests for all components

**Files to create:**
- `backends/bun-sqlite/` - Complete implementation
- `gateways/src/registry/local.ts` - Local discovery
- `gateways/src/routing/proxy.ts` - Request forwarding
- `frontend/` - UI components
- `docker-compose.yml` - Orchestration

### Phase 2: Cloud (v0.2.0)
- [ ] CF D1 backend implementation
- [ ] Cloud registry (KV-based)
- [ ] Deploy gateway to Cloudflare
- [ ] Hybrid routing support

### Phase 3: Scale (v0.3.0)
- [ ] Remaining backends (Elixir, Ruby, PHP, C#, Java)
- [ ] Authentication
- [ ] Performance benchmarking

---

## Security Checklist

- [ ] ✅ Local backends on isolated Docker network
- [ ] ✅ No hardcoded URLs or secrets
- [ ] ✅ Health checks prevent routing to dead backends
- [ ] ✅ Request timeouts (30s max)
- [ ] ✅ CORS properly configured
- [ ] ⏳ API key validation (v0.3.0)
- [ ] ⏳ Rate limiting (Cloudflare native)

---

## Quick Start (Once Implemented)

```bash
# Start everything locally
docker-compose up

# Frontend: http://localhost:3000
# Gateway:   http://localhost:8787

# Switch backends via UI dropdown
# or curl with headers:
curl -H "x-backend: bun-sqlite" \
     http://localhost:8787/tasks
```

---

## Questions?

See the detailed PRDs and ADR in `specs/` directory.

Key files for developers:
1. `docs/architecture/decisions/ADR-001-Hybrid-Architecture.md` - Full architecture details
2. `specs/openapi.yaml` - API contract (follow this!)
3. `AGENTS.md` - Development workflow and conventions
