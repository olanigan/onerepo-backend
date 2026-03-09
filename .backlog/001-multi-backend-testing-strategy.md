# Backlog: Multi-Backend Testing Strategy

**Status:** Proposed
**Date:** 2026-03-09
**Context:** Iterative application of testing strategies to the multi-backend shootout.

## Overview
A structured, iterative approach to applying unit, integration, and contract testing across multiple backend implementations (Bun, Java, Hono D1) to ensure correctness, performance, and cross-backend consistency.

## Iterative Plan

### Phase 1: Foundation (Contract First)
Establish the "Source of Truth" for the shootout.
- **Action**: Create root `tests/contract/` directory.
- **Implementation**: Write tests (Playwright/Hurl) verifying `specs/openapi.yaml` compliance.
- **Goal**: Ensure all backends (Bun, Java, Hono) pass the same suite.

### Phase 2: Native Robustness (Unit/Integration)
Ensure each backend is robust using its idiomatic tools.
- **Action**: Implement native tests in `backends/{lang}/tests`.
- **Implementation**: `bun test` for Bun, `JUnit/SpringRunner` for Java.
- **Goal**: 80% coverage on critical CRUD paths.

### Phase 3: The Shootout (Performance Profiling)
Quantify framework overhead and efficiency.
- **Action**: Implement `k6` scripts in `benchmarks/runner/`.
- **Implementation**: Run "GTD Workflow" (List → Create Project → Create Tasks) load tests.
- **Goal**: Report p95 latency and memory footprint comparisons.

### Phase 4: Cross-Backend Integrity (Consistency)
Validate the shared-state architecture.
- **Action**: Create `tests/consistency/` suite.
- **Implementation**: End-to-end tests performing writes on one backend and reads/updates on another.
- **Goal**: Prove that switching backends in the Gateway is data-safe.

## Test Matrix

| Test Type | Scope | Primary Tool |
| :--- | :--- | :--- |
| **Contract** | API Spec Compliance | Playwright / Hurl |
| **Integration** | HTTP Roundtrip + Persistence | Language-Native HTTP Client |
| **Unit** | Isolated Logic / Validation | `bun test`, `JUnit`, etc. |
| **Performance** | Latency / Throughput / Memory | `k6` |
| **Consistency** | Cross-Backend State | Custom Node.js script |
