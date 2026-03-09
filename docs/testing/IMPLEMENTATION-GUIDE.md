# Test Implementation Guide

**Status:** Ready to implement
**Audience:** Backend developers adding Elixir, Ruby, PHP, .NET, Java implementations

---

## Quick Start: Add Your Backend

### Step 1: Create Backend Directory Structure

```bash
backends/{language}/
├── src/                          # Your code
├── tests/
│   ├── unit/                     # Language-native tests
│   │   ├── database.test.ts      # Data layer
│   │   ├── validation.test.ts    # Input validation
│   │   └── models.test.ts        # Business logic
│   └── integration/              # HTTP-level tests
│       └── api.test.ts
├── Dockerfile                    # Container for docker-compose
├── package.json|Gemfile|mix.exs|etc  # Dependency management
└── README.md
```

### Step 2: Implement Unit Tests (Language-Specific)

**Key principle:** Use native testing tools, not a common test runner.

#### Bun (TypeScript)
```typescript
// backends/bun-sqlite/tests/unit/database.test.ts
import { describe, test, expect } from 'bun:test';
import * as db from '../../src/database';

describe('Task Database', () => {
  test('createTask returns task with id', async () => {
    const task = await db.createTask({ title: 'Test' });
    expect(task.id).toBeDefined();
    expect(task.id).toMatch(/^[0-9a-f-]{36}$/); // UUID
  });

  test('getTask by id', async () => {
    const created = await db.createTask({ title: 'Find me' });
    const fetched = await db.getTask(created.id);
    expect(fetched.title).toBe('Find me');
  });
});
```

Run: `bun test`

#### Elixir (ExUnit)
```elixir
# backends/elixir-phoenix/test/gtd/database_test.exs
defmodule GTD.DatabaseTest do
  use ExUnit.Case

  test "create_task returns task with id" do
    {:ok, task} = GTD.Database.create_task(%{"title" => "Test"})
    assert task.id != nil
    assert String.match?(task.id, ~r/^[0-9a-f-]{36}$/)
  end

  test "get_task by id" do
    {:ok, created} = GTD.Database.create_task(%{"title" => "Find me"})
    {:ok, fetched} = GTD.Database.get_task(created.id)
    assert fetched.title == "Find me"
  end
end
```

Run: `mix test`

#### Ruby (RSpec)
```ruby
# backends/ruby-rails/spec/database_spec.rb
RSpec.describe Database do
  describe '#create_task' do
    it 'returns task with id' do
      task = Database.create_task(title: 'Test')
      expect(task.id).to be_present
      expect(task.id).to match(/^[0-9a-f-]{36}$/)
    end
  end

  describe '#get_task' do
    it 'fetches by id' do
      created = Database.create_task(title: 'Find me')
      fetched = Database.get_task(created.id)
      expect(fetched.title).to eq('Find me')
    end
  end
end
```

Run: `bundle exec rspec`

### Step 3: Implement Integration Tests

These test HTTP endpoints. Use the same pattern for all backends:

```typescript
// backends/{language}/tests/integration/api.test.ts
// (Adapt syntax to your language)

describe('POST /tasks', () => {
  test('creates task and returns 201', async () => {
    const response = await fetch('http://localhost:PORT/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Buy milk' })
    });

    expect(response.status).toBe(201);
    const task = await response.json();
    expect(task).toHaveProperty('id');
    expect(task.title).toBe('Buy milk');
    expect(task.status).toBe('inbox');
  });

  test('returns 400 for missing title', async () => {
    const response = await fetch('http://localhost:PORT/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });

    expect(response.status).toBe(400);
    const error = await response.json();
    expect(error).toHaveProperty('details');
  });
});

describe('GET /tasks', () => {
  test('lists all tasks', async () => {
    const response = await fetch('http://localhost:PORT/tasks');
    expect(response.status).toBe(200);
    const tasks = await response.json();
    expect(Array.isArray(tasks)).toBe(true);
  });

  test('filters by status', async () => {
    const response = await fetch('http://localhost:PORT/tasks?status=inbox');
    const tasks = await response.json();
    tasks.forEach(task => {
      expect(task.status).toBe('inbox');
    });
  });
});
```

### Step 4: Dockerfile for Docker Compose

```dockerfile
# backends/{language}/Dockerfile
# Bun example
FROM oven/bun:latest

WORKDIR /app
COPY . .

RUN bun install

EXPOSE 3001

CMD ["bun", "run", "dev"]
```

```dockerfile
# Elixir example
FROM elixir:latest

WORKDIR /app
COPY . .

RUN mix deps.get && mix compile

EXPOSE 4000

CMD ["mix", "phx.server"]
```

### Step 5: Update docker-compose.yml

Add your backend as a service:

```yaml
# docker-compose.yml
services:
  # ... existing services ...

  elixir-phoenix:
    build:
      context: ./backends/elixir-phoenix
      dockerfile: Dockerfile
    ports:
      - "4000:4000"
    environment:
      - DATABASE_URL=sqlite:///data/gtd.db
    volumes:
      - shared-db:/data
    networks:
      - backend-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:4000/health"]
      interval: 10s
      timeout: 5s
      retries: 3

volumes:
  shared-db:
    driver: local

networks:
  backend-network:
    driver: bridge
```

