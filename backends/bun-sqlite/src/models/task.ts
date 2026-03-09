import { Database } from "./database";
import { z } from "zod";

export const TaskStatus = z.enum(["inbox", "next", "waiting", "done"]);
export type TaskStatus = z.infer<typeof TaskStatus>;

export const CreateTaskInput = z.object({
  title: z.string().min(1, "Title is required"),
  project_id: z.string().optional(),
  status: TaskStatus.optional(),
});
export type CreateTaskInput = z.infer<typeof CreateTaskInput>;

export const UpdateTaskInput = z.object({
  title: z.string().min(1).optional(),
  project_id: z.string().nullable().optional(),
  status: TaskStatus.optional(),
});
export type UpdateTaskInput = z.infer<typeof UpdateTaskInput>;

export interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  project_id: string | null;
  created_at: string;
  updated_at: string;
}

export class TaskModel {
  db: Database;
  
  constructor(db: Database) {
    this.db = db;
  }
  
  private generateId(): string {
    return crypto.randomUUID();
  }
  
  list(status?: TaskStatus): Task[] {
    if (status) {
      return this.db.query<Task>(
        "SELECT * FROM tasks WHERE status = ? ORDER BY created_at DESC",
        [status]
      );
    }
    return this.db.query<Task>(
      "SELECT * FROM tasks ORDER BY created_at DESC"
    );
  }
  
  get(id: string): Task | undefined {
    const results = this.db.query<Task>(
      "SELECT * FROM tasks WHERE id = ?",
      [id]
    );
    return results[0];
  }
  
  create(input: CreateTaskInput): Task {
    const parsed = CreateTaskInput.parse(input);
    const id = this.generateId();
    const now = new Date().toISOString();
    const status = parsed.status || "inbox";
    
    this.db.run(
      "INSERT INTO tasks (id, title, status, project_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
      [id, input.title, status, input.project_id || null, now, now]
    );
    
    return this.get(id)!;
  }
  
  update(id: string, input: UpdateTaskInput): Task | undefined {
    const existing = this.get(id);
    if (!existing) return undefined;
    
    const title = input.title ?? existing.title;
    const status = input.status ?? existing.status;
    const project_id = input.project_id !== undefined ? input.project_id : existing.project_id;
    const now = new Date().toISOString();
    
    this.db.run(
      "UPDATE tasks SET title = ?, status = ?, project_id = ?, updated_at = ? WHERE id = ?",
      [title, status, project_id, now, id]
    );
    
    return this.get(id);
  }
  
  delete(id: string): boolean {
    this.db.run("DELETE FROM tasks WHERE id = ?", [id]);
    return true;
  }
}
