package com.onecoder.gtd_backend.repositories;

import com.onecoder.gtd_backend.models.Project;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Repository
public class ProjectRepository {
    private final List<Project> projects = new ArrayList<>();

    public List<Project> findAllByOrderByCreatedAtDesc() {
        return projects;
    }

    public void save(Project project) {
        if (project.getId() == null) project.setId(UUID.randomUUID().toString());
        projects.removeIf(p -> p.getId().equals(project.getId()));
        projects.add(project);
    }

    public Optional<Project> findById(String id) {
        return projects.stream().filter(p -> p.getId().equals(id)).findFirst();
    }

    public void deleteById(String id) {
        projects.removeIf(p -> p.getId().equals(id));
    }

    public long count() {
        return projects.size();
    }
}
