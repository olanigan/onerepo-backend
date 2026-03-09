package com.onecoder.gtd_backend.controllers;

import com.onecoder.gtd_backend.models.Task;
import com.onecoder.gtd_backend.repositories.TaskRepository;
import com.onecoder.gtd_backend.dto.CreateTaskInput;
import com.onecoder.gtd_backend.dto.UpdateTaskInput;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.Map;

@RestController
@RequestMapping("/tasks")
public class TaskController {

    private final TaskRepository taskRepository;

    public TaskController(TaskRepository taskRepository) {
        this.taskRepository = taskRepository;
    }

    @GetMapping
    public List<Task> listTasks(@RequestParam(required = false) String status) {
        if (status != null && !status.isEmpty()) {
            return taskRepository.findByStatusOrderByCreatedAtDesc(status);
        }
        return taskRepository.findAllByOrderByCreatedAtDesc();
    }

    @PostMapping
    public ResponseEntity<?> createTask(@RequestBody CreateTaskInput input) {
        if (input.getTitle() == null || input.getTitle().trim().isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("error", "Validation Error", "message", "Title is required"));
        }

        String id = UUID.randomUUID().toString();
        String now = Instant.now().toString();
        String status = (input.getStatus() != null) ? input.getStatus() : "inbox";

        Task task = new Task(id, input.getTitle(), status, input.getProjectId(), now, now);
        taskRepository.save(task);

        return ResponseEntity.status(HttpStatus.CREATED).body(task);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getTask(@PathVariable String id) {
        return taskRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND).body((Task) null)); // Simple generic fallback
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateTask(@PathVariable String id, @RequestBody UpdateTaskInput input) {
        return taskRepository.findById(id).map(existing -> {
            if (input.getTitle() != null && !input.getTitle().trim().isEmpty()) {
                existing.setTitle(input.getTitle());
            } else if (input.getTitle() != null && input.getTitle().trim().isEmpty()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("error", "Validation Error", "message", "Title cannot be empty"));
            }

            if (input.getStatus() != null) {
                existing.setStatus(input.getStatus());
            }
            if (input.getProjectId() != null) {
                existing.setProjectId(input.getProjectId());
            }

            existing.setUpdatedAt(Instant.now().toString());
            taskRepository.save(existing);
            return ResponseEntity.<Object>ok(existing);
        }).orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Not Found")));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteTask(@PathVariable String id) {
        taskRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("success", true));
    }
}