---

## Contract Tests (Shared, Run Against Every Backend)

These live in `tests/contract/` and validate every backend against the OpenAPI spec.

### Setup: REST Client (Using Hurl)

```bash
# tests/contract/tasks.hurl
# (Hurl is a simple HTTP testing language)

### List tasks
GET http://localhost:${BACKEND_PORT}/tasks
HTTP 200

### Create task
POST http://localhost:${BACKEND_PORT}/tasks
Content-Type: application/json

{
  "title": "Test task"
}
HTTP 201

### Get created task
GET http://localhost:${BACKEND_PORT}/tasks/[Captures]id
HTTP 200

### Filter by status
GET http://localhost:${BACKEND_PORT}/tasks?status=inbox
HTTP 200
```

Run against each backend:

```bash
#!/bin/bash
# tests/contract/run.sh

for backend in bun-sqlite elixir-phoenix ruby-rails php-laravel dotnet-api java-spring-boot; do
  echo "Testing $backend..."

  # Start backend
  docker-compose up -d $backend

  # Wait for health check
  sleep 5

  # Get port from docker-compose
  port=$(docker-compose port $backend 3001 | cut -d: -f2)

  # Run contract tests
  BACKEND_PORT=$port hurl --test tests/contract/*.hurl

  # Stop backend
  docker-compose down

  echo "✓ $backend passed contract tests"
done
```

### Alternative: Playwright (More Powerful)

```typescript
// tests/contract/api.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Contract: /tasks', () => {
  const baseUrl = process.env.BACKEND_URL || 'http://localhost:3001';

  test('GET /tasks returns 200 with schema', async () => {
    const response = await fetch(`${baseUrl}/tasks`);
    expect(response.status).toBe(200);

    const tasks = await response.json();
    expect(Array.isArray(tasks)).toBe(true);

    // Validate schema
    tasks.forEach(task => {
      expect(task).toHaveProperty('id');
      expect(task).toHaveProperty('title');
      expect(task).toHaveProperty('status');
      expect(['inbox', 'next', 'waiting', 'done']).toContain(task.status);
    });
  });

  test('POST /tasks returns 201', async () => {
    const response = await fetch(`${baseUrl}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Test' })
    });

    expect(response.status).toBe(201);
    const task = await response.json();
    expect(task.id).toBeTruthy();
    expect(task.status).toBe('inbox');
  });

  test('Invalid status query returns 400', async () => {
    const response = await fetch(`${baseUrl}/tasks?status=invalid`);
    expect(response.status).toBe(400);
  });
});
```

Run: `BACKEND_URL=http://localhost:3001 npx playwright test`

---

## Performance Testing Setup

### Install k6

```bash
# macOS
brew install k6

# Linux
sudo apt-get install k6

# Or Docker
docker pull grafana/k6
```

### Baseline Test

```typescript
// tests/performance/baseline.ts
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 10 },   // Ramp to 10 users
    { duration: '1m', target: 10 },    // Stay at 10 users
    { duration: '10s', target: 0 },    // Ramp down
  ],
  thresholds: {
    'http_req_duration': ['p(95)<500'],
    'http_req_failed': ['rate<0.1'],
  },
  ext: {
    loadimpact: {
      projectID: 1234,  // Optional: for loadimpact.io
      name: 'Backend Shootout - Baseline'
    }
  }
};

export default function() {
  const baseUrl = `http://${__ENV.BACKEND_HOST || 'localhost'}:${__ENV.BACKEND_PORT || 3001}`;

  // Realistic GTD workflow

  // 1. List tasks (most common)
  const listRes = http.get(`${baseUrl}/tasks`);
  check(listRes, {
    'list status 200': (r) => r.status === 200,
    'list is array': (r) => Array.isArray(JSON.parse(r.body)),
  });

  // 2. Create task
  const createRes = http.post(`${baseUrl}/tasks`,
    JSON.stringify({
      title: `Task ${Date.now()}`,
      project_id: null
    }),
    { headers: { 'Content-Type': 'application/json' } }
  );
  check(createRes, {
    'create status 201': (r) => r.status === 201,
    'create has id': (r) => JSON.parse(r.body).id,
  });

  // 3. Get specific task
  if (createRes.status === 201) {
    const task = JSON.parse(createRes.body);
    const getRes = http.get(`${baseUrl}/tasks/${task.id}`);
    check(getRes, {
      'get status 200': (r) => r.status === 200,
    });
  }

  sleep(0.5); // Think time
}
```

### Run Performance Test

```bash
# Single backend
BACKEND_HOST=localhost BACKEND_PORT=3001 k6 run tests/performance/baseline.ts

# Compare multiple backends
#!/bin/bash
backends=("bun-sqlite:3001" "elixir-phoenix:4000" "ruby-rails:3001")

for backend in "${backends[@]}"; do
  IFS=':' read -r name port <<< "$backend"
  echo "Testing $name on port $port..."

  BACKEND_HOST=localhost BACKEND_PORT=$port k6 run tests/performance/baseline.ts \
    --summary-export=results/$name.json
