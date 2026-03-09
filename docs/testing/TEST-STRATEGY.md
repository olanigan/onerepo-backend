# Testing Strategy: Backend Shootout

**Status:** Proposed
**Date:** 2026-02-22
**Context:** Shared SQLite across all backends requires rigorous contract testing + performance isolation

---

## 1. First-Principles Test Design

### 1.1 Core Question: What Are We Testing?

In a backend shootout with **identical data layer**, we're NOT testing:
- ❌ SQLite correctness (it's proven)
- ❌ SQL differences (all backends use same queries)
- ❌ Data integrity (unified schema)

We ARE testing:
- ✅ **Framework overhead** (how much code/runtime add latency?)
- ✅ **Language concurrency model** (async/await vs actors vs goroutines)
- ✅ **Memory footprint** (heap usage, GC pressure)
- ✅ **API contract compliance** (is the framework correctly implementing the spec?)
- ✅ **Developer experience** (code clarity, build speed, test ergonomics)

### 1.2 Test Pyramid Strategy

```
                    ▲
                   / \
                  /   \  E2E Tests (5%)
                 /     \  - Full workflow scenarios
                /-------\
               /         \  Integration Tests (25%)
              /           \ - API contract validation
             /             \ - Database consistency
            /---------------\
           /                 \  Unit Tests (70%)
          /                   \ - Business logic
         /                     \ - Input validation
        /_____________________\
```

**Rationale:**
- **Wide base** of unit tests = Fast feedback (seconds)
- **Middle layer** ensures contract compliance = Confidence
- **Thin peak** of E2E = Real-world workflows

---

## 2. Recommended Test Matrix

### 2.1 Contract Tests (Framework-Independent, Shared Across All Backends)

**Location:** `tests/contract/`
**Tools:** Playwright + REST client (or Hurl)
**Scope:** Validates every backend against OpenAPI spec

```typescript
// tests/contract/tasks.spec.ts
describe('GET /tasks', () => {
  it('returns 200 with correct schema', async () => {
    const res = await client.get('/tasks');
    expect(res.status).toBe(200);
    expect(res.body).toMatchSchema(Task); // JSON Schema validation
  });

  it('filters by status query param', async () => {
    const res = await client.get('/tasks?status=inbox');
    expect(res.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ status: 'inbox' })
      ])
    );
  });

  it('returns 400 for invalid status', async () => {
    const res = await client.get('/tasks?status=invalid');
    expect(res.status).toBe(400);
  });
});
```

**Why this first:**
- All backends must pass these = confidence in correctness
- Tests run against any backend (swap port/backend header)
- Catches framework-specific bugs early

**Execution:** Run against each backend in CI
```bash
# For each backend
BACKEND_URL=http://localhost:3001 npm run test:contract
```

---

### 2.2 Backend-Specific Unit Tests

**Location:** `backends/{language}/tests/`
**Tools:** Language-native (Bun.test, Go testing, RSpec, etc.)
**Scope:** Framework-specific logic, validation, edge cases

#### Example: Bun + SQLite
```typescript
// backends/bun-sqlite/tests/database.test.ts
describe('Database Layer', () => {
  test('createTask generates valid UUID', () => {
    const task = createTask({ title: 'Test' });
    expect(task.id).toMatch(/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i);
  });

  test('createTask sets timestamps', () => {
    const task = createTask({ title: 'Test' });
    expect(task.created_at).toBeInstanceOf(Date);
    expect(task.updated_at).toBeInstanceOf(Date);
  });

  test('getTasksByStatus returns only matching tasks', async () => {
    await insertTask({ status: 'inbox' });
    await insertTask({ status: 'done' });

    const tasks = await getTasksByStatus('inbox');
    expect(tasks).toHaveLength(1);
    expect(tasks[0].status).toBe('inbox');
  });

  test('deleteTask cascades or restricts based on schema', async () => {
    const project = await insertProject({ name: 'Test' });
    const task = await insertTask({ project_id: project.id });

    await deleteProject(project.id);

    const deletedTask = await getTask(task.id);
    expect(deletedTask.project_id).toBeNull(); // ON DELETE SET NULL
  });
});
```

**Target Coverage:**
- **Critical path:** 100% (CRUD operations)
- **Validation:** 95%+ (edge cases)
- **Error handling:** 90%+ (what breaks?)

---

### 2.3 Integration Tests (Per Backend)

**Location:** `backends/{language}/tests/integration/`
**Tools:** HTTP client + assertions
**Scope:** Full request → response cycle

```typescript
// backends/bun-sqlite/tests/integration/tasks.test.ts
describe('POST /tasks', () => {
  test('creates task and returns 201', async () => {
    const res = await fetch('http://localhost:3001/tasks', {
      method: 'POST',
      body: JSON.stringify({ title: 'Buy milk' })
    });

    expect(res.status).toBe(201);
    const task = await res.json();
    expect(task).toHaveProperty('id');
    expect(task.status).toBe('inbox');
    expect(task.created_at).toBeTruthy();
  });

  test('rejects missing title with 400 and clear error', async () => {
    const res = await fetch('http://localhost:3001/tasks', {
      method: 'POST',
      body: JSON.stringify({})
    });

    expect(res.status).toBe(400);
    const error = await res.json();
    expect(error.details).toContainEqual({
      field: 'title',
      message: expect.any(String)
    });
  });

  test('persists to database', async () => {
    // Create via API
    const createRes = await fetch('http://localhost:3001/tasks', {
      method: 'POST',
      body: JSON.stringify({ title: 'Verify persistence' })
    });
    const created = await createRes.json();

    // Fetch via API
    const getRes = await fetch(`http://localhost:3001/tasks/${created.id}`);
    const fetched = await getRes.json();

    expect(fetched).toEqual(created);
  });
});
```

---

### 2.4 Performance Tests (Critical for Shootout)

**Location:** `tests/performance/`
**Tools:** k6, Artillery, or Locust
**Scope:** Measure what matters for comparison

#### 2.4.1 Baseline Performance Test
```typescript
// tests/performance/baseline.ts
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 10,           // 10 virtual users
  duration: '30s',   // 30 second ramp
  thresholds: {
    http_req_duration: ['p(95)<500'],   // 95th percentile < 500ms
    http_req_failed: ['rate<0.1'],      // Less than 10% error rate
  },
};

