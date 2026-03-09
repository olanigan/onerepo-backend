package com.onecoder.gtd_backend.services;

import com.onecoder.gtd_backend.repositories.TaskRepository;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
public class BenchmarkService {

    private final TaskRepository taskRepository;

    public BenchmarkService(TaskRepository taskRepository) {
        this.taskRepository = taskRepository;
    }

    public Map<String, Object> benchmarkCpuBound(int iterations) {
        double result = 0;
        for (int i = 0; i < iterations; i++) {
            result += Math.sqrt(i) * Math.sin(i);
        }
        return Map.of("result", result, "iterations", iterations);
    }

    public Map<String, Object> benchmarkIoHeavy(int delayMs) {
        try {
            Thread.sleep(delayMs);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
        long taskCount = taskRepository.count();
        return Map.of("tasksCount", taskCount, "simulatedDelay", delayMs);
    }

    public Map<String, Object> benchmarkMemory(int allocationMB) {
        byte[] memoryHog = new byte[allocationMB * 1024 * 1024];
        return Map.of("allocatedMB", allocationMB, "success", true);
    }

    public Map<String, Object> benchmarkCascading(int depth) {
        long taskCount = taskRepository.count();
        // Simply simulate cascading DB load for depth number of times
        for(int i=0; i<depth; i++) {
           taskRepository.count();
        }
        return Map.of("depth", depth, "success", true);
    }

    public Map<String, Object> benchmarkMalicious(int payloadSizeMB) {
        byte[] payload = new byte[payloadSizeMB * 1024 * 1024];
        return Map.of("maliciousPayloadSizeMB", payloadSizeMB, "status", "processed");
    }
}
