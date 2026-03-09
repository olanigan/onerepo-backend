# PRD: Cloudflare Gateway

**Spec ID:** SPEC-GATEWAY-001  
**Status:** Draft  
**Last Updated:** 2026-02-07  
**Owner:** Backend Shootout Team

**Architecture:** See `specs/ADR-001-Hybrid-Architecture.md` for detailed architecture decisions.

---

## 1. Overview

### 1.1 Purpose
A Cloudflare Worker that routes API requests to different backend implementations based on the `x-backend` header, enabling the shootout comparison architecture. Supports both local Docker development and cloud production deployments.

### 1.2 Key Goals
- Route requests to appropriate backend (local or cloud)
- Support hybrid mode: switch between local Docker and cloud backends
- Add CORS headers for frontend
- Health check endpoint for backend discovery
- Consistent error handling across backends
- Secure: Never expose local backends to internet

---

## 2. Functional Requirements

### 2.1 Routing
- [ ] **Header-Based Routing**: Parse `x-backend` header to determine target
- [ ] **Location Override**: Support `x-backend-location: local|cloud` header to force routing
- [ ] **Backend Mapping**: Environment-aware backend discovery:
  - **Local (Docker)**: Read from environment variables (e.g., `BACKEND_BUN_SQLITE_URL`)
  - **Cloud**: Read from KV/Config store
  - Supported backends:
    - `bun-sqlite` → Local SQLite (v0.1.0 default)
    - `cf-d1` → Cloudflare Worker + D1 (cloud default)
    - `elixir-phoenix` → Elixir backend
    - `ruby-rails` → Ruby backend
    - `php-laravel` → PHP backend
    - `dotnet-api` → .NET backend
    - `java-spring-boot` → Java backend
- [ ] **Default Backend**: Route to `bun-sqlite` (local) or `cf-d1` (cloud) based on environment
- [ ] **Passthrough**: Forward all HTTP methods, headers, body, query params
- [ ] **Response Passthrough**: Return backend response as-is (with CORS)
- [ ] **Registry Pattern**: Abstract backend discovery via `BackendRegistry` interface

### 2.2 CORS Handling
- [ ] **Preflight**: Handle OPTIONS requests
- [ ] **Headers**: Add CORS headers to all responses:
  - `Access-Control-Allow-Origin: *`
  - `Access-Control-Allow-Methods: GET, POST, PUT, DELETE, PATCH, OPTIONS`
  - `Access-Control-Allow-Headers: Content-Type, x-backend`

### 2.3 Health & Discovery
- [ ] **Health Endpoint**: `GET /health` returns gateway status
- [ ] **Backend Discovery**: `GET /backends` returns list of configured backends with health status
- [ ] **Backend Health Check**: Periodic ping to each backend

### 2.4 Error Handling
- [ ] **Backend Unreachable**: Return 503 with clear message
- [ ] **Invalid Backend**: Return 400 if `x-backend` value not recognized
- [ ] **Timeout**: 30s timeout on backend requests
- [ ] **Logging**: Log routing decisions and errors

---

## 3. Technical Requirements

### 3.1 Stack
- **Runtime**: Cloudflare Workers
- **Language**: TypeScript
- **Build**: Wrangler CLI

### 3.2 Configuration

#### Local Development (Docker)
Environment variables in `docker-compose.yml`:
```yaml
environment:
  - ENVIRONMENT=local
  - BACKEND_BUN_SQLITE_URL=http://bun-sqlite:3001
  - BACKEND_CF_D1_URL=http://cf-d1:8787
```

#### Cloud Production
```toml
# wrangler.toml
name = "gtd-gateway"
main = "src/index.ts"
compatibility_date = "2026-02-07"

[[kv_namespaces]]
binding = "BACKEND_CONFIG_KV"
id = "your-kv-namespace-id"

[vars]
ENVIRONMENT = "cloud"
```

Backend URLs stored in KV:
```
Key: backend:cf-d1
Value: {"id":"cf-d1","name":"Cloudflare D1","url":"https://gtd-d1.workers.dev","type":"cloud"}
```

