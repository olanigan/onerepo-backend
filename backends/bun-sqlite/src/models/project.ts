import { Database } from "../database";
import { z } from "zod";

export const ProjectStatus = z.enum(["active", "someday", "archive"]);
export type ProjectStatus = z.infer<typeof ProjectStatus>;

export const CreateProjectInput = z.object({
  name: z.string().min(1, "Name is required"),
  status: ProjectStatus.optional(),
});
export type CreateProjectInput = z.infer<typeof CreateProjectInput>;

export interface Project {
  id: string;
  name: string;
  status: ProjectStatus;
  created_at: string;
  updated_at: string;
}

export class ProjectModel {
  db: Database;
  
  constructor(db: Database) {
    this.db = db;
  }
  
  private generateId(): string {
    return crypto.randomUUID();
  }
  
  list(): Project[] {
    return this.db.query<Project>(
      "SELECT * FROM projects ORDER BY created_at DESC"
    );
  }
  
  get(id: string): Project | undefined {
    const results = this.db.query<Project>(
      "SELECT * FROM projects WHERE id = ?",
      [id]
    );
    return results[0];
  }
  
  create(input: CreateProjectInput): Project {
    const parsed = CreateProjectInput.parse(input);
    const id = this.generateId();
    const now = new Date().toISOString();
    const status = parsed.status || "active";
    
    this.db.run(
      "INSERT INTO projects (id, name, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
      [id, input.name, status, now, now]
    );
    
    return this.get(id)!;
  }
  
  update(id: string, input: Partial<CreateProjectInput>): Project | undefined {
    const existing = this.get(id);
    if (!existing) return undefined;
    
    const name = input.name ?? existing.name;
    const status = input.status ?? existing.status;
    const now = new Date().toISOString();
    
    this.db.run(
      "UPDATE projects SET name = ?, status = ?, updated_at = ? WHERE id = ?",
      [name, status, now, id]
    );
    
    return this.get(id);
  }
  
  delete(id: string): boolean {
    this.db.run("DELETE FROM projects WHERE id = ?", [id]);
    return true;
  }
}
