import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { Database } from "../src/database";
import { TaskModel } from "../src/models/task";
import { ProjectModel } from "../src/models/project";

const PORT = 3456;
let server: ReturnType<typeof Bun.serve>;
let baseUrl: string;

async function fetchAPI(path: string, options: RequestInit = {}) {
  return fetch(`${baseUrl}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...options.headers },
  });
}

beforeAll(() => {
  const db = new Database(":memory:");
  db.migrate();
  
  const taskModel = new TaskModel(db);
  const projectModel = new ProjectModel(db);
  
  server = Bun.serve({
    port: PORT,
    fetch(req) {
      const url = new URL(req.url);
      const path = url.pathname;
      const method = req.method;
      
      if (path === "/health") {
        return Response.json({ status: "ok" });
      }
      
      if (path === "/tasks" && method === "GET") {
        const status = url.searchParams.get("status");
        return Response.json(taskModel.list(status as any || undefined));
      }
      
      if (path === "/tasks" && method === "POST") {
        return req.json().then(body => {
          try {
            const task = taskModel.create(body);
            return Response.json(task, { status: 201 });
          } catch (e: any) {
            return Response.json({ error: "Validation Error", message: e.message }, { status: 400 });
          }
        });
      }
      
      if (path.match(/^\/tasks\/[\w-]+$/) && method === "GET") {
        const id = path.split("/")[2];
        const task = taskModel.get(id);
        if (!task) return Response.json({ error: "Not Found" }, { status: 404 });
        return Response.json(task);
      }
      
      if (path.match(/^\/tasks\/[\w-]+$/) && method === "PUT") {
        const id = path.split("/")[2];
        return req.json().then(body => {
          try {
            const task = taskModel.update(id, body);
            if (!task) return Response.json({ error: "Not Found" }, { status: 404 });
            return Response.json(task);
          } catch (e: any) {
            return Response.json({ error: "Validation Error", message: e.message }, { status: 400 });
          }
        });
      }
      
      if (path.match(/^\/tasks\/[\w-]+$/) && method === "DELETE") {
        const id = path.split("/")[2];
        taskModel.delete(id);
        return Response.json({ success: true });
      }
      
      if (path === "/projects" && method === "GET") {
        return Response.json(projectModel.list());
      }
      
      if (path === "/projects" && method === "POST") {
        return req.json().then(body => {
          try {
            const project = projectModel.create(body);
            return Response.json(project, { status: 201 });
          } catch (e: any) {
            return Response.json({ error: "Validation Error", message: e.message }, { status: 400 });
          }
        });
      }
      
      if (path.match(/^\/projects\/[\w-]+$/) && method === "GET") {
        const id = path.split("/")[2];
        const project = projectModel.get(id);
        if (!project) return Response.json({ error: "Not Found" }, { status: 404 });
        return Response.json(project);
      }
      
      if (path.match(/^\/projects\/[\w-]+$/) && method === "DELETE") {
        const id = path.split("/")[2];
        projectModel.delete(id);
        return Response.json({ success: true });
      }
      
      return Response.json({ error: "Not Found" }, { status: 404 });
    },
  });
  
  baseUrl = `http://localhost:${PORT}`;
});

afterAll(() => {
  server.stop();
});

describe("Health Check", () => {
  test("GET /health returns 200", async () => {
    const res = await fetchAPI("/health");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("ok");
  });
});

