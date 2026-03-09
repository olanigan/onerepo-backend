#!/usr/bin/env tsx

import { LoadGenerator } from "./load-generator.ts";
import { MetricsCollector } from "./metrics.ts";
import { BenchmarkConfig, BenchmarkResult } from "./types.ts";
import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";

// Default backend configurations
const BACKENDS: Record<string, { url: string }> = {
  "bun-sqlite": { url: "https://gtd-backend.salalite.workers.dev" },
  "hono-d1": { url: "https://hono-d1-backend.salalite.workers.dev" },
  "java-springboot": { url: "http://localhost:3003" },
};

// Benchmark scenarios
const SCENARIOS: Record<
  string,
  { duration: number; concurrency: number; payload?: Record<string, any> }
> = {
  "cpu-bound": {
    duration: 10,
    concurrency: 4,
    payload: { iterations: 100000 },
  },
  "io-heavy": {
    duration: 10,
    concurrency: 8,
    payload: { delay: 50 },
  },
  "memory": {
    duration: 10,
    concurrency: 4,
    payload: { allocationMB: 50 },
  },
  "cascading": {
    duration: 10,
    concurrency: 16,
    payload: { depth: 3 },
  },
  "malicious": {
    duration: 10,
    concurrency: 2,
    payload: { payloadSizeMB: 10 },
  },
};

async function runBenchmark(
  backend: string,
  scenario: string,
  config: BenchmarkConfig
): Promise<BenchmarkResult> {
  console.log(
    `📊 Running ${scenario} benchmark on ${backend} (${config.duration}s, ${config.concurrency} concurrency)...`
  );

  const collector = new MetricsCollector();
  const generator = new LoadGenerator(config);

  collector.start();

  await generator.generate((metric) => {
    collector.recordRequest(metric);
  });

  collector.end();

  const result = collector.generateReport(backend, scenario);

  console.log(
    `   ✅ ${result.totalRequests} requests | ${result.throughput.toFixed(0)} req/s | p99: ${result.p99.toFixed(0)}ms`
  );

  return result;
}

async function main() {
  const args = process.argv.slice(2);
  const runAll = args.includes("--all");
  const scenarioFilter = args
    .find((a) => a.startsWith("--scenario="))
    ?.split("=")[1];

  const scenarioNames = scenarioFilter
    ? [scenarioFilter]
    : runAll
      ? Object.keys(SCENARIOS)
      : ["cpu-bound"];

  const backendNames = Object.keys(BACKENDS);
  const results: BenchmarkResult[] = [];

  console.log("🚀 GTD Backend Benchmark Suite\n");
  console.log(`Testing: ${backendNames.join(", ")}`);
  console.log(`Scenarios: ${scenarioNames.join(", ")}\n`);

  for (const backend of backendNames) {
    console.log(`\n📦 ${backend.toUpperCase()}`);
    console.log("─".repeat(40));

    for (const scenario of scenarioNames) {
      const scenarioConfig = SCENARIOS[scenario];
      if (!scenarioConfig) {
        console.log(`⚠️  Unknown scenario: ${scenario}`);
        continue;
      }

      const config: BenchmarkConfig = {
        backend,
        scenario,
        baseUrl: BACKENDS[backend].url,
        duration: scenarioConfig.duration,
        concurrency: scenarioConfig.concurrency,
        payload: scenarioConfig.payload,
      };

      try {
        const result = await runBenchmark(backend, scenario, config);
        results.push(result);
      } catch (error: any) {
        console.error(`❌ Error: ${error.message}`);
      }
    }
  }

  // Save results
  const currentDir = new URL(".", import.meta.url).pathname;
  mkdirSync(join(currentDir, "../results"), { recursive: true });
  const resultsPath = join(
    currentDir,
    `../results/benchmark-${new Date().toISOString().split("T")[0]}.json`
  );

  writeFileSync(
    resultsPath,
    JSON.stringify(
      {
        timestamp: new Date().toISOString(),
        results,
        backends: backendNames,
        scenarios: scenarioNames,
      },
      null,
      2
    )
  );

  console.log(`\n✅ Results saved to ${resultsPath}`);
  console.log(`\n📈 Summary`);
  console.log("─".repeat(40));

  // Print summary table
  for (const scenario of scenarioNames) {
    console.log(`\n${scenario.toUpperCase()}`);
    const scenarioResults = results.filter((r) => r.scenario === scenario);
    for (const result of scenarioResults) {
      console.log(
        `  ${result.backend}: ${result.throughput.toFixed(0)} req/s, p99: ${result.p99.toFixed(0)}ms`
      );
    }
  }
}

main().catch(console.error);
