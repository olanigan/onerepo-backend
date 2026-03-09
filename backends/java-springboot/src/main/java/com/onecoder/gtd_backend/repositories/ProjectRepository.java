package com.onecoder.gtd_backend.repositories;

import com.onecoder.gtd_backend.models.Project;
import org.springframework.data.repository.ListCrudRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProjectRepository extends ListCrudRepository<Project, String> {
    List<Project> findAllByOrderByCreatedAtDesc();
}
