package com.onecoder.gtd_backend.models;

import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Table;

@Table("tasks")
public class Task {
    @Id
    private String id;
    private String title;
    private String status;
    private String projectId;
    private String createdAt;
    private String updatedAt;

    public Task() {}

    public Task(String id, String title, String status, String projectId, String createdAt, String updatedAt) {
        this.id = id;
        this.title = title;
        this.status = status;
        this.projectId = projectId;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getProjectId() { return projectId; }
    public void setProjectId(String projectId) { this.projectId = projectId; }
    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }
    public String getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(String updatedAt) { this.updatedAt = updatedAt; }
}
