package com.onecoder.gtd_backend.controllers;

import com.onecoder.gtd_backend.models.Project;
import com.onecoder.gtd_backend.repositories.ProjectRepository;
import com.onecoder.gtd_backend.dto.CreateProjectInput;
import com.onecoder.gtd_backend.dto.UpdateProjectInput;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.Map;

@RestController
@RequestMapping("/projects")
public class ProjectController {

    private final ProjectRepository projectRepository;

    public ProjectController(ProjectRepository projectRepository) {
        this.projectRepository = projectRepository;
    }

    @GetMapping
    public List<Project> listProjects() {
        return projectRepository.findAllByOrderByCreatedAtDesc();
    }

    @PostMapping
    public ResponseEntity<?> createProject(@RequestBody CreateProjectInput input) {
        if (input.getName() == null || input.getName().trim().isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("error", "Validation Error", "message", "Name is required"));
        }

        String id = UUID.randomUUID().toString();
        String now = Instant.now().toString();
        String status = (input.getStatus() != null) ? input.getStatus() : "active";

        Project project = new Project(id, input.getName(), status, now, now);
        projectRepository.save(project);

        return ResponseEntity.status(HttpStatus.CREATED).body(project);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getProject(@PathVariable String id) {
        return projectRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND).body((Project) null));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateProject(@PathVariable String id, @RequestBody UpdateProjectInput input) {
        return projectRepository.findById(id).map(existing -> {
            if (input.getName() != null && !input.getName().trim().isEmpty()) {
                existing.setName(input.getName());
            }

            if (input.getStatus() != null) {
                existing.setStatus(input.getStatus());
            }

            existing.setUpdatedAt(Instant.now().toString());
            projectRepository.save(existing);
            return ResponseEntity.<Object>ok(existing);
        }).orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Not Found")));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteProject(@PathVariable String id) {
        projectRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("success", true));
    }
}
