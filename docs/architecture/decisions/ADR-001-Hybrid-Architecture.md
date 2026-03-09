# Architecture Decision Record: Hybrid Local/Cloud Backend Routing

**ADR ID:** ADR-001  
**Status:** Active  
**Date:** 2026-02-07  
**Updated:** 2026-02-21  
**Context:** v0.1.x Hono D1 + Gateway + Next.js

---

## 1. Problem Statement

We need an architecture that supports:
- **Local Development**: Local development with wrangler dev
- **Cloud Production**: Cloudflare Workers + D1
- **Hybrid Mode**: Gateway can route to local OR cloud backends at runtime
- **Clean Code**: Minimal conditional logic, good separation of concerns
- **Security**: Local backends never exposed to internet

---

## 1.1 Current Implementation (v0.1.x)

**Deployed Stack:**
- **Frontend**: Next.js on Cloudflare Pages
- **Gateway**: Hono-based Cloudflare Worker with x-backend routing
- **Backend**: Hono + D1 (Cloudflare)

**Data Model (Backend):**
```typescript
interface Task {
  id: string;
  title: string;
  description: string;
  status: 'inbox' | 'next' | 'waiting' | 'done';
  project_id: string | null;
  created_at: string;
  updated_at: string;
}

interface Project {
  id: string;
  name: string;
  status: 'active' | 'someday' | 'archive';
  created_at: string;
  updated_at: string;
}
```

**Frontend Views:**
- **Inbox**: Tasks needing review (status: 'inbox')
- **Next**: Ready to work on (status: 'next')
- **Waiting**: On hold/deferred (status: 'waiting')
- **Done**: Completed (status: 'done')

---

## 2. Decision

### 2.1 Backend Registry Pattern

Abstract backend discovery behind a registry interface:

```typescript
// gateways/src/registry.ts
interface BackendRegistry {
  getBackend(id: string): Promise<Backend | null>;
  listBackends(): Promise<Backend[]>;
  checkHealth(backend: Backend): Promise<HealthStatus>;
}

interface Backend {
  id: string;
  name: string;
  url: string;           // Full URL to backend
  type: 'local' | 'cloud';
  region?: string;       // For cloud: 'us-east', 'eu-west', etc.
  healthEndpoint: string;
}
```

### 2.2 Environment-Aware Implementation

Two registry implementations, selected by environment:

```typescript
// gateways/src/registry-local.ts
// Uses environment variables for local Docker backends
// Reads from: BACKEND_BUN_SQLITE_URL=http://bun-sqlite:3001

// gateways/src/registry-cloud.ts  
// Uses Cloudflare Config/KV for cloud backends
// Reads from: BACKEND_CONFIG_KV or Secrets

// gateways/src/index.ts
const registry = env.ENVIRONMENT === 'local' 
  ? new LocalRegistry(env)
  : new CloudRegistry(env);
```

### 2.3 Backend URL Resolution Strategy

**Local Development (Docker Compose):**
```yaml
# docker-compose.yml
services:
  gateway:
    environment:
      - ENVIRONMENT=local
      - BACKEND_BUN_SQLITE_URL=http://bun-sqlite:3001
      - BACKEND_CF_D1_URL=http://cf-d1:8787  # Local wrangler dev
      
  bun-sqlite:
    build: ./backends/bun-sqlite
    networks: [backend-network]
    # NOT exposed to host - only accessible via gateway
    
  cf-d1:
    build: ./backends/cf-d1
    networks: [backend-network]
```

**Cloud Production:**
```typescript
// Registry reads from Cloudflare Config or KV
const backends = await env.BACKEND_CONFIG_KV.get('backends');
// Returns: [{id: 'cf-d1', url: 'https://gtd-d1.workers.dev', ...}]
```

**Hybrid Runtime:**
Gateway accepts `x-backend` header + optional `x-backend-location` header:
- `x-backend: bun-sqlite` → Use default location (local or cloud based on env)
- `x-backend: bun-sqlite` + `x-backend-location: local` → Force local
- `x-backend: bun-sqlite` + `x-backend-location: cloud` → Force cloud

