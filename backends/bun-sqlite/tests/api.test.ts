import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { Database } from "../src/database";
import { TaskModel } from "../src/models/task";
import { ProjectModel } from "../src/models/project";

let db: Database;
let taskModel: TaskModel;
let projectModel: ProjectModel;

beforeAll(() => {
  db = new Database(":memory:");
  db.migrate();
  taskModel = new TaskModel(db);
  projectModel = new ProjectModel(db);
});

describe("TaskModel", () => {
  test("create and get task", () => {
    const task = taskModel.create({ title: "Test task" });
    expect(task.id).toBeDefined();
    expect(task.title).toBe("Test task");
    expect(task.status).toBe("inbox");
    
    const found = taskModel.get(task.id);
    expect(found).toBeDefined();
    expect(found?.title).toBe("Test task");
  });
  
  test("list tasks", () => {
    taskModel.create({ title: "Task 1" });
    taskModel.create({ title: "Task 2", status: "done" });
    
    const all = taskModel.list();
    expect(all.length).toBeGreaterThanOrEqual(2);
    
    const inbox = taskModel.list("inbox");
    expect(inbox.every(t => t.status === "inbox")).toBe(true);
  });
  
  test("update task", () => {
    const task = taskModel.create({ title: "Update me" });
    const updated = taskModel.update(task.id, { title: "Updated", status: "done" });
    expect(updated?.title).toBe("Updated");
    expect(updated?.status).toBe("done");
  });
  
  test("delete task", () => {
    const task = taskModel.create({ title: "Delete me" });
    taskModel.delete(task.id);
    const found = taskModel.get(task.id);
    expect(found).toBeUndefined();
  });
  
  test("validation - title required", () => {
    expect(() => taskModel.create({ title: "" })).toThrow();
  });
});

describe("ProjectModel", () => {
  test("create and get project", () => {
    const project = projectModel.create({ name: "Test Project" });
    expect(project.id).toBeDefined();
    expect(project.name).toBe("Test Project");
    expect(project.status).toBe("active");
    
    const found = projectModel.get(project.id);
    expect(found?.name).toBe("Test Project");
  });
  
  test("list projects", () => {
    projectModel.create({ name: "Project 1" });
    projectModel.create({ name: "Project 2", status: "archive" });
    
    const all = projectModel.list();
    expect(all.length).toBeGreaterThanOrEqual(2);
  });
  
  test("delete project", () => {
    const project = projectModel.create({ name: "Delete me" });
    projectModel.delete(project.id);
    const found = projectModel.get(project.id);
    expect(found).toBeUndefined();
  });
  
  test("validation - name required", () => {
    expect(() => projectModel.create({ name: "" })).toThrow();
  });
});

describe("Database", () => {
  test("migrations run successfully", () => {
    const tasks = db.query("SELECT name FROM sqlite_master WHERE type='table'");
    const tableNames = tasks.map((t: any) => t.name);
    expect(tableNames).toContain("tasks");
    expect(tableNames).toContain("projects");
  });
});
