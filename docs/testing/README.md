# Testing Documentation for GTD Backend Shootout

**Status:** ✅ Complete and committed
**Branch:** `claude/review-backend-architecture-soSSt`

---

## 📋 Overview

This directory contains a comprehensive, first-principles testing strategy for the GTD (Getting Things Done) multi-backend comparison project.

**Key insight:** All backends share the same SQLite database, so we test for:
- ✅ **API contract compliance** (all backends implement spec correctly)
- ✅ **Framework overhead** (what does each language/runtime add?)
- ✅ **Data consistency** (concurrent writes are safe)
- ✅ **Developer experience** (code clarity, build speed, test ergonomics)

❌ **NOT testing:** Database correctness, SQL performance (same for all backends)

---

## 📚 Documents

### 1. **TEST-STRATEGY.md** (High-Level Design)
**For:** Architects, leads, anyone wanting to understand the overall approach

**Contents:**
- First-principles analysis: what are we actually testing?
- Test pyramid (70% unit, 25% integration, 5% E2E)
- Test matrix by category (contract, unit, integration, performance, consistency)
- Performance testing deep dive (k6 setup, baselines, stress tests)
- Success criteria
- Coverage targets

**Key takeaway:**
> Don't duplicate contract tests across 5+ backends. Write once, run everywhere.

---

### 2. **IMPLEMENTATION-GUIDE.md** (Practical Handbook)
**For:** Backend developers implementing Elixir, Ruby, PHP, .NET, Java backends

**Contents:**
- Step-by-step directory structure
- Language-specific unit test examples (Bun, Elixir, Ruby)
- Integration test patterns
- Dockerfile templates
- Shared contract test patterns (Hurl, Playwright)
- CI/CD pipeline configuration (GitHub Actions)
- Performance testing setup (k6)
- New backend checklist

**Key takeaway:**
> When adding a new backend, follow the 4-step checklist. Takes ~2 hours to get to "contract tests passing".

---

### 3. **TESTING-RATIONALE.md** (Strategic Justification)
**For:** People asking "why this approach?" or "why not just...?"

**Contents:**
- Why shared contract tests eliminate duplication
- How performance testing isolates framework overhead
- Real-world bug discovery example
- Test pyramid rationale (why not 50/50?)
- k6 selection (vs Gatling, Apache Bench, Locust)
- Alignment with FP talk insights

**Key takeaway:**
> This design answers the core question: "Framework differences matter, but which one?"

---

### 4. **QUICK-REFERENCE.md** (Developer Checklists)
**For:** Day-to-day development, quick lookups

**Contents:**
- Test types at a glance (table)
- 4-step backend addition checklist
- Running tests locally (all commands)
- Performance testing (quick baseline)
- Contract test matrix (25+ scenarios)
- Common issues & fixes
- File templates
- Coverage commands

**Key takeaway:**
> Print this out or bookmark it. It's your reference while implementing.

---

## 🎯 Test Strategy at a Glance

```
TEST PYRAMID
             ▲
            / \       5% E2E Tests
           /   \      Full GTD workflows
          /     \
         /-------\
        /         \   25% Integration
       /           \  API roundtrips
      /             \ HTTP contracts
     /---------------\
    /                 \ 70% Unit Tests
   /                   \Business logic
  /_____________________\ Database layer
```

**Execution Speed:**
- Unit: 2-5 seconds ✨
- Integration: 10-15 seconds
- E2E: 30-60 seconds
- Performance: 60+ seconds
- **Total feedback loop:** < 40 seconds for development

---

## 🚀 Getting Started

### For Backend Developers Adding New Implementation

```bash
# 1. Create backend directory
mkdir -p backends/{language}/tests/{unit,integration}

# 2. Implement unit tests (language-specific)
# See IMPLEMENTATION-GUIDE.md for templates

# 3. Implement integration tests (HTTP calls)
# Same pattern for all backends

# 4. Verify contract tests pass
BACKEND_URL=http://localhost:PORT npx playwright test tests/contract/

# Done! Your backend is ready.
```

---

