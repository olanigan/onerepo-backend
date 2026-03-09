import { Database } from "./database";
import { TaskModel } from "./models/task";
import { ProjectModel } from "./models/project";
import { benchmarkCpuBound, benchmarkIoHeavy, benchmarkMemory, benchmarkCascading, benchmarkMalicious } from "./benchmarks";

const PORT = 3001;
const db = new Database("./gtd.db");

// Run migrations
await db.migrate();

const taskModel = new TaskModel(db);
const projectModel = new ProjectModel(db);

const server = Bun.serve({
  port: PORT,
  fetch(req) {
    const url = new URL(req.url);
    const path = url.pathname;
    const method = req.method;

    // Health check
    if (path === "/health") {
      return Response.json({ status: "ok" });
    }

    // Tasks endpoints
    if (path === "/tasks" && method === "GET") {
      const status = url.searchParams.get("status");
      return Response.json(taskModel.list((status as any) || undefined));
    }

    if (path === "/tasks" && method === "POST") {
      return req.json().then((body) => {
        try {
          const task = taskModel.create(body);
          return Response.json(task, { status: 201 });
        } catch (e: any) {
          return Response.json(
            { error: "Validation Error", message: e.message },
            { status: 400 }
          );
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
      return req.json().then((body) => {
        try {
          const task = taskModel.update(id, body);
          if (!task) return Response.json({ error: "Not Found" }, { status: 404 });
          return Response.json(task);
        } catch (e: any) {
          return Response.json(
            { error: "Validation Error", message: e.message },
            { status: 400 }
          );
        }
      });
    }

    if (path.match(/^\/tasks\/[\w-]+$/) && method === "DELETE") {
      const id = path.split("/")[2];
      taskModel.delete(id);
      return Response.json({ success: true });
    }

    // Projects endpoints
    if (path === "/projects" && method === "GET") {
      return Response.json(projectModel.list());
    }

    if (path === "/projects" && method === "POST") {
      return req.json().then((body) => {
        try {
          const project = projectModel.create(body);
          return Response.json(project, { status: 201 });
        } catch (e: any) {
          return Response.json(
            { error: "Validation Error", message: e.message },
            { status: 400 }
          );
        }
      });
    }

    if (path.match(/^\/projects\/[\w-]+$/) && method === "GET") {
      const id = path.split("/")[2];
      const project = projectModel.get(id);
      if (!project)
        return Response.json({ error: "Not Found" }, { status: 404 });
      return Response.json(project);
    }

    if (path.match(/^\/projects\/[\w-]+$/) && method === "DELETE") {
      const id = path.split("/")[2];
      projectModel.delete(id);
      return Response.json({ success: true });
    }

    // Benchmark endpoints
    if (path === "/benchmark/cpu-bound" && method === "POST") {
      return req.json().then((body) => {
        const result = benchmarkCpuBound(body.iterations || 100000);
        return Response.json(result);
      });
    }

    if (path === "/benchmark/io-heavy" && method === "POST") {
      return req.json().then((body) => {
        const result = benchmarkIoHeavy(taskModel, body.delay || 50);
        return Response.json(result);
      });
    }

    if (path === "/benchmark/memory" && method === "POST") {
      return req.json().then((body) => {
        const result = benchmarkMemory(body.allocationMB || 50);
        return Response.json(result);
      });
    }

    if (path === "/benchmark/cascading" && method === "POST") {
      return req.json().then((body) => {
        const result = benchmarkCascading(taskModel, body.depth || 3);
        return Response.json(result);
      });
    }

    if (path === "/benchmark/malicious" && method === "POST") {
      return req.json().then((body) => {
        const result = benchmarkMalicious(body.payloadSizeMB || 10);
        return Response.json(result);
      });
    }

    return Response.json({ error: "Not Found" }, { status: 404 });
  },
});

console.log(`🚀 Bun-SQLite backend running on http://localhost:${PORT}`);
