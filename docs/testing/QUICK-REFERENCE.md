# Testing Quick Reference

**TL;DR for Backend Developers**

---

## Test Types at a Glance

| Type | Location | Tools | Speed | When |
|------|----------|-------|-------|------|
| **Contract** | `tests/contract/` | Hurl/Playwright | 20s | All backends, validate spec |
| **Unit** | `backends/{lang}/tests/unit/` | Language-native | 2-5s | During development |
| **Integration** | `backends/{lang}/tests/integration/` | HTTP client | 10-15s | Before push |
| **Performance** | `tests/performance/` | k6 | 60s+ | Main branch, compare |

---

## Adding a New Backend: 4-Step Checklist

### 1️⃣ Create Directory
```bash
mkdir -p backends/{language}/tests/{unit,integration}
```

### 2️⃣ Write Unit Tests
Use your language's native test framework:

**Bun/TypeScript:**
```typescript
import { describe, test, expect } from 'bun:test';

test('createTask returns task with id', async () => {
  const task = await createTask({ title: 'Test' });
  expect(task.id).toBeDefined();
});
```

**Elixir:**
```elixir
test "create_task returns task with id" do
  {:ok, task} = Database.create_task(%{"title" => "Test"})
  assert task.id != nil
end
```

**Ruby:**
```ruby
it 'returns task with id' do
  task = Database.create_task(title: 'Test')
  expect(task.id).to be_present
end
```

### 3️⃣ Write Integration Tests
Same pattern for all languages:
```typescript
test('POST /tasks returns 201', async () => {
  const res = await fetch('http://localhost:PORT/tasks', {
    method: 'POST',
    body: JSON.stringify({ title: 'Test' })
  });
  expect(res.status).toBe(201);
});
```

### 4️⃣ Verify Contract Tests Pass
```bash
BACKEND_URL=http://localhost:PORT npx playwright test tests/contract/
```

---

## Running Tests Locally

### All Tests
```bash
# Unit tests only
bun test

# Unit + Integration
bun test:integration

# With coverage
bun test --coverage

# Watch mode
bun test --watch
```

### Specific Tests
```bash
# Just database tests
bun test database.test.ts

# Just API tests
bun test integration/api.test.ts

# Pattern matching
bun test --grep "createTask"
```

---

## Performance Testing

### Quick Baseline
```bash
# Install k6
brew install k6  # macOS

# Run against your backend
BACKEND_PORT=3001 k6 run tests/performance/baseline.ts

# Expected output:
# http_reqs..................: 500 (avg 16.66/s)
# http_req_duration..........: avg=26ms p(95)=42ms p(99)=156ms
```

### Compare All Backends
```bash
#!/bin/bash
for backend in bun-sqlite elixir-phoenix ruby-rails; do
  docker-compose up -d $backend
  sleep 5
  BACKEND_PORT=3001 k6 run tests/performance/baseline.ts \
    > results/$backend.json
  docker-compose down
done
```

---

## Contract Test Matrix (What Gets Tested)

Every backend MUST pass these 25+ scenarios:

### Tasks (15 tests)
- [x] `GET /tasks` → 200, returns array
- [x] `GET /tasks?status=inbox` → filters correctly
- [x] `GET /tasks?status=invalid` → 400
- [x] `POST /tasks` → 201, has id/status/created_at
- [x] `POST /tasks` (no title) → 400 with error.details
- [x] `GET /tasks/:id` → 200
- [x] `GET /tasks/:id` (invalid) → 404
- [x] `PATCH /tasks/:id` → 200, updates field
- [x] `PATCH /tasks/:id` (invalid status) → 400
- [x] `DELETE /tasks/:id` → 204
- [x] `DELETE /tasks/:id` (invalid) → 404
- [x] Created tasks persist to database
- [x] Filters work: status, project_id
- [x] Pagination (if implemented): limit/offset
- [x] Timestamps: created_at, updated_at

### Projects (10 tests)
- [x] `GET /projects` → 200, returns array
- [x] `POST /projects` → 201, has id/name/status
- [x] `POST /projects` (no name) → 400
- [x] `GET /projects/:id` → 200
- [x] `PATCH /projects/:id` → 200
- [x] `DELETE /projects/:id` → 204 or 400 (if tasks exist)
- [x] `GET /projects/:id/tasks` → returns tasks in project
- [x] Created projects persist
- [x] Status validation: active, someday, archive
- [x] Cascade delete or restrict based on schema

### Health (2 tests)
- [x] `GET /health` → 200, {"status": "healthy"}
- [x] `GET /backends` → list backends with health

---

## Performance Targets