### 2.4 Security Model

**Local Development:**
```
┌─────────────────────────────────────────────────────┐
│  Docker Network: backend-network (isolated)         │
│                                                     │
│  ┌──────────┐    ┌─────────────┐    ┌──────────┐  │
│  │  Next.js │───→│   Gateway   │───→│Bun SQLite│  │
│  │ (host:3000)   │ (host:8787) │    │ (internal)│  │
│  └──────────┘    └─────────────┘    └──────────┘  │
│                         │                         │
│                         ↓                         │
│                   ┌──────────┐                   │
│                   │ CF D1    │                   │
│                   │ (internal)│                   │
│                   └──────────┘                   │
└─────────────────────────────────────────────────────┘
```

- Local backends on isolated Docker network
- Only gateway exposed to host
- No direct access to backends from outside

**Cloud Production:**
- Backends behind Cloudflare Access or API tokens
- Gateway validates `x-backend` against allowlist
- No local backends accessible (they don't exist)

### 2.5 Clean Code Structure

```
gateways/
├── src/
│   ├── index.ts              # Entry point, router
│   ├── middleware/
│   │   ├── cors.ts           # CORS handling
│   │   ├── auth.ts           # Future: API key validation
│   │   └── logging.ts        # Request logging
│   ├── registry/
│   │   ├── types.ts          # Interfaces
│   │   ├── index.ts          # Factory function
│   │   ├── local.ts          # Docker-based discovery
│   │   └── cloud.ts          # Cloudflare-based discovery
│   ├── routing/
│   │   └── proxy.ts          # Backend proxy logic
│   └── utils/
│       └── errors.ts         # Error handling
├── wrangler.toml             # Cloudflare config
├── docker-compose.yml        # Local orchestration
└── Dockerfile                # Gateway container
```

---

### 2.6 Hono D1 Backend Implementation (v0.1.x)

Current production backend using Hono + Cloudflare D1:

```
backends/hono-d1/
├── src/
│   ├── index.ts          # Hono app with all routes
│   └── schema.ts         # Drizzle ORM schema
├── schema.sql            # D1 database schema
├── wrangler.toml         # D1 binding config
└── package.json
```

**Routes:**
- `GET /tasks` - List all tasks (optional ?status=filter)
- `GET /tasks/:id` - Get single task
- `POST /tasks` - Create task
- `PUT /tasks/:id` - Update task
- `DELETE /tasks/:id` - Delete task
- `GET /projects` - List projects
- `GET /projects/:id/tasks` - Get tasks for project
- `GET /health` - Health check

**Environment:**
```toml
# wrangler.toml
[[d1_databases]]
binding = "DB"
database_name = "gtd-db"
```

---

## 3. Implementation Details

### 3.1 Local Registry (Docker)

```typescript
// gateways/src/registry/local.ts
export class LocalRegistry implements BackendRegistry {
  private backends: Map<string, Backend>;
  
  constructor(env: Env) {
    // Parse from environment variables
    this.backends = new Map([
      ['bun-sqlite', {
        id: 'bun-sqlite',
        name: 'Bun + SQLite (Local)',
        url: env.BACKEND_BUN_SQLITE_URL,
        type: 'local',
        healthEndpoint: '/health'
      }],
      ['cf-d1', {
        id: 'cf-d1', 
        name: 'Cloudflare D1 (Local Dev)',
        url: env.BACKEND_CF_D1_URL,
        type: 'local',
        healthEndpoint: '/health'
      }]
    ]);
  }
  
  async getBackend(id: string): Promise<Backend | null> {
    return this.backends.get(id) || null;
  }
  
  async listBackends(): Promise<Backend[]> {
    return Array.from(this.backends.values());
  }
  
  async checkHealth(backend: Backend): Promise<HealthStatus> {
    try {
      const response = await fetch(`${backend.url}${backend.healthEndpoint}`, {
        signal: AbortSignal.timeout(5000)
      });
      return {
        status: response.ok ? 'healthy' : 'unhealthy',
        latency: Date.now() - start
      };
    } catch {
      return { status: 'unhealthy', latency: null };
    }
  }
}
```

### 3.2 Cloud Registry (Cloudflare)

```typescript
// gateways/src/registry/cloud.ts
export class CloudRegistry implements BackendRegistry {
  constructor(private env: Env) {}
  
  async getBackend(id: string): Promise<Backend | null> {
    // Read from KV or Config
    const config = await this.env.BACKEND_CONFIG_KV.get(`backend:${id}`);
    return config ? JSON.parse(config) : null;
  }
  
  async listBackends(): Promise<Backend[]> {
    const list = await this.env.BACKEND_CONFIG_KV.list({ prefix: 'backend:' });
    const backends = await Promise.all(
      list.keys.map(key => this.env.BACKEND_CONFIG_KV.get(key.name))
    );
    return backends.filter(Boolean).map(b => JSON.parse(b!));
  }
  
  // Health check with caching to avoid KV hits
  async checkHealth(backend: Backend): Promise<HealthStatus> {
    const cacheKey = `health:${backend.id}`;
    const cached = await this.env.CACHE.get(cacheKey);
    if (cached) return JSON.parse(cached);
    
    const health = await this.performHealthCheck(backend);
    await this.env.CACHE.put(cacheKey, JSON.stringify(health), { expirationTtl: 30 });
    return health;
  }
}
```

### 3.3 Request Router

```typescript
// gateways/src/routing/proxy.ts
export async function proxyToBackend(
  request: Request,
  backend: Backend,
  options: ProxyOptions
): Promise<Response> {
  const url = new URL(request.url);
  const targetUrl = `${backend.url}${url.pathname}${url.search}`;
  
  // Clone headers and add provenance
  const headers = new Headers(request.headers);
  headers.set('x-forwarded-for', request.headers.get('cf-connecting-ip') || 'unknown');
  headers.set('x-gateway-version', '1.0.0');
  
  // Optional: Force local/cloud
  if (options.forceLocation) {
    headers.set('x-backend-location', options.forceLocation);
  }
  
  try {
    const response = await fetch(targetUrl, {
      method: request.method,
      headers,
      body: request.body,
      signal: AbortSignal.timeout(options.timeout || 30000)
    });
    
    // Add CORS headers
    const corsHeaders = applyCors(response.headers);
    
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: corsHeaders
    });
  } catch (error) {
    if (error instanceof TimeoutError) {
      return errorResponse(504, 'Gateway Timeout');
    }
    return errorResponse(503, 'Backend Unavailable');
  }
}
```

### 3.4 Main Handler

```typescript
// gateways/src/index.ts
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    // Initialize registry based on environment
    const registry = createRegistry(env);
    
    // Parse request
    const url = new URL(request.url);
    const backendId = request.headers.get('x-backend') || 'bun-sqlite';
    const forceLocation = request.headers.get('x-backend-location') as LocationType | null;
    
    // Get backend configuration
    const backend = await registry.getBackend(backendId);
    if (!backend) {
      return errorResponse(400, `Unknown backend: ${backendId}`);
    }
    
    // Check health (with caching)
    const health = await registry.checkHealth(backend);
    if (health.status !== 'healthy') {
      return errorResponse(503, `Backend ${backendId} is unhealthy`);
    }
    
    // Route request
    return proxyToBackend(request, backend, {
      timeout: 30000,
      forceLocation
    });
  }
};
```

---

## 4. Docker Compose Setup (v0.1.0)

```yaml
# docker-compose.yml
version: '3.8'

services:
  # Frontend (Next.js)
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - GATEWAY_URL=http://gateway:8787
    depends_on:
      - gateway
    networks:
      - frontend-network
      
  # Gateway (Cloudflare Worker in local mode)
  gateway:
    build:
      context: ./gateways
      dockerfile: Dockerfile
    ports:
      - "8787:8787"
    environment:
      - ENVIRONMENT=local
      - BACKEND_BUN_SQLITE_URL=http://bun-sqlite:3001
      - BACKEND_CF_D1_URL=http://cf-d1:8787
    depends_on:
      - bun-sqlite
      - cf-d1
    networks:
      - frontend-network
      - backend-network
      
  # Bun + SQLite Backend
  bun-sqlite:
    build:
      context: ./backends/bun-sqlite
      dockerfile: Dockerfile
    environment:
      - DATABASE_URL=file:/data/gtd.db
    volumes:
      - bun-sqlite-data:/data
    networks:
      - backend-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3001/health"]
      interval: 10s
      timeout: 5s
      retries: 3
      
  # Cloudflare D1 Backend (local wrangler dev)
  cf-d1:
    build:
      context: ./backends/cf-d1
      dockerfile: Dockerfile
    environment:
      - D1_DATABASE_ID=local
    networks:
      - backend-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8787/health"]
      interval: 10s
      timeout: 5s
      retries: 3

networks:
  frontend-network:
    driver: bridge
  backend-network:
    driver: bridge
    internal: false  # Gateway needs to bridge both

volumes:
  bun-sqlite-data:
```

---

## 5. Security Considerations

### 5.1 Local Development
- ✅ Backends on isolated Docker network
- ✅ Only gateway exposed to host
- ✅ No secrets in code (use .env)
- ✅ Health checks prevent routing to dead backends

### 5.2 Cloud Production
- ✅ Backends behind Cloudflare Access
- ✅ API key validation (future)
- ✅ Backend URLs in Secrets, not code
- ✅ Request timeout limits
- ✅ Rate limiting (Cloudflare native)

### 5.3 Secrets Management
```typescript
// gateways/src/env.ts
interface Env {
  // Cloudflare bindings
  BACKEND_CONFIG_KV: KVNamespace;
  CACHE: Cache;
  
  // Secrets (wrangler secret put)
  API_KEY?: string;  // For future auth
  
  // Environment variables
  ENVIRONMENT: 'local' | 'cloud';
  BACKEND_BUN_SQLITE_URL?: string;
  BACKEND_CF_D1_URL?: string;
}
```

---

## 6. Migration Path

**v0.1.x (Current):**
- Hono D1 backend deployed to Cloudflare Workers
- Gateway with x-backend header routing
- Next.js frontend on Cloudflare Pages
- Frontend uses backend status model (inbox/next/waiting/done)

**v0.2.0:**
- Add Bun SQLite local backend for development
- Update gateway to support local backend routing
- Docker Compose for local full-stack development

**v1.0.0:**
- VPS deployment with self-hosted backends
- Add authentication
- Add remaining backends (Elixir, Ruby, etc.)
- Performance benchmarking suite

---

## 7. Pros & Cons

### ✅ Pros
- **Clean separation**: Local vs cloud logic isolated
- **Type-safe**: TypeScript interfaces enforce contract
- **Testable**: Easy to mock registry for tests
- **Secure**: Network isolation, fail-closed design
- **Flexible**: Runtime backend switching

### ❌ Cons
- **Complexity**: Two registry implementations
- **Docker overhead**: Local dev requires Docker
- **Debugging**: More network hops in local mode

### 🔄 Alternatives Considered
1. **Single Registry with Config File**: Rejected - security risk, can't easily switch
2. **Environment Variables Only**: Rejected - doesn't scale to many backends
3. **Service Mesh**: Rejected - overkill for this use case

---

## 8. Consequences

This architecture provides:
1. **Clean code** through interface-based design
2. **Security** via network isolation and secrets management
3. **Flexibility** to run locally or in cloud
4. **Future-proofing** for additional backends

The tradeoff is slightly more initial complexity, but this pays off in maintainability.
