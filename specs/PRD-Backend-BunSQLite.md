# PRD: Bun + SQLite Backend

**Spec ID:** SPEC-BACKEND-001  
**Status:** Draft  
**Last Updated:** 2026-02-07  
**Owner:** Backend Shootout Team

---

## 1. Overview

### 1.1 Purpose
The primary backend implementation using Bun runtime and SQLite database. Serves as the reference implementation for the GTD API contract.

### 1.2 Why Bun + SQLite?
- **Bun**: Fast JavaScript runtime with built-in TypeScript support
- **SQLite**: Zero-config, file-based database perfect for development and small deployments
- **DX**: Single language (TypeScript) across frontend and backend
- **Performance**: Bun's speed + SQLite's simplicity = fast iteration

### 1.3 Key Goals
- Implement complete OpenAPI spec
- Serve as reference for other backend implementations
- Demonstrate modern TypeScript backend patterns
- Achieve excellent performance metrics

---

## 2. Functional Requirements

### 2.1 Task Management
- [ ] **List Tasks**: `GET /tasks` with optional `status` filter
- [ ] **Get Task**: `GET /tasks/:id`
- [ ] **Create Task**: `POST /tasks` with title, optional project_id
- [ ] **Update Task**: `PUT /tasks/:id` full update
- [ ] **Patch Task**: `PATCH /tasks/:id` partial update
- [ ] **Delete Task**: `DELETE /tasks/:id`
- [ ] **Task Status**: Support inbox, next, waiting, done

### 2.2 Project Management
- [ ] **List Projects**: `GET /projects`
- [ ] **Get Project**: `GET /projects/:id`
- [ ] **Create Project**: `POST /projects` with name
- [ ] **Update Project**: `PUT /projects/:id`
- [ ] **Delete Project**: `DELETE /projects/:id` (cascade delete tasks or restrict)
- [ ] **Project Tasks**: `GET /projects/:id/tasks` - all tasks in project

### 2.3 Data Validation
- [ ] **UUID Generation**: Auto-generate UUIDs for new records
- [ ] **Timestamps**: Auto-set created_at, updated_at
- [ ] **Schema Validation**: Validate request body against schema
- [ ] **Error Messages**: Return 400 with field-level errors

### 2.4 Health & Metrics
- [ ] **Health Check**: `GET /health` returns 200
- [ ] **Metrics**: `GET /metrics` (optional) - request counts, latency

---

## 3. Technical Requirements

### 3.1 Stack
- **Runtime**: Bun 1.1+
- **Database**: SQLite (bun:sqlite)
- **HTTP Server**: Bun.serve()
- **Validation**: Zod
- **Migrations**: Custom SQL migration system

### 3.2 Database Schema

```sql
-- Migration: 001_initial.sql
CREATE TABLE projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  status TEXT CHECK(status IN ('active', 'someday', 'archive')) DEFAULT 'active',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE tasks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  status TEXT CHECK(status IN ('inbox', 'next', 'waiting', 'done')) DEFAULT 'inbox',
  project_id TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL
);

CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_project ON tasks(project_id);
CREATE INDEX idx_projects_status ON projects(status);
```

### 3.3 Project Structure
```
backends/bun-sqlite/
├── src/
│   ├── index.ts          # Entry point, Bun.serve
│   ├── database.ts       # SQLite connection, migrations
│   ├── routes/
│   │   ├── tasks.ts      # Task CRUD handlers
│   │   ├── projects.ts   # Project CRUD handlers
│   │   └── health.ts     # Health check
│   ├── models/
│   │   ├── task.ts       # Task types, validation
│   │   └── project.ts    # Project types, validation
│   └── utils/
│       ├── uuid.ts       # UUID generation
│       └── errors.ts     # Error handling
├── migrations/
│   └── 001_initial.sql
├── tests/
│   └── api.test.ts
├── package.json
└── README.md
```

### 3.4 Performance Targets
- [ ] **Cold Start**: < 100ms
- [ ] **API Response**: < 50ms (p95)
- [ ] **Database**: < 10ms query time
- [ ] **Throughput**: 1000+ req/sec

---

## 4. API Implementation

### 4.1 Request/Response Format

**Create Task:**
```bash
POST /tasks
Content-Type: application/json

{
  "title": "Buy groceries",
  "project_id": "uuid-here"
}

# Response 201
{
  "id": "new-uuid",
  "title": "Buy groceries",
  "status": "inbox",
  "project_id": "uuid-here",
  "created_at": "2026-02-07T10:00:00Z"
}
```

**List Tasks:**
```bash
GET /tasks?status=inbox

# Response 200
[
  {
    "id": "uuid",
    "title": "Task 1",
    "status": "inbox",
    "project_id": null,
    "created_at": "2026-02-07T10:00:00Z"
  }
]
```

### 4.2 Error Handling

**Validation Error (400):**
```json
{
  "error": "Validation Error",
  "details": [
    {
      "field": "title",
      "message": "Title is required"
    }
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
  status: 'inbox' | 'next' | 'waiting' | 'done';
  project_id: string | null;
  created_at: string;
  updated_at: string;
}

interface CreateTaskInput {
  title: string;
  project_id?: string;
}

interface UpdateTaskInput {
  title?: string;
  status?: 'inbox' | 'next' | 'waiting' | 'done';
  project_id?: string | null;
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

interface CreateProjectInput {
  name: string;
}

interface UpdateProjectInput {
  name?: string;
  status?: 'active' | 'someday' | 'archive';
}
```

---

## 6. Testing

### 6.1 Unit Tests
- [ ] Database queries
- [ ] Input validation (Zod schemas)
- [ ] UUID generation
- [ ] Error handling

### 6.2 Integration Tests
- [ ] Full API test suite against running server
- [ ] CRUD operations for tasks and projects
- [ ] Filter and query parameters
- [ ] Error scenarios

### 6.3 Performance Tests
- [ ] Load test with 1000 concurrent requests
- [ ] Database query performance
- [ ] Memory usage under load

---

## 7. Development Workflow

### 7.1 Setup
```bash
cd backends/bun-sqlite
bun install
bun run migrate
bun run dev  # Hot reload on port 3001
```

### 7.2 Testing
```bash
bun test           # Run all tests
bun test:watch     # Watch mode
bun test:coverage  # Coverage report
```

### 7.3 Database
```bash
bun run migrate     # Run pending migrations
bun run migrate:rollback  # Rollback last migration
bun run db:reset    # Reset database (dev only)
```

---

## 8. Success Criteria

- [ ] All API endpoints implemented per OpenAPI spec
- [ ] 100% test coverage for critical paths
- [ ] < 50ms p95 response time
- [ ] Handles 1000 concurrent requests
- [ ] Clean, idiomatic TypeScript code
- [ ] Comprehensive README with setup instructions

---

## 9. Future Enhancements

- [ ] WebSocket support for real-time updates
- [ ] Full-text search on task titles
- [ ] Task tagging/contexts
- [ ] Due dates and reminders
- [ ] Data export (JSON/CSV)

---

## 10. Related Documents

- `specs/openapi.yaml` - API Contract
- `specs/PRD-Frontend.md` - Frontend PRD
- `specs/PRD-Gateway.md` - Gateway PRD
- `AGENTS.md` - Development guidelines