| Backend | Target p50 | Target p95 | Target Throughput |
|---------|-----------|-----------|-------------------|
| **Reference** (Bun) | < 15ms | < 35ms | > 800 req/s |
| **Other** | < 25ms | < 50ms | > 500 req/s |

*(These are baselines. Actual will vary by language/runtime)*

---

## Common Issues & Fixes

### "Contract tests fail"
```
✗ POST /tasks returns 201
Error: Expected 201, got 400

Fix:
1. Check request body format
2. Verify error response has 'details' field
3. Compare to OpenAPI spec: specs/openapi.yaml
4. Run integration test to debug
```

### "Unit tests pass but integration fails"
```
Issue: Your code works in unit test, fails in HTTP test

Likely causes:
- JSON serialization/deserialization
- UUID format (should be string, not binary)
- Timestamp format (ISO 8601)
- Error response structure

Fix: Check response JSON matches schema in OpenAPI spec
```

### "Performance test shows timeout"
```
✗ K6 error: context deadline exceeded

Likely causes:
- Backend not started
- Slow query (add index)
- Framework startup slow

Fix:
1. Verify backend is running: curl http://localhost:PORT/health
2. Check query performance
3. Profile with flamegraph
```

---

## File Templates

### Unit Test Template
```typescript
// backends/{lang}/tests/unit/feature.test.ts
import { describe, test, expect } from 'bun:test';
import * as db from '../../src/database';

describe('Feature Name', () => {
  test('happy path', async () => {
    const result = await db.operation({ input: 'test' });
    expect(result).toHaveProperty('id');
  });

  test('error case', async () => {
    const result = await db.operation({ input: '' });
    expect(result).toBeNull();
  });

  test('persists to database', async () => {
    // Create
    const created = await db.create({ data: 'test' });
    // Read back
    const fetched = await db.get(created.id);
    // Verify identical
    expect(fetched).toEqual(created);
  });
});
```

### Integration Test Template
```typescript
// backends/{lang}/tests/integration/api.test.ts
describe('POST /endpoint', () => {
  test('returns 201 with correct schema', async () => {
    const response = await fetch('http://localhost:PORT/endpoint', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ field: 'value' })
    });

    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body).toHaveProperty('id');
    expect(body).toHaveProperty('created_at');
  });

  test('returns 400 for invalid input', async () => {
    const response = await fetch('http://localhost:PORT/endpoint', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}) // Missing required field
    });

    expect(response.status).toBe(400);
    const error = await response.json();
    expect(error).toHaveProperty('details');
  });
});
```

---

## Coverage Command Reference

```bash
# Generate coverage report
bun test --coverage

# Expected output:
# ✓ database.test.ts
#   Lines: 42/50 (84%)
#   Statements: 42/50 (84%)
#   Functions: 10/12 (83%)

# View in browser
open coverage/index.html
```

---

## Performance Tuning Checklist

If your backend is slow:

- [ ] **Database queries**
  - Add indexes on frequently filtered columns (status, project_id)
  - Check query plans: `EXPLAIN QUERY PLAN SELECT ...`
  - Use `PRAGMA optimize` after data loads

- [ ] **Framework overhead**
  - Profile with language tools (pprof, flamegraph)
  - Check for N+1 queries
  - Minimize allocations in hot path

- [ ] **Concurrency**
  - Use connection pooling
  - Tune thread/process count
  - Check lock contention

- [ ] **Memory**
  - Profile with memory profiler
  - Check for leaks (sustained growth)
  - Tune GC settings

---

## CI Integration

### GitHub Actions
```yaml
# Run tests on every push
- name: Run tests
  run: |
    bun test:unit
    bun test:integration

- name: Contract tests
  run: BACKEND_URL=... npx playwright test tests/contract/
```

### Local Pre-commit
```bash
#!/bin/bash
# .git/hooks/pre-commit

bun test:unit || exit 1
bun test:integration || exit 1
```

---

## Resources

- **OpenAPI Spec:** `specs/openapi.yaml`
- **Test Strategy:** `docs/testing/TEST-STRATEGY.md`
- **Implementation:** `docs/testing/IMPLEMENTATION-GUIDE.md`
- **Architecture:** `docs/architecture/decisions/ADR-001-Hybrid-Architecture.md`

---

## TL;DR the TL;DR

```bash
# 1. Write unit tests (language native)
bun test

# 2. Write integration tests (HTTP calls)
# backends/{lang}/tests/integration/api.test.ts

# 3. Verify contract tests pass
BACKEND_URL=http://localhost:PORT npx playwright test tests/contract/

# Done! ✓
```

