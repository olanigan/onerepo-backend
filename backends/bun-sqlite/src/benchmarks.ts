import { TaskModel } from "./models/task";

/**
 * CPU-bound benchmark: ZXCVBN-like password strength checking
 * Simulates computationally expensive operations
 */
export function benchmarkCpuBound(iterations: number) {
  const startTime = Date.now();
  const startMemory = process.memoryUsage().heapUsed;

  let result = 0;
  for (let i = 0; i < iterations; i++) {
    // Simulate ZXCVBN computation: factorization + matrix operations
    const n = 97;
    for (let j = 2; j <= Math.sqrt(n); j++) {
      if (n % j === 0) {
        result += j;
      }
    }
    // Matrix multiplication simulation
    const a = [
      [1, 2, 3],
      [4, 5, 6],
      [7, 8, 9],
    ];
    const b = [
      [9, 8, 7],
      [6, 5, 4],
      [3, 2, 1],
    ];
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        for (let k = 0; k < 3; k++) {
          result += a[row][k] * b[k][col];
        }
      }
    }
  }

  const endTime = Date.now();
  const endMemory = process.memoryUsage().heapUsed;

  return {
    type: "cpu-bound",
    iterations,
    duration_ms: endTime - startTime,
    memory_used_mb: (endMemory - startMemory) / 1024 / 1024,
    result: result % 100, // Return checksum to prevent optimization
  };
}

/**
 * I/O-heavy benchmark: Database query slowdown
 * Simulates network latency or slow database operations
 */
export function benchmarkIoHeavy(taskModel: TaskModel, delay: number) {
  const startTime = Date.now();
  const startMemory = process.memoryUsage().heapUsed;

  // Simulate I/O delay
  const startDelay = Date.now();
  while (Date.now() - startDelay < delay) {
    // Busy wait to simulate blocking I/O
  }

  // Perform actual database operation
  const tasks = taskModel.list();

  const endTime = Date.now();
  const endMemory = process.memoryUsage().heapUsed;

  return {
    type: "io-heavy",
    delay_ms: delay,
    actual_duration_ms: endTime - startTime,
    memory_used_mb: (endMemory - startMemory) / 1024 / 1024,
    tasks_retrieved: tasks.length,
  };
}

/**
 * Memory pressure benchmark: Large allocations followed by GC
 * Tests garbage collection and memory management
 */
export function benchmarkMemory(allocationMB: number) {
  const startTime = Date.now();
  const startMemory = process.memoryUsage().heapUsed;

  // Allocate large arrays
  const arrays: number[][] = [];
  const bytesPerMB = 1024 * 1024;
  const elementsPerMB = bytesPerMB / 8; // 8 bytes per number

  for (let mb = 0; mb < allocationMB; mb++) {
    const arr = new Array(elementsPerMB);
    for (let i = 0; i < elementsPerMB; i++) {
      arr[i] = Math.random();
    }
    arrays.push(arr);
  }

  const peakMemory = process.memoryUsage().heapUsed;

  // Deallocate (let GC handle it)
  arrays.length = 0;

  // Force a small delay to allow partial GC
  const gcStart = Date.now();
  while (Date.now() - gcStart < 50) {
    // Wait for GC
  }

  const endTime = Date.now();
  const endMemory = process.memoryUsage().heapUsed;

  return {
    type: "memory",
    allocated_mb: allocationMB,
    duration_ms: endTime - startTime,
    peak_memory_used_mb: (peakMemory - startMemory) / 1024 / 1024,
    final_memory_used_mb: (endMemory - startMemory) / 1024 / 1024,
  };
}

/**
 * Cascading benchmark: Multiple sequential operations
 * Tests latency accumulation across multiple layers
 */
export function benchmarkCascading(taskModel: TaskModel, depth: number) {
  const startTime = Date.now();
  const startMemory = process.memoryUsage().heapUsed;

  let result = 0;
  for (let i = 0; i < depth; i++) {
    // Create and retrieve tasks in sequence
    const task = taskModel.create({ title: `Task ${i}` });
    const retrieved = taskModel.get(task.id);
    if (retrieved) result++;

    // Simulate cascading operations
    for (let j = 0; j < 100; j++) {
      taskModel.list();
    }
  }

  const endTime = Date.now();
  const endMemory = process.memoryUsage().heapUsed;

  return {
    type: "cascading",
    depth,
    duration_ms: endTime - startTime,
    memory_used_mb: (endMemory - startMemory) / 1024 / 1024,
    operations_completed: result,
  };
}

/**
 * Malicious payload benchmark: Processing oversized requests
 * Tests how the framework handles large payloads and potential DoS vectors
 */
export function benchmarkMalicious(payloadSizeMB: number) {
  const startTime = Date.now();
  const startMemory = process.memoryUsage().heapUsed;

  // Create a large string (malicious payload)
  const charCount = payloadSizeMB * 1024 * 1024;
  let largeString = "";
  for (let i = 0; i < charCount; i++) {
    largeString += String.fromCharCode(65 + (i % 26));
  }

  // Process the payload (parsing, validation, etc.)
  let checksum = 0;
  for (let i = 0; i < largeString.length; i += 1000) {
    checksum += largeString.charCodeAt(i);
  }

  const endTime = Date.now();
  const endMemory = process.memoryUsage().heapUsed;

  return {
    type: "malicious",
    payload_size_mb: payloadSizeMB,
    duration_ms: endTime - startTime,
    memory_used_mb: (endMemory - startMemory) / 1024 / 1024,
    checksum,
  };
}
