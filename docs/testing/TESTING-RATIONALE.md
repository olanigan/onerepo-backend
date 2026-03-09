# Testing Rationale: Why This Approach?

**Date:** 2026-02-22
**Context:** First-principles analysis of backend shootout testing needs

---

## 1. The Core Challenge

You're comparing **multiple backend frameworks** with **identical data layer** (shared SQLite). This means:

**NOT a useful variable:**
- Database query performance (all use same SQL)
- Data structure design (all use same schema)
- ORM efficiency (all use same driver)

**VERY useful variables:**
- Framework HTTP server overhead
- Language runtime characteristics (memory, GC, concurrency)
- Developer velocity (code clarity, build speed, test ergonomics)
- Operational costs (memory footprint, cold start, resource usage)

**Standard testing approaches fail here:**
- ❌ **Database-centric tests** (miss framework differences)
- ❌ **End-to-end scenarios** (too slow for meaningful comparison)
- ❌ **Framework-specific tests** (can't compare apples-to-apples)

---

## 2. Our Solution: Layered Contract Testing

### Layer 1: Contract Tests (Shared)
```
┌─────────────────────────────────────────┐
│        Contract Tests (Hurl/Playwright) │
│  "Do all backends implement the spec?"  │
│      (Same tests, all backends pass)    │
└─────────────────────────────────────────┘
                    ▲
        ┌───────────┼───────────┐
        ▼           ▼           ▼
    Bun        Elixir       Ruby
   SQLite     Phoenix      Rails
```

**Why this matters:**
- Validates correctness across ALL frameworks
- Catches framework-specific bugs early
- Proves comparison is fair (same API contract)
- Makes performance differences meaningful

### Layer 2: Backend-Specific Unit Tests
```
Bun + SQLite        Elixir Phoenix       Ruby Rails
├── database.test    ├── database_test   ├── database_spec
├── validation.test  ├── validation_test ├── validation_spec
└── models.test      └── models_test     └── models_spec
```

**Why this matters:**
- Test business logic in idiomatic language style
- Catch edge cases early (before integration)
- Keep tests maintainable (language familiarity)
- **Don't duplicate** (no need for Bun to test Rails idioms)

### Layer 3: Performance Tests (Shared)
```
Load Test Suite (k6)
        │
        ├─ Baseline: realistic GTD workflow
        ├─ Stress: find breaking point
        └─ Throughput: max requests/second

Results:
┌──────────────┬──────────┬──────────┬──────────┐
│ Backend      │ p50      │ p95      │ Throughput
├──────────────┼──────────┼──────────┼──────────┤
│ bun-sqlite   │ 12ms     │ 28ms     │ 850 req/s
│ elixir       │ 18ms     │ 35ms     │ 720 req/s
│ ruby         │ 22ms     │ 42ms     │ 680 req/s
└──────────────┴──────────┴──────────┴──────────┘
```

**Why this matters:**
- Fair comparison (same load pattern)
- Isolates framework overhead (not DB bottleneck)
- Reveals real-world behavior
- Answers "which should I use for my workload?"

---

## 3. Why Shared Contract Tests?

### Problem: Test Duplication
Without shared contract tests:
```
backends/bun-sqlite/tests/api.test.ts      (50 lines)
backends/elixir-phoenix/tests/api_test.exs (50 lines)
backends/ruby-rails/spec/api_spec.rb       (50 lines)
backends/php-laravel/tests/ApiTest.php     (50 lines)
backends/java-spring/src/test/api/ApiTest  (50 lines)

Total: 250 lines, same tests, 5 copies ❌
```

### Solution: Contract-Driven Tests
```
tests/contract/api.hurl                    (30 lines, canonical)
    ↓
Run against each backend (automated loop)
    ↓
5 backends, 1 test suite ✓
```

**Benefits:**
1. **Maintainability**: Update once, all backends stay in sync
2. **Fairness**: Identical test conditions (no subtle differences)
3. **Clarity**: Contract is the source of truth
4. **Scalability**: 10 backends, still 30 lines of tests

---

## 4. Real-World Example: Bug Discovery

Let's say Elixir implementation has a bug:

### With Shared Contract Tests (Our Approach)
```
$ BACKEND_URL=http://localhost:4000 npx playwright test

✗ POST /tasks returns 201
  Error: Expected 201, got 500
  Message: "Unknown field 'project_id'"

Diagnosis: Elixir handler doesn't accept project_id in payload
Fix: 1 line in elixir-phoenix/src/handlers/tasks.ex
Verification: Re-run contract tests → ✓ pass
```

**Total time: 5 minutes**

### Without Shared Tests (Old Approach)
```
Backend dev writes custom test:
✗ POST /tasks returns 201
  Expected {"id": "...", "status": "inbox"}
  Got {"error": "Unknown field"}

Questions:
- Is this a bug or spec issue?
- Do other backends handle it?
- Should I update the spec?
- Do I need to update 4 other tests?
```

**Total time: 30+ minutes** (because of uncertainty)

---

## 5. Performance Testing: Framework Overhead vs DB Bottleneck

### Key Insight: Separate Variables

**Hypothesis A:** "Bun is faster because it's compiled"
**Hypothesis B:** "Bun is faster because SQLite queries are faster"

Our test design **isolates** these:

```
Bun + SQLite
├─ Database query: 8ms (same for all backends)
├─ Framework overhead: 2ms (Bun is lean)
├─ Network/other: 2ms
└─ Total: 12ms

Elixir + SQLite
├─ Database query: 8ms (identical DB)
├─ Framework overhead: 8ms (Erlang runtime)
├─ Network/other: 2ms
└─ Total: 18ms

Ruby + SQLite
├─ Database query: 8ms (identical DB)
├─ Framework overhead: 12ms (Ruby GC pressure)
├─ Network/other: 2ms
└─ Total: 22ms
```

**Conclusion:** Difference is framework, not database ✓

If every backend used different database, we couldn't tell what's causing differences.

---

## 6. Test Pyramid Rationale

```
                    ▲
                   / \ 5% E2E
                  /   \  Tests (slow, realistic)
                 /     \
                /-------\
               /         \ 25% Integration
              /           \ Tests (medium speed)
             /             \
            /---------------\
           /                 \ 70% Unit
          /                   \ Tests (fast)
         /_____________________\
```

### Why NOT 50/50 or top-heavy?

**Option: Heavy on E2E**
```
Slow feedback (5+ minutes per test)
❌ Developers skip running locally
❌ Find bugs only in CI
❌ Expensive to maintain
```

**Option: Heavy on Unit**
```
Fast feedback (< 30 seconds)
✓ Developers run before commit
✓ Find bugs locally
✓ Easy to maintain
✓ BUT: misses integration issues
```

**Our Balance:**
- **70% unit:** Catch edge cases fast (database layer bugs, validation bugs)
- **25% integration:** Verify HTTP roundtrips (serialization, routing)
- **5% E2E:** Test realistic workflows (full GTD scenario)

---

## 7. Coverage vs Maintainability Tradeoff

### The Problem: 100% Coverage is Overkill

```typescript
// What NOT to test:
http.listen(PORT, () => {}) // Framework handles this
database.raw(`SELECT * FROM tasks`) // SQL is proven
console.log('Server started') // Logging works
```

### What TO test:
```typescript
// Business logic
createTask({ title: 'Test' })
  // Must: generate UUID
  // Must: set status = 'inbox'
  // Must: validate title not empty
  // Must: persist to DB

// API contract
POST /tasks
  // Must: return 201
  // Must: return task with all fields
  // Must: return 400 for invalid input
```

**Target: 80% coverage**
- 100% on critical paths (CRUD)
- 90% on validation
- 50% on error edge cases
- 0% on framework internals

---

## 8. Performance Test Design: Why k6?

### Candidates Evaluated

| Tool | Pro | Con |
|------|-----|-----|
| **Apache JMeter** | GUI, widely known | Slow startup, XML config |
| **Apache Bench** | Simple | Single-threaded, limited metrics |
| **Gatling** | Good DSL | Requires Scala knowledge |
| **k6** | ✓ JS DSL | Requires Node... but we have it |
| **Locust** | ✓ Python | Requires Python in CI |

**Winner: k6** because:
- JavaScript (we use it in gateways/frontend)
- Cloud-native (built for CI/CD)
- Realistic concurrency model (goroutines, not threads)
- Great visualization (web dashboard)
- Easy to script load patterns

### Why NOT ab (Apache Bench)?
```
ab -c 10 -n 1000 http://localhost:3001/tasks

Problems:
- Single-threaded
- No percentile metrics
- Can't script complex workflows
- Doesn't measure garbage collection impact
```

### Our k6 Advantage:
```typescript
// Can simulate realistic workflow
export default function() {
  // 1. List inbox (80% of requests)
  http.get('/tasks?status=inbox');

  // 2. Create project (5% of requests)
  http.post('/projects', {...});

  // 3. Create task (15% of requests)
  http.post('/tasks', {...});

  sleep(0.5); // Think time
}

// Measures:
// - p50, p95, p99 latency
// - Error rates
// - Memory growth over time
// - GC pauses
```

---

## 9. Cross-Backend Consistency Tests

### Why This Matters

Shared SQLite = backends compete for the same data.

**Scenario:**
```
Bun creates task:    POST /tasks {"title": "Buy milk"}
Response: {"id": "abc-123", ...}

Elixir lists tasks:  GET /tasks
Response should include that task

Ruby updates task:   PATCH /tasks/abc-123 {"status": "done"}

Bun reads task:      GET /tasks/abc-123
Should see status = "done"
```

**Without consistency tests:**
- Backends might work in isolation
- But fail when mixed traffic (common in production)
- Bug only appears under concurrent load

**Our test:**
```typescript
test('Concurrent writes from different backends', async () => {
  // Backend 1 writes
  const task = await fetch('http://backend1/tasks', {
    method: 'POST',
    body: JSON.stringify({ title: 'Test' })
  }).then(r => r.json());

  // Backend 2 reads
  const updated = await fetch(`http://backend2/tasks/${task.id}`)
    .then(r => r.json());

  // Must be identical
  expect(updated).toEqual(task);
});
```

---

## 10. Success Metrics

After implementing this test strategy:

### 1. Correctness ✓
- All backends pass contract tests (25+ scenarios)
- Zero data consistency issues
- 80%+ code coverage on critical paths

### 2. Performance Visibility ✓
- Clear p50/p95/p99 latency for each backend
- Throughput comparison (req/s)
- Memory profiling (idle vs loaded)
- GC pause measurements

### 3. Developer Experience ✓
- Local test feedback < 40 seconds
- CI feedback < 5 minutes
- Clear pass/fail for contract compliance
- Easy to add new backend (use checklist)

### 4. Maintainability ✓
- Contract tests written once, used everywhere
- Backend-specific tests in idiomatic style
- No duplicated logic
- Clear failure messages

---

## 11. Aligning with the FP Talk

The testing strategy reflects insights from the FP talk:

> **"We absorbed ideas from functional programming, some became mainstream."**

Our approach does this:

1. **Immutability testing** (consistency tests)
   - Backends must agree on shared state
   - Prevents race conditions
   - Mirrors Erlang's "let it fail" philosophy

2. **Pure function testing** (unit tests)
   - Business logic separated from I/O
   - Database queries isolated
   - Makes tests reliable and fast

3. **Process isolation** (contract tests)
   - Each backend is a separate process
   - Contract is the interface
   - Mirrors Erlang's actor model

4. **Observability through testing**
   - Performance tests reveal runtime behavior
   - Not just "does it work?" but "how does it behave?"
   - Aligns with Gingerbill's insight about understanding systems

> **"Pure functional programming is useless because when I push a button, that's a side effect."**

Our approach respects this:
- Don't test SQLite (it's proven)
- DO test framework behavior (side effects we care about)
- Focus on what changes between backends

---

## 12. Next Steps

1. **Review** this strategy with team
2. **Create** shared contract test suite (30 lines, 25+ scenarios)
3. **Implement** k6 performance test (50 lines)
4. **Add** to CI pipeline (GitHub Actions template provided)
5. **Build first backend** (Bun) using unit/integration test examples
6. **Copy checklist** when adding backends (Elixir, Ruby, etc.)

---

## Questions Addressed

**Q: Why not just test each backend independently?**
A: Because you couldn't compare them. Contract tests prove they're the same.

**Q: Why k6 for performance and not just load testing in CI?**
A: k6 simulates realistic workflows. Generic load testing measures noise.

**Q: Why 80% coverage, not 100%?**
A: The remaining 20% is framework internals. Your time is better spent elsewhere.

**Q: What if a backend is slower?**
A: Measure it! Performance test reveals where the time goes (framework, GC, etc). Use that to decide if it's acceptable for your use case.

**Q: Do all backends need the same test infrastructure?**
A: No. Unit tests are language-specific. Only contract tests are shared.