### 3.3 Architecture

#### Registry Pattern
```typescript
// Abstract backend discovery
interface BackendRegistry {
  getBackend(id: string): Promise<Backend | null>;
  listBackends(): Promise<Backend[]>;
  checkHealth(backend: Backend): Promise<HealthStatus>;
}

// Local implementation: reads from env vars
class LocalRegistry implements BackendRegistry { ... }

// Cloud implementation: reads from KV
class CloudRegistry implements BackendRegistry { ... }
```

#### Environment Selection
```typescript
const registry = env.ENVIRONMENT === 'local' 
  ? new LocalRegistry(env)
  : new CloudRegistry(env);
```

### 3.4 Security
- [ ] **Network Isolation**: Local backends only accessible via gateway (Docker internal network)
- [ ] **No Hardcoded URLs**: All backend URLs from environment/config
- [ ] **Health Check Gate**: Don't route to unhealthy backends
- [ ] **Timeout Protection**: 30s max request time
- [ ] **Secrets in KV**: Backend credentials stored in Cloudflare Secrets

### 3.5 Performance
- [ ] **Cold Start**: < 50ms
- [ ] **Routing Overhead**: < 10ms added latency
- [ ] **Concurrent Requests**: Handle 1000+ concurrent
- [ ] **Health Check Caching**: Cache health status for 30s to reduce KV hits

---

## 4. API Endpoints

### 4.1 Gateway-Specific

#### GET /health
Returns gateway health status.

**Response:**
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "timestamp": "2026-02-07T10:00:00Z"
}
```

#### GET /backends
Returns list of backends and their health.

**Response:**
```json
{
  "backends": [
    {
      "id": "bun-sqlite",
      "name": "Bun + SQLite",
      "url": "http://localhost:3001",
      "health": "healthy",
      "last_check": "2026-02-07T10:00:00Z"
    }
  ]
}
```

### 4.2 Passthrough Routes
All other routes are forwarded to the selected backend with header `x-backend`.

---

## 5. Data Models

### 5.1 Backend Config
```typescript
interface BackendConfig {
  id: string;
  name: string;
  url: string;
  healthEndpoint?: string;
}
```

### 5.2 Backend Status
```typescript
interface BackendStatus {
  id: string;
  health: 'healthy' | 'unhealthy' | 'unknown';
  lastCheck: string;  // ISO 8601
  latency?: number;   // ms
}
```

---

## 6. Error Responses

### 6.1 Backend Unavailable (503)
```json
{
  "error": "Backend Unavailable",
  "message": "The requested backend 'ruby-rails' is not responding",
  "backend": "ruby-rails"
}
```

### 6.2 Invalid Backend (400)
```json
{
  "error": "Invalid Backend",
  "message": "Backend 'unknown-backend' is not configured",
  "valid_backends": ["bun-sqlite", "elixir-phoenix", "ruby-rails"]
}
```

### 6.3 Timeout (504)
```json
{
  "error": "Gateway Timeout",
  "message": "Backend did not respond within 30s"
}
```

---

## 7. Testing

### 7.1 Unit Tests
- [ ] Routing logic with different headers
- [ ] CORS header injection
- [ ] Error handling for various failure modes

### 7.2 Integration Tests
- [ ] End-to-end with actual backend
- [ ] Health check endpoint
- [ ] Backend discovery

---

## 8. Deployment

### 8.1 Local Development
```bash
cd gateways
npm run dev  # Uses wrangler dev
```

### 8.2 Production (Future)
- Deploy to Cloudflare Workers
- Environment-specific backend URLs
- Custom domain: `api.backend-shootout.dev`

---

## 9. Success Criteria

- [ ] All routes correctly forwarded to backends
- [ ] CORS works for frontend requests
- [ ] Health checks accurately reflect backend status
- [ ] < 20ms routing overhead
- [ ] Handles 1000 concurrent requests without errors

---

## 10. Related Documents

- `specs/openapi.yaml` - API Contract
- `specs/PRD-Frontend.md` - Frontend PRD