## 📊 Performance Testing

All backends measured fairly with **k6** against same workload:

```bash
# Run baseline performance test
BACKEND_PORT=3001 k6 run tests/performance/baseline.ts

# Results show:
# - p50/p95/p99 latency
# - Throughput (req/s)
# - Error rate
# - Memory usage
```

**Expected comparison (will vary):**
| Backend | p50 | p95 | Throughput |
|---------|-----|-----|-----------|
| Bun + SQLite | 12ms | 28ms | 850 req/s |
| Elixir Phoenix | 18ms | 35ms | 720 req/s |
| Ruby Rails | 22ms | 42ms | 680 req/s |

---

## 🔄 CI/CD Integration

Tests run automatically on every push:

```
Tests (Unit + Integration):     ~5-10 minutes
Contract tests (all backends):  ~15 minutes
Performance (main branch only): ~30 minutes

Total: Comprehensive validation before merge
```

See `IMPLEMENTATION-GUIDE.md` for GitHub Actions configuration.

---

## ✅ Success Criteria

- [ ] All backends pass 25+ contract tests
- [ ] Unit tests > 80% coverage on critical paths
- [ ] Integration tests validate full API workflows
- [ ] Performance baseline measured for each backend
- [ ] < 40 second feedback loop for development
- [ ] Cross-backend consistency validated

---

## 🤔 FAQ

**Q: Why shared contract tests?**
A: Because you want fair comparison. If each backend has custom tests, you can't tell if differences are framework or test differences. Shared tests prove all backends implement the same contract.

**Q: Why not 100% code coverage?**
A: The remaining 20% is framework internals (HTTP routing, JSON serialization). These are tested by the framework maintainers. Your tests should focus on business logic.

**Q: How do I debug a failing contract test?**
A:
1. Check the OpenAPI spec: `specs/openapi.yaml`
2. Run integration test first (more detailed output)
3. Compare response to expected schema
4. The error is usually JSON format or missing field

**Q: My backend is slower. Is it a bug?**
A: Not necessarily. Different languages/runtimes have tradeoffs:
- Bun: Lean, fast startup, but newer runtime
- Elixir: Actor concurrency, great for distributed systems
- Ruby: Easy development, slower execution
- Java: JIT warmup, then very fast

**Q: Can I optimize my backend?**
A: Yes! The point of the shootout is to understand tradeoffs, not declare a winner. Optimize based on your needs (latency vs throughput vs memory vs development speed).

---

## 📖 Related Documents

- **Architecture:** `docs/architecture/decisions/ADR-001-Hybrid-Architecture.md`
- **API Contract:** `specs/openapi.yaml`
- **Frontend PRD:** `specs/PRD-Frontend.md`
- **Gateway PRD:** `specs/PRD-Gateway.md`
- **Backend PRD:** `specs/PRD-Backend-BunSQLite.md`

---

## 🛠 Tools Used

| Purpose | Tool | Why |
|---------|------|-----|
| Unit tests | Language-native (Bun.test, RSpec, ExUnit) | Fast, idiomatic |
| Contract tests | Playwright / Hurl | Works in CI, easy assertions |
| Performance | k6 | JavaScript DSL, realistic load patterns |
| Code coverage | Language-native | Built-in reporting |
| CI/CD | GitHub Actions | Already integrated with repo |

---

## 📞 Support

For questions about:
- **Test design/strategy:** Read `TESTING-RATIONALE.md`
- **Implementation details:** See `IMPLEMENTATION-GUIDE.md`
- **Adding a new backend:** Use `QUICK-REFERENCE.md` checklist
- **Commands/tools:** Check `QUICK-REFERENCE.md`

---

## 📝 Summary

This testing strategy enables fair, meaningful comparison of backend frameworks by:

1. **Isolating variables** (same database, same API contract)
2. **Measuring what matters** (framework overhead, not DB overhead)
3. **Proving correctness** (contract tests validate spec compliance)
4. **Enabling comparison** (performance metrics across all backends)

The result: clear data showing what each framework excels at, so you can choose based on your actual needs.

