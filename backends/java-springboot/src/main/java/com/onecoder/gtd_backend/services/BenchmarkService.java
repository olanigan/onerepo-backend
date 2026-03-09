package com.onecoder.gtd_backend.services;

import com.onecoder.gtd_backend.repositories.TaskRepository;
import com.onecoder.gtd_backend.models.Task;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class BenchmarkService {

    private final TaskRepository taskRepository;

    public BenchmarkService(TaskRepository taskRepository) {
        this.taskRepository = taskRepository;
    }

    public Map<String, Object> benchmarkCpuBound(int iterations) {
        long startTime = System.currentTimeMillis();
        long result = 0;
        for (int i = 0; i < iterations; i++) {
            // Factorization simulation
            int n = 97;
            for (int j = 2; j <= Math.sqrt(n); j++) {
                if (n % j == 0) {
                    result += j;
                }
            }
            // Matrix multiplication simulation
            int[][] a = {{1, 2, 3}, {4, 5, 6}, {7, 8, 9}};
            int[][] b = {{9, 8, 7}, {6, 5, 4}, {3, 2, 1}};
            for (int row = 0; row < 3; row++) {
                for (int col = 0; col < 3; col++) {
                    for (int k = 0; k < 3; k++) {
                        result += (long) a[row][k] * b[k][col];
                    }
                }
            }
        }
        long endTime = System.currentTimeMillis();
        return Map.of(
            "type", "cpu-bound",
            "iterations", iterations,
            "duration_ms", endTime - startTime,
            "result", result % 100
        );
    }

    public Map<String, Object> benchmarkIoHeavy(int delayMs) {
        long startTime = System.currentTimeMillis();
        long startDelay = System.currentTimeMillis();
        while (System.currentTimeMillis() - startDelay < delayMs) {
            // Busy wait to match Bun/Hono implementation
        }
        long taskCount = taskRepository.count();
        long endTime = System.currentTimeMillis();
        return Map.of(
            "type", "io-heavy",
            "delay_ms", delayMs,
            "actual_duration_ms", endTime - startTime,
            "tasks_retrieved", taskCount
        );
    }

    public Map<String, Object> benchmarkMemory(int allocationMB) {
        long startTime = System.currentTimeMillis();
        List<double[]> arrays = new ArrayList<>();
        int bytesPerMB = 1024 * 1024;
        int elementsPerMB = bytesPerMB / 8;

        for (int mb = 0; mb < Math.min(allocationMB, 10); mb++) {
            double[] arr = new double[elementsPerMB];
            for (int i = 0; i < elementsPerMB; i++) {
                arr[i] = Math.random();
            }
            arrays.add(arr);
        }
        arrays.clear();
        long endTime = System.currentTimeMillis();
        return Map.of(
            "type", "memory",
            "allocated_mb", allocationMB,
            "duration_ms", endTime - startTime
        );
    }

    public Map<String, Object> benchmarkCascading(int depth) {
        long startTime = System.currentTimeMillis();
        int result = 0;
        for (int i = 0; i < depth; i++) {
            Task task = new Task();
            task.setId(UUID.randomUUID().toString());
            task.setTitle("Task " + i);
            task.setStatus("inbox");
            taskRepository.save(task);
            
            if (taskRepository.findById(task.getId()).isPresent()) {
                result++;
            }
            
            // Cascading load
            for (int j = 0; j < 100; j++) {
                taskRepository.findAll();
            }
        }
        long endTime = System.currentTimeMillis();
        return Map.of(
            "type", "cascading",
            "depth", depth,
            "duration_ms", endTime - startTime,
            "operations_completed", result
        );
    }

    public Map<String, Object> benchmarkMalicious(int payloadSizeMB) {
        long startTime = System.currentTimeMillis();
        int charCount = Math.min(payloadSizeMB, 5) * 1024 * 1024;
        StringBuilder sb = new StringBuilder(charCount);
        for (int i = 0; i < charCount; i++) {
            sb.append((char) (65 + (i % 26)));
        }
        String largeString = sb.toString();
        long checksum = 0;
        for (int i = 0; i < largeString.length(); i += 1000) {
            checksum += largeString.charAt(i);
        }
        long endTime = System.currentTimeMillis();
        return Map.of(
            "type", "malicious",
            "payload_size_mb", payloadSizeMB,
            "duration_ms", endTime - startTime,
            "checksum", checksum
        );
    }
}
