package com.onecoder.gtd_backend.repositories;

import com.onecoder.gtd_backend.models.Task;
import org.springframework.data.repository.ListCrudRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TaskRepository extends ListCrudRepository<Task, String> {
    List<Task> findAllByOrderByCreatedAtDesc();
    List<Task> findByStatusOrderByCreatedAtDesc(String status);
}
