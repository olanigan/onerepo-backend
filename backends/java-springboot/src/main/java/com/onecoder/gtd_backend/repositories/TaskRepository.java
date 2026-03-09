package com.onecoder.gtd_backend.repositories;

import com.onecoder.gtd_backend.models.Task;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Repository
public class TaskRepository {
    private final List<Task> tasks = new ArrayList<>();

    public List<Task> findAllByOrderByCreatedAtDesc() {
        return tasks;
    }

    public List<Task> findByStatusOrderByCreatedAtDesc(String status) {
        return tasks.stream().filter(t -> t.getStatus().equals(status)).collect(Collectors.toList());
    }

    public void save(Task task) {
        if (task.getId() == null) task.setId(UUID.randomUUID().toString());
        tasks.removeIf(t -> t.getId().equals(task.getId()));
        tasks.add(task);
    }

    public Optional<Task> findById(String id) {
        return tasks.stream().filter(t -> t.getId().equals(id)).findFirst();
    }

    public void deleteById(String id) {
        tasks.removeIf(t -> t.getId().equals(id));
    }

    public long count() {
        return tasks.size();
    }
}