done
```

### Generate Report

```bash
# Install tools
npm install -D @loadimpact/k6

# Parse results
node scripts/compare-performance.js results/*.json
```

---

## CI/CD Pipeline

### GitHub Actions Workflow

```yaml
# .github/workflows/test.yml
name: Backend Tests

on: [push, pull_request]

env:
  REGISTRY: ghcr.io

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        backend: [bun-sqlite, elixir-phoenix, ruby-rails]
    steps:
      - uses: actions/checkout@v4

      - name: Set up ${{ matrix.backend }}
        run: |
          case ${{ matrix.backend }} in
            bun-sqlite)
              curl -fsSL https://bun.sh/install | bash
              ;;
            elixir-phoenix)
              sudo apt-get install -y elixir
              ;;
            ruby-rails)
              sudo apt-get install -y ruby
              ;;
          esac

      - name: Run unit tests
        run: |
          cd backends/${{ matrix.backend }}
          case ${{ matrix.backend }} in
            bun-sqlite) bun test ;;
            elixir-phoenix) mix test ;;
            ruby-rails) bundle exec rspec ;;
          esac

      - name: Upload coverage
        uses: codecov/codecov-action@v3

  contract-tests:
    needs: unit-tests
    runs-on: ubuntu-latest
    strategy:
      matrix:
        backend: [bun-sqlite, elixir-phoenix, ruby-rails]
    steps:
      - uses: actions/checkout@v4

      - name: Build ${{ matrix.backend }}
        run: docker-compose build ${{ matrix.backend }}

      - name: Start ${{ matrix.backend }}
        run: docker-compose up -d ${{ matrix.backend }}

      - name: Wait for health check
        run: sleep 10

      - name: Run contract tests
        run: |
          BACKEND_URL=http://localhost:3001 \
          npx playwright test tests/contract/

      - name: Stop services
        if: always()
        run: docker-compose down

  performance:
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    strategy:
      matrix:
        backend: [bun-sqlite, elixir-phoenix, ruby-rails]
    steps:
      - uses: actions/checkout@v4

      - uses: grafana/setup-k6-action@v1

      - name: Build and start ${{ matrix.backend }}
        run: |
          docker-compose build ${{ matrix.backend }}
          docker-compose up -d ${{ matrix.backend }}
          sleep 5

      - name: Run performance test
        run: |
          k6 run tests/performance/baseline.ts \
            --summary-export=results/${{ matrix.backend }}.json

      - name: Upload results
        uses: actions/upload-artifact@v3
        with:
          name: perf-results-${{ matrix.backend }}
          path: results/${{ matrix.backend }}.json

  compare-results:
    needs: performance
    runs-on: ubuntu-latest
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4

      - uses: actions/download-artifact@v3

      - name: Generate comparison report
        run: node scripts/compare-performance.js

      - name: Comment on PR
        if: github.event_name == 'pull_request'
        uses: actions/github-script@v7
        with:
          script: |
            const fs = require('fs');
            const report = fs.readFileSync('PERFORMANCE_REPORT.md', 'utf8');
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: report
            });
```

---

## Test Checklist for New Backend

When adding a new backend (e.g., Elixir), use this checklist:

- [ ] **Directory structure** created (`backends/{lang}/tests/`)
- [ ] **Unit tests** implemented (database, validation)
- [ ] **Integration tests** implemented (HTTP roundtrips)
- [ ] **Dockerfile** working (builds and runs)
- [ ] **docker-compose** entry added
- [ ] **Contract tests pass** (all 25+ API scenarios)
- [ ] **Performance baseline** measured
- [ ] **Coverage report** > 80%
- [ ] **README** documents how to run tests locally
- [ ] **CI workflow** updated to include new backend

---

## Measuring Success

After implementing all tests:

```bash
# 1. All backends pass contract tests
✓ bun-sqlite: 25/25 contract tests passed
✓ elixir-phoenix: 25/25 contract tests passed
✓ ruby-rails: 25/25 contract tests passed

# 2. Performance comparison ready
Backend         p50     p95     Throughput  Memory
bun-sqlite      12ms    28ms    850 req/s   45MB
elixir-phoenix  18ms    35ms    720 req/s   120MB
ruby-rails      22ms    42ms    680 req/s   95MB

# 3. Quick feedback loop
Unit tests:       < 5s
Integration:     < 15s
Contract:        < 20s
Total:          < 40s ✓
```

---

## Troubleshooting

### "Contract test fails for my backend"
1. Check OpenAPI spec: `specs/openapi.yaml`
2. Verify response format exactly matches
3. Check error response structure
4. Run integration test first to debug

### "Performance test shows bad latency"
1. Profile with flamegraph: `perf record` (Linux) or Instruments (macOS)
2. Check database: Is query taking time?
3. Check framework: Any N+1 queries?
4. Check network: Is it going over HTTP?

### "Some tests flaky on CI"
1. Add explicit waits (health checks)
2. Increase test timeouts
3. Reduce VU count in perf test
4. Check for race conditions in concurrent tests

