export interface BenchmarkConfig {
  backend: string;
  scenario: "cpu-bound" | "io-heavy" | "memory" | "cascading" | "malicious";
  duration: number;
  concurrency: number;
  baseUrl: string;
  payload?: Record<string, any>;
}

export interface RequestMetrics {
  timestamp: number;
  responseTime: number;
  statusCode: number;
  memoryBefore: number;
  memoryAfter: number;
  success: boolean;
  error?: string;
}

export interface BenchmarkResult {
  backend: string;
  scenario: string;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  throughput: number; // req/sec
  p50: number; // latency ms
  p75: number;
  p90: number;
  p95: number;
  p99: number;
  avgLatency: number;
  minLatency: number;
  maxLatency: number;
  memoryPeakMB: number;
  memoryAvgMB: number;
  recoveryTime: number; // ms
  startTime: string;
  endTime: string;
  duration: number; // seconds
}

export interface ComparisonReport {
  timestamp: string;
  results: BenchmarkResult[];
  scenarios: string[];
  backends: string[];
}