export default function() {
  // 1. GET /tasks (read-heavy)
  const listRes = http.get(`${__ENV.BACKEND_URL}/tasks`);
  check(listRes, { 'list status is 200': (r) => r.status === 200 });

  // 2. POST /tasks (write)
  const createRes = http.post(`${__ENV.BACKEND_URL}/tasks`,
    JSON.stringify({ title: `Task ${Date.now()}` }),
    { headers: { 'Content-Type': 'application/json' } }
  );
  check(createRes, { 'create status is 201': (r) => r.status === 201 });

  // 3. GET /tasks/:id (specific read)
  if (createRes.status === 201) {
    const created = JSON.parse(createRes.body);
    const getRes = http.get(`${__ENV.BACKEND_URL}/tasks/${created.id}`);
    check(getRes, { 'get status is 200': (r) => r.status === 200 });
  }

  sleep(1); // Think time
}
```

**Run Matrix:**
```bash
# Compare all backends at same load
for backend in bun-sqlite elixir-phoenix ruby-rails php-laravel dotnet-api java-spring-boot; do
  echo "Testing $backend..."
  BACKEND_URL=http://localhost:3001 k6 run tests/performance/baseline.ts \
    --tag backend=$backend > results/$backend.json
done
```

**Metrics to Track:**
| Metric | Why It Matters |
|--------|----------------|
| **p50 latency** | Typical user experience |
| **p95 latency** | Tail latency = frustration |
| **p99 latency** | Worst-case performance |
| **Throughput (req/s)** | Raw speed at saturation |
| **Error rate** | Stability under load |
| **Memory usage** | Cost to run (cloud billing) |
| **GC pauses** | Jitter/predictability |

---

#### 2.4.2 Real-World Workflow Test
```typescript
// tests/performance/gtd-workflow.ts
// Simulates actual GTD patterns:
// 1. List inbox (filter: status=inbox)
// 2. Create project
// 3. Create 5 tasks in that project
// 4. Update tasks to "done"
// 5. List projects

