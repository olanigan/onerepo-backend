# PRD: Hono + D1 Backend

**Spec ID:** SPEC-BACKEND-002  
**Status:** Implemented  
**Last Updated:** 2026-03-09  
**Owner:** Backend Shootout Team

---

## 1. Overview

### 1.1 Purpose
Cloudflare Workers backend implementation using Hono framework and D1 database. Serves as the cloud-native backend for the GTD application, deployed on Cloudflare's edge network.

### 1.2 Why Hono + D1?
- **Hono**: Ultra-lightweight web framework, perfect for edge computing
- **D1**: Cloudflare's serverless SQL database, built on SQLite
- **Edge**: Global distribution with low latency
- **DX**: TypeScript end-to-end, same as other components

### 1.3 Key Goals
- Implement complete OpenAPI spec
- Deploy to Cloudflare Workers with D1 binding
- Demonstrate edge computing capabilities
- Match bun-sqlite API for seamless switching

---

## 2. Functional Requirements

### 2.1 Task Management
- [x] **List Tasks**: `GET /tasks` with optional `status` filter
- [x] **Get Task**: `GET /tasks/:id`
- [x] **Create Task**: `POST /tasks` with title, optional project_id, description
- [x] **Update Task**: `PUT /tasks/:id` full update
- [x] **Delete Task**: `DELETE /tasks/:id`
- [x] **Task Status**: Support inbox, next, waiting, done

### 2.2 Project Management
- [x] **List Projects**: `GET /projects`
- [x] **Get Project**: `GET /projects/:id`
- [x] **Create Project**: `POST /projects` with name
- [x] **Update Project**: `PUT /projects/:id`
- [x] **Delete Project**: `DELETE /projects/:id`
- [x] **Project Tasks**: `GET /projects/:id/tasks` - all tasks in project

### 2.3 Data Validation
- [x] **UUID Generation**: Auto-generate UUIDs for new records
- [x] **Timestamps**: Auto-set created_at, updated_at (ISO 8601)
- [x] **Schema Validation**: Validate required fields
- [x] **Error Messages**: Return 400 with field-level errors

### 2.4 Health & Benchmarks
- [x] **Health Check**: `GET /health` returns 200
- [x] **Benchmark Endpoints**: CPU-bound, I/O-heavy, memory, cascading, malicious payloads

---

## 3. Technical Requirements

### 3.1 Stack
- **Runtime**: Cloudflare Workers
- **Framework**: Hono
- **Database**: D1 (SQLite)
- **Language**: TypeScript
- **Build**: Wrangler CLI

### 3.2 Environment Bindings
```typescript
type Env = {
  DB: D1Database;
};
```

### 3.3 Database Schema
```sql
-- Migration: 001_initial.sql
CREATE TABLE projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  status TEXT CHECK(status IN ('active', 'someday', 'archive')) DEFAULT 'active',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE tasks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  status TEXT CHECK(status IN ('inbox', 'next', 'waiting', 'done')) DEFAULT 'inbox',
  project_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL
);

CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_project ON tasks(project_id);
CREATE INDEX idx_projects_status ON projects(status);
```

### 3.4 Project Structure
```
backends/hono-d1/
├── src/
│   ├── index.ts          # Entry point, Hono app
│   └── schema.ts         # Database schema definitions
├── wrangler.toml         # Cloudflare config
├── .dev.vars             # Local development vars
└── package.json
```

### 3.5 Deployment
- **Local**: `wrangler dev` (uses .dev.vars)
- **Production**: `wrangler deploy`

---

## 4. API Implementation

### 4.1 Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | /health | Health check |
| GET | /tasks | List all tasks |
| GET | /tasks/:id | Get single task |
| POST | /tasks | Create task |
| PUT | /tasks/:id | Update task |
| DELETE | /tasks/:id | Delete task |
| GET | /projects | List all projects |
| GET | /projects/:id | Get single project |
| POST | /projects | Create project |
| PUT | /projects/:id | Update project |
| DELETE | /projects/:id | Delete project |
| GET | /projects/:id/tasks | Get tasks for project |

### 4.2 Benchmark Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | /benchmark/cpu-bound | CPU-intensive task |
| POST | /benchmark/io-heavy | I/O simulation |
| POST | /benchmark/memory | Memory allocation |
| POST | /benchmark/cascading | Multi-operation |
| POST | /benchmark/malicious | Large payload test |

### 4.3 Error Handling

**Validation Error (400):**
```json
{
  "error": "Validation Error",
  "details": [
    { "field": "title", "message": "Title is required" }
  ]
}
```

**Not Found (404):**
```json
{
  "error": "Not Found",
  "message": "Task with id 'uuid' not found"
}
```

---

## 5. Data Models

### 5.1 Task
```typescript
interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'inbox' | 'next' | 'waiting' | 'done';
  project_id: string | null;
  created_at: string;
  updated_at: string;
}
```

### 5.2 Project
```typescript
interface Project {
  id: string;
  name: string;
  status: 'active' | 'someday' | 'archive';
  created_at: string;
  updated_at: string;
}
```

---

## 6. CORS Configuration

```typescript
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type']
}));
```

---

## 7. Development

### 7.1 Local Development
```bash
cd backends/hono-d1
npm install
wrangler dev  # Uses .dev.vars for local D1
```

### 7.2 Deployment
```bash
wrangler deploy
```

### 7.3 D1 Commands
```bash
wrangler d1 execute gtd-db --local --file=./schema.sql
wrangler d1 execute gtd-db --remote --file=./schema.sql
```

---

## 8. Differences from Bun + SQLite

| Aspect | Bun + SQLite | Hono + D1 |
|--------|--------------|-----------|
| Runtime | Bun (Node-like) | Cloudflare Workers |
| Database | Local SQLite file | D1 (distributed SQLite) |
| Deployment | Local/Docker | Cloudflare Edge |
| Cold Start | ~100ms | ~5ms |
| Scaling | Manual | Automatic |

---

## 9. Success Criteria

- [x] All API endpoints implemented per OpenAPI spec
- [x] CORS configured for frontend access
- [x] Health check endpoint functional
- [x] Benchmark endpoints implemented
- [x] Deployed to Cloudflare Workers
- [x] D1 database bound and operational

---

## 10. Related Documents

- [`specs/openapi.yaml`](specs/openapi.yaml) - API Contract
- [`specs/PRD-Frontend.md`](specs/PRD-Frontend.md) - Frontend PRD
- [`specs/PRD-Gateway.md`](specs/PRD-Gateway.md) - Gateway PRD
- [`specs/PRD-Backend-BunSQLite.md`](specs/PRD-Backend-BunSQLite.md) - Bun + SQLite Backend
- [`ONECODER.md`](ONECODER.md) - CLI Command Reference
