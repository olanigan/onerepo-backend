# TODO: Java + Spring Boot Backend Implementation

## 1. Setup & Scaffolding
- [x] Initialize Spring Boot project (Web, Data JDBC, SQLite dialect).
- [x] Configure `application.yml` for SQLite pointing to local GTD DB.

## 2. Shared Core Architecture
- [x] Implement Unified Task & Project Models (sync with OpenAPI specs).
- [x] Set up DTOs and Validation layers.

## 3. TDD Implementation (GTD Endpoints)
- [x] **Test**: Create `TaskControllerTest` for GET/POST/PUT/DELETE.
- [x] **Impl**: Implement `TaskController` to pass tests.
- [x] **Test**: Create `ProjectControllerTest` for GET/POST/PUT/DELETE.
- [x] **Impl**: Implement `ProjectController` to pass tests.

## 4. Benchmark Integration
- [x] **Test**: Create `BenchmarkControllerTest` mapping to `cpu-bound`, `io-heavy`, `memory`, `cascading`, and `malicious`.
- [x] **Impl**: Implement the 5 benchmarking algorithms in `BenchmarkService.java`.
- [x] Expose `/benchmark/*` endpoints.

## 5. 3-Way Benchmark Finalization
- [x] Add `java-springboot` to `backends` in `benchmarks/runner/benchmark.ts` (port 3003).
- [x] Run `make bench-all` and `make bench-report`.
- [x] Commit 3-way benchmark report with `uvx onecoder sprint commit`.
- [ ] Close sprint with `uvx onecoder sprint close`.
