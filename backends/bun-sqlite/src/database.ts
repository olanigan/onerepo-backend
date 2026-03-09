import { Database as BunDatabase } from "bun:sqlite";
import { readFileSync } from "fs";
import { join } from "path";

export class Database {
  db: BunDatabase;
  
  constructor(filename = ":memory:") {
    this.db = new BunDatabase(filename);
  }
  
  async migrate() {
    const migrationPath = join(import.meta.dir, "../migrations/001_initial.sql");
    const sql = readFileSync(migrationPath, "utf-8");
    
    const statements = sql.split(";").filter(s => s.trim());
    for (const statement of statements) {
      this.db.exec(statement);
    }
  }
  
  query<T>(sql: string, params: any[] = []): T[] {
    return this.db.query(sql).all(...params) as T[];
  }
  
  run(sql: string, params: any[] = []) {
    return this.db.query(sql).run(...params);
  }
}
