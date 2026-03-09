import { RequestMetrics, BenchmarkResult } from "./types.ts";

export class MetricsCollector {
  private metrics: RequestMetrics[] = [];
  private startTime: number = 0;
  private endTime: number = 0;

  start() {
    this.startTime = Date.now();
    this.metrics = [];
  }

  end() {
    this.endTime = Date.now();
  }

  recordRequest(metric: RequestMetrics) {
    this.metrics.push(metric);
  }

  private percentile(arr: number[], p: number): number {
    const sorted = arr.sort((a, b) => a - b);
    const index = Math.ceil((sorted.length * p) / 100) - 1;
    return sorted[Math.max(0, index)];
  }

  generateReport(backend: string, scenario: string): BenchmarkResult {
    const responseTimes = this.metrics.map((m) => m.responseTime);
    const memoryValues = this.metrics.map(
      (m) => (m.memoryBefore + m.memoryAfter) / 2
    );

    const successful = this.metrics.filter((m) => m.success).length;
    const failed = this.metrics.length - successful;
    const duration = (this.endTime - this.startTime) / 1000;

    return {
      backend,
      scenario,
      totalRequests: this.metrics.length,
      successfulRequests: successful,
      failedRequests: failed,
      throughput: this.metrics.length / duration,
      p50: this.percentile(responseTimes, 50),
      p75: this.percentile(responseTimes, 75),
      p90: this.percentile(responseTimes, 90),
      p95: this.percentile(responseTimes, 95),
      p99: this.percentile(responseTimes, 99),
      avgLatency: responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length,
      minLatency: Math.min(...responseTimes),
      maxLatency: Math.max(...responseTimes),
      memoryPeakMB: Math.max(...memoryValues),
      memoryAvgMB:
        memoryValues.reduce((a, b) => a + b, 0) / memoryValues.length,
      recoveryTime: this.calculateRecoveryTime(),
      startTime: new Date(this.startTime).toISOString(),
      endTime: new Date(this.endTime).toISOString(),
      duration,
    };
  }

  private calculateRecoveryTime(): number {
    // Find when latencies stabilize after spike
    if (this.metrics.length < 10) return 0;

    const window = 10;
    let recoveryTime = 0;

    for (let i = window; i < this.metrics.length; i++) {
      const slice = this.metrics.slice(i - window, i);
      const avg =
        slice.reduce((a, b) => a + b.responseTime, 0) / slice.length;
      const avgBefore =
        slice.slice(-5).reduce((a, b) => a + b.responseTime, 0) / 5;

      if (avg < avgBefore * 1.1) {
        recoveryTime = this.metrics[i].timestamp - this.metrics[window].timestamp;
        break;
      }
    }

    return recoveryTime;
  }
}
