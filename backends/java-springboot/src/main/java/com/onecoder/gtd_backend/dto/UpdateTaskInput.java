package com.onecoder.gtd_backend.dto;

public class UpdateTaskInput {
    private String title;
    private String projectId;
    private String status;

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getProjectId() { return projectId; }
    public void setProjectId(String projectId) { this.projectId = projectId; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