export default function() {
  // Inbox processing
  http.get(`${__ENV.BACKEND_URL}/tasks?status=inbox`);

  // Create project
  const projectRes = http.post(`${__ENV.BACKEND_URL}/projects`,
    JSON.stringify({ name: `Project ${Date.now()}` }),
    { headers: { 'Content-Type': 'application/json' } }
  );
  const projectId = JSON.parse(projectRes.body).id;

  // Create tasks
  for (let i = 0; i < 5; i++) {
    http.post(`${__ENV.BACKEND_URL}/tasks`,
      JSON.stringify({
        title: `Task ${i}`,
        project_id: projectId
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Mark complete
  http.get(`${__ENV.BACKEND_URL}/projects/${projectId}/tasks`);
}
```

---

#### 2.4.3 Stress Test (Find Breaking Point)
```typescript
// tests/performance/stress.ts
export const options = {
  stages: [
    { duration: '30s', target: 50 },   // Ramp to 50 users
    { duration: '1m30s', target: 100 }, // Ramp to 100 users
    { duration: '20s', target: 0 },     // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(99)<2000'], // Allow slower under stress
    http_req_failed: ['rate<0.2'],     // Allow more errors
  },
};
```

---

### 2.5 Data Consistency Tests (Shared Database Focus)

**Location:** `tests/consistency/`
**Important:** Since all backends share SQLite, test cross-backend consistency

```typescript
// tests/consistency/simultaneous-writes.ts
describe('Concurrent Writes from Different Backends', () => {
  test('both backends see the same data', async () => {
    // Write from backend 1 (Bun)
    const task1Res = await fetch('http://localhost:3001/tasks', {
      method: 'POST',
      headers: { 'x-backend': 'bun-sqlite' },
      body: JSON.stringify({ title: 'From Bun' })
    });
    const task1 = await task1Res.json();

    // Read from backend 2 (Elixir)
    const listRes = await fetch('http://localhost:8787/tasks', {
      headers: { 'x-backend': 'elixir-phoenix' }
    });
    const tasks = await listRes.json();

    // Bun's write must be visible to Elixir
    expect(tasks).toContainEqual(expect.objectContaining({ id: task1.id }));
  });

  test('concurrent updates dont corrupt data', async () => {
    const taskId = 'known-task-id';

    // Parallel updates from both backends
    await Promise.all([
      fetch(`http://localhost:3001/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'x-backend': 'bun-sqlite' },
        body: JSON.stringify({ status: 'done' })
      }),
      fetch(`http://localhost:8787/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'x-backend': 'elixir-phoenix' },
        body: JSON.stringify({ status: 'next' })
      })
    ]);

    // Final read should reflect one of them (last-write-wins)
    const final = await (await fetch(`http://localhost:3001/tasks/${taskId}`)).json();
    expect(final.status).toMatch(/done|next/);
  });
});
```

---

## 3. Test Execution Plan

### 3.1 Local Development (Fast Feedback)

```bash
# 1. Unit tests (instant)
bun test                    # ~2-5s
cd backends/bun-sqlite && bun test  # ~2s

# 2. Integration tests (after server starts)
docker-compose up -d
bun test:integration       # ~10s

# 3. Contract tests (validate spec)
BACKEND_URL=http://localhost:3001 bun test:contract  # ~15s

# Total: ~30-40s feedback loop
```

### 3.2 CI Pipeline (Comprehensive)

```yaml
# .github/workflows/test.yml
name: Test All Backends

on: [push, pull_request]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v1
      - run: bun test:unit
      - run: bun test:unit --coverage
      - uses: codecov/codecov-action@v3

  contract-tests:
    runs-on: ubuntu-latest
    services:
      bun-sqlite:
        image: bun-sqlite:latest
        ports:
          - 3001:3001
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v1
      - run: BACKEND_URL=http://localhost:3001 bun test:contract
      - run: BACKEND_URL=http://localhost:3001 bun test:integration

  performance:
    runs-on: ubuntu-latest
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-go@v4
      - run: go install github.com/grafana/k6@latest
      - run: |
          docker-compose up -d
          sleep 10
          k6 run tests/performance/baseline.ts \
            --tag backend=bun-sqlite > baseline.json
      - uses: actions/upload-artifact@v3
        with:
          name: performance-results
          path: baseline.json
```

---

## 4. Coverage Targets

| Category | Target | Why |
|----------|--------|-----|
| **Critical CRUD paths** | 100% | Must work correctly |
| **Validation logic** | 95%+ | Catch edge cases |
| **Error handlers** | 90%+ | User-facing errors |
| **Concurrent operations** | 85%+ | Race conditions |
| **Overall** | 80%+ | Don't test infrastructure |

**Note:** Don't test:
- SQLite (it's proven)
- Framework internals (Bun.serve routing, etc.)
- HTTP libraries (they're tested by frameworks)

---

## 5. Performance Testing Deep Dive

### 5.1 What Makes a Good Shootout Test?

From first principles:
1. **Realistic traffic pattern** (GTD workflow, not random)
2. **Fair comparison** (same database, same ORM patterns, same validation)
3. **Isolates framework overhead** (framework code only, not DB bottleneck)
4. **Measures developer experience** (build time, test speed, code clarity)

### 5.2 Dashboard/Reporting

Create a comparison report:

```markdown
# Backend Shootout Results

## Bun + SQLite
- **p50 latency:** 12ms
- **p95 latency:** 28ms
- **Throughput:** 850 req/s
- **Memory (idle):** 45MB
- **Memory (100 concurrent):** 78MB
- **Build time:** 2.1s
- **Test suite time:** 3.2s

## Elixir Phoenix
- **p50 latency:** 18ms
- **p95 latency:** 35ms
- **Throughput:** 720 req/s
- **Memory (idle):** 120MB
- **Memory (100 concurrent):** 156MB
- **Build time:** 8.4s
- **Test suite time:** 5.1s

... [other backends]
```

---

## 6. Test Implementation Roadmap

### Phase 1: Foundation (MVP)
- [ ] Create test infrastructure (docker-compose with backends)
- [ ] Write contract tests (validates all backends)
- [ ] Write baseline performance test (k6)
- [ ] Set up CI pipeline

### Phase 2: Coverage
- [ ] Add unit tests per backend
- [ ] Add integration tests (API roundtrips)
- [ ] Add consistency tests (cross-backend)

### Phase 3: Analysis
- [ ] Collect results from all backends
- [ ] Generate comparison report
- [ ] Profile hot paths (flamegraphs)

---

## 7. Proposed Test Tools by Category

| Category | Tool | Why |
|----------|------|-----|
| **Unit Tests** | Language-native (Bun.test, Go testing) | Fast, no overhead |
| **Integration** | REST client (node:http, curl) | HTTP-level testing |
| **Contract** | Hurl or Playwright | Can run in CI easily |
| **Performance** | k6 or Apache JMeter | Built for load testing |
| **Consistency** | Custom test harness | Needs to hit multiple backends |

---

## 8. Key Decision: Shared vs Isolated Tests

### Shared Tests (Preferred)
- ✅ `tests/contract/` - All backends must pass
- ✅ `tests/consistency/` - Cross-backend validation
- ✅ `tests/performance/` - Compare frameworks fairly

### Backend-Specific Tests
- ✅ `backends/{lang}/tests/unit/` - Language idioms
- ✅ `backends/{lang}/tests/integration/` - Framework-specific patterns
- ✅ `backends/{lang}/tests/e2e/` - Business logic

**Benefits:**
- Don't duplicate contract tests (maintain once)
- Can fairly compare performance
- Each backend optimizes for its language

---

## 9. Success Criteria

✅ **All backends pass contract tests** (correctness)
✅ **Performance baseline measured** (framework overhead isolated)
✅ **80%+ code coverage** on critical paths
✅ **<30s unit test feedback** in development
✅ **Ability to swap backends** without changing tests
✅ **Clear performance report** showing tradeoffs

---

## 10. Open Questions

1. **Database migrations per backend?** (If shared SQLite, who runs migrations?)
   - Recommend: Single migration runner before any backend starts

2. **Shared test data or isolated?**
   - Recommend: Isolated (reset DB between test runs to prevent cross-contamination)

3. **Performance baseline thresholds?**
   - Recommend: Set based on Bun (fastest), allow ±20% variance for other frameworks

4. **How to handle framework-specific optimizations?**
   - Recommend: Allow (that's the point of shootout), but document assumptions