describe("Tasks API", () => {
  test("POST /tasks creates a task", async () => {
    const res = await fetchAPI("/tasks", {
      method: "POST",
      body: JSON.stringify({ title: "Test task" }),
    });
    expect(res.status).toBe(201);
    const task = await res.json();
    expect(task.id).toBeDefined();
    expect(task.title).toBe("Test task");
    expect(task.status).toBe("inbox");
  });
  
  test("GET /tasks lists all tasks", async () => {
    await fetchAPI("/tasks", { method: "POST", body: JSON.stringify({ title: "Task 1" }) });
    const res = await fetchAPI("/tasks");
    expect(res.status).toBe(200);
    const tasks = await res.json();
    expect(Array.isArray(tasks)).toBe(true);
    expect(tasks.length).toBeGreaterThan(0);
  });
  
  test("GET /tasks/:id returns a task", async () => {
    const create = await fetchAPI("/tasks", { method: "POST", body: JSON.stringify({ title: "Get test" }) });
    const { id } = await create.json();
    const res = await fetchAPI(`/tasks/${id}`);
    expect(res.status).toBe(200);
    const task = await res.json();
    expect(task.id).toBe(id);
  });
  
  test("GET /tasks/:id returns 404 for non-existent", async () => {
    const res = await fetchAPI("/tasks/non-existent-id");
    expect(res.status).toBe(404);
  });
  
  test("PUT /tasks/:id updates a task", async () => {
    const create = await fetchAPI("/tasks", { method: "POST", body: JSON.stringify({ title: "Update test" }) });
    const { id } = await create.json();
    const res = await fetchAPI(`/tasks/${id}`, {
      method: "PUT",
      body: JSON.stringify({ title: "Updated title", status: "done" }),
    });
    expect(res.status).toBe(200);
    const task = await res.json();
    expect(task.title).toBe("Updated title");
    expect(task.status).toBe("done");
  });
  
  test("DELETE /tasks/:id deletes a task", async () => {
    const create = await fetchAPI("/tasks", { method: "POST", body: JSON.stringify({ title: "Delete test" }) });
    const { id } = await create.json();
    const res = await fetchAPI(`/tasks/${id}`, { method: "DELETE" });
    expect(res.status).toBe(200);
    const get = await fetchAPI(`/tasks/${id}`);
    expect(get.status).toBe(404);
  });
  
  test("GET /tasks?status= filters tasks", async () => {
    await fetchAPI("/tasks", { method: "POST", body: JSON.stringify({ title: "Task 1", status: "inbox" }) });
    await fetchAPI("/tasks", { method: "POST", body: JSON.stringify({ title: "Task 2", status: "done" }) });
    const res = await fetchAPI("/tasks?status=inbox");
    const tasks = await res.json();
    expect(tasks.every((t: any) => t.status === "inbox")).toBe(true);
  });
});

describe("Projects API", () => {
  test("POST /projects creates a project", async () => {
    const res = await fetchAPI("/projects", {
      method: "POST",
      body: JSON.stringify({ name: "Test Project" }),
    });
    expect(res.status).toBe(201);
    const project = await res.json();
    expect(project.id).toBeDefined();
    expect(project.name).toBe("Test Project");
    expect(project.status).toBe("active");
  });
  
  test("GET /projects lists all projects", async () => {
    await fetchAPI("/projects", { method: "POST", body: JSON.stringify({ name: "Project 1" }) });
    const res = await fetchAPI("/projects");
    expect(res.status).toBe(200);
    const projects = await res.json();
    expect(Array.isArray(projects)).toBe(true);
  });
  
  test("GET /projects/:id returns a project", async () => {
    const create = await fetchAPI("/projects", { method: "POST", body: JSON.stringify({ name: "Get test" }) });
    const { id } = await create.json();
    const res = await fetchAPI(`/projects/${id}`);
    expect(res.status).toBe(200);
    const project = await res.json();
    expect(project.id).toBe(id);
  });
  
  test("DELETE /projects/:id deletes a project", async () => {
    const create = await fetchAPI("/projects", { method: "POST", body: JSON.stringify({ name: "Delete test" }) });
    const { id } = await create.json();
    const res = await fetchAPI(`/projects/${id}`, { method: "DELETE" });
    expect(res.status).toBe(200);
  });
});

describe("Validation", () => {
  test("POST /tasks without title returns 400", async () => {
    const res = await fetchAPI("/tasks", {
      method: "POST",
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(400);
  });
  
  test("POST /projects without name returns 400", async () => {
    const res = await fetchAPI("/projects", {
      method: "POST",
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(400);
  });
});
