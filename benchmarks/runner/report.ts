#!/usr/bin/env tsx

import { readdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { ComparisonReport, BenchmarkResult } from "./types.ts";

function generateHTML(report: ComparisonReport): string {
  const { results, backends, scenarios } = report;

  // Create comparison table
  const tableRows = scenarios
    .map((scenario) => {
      const scenarioResults = results.filter((r) => r.scenario === scenario);
      return `
        <tr>
          <td class="scenario">${scenario}</td>
          ${backends
          .map((backend) => {
            const result = scenarioResults.find((r) => r.backend === backend);
            if (!result)
              return `<td class="missing">N/A</td>`;

            const winner = scenarioResults.reduce((max, r) =>
              r.throughput > max.throughput ? r : max
            );

            const isWinner = result.backend === winner.backend;

            return `
                <td class="${isWinner ? "winner" : ""}">
                  <strong>${result.throughput.toFixed(0)}</strong> req/s<br/>
                  <small>p99: ${result.p99.toFixed(0)}ms</small>
                </td>
              `;
          })
          .join("")}
        </tr>
      `;
    })
    .join("");

  const detailsHTML = results
    .map((result) => {
      return `
        <div class="details-card">
          <h3>${result.backend} - ${result.scenario}</h3>
          <table>
            <tr><td>Total Requests</td><td>${result.totalRequests}</td></tr>
            <tr><td>Success Rate</td><td>${((result.successfulRequests / result.totalRequests) * 100).toFixed(1)}%</td></tr>
            <tr><td>Throughput</td><td>${result.throughput.toFixed(2)} req/s</td></tr>
            <tr><td>Avg Latency</td><td>${result.avgLatency.toFixed(2)}ms</td></tr>
            <tr><td>p50 Latency</td><td>${result.p50.toFixed(2)}ms</td></tr>
            <tr><td>p95 Latency</td><td>${result.p95.toFixed(2)}ms</td></tr>
            <tr><td>p99 Latency</td><td>${result.p99.toFixed(2)}ms</td></tr>
            <tr><td>Max Latency</td><td>${result.maxLatency.toFixed(2)}ms</td></tr>
            <tr><td>Peak Memory</td><td>${result.memoryPeakMB.toFixed(1)}MB</td></tr>
            <tr><td>Avg Memory</td><td>${result.memoryAvgMB.toFixed(1)}MB</td></tr>
            <tr><td>Recovery Time</td><td>${result.recoveryTime}ms</td></tr>
          </table>
        </div>
      `;
    })
    .join("");

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>GTD Backend Benchmarks</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
          padding: 20px;
        }
        .container {
          max-width: 1200px;
          margin: 0 auto;
          background: white;
          border-radius: 12px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.3);
          overflow: hidden;
        }
        header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 40px;
          text-align: center;
        }
        header h1 { font-size: 2.5em; margin-bottom: 10px; }
        header p { opacity: 0.9; }
        main { padding: 40px; }
        section { margin-bottom: 40px; }
        h2 { color: #333; margin-bottom: 20px; font-size: 1.5em; }
        table {
          width: 100%;
          border-collapse: collapse;
          background: white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          border-radius: 8px;
          overflow: hidden;
        }
        th {
          background: #f5f5f5;
          padding: 15px;
          text-align: left;
          font-weight: 600;
          border-bottom: 2px solid #ddd;
        }
        td {
          padding: 12px 15px;
          border-bottom: 1px solid #eee;
        }
        tr:hover { background: #f9f9f9; }
        td.scenario { font-weight: 600; color: #667eea; }
        td.winner {
          background: #d4edda;
          font-weight: bold;
        }
        td.missing { color: #999; }
        .details-card {
          background: #f8f9fa;
          border-left: 4px solid #667eea;
          padding: 20px;
          margin-bottom: 20px;
          border-radius: 4px;
        }
        .details-card h3 { color: #667eea; margin-bottom: 15px; }
        .details-card table {
          background: white;
          box-shadow: none;
          border: 1px solid #ddd;
        }
        .details-card td { padding: 8px 12px; }
        .details-card tr:last-child td { border-bottom: none; }
        footer {
          background: #f5f5f5;
          padding: 20px;
          text-align: center;
          color: #666;
          font-size: 0.9em;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <header>
          <h1>🚀 GTD Backend Benchmarks</h1>
          <p>Multi-Runtime Performance Comparison</p>
        </header>
        <main>
          <section>
            <h2>📊 Comparison Summary</h2>
            <table>
              <thead>
                <tr>
                  <th>Scenario</th>
                  ${backends.map((b) => `<th>${b}</th>`).join("")}
                </tr>
              </thead>
              <tbody>
                ${tableRows}
              </tbody>
            </table>
          </section>
          <section>
            <h2>📈 Detailed Results</h2>
            ${detailsHTML}
          </section>
        </main>
        <footer>
          <p>Generated on ${new Date(report.timestamp).toLocaleString()}</p>
        </footer>
      </div>
    </body>
    </html>
  `;
}

function main() {
  const resultsDir = join(new URL(".", import.meta.url).pathname, "../results");
  const files = readdirSync(resultsDir).filter((f) => f.endsWith(".json"));

  if (files.length === 0) {
    console.log("No benchmark results found. Run benchmarks first.");
    return;
  }

  // Get the latest results file
  const latestFile = files.sort().pop()!;
  const resultsPath = join(resultsDir, latestFile);
  const data = JSON.parse(readFileSync(resultsPath, "utf-8"));

  // Generate HTML report
  const htmlPath = join(
    resultsDir,
    `${latestFile.replace(".json", ".html")}`
  );
  const html = generateHTML(data);
  writeFileSync(htmlPath, html);

  console.log(`✅ HTML report generated: ${htmlPath}`);

  // Print summary
  console.log("\n📊 Summary");
  data.results.forEach((result: BenchmarkResult) => {
    console.log(
      `${result.backend} - ${result.scenario}: ${result.throughput.toFixed(0)} req/s, p99: ${result.p99.toFixed(0)}ms`
    );
  });
}

main();
