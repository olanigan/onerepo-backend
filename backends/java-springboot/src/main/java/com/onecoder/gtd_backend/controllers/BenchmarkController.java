package com.onecoder.gtd_backend.controllers;

import com.onecoder.gtd_backend.services.BenchmarkService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/benchmark")
public class BenchmarkController {

    private final BenchmarkService benchmarkService;

    public BenchmarkController(BenchmarkService benchmarkService) {
        this.benchmarkService = benchmarkService;
    }

    @PostMapping("/cpu-bound")
    public ResponseEntity<?> cpuBound(@RequestBody Map<String, Integer> payload) {
        int iterations = payload.getOrDefault("iterations", 100000);
        return ResponseEntity.ok(benchmarkService.benchmarkCpuBound(iterations));
    }

    @PostMapping("/io-heavy")
    public ResponseEntity<?> ioHeavy(@RequestBody Map<String, Integer> payload) {
        int delay = payload.getOrDefault("delay", 50);
        return ResponseEntity.ok(benchmarkService.benchmarkIoHeavy(delay));
    }

    @PostMapping("/memory")
    public ResponseEntity<?> memory(@RequestBody Map<String, Integer> payload) {
        int allocationMB = payload.getOrDefault("allocationMB", 50);
        return ResponseEntity.ok(benchmarkService.benchmarkMemory(allocationMB));
    }

    @PostMapping("/cascading")
    public ResponseEntity<?> cascading(@RequestBody Map<String, Integer> payload) {
        int depth = payload.getOrDefault("depth", 3);
        return ResponseEntity.ok(benchmarkService.benchmarkCascading(depth));
    }

    @PostMapping("/malicious")
    public ResponseEntity<?> malicious(@RequestBody Map<String, Integer> payload) {
        int payloadSizeMB = payload.getOrDefault("payloadSizeMB", 10);
        return ResponseEntity.ok(benchmarkService.benchmarkMalicious(payloadSizeMB));
    }
}
