# GTD Backend Benchmarks

Comprehensive multi-runtime performance testing suite for the GTD backend implementations.

## Overview

This benchmarking suite tests all GTD backend runtimes across standardized scenarios:

| Scenario | Tests | Purpose |
|----------|-------|---------|
| **cpu-bound** | ZXCVBN-like password strength checking | Tests CPU efficiency and computational throughput |
| **io-heavy** | Database queries with simulated latency | Tests I/O handling and network resilience |
| **memory** | Large allocations followed by GC | Tests memory management and garbage collection |
| **cascading** | Sequential multi-layer operations | Tests latency accumulation across request paths |
| **malicious** | Large payload processing | Tests DoS resilience and input validation |

## Quick Start

### 1. Start Backend Servers

```bash
# Terminal 1: bun-sqlite
cd backends/bun-sqlite
npm run dev

# Terminal 2: hono-d1 (local)
cd backends/hono-d1
npm run dev
```

### 2. Run Benchmarks

```bash
# Run all benchmarks
make bench-all

# Run specific scenario
make bench-cpu          # CPU-bound only
make bench-io           # I/O-heavy only
make bench-memory       # Memory operations
make bench-cascading    # Cascading requests
make bench-malicious    # Malicious payloads

# Generate HTML report
make bench-report
```

### 3. View Results

```bash
# Results are saved to:
benchmarks/results/benchmark-YYYY-MM-DD.json
benchmarks/results/benchmark-YYYY-MM-DD.html
```

## Manual Benchmark Run

```bash
cd benchmarks
npm install
npm run benchmark:all          # Run all scenarios
npm run benchmark:cpu-bound    # Run single scenario
npm run generate-report        # Create HTML report
```

## Benchmark Configuration

Edit the configurations in `runner/benchmark.ts`:

```typescript
const SCENARIOS: Record<string, {
  duration: number;       // seconds
  concurrency: number;    // parallel requests
  payload?: object;       // scenario-specific data
}> = {
  "cpu-bound": {
    duration: 10,
    concurrency: 4,
    payload: { iterations: 100000 }
  },
  // ...
}
```

## Metrics Collected

For each benchmark run:

- **Throughput**: Requests per second
- **Latency**: min, avg, p50, p75, p90, p95, p99, max (ms)
- **Memory**: Peak and average heap usage (MB)
- **Success Rate**: % of successful requests
- **Recovery Time**: Time to stabilize after spike (ms)

## Interpreting Results

### Throughput Winners
- Higher is better
- Measures peak performance capacity
- CPU-bound: raw computation speed
- I/O-heavy: concurrent request handling

### Latency (p99)
- Lower is better
- Critical for user experience
- 99th percentile catches outliers
- p50/p99 spread indicates consistency

### Memory Usage
- Peak memory: spike during allocation
- Average memory: steady-state consumption
- Recovery: post-GC behavior

### Malicious Payload Results
- Tests DoS resistance
- Slow response = safer (validates input)
- Crash = poor (exploitable)
- Fast response = efficient (but check validity)

## Adding New Scenarios

1. Create benchmark function in `runner/benchmark.ts`
2. Add scenario config to `SCENARIOS` object
3. Implement endpoint in backend:

**bun-sqlite:**
```typescript
// src/benchmarks.ts
export function benchmarkNewScenario(param: number) {
  // implementation
  return { type: 'new-scenario', ... };
}

// src/index.ts
if (path === "/benchmark/new-scenario" && method === "POST") {
  return req.json().then((body) => {
    const result = benchmarkNewScenario(body.param);
    return Response.json(result);
  });
}
```

**hono-d1:**
```typescript
// src/index.ts
app.post('/benchmark/new-scenario', async (c) => {
  const body = await c.req.json();
  // implementation
  return c.json({ type: 'new-scenario', ... });
});
```

4. Add to `SCENARIOS` config in benchmark.ts
5. Run: `npm run benchmark:all`

## Troubleshooting

### Connection Refused
- Ensure backends are running on configured ports
- Check `BACKENDS` config in `runner/benchmark.ts`
- Verify firewall isn't blocking connections

### OOM Errors
- Reduce `allocationMB` in memory scenario
- Reduce `concurrency` in SCENARIOS config
- Check available system memory

### No Results
- Run `npm install` in benchmarks directory
- Check backend logs for errors
- Verify JSON responses from `/benchmark/*` endpoints

## CI/CD Integration

Add to GitHub Actions:

```yaml
- name: Run Benchmarks
  run: make bench-all

- name: Upload Results
  uses: actions/upload-artifact@v3
  with:
    name: benchmark-results
    path: benchmarks/results/
```

## Performance Tips

For more accurate results:

1. **Isolate system**: Close other applications
2. **Multiple runs**: Run benchmarks 3+ times
3. **Steady state**: Warm up backends first with health checks
4. **Consistent load**: Same concurrency/duration across runs
5. **Monitor system**: Watch CPU/memory during runs

## Files

- `runner/benchmark.ts` - Main benchmark harness
- `runner/load-generator.ts` - HTTP load generator
- `runner/metrics.ts` - Metrics collection & analysis
- `runner/report.ts` - HTML report generation
- `runner/types.ts` - TypeScript definitions
- `scenarios/` - Scenario payloads (future)
- `fixtures/` - Test data (future)
- `results/` - Generated reports
