import axios from "axios";
import { RequestMetrics, BenchmarkConfig } from "./types.ts";

export class LoadGenerator {
  private config: BenchmarkConfig;
  private abortController: AbortController | null = null;

  constructor(config: BenchmarkConfig) {
    this.config = config;
  }

  async generate(
    onMetric: (metric: RequestMetrics) => void
  ): Promise<void> {
    this.abortController = new AbortController();
    const endTime = Date.now() + this.config.duration * 1000;
    const concurrentRequests: Promise<void>[] = [];

    // Start concurrent request streams
    for (let i = 0; i < this.config.concurrency; i++) {
      concurrentRequests.push(
        this.requestStream(onMetric, endTime)
      );
    }

    await Promise.all(concurrentRequests);
  }

  private async requestStream(
    onMetric: (metric: RequestMetrics) => void,
    endTime: number
  ): Promise<void> {
    while (Date.now() < endTime && this.abortController?.signal.aborted === false) {
      const beforeMemory = process.memoryUsage().heapUsed / 1024 / 1024;
      const startTime = Date.now();

      try {
        const url = `${this.config.baseUrl}/benchmark/${this.config.scenario}`;
        const response = await axios.post(url, this.config.payload || {}, {
          timeout: 30000,
          signal: this.abortController?.signal,
        });

        const responseTime = Date.now() - startTime;
        const afterMemory = process.memoryUsage().heapUsed / 1024 / 1024;

        onMetric({
          timestamp: Date.now(),
          responseTime,
          statusCode: response.status,
          memoryBefore: beforeMemory,
          memoryAfter: afterMemory,
          success: response.status >= 200 && response.status < 300,
        });
      } catch (error: any) {
        const responseTime = Date.now() - startTime;
        const afterMemory = process.memoryUsage().heapUsed / 1024 / 1024;

        onMetric({
          timestamp: Date.now(),
          responseTime,
          statusCode: 0,
          memoryBefore: beforeMemory,
          memoryAfter: afterMemory,
          success: false,
          error: error.message,
        });
      }

      // Small delay to prevent overwhelming the event loop
      await new Promise((resolve) => setImmediate(resolve));
    }
  }

  stop() {
    this.abortController?.abort();
  }
}
